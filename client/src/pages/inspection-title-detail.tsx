import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileText, TrendingUp, Award, BarChart3, CheckCircle, XCircle, AlertCircle, Calendar, Target, Users, Activity } from "lucide-react";
import { useLocation, useRoute } from "wouter";

export default function InspectionTitleDetail() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/inspection-title-detail/:hospitalId/:typeId/:titleName");
  const hospitalId = params?.hospitalId;
  const typeId = params?.typeId;
  const titleName = params?.titleName ? decodeURIComponent(params.titleName) : '';

  // Fetch all completed inspections
  const { data: inspections = [], isLoading } = useQuery({
    queryKey: ["/api/admin/inspections"],
  });

  // Process data for this specific inspection title
  const processInspectionTitleData = () => {
    const relevantInspections = inspections.filter((inspection: any) => 
      inspection.location?.id === hospitalId && 
      inspection.inspection?.id === typeId &&
      (inspection.inspectionTitle === titleName || inspection.title === titleName)
    );
    
    if (relevantInspections.length === 0) return { hospital: null, inspectionType: null, titleData: null };
    
    const hospital = {
      id: hospitalId,
      name: relevantInspections[0]?.location?.name || 'Bilinmeyen Hastane'
    };
    
    const inspectionType = {
      id: typeId,
      title: relevantInspections[0]?.inspection?.title || 'Bilinmeyen Kontrol Listesi'
    };

    // Analyze all inspections for this title
    const scores = relevantInspections.map((i: any) => i.scorePercentage || 0);
    const averageScore = scores.length > 0 ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : 0;
    
    // Calculate category statistics by analyzing inspection results
    const categoryStats: Record<string, any> = {};
    
    relevantInspections.forEach((inspection: any) => {
      if (inspection.results && Array.isArray(inspection.results)) {
        inspection.results.forEach((result: any) => {
          if (result.section) {
            const sectionName = result.section.title || result.section.name || 'Bilinmeyen Kategori';
            
            if (!categoryStats[sectionName]) {
              categoryStats[sectionName] = {
                name: sectionName,
                totalQuestions: 0,
                answeredQuestions: 0,
                correctAnswers: 0,
                scorePercentage: 0,
                letterGrade: 'E'
              };
            }
            
            if (result.responses && Array.isArray(result.responses)) {
              result.responses.forEach((response: any) => {
                categoryStats[sectionName].totalQuestions++;
                if (response.answer !== undefined && response.answer !== null) {
                  categoryStats[sectionName].answeredQuestions++;
                  // Assume boolean answers: true = correct, false = incorrect
                  if (response.answer === true || response.answer === 'true' || response.answer === 1) {
                    categoryStats[sectionName].correctAnswers++;
                  }
                }
              });
            }
          }
        });
      }
    });

    // Calculate percentages and grades for each category
    Object.values(categoryStats).forEach((category: any) => {
      if (category.totalQuestions > 0) {
        category.scorePercentage = Math.round((category.correctAnswers / category.totalQuestions) * 100);
        category.letterGrade = category.scorePercentage >= 90 ? "A" :
                             category.scorePercentage >= 75 ? "B" :
                             category.scorePercentage >= 50 ? "C" :
                             category.scorePercentage >= 25 ? "D" : "E";
      }
    });
    
    return {
      hospital,
      inspectionType,
      titleData: {
        title: titleName,
        inspections: relevantInspections,
        totalInspections: relevantInspections.length,
        averageScore,
        letterGrade: averageScore >= 90 ? "A" :
                    averageScore >= 75 ? "B" :
                    averageScore >= 50 ? "C" :
                    averageScore >= 25 ? "D" : "E",
        categoryStats: Object.values(categoryStats),
        lastInspection: relevantInspections.sort((a: any, b: any) => 
          new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())[0]
      }
    };
  };

  const { hospital, inspectionType, titleData } = processInspectionTitleData();

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
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!hospital || !inspectionType || !titleData) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Denetim Detayı Bulunamadı
            </h3>
            <p className="text-gray-600">
              Bu denetim başlığı için detay bulunamadı.
            </p>
            <Button className="mt-4" onClick={() => setLocation(`/inspection-type-detail/${hospitalId}/${typeId}`)}>
              <ArrowLeft size={16} className="mr-2" />
              Geri Dön
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalQuestions = titleData.categoryStats.reduce((sum: number, cat: any) => sum + cat.totalQuestions, 0);
  const totalCorrect = titleData.categoryStats.reduce((sum: number, cat: any) => sum + cat.correctAnswers, 0);

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setLocation(`/inspection-type-detail/${hospitalId}/${typeId}`)}>
            <ArrowLeft size={16} className="mr-2" />
            {inspectionType.title}
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{titleData.title}</h1>
            <p className="text-gray-600 mt-1">{hospital.name} - Detaylı kategori analizi</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline">{titleData.categoryStats.length} Kategori</Badge>
          <Badge className="bg-blue-100 text-blue-800">
            {titleData.totalInspections} Denetim
          </Badge>
        </div>
      </div>

      {/* Overall Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{totalQuestions}</div>
            <p className="text-sm text-gray-600">Toplam Soru</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-600">{totalCorrect}</div>
            <p className="text-sm text-gray-600">Doğru Cevap</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
            <div className={`text-2xl font-bold ${getScoreColor(titleData.averageScore)}`}>{titleData.averageScore}%</div>
            <p className="text-sm text-gray-600">Genel Başarı</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Award className="w-6 h-6 text-orange-600" />
            </div>
            <div className={`px-3 py-1 rounded-lg border-2 ${getGradeColor(titleData.letterGrade)}`}>
              <div className="text-xl font-bold text-center">{titleData.letterGrade}</div>
            </div>
            <p className="text-sm text-gray-600">Genel Not</p>
          </CardContent>
        </Card>
      </div>

      {/* Inspection History Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Denetim Geçmişi Özeti
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Toplam Denetim Sayısı</p>
              <p className="text-2xl font-bold text-gray-900">{titleData.totalInspections}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Son Denetim Tarihi</p>
              <p className="text-lg font-semibold text-gray-900">
                {titleData.lastInspection ? 
                  new Date(titleData.lastInspection.completedAt).toLocaleDateString('tr-TR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                  }) : 
                  'N/A'
                }
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Performans Trendi</p>
              <div className="flex items-center gap-2">
                <TrendingUp className={`w-5 h-5 ${titleData.averageScore >= 75 ? 'text-green-500' : titleData.averageScore >= 50 ? 'text-yellow-500' : 'text-red-500'}`} />
                <span className={`font-semibold ${titleData.averageScore >= 75 ? 'text-green-600' : titleData.averageScore >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {titleData.averageScore >= 75 ? 'İyi' : titleData.averageScore >= 50 ? 'Orta' : 'Zayıf'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Analysis Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Kategori Bazlı Detaylı Analiz
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Kategori</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Toplam Soru</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Doğru Cevap</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Yanlış Cevap</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Başarı Oranı</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Harf Notu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {titleData.categoryStats.map((category: any, index: number) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{category.name}</p>
                          <p className="text-sm text-gray-500">Değerlendirme kategorisi</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-lg font-semibold text-gray-900">{category.totalQuestions}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="text-lg font-semibold text-green-600">{category.correctAnswers}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <XCircle className="w-5 h-5 text-red-500" />
                        <span className="text-lg font-semibold text-red-600">{category.totalQuestions - category.correctAnswers}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className={`text-2xl font-bold ${getScoreColor(category.scorePercentage)}`}>
                          {category.scorePercentage}%
                        </span>
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              category.scorePercentage >= 90 ? 'bg-green-500' :
                              category.scorePercentage >= 75 ? 'bg-blue-500' :
                              category.scorePercentage >= 50 ? 'bg-yellow-500' :
                              category.scorePercentage >= 25 ? 'bg-orange-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${category.scorePercentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 mx-auto ${getGradeColor(category.letterGrade)}`}>
                        <div className="text-lg font-bold">{category.letterGrade}</div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Empty State */}
      {titleData.categoryStats.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Kategori Analizi Bulunamadı
            </h3>
            <p className="text-gray-600">
              Bu denetim için kategori bazlı analiz verisi bulunamadı.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}