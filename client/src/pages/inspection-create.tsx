import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CalendarIcon, ArrowLeftIcon, CheckCircleIcon, BuildingIcon, UsersIcon, ClockIcon } from "lucide-react";
import type { ChecklistTemplate, Location, User } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface SelectedHospital {
  hospital: Location;
  specialists: User[];
}

export default function InspectionCreatePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Form states
  const [selectedTemplate, setSelectedTemplate] = useState<ChecklistTemplate | null>(null);
  const [selectedHospitals, setSelectedHospitals] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Data queries
  const { data: templates = [], isLoading: templatesLoading } = useQuery<ChecklistTemplate[]>({
    queryKey: ["/api/checklist/templates"],
  });

  const { data: hospitals = [], isLoading: hospitalsLoading } = useQuery<Location[]>({
    queryKey: ["/api/admin/hospitals"],
  });

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  // Auto-select all hospitals on load
  useEffect(() => {
    if (hospitals.length > 0 && selectedHospitals.length === 0) {
      setSelectedHospitals(hospitals.map(h => h.id));
    }
  }, [hospitals]);

  // Get selected hospital details with assigned specialists
  const selectedHospitalDetails: SelectedHospital[] = selectedHospitals
    .map(hospitalId => {
      const hospital = hospitals.find(h => h.id === hospitalId);
      if (!hospital) return null;
      
      const specialists = users.filter(user => 
        user.locationId === hospitalId && 
        user.role === 'safety_specialist'
      );
      
      return { hospital, specialists };
    })
    .filter(Boolean) as SelectedHospital[];

  // Get template sections and questions count
  const { data: templateSections = [] } = useQuery<any[]>({
    queryKey: ["/api/checklist/templates", selectedTemplate?.id, "sections"],
    enabled: !!selectedTemplate?.id,
  });

  const totalQuestions = templateSections.reduce((total: number, section: any) => {
    return total + (section.questions?.length || 0);
  }, 0);

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    setSelectedTemplate(template || null);
    if (template) {
      setTitle(`${template.name} Denetimi`);
    }
  };

  const handleHospitalToggle = (hospitalId: string, checked: boolean) => {
    if (checked) {
      setSelectedHospitals(prev => [...prev, hospitalId]);
    } else {
      setSelectedHospitals(prev => prev.filter(id => id !== hospitalId));
    }
  };

  const handleSelectAllHospitals = () => {
    setSelectedHospitals(hospitals.map(h => h.id));
  };

  const handleDeselectAllHospitals = () => {
    setSelectedHospitals([]);
  };

  const handleCreateInspection = async () => {
    if (!selectedTemplate || selectedHospitals.length === 0 || !title || !dueDate || !dueTime) {
      toast({
        title: "Eksik Bilgiler",
        description: "Lütfen tüm gerekli alanları doldurun.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const dueDateTime = new Date(`${dueDate} ${dueTime}`);
      
      const inspectionData = {
        templateId: selectedTemplate.id,
        title,
        description: description || `${selectedTemplate.name} için otomatik denetim`,
        startDate: new Date(),
        dueDate: dueDateTime,
        assignmentType: 'hospital_based',
        targetLocationIds: selectedHospitals,
        totalAssignments: selectedHospitalDetails.reduce((total, hd) => total + hd.specialists.length, 0),
      };

      await apiRequest("/api/inspections", "POST", inspectionData);

      toast({
        title: "Denetim Başarıyla Oluşturuldu",
        description: `${selectedHospitalDetails.length} hastaneye toplam ${inspectionData.totalAssignments} atama yapıldı.`,
      });

      setLocation("/admin/inspections");
    } catch (error) {
      console.error("Error creating inspection:", error);
      toast({
        title: "Hata",
        description: "Denetim oluşturulurken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const isFormValid = selectedTemplate && selectedHospitals.length > 0 && title && dueDate && dueTime;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/inspections">
          <Button variant="outline" size="icon" data-testid="button-back">
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Yeni Denetim Başlat</h1>
          <p className="text-gray-600" data-testid="text-page-description">
            Checklist seçin, hastaneleri belirleyin ve denetim atamalarını oluşturun
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Checklist Template Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircleIcon className="h-5 w-5" />
                1. Checklist Şablonu Seçin
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select onValueChange={handleTemplateSelect} data-testid="select-template">
                <SelectTrigger>
                  <SelectValue placeholder="Denetim yapılacak checklist'i seçin..." />
                </SelectTrigger>
                <SelectContent>
                  {templatesLoading ? (
                    <SelectItem value="loading" disabled>Yükleniyor...</SelectItem>
                  ) : (
                    templates.map((template) => (
                      <SelectItem key={template.id} value={template.id} data-testid={`option-template-${template.id}`}>
                        {template.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {selectedTemplate && (
                <div className="mt-2 p-2 bg-blue-50 rounded text-sm" data-testid="text-selected-template">
                  <strong>Seçilen:</strong> {selectedTemplate.name}
                  {selectedTemplate.description && (
                    <p className="text-gray-600 mt-1">{selectedTemplate.description}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 2. Hospital Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BuildingIcon className="h-5 w-5" />
                2. Hastane Seçimi
              </CardTitle>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSelectAllHospitals}
                  data-testid="button-select-all-hospitals"
                >
                  Tümünü Seç
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleDeselectAllHospitals}
                  data-testid="button-deselect-all-hospitals"
                >
                  Tümünü Kaldır
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {hospitalsLoading ? (
                <div className="text-center py-4">Hastaneler yükleniyor...</div>
              ) : (
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {hospitals.map((hospital) => {
                    const specialists = users.filter(user => 
                      user.locationId === hospital.id && 
                      user.role === 'safety_specialist'
                    );
                    const isSelected = selectedHospitals.includes(hospital.id);

                    return (
                      <div 
                        key={hospital.id} 
                        className={`flex items-start space-x-3 p-3 border rounded ${
                          isSelected ? 'bg-blue-50 border-blue-200' : 'bg-white'
                        }`}
                        data-testid={`hospital-item-${hospital.id}`}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => handleHospitalToggle(hospital.id, !!checked)}
                          data-testid={`checkbox-hospital-${hospital.id}`}
                        />
                        <div className="flex-1">
                          <div className="font-medium">{hospital.name}</div>
                          <div className="text-sm text-gray-600">{hospital.address}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <UsersIcon className="h-3 w-3" />
                            <span className="text-xs text-gray-500">
                              {specialists.length === 0 ? (
                                <span className="text-red-500">İş Güvenliği Uzmanı Atanmamış</span>
                              ) : (
                                `${specialists.length} İş Güvenliği Uzmanı: ${specialists.map(s => s.fullName).join(', ')}`
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 3. Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClockIcon className="h-5 w-5" />
                3. Denetim Detayları
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Denetim Başlığı</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Örn: Acil Servis Güvenlik Denetimi"
                  data-testid="input-inspection-title"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Açıklama (İsteğe bağlı)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Denetim hakkında ek bilgiler..."
                  rows={3}
                  data-testid="textarea-inspection-description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dueDate">Bitiş Tarihi</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    data-testid="input-due-date"
                  />
                </div>
                <div>
                  <Label htmlFor="dueTime">Bitiş Saati</Label>
                  <Input
                    id="dueTime"
                    type="time"
                    value={dueTime}
                    onChange={(e) => setDueTime(e.target.value)}
                    data-testid="input-due-time"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Denetim Özeti</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedTemplate ? (
                <div data-testid="inspection-summary">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Checklist:</span>
                      <span className="font-medium">{selectedTemplate.name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Soru Sayısı:</span>
                      <span className="font-medium">{totalQuestions || "Hesaplanıyor..."}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Seçili Hastane:</span>
                      <span className="font-medium">{selectedHospitals.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Toplam Atama:</span>
                      <span className="font-medium">
                        {selectedHospitalDetails.reduce((total, hd) => total + hd.specialists.length, 0)}
                      </span>
                    </div>
                    {dueDate && dueTime && (
                      <div className="flex justify-between text-sm">
                        <span>Son Tarih:</span>
                        <span className="font-medium">
                          {new Date(`${dueDate} ${dueTime}`).toLocaleDateString('tr-TR')} {dueTime}
                        </span>
                      </div>
                    )}
                  </div>

                  <Separator className="my-4" />

                  {selectedHospitalDetails.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Atama Detayları:</h4>
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {selectedHospitalDetails.map(({ hospital, specialists }) => (
                          <div key={hospital.id} className="text-xs p-2 bg-gray-50 rounded">
                            <div className="font-medium">{hospital.name}</div>
                            <div className="text-gray-600">
                              {specialists.length === 0 ? (
                                <span className="text-red-500">Uzman yok</span>
                              ) : (
                                specialists.map(s => s.fullName).join(', ')
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  Checklist seçin
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Button */}
          <Button
            onClick={handleCreateInspection}
            disabled={!isFormValid || isCreating}
            className="w-full"
            size="lg"
            data-testid="button-create-inspection"
          >
            {isCreating ? "Oluşturuluyor..." : "Denetimi Başlat"}
          </Button>
        </div>
      </div>
    </div>
  );
}