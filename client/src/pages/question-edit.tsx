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

interface QuestionEditProps {
  questionId: string;
}

export default function QuestionEdit({ questionId }: QuestionEditProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    questionText: "ADP alanına tüm yetkisiz girişler engellenmiş olmalı, alan kilit altında tutulmalıdır.",
    isRequired: true,
    allowPhoto: true,
    allowDocument: true
  });

  const handleSave = () => {
    toast({
      title: "Soru Güncellendi",
      description: "Soru başarıyla güncellendi.",
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
            <h1 className="text-3xl font-bold text-gray-900">Soru Düzenle</h1>
            <p className="text-gray-600 mt-1">Kontrol listesi sorusunu düzenleyin</p>
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
          <CardTitle>Soru Bilgileri</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="questionText">Soru Metni *</Label>
            <Textarea
              id="questionText"
              value={formData.questionText}
              onChange={(e) => setFormData(prev => ({ ...prev, questionText: e.target.value }))}
              placeholder="Soru metnini girin"
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center space-x-2">
              <Switch
                id="isRequired"
                checked={formData.isRequired}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isRequired: checked }))}
              />
              <Label htmlFor="isRequired">Zorunlu Soru</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="allowPhoto"
                checked={formData.allowPhoto}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, allowPhoto: checked }))}
              />
              <Label htmlFor="allowPhoto">Fotoğraf İzni</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="allowDocument"
                checked={formData.allowDocument}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, allowDocument: checked }))}
              />
              <Label htmlFor="allowDocument">Doküman İzni</Label>
            </div>
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