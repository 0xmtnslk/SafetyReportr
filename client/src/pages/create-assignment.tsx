import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckSquare, Calendar, MapPin, Users, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

export default function CreateAssignment() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [selectedHospitals, setSelectedHospitals] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("medium");

  // Fetch templates
  const { data: templates = [], isLoading: templatesLoading } = useQuery<any[]>({
    queryKey: ["/api/checklist/templates"],
  });

  // Fetch hospitals
  const { data: hospitals = [], isLoading: hospitalsLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/hospitals"],
  });

  // Fetch users for specific assignment (optional)
  const { data: users = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/users"],
  });

  // Create assignment mutation
  const createAssignment = useMutation({
    mutationFn: async (assignmentData: any) => {
      const response = await fetch(`/api/checklist/assignments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(assignmentData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Assignment oluşturulamadı");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/checklist/assignments"] });
      toast({
        title: "Görev Atandı",
        description: `${selectedHospitals.length} hastaneye kontrol listesi görevi başarıyla atandı.`,
      });
      setLocation('/admin');
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Görev atama sırasında bir hata oluştu.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async () => {
    if (!selectedTemplate || selectedHospitals.length === 0 || !title || !dueDate) {
      toast({
        title: "Eksik Bilgi",
        description: "Lütfen tüm zorunlu alanları doldurun.",
        variant: "destructive",
      });
      return;
    }

    // Create assignments for each selected hospital
    try {
      const assignmentPromises = selectedHospitals.map((hospitalId) => 
        createAssignment.mutateAsync({
          templateId: selectedTemplate,
          assignedToHospital: hospitalId,
          assignedToUser: selectedUser || undefined,
          title,
          description: description || undefined,
          dueDate: new Date(dueDate).toISOString(),
          priority,
        })
      );
      
      await Promise.all(assignmentPromises);
    } catch (error) {
      console.error("Error creating assignments:", error);
    }
  };

  const toggleHospital = (hospitalId: string) => {
    setSelectedHospitals(prev => 
      prev.includes(hospitalId) 
        ? prev.filter(id => id !== hospitalId)
        : [...prev, hospitalId]
    );
  };

  const selectAllHospitals = () => {
    setSelectedHospitals(hospitals.map(h => h.id));
  };

  const clearAllHospitals = () => {
    setSelectedHospitals([]);
  };

  if (templatesLoading || hospitalsLoading) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const selectedTemplate_obj = templates.find(t => t.id === selectedTemplate);

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation('/admin')}
          className="flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          Admin Paneline Dön
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Kontrol Listesi Görevi Ata
          </h1>
          <p className="text-gray-600">
            Hastanelere İSG kontrol listesi denetim görevi atayın
          </p>
        </div>
      </div>

      {/* Assignment Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Assignment Details */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckSquare size={20} />
                Görev Detayları
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Template Selection */}
              <div className="space-y-2">
                <Label>Kontrol Listesi Şablonu *</Label>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger>
                    <SelectValue placeholder="Kullanılacak kontrol listesi şablonunu seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        <div className="flex items-center gap-2">
                          <CheckSquare size={16} />
                          <div>
                            <div className="font-medium">{template.name}</div>
                            <div className="text-sm text-gray-500">v{template.version}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label>Görev Başlığı *</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Örn: Şubat 2025 İSG Teknik Denetimi"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label>Açıklama (İsteğe bağlı)</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Görev hakkında ek açıklamalar..."
                  rows={3}
                />
              </div>

              {/* Due Date */}
              <div className="space-y-2">
                <Label>Son Tarih *</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    type="datetime-local"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="pl-10"
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <Label>Öncelik</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">
                      <Badge variant="secondary" className="bg-green-100 text-green-800">Düşük</Badge>
                    </SelectItem>
                    <SelectItem value="medium">
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">Orta</Badge>
                    </SelectItem>
                    <SelectItem value="high">
                      <Badge variant="secondary" className="bg-orange-100 text-orange-800">Yüksek</Badge>
                    </SelectItem>
                    <SelectItem value="urgent">
                      <Badge variant="secondary" className="bg-red-100 text-red-800">Acil</Badge>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Specific User (Optional) */}
              <div className="space-y-2">
                <Label>Belirli Kullanıcı (İsteğe bağlı)</Label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger>
                    <SelectValue placeholder="Belirli bir kullanıcıya atamak isterseniz seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tüm hastane uzmanları</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.fullName} ({user.username})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Hospital Selection */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin size={20} />
                Hastane Seçimi *
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectAllHospitals}
                  className="text-sm"
                >
                  Tümünü Seç
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllHospitals}
                  className="text-sm"
                >
                  Temizle
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {hospitals.map((hospital) => (
                  <div
                    key={hospital.id}
                    className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50"
                  >
                    <Checkbox
                      checked={selectedHospitals.includes(hospital.id)}
                      onCheckedChange={() => toggleHospital(hospital.id)}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{hospital.name}</div>
                      <div className="text-sm text-gray-500">{hospital.city}</div>
                    </div>
                  </div>
                ))}
              </div>
              
              {selectedHospitals.length > 0 && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-800 text-sm font-medium">
                    <Users size={16} />
                    {selectedHospitals.length} hastane seçildi
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Template Preview */}
          {selectedTemplate_obj && (
            <Card>
              <CardHeader>
                <CardTitle>Seçilen Şablon Özeti</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <CheckSquare className="text-blue-600" size={24} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{selectedTemplate_obj.name}</h3>
                      <p className="text-gray-600">{selectedTemplate_obj.description}</p>
                      <p className="text-sm text-gray-500">Versiyon: {selectedTemplate_obj.version}</p>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Bu denetimde değerlendirilecek alanlar:</h4>
                    <ul className="space-y-1 text-sm text-gray-700">
                      <li>• ADP (Yangın Algılama) Sistemleri - 4 soru</li>
                      <li>• UPS (Kesintisiz Güç) Sistemleri - 4 soru</li>
                      <li>• Jeneratör Sistemleri - 4 soru</li>
                    </ul>
                    <div className="mt-3 text-sm">
                      <strong>Toplam:</strong> 12 soru
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 mt-8">
        <Button
          variant="outline"
          onClick={() => setLocation('/admin')}
        >
          İptal
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!selectedTemplate || selectedHospitals.length === 0 || !title || !dueDate || createAssignment.isPending}
          className="min-w-[160px]"
        >
          {createAssignment.isPending 
            ? "Atanıyor..." 
            : `${selectedHospitals.length} Hastaneye Ata`}
        </Button>
      </div>

      {/* Summary Alert */}
      {selectedTemplate && selectedHospitals.length > 0 && title && dueDate && (
        <Card className="mt-6 border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-green-600 mt-1" size={20} />
              <div>
                <h4 className="font-medium text-green-800">Görev Atama Özeti</h4>
                <p className="text-green-700 text-sm mt-1">
                  "{title}" başlıklı görev {selectedHospitals.length} hastaneye atanacak. 
                  Son tarih: {new Date(dueDate).toLocaleDateString('tr-TR')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}