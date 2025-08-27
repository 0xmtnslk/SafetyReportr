import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Building2, CheckSquare, Award, TrendingUp, AlertTriangle, Target, BarChart3, PieChart, FileText, Calendar, User, Clock } from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { useAuth } from "@/hooks/useAuth";

export default function InspectionAnalysis() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [, params] = useRoute("/inspection-analysis/:hospitalId/:checklistId/:inspectionId");
  const { hospitalId, checklistId, inspectionId } = params || {};

  // Determine if user is a specialist
  const isSpecialist = ['safety_specialist', 'occupational_physician'].includes((user as any)?.role || '');

  // Fetch inspection assignments for this specific inspection
  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery({
    queryKey: isSpecialist ? 
      [`/api/specialist/inspections/${inspectionId}/assignments`] : 
      [`/api/inspections/${inspectionId}/assignments`],
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
    queryKey: isSpecialist ? ["/api/specialist/hospitals"] : ["/api/admin/hospitals"],
  });

  const isLoading = assignmentsLoading || sectionsLoading || templatesLoading || hospitalsLoading;

  // Get hospital and template info
  const hospital = (hospitals as any[]).find((h: any) => h.id === hospitalId);
  const template = (checklistTemplates as any[]).find((t: any) => t.id === checklistId);

  // Process detailed analysis data
  const processDetailedAnalysis = () => {
    if (!(checklistSections as any[]).length) return null;

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
    (checklistSections as any[]).forEach((section: any) => {
      const sectionData = {
        id: section.id,
        title: section.name,
        questions: [] as any[],
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
            <Button className="mt-4" onClick={() => setLocation(isSpecialist ? '/inspection-history' : `/checklist-inspections/${hospitalId}/${checklistId}`)}>
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
          <Button variant="outline" onClick={() => setLocation(isSpecialist ? '/inspection-history' : `/checklist-inspections/${hospitalId}/${checklistId}`)}>
            <ArrowLeft size={16} className="mr-2" />
            {isSpecialist ? 'Denetim Geçmişi' : 'Denetim Başlıkları'}
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

      {/* Section Details - Modern Card Design */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Clock className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Bölüm Bazında Detaylı Analiz</h2>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {analysis.sections.map((section: any, sectionIndex: number) => (
            <Card key={section.id} className="overflow-hidden border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-bold text-gray-900">
                      Bölüm {sectionIndex + 1}: {section.title}
                    </CardTitle>
                  </div>
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${getGradeColor(section.summary.grade)}`}>
                    {section.summary.successRate}%
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-6">
                {/* Compact Summary Grid */}
                <div className="grid grid-cols-4 gap-2 mb-6 text-sm">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="font-bold text-lg text-gray-900">{section.summary.total}</div>
                    <div className="text-xs text-gray-600">Toplam</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="font-bold text-lg text-green-600">{section.summary.meets}</div>
                    <div className="text-xs text-gray-600">Karşılıyor</div>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <div className="font-bold text-lg text-yellow-600">{section.summary.partial}</div>
                    <div className="text-xs text-gray-600">Kısmen</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="font-bold text-lg text-red-600">{section.summary.doesNotMeet}</div>
                    <div className="text-xs text-gray-600">Karşılamıyor</div>
                  </div>
                </div>
                
                {/* Additional Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-sm text-gray-600">Kapsam Dışı</div>
                    <div className="font-bold">{section.summary.outOfScope}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-600">Maks. Puan</div>
                    <div className="font-bold">{section.summary.maxPoints}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-600">Alınan Puan</div>
                    <div className="font-bold">{section.summary.earnedPoints}</div>
                  </div>
                </div>

                {/* Final Grade */}
                <div className="text-center mb-6">
                  <div className={`inline-flex items-center px-6 py-3 rounded-full text-lg font-bold ${getGradeColor(section.summary.grade)}`}>
                    Değerlendirme: {section.summary.grade}
                  </div>
                </div>

                {/* Question List */}
                <div className="space-y-3">
                  <h4 className="font-bold text-gray-900 border-b pb-2">Detaylı Soru Analizi</h4>
                  {section.questions.map((question: any, qIndex: number) => (
                    <div key={question.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 text-sm">
                          {sectionIndex + 1}.{qIndex + 1}. {question.text}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Kategori: {question.category}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-center">
                          <div className="text-xs text-gray-500">Puan</div>
                          <div className="font-bold text-sm">
                            {question.earnedPoints}/{question.maxPoints}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-500">Başarı</div>
                          <div className="font-bold text-sm">{question.successRate}%</div>
                        </div>
                        <Badge className={getStatusColor(question.status)} variant="outline">
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

        {/* Final Summary Table - Cleaner Design */}
        <Card className="mt-8">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-6 h-6 text-blue-600" />
              Genel Özet Tablosu
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-100 border-b-2">
                    <th className="text-left p-4 font-bold">Bölümler</th>
                    <th className="text-center p-4 font-bold">Toplam</th>
                    <th className="text-center p-4 font-bold">Karşılıyor</th>
                    <th className="text-center p-4 font-bold">Kısmen Karşılıyor</th>
                    <th className="text-center p-4 font-bold">Karşılamıyor</th>
                    <th className="text-center p-4 font-bold">Kapsam Dışı</th>
                    <th className="text-center p-4 font-bold">Alınabilecek Maks. Puan</th>
                    <th className="text-center p-4 font-bold">Alınan Puan</th>
                    <th className="text-center p-4 font-bold">Başarı Oranı</th>
                    <th className="text-center p-4 font-bold">Değerlendirme</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.sections.map((section: any, index: number) => (
                    <tr key={section.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-medium">Bölüm {index + 1}: {section.title}</td>
                      <td className="text-center p-4">{section.summary.total}</td>
                      <td className="text-center p-4">
                        <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                          {section.summary.meets}
                        </span>
                      </td>
                      <td className="text-center p-4">
                        <span className="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                          {section.summary.partial}
                        </span>
                      </td>
                      <td className="text-center p-4">
                        <span className="inline-flex items-center px-2 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                          {section.summary.doesNotMeet}
                        </span>
                      </td>
                      <td className="text-center p-4 text-gray-600">{section.summary.outOfScope}</td>
                      <td className="text-center p-4 font-medium">{section.summary.maxPoints}</td>
                      <td className="text-center p-4 font-medium">{section.summary.earnedPoints}</td>
                      <td className="text-center p-4 font-bold text-lg">{section.summary.successRate}%</td>
                      <td className="text-center p-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto text-lg font-bold ${getGradeColor(section.summary.grade)}`}>
                          {section.summary.grade}
                        </div>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-blue-50 border-t-2 border-blue-200">
                    <td className="p-4 font-bold text-lg">Sonuç</td>
                    <td className="text-center p-4 font-bold">{analysis.overall.totalQuestions}</td>
                    <td className="text-center p-4">
                      <span className="inline-flex items-center px-3 py-2 bg-green-100 text-green-800 rounded-full font-bold">
                        {analysis.overall.meetsCriteria}
                      </span>
                    </td>
                    <td className="text-center p-4">
                      <span className="inline-flex items-center px-3 py-2 bg-yellow-100 text-yellow-800 rounded-full font-bold">
                        {analysis.overall.partiallyMeets}
                      </span>
                    </td>
                    <td className="text-center p-4">
                      <span className="inline-flex items-center px-3 py-2 bg-red-100 text-red-800 rounded-full font-bold">
                        {analysis.overall.doesNotMeet}
                      </span>
                    </td>
                    <td className="text-center p-4 font-bold text-gray-600">{analysis.overall.outOfScope}</td>
                    <td className="text-center p-4 font-bold">{analysis.overall.totalPossiblePoints}</td>
                    <td className="text-center p-4 font-bold">{analysis.overall.totalEarnedPoints}</td>
                    <td className="text-center p-4 font-bold text-2xl">{overallSuccessRate}%</td>
                    <td className="text-center p-4">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto text-2xl font-bold ${getGradeColor(overallGrade)}`}>
                        {overallGrade}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}