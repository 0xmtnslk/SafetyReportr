import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  CheckSquare, FileText, Eye, Edit, Plus, Settings, Copy, Search, Filter, Grid3X3, List, Users
} from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function ChecklistDashboard() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');

  // Check if user is admin (only admins can create/edit templates)
  const isAdmin = user?.role === 'central_admin';

  // Fetch all templates
  const { data: templates = [], isLoading: templatesLoading } = useQuery<any[]>({
    queryKey: ["/api/checklist/templates"],
  });

  // Fetch sections count for each template
  const { data: templatesWithSections = [] } = useQuery<any[]>({
    queryKey: ["/api/checklist/templates-with-sections"],
    queryFn: async () => {
      if (!templates.length) return [];
      
      const templatesWithData = await Promise.all(
        templates.map(async (template) => {
          try {
            const sectionsResponse = await fetch(`/api/checklist/templates/${template.id}/sections`, {
              headers: {
                "Authorization": `Bearer ${localStorage.getItem("token")}`,
              },
            });
            const sections = sectionsResponse.ok ? await sectionsResponse.json() : [];
            
            // Count total questions
            let totalQuestions = 0;
            if (sections.length > 0) {
              const questionPromises = sections.map(async (section: any) => {
                try {
                  const questionsResponse = await fetch(`/api/checklist/sections/${section.id}/questions`, {
                    headers: {
                      "Authorization": `Bearer ${localStorage.getItem("token")}`,
                    },
                  });
                  const questions = questionsResponse.ok ? await questionsResponse.json() : [];
                  return Array.isArray(questions) ? questions.length : 0;
                } catch {
                  return 0;
                }
              });
              const questionCounts = await Promise.all(questionPromises);
              totalQuestions = questionCounts.reduce((sum, count) => sum + count, 0);
            }

            return {
              ...template,
              sectionsCount: Array.isArray(sections) ? sections.length : 0,
              questionsCount: totalQuestions,
              sections: sections
            };
          } catch (error) {
            return {
              ...template,
              sectionsCount: 0,
              questionsCount: 0,
              sections: []
            };
          }
        })
      );
      
      return templatesWithData;
    },
    enabled: templates.length > 0,
  });

  // Copy template mutation
  const copyTemplate = useMutation({
    mutationFn: async (templateId: string) => {
      const template = templatesWithSections.find(t => t.id === templateId);
      if (!template) throw new Error('Template not found');

      const token = localStorage.getItem('token');
      const newTemplateData = {
        name: `${template.name} - Kopya`,
        description: template.description,
        category: template.category,
        type: template.type,
        version: '1.0',
        isActive: false, // Start as inactive
        templateNumber: `TMP-${Date.now().toString().slice(-6)}`
      };

      const response = await fetch('/api/checklist/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newTemplateData)
      });

      if (!response.ok) throw new Error('Failed to copy template');
      return response.json();
    },
    onSuccess: (newTemplate) => {
      toast({
        title: "Şablon Kopyalandı",
        description: "Şablon başarıyla kopyalandı. Şimdi düzenleyebilirsiniz.",
      });
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['/api/checklist/templates'] });
      
      // Navigate to new template
      setLocation(`/checklist/templates/${newTemplate.id}`);
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Şablon kopyalanırken bir hata oluştu.",
        variant: "destructive"
      });
    }
  });

  // Filter templates based on search
  const filteredTemplates = templatesWithSections.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (templatesLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            İSG Kontrol Listesi Yönetimi
          </h1>
          <p className="text-gray-600 mt-2">
            Şablonları yönetin, yeni kontrol listeleri oluşturun ve denetimleri başlatın
          </p>
        </div>
        
        {isAdmin && (
          <Button 
            onClick={() => setLocation('/checklist/create-template')}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus size={20} className="mr-2" />
            Yeni Şablon Oluştur
          </Button>
        )}
      </div>

      {/* Search and Filter Bar */}
      {filteredTemplates.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Şablon ara... (ad, açıklama, kategori)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 size={16} className="mr-1" />
              Kart
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List size={16} className="mr-1" />
              Liste
            </Button>
          </div>
        </div>
      )}

      {/* Templates */}
      {filteredTemplates.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            {templates.length === 0 ? (
              <>
                <FileText size={64} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Henüz Şablon Yok
                </h3>
                <p className="text-gray-600 mb-6">
                  İlk kontrol listesi şablonunuzu oluşturun.
                </p>
                {isAdmin && (
                  <Button onClick={() => setLocation('/checklist/create-template')}>
                    <Plus size={20} className="mr-2" />
                    İlk Şablonu Oluştur
                  </Button>
                )}
              </>
            ) : (
              <>
                <Search size={64} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Arama Sonucu Bulunamadı
                </h3>
                <p className="text-gray-600 mb-4">
                  "{searchTerm}" için sonuç bulunamadı.
                </p>
                <Button variant="outline" onClick={() => setSearchTerm('')}>
                  Aramayı Temizle
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className={viewMode === 'grid' ? 'grid gap-6 md:grid-cols-2 xl:grid-cols-3' : 'space-y-4'}>
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="hover:shadow-lg transition-all duration-200">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-3 mb-2">
                      <div className="bg-primary/10 p-2 rounded-lg">
                        <CheckSquare size={20} className="text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold leading-tight">{template.name}</h3>
                        <p className="text-xs text-gray-500 font-normal mt-1">
                          {template.templateNumber || 'N/A'} • {new Date(template.created_at || Date.now()).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                    </CardTitle>
                    {template.description && (
                      <p className="text-gray-600 text-sm leading-relaxed">{template.description}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Badge variant={template.isActive ? "default" : "secondary"} className="text-xs">
                      {template.isActive ? 'Aktif' : 'Pasif'}
                    </Badge>
                    {template.category && (
                      <Badge variant="outline" className="text-xs">
                        {template.category}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                {/* Stats */}
                <div className="bg-gray-50 p-3 rounded-lg mb-4">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-lg font-bold text-primary">{template.sectionsCount || 0}</div>
                      <div className="text-xs text-gray-600">Bölüm</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-green-600">{template.questionsCount || 0}</div>
                      <div className="text-xs text-gray-600">Soru</div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={() => setLocation(`/checklist/templates/${template.id}`)}
                    className="flex-1"
                  >
                    <Eye size={14} className="mr-1" />
                    Görüntüle
                  </Button>
                  
                  {isAdmin && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyTemplate.mutate(template.id)}
                        disabled={copyTemplate.isPending}
                      >
                        <Copy size={14} className="mr-1" />
                        Kopyala
                      </Button>
                    </>
                  )}
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setLocation(`/checklist/create-inspection?templateId=${template.id}`)}
                  >
                    <Users size={14} className="mr-1" />
                    Denetim
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Quick Stats */}
      {filteredTemplates.length > 0 && (
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{filteredTemplates.length}</div>
              <div className="text-sm text-gray-600">Toplam Şablon</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {filteredTemplates.filter(t => t.isActive).length}
              </div>
              <div className="text-sm text-gray-600">Aktif Şablon</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {filteredTemplates.reduce((sum, t) => sum + (t.sectionsCount || 0), 0)}
              </div>
              <div className="text-sm text-gray-600">Toplam Bölüm</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {filteredTemplates.reduce((sum, t) => sum + (t.questionsCount || 0), 0)}
              </div>
              <div className="text-sm text-gray-600">Toplam Soru</div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}