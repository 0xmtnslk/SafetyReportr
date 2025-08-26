import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface SectionEditProps {
  sectionId: string;
}

export default function SectionEdit({ sectionId }: SectionEditProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: "ADP Kontrol Listesi",
    description: "Yangın algılama ve uyarı sistemlerinin kontrolü"
  });

  // Fetch section data
  const { data: section, isLoading } = useQuery({
    queryKey: ['/api/checklist/sections', sectionId],
    enabled: !!sectionId
  });

  // Update section mutation
  const updateSection = useMutation({
    mutationFn: async (data: any) => {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/checklist/sections/${sectionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update section');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Bölüm Güncellendi",
        description: "Bölüm bilgileri başarıyla güncellendi.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/checklist'] });
      setLocation('/checklist');
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: "Bölüm güncellenirken bir hata oluştu.",
        variant: "destructive"
      });
    }
  });

  // Update form data when section is loaded
  useEffect(() => {
    if (section) {
      setFormData({
        name: (section as any)?.name || "ADP Kontrol Listesi",
        description: (section as any)?.description || "Yangın algılama ve uyarı sistemlerinin kontrolü"
      });
    }
  }, [section]);

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast({
        title: "Hata",
        description: "Bölüm adı gereklidir.",
        variant: "destructive"
      });
      return;
    }

    updateSection.mutate(formData);
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
            <Button 
              onClick={handleSave}
              disabled={updateSection.isPending}
            >
              {updateSection.isPending ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}