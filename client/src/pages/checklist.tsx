import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FileText, CheckSquare } from "lucide-react";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";

export default function ChecklistDashboard() {
  const [, setLocation] = useLocation();

  // Fetch checklist templates
  const { data: templates = [], isLoading: templatesLoading } = useQuery<any[]>({
    queryKey: ["/api/checklist/templates"],
  });

  // Fetch recent inspections
  const { data: inspections = [], isLoading: inspectionsLoading } = useQuery<any[]>({
    queryKey: ["/api/checklist/inspections"],
  });

  // Calculate quick stats
  const totalTemplates = templates.length;
  const totalInspections = inspections.length;
  const completedInspections = inspections.filter((i: any) => i.status === 'completed').length;
  const draftInspections = inspections.filter((i: any) => i.status === 'draft').length;

  if (templatesLoading || inspectionsLoading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <h1 className="text-2xl font-bold mb-4">Kontrol Listeleri Yükleniyor...</h1>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          İSG Teknik Kontrol Listeleri
        </h1>
        <p className="text-gray-600 mb-4">
          Hastane teknik alanlarının güvenlik denetimi için kontrol listelerini yönetin ve değerlendirin.
        </p>
        <div className="flex gap-3">
          <Button
            onClick={() => alert('Denetimler sayfası henüz hazır değil')}
            variant="outline"
            className="flex items-center gap-2"
          >
            <FileText size={16} />
            Denetimleri Görüntüle
          </Button>
          <Button
            onClick={() => setLocation('/checklist/create-inspection')}
            className="flex items-center gap-2"
          >
            <Plus size={16} />
            Yeni Denetim
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700 mb-1">Toplam Şablon</p>
                <p className="text-3xl font-bold text-blue-900">{totalTemplates}</p>
              </div>
              <CheckSquare className="text-blue-700" size={24} />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700 mb-1">Toplam Denetim</p>
                <p className="text-3xl font-bold text-green-900">{totalInspections}</p>
              </div>
              <FileText className="text-green-700" size={24} />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-700 mb-1">Taslak Denetim</p>
                <p className="text-3xl font-bold text-yellow-900">{draftInspections}</p>
              </div>
              <Plus className="text-yellow-700" size={24} />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700 mb-1">Tamamlanan</p>
                <p className="text-3xl font-bold text-purple-900">{completedInspections}</p>
              </div>
              <CheckSquare className="text-purple-700" size={24} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Template Info */}
      <Card>
        <CardHeader>
          <CardTitle>Mevcut Kontrol Listeleri</CardTitle>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <div className="text-center py-8">
              <CheckSquare className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Henüz kontrol listesi yok
              </h3>
              <p className="text-gray-600 mb-4">
                İlk kontrol listesi şablonunuzu oluşturun
              </p>
              <Button onClick={() => alert('Şablon oluşturma özelliği hazırlanıyor')}>
                <Plus size={16} className="mr-2" />
                Şablon Oluştur
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {templates.map((template: any) => (
                <div 
                  key={template.id} 
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => alert(`${template.name} şablonu seçildi - Detay sayfası hazırlanıyor`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <CheckSquare className="text-blue-600" size={16} />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{template.name}</h4>
                      <p className="text-sm text-gray-600">v{template.version}</p>
                    </div>
                  </div>
                  <Badge variant={template.isActive ? 'default' : 'secondary'}>
                    {template.isActive ? 'Aktif' : 'Pasif'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Inspections */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Son Denetimler</CardTitle>
        </CardHeader>
        <CardContent>
          {inspections.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Henüz denetim yok
              </h3>
              <p className="text-gray-600 mb-4">
                İlk denetiminizi başlatın
              </p>
              <Button onClick={() => alert('Denetim başlatma özelliği hazırlanıyor')}>
                <Plus size={16} className="mr-2" />
                Denetim Başlat
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {inspections.map((inspection: any) => (
                <div 
                  key={inspection.id} 
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => alert(`Denetim ${inspection.id} seçildi - Detay sayfası hazırlanıyor`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <FileText className="text-green-600" size={16} />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {new Date(inspection.inspectionDate).toLocaleDateString('tr-TR')}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {inspection.letterGrade && (
                          <span className="mr-2">Not: {inspection.letterGrade}</span>
                        )}
                        {inspection.successPercentage && (
                          <span>%{inspection.successPercentage}</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <Badge variant={inspection.status === 'completed' ? 'default' : 'secondary'}>
                    {inspection.status === 'completed' ? 'Tamamlandı' : 'Taslak'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}