import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface TemplateEditProps {
  templateId: string;
}

export default function TemplateEdit({ templateId }: TemplateEditProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "İSG Teknik Alanlar Denetim Kontrol Listesi",
    description: "Hastane teknik altyapı sistemlerinin güvenlik ve uygunluk denetimi için kapsamlı kontrol listesi",
    version: "1.0",
    isActive: true
  });

  const handleSave = () => {
    toast({
      title: "Şablon Güncellendi",
      description: "Şablon başarıyla güncellendi.",
    });
    setLocation(`/checklist/templates/${templateId}`);
  };

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => setLocation(`/checklist/templates/${templateId}`)}
          >
            <ArrowLeft size={16} className="mr-2" />
            Geri
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Şablon Düzenle</h1>
            <p className="text-gray-600 mt-1">Kontrol listesi şablonunu düzenleyin</p>
          </div>
        </div>
        
        <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">
          <Save size={16} className="mr-2" />
          Değişiklikleri Kaydet
        </Button>
      </div>

      {/* Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle>Şablon Bilgileri</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="name">Şablon Adı *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Şablon adını girin"
            />
          </div>
          
          <div>
            <Label htmlFor="description">Açıklama</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Şablon açıklamasını girin"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="version">Versiyon</Label>
              <Input
                id="version"
                value={formData.version}
                onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
                placeholder="Versiyon numarası"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
              />
              <Label htmlFor="isActive">Aktif</Label>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <Button variant="outline" onClick={() => setLocation(`/checklist/templates/${templateId}`)}>
              İptal
            </Button>
            <Button onClick={handleSave}>
              Kaydet
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}