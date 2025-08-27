import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Building2, TrendingUp, Award, Eye, CheckSquare, Calendar, BarChart3, ChevronRight, FileText, Users, Activity } from "lucide-react";
import { useLocation, useRoute } from "wouter";

export default function ChecklistInspections() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/checklist-inspections/:hospitalId/:checklistId");
  const hospitalId = params?.hospitalId;
  const checklistId = params?.checklistId;

  // Fetch all inspection titles
  const { data: inspectionTitles = [], isLoading: inspectionsLoading } = useQuery({
    queryKey: ["/api/admin/inspection-titles"],
  });
  
  
  // Fetch all completed inspections
  const { data: completedInspections = [], isLoading: completedLoading } = useQuery({
    queryKey: ["/api/admin/inspections"],
  });
  
  // Fetch checklist template details
  const { data: checklistTemplates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ["/api/checklist/templates"],
  });

  // Process data for this specific hospital and checklist template
  const processChecklistData = () => {
    // Filter inspection titles for this checklist template AND this hospital
    const relevantInspectionTitles = (inspectionTitles as any[]).filter((inspection: any) => {
      // Check if inspection matches template
      const matchesTemplate = inspection.templateId === checklistId;
      
      // Check if inspection is assigned to this hospital
      const assignedToHospital = inspection.targetLocationIds && 
        inspection.targetLocationIds.includes(hospitalId);
      
      return matchesTemplate && assignedToHospital;
    });
    
    // Filter completed inspections for this hospital
    const hospitalInspections = (completedInspections as any[]).filter((inspection: any) => 
      inspection.location?.id === hospitalId
    );
    
    if ((inspectionTitles as any[]).length === 0) return { hospital: null, checklistTemplate: null, inspectionTitles: [] };
    
    // Get hospital name from completed inspections
    const hospital = {
      id: hospitalId,
      name: hospitalInspections[0]?.location?.name || 'Bilinmeyen Hastane'
    };
    
    const checklistTemplate = (checklistTemplates as any[]).find((template: any) => template.id === checklistId) || {
      id: checklistId,
      title: relevantInspectionTitles[0]?.template?.name || 'Bilinmeyen Kontrol Listesi',
      description: ''
    };
    
    // Process inspection titles with their assignments
    const inspectionTitlesList = relevantInspectionTitles.map((inspectionTitle: any) => {
      // Find completed inspections for this title and hospital
      const titleAssignments = hospitalInspections.filter((comp: any) => 
        comp.inspectionId === inspectionTitle.id
      );
      
      const scores = titleAssignments.map((assignment: any) => assignment.scorePercentage || 0);
      const averageScore = scores.length > 0 ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : 0;
      const letterGrade = averageScore >= 90 ? "A" :
                         averageScore >= 75 ? "B" :
                         averageScore >= 50 ? "C" :
                         averageScore >= 25 ? "D" : "E";
      
      return {
        id: inspectionTitle.id,
        title: inspectionTitle.title,
        description: inspectionTitle.description,
        totalInspections: titleAssignments.length,
        averageScore,
        letterGrade,
        lastInspection: titleAssignments.length > 0 ? titleAssignments.sort((a: any, b: any) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())[0] : null,
        firstInspection: titleAssignments.length > 0 ? titleAssignments.sort((a: any, b: any) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime())[0] : null,
        inspections: titleAssignments
      };
    });
    
    return {
      hospital,
      checklistTemplate,
      inspectionTitles: inspectionTitlesList.sort((a: any, b: any) => b.averageScore - a.averageScore)
    };
  };

  const { hospital, checklistTemplate, inspectionTitles: processedTitles } = processChecklistData();

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

  const getScoreColor = (percentage: number) => {
    if (percentage >= 90) return "text-green-600";
    if (percentage >= 75) return "text-blue-600";
    if (percentage >= 50) return "text-yellow-600";
    if (percentage >= 25) return "text-orange-600";
    return "text-red-600";
  };

  if (inspectionsLoading || templatesLoading || completedLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!hospital || !checklistTemplate) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <CheckSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Kontrol Listesi Bulunamadı
            </h3>
            <p className="text-gray-600">
              Bu kontrol listesi için denetim kaydı bulunamadı.
            </p>
            <Button className="mt-4" onClick={() => setLocation(`/hospital-inspections/${hospitalId}`)}>
              <ArrowLeft size={16} className="mr-2" />
              Geri Dön
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate overall statistics
  const totalInspections = processedTitles.reduce((sum: number, title: any) => sum + title.totalInspections, 0);
  const overallAverage = processedTitles.length > 0 ? 
    Math.round(processedTitles.reduce((sum: number, title: any) => sum + title.averageScore, 0) / processedTitles.length) : 0;

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setLocation(`/hospital-inspections/${hospitalId}`)}>
            <ArrowLeft size={16} className="mr-2" />
            {hospital.name}
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{checklistTemplate.title}</h1>
            <p className="text-gray-600 mt-1">Denetim başlıkları ve performans analizi</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline">{processedTitles.length} Denetim Başlığı</Badge>
          <Badge className="bg-blue-100 text-blue-800">
            {totalInspections} Toplam Denetim
          </Badge>
        </div>
      </div>

      {/* General Analysis Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{processedTitles.length}</div>
            <p className="text-sm text-gray-600">Denetim Başlığı</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{totalInspections}</div>
            <p className="text-sm text-gray-600">Toplam Denetim</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <div className={`text-2xl font-bold ${getScoreColor(overallAverage)}`}>{overallAverage}%</div>
            <p className="text-sm text-gray-600">Genel Ortalama</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Award className="w-6 h-6 text-orange-600" />
            </div>
            <div className={`px-3 py-1 rounded-lg border-2 ${getGradeColor(
              overallAverage >= 90 ? "A" :
              overallAverage >= 75 ? "B" :
              overallAverage >= 50 ? "C" :
              overallAverage >= 25 ? "D" : "E"
            )}`}>
              <div className="text-xl font-bold text-center">
                {overallAverage >= 90 ? "A" :
                 overallAverage >= 75 ? "B" :
                 overallAverage >= 50 ? "C" :
                 overallAverage >= 25 ? "D" : "E"}
              </div>
            </div>
            <p className="text-sm text-gray-600">Genel Not</p>
          </CardContent>
        </Card>
      </div>

      {/* Trend Analysis Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Trend Analizi ve Genel Değerlendirme
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Performans Özeti</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">En Yüksek Performans:</span>
                  <span className="font-semibold">{processedTitles[0]?.averageScore || 0}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">En Düşük Performans:</span>
                  <span className="font-semibold">{processedTitles[processedTitles.length - 1]?.averageScore || 0}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Başarılı Denetimler (≥75%):</span>
                  <span className="font-semibold">{processedTitles.filter((t: any) => t.averageScore >= 75).length}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Genel Durum</h4>
              <div className="space-y-2">
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full ${
                      overallAverage >= 90 ? 'bg-green-500' :
                      overallAverage >= 75 ? 'bg-blue-500' :
                      overallAverage >= 50 ? 'bg-yellow-500' :
                      overallAverage >= 25 ? 'bg-orange-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${overallAverage}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600">
                  {overallAverage >= 90 ? "Mükemmel performans gösteriliyor" :
                   overallAverage >= 75 ? "İyi performans seviyesinde" :
                   overallAverage >= 50 ? "Orta seviye performans" :
                   overallAverage >= 25 ? "Geliştirilmesi gereken alanlar var" :
                   "Acil iyileştirme gerekiyor"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inspection Titles List */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-6">
          <FileText className="w-5 h-5 text-gray-600" />
          <h2 className="text-xl font-semibold text-gray-900">Denetim Başlıkları</h2>
        </div>
        
        {processedTitles.map((title: any, index: number) => (
          <Card 
            key={index} 
            className="hover:shadow-lg transition-all duration-200 cursor-pointer border-l-4 border-l-blue-500"
            onClick={() => setLocation(`/inspection-title-detail/${hospitalId}/${checklistId}/${encodeURIComponent(title.title)}`)}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                {/* Sol Taraf - Denetim Başlığı Bilgileri */}
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-6 h-6 text-indigo-600" />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{title.title}</h3>
                    <div className="flex items-center gap-6 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{title.totalInspections} Denetim</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Activity className="w-4 h-4" />
                        <span>
                          {title.firstInspection && title.lastInspection ? 
                            `${new Date(title.firstInspection.completedAt).toLocaleDateString('tr-TR', { month: '2-digit', year: '2-digit' })} - ${new Date(title.lastInspection.completedAt).toLocaleDateString('tr-TR', { month: '2-digit', year: '2-digit' })}` :
                            'Tek denetim'
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Sağ Taraf - Puan ve Aksiyonlar */}
                <div className="flex items-center gap-6 flex-shrink-0">
                  {/* Ortalama Puan */}
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${getScoreColor(title.averageScore)}`}>
                      {title.averageScore}%
                    </div>
                    <p className="text-xs text-gray-500">Ortalama Puan</p>
                  </div>
                  
                  {/* Harf Notu */}
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center border-4 ${getGradeColor(title.letterGrade)}`}>
                    <div className="text-2xl font-bold">{title.letterGrade}</div>
                  </div>
                  
                  {/* Aksiyon Butonları */}
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        alert(`${title.title} trend analizi geliştiriliyor...`);
                      }}
                    >
                      <TrendingUp size={14} className="mr-1" />
                      Trend
                    </Button>
                    
                    <Button 
                      size="sm" 
                      className="bg-indigo-600 hover:bg-indigo-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLocation(`/inspection-title-detail/${hospitalId}/${checklistId}/${encodeURIComponent(title.title)}`);
                      }}
                    >
                      <Eye size={14} className="mr-1" />
                      Detaylı Analiz
                    </Button>
                  </div>
                  
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {inspectionTitles.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Denetim Başlığı Bulunamadı
            </h3>
            <p className="text-gray-600">
              Bu kontrol listesi için denetim başlığı bulunamadı.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}