import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { insertChecklistSectionSchema } from "@shared/schema";

interface AddSectionProps {
  templateId: string;
}

export default function AddSection({ templateId }: AddSectionProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: "",
    description: ""
  });

  // Get existing sections to calculate order index
  const { data: existingSections = [] } = useQuery({
    queryKey: ['/api/checklist/templates', templateId, 'sections'],
    enabled: !!templateId
  });

  // Create section mutation
  const createSection = useMutation({
    mutationFn: async (data: any) => {
      // Calculate next order index
      const maxOrder = existingSections.length > 0 
        ? Math.max(...existingSections.map((s: any) => s.orderIndex || 0))
        : 0;
      const nextOrderIndex = maxOrder + 1;

      const token = localStorage.getItem('token');
      const response = await fetch('/api/checklist/sections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...data,
          templateId,
          orderIndex: nextOrderIndex
        })
      });
      if (!response.ok) throw new Error('Failed to create section');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Bölüm Eklendi",
        description: "Yeni bölüm başarıyla eklendi.",
      });
      
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/checklist/templates', templateId, 'sections'] });
      queryClient.invalidateQueries({ queryKey: ['/api/checklist/templates', templateId] });
      queryClient.invalidateQueries({ queryKey: ['/api/checklist'] });
      
      // Force refetch
      queryClient.refetchQueries({ queryKey: ['/api/checklist/templates', templateId, 'sections'] });
      
      // Redirect back to template
      setLocation(`/checklist/templates/${templateId}`);
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: "Bölüm eklenirken bir hata oluştu.",
        variant: "destructive"
      });
    }
  });

  const handleAdd = () => {
    if (!formData.name.trim()) {
      toast({
        title: "Hata",
        description: "Bölüm adı gereklidir.",
        variant: "destructive"
      });
      return;
    }

    createSection.mutate(formData);
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
            <h1 className="text-3xl font-bold text-gray-900">Yeni Bölüm Ekle</h1>
            <p className="text-gray-600 mt-1">Şablona yeni bir bölüm ekleyin</p>
          </div>
        </div>
        
        <Button 
          onClick={handleAdd} 
          className="bg-primary hover:bg-primary/90"
          disabled={createSection.isPending}
        >
          <Plus size={16} className="mr-2" />
          Bölüm Ekle
        </Button>
      </div>

      {/* Form */}
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
              placeholder="Örn: ADP Kontrol Listesi, UPS Kontrol Listesi"
            />
          </div>

          <div>
            <Label htmlFor="description">Açıklama</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Bölüm hakkında kısa bir açıklama (isteğe bağlı)"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}