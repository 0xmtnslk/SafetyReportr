import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Play, Eye, Calendar, CheckSquare, Clock, FileText, AlertTriangle } from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { useAuth } from "../hooks/useAuth";

export default function SpecialistInspections() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/specialist/checklists/:checklistId/inspections");
  const { checklistId } = params || {};
  const { user } = useAuth();

  // Fetch checklist template info
  const { data: checklistTemplates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ["/api/checklist/templates"],
  });

  // Fetch user's hospital information
  const { data: userAssignments = [], isLoading: assignmentsLoading } = useQuery({
    queryKey: ["/api/user/assignments"],
  });

  // Fetch inspections for this checklist and hospital
  const { data: inspections = [], isLoading: inspectionsLoading } = useQuery({
    queryKey: [`/api/specialist/checklist/${checklistId}/inspections`],
    enabled: !!checklistId,
  });

  const template = checklistTemplates.find((t: any) => t.id === checklistId);
  const userHospital = userAssignments[0]?.hospital || null;
  const isLoading = templatesLoading || assignmentsLoading || inspectionsLoading;

  const handleStartNewInspection = () => {
    // Navigate to create new inspection
    setLocation(`/specialist/inspection/create?checklistId=${checklistId}`);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const pendingInspections = inspections.filter((inspection: any) => inspection.status === 'pending');
  const inProgressInspections = inspections.filter((inspection: any) => inspection.status === 'in_progress');
  const completedInspections = inspections.filter((inspection: any) => inspection.status === 'completed');

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setLocation('/specialist/checklists')}>
            <ArrowLeft size={16} className="mr-2" />
            Checklist'ler
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {template?.name || 'Checklist'} Denetimleri
            </h1>
            <p className="text-gray-600 mt-1">
              {userHospital?.name || 'Hastane bilgisi yükleniyor...'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-lg px-4 py-2">
            <Calendar className="w-4 h-4 mr-2" />
            {new Date().toLocaleDateString('tr-TR')}
          </Badge>
          <Button onClick={handleStartNewInspection} data-testid="button-start-inspection">
            <Plus size={16} className="mr-2" />
            Yeni Denetim Başlat
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{inspections.length}</div>
            <p className="text-sm text-gray-600">Toplam Denetim</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="text-2xl font-bold text-yellow-600">{pendingInspections.length}</div>
            <p className="text-sm text-gray-600">Bekleyen</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-orange-600">{inProgressInspections.length}</div>
            <p className="text-sm text-gray-600">Devam Eden</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <CheckSquare className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-600">{completedInspections.length}</div>
            <p className="text-sm text-gray-600">Tamamlanan</p>
          </CardContent>
        </Card>
      </div>

      {/* Inspections List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Denetimler</h2>
          <div className="text-sm text-gray-600">
            En son güncellenen denetimler başta gösterilir
          </div>
        </div>

        {inspections.length > 0 ? (
          <div className="space-y-4">
            {inspections
              .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
              .map((inspection: any) => (
              <Card key={inspection.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {inspection.title || 'Adsız Denetim'}
                        </h3>
                        <Badge 
                          variant="outline" 
                          className={
                            inspection.status === 'completed' ? 'bg-green-50 text-green-700' :
                            inspection.status === 'in_progress' ? 'bg-orange-50 text-orange-700' :
                            'bg-yellow-50 text-yellow-700'
                          }
                        >
                          {inspection.status === 'completed' ? 'Tamamlandı' :
                           inspection.status === 'in_progress' ? 'Devam Ediyor' :
                           'Bekliyor'}
                        </Badge>
                      </div>
                      
                      <p className="text-gray-600 mb-3">
                        {inspection.description || 'Bu denetim için açıklama eklenmemiş.'}
                      </p>
                      
                      <div className="flex items-center gap-6 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Oluşturulma: {new Date(inspection.createdAt).toLocaleDateString('tr-TR')}
                        </div>
                        {inspection.updatedAt !== inspection.createdAt && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            Son Güncelleme: {new Date(inspection.updatedAt).toLocaleDateString('tr-TR')}
                          </div>
                        )}
                        {inspection.completedAt && (
                          <div className="flex items-center gap-1">
                            <CheckSquare className="w-4 h-4" />
                            Tamamlandı: {new Date(inspection.completedAt).toLocaleDateString('tr-TR')}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      {inspection.status === 'pending' && (
                        <Button 
                          onClick={() => setLocation(`/specialist/inspection/${inspection.id}`)}
                          data-testid={`button-start-${inspection.id}`}
                        >
                          <Play size={16} className="mr-2" />
                          Başlat
                        </Button>
                      )}
                      
                      {inspection.status === 'in_progress' && (
                        <Button 
                          onClick={() => setLocation(`/specialist/inspection/${inspection.id}`)}
                          data-testid={`button-continue-${inspection.id}`}
                        >
                          <Play size={16} className="mr-2" />
                          Devam Et
                        </Button>
                      )}
                      
                      {inspection.status === 'completed' && (
                        <Button 
                          variant="outline"
                          onClick={() => setLocation(`/specialist/inspection/${inspection.id}`)}
                          data-testid={`button-view-${inspection.id}`}
                        >
                          <Eye size={16} className="mr-2" />
                          Sonuçları Görüntüle
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {/* Progress Bar for In Progress Inspections */}
                  {inspection.status === 'in_progress' && inspection.progress && (
                    <div className="mt-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>İlerleme</span>
                        <span>{inspection.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${inspection.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Henüz Denetim Bulunmuyor
              </h3>
              <p className="text-gray-600 mb-6">
                Bu checklist için henüz denetim başlatılmamış. Yeni bir denetim başlatmak için butona tıklayın.
              </p>
              <Button onClick={handleStartNewInspection} data-testid="button-start-first-inspection">
                <Plus size={16} className="mr-2" />
                İlk Denetimi Başlat
              </Button>
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
              <h3 className="font-semibold text-blue-900 mb-2">Denetim Süreci</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <strong>Bekliyor:</strong> Henüz başlatılmamış denetimler</li>
                <li>• <strong>Devam Ediyor:</strong> Üzerinde çalışılan denetimler</li>
                <li>• <strong>Tamamlandı:</strong> Sonuçları görüntüleyebileceğiniz denetimler</li>
                <li>• Admin checklist oluşturduğunda otomatik olarak burada denetim başlatabilirsiniz</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}