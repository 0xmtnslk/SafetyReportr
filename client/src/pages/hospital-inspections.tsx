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
  const { data: inspections = [], isLoading } = useQuery({
    queryKey: ["/api/admin/inspections"],
  });

  // Filter inspections for this specific hospital and group by inspection type
  const processHospitalInspections = () => {
    const hospitalInspections = inspections.filter((inspection: any) => 
      inspection.location?.id === hospitalId
    );
    
    if (hospitalInspections.length === 0) return { hospital: null, inspectionTypes: [] };
    
    const hospital = {
      id: hospitalId,
      name: hospitalInspections[0]?.location?.name || 'Bilinmeyen Hastane'
    };
    
    const typeMap: Record<string, any> = {};
    
    hospitalInspections.forEach((inspection: any) => {
      const checklistId = inspection.inspection?.id || 'unknown';
      const checklistTitle = inspection.inspection?.title || 'Bilinmeyen Kontrol Listesi';
      
      if (!typeMap[checklistId]) {
        typeMap[checklistId] = {
          id: checklistId,
          title: checklistTitle,
          inspections: [],
          totalInspections: 0,
          averageScore: 0,
          letterGrade: 'E',
          lastInspection: null,
          uniqueTitles: new Set()
        };
      }
      
      typeMap[checklistId].inspections.push(inspection);
      typeMap[checklistId].totalInspections++;
      typeMap[checklistId].uniqueTitles.add(inspection.inspectionTitle || inspection.title || 'Belirsiz Denetim');
      
      if (!typeMap[checklistId].lastInspection || 
          new Date(inspection.completedAt) > new Date(typeMap[checklistId].lastInspection.completedAt)) {
        typeMap[checklistId].lastInspection = inspection;
      }
    });
    
    // Calculate statistics for each inspection type
    Object.values(typeMap).forEach((type: any) => {
      const scores = type.inspections.map((i: any) => i.scorePercentage || 0);
      type.averageScore = scores.length > 0 ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : 0;
      type.letterGrade = type.averageScore >= 90 ? "A" :
                        type.averageScore >= 75 ? "B" :
                        type.averageScore >= 50 ? "C" :
                        type.averageScore >= 25 ? "D" : "E";
      type.periodCount = type.uniqueTitles.size;
    });
    
    return {
      hospital,
      inspectionTypes: Object.values(typeMap).sort((a: any, b: any) => b.averageScore - a.averageScore)
    };
  };

  const { hospital, inspectionTypes } = processHospitalInspections();

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

  if (isLoading) {
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
  const totalInspections = inspectionTypes.reduce((sum: number, type: any) => sum + type.totalInspections, 0);
  const overallAverage = inspectionTypes.length > 0 ? 
    Math.round(inspectionTypes.reduce((sum: number, type: any) => sum + type.averageScore, 0) / inspectionTypes.length) : 0;

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
          <Badge variant="outline">{inspectionTypes.length} Denetim Çeşidi</Badge>
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
            <div className="text-2xl font-bold text-gray-900">{inspectionTypes.length}</div>
            <p className="text-sm text-gray-600">Denetim Çeşidi</p>
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

      {/* Inspection Types List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5" />
            Denetim Çeşitleri
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {inspectionTypes.map((type: any) => (
              <div 
                key={type.id} 
                className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => setLocation(`/inspection-type-detail/${hospitalId}/${type.id}`)}
              >
                <div className="flex items-center justify-between">
                  {/* Type Info */}
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                      <CheckSquare className="w-6 h-6 text-white" />
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900">{type.title}</h3>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>{type.periodCount} Denetim Dönemi</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <BarChart3 className="w-4 h-4" />
                          <span>{type.totalInspections} Toplam Denetim</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          Son: {type.lastInspection ? 
                            new Date(type.lastInspection.completedAt).toLocaleDateString('tr-TR', { 
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
                  
                  {/* Stats */}
                  <div className="flex items-center gap-6 flex-shrink-0">
                    <div className="text-center">
                      <div className={`text-3xl font-bold ${getScoreColor(type.averageScore)}`}>
                        {type.averageScore}%
                      </div>
                      <p className="text-xs text-gray-500">Ortalama Puan</p>
                    </div>
                    
                    <div className={`px-4 py-3 rounded-xl border-2 ${getGradeColor(type.letterGrade)}`}>
                      <div className="text-2xl font-bold text-center">{type.letterGrade}</div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <TrendingUp size={14} className="mr-2" />
                        Trend Analizi
                      </Button>
                      
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                        <Eye size={14} className="mr-2" />
                        Detaylar
                      </Button>
                    </div>
                    
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Empty State */}
      {inspectionTypes.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <CheckSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Denetim Bulunamadı
            </h3>
            <p className="text-gray-600">
              Bu hastane için henüz denetim kaydı bulunmuyor.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}