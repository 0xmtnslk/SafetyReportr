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

  // Fetch question data - using manual fetch instead of default fetcher
  const { data: question, isLoading, error } = useQuery({
    queryKey: ['/api/checklist/questions', questionId],
    queryFn: async () => {
      console.log('Fetching question data for ID:', questionId);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/checklist/questions/${questionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Question fetch response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch question: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Fetched question data:', data);
      return data;
    },
    enabled: !!questionId,
    staleTime: 0, // Always fetch fresh data
    refetchOnMount: true
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
      // Aggressively invalidate and force refetch all related queries
      queryClient.invalidateQueries({ queryKey: ['/api/checklist'] });
      queryClient.invalidateQueries({ queryKey: ['/api/checklist/sections'] });
      queryClient.invalidateQueries({ queryKey: ['/api/checklist/templates'] });
      queryClient.invalidateQueries({ queryKey: ['/api/checklist/questions'] });
      
      // Force immediate refetch of all section questions
      if (question && (question as any).sectionId) {
        const sectionId = (question as any).sectionId;
        
        // Invalidate and refetch section-specific queries
        queryClient.invalidateQueries({ queryKey: ['/api/checklist/sections', sectionId, 'questions'] });
        queryClient.refetchQueries({ queryKey: ['/api/checklist/sections', sectionId, 'questions'] });
        
        // Also invalidate the main sections/questions query used in template detail
        queryClient.invalidateQueries({ queryKey: ['/api/checklist/sections/questions'] });
        queryClient.refetchQueries({ queryKey: ['/api/checklist/sections/questions'] });
        
        // Find and refetch template-specific queries
        const urlParams = new URLSearchParams(window.location.search);
        const referrer = urlParams.get('from');
        if (referrer && referrer.includes('templates/')) {
          const templateId = referrer.split('templates/')[1];
          queryClient.invalidateQueries({ queryKey: ['/api/checklist/sections/questions', templateId] });
          queryClient.refetchQueries({ queryKey: ['/api/checklist/sections/questions', templateId] });
        }
      }
      
      // Force refetch all cached queries to ensure immediate UI update
      queryClient.refetchQueries();
      
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
      console.log('Loading question data into form:', question);
      const newFormData = {
        questionText: (question as any)?.questionText || (question as any)?.text || "",
        category: (question as any)?.category || "Genel",
        twScore: (question as any)?.twScore || (question as any)?.tw_score || 1,
        isRequired: (question as any)?.isRequired ?? true,
        allowPhoto: (question as any)?.allowPhoto ?? true,
        allowDocument: (question as any)?.allowDocument ?? true
      };
      console.log('Setting form data to:', newFormData);
      setFormData(newFormData);
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

  // Don't render form until question data is loaded
  if (isLoading || !question) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              {isLoading ? "Soru verileri yükleniyor..." : "Soru bulunamadı"}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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