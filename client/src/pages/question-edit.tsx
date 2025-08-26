import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { CHECKLIST_CATEGORIES } from "@shared/schema";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface QuestionEditProps {
  questionId: string;
}

export default function QuestionEdit({ questionId }: QuestionEditProps) {
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

  // Fetch question data
  const { data: question, isLoading } = useQuery({
    queryKey: ['/api/checklist/questions', questionId],
    enabled: !!questionId
  });

  // Update question mutation
  const updateQuestion = useMutation({
    mutationFn: async (data: any) => {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/checklist/questions/${questionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update question');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Soru Güncellendi",
        description: "Soru başarıyla güncellendi.",
      });
      // Invalidate all related queries to refresh the cache
      queryClient.invalidateQueries({ queryKey: ['/api/checklist'] });
      queryClient.invalidateQueries({ queryKey: ['/api/checklist/sections'] });
      queryClient.invalidateQueries({ queryKey: ['/api/checklist/templates'] });
      queryClient.invalidateQueries({ queryKey: ['/api/checklist/questions'] });
      
      // Get referrer from URL params or localStorage to redirect back properly
      const urlParams = new URLSearchParams(window.location.search);
      const referrer = urlParams.get('from');
      if (referrer && referrer.includes('templates')) {
        setLocation(referrer);
      } else if (question && (question as any).sectionId) {
        // Try to go back to template list if we don't have specific template ID
        setLocation('/checklist/templates');
      } else {
        setLocation('/checklist');
      }
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: "Soru güncellenirken bir hata oluştu.",
        variant: "destructive"
      });
    }
  });

  // Update form data when question is loaded
  useEffect(() => {
    if (question) {
      setFormData({
        questionText: (question as any)?.questionText || "",
        category: (question as any)?.category || "Genel",
        twScore: (question as any)?.twScore || 1,
        isRequired: (question as any)?.isRequired ?? true,
        allowPhoto: (question as any)?.allowPhoto ?? true,
        allowDocument: (question as any)?.allowDocument ?? true
      });
    }
  }, [question]);

  const handleSave = () => {
    if (!formData.questionText.trim()) {
      toast({
        title: "Hata",
        description: "Soru metni gereklidir.",
        variant: "destructive"
      });
      return;
    }

    updateQuestion.mutate(formData);
  };

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => {
              const urlParams = new URLSearchParams(window.location.search);
              const referrer = urlParams.get('from');
              if (referrer) {
                setLocation(referrer);
              } else {
                setLocation('/checklist/templates');
              }
            }}
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

          <div className="flex justify-end space-x-4">
            <Button variant="outline" onClick={() => {
              const urlParams = new URLSearchParams(window.location.search);
              const referrer = urlParams.get('from');
              if (referrer) {
                setLocation(referrer);
              } else {
                setLocation('/checklist/templates');
              }
            }}>
              İptal
            </Button>
            <Button 
              onClick={handleSave}
              disabled={updateQuestion.isPending}
            >
              {updateQuestion.isPending ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}