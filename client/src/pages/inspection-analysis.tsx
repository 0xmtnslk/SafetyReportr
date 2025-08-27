import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Building2, CheckSquare, Award, TrendingUp, AlertTriangle, Target, BarChart3, PieChart, FileText, Calendar, User } from "lucide-react";
import { useLocation, useRoute } from "wouter";

export default function InspectionAnalysis() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/inspection-analysis/:hospitalId/:checklistId/:inspectionId");
  const { hospitalId, checklistId, inspectionId } = params || {};

  // Fetch inspection assignments for this specific inspection
  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery({
    queryKey: [`/api/inspections/${inspectionId}/assignments`],
  });

  // Fetch checklist template structure
  const { data: checklistSections = [], isLoading: sectionsLoading } = useQuery({
    queryKey: [`/api/checklist/templates/${checklistId}/sections`],
  });

  // Fetch checklist template info
  const { data: checklistTemplates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ["/api/checklist/templates"],
  });

  // Fetch hospitals for name lookup
  const { data: hospitals = [], isLoading: hospitalsLoading } = useQuery({
    queryKey: ["/api/admin/hospitals"],
  });

  const isLoading = assignmentsLoading || sectionsLoading || templatesLoading || hospitalsLoading;

  // Get hospital and template info
  const hospital = hospitals.find((h: any) => h.id === hospitalId);
  const template = checklistTemplates.find((t: any) => t.id === checklistId);

  // Process detailed analysis data
  const processDetailedAnalysis = () => {
    if (!checklistSections.length) return null;

    const analysisData: any = {
      sections: [],
      overall: {
        totalQuestions: 0,
        totalPossiblePoints: 0,
        totalEarnedPoints: 0,
        meetsCriteria: 0,
        partiallyMeets: 0,
        doesNotMeet: 0,
        outOfScope: 0
      }
    };

    // Process each section
    checklistSections.forEach((section: any) => {
      const sectionData = {
        id: section.id,
        title: section.name,
        questions: [],
        summary: {
          total: 0,
          meets: 0,
          partial: 0,
          doesNotMeet: 0,
          outOfScope: 0,
          maxPoints: 0,
          earnedPoints: 0,
          successRate: 0,
          grade: 'E'
        }
      };

      // Get questions for this section (mock data for now)
      const sectionQuestions = generateMockQuestions(section.name);
      
      sectionQuestions.forEach((question: any) => {
        const questionData = {
          id: question.id,
          text: question.text,
          category: question.category,
          maxPoints: question.maxPoints,
          earnedPoints: question.earnedPoints,
          status: question.status, // 'meets', 'partial', 'doesNotMeet', 'outOfScope'
          successRate: Math.round((question.earnedPoints / question.maxPoints) * 100) || 0
        };

        sectionData.questions.push(questionData);
        sectionData.summary.total++;
        sectionData.summary.maxPoints += question.maxPoints;
        sectionData.summary.earnedPoints += question.earnedPoints;

        // Count status types
        switch (question.status) {
          case 'meets':
            sectionData.summary.meets++;
            break;
          case 'partial':
            sectionData.summary.partial++;
            break;
          case 'doesNotMeet':
            sectionData.summary.doesNotMeet++;
            break;
          case 'outOfScope':
            sectionData.summary.outOfScope++;
            break;
        }
      });

      // Calculate section success rate and grade
      sectionData.summary.successRate = Math.round((sectionData.summary.earnedPoints / sectionData.summary.maxPoints) * 100) || 0;
      sectionData.summary.grade = getGradeFromPercentage(sectionData.summary.successRate);

      analysisData.sections.push(sectionData);

      // Add to overall totals
      analysisData.overall.totalQuestions += sectionData.summary.total;
      analysisData.overall.totalPossiblePoints += sectionData.summary.maxPoints;
      analysisData.overall.totalEarnedPoints += sectionData.summary.earnedPoints;
      analysisData.overall.meetsCriteria += sectionData.summary.meets;
      analysisData.overall.partiallyMeets += sectionData.summary.partial;
      analysisData.overall.doesNotMeet += sectionData.summary.doesNotMeet;
      analysisData.overall.outOfScope += sectionData.summary.outOfScope;
    });

    return analysisData;
  };

  // Mock data generator (replace with real data processing)
  const generateMockQuestions = (sectionTitle: string) => {
    const questionTemplates = [
      { text: "Ateş ve Acil Durum Yönetimi", category: "Güvenlik", maxPoints: 10 },
      { text: "Altyapı", category: "Altyapı", maxPoints: 8 },
      { text: "Emniyet", category: "Güvenlik", maxPoints: 12 },
      { text: "Güvenlik", category: "Güvenlik", maxPoints: 15 },
      { text: "Tıbbi Cihaz Yönetimi", category: "Tıbbi", maxPoints: 20 },
      { text: "Makine-Cihaz Yönetimi", category: "Teknik", maxPoints: 18 },
      { text: "Tehlikeli Madde Yönetimi", category: "Güvenlik", maxPoints: 25 },
      { text: "Atık Yönetimi", category: "Çevre", maxPoints: 14 },
      { text: "Yangın Güvenliği", category: "Güvenlik", maxPoints: 22 }
    ];

    return questionTemplates.slice(0, Math.floor(Math.random() * 7) + 3).map((template, index) => {
      const earnedPoints = Math.floor(Math.random() * template.maxPoints);
      const successRate = (earnedPoints / template.maxPoints) * 100;
      
      let status = 'meets';
      if (successRate < 30) status = 'doesNotMeet';
      else if (successRate < 70) status = 'partial';
      else if (Math.random() > 0.9) status = 'outOfScope';

      return {
        id: `${sectionTitle}-${index}`,
        text: template.text,
        category: template.category,
        maxPoints: template.maxPoints,
        earnedPoints: status === 'outOfScope' ? 0 : earnedPoints,
        status
      };
    });
  };

  const getGradeFromPercentage = (percentage: number) => {
    if (percentage >= 90) return 'A';
    if (percentage >= 75) return 'B';
    if (percentage >= 50) return 'C';
    if (percentage >= 25) return 'D';
    return 'E';
  };

  const getGradeColor = (grade: string) => {
    const colors = {
      'A': 'bg-green-500 text-white',
      'B': 'bg-blue-500 text-white',
      'C': 'bg-yellow-500 text-white',
      'D': 'bg-orange-500 text-white',
      'E': 'bg-red-500 text-white'
    };
    return colors[grade as keyof typeof colors] || colors.E;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'meets': 'bg-green-100 text-green-800',
      'partial': 'bg-yellow-100 text-yellow-800',
      'doesNotMeet': 'bg-red-100 text-red-800',
      'outOfScope': 'bg-gray-100 text-gray-800'
    };
    return colors[status as keyof typeof colors] || colors.doesNotMeet;
  };

  const getStatusText = (status: string) => {
    const texts = {
      'meets': 'Karşılıyor',
      'partial': 'Kısmen Karşılıyor',
      'doesNotMeet': 'Karşılamıyor',
      'outOfScope': 'Kapsam Dışı'
    };
    return texts[status as keyof typeof texts] || 'Bilinmeyen';
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-40 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const analysis = processDetailedAnalysis();
  
  if (!analysis) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Denetim Detayları Bulunamadı
            </h3>
            <p className="text-gray-600">
              Bu denetim için detaylı analiz verisi mevcut değil.
            </p>
            <Button className="mt-4" onClick={() => setLocation(`/checklist-inspections/${hospitalId}/${checklistId}`)}>
              <ArrowLeft size={16} className="mr-2" />
              Geri Dön
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const overallSuccessRate = Math.round((analysis.overall.totalEarnedPoints / analysis.overall.totalPossiblePoints) * 100) || 0;
  const overallGrade = getGradeFromPercentage(overallSuccessRate);

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setLocation(`/checklist-inspections/${hospitalId}/${checklistId}`)}>
            <ArrowLeft size={16} className="mr-2" />
            Denetim Başlıkları
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Detaylı Denetim Analizi</h1>
            <p className="text-gray-600 mt-1">
              {hospital?.name} - {template?.name}
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

      {/* Overall Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <CheckSquare className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{analysis.overall.totalQuestions}</div>
            <p className="text-sm text-gray-600">Toplam Soru</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Target className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-600">{analysis.overall.meetsCriteria}</div>
            <p className="text-sm text-gray-600">Karşılıyor</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="text-2xl font-bold text-yellow-600">{analysis.overall.partiallyMeets}</div>
            <p className="text-sm text-gray-600">Kısmen</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-purple-600">{overallSuccessRate}%</div>
            <p className="text-sm text-gray-600">Başarı Oranı</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Award className="w-6 h-6 text-orange-600" />
            </div>
            <div className={`px-4 py-2 rounded-lg font-bold text-xl ${getGradeColor(overallGrade)}`}>
              {overallGrade}
            </div>
            <p className="text-sm text-gray-600">Genel Not</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Genel İlerleme Özeti
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Genel Başarı Oranı</span>
                <span className="text-sm text-gray-600">{overallSuccessRate}%</span>
              </div>
              <Progress value={overallSuccessRate} className="h-3" />
            </div>
            
            <div className="grid grid-cols-4 gap-4 mt-6">
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">{analysis.overall.meetsCriteria}</div>
                <div className="text-xs text-gray-600">Karşılıyor</div>
                <div className="text-xs text-gray-500">
                  {Math.round((analysis.overall.meetsCriteria / analysis.overall.totalQuestions) * 100)}%
                </div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-yellow-600">{analysis.overall.partiallyMeets}</div>
                <div className="text-xs text-gray-600">Kısmen</div>
                <div className="text-xs text-gray-500">
                  {Math.round((analysis.overall.partiallyMeets / analysis.overall.totalQuestions) * 100)}%
                </div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-red-600">{analysis.overall.doesNotMeet}</div>
                <div className="text-xs text-gray-600">Karşılamıyor</div>
                <div className="text-xs text-gray-500">
                  {Math.round((analysis.overall.doesNotMeet / analysis.overall.totalQuestions) * 100)}%
                </div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-gray-600">{analysis.overall.outOfScope}</div>
                <div className="text-xs text-gray-600">Kapsam Dışı</div>
                <div className="text-xs text-gray-500">
                  {Math.round((analysis.overall.outOfScope / analysis.overall.totalQuestions) * 100)}%
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section Details */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-6">
          <PieChart className="w-5 h-5 text-gray-600" />
          <h2 className="text-xl font-semibold text-gray-900">Bölüm Bazında Detaylı Analiz</h2>
        </div>
        
        {analysis.sections.map((section: any, sectionIndex: number) => (
          <Card key={section.id} className="border-l-4 border-l-blue-500">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  Bölüm {sectionIndex + 1}: {section.title}
                </CardTitle>
                <div className="flex items-center gap-4">
                  <Badge className={getGradeColor(section.summary.grade)}>
                    {section.summary.grade}
                  </Badge>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Başarı Oranı</div>
                    <div className="text-lg font-bold text-gray-900">{section.summary.successRate}%</div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Section Summary Table */}
              <div className="overflow-x-auto mb-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-3 font-medium">Toplam</th>
                      <th className="text-center p-3 font-medium">Karşılıyor</th>
                      <th className="text-center p-3 font-medium">Kısmen</th>
                      <th className="text-center p-3 font-medium">Karşılamıyor</th>
                      <th className="text-center p-3 font-medium">Kapsam Dışı</th>
                      <th className="text-center p-3 font-medium">Maks. Puan</th>
                      <th className="text-center p-3 font-medium">Alınan Puan</th>
                      <th className="text-center p-3 font-medium">Başarı Oranı</th>
                      <th className="text-center p-3 font-medium">Değerlendirme</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-3 font-medium">{section.summary.total}</td>
                      <td className="text-center p-3 text-green-600 font-medium">{section.summary.meets}</td>
                      <td className="text-center p-3 text-yellow-600 font-medium">{section.summary.partial}</td>
                      <td className="text-center p-3 text-red-600 font-medium">{section.summary.doesNotMeet}</td>
                      <td className="text-center p-3 text-gray-600 font-medium">{section.summary.outOfScope}</td>
                      <td className="text-center p-3 font-medium">{section.summary.maxPoints}</td>
                      <td className="text-center p-3 font-medium">{section.summary.earnedPoints}</td>
                      <td className="text-center p-3 font-bold">{section.summary.successRate}%</td>
                      <td className="text-center p-3">
                        <Badge className={getGradeColor(section.summary.grade)}>
                          {section.summary.grade}
                        </Badge>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Individual Questions */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 mb-3">Detaylı Soru Analizi</h4>
                {section.questions.map((question: any, qIndex: number) => (
                  <div key={question.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {sectionIndex + 1}.{qIndex + 1}. {question.text}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        Kategori: {question.category}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-sm text-gray-600">Puan</div>
                        <div className="font-medium">
                          {question.earnedPoints}/{question.maxPoints}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-gray-600">Başarı</div>
                        <div className="font-medium">{question.successRate}%</div>
                      </div>
                      <Badge className={getStatusColor(question.status)}>
                        {getStatusText(question.status)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Final Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Genel Özet Tablosu
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-3 font-medium">Bölümler</th>
                  <th className="text-center p-3 font-medium">Toplam</th>
                  <th className="text-center p-3 font-medium">Karşılıyor</th>
                  <th className="text-center p-3 font-medium">Kısmen Karşılıyor</th>
                  <th className="text-center p-3 font-medium">Karşılamıyor</th>
                  <th className="text-center p-3 font-medium">Kapsam Dışı</th>
                  <th className="text-center p-3 font-medium">Alınabilecek Maks. Puan</th>
                  <th className="text-center p-3 font-medium">Alınan Puan</th>
                  <th className="text-center p-3 font-medium">Başarı Oranı</th>
                  <th className="text-center p-3 font-medium">Değerlendirme</th>
                </tr>
              </thead>
              <tbody>
                {analysis.sections.map((section: any, index: number) => (
                  <tr key={section.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">Bölüm {index + 1}: {section.title}</td>
                    <td className="text-center p-3">{section.summary.total}</td>
                    <td className="text-center p-3 text-green-600 font-medium">{section.summary.meets}</td>
                    <td className="text-center p-3 text-yellow-600 font-medium">{section.summary.partial}</td>
                    <td className="text-center p-3 text-red-600 font-medium">{section.summary.doesNotMeet}</td>
                    <td className="text-center p-3 text-gray-600 font-medium">{section.summary.outOfScope}</td>
                    <td className="text-center p-3">{section.summary.maxPoints}</td>
                    <td className="text-center p-3 font-medium">{section.summary.earnedPoints}</td>
                    <td className="text-center p-3 font-bold">{section.summary.successRate}%</td>
                    <td className="text-center p-3">
                      <Badge className={getGradeColor(section.summary.grade)}>
                        {section.summary.grade}
                      </Badge>
                    </td>
                  </tr>
                ))}
                <tr className="border-b-2 border-blue-600 bg-blue-50 font-bold">
                  <td className="p-3">Sonuç</td>
                  <td className="text-center p-3">{analysis.overall.totalQuestions}</td>
                  <td className="text-center p-3 text-green-600">{analysis.overall.meetsCriteria}</td>
                  <td className="text-center p-3 text-yellow-600">{analysis.overall.partiallyMeets}</td>
                  <td className="text-center p-3 text-red-600">{analysis.overall.doesNotMeet}</td>
                  <td className="text-center p-3 text-gray-600">{analysis.overall.outOfScope}</td>
                  <td className="text-center p-3">{analysis.overall.totalPossiblePoints}</td>
                  <td className="text-center p-3">{analysis.overall.totalEarnedPoints}</td>
                  <td className="text-center p-3 text-lg">{overallSuccessRate}%</td>
                  <td className="text-center p-3">
                    <Badge className={`${getGradeColor(overallGrade)} text-lg px-3 py-1`}>
                      {overallGrade}
                    </Badge>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}