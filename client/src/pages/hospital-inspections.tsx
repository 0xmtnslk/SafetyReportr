import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Building2, TrendingUp, Award, Eye, CheckSquare, Calendar, BarChart3, ChevronRight } from "lucide-react";
import { useLocation, useRoute } from "wouter";

export default function HospitalInspections() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/hospital-inspections/:hospitalId");
  const hospitalId = params?.hospitalId;

  // Fetch all completed inspections for this hospital
  const { data: inspections = [], isLoading: inspectionsLoading } = useQuery({
    queryKey: ["/api/admin/inspections"],
  });
  
  // Fetch checklist templates
  const { data: checklistTemplates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ["/api/checklist/templates"],
  });

  // Process hospital data and checklist templates
  const processHospitalData = () => {
    const hospitalInspections = inspections.filter((inspection: any) => 
      inspection.location?.id === hospitalId
    );
    
    // Find hospital name from any available data or use a default
    let hospital = {
      id: hospitalId,
      name: hospitalInspections.length > 0 ? 
        hospitalInspections[0]?.location?.name || 'Bilinmeyen Hastane' : 
        'Seçilen Hastane'
    };
    
    // Process checklist templates with their statistics
    const templatesWithStats = checklistTemplates.map((template: any) => {
      const templateInspections = hospitalInspections.filter((inspection: any) => 
        inspection.inspection?.id === template.id
      );
      
      const scores = templateInspections.map((i: any) => i.scorePercentage || 0);
      const averageScore = scores.length > 0 ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : 0;
      
      // Count unique inspection titles for this template
      const uniqueTitles = new Set();
      templateInspections.forEach((inspection: any) => {
        uniqueTitles.add(inspection.inspectionTitle || inspection.title || 'Belirsiz Denetim');
      });
      
      const lastInspection = templateInspections.length > 0 ? 
        templateInspections.sort((a: any, b: any) => 
          new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())[0] : null;
      
      return {
        id: template.id,
        title: template.title,
        description: template.description,
        inspections: templateInspections,
        totalInspections: templateInspections.length,
        averageScore,
        letterGrade: averageScore >= 90 ? "A" :
                    averageScore >= 75 ? "B" :
                    averageScore >= 50 ? "C" :
                    averageScore >= 25 ? "D" : "E",
        inspectionTitleCount: uniqueTitles.size,
        lastInspection
      };
    });
    
    return {
      hospital,
      checklistTemplates: templatesWithStats.sort((a: any, b: any) => b.averageScore - a.averageScore)
    };
  };

  const { hospital, checklistTemplates: hospitalChecklists } = processHospitalData();

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

  if (inspectionsLoading || templatesLoading) {
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

  if (!hospital) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Hastane Bulunamadı
            </h3>
            <p className="text-gray-600">
              Bu hastane için denetim kaydı bulunamadı.
            </p>
            <Button className="mt-4" onClick={() => setLocation('/inspection-results-admin')}>
              <ArrowLeft size={16} className="mr-2" />
              Geri Dön
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate overall hospital statistics
  const totalInspections = hospitalChecklists.reduce((sum: number, checklist: any) => sum + checklist.totalInspections, 0);
  const overallAverage = hospitalChecklists.length > 0 ? 
    Math.round(hospitalChecklists.reduce((sum: number, checklist: any) => sum + checklist.averageScore, 0) / hospitalChecklists.length) : 0;

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setLocation('/inspection-results-admin')}>
            <ArrowLeft size={16} className="mr-2" />
            Hastane Listesi
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{hospital.name}</h1>
            <p className="text-gray-600 mt-1">Denetim çeşitleri ve performans özeti</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline">{hospitalChecklists.length} Kontrol Listesi</Badge>
          <Badge className="bg-blue-100 text-blue-800">
            {totalInspections} Toplam Denetim
          </Badge>
        </div>
      </div>

      {/* Hospital Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <CheckSquare className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{hospitalChecklists.length}</div>
            <p className="text-sm text-gray-600">Kontrol Listesi</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{totalInspections}</div>
            <p className="text-sm text-gray-600">Toplam Denetim</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <BarChart3 className="w-6 h-6 text-purple-600" />
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

      {/* Checklist Templates List */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-6">
          <CheckSquare className="w-5 h-5 text-gray-600" />
          <h2 className="text-xl font-semibold text-gray-900">Kontrol Listeleri</h2>
        </div>
        
        {hospitalChecklists.map((checklist: any) => (
          <Card 
            key={checklist.id} 
            className="hover:shadow-lg transition-all duration-200 cursor-pointer border-l-4 border-l-blue-500"
            onClick={() => setLocation(`/checklist-inspections/${hospitalId}/${checklist.id}`)}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                {/* Sol Taraf - Denetim Türü Bilgileri */}
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <CheckSquare className="w-6 h-6 text-blue-600" />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{checklist.title}</h3>
                    <div className="flex items-center gap-6 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{checklist.inspectionTitleCount} Denetim Başlığı</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <BarChart3 className="w-4 h-4" />
                        <span>{checklist.totalInspections} Toplam Denetim</span>
                      </div>
                      <div>
                        Son: {checklist.lastInspection ? 
                          new Date(checklist.lastInspection.completedAt).toLocaleDateString('tr-TR', { 
                            day: '2-digit', 
                            month: '2-digit',
                            year: '2-digit'
                          }) : 
                          'N/A'
                        }
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Sağ Taraf - Puan ve Aksiyonlar */}
                <div className="flex items-center gap-6 flex-shrink-0">
                  {/* Ortalama Puan */}
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${getScoreColor(checklist.averageScore)}`}>
                      {checklist.averageScore}%
                    </div>
                    <p className="text-xs text-gray-500">Ortalama Puan</p>
                  </div>
                  
                  {/* Harf Notu */}
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center border-4 ${getGradeColor(checklist.letterGrade)}`}>
                    <div className="text-2xl font-bold">{checklist.letterGrade}</div>
                  </div>
                  
                  {/* Aksiyon Butonları */}
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        alert(`${checklist.title} trend analizi geliştiriliyor...`);
                      }}
                    >
                      <TrendingUp size={14} className="mr-1" />
                      Trend Analizi
                    </Button>
                    
                    <Button 
                      size="sm" 
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLocation(`/checklist-inspections/${hospitalId}/${checklist.id}`);
                      }}
                    >
                      <Eye size={14} className="mr-1" />
                      Detaylar
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
      {hospitalChecklists.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <CheckSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Kontrol Listesi Bulunamadı
            </h3>
            <p className="text-gray-600">
              Bu hastane için henüz kontrol listesi denetimi bulunmuyor.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}