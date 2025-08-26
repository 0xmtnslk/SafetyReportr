import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface SectionEditProps {
  sectionId: string;
}

export default function SectionEdit({ sectionId }: SectionEditProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "ADP Kontrol Listesi",
    description: "Yangın algılama ve uyarı sistemlerinin kontrolü"
  });

  const handleSave = () => {
    toast({
      title: "Bölüm Güncellendi",
      description: "Bölüm bilgileri başarıyla güncellendi.",
    });
    setLocation('/checklist');
  };

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => setLocation('/checklist')}
          >
            <ArrowLeft size={16} className="mr-2" />
            Geri
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Bölüm Düzenle</h1>
            <p className="text-gray-600 mt-1">Kontrol listesi bölümünü düzenleyin</p>
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
          <CardTitle>Bölüm Bilgileri</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="name">Bölüm Adı *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Bölüm adını girin"
            />
          </div>
          
          <div>
            <Label htmlFor="description">Açıklama</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Bölüm açıklamasını girin"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-4">
            <Button variant="outline" onClick={() => setLocation('/checklist')}>
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