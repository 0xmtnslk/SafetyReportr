import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FileText, CheckSquare, BarChart3, Calendar } from "lucide-react";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";

export default function ChecklistDashboard() {
  const [, setLocation] = useLocation();

  // Fetch checklist templates
  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ["/api/checklist/templates"],
  });

  // Fetch recent inspections
  const { data: inspections = [], isLoading: inspectionsLoading } = useQuery({
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
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            İSG Teknik Kontrol Listeleri
          </h1>
          <p className="text-gray-600 max-w-2xl">
            Hastane teknik alanlarının güvenlik denetimi için kontrol listelerini yönetin ve değerlendirin.
          </p>
        </div>
        <div className="flex gap-3 mt-4 md:mt-0">
          <Button
            onClick={() => setLocation('/checklist/inspections')}
            variant="outline"
            className="flex items-center gap-2"
            data-testid="button-view-inspections"
          >
            <FileText size={16} />
            Denetimleri Görüntüle
          </Button>
          <Button
            onClick={() => setLocation('/checklist/create-inspection')}
            className="flex items-center gap-2"
            data-testid="button-create-inspection"
          >
            <Plus size={16} />
            Yeni Denetim
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700 mb-1">Toplam Şablon</p>
                <p className="text-3xl font-bold text-blue-900" data-testid="stat-total-templates">
                  {totalTemplates}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-200 rounded-lg flex items-center justify-center">
                <CheckSquare className="text-blue-700" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700 mb-1">Toplam Denetim</p>
                <p className="text-3xl font-bold text-green-900" data-testid="stat-total-inspections">
                  {totalInspections}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-200 rounded-lg flex items-center justify-center">
                <FileText className="text-green-700" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-700 mb-1">Taslak Denetim</p>
                <p className="text-3xl font-bold text-yellow-900" data-testid="stat-draft-inspections">
                  {draftInspections}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-200 rounded-lg flex items-center justify-center">
                <Calendar className="text-yellow-700" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700 mb-1">Tamamlanan</p>
                <p className="text-3xl font-bold text-purple-900" data-testid="stat-completed-inspections">
                  {completedInspections}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-200 rounded-lg flex items-center justify-center">
                <BarChart3 className="text-purple-700" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Available Templates */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-semibold">Mevcut Kontrol Listeleri</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation('/checklist/templates')}
              data-testid="button-manage-templates"
            >
              Yönet
            </Button>
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
                <Button
                  onClick={() => setLocation('/checklist/templates/create')}
                  data-testid="button-create-template"
                >
                  <Plus size={16} className="mr-2" />
                  Şablon Oluştur
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {templates.slice(0, 5).map((template: any) => (
                  <div
                    key={template.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={() => setLocation(`/checklist/templates/${template.id}`)}
                    data-testid={`template-${template.id}`}
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
                    <Badge variant="secondary">
                      {template.isActive ? 'Aktif' : 'Pasif'}
                    </Badge>
                  </div>
                ))}
                {templates.length > 5 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => setLocation('/checklist/templates')}
                  >
                    {templates.length - 5} tane daha göster
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Inspections */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-semibold">Son Denetimler</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation('/checklist/inspections')}
              data-testid="button-view-all-inspections"
            >
              Tümünü Gör
            </Button>
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
                <Button
                  onClick={() => setLocation('/checklist/create-inspection')}
                  data-testid="button-start-inspection"
                >
                  <Plus size={16} className="mr-2" />
                  Denetim Başlat
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {inspections.slice(0, 5).map((inspection: any) => (
                  <div
                    key={inspection.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={() => setLocation(`/checklist/inspections/${inspection.id}`)}
                    data-testid={`inspection-${inspection.id}`}
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
                    <Badge 
                      variant={inspection.status === 'completed' ? 'default' : 'secondary'}
                    >
                      {inspection.status === 'completed' ? 'Tamamlandı' : 'Taslak'}
                    </Badge>
                  </div>
                ))}
                {inspections.length > 5 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => setLocation('/checklist/inspections')}
                  >
                    {inspections.length - 5} tane daha göster
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}