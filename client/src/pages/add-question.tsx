import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { CHECKLIST_CATEGORIES } from "@shared/schema";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";

interface AddQuestionProps {
  sectionId: string;
  templateId?: string;
}

export default function AddQuestion({ sectionId, templateId }: AddQuestionProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    questionText: "",
    category: "Genel",
    twScore: 1,
    isRequired: true,
    allowPhoto: true,
    allowDocument: true
  });

  // Fetch existing questions to get next order index
  const { data: existingQuestions = [] } = useQuery({
    queryKey: ['/api/checklist/sections', sectionId, 'questions'],
    enabled: !!sectionId
  });

  // Create question mutation
  const createQuestion = useMutation({
    mutationFn: async (data: any) => {
      // Calculate next order index
      const maxOrder = existingQuestions.length > 0 
        ? Math.max(...existingQuestions.map((q: any) => q.orderIndex || 0))
        : 0;
      const nextOrderIndex = maxOrder + 1;

      const token = localStorage.getItem('token');
      const response = await fetch('/api/checklist/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...data,
          sectionId,
          orderIndex: nextOrderIndex
        })
      });
      if (!response.ok) throw new Error('Failed to create question');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Soru Eklendi",
        description: "Yeni soru başarıyla eklendi.",
      });
      
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/checklist/sections', sectionId, 'questions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/checklist/sections/questions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/checklist/sections/questions', templateId] });
      queryClient.invalidateQueries({ queryKey: ['/api/checklist'] });
      
      // Force refetch of the specific section questions
      queryClient.refetchQueries({ queryKey: ['/api/checklist/sections', sectionId, 'questions'] });
      
      // Redirect back to template
      if (templateId) {
        setLocation(`/checklist/templates/${templateId}`);
      } else {
        setLocation('/checklist/templates');
      }
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: "Soru eklenirken bir hata oluştu.",
        variant: "destructive"
      });
    }
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

    createQuestion.mutate(formData);
  };

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => templateId ? setLocation(`/checklist/templates/${templateId}`) : setLocation('/checklist/templates')}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="category">Kategori *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Kategori seçin" />
                </SelectTrigger>
                <SelectContent>
                  {CHECKLIST_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="twScore">TW Skoru (1-10) *</Label>
              <Input
                id="twScore"
                type="number"
                min="1"
                max="10"
                value={formData.twScore}
                onChange={(e) => setFormData(prev => ({ ...prev, twScore: parseInt(e.target.value) || 1 }))}
                placeholder="1-10 arası skor"
              />
            </div>
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
              <li>• TW skoru (1-10): Sorunun tehlike ağırlık skorunu belirler</li>
              <li>• Kategori: Sorunun hangi güvenlik alanına ait olduğunu gösterir</li>
              <li>• "Karşılamıyor" seçilirse fotoğraf/doküman zorunlu olacak</li>
            </ul>
          </div>

          <div className="flex justify-end space-x-4">
            <Button variant="outline" onClick={() => templateId ? setLocation(`/checklist/templates/${templateId}`) : setLocation('/checklist/templates')}>
              İptal
            </Button>
            <Button 
              onClick={handleAdd}
              disabled={createQuestion.isPending}
            >
              {createQuestion.isPending ? "Ekleniyor..." : "Soru Ekle"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}