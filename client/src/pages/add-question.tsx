import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Plus } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface AddQuestionProps {
  sectionId: string;
}

export default function AddQuestion({ sectionId }: AddQuestionProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    questionText: "",
    isRequired: true,
    allowPhoto: true,
    allowDocument: true
  });

  const handleAdd = () => {
    if (!formData.questionText.trim()) {
      toast({
        title: "Hata",
        description: "Soru metni gereklidir.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Soru Eklendi",
      description: "Yeni soru başarıyla eklendi.",
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
            <h1 className="text-3xl font-bold text-gray-900">Yeni Soru Ekle</h1>
            <p className="text-gray-600 mt-1">Kontrol listesine yeni soru ekleyin</p>
          </div>
        </div>
        
        <Button onClick={handleAdd} className="bg-primary hover:bg-primary/90">
          <Plus size={16} className="mr-2" />
          Soru Ekle
        </Button>
      </div>

      {/* Add Form */}
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
              placeholder="Örnek: Alan girişinde uygun nitelikli sağlık ve güvenlik işaretleri bulunmalıdır."
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

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Bilgi</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Her soru için TW skoru (1-10) değerlendirme sırasında girilecek</li>
              <li>• Kategori seçimi değerlendirme sırasında yapılacak</li>
              <li>• "Karşılamıyor" seçilirse fotoğraf/doküman zorunlu olacak</li>
            </ul>
          </div>

          <div className="flex justify-end space-x-4">
            <Button variant="outline" onClick={() => setLocation('/checklist')}>
              İptal
            </Button>
            <Button onClick={handleAdd}>
              Soru Ekle
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}