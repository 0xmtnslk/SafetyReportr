import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, CheckSquare, Calendar, MapPin } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function CreateInspection() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [inspectionDate, setInspectionDate] = useState("");
  const [notes, setNotes] = useState("");

  // Fetch templates
  const { data: templates = [], isLoading: templatesLoading } = useQuery<any[]>({
    queryKey: ["/api/checklist/templates"],
  });

  // Fetch locations (hospitals)
  const { data: locations = [], isLoading: locationsLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/hospitals"],
  });

  // Create inspection mutation
  const createInspection = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/checklist/inspections`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Denetim oluşturulamadı");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/checklist/inspections"] });
      toast({
        title: "Denetim Oluşturuldu",
        description: "Yeni denetim başarıyla oluşturuldu. Şimdi soruları cevaplayabilirsiniz.",
      });
      setLocation(`/checklist/inspections/${data.id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Denetim oluşturulurken bir hata oluştu.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!selectedTemplate || !selectedLocation || !inspectionDate) {
      toast({
        title: "Eksik Bilgi",
        description: "Lütfen tüm zorunlu alanları doldurun.",
        variant: "destructive",
      });
      return;
    }

    createInspection.mutate({
      templateId: selectedTemplate,
      locationId: selectedLocation,
      inspectionDate: new Date(inspectionDate).toISOString(),
      notes: notes || null,
    });
  };

  if (templatesLoading || locationsLoading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation('/checklist')}
          className="flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          Geri Dön
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Yeni Denetim Oluştur
          </h1>
          <p className="text-gray-600">
            İSG teknik kontrol listesi denetimi başlatın
          </p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckSquare size={20} />
            Denetim Bilgileri
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Template Selection */}
          <div className="space-y-2">
            <Label htmlFor="template">Kontrol Listesi Şablonu *</Label>
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger>
                <SelectValue placeholder="Kullanılacak kontrol listesi şablonunu seçin" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template: any) => (
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

          {/* Location Selection */}
          <div className="space-y-2">
            <Label htmlFor="location">Hastane/Lokasyon *</Label>
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger>
                <SelectValue placeholder="Denetimin yapılacağı hastaneyi seçin" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((location: any) => (
                  <SelectItem key={location.id} value={location.id}>
                    <div className="flex items-center gap-2">
                      <MapPin size={16} />
                      <div>
                        <div className="font-medium">{location.name}</div>
                        <div className="text-sm text-gray-500">{location.city}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Inspection Date */}
          <div className="space-y-2">
            <Label htmlFor="date">Denetim Tarihi *</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="date"
                type="date"
                value={inspectionDate}
                onChange={(e) => setInspectionDate(e.target.value)}
                className="pl-10"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notlar (İsteğe bağlı)</Label>
            <Textarea
              id="notes"
              placeholder="Denetim hakkında özel notlar ekleyebilirsiniz..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Selected Template Info */}
      {selectedTemplate && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Seçilen Şablon Özeti</CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const template = templates.find((t: any) => t.id === selectedTemplate);
              if (!template) return null;
              
              return (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <CheckSquare className="text-blue-600" size={24} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{template.name}</h3>
                      <p className="text-gray-600">{template.description}</p>
                      <p className="text-sm text-gray-500">Versiyon: {template.version}</p>
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
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 mt-8">
        <Button
          variant="outline"
          onClick={() => setLocation('/checklist')}
        >
          İptal
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!selectedTemplate || !selectedLocation || !inspectionDate || createInspection.isPending}
          className="min-w-[120px]"
        >
          {createInspection.isPending ? "Oluşturuluyor..." : "Denetimi Başlat"}
        </Button>
      </div>
    </div>
  );
}