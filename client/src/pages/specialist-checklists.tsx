import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ClipboardList, Plus, FileText, Calendar, CheckSquare, Clock, TrendingUp } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "../hooks/useAuth";

export default function SpecialistChecklists() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  // Fetch user's hospital information
  const { data: userAssignments = [], isLoading: assignmentsLoading } = useQuery({
    queryKey: ["/api/user/assignments"],
  });

  // Fetch checklist templates
  const { data: checklistTemplates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ["/api/checklist/templates"],
  });

  // Get user's hospital
  const userHospital = userAssignments[0]?.hospital || null;

  const isLoading = assignmentsLoading || templatesLoading;

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setLocation('/dashboard')}>
            <ArrowLeft size={16} className="mr-2" />
            Ana Sayfa
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Denetim Checklist'leri</h1>
            <p className="text-gray-600 mt-1">
              {userHospital?.name || 'Hastane bilgisi yükleniyor...'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-lg px-4 py-2">
            <Calendar className="w-4 h-4 mr-2" />
            {new Date().toLocaleDateString('tr-TR')}
          </Badge>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <ClipboardList className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{checklistTemplates.length}</div>
            <p className="text-sm text-gray-600">Toplam Checklist</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <CheckSquare className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-600">
              {checklistTemplates.filter((t: any) => t.status === 'active').length}
            </div>
            <p className="text-sm text-gray-600">Aktif Checklist</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="text-2xl font-bold text-yellow-600">0</div>
            <p className="text-sm text-gray-600">Bekleyen Denetim</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-purple-600">0</div>
            <p className="text-sm text-gray-600">Tamamlanan</p>
          </CardContent>
        </Card>
      </div>

      {/* Checklist Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Mevcut Checklist'ler</h2>
          <div className="text-sm text-gray-600">
            Son güncelleme tarihi en yeni olan başta gösterilir
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {checklistTemplates
            .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
            .map((template: any) => (
            <Card key={template.id} className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold text-gray-900">
                    {template.name}
                  </CardTitle>
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                    {template.version || 'v1.0'}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600 line-clamp-2">
                  {template.description || 'Bu checklist için açıklama eklenmemiş.'}
                </p>
                
                {/* Template Info */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">
                      {template.sectionCount || 0} Bölüm
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">
                      {template.questionCount || 0} Soru
                    </span>
                  </div>
                </div>

                {/* Status and Date */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <Badge 
                    variant="outline" 
                    className={template.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-700'}
                  >
                    {template.status === 'active' ? 'Aktif' : 'Pasif'}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {new Date(template.updatedAt).toLocaleDateString('tr-TR')}
                  </span>
                </div>

                {/* Action Button */}
                <Button 
                  onClick={() => setLocation(`/specialist/checklists/${template.id}/inspections`)}
                  className="w-full"
                  data-testid={`button-view-inspections-${template.id}`}
                >
                  Denetimleri Görüntüle
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {checklistTemplates.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <ClipboardList className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Henüz Checklist Bulunmuyor
              </h3>
              <p className="text-gray-600 mb-4">
                Admin tarafından checklist oluşturulduğunda burada görünecektir.
              </p>
              <div className="text-sm text-gray-500">
                Yeni checklist'ler otomatik olarak hastanenizde görünür hale gelir.
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-blue-600 mt-1" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">Bilgi</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Admin tarafından yeni checklist oluşturulduğunda otomatik olarak hastanenizde görünür</li>
                <li>• Checklist içinde denetim ataması yapılmasa bile denetim başlatabilirsiniz</li>
                <li>• Son güncellenen checklist'ler en üstte gösterilir</li>
                <li>• Tamamladığınız denetimlerin sonuçlarını detaylı analiz edebilirsiniz</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}