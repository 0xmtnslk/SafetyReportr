import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckSquare, ArrowLeft, Plus, Eye, Users
} from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";

interface TemplateDetailProps {
  templateId: string;
}

export default function TemplateDetail({ templateId }: TemplateDetailProps) {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  
  // Check if user is admin (only admins can add sections)
  const isAdmin = user?.role === 'central_admin';

  // Fetch template details
  const { data: template, isLoading: templateLoading } = useQuery<any>({
    queryKey: ["/api/checklist/templates", templateId],
  });

  // Fetch sections for this template
  const { data: sections = [], isLoading: sectionsLoading } = useQuery<any[]>({
    queryKey: ["/api/checklist/templates", templateId, "sections"],
  });

  if (templateLoading || sectionsLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">Yükleniyor...</div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">Şablon bulunamadı</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setLocation("/checklist")}>
            <ArrowLeft size={16} className="mr-2" />
            Kontrol Listeleri
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{template.name}</h1>
            {template.description && (
              <p className="text-gray-600 mt-1">{template.description}</p>
            )}
          </div>
        </div>
        
        {isAdmin && (
          <Button 
            onClick={() => setLocation(`/checklist/templates/${templateId}/add-section`)}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus size={16} className="mr-2" />
            Yeni Bölüm Ekle
          </Button>
        )}
      </div>

      {/* Template Info */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckSquare size={20} />
            Şablon Özeti
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <span className="text-sm text-gray-600">Toplam Bölüm</span>
              <div className="text-2xl font-bold text-primary">{sections.length}</div>
            </div>
            <div>
              <span className="text-sm text-gray-600">Durum</span>
              <div>
                <Badge variant={template.isActive ? "default" : "secondary"}>
                  {template.isActive ? 'Aktif' : 'Pasif'}
                </Badge>
              </div>
            </div>
            <div>
              <span className="text-sm text-gray-600">Kategori</span>
              <div className="font-medium">{template.category || 'Genel'}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sections.length === 0 ? (
          <Card className="lg:col-span-2">
            <CardContent className="text-center py-12">
              <CheckSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <div className="text-gray-500 mb-4">
                Bu şablonda henüz bölüm bulunmuyor.
              </div>
              {isAdmin && (
                <Button 
                  onClick={() => setLocation(`/checklist/templates/${templateId}/add-section`)}
                >
                  <Plus size={16} className="mr-2" />
                  İlk Bölümü Ekle
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          sections.map((section, index) => (
            <Card 
              key={section.id} 
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setLocation(`/checklist/sections/${section.id}/detail?templateId=${templateId}`)}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                      <span className="text-primary font-semibold">{index + 1}</span>
                    </div>
                    <span>{section.name}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLocation(`/checklist/sections/${section.id}/detail?templateId=${templateId}`);
                    }}
                  >
                    <Eye size={16} />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {section.description && (
                  <p className="text-gray-600 mb-3">{section.description}</p>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>Sıra: {section.orderIndex || index + 1}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLocation(`/checklist/sections/${section.id}/detail?templateId=${templateId}`);
                    }}
                  >
                    Bölüme Git
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Actions */}
      {sections.length > 0 && (
        <Card className="mt-6">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold mb-1">Şablon İşlemleri</h3>
                <p className="text-sm text-gray-600">
                  Bu şablonu kullanarak denetim başlatabilir veya düzenleyebilirsiniz.
                </p>
              </div>
              <div className="flex gap-2">
                {isAdmin && (
                  <Button
                    variant="outline"
                    onClick={() => setLocation(`/checklist/templates/${templateId}/edit`)}
                  >
                    Şablonu Düzenle
                  </Button>
                )}
                <Button
                  onClick={() => setLocation(`/checklist/create-inspection?templateId=${templateId}`)}
                >
                  <Users size={16} className="mr-2" />
                  Denetim Başlat
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}