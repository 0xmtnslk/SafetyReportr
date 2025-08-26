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

export default function CreateTemplate() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    version: "1.0",
    isActive: true
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

    toast({
      title: "Şablon Oluşturuldu",
      description: "Yeni şablon başarıyla oluşturuldu.",
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
            <h1 className="text-3xl font-bold text-gray-900">Yeni Şablon Oluştur</h1>
            <p className="text-gray-600 mt-1">Yeni kontrol listesi şablonu oluşturun</p>
          </div>
        </div>
        
        <Button onClick={handleCreate} className="bg-primary hover:bg-primary/90">
          <Plus size={16} className="mr-2" />
          Şablon Oluştur
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
            <Button onClick={handleCreate}>
              Şablon Oluştur
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}