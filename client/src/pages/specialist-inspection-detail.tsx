import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Play, Save, CheckSquare, Clock, FileText, Calendar, Target, BarChart3 } from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { useAuth } from "../hooks/useAuth";

export default function SpecialistInspectionDetail() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/specialist/inspection/:inspectionId");
  const { inspectionId } = params || {};
  const { user } = useAuth();

  // Fetch inspection details
  const { data: inspection, isLoading: inspectionLoading } = useQuery({
    queryKey: [`/api/specialist/inspection/${inspectionId}`],
    enabled: !!inspectionId,
  });

  // Fetch checklist template info
  const { data: checklistTemplates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ["/api/checklist/templates"],
  });

  // Fetch user's hospital information
  const { data: userAssignments = [], isLoading: assignmentsLoading } = useQuery({
    queryKey: ["/api/user/assignments"],
  });

  const template = checklistTemplates.find((t: any) => t.id === inspection?.templateId);
  const userHospital = userAssignments[0]?.hospital || null;
  const isLoading = inspectionLoading || templatesLoading || assignmentsLoading;

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!inspection) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Denetim Bulunamadı
            </h3>
            <p className="text-gray-600">
              Bu denetim mevcut değil veya erişim yetkiniz bulunmuyor.
            </p>
            <Button className="mt-4" onClick={() => setLocation('/specialist/checklists')}>
              <ArrowLeft size={16} className="mr-2" />
              Checklist'lere Dön
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isCompleted = inspection.status === 'completed';
  const isInProgress = inspection.status === 'in_progress';
  const isPending = inspection.status === 'pending';

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => setLocation(`/specialist/checklists/${template?.id}/inspections`)}
          >
            <ArrowLeft size={16} className="mr-2" />
            Denetimler
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {inspection.title || 'Denetim Detayı'}
            </h1>
            <p className="text-gray-600 mt-1">
              {userHospital?.name} - {template?.name}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Badge 
            variant="outline" 
            className={
              isCompleted ? 'bg-green-50 text-green-700 border-green-200' :
              isInProgress ? 'bg-orange-50 text-orange-700 border-orange-200' :
              'bg-yellow-50 text-yellow-700 border-yellow-200'
            }
          >
            {isCompleted ? 'Tamamlandı' : isInProgress ? 'Devam Ediyor' : 'Bekliyor'}
          </Badge>
          <Badge variant="outline" className="text-lg px-4 py-2">
            <Calendar className="w-4 h-4 mr-2" />
            {new Date(inspection.createdAt).toLocaleDateString('tr-TR')}
          </Badge>
        </div>
      </div>

      {/* Inspection Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Denetim Bilgileri
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Genel Bilgiler</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Denetim Başlığı:</span>
                  <span className="font-medium">{inspection.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Checklist:</span>
                  <span className="font-medium">{template?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Durum:</span>
                  <Badge 
                    variant="outline" 
                    className={
                      isCompleted ? 'bg-green-50 text-green-700' :
                      isInProgress ? 'bg-orange-50 text-orange-700' :
                      'bg-yellow-50 text-yellow-700'
                    }
                  >
                    {isCompleted ? 'Tamamlandı' : isInProgress ? 'Devam Ediyor' : 'Bekliyor'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Oluşturulma:</span>
                  <span className="font-medium">
                    {new Date(inspection.createdAt).toLocaleDateString('tr-TR')}
                  </span>
                </div>
                {inspection.completedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tamamlanma:</span>
                    <span className="font-medium">
                      {new Date(inspection.completedAt).toLocaleDateString('tr-TR')}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">İlerleme</h3>
              <div className="space-y-3">
                {isCompleted && (
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <CheckSquare className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <div className="text-lg font-bold text-green-800">Denetim Tamamlandı</div>
                    <div className="text-sm text-green-600">Tüm işlemler başarıyla tamamlandı</div>
                  </div>
                )}
                
                {isInProgress && (
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <Clock className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                    <div className="text-lg font-bold text-orange-800">Denetim Devam Ediyor</div>
                    <div className="text-sm text-orange-600">
                      İlerleme: {inspection.progress || 0}%
                    </div>
                    {inspection.progress && (
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div 
                          className="bg-orange-600 h-2 rounded-full" 
                          style={{ width: `${inspection.progress}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
                )}
                
                {isPending && (
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <Target className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                    <div className="text-lg font-bold text-yellow-800">Denetim Bekliyor</div>
                    <div className="text-sm text-yellow-600">Henüz başlatılmamış</div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {inspection.description && (
            <div className="mt-6 pt-6 border-t">
              <h3 className="font-semibold text-gray-900 mb-2">Açıklama</h3>
              <p className="text-gray-600">{inspection.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            İşlemler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            {isPending && (
              <>
                <Button 
                  onClick={() => setLocation(`/live-checklist?inspectionId=${inspectionId}`)}
                  data-testid="button-start-inspection"
                >
                  <Play size={16} className="mr-2" />
                  Denetimi Başlat
                </Button>
                <div className="text-sm text-gray-600">
                  Denetimi başlatarak checklist sorularını yanıtlamaya başlayabilirsiniz.
                </div>
              </>
            )}
            
            {isInProgress && (
              <>
                <Button 
                  onClick={() => setLocation(`/live-checklist?inspectionId=${inspectionId}`)}
                  data-testid="button-continue-inspection"
                >
                  <Play size={16} className="mr-2" />
                  Denetimi Devam Ettir
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {/* Save current progress */}}
                  data-testid="button-save-progress"
                >
                  <Save size={16} className="mr-2" />
                  İlerlemeyi Kaydet
                </Button>
                <div className="text-sm text-gray-600">
                  Kaldığınız yerden devam edebilir veya mevcut ilerlemenizi kaydedebilirsiniz.
                </div>
              </>
            )}
            
            {isCompleted && (
              <>
                <Button 
                  onClick={() => setLocation(`/inspection-analysis/${userHospital?.id}/${template?.id}/${inspectionId}`)}
                  data-testid="button-view-analysis"
                >
                  <BarChart3 size={16} className="mr-2" />
                  Detaylı Analizi Görüntüle
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setLocation(`/live-checklist?inspectionId=${inspectionId}&mode=view`)}
                  data-testid="button-view-responses"
                >
                  <FileText size={16} className="mr-2" />
                  Yanıtları Görüntüle
                </Button>
                <div className="text-sm text-gray-600">
                  Tamamlanan denetimin sonuçlarını ve detaylı analizini görüntüleyebilirsiniz.
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Template Info */}
      {template && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="w-5 h-5" />
              Checklist Bilgileri
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Genel</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ad:</span>
                    <span className="font-medium">{template.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Versiyon:</span>
                    <span className="font-medium">{template.version || 'v1.0'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Durum:</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      {template.status === 'active' ? 'Aktif' : 'Pasif'}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">İçerik</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Bölüm Sayısı:</span>
                    <span className="font-medium">{template.sectionCount || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Soru Sayısı:</span>
                    <span className="font-medium">{template.questionCount || 0}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Tarihler</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Oluşturulma:</span>
                    <span className="font-medium">
                      {new Date(template.createdAt).toLocaleDateString('tr-TR')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Güncelleme:</span>
                    <span className="font-medium">
                      {new Date(template.updatedAt).toLocaleDateString('tr-TR')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {template.description && (
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-semibold text-gray-900 mb-2">Açıklama</h3>
                <p className="text-gray-600">{template.description}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}