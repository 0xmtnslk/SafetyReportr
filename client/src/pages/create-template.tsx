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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { insertChecklistTemplateSchema } from "@shared/schema";

export default function CreateTemplate() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    version: "1.0",
    isActive: true,
    category: "Genel",
    type: "hospital_technical"
  });

  // Create template mutation
  const createTemplate = useMutation({
    mutationFn: async (data: any) => {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/checklist/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...data,
          // Auto-generate template number
          templateNumber: `TMP-${Date.now().toString().slice(-6)}`
        })
      });
      if (!response.ok) throw new Error('Failed to create template');
      return response.json();
    },
    onSuccess: (newTemplate) => {
      toast({
        title: "Şablon Oluşturuldu",
        description: `${formData.name} şablonu başarıyla oluşturuldu.`,
      });
      
      // Invalidate and refetch templates
      queryClient.invalidateQueries({ queryKey: ['/api/checklist/templates'] });
      queryClient.invalidateQueries({ queryKey: ['/api/checklist'] });
      
      // Redirect to the new template detail page
      setLocation(`/checklist/templates/${newTemplate.id}`);
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: "Şablon oluşturulurken bir hata oluştu.",
        variant: "destructive"
      });
    }
  });

  const handleCreate = () => {
    if (!formData.name.trim()) {
      toast({
        title: "Hata",
        description: "Şablon adı gereklidir.",
        variant: "destructive"
      });
      return;
    }

    createTemplate.mutate(formData);
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
            <h1 className="text-3xl font-bold text-gray-900">Yeni Şablon Oluştur</h1>
            <p className="text-gray-600 mt-1">Yeni kontrol listesi şablonu oluşturun</p>
          </div>
        </div>
        
        <Button 
          onClick={handleCreate} 
          className="bg-primary hover:bg-primary/90"
          disabled={createTemplate.isPending}
        >
          <Plus size={16} className="mr-2" />
          {createTemplate.isPending ? 'Oluşturuluyor...' : 'Şablon Oluştur'}
        </Button>
      </div>

      {/* Create Form */}
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
              placeholder="Örnek: İSG Teknik Alanlar Denetim Kontrol Listesi"
            />
          </div>
          
          <div>
            <Label htmlFor="description">Açıklama</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Şablon kullanım amacını ve kapsamını açıklayın"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="category">Kategori</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                placeholder="Örn: Teknik Alanlar, Güvenlik, Hijyen"
              />
            </div>

            <div>
              <Label htmlFor="version">Versiyon</Label>
              <Input
                id="version"
                value={formData.version}
                onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
                placeholder="Versiyon numarası"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
            />
            <Label htmlFor="isActive">Şablon aktif olsun</Label>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-medium text-green-900 mb-2">Sonraki Adımlar</h4>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• Şablon oluşturduktan sonra bölümler ekleyebilirsiniz</li>
              <li>• Her bölüme uygun sorular ekleyebilirsiniz</li>
              <li>• Şablonu hastanelere atayabilir ve değerlendirme başlatabilirsiniz</li>
            </ul>
          </div>

          <div className="flex justify-end space-x-4">
            <Button variant="outline" onClick={() => setLocation('/checklist')}>
              İptal
            </Button>
            <Button 
              onClick={handleCreate}
              disabled={createTemplate.isPending}
            >
              {createTemplate.isPending ? 'Oluşturuluyor...' : 'Şablon Oluştur'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}