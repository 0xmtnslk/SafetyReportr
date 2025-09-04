import { useQuery, useQueries } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Building2, TrendingUp, Award, Eye, CheckSquare, Calendar, BarChart3, ChevronRight, ClipboardList, AlertTriangle, Clock, Target, Activity, CheckCircle, Gauge } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";

export default function InspectionHistory() {
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

  // Get user's hospital from user.hospital (included in /api/user/me response)
  const userHospital = user?.hospital || null;

  // Function to calculate real analysis score from responses (synchronous)
  const calculateRealAnalysisScore = (responses: any[]) => {
    if (!responses || responses.length === 0) return { score: 0, grade: 'E' };
    
    let totalPoints = 0;
    let earnedPoints = 0;
    
    responses.forEach((response: any) => {
      const twPoints = response.question?.twScore || 10;
      totalPoints += twPoints;
      
      switch (response.answer) {
        case 'Karşılıyor':
          earnedPoints += twPoints;
          break;
        case 'Kısmen Karşılıyor':
          earnedPoints += Math.floor(twPoints * 0.5);
          break;
        case 'Karşılamıyor':
        case 'Kapsam Dışı':
          earnedPoints += 0;
          break;
      }
    });
    
    const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const grade = score >= 90 ? 'AA' :
                 score >= 80 ? 'A' :
                 score >= 70 ? 'B' :
                 score >= 60 ? 'C' :
                 score >= 50 ? 'D' : 'E';
    
    return { score, grade };
  };

  // Fetch all responses for all assignments using useQueries
  const assignmentIds = (userAssignments as any[]).map((a: any) => a.id);
  const responsesQueries = useQueries({
    queries: assignmentIds.map(id => ({
      queryKey: [`/api/assignments/${id}/responses`],
      enabled: !!id,
    }))
  });

  // Check if all responses are loaded
  const allResponsesLoaded = responsesQueries.every(q => !q.isLoading);
  const isResponsesLoading = responsesQueries.some(q => q.isLoading);
  
  // Combined loading state
  const isLoading = assignmentsLoading || templatesLoading || isResponsesLoading;

  // Process checklist templates with inspection statistics
  const processChecklistData = () => {
    // Use real user assignments data instead of mock data
    const realInspections = userAssignments.map((assignment: any) => ({
      id: assignment.id,
      title: assignment.inspection?.title || 'İsimsiz Denetim',
      templateId: assignment.inspection?.templateId || '',
      status: assignment.status,
      scorePercentage: assignment.scorePercentage || 0,
      letterGrade: assignment.letterGrade || '',
      completedAt: assignment.completedAt,
      createdAt: assignment.createdAt,
      assignedAt: assignment.assignedAt,
      dueDate: assignment.dueDate,
      // Add necessary data for analysis links
      location: assignment.location,
      inspection: assignment.inspection,
      inspectionId: assignment.inspection?.id
    }));

    const templatesWithStats = checklistTemplates.map((template: any) => {
      const templateInspections = realInspections.filter((inspection: any) => 
        inspection.templateId === template.id
      );
      
      const completedInspections = templateInspections.filter(i => i.status === 'completed');
      
      // Calculate real analysis scores from responses
      const realScores = completedInspections.map((inspection: any) => {
        const responseQuery = responsesQueries.find(q => q.queryKey[0].includes(inspection.id));
        const responses = responseQuery?.data || [];
        const realAnalysis = calculateRealAnalysisScore(responses);
        
        // Update inspection with real score and grade
        inspection.realScore = realAnalysis.score;
        inspection.realGrade = realAnalysis.grade;
        
        return realAnalysis.score;
      });
      
      const averageScore = realScores.length > 0 ? Math.round(realScores.reduce((a: number, b: number) => a + b, 0) / realScores.length) : 0;
      
      const lastInspection = templateInspections.length > 0 ? 
        templateInspections.sort((a: any, b: any) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] : null;
      
      return {
        id: template.id,
        title: template.name || template.title,
        description: template.description,
        inspections: templateInspections.sort((a: any, b: any) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
        totalInspections: templateInspections.length,
        completedInspections: completedInspections.length,
        pendingInspections: templateInspections.filter(i => i.status === 'pending').length,
        inProgressInspections: templateInspections.filter(i => i.status === 'in_progress').length,
        averageScore,
        letterGrade: averageScore >= 90 ? "A" :
                    averageScore >= 75 ? "B" :
                    averageScore >= 50 ? "C" :
                    averageScore >= 25 ? "D" : "E",
        lastInspection
      };
    });
    
    return templatesWithStats.sort((a: any, b: any) => {
      // En son atanan en üstte olacak şekilde (son inspection tarihi)
      const aLastDate = a.lastInspection ? new Date(a.lastInspection.createdAt).getTime() : 0;
      const bLastDate = b.lastInspection ? new Date(b.lastInspection.createdAt).getTime() : 0;
      return bLastDate - aLastDate;
    });
  };

  const checklistsWithStats = processChecklistData();
  
  // Calculate overall stats
  const overallStats = {
    totalInspections: checklistsWithStats.reduce((sum, checklist) => sum + checklist.totalInspections, 0),
    completedInspections: checklistsWithStats.reduce((sum, checklist) => sum + checklist.completedInspections, 0),
    inProgressInspections: checklistsWithStats.reduce((sum, checklist) => sum + checklist.inProgressInspections, 0),
    pendingInspections: checklistsWithStats.reduce((sum, checklist) => sum + checklist.pendingInspections, 0),
    averageScore: checklistsWithStats.length > 0 
      ? Math.round(checklistsWithStats.reduce((sum, checklist) => sum + (checklist.averageScore || 0), 0) / checklistsWithStats.length)
      : 0
  };

  const getGradeColor = (grade: string) => {
    const colors = {
      'A': 'bg-green-100 text-green-800 border-green-200',
      'B': 'bg-blue-100 text-blue-800 border-blue-200',
      'C': 'bg-yellow-100 text-yellow-800 border-yellow-200', 
      'D': 'bg-orange-100 text-orange-800 border-orange-200',
      'E': 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[grade as keyof typeof colors] || colors.E;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'border-l-green-500';
      case 'in_progress': return 'border-l-orange-500';
      case 'pending': return 'border-l-red-500';
      default: return 'border-l-gray-400';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': 
        return <Badge className="bg-green-50 text-green-700 border-green-200">Tamamlandı</Badge>;
      case 'in_progress': 
        return <Badge className="bg-orange-50 text-orange-700 border-orange-200">Devam Ediyor</Badge>;
      case 'pending': 
        return <Badge className="bg-red-50 text-red-700 border-red-200">Beklemede</Badge>;
      default: 
        return <Badge variant="outline">Bilinmiyor</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckSquare className="w-5 h-5 text-green-600" />;
      case 'in_progress': return <Clock className="w-5 h-5 text-orange-600" />;
      case 'pending': return <AlertTriangle className="w-5 h-5 text-red-600" />;
      default: return <ClipboardList className="w-5 h-5 text-gray-600" />;
    }
  };

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
            <h1 className="text-3xl font-bold text-gray-900">Denetim Geçmişim</h1>
            <p className="text-gray-600 mt-1">
              {userHospital?.name || 'Hastane bilgisi yükleniyor...'} - Checklist'ler ve Denetimler
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

      {/* Enhanced Summary Stats with Infographics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <ClipboardList className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">{checklistsWithStats.length}</div>
                <p className="text-sm text-gray-600">Aktif Checklist</p>
              </div>
            </div>
            <div className="w-full bg-blue-100 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: '100%' }}></div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600">
                  {checklistsWithStats.reduce((sum, checklist) => sum + checklist.completedInspections, 0)}
                </div>
                <p className="text-sm text-gray-600">Tamamlanan</p>
              </div>
            </div>
            <div className="w-full bg-green-100 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-500" 
                style={{ 
                  width: `${checklistsWithStats.reduce((sum, checklist) => sum + checklist.totalInspections, 0) > 0 
                    ? (checklistsWithStats.reduce((sum, checklist) => sum + checklist.completedInspections, 0) / 
                       checklistsWithStats.reduce((sum, checklist) => sum + checklist.totalInspections, 0)) * 100 
                    : 0}%` 
                }}
              ></div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-orange-600" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-orange-600">
                  {checklistsWithStats.reduce((sum, checklist) => sum + checklist.inProgressInspections, 0)}
                </div>
                <p className="text-sm text-gray-600">Devam Eden</p>
              </div>
            </div>
            <div className="w-full bg-orange-100 rounded-full h-2">
              <div 
                className="bg-orange-500 h-2 rounded-full transition-all duration-500" 
                style={{ 
                  width: `${checklistsWithStats.reduce((sum, checklist) => sum + checklist.totalInspections, 0) > 0 
                    ? (checklistsWithStats.reduce((sum, checklist) => sum + checklist.inProgressInspections, 0) / 
                       checklistsWithStats.reduce((sum, checklist) => sum + checklist.totalInspections, 0)) * 100 
                    : 0}%` 
                }}
              ></div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <Gauge className="w-6 h-6 text-amber-600" />
              </div>
              <div className="text-right">
                <div className={`text-2xl font-bold ${
                  overallStats.averageScore >= 80 ? 'text-green-600' :
                  overallStats.averageScore >= 60 ? 'text-amber-600' : 'text-red-600'
                }`}>
                  {overallStats.averageScore}%
                </div>
                <p className="text-sm text-gray-600">Ortalama Başarı</p>
              </div>
            </div>
            <div className="w-full bg-amber-100 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${
                  overallStats.averageScore >= 80 ? 'bg-green-500' :
                  overallStats.averageScore >= 60 ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{ width: `${overallStats.averageScore}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Performance Insights Card */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            Performans İstatistikleri
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {checklistsWithStats.filter(c => c.averageScore >= 80).length}
              </div>
              <div className="text-sm text-gray-600 mt-1">Yüksek Performans</div>
              <div className="text-xs text-gray-500">80%+ ortalama</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {checklistsWithStats.filter(c => c.averageScore >= 60 && c.averageScore < 80).length}
              </div>
              <div className="text-sm text-gray-600 mt-1">Orta Performans</div>
              <div className="text-xs text-gray-500">60-79% ortalama</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {checklistsWithStats.filter(c => c.averageScore < 60 && c.averageScore > 0).length}
              </div>
              <div className="text-sm text-gray-600 mt-1">Düşük Performans</div>
              <div className="text-xs text-gray-500">60% altı</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">
                {checklistsWithStats.reduce((sum, checklist) => sum + checklist.pendingInspections, 0)}
              </div>
              <div className="text-sm text-gray-600 mt-1">Bekleyen</div>
              <div className="text-xs text-gray-500">Tamamlanmamış</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Checklist Cards */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Checklist'ler ve Denetimler</h2>
          <div className="text-sm text-gray-600">
            En son atanan denetimler başta gösterilir
          </div>
        </div>

        <div className="space-y-6">
          {checklistsWithStats.map((checklist: any) => (
            <Card key={checklist.id} className="overflow-hidden">
              <CardHeader className="bg-gray-50 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center">
                      <ClipboardList className="w-8 h-8 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl text-gray-900">{checklist.title}</CardTitle>
                      <p className="text-gray-600 mt-1">{checklist.description}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          {checklist.totalInspections} Toplam Denetim
                        </Badge>
                        {checklist.averageScore > 0 && (
                          <div className={`px-3 py-1 rounded-lg border-2 ${getGradeColor(checklist.letterGrade)}`}>
                            <span className="text-lg font-bold">{checklist.letterGrade}</span>
                            <span className="text-sm ml-1">({checklist.averageScore}%)</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="text-center">
                        <div className="font-bold text-green-600">{checklist.completedInspections}</div>
                        <div className="text-gray-600">Tamamlandı</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-orange-600">{checklist.inProgressInspections}</div>
                        <div className="text-gray-600">Devam Eden</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-red-600">{checklist.pendingInspections}</div>
                        <div className="text-gray-600">Bekleyen</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-0">
                {checklist.inspections.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {checklist.inspections.map((inspection: any) => (
                      <div 
                        key={inspection.id} 
                        className={`p-4 border-l-4 ${getStatusColor(inspection.status)} hover:bg-gray-50 transition-colors cursor-pointer`}
                        onClick={() => {
                          if (inspection.status === 'pending' || inspection.status === 'in_progress') {
                            setLocation(`/live-checklist?assignmentId=${inspection.id}`);
                          } else if (inspection.status === 'completed') {
                            // Get inspection assignment details for proper analysis routing
                            const hospitalId = inspection.location?.id;
                            const templateId = inspection.templateId;
                            const assignmentId = inspection.id; // Use assignment ID instead of inspection ID
                            setLocation(`/inspection-analysis/${hospitalId}/${templateId}/${assignmentId}`);
                          }
                        }}
                        data-testid={`inspection-row-${inspection.id}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(inspection.status)}
                            <div>
                              <h4 className="font-semibold text-gray-900">{inspection.title}</h4>
                              <div className="flex items-center gap-4 mt-1">
                                {getStatusBadge(inspection.status)}
                                <span className="text-sm text-gray-600">
                                  {inspection.status === 'completed' && inspection.completedAt
                                    ? `Tamamlandı: ${new Date(inspection.completedAt).toLocaleDateString('tr-TR')}`
                                    : `Oluşturuldu: ${new Date(inspection.createdAt).toLocaleDateString('tr-TR')}`
                                  }
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            {inspection.status === 'completed' && (
                              <div className="text-right">
                                <div className={`text-2xl font-bold ${
                                  (inspection.realScore || 0) >= 80 ? 'text-green-600' :
                                  (inspection.realScore || 0) >= 60 ? 'text-amber-600' : 'text-red-600'
                                }`}>
                                  {inspection.realScore || 0}%
                                </div>
                                <div className={`px-2 py-1 rounded ${getGradeColor(inspection.realGrade || 'E')}`}>
                                  {inspection.realGrade || 'E'} Notu
                                </div>
                              </div>
                            )}
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (inspection.status === 'pending' || inspection.status === 'in_progress') {
                                  setLocation(`/live-checklist?assignmentId=${inspection.id}`);
                                } else if (inspection.status === 'completed') {
                                  // Get inspection assignment details for proper analysis routing
                                  const hospitalId = inspection.location?.id;
                                  const templateId = inspection.templateId;
                                  const assignmentId = inspection.id; // Use assignment ID
                                  setLocation(`/inspection-analysis/${hospitalId}/${templateId}/${assignmentId}`);
                                }
                              }}
                              data-testid={`inspection-action-${inspection.id}`}
                            >
                              {inspection.status === 'completed' ? (
                                <>
                                  <BarChart3 size={14} className="mr-2" />
                                  Analiz
                                </>
                              ) : (
                                <>
                                  <Eye size={14} className="mr-2" />
                                  {inspection.status === 'in_progress' ? 'Devam Et' : 'Başlat'}
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Bu checklist için henüz denetim bulunmuyor.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Empty State */}
      {checklistsWithStats.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <ClipboardList className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Henüz Checklist Bulunmuyor
            </h3>
            <p className="text-gray-600 mb-4">
              Admin tarafından checklist oluşturulduğunda denetim geçmişiniz burada görünecektir.
            </p>
            <Button onClick={() => setLocation('/dashboard')}>
              Ana Sayfaya Dön
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}