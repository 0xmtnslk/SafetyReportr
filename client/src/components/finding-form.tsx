import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Save, Check, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import ImageUpload from "./image-upload";

interface FindingFormProps {
  reportId: string;
  section: number;
  initialData?: any;
  onClose: () => void;
  onSave: () => void;
}

export default function FindingForm({ reportId, section, initialData, onClose, onSave }: FindingFormProps) {
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    dangerLevel: initialData?.dangerLevel || "",
    currentSituation: initialData?.currentSituation || "",
    legalBasis: initialData?.legalBasis || "",
    recommendation: initialData?.recommendation || "",
    images: initialData?.images || [],
    processSteps: initialData?.processSteps || [],
  });

  const [newProcessStep, setNewProcessStep] = useState({ date: "", description: "" });
  const { toast } = useToast();

  const createFindingMutation = useMutation({
    mutationFn: async (data: any) => {
      if (initialData?.id) {
        const response = await apiRequest("PUT", `/api/findings/${initialData.id}`, data);
        return response.json();
      } else {
        const response = await apiRequest("POST", `/api/reports/${reportId}/findings`, data);
        return response.json();
      }
    },
    onSuccess: async (result) => {
      try {
        // If danger level is set to 'low', automatically move to completed section
        if (formData.dangerLevel === 'low' && (section === 2 || section === 3) && !initialData?.id) {
          console.log('🟢 Düşük risk bulgusu tamamlanmış bölümüne kopyalanıyor...');
          
          // Create a copy in section 4 (completed findings)
          await apiRequest("POST", `/api/reports/${reportId}/findings`, {
            reportId,
            section: 4,
            ...formData,
            isCompleted: true,
          });
          
          console.log('✅ Düşük risk bulgusu başarıyla kopyalandı');
          
          toast({
            title: "Başarılı",
            description: "Bulgu kaydedildi ve tamamlanmış bulgulara eklendi",
          });
        } else {
          toast({
            title: "Başarılı",
            description: initialData?.id ? "Bulgu başarıyla güncellendi" : "Bulgu başarıyla kaydedildi",
          });
        }
        
        onSave();
      } catch (error: any) {
        console.error('❌ Otomatik kopyalama hatası:', error);
        
        toast({
          title: "Kısmi Başarı",
          description: "Bulgu kaydedildi ama tamamlanmış bölümüne kopyalanamadı",
          variant: "destructive",
        });
        
        onSave(); // Yine de sayfa kapansın
      }
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Bulgu kaydedilirken bir hata oluştu",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      reportId,
      section: formData.dangerLevel === 'low' && (section === 2 || section === 3) ? 4 : section,
      ...formData,
      isCompleted: formData.dangerLevel === 'low' && (section === 2 || section === 3),
    };
    createFindingMutation.mutate(submitData);
  };

  const handleDangerLevelSelect = (level: string) => {
    setFormData({ ...formData, dangerLevel: level });
  };

  const handleImageUploaded = (imagePath: string) => {
    setFormData({
      ...formData,
      images: [...formData.images, imagePath],
    });
  };

  const handleRemoveImage = (index: number) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_: string, i: number) => i !== index),
    });
  };

  const handleAddProcessStep = () => {
    if (newProcessStep.date && newProcessStep.description) {
      setFormData({
        ...formData,
        processSteps: [...formData.processSteps, newProcessStep],
      });
      setNewProcessStep({ date: "", description: "" });
    }
  };

  const dangerLevels = [
    {
      value: "high",
      label: "Yüksek",
      color: "danger-high text-white",
      icon: "fas fa-exclamation-triangle",
    },
    {
      value: "medium",
      label: "Orta",
      color: "danger-medium text-white",
      icon: "fas fa-exclamation-circle",
    },
    {
      value: "low",
      label: "Düşük",
      color: "danger-low text-white",
      icon: "fas fa-info-circle",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold text-gray-900">
              Yeni Bulgu Ekle - Bölüm {section}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose} data-testid="button-close-finding">
              <X size={20} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Bulgu Başlığı</Label>
                  <Input
                    id="title"
                    type="text"
                    placeholder="Elektrik İş Tesisatı Yönetmeliliği..."
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    data-testid="input-finding-title"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tehlike Skalası</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {dangerLevels.map((level) => (
                      <button
                        key={level.value}
                        type="button"
                        className={`p-3 rounded-xl text-center transition-all ${level.color} ${
                          formData.dangerLevel === level.value
                            ? "ring-2 ring-white ring-offset-2"
                            : "opacity-80 hover:opacity-100"
                        }`}
                        onClick={() => handleDangerLevelSelect(level.value)}
                        data-testid={`danger-level-${level.value}`}
                      >
                        <div className="mb-1">⚠️</div>
                        <p className="text-sm font-medium">{level.label}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currentSituation">Mevcut Durum</Label>
                  <Textarea
                    id="currentSituation"
                    rows={4}
                    placeholder="Mevcut durumun detaylı açıklaması..."
                    value={formData.currentSituation}
                    onChange={(e) =>
                      setFormData({ ...formData, currentSituation: e.target.value })
                    }
                    required
                    data-testid="textarea-current-situation"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="legalBasis">Dayanağı</Label>
                  <Textarea
                    id="legalBasis"
                    rows={3}
                    placeholder="İlgili yönetmelik ve standartlar..."
                    value={formData.legalBasis}
                    onChange={(e) => setFormData({ ...formData, legalBasis: e.target.value })}
                    data-testid="textarea-legal-basis"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recommendation">İSG Görüşü</Label>
                  <Textarea
                    id="recommendation"
                    rows={3}
                    placeholder="Alınması gereken önlemler..."
                    value={formData.recommendation}
                    onChange={(e) => setFormData({ ...formData, recommendation: e.target.value })}
                    data-testid="textarea-recommendation"
                  />
                </div>
              </div>

              {/* Image Upload Area */}
              <div className="space-y-4">
                <Label>Fotoğraflar</Label>
                <ImageUpload
                  onImageUploaded={handleImageUploaded}
                  images={formData.images}
                  onRemoveImage={handleRemoveImage}
                />
              </div>
            </div>

            {/* Process Management Section */}
            <div className="border-t border-gray-200 pt-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Süreç Yönetimi</h4>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <Label htmlFor="processDate">Tarih</Label>
                    <Input
                      id="processDate"
                      type="date"
                      value={newProcessStep.date}
                      onChange={(e) =>
                        setNewProcessStep({ ...newProcessStep, date: e.target.value })
                      }
                      data-testid="input-process-date"
                    />
                  </div>
                  <div className="flex-3">
                    <Label htmlFor="processDescription">Açıklama</Label>
                    <Input
                      id="processDescription"
                      type="text"
                      placeholder="Mevcut durum devam ediyor."
                      value={newProcessStep.description}
                      onChange={(e) =>
                        setNewProcessStep({ ...newProcessStep, description: e.target.value })
                      }
                      data-testid="input-process-description"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-6"
                    onClick={handleAddProcessStep}
                    data-testid="button-add-process-step"
                  >
                    <Plus className="text-success" size={20} />
                  </Button>
                </div>

                {formData.processSteps.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="font-medium text-gray-700">Eklenen Süreçler:</h5>
                    {formData.processSteps.map((step: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <span className="font-medium">
                            {new Date(step.date).toLocaleDateString("tr-TR")}
                          </span>
                          : {step.description}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-between pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                data-testid="button-cancel-finding"
              >
                <X className="mr-2" size={16} />
                İptal
              </Button>
              <div className="space-x-3">
                <Button
                  type="button"
                  variant="secondary"
                  data-testid="button-save-draft"
                >
                  <Save className="mr-2" size={16} />
                  Taslak Kaydet
                </Button>
                <Button
                  type="submit"
                  disabled={createFindingMutation.isPending}
                  data-testid="button-save-continue"
                >
                  {createFindingMutation.isPending ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  ) : (
                    <Check className="mr-2" size={16} />
                  )}
                  Kaydet ve Devam Et
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
