import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Building2,
  Calendar,
  User,
  BarChart3,
  Target
} from "lucide-react";

export function InspectionAnalysisPage() {
  const { hospitalId, checklistId, assignmentId } = useParams<{
    hospitalId: string;
    checklistId: string;
    assignmentId: string;
  }>();

  // Fetch assignment details  
  const { data: assignment, isLoading: assignmentLoading } = useQuery({
    queryKey: [`/api/assignments/${assignmentId}`],
  });

  // Fetch responses for this assignment
  const { data: responses = [], isLoading: responsesLoading } = useQuery({
    queryKey: [`/api/assignments/${assignmentId}/responses`],
  });

  console.log('Responses data:', responses);
  console.log('Parameters:', { hospitalId, checklistId, assignmentId });

  // Fetch checklist template structure
  const { data: checklistSections = [], isLoading: sectionsLoading } = useQuery({
    queryKey: [`/api/checklist/templates/${checklistId}/sections`],
  });

  // Fetch checklist template info
  const { data: checklistTemplates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ["/api/checklist/templates"],
  });

  // Fetch hospitals for name lookup - Always use specialist endpoint for now
  const { data: hospitals = [], isLoading: hospitalsLoading } = useQuery({
    queryKey: ["/api/specialist/hospitals"],
  });

  const isLoading = assignmentLoading || sectionsLoading || templatesLoading || hospitalsLoading || responsesLoading;

  // Get hospital and template info
  const hospital = (hospitals as any[]).find((h: any) => h.id === hospitalId);
  const template = (checklistTemplates as any[]).find((t: any) => t.id === checklistId);

  // Process detailed analysis data using real responses
  const processDetailedAnalysis = () => {
    if (!(responses as any[]).length || !(checklistSections as any[]).length) return null;

    console.log('Processing analysis with responses:', (responses as any[]).length);
    console.log('Sample response:', (responses as any[])[0]);

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

    // Group responses by section first
    const responsesBySection: Record<string, any[]> = {};
    (responses as any[]).forEach((response: any) => {
      const sectionId = response.question?.sectionId;
      if (!sectionId) return;
      
      if (!responsesBySection[sectionId]) {
        responsesBySection[sectionId] = [];
      }
      responsesBySection[sectionId].push(response);
    });

    console.log('Responses by section:', responsesBySection);
    console.log('Available sections:', (checklistSections as any[]).map(s => ({ id: s.id, name: s.name })));

    // Process each section and its categories
    (checklistSections as any[]).forEach((section: any) => {
      const sectionResponses = responsesBySection[section.id] || [];
      if (sectionResponses.length === 0) return;
      
      // Group responses by category within this section
      const categoriesInSection: Record<string, any[]> = {};
      sectionResponses.forEach((response: any) => {
        const category = response.question?.category || 'Diğer';
        if (!categoriesInSection[category]) {
          categoriesInSection[category] = [];
        }
        categoriesInSection[category].push(response);
      });
      
      console.log(`Section ${section.name} categories:`, Object.keys(categoriesInSection));
      
      // Calculate category scores and sort by success rate (lowest first)
      const categoryData = Object.entries(categoriesInSection).map(([category, categoryResponses]) => {
        const categoryInfo = {
          id: category,
          title: category,
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

        categoryResponses.forEach((response: any) => {
          const twPoints = response.question.twScore || 10;
          // Calculate earned points based on answer
          let earnedPoints = 0;
          let status = 'doesNotMeet';
          
          switch (response.answer) {
            case 'Karşılıyor':
              earnedPoints = twPoints;
              status = 'meets';
              break;
            case 'Kısmen Karşılıyor':
              earnedPoints = Math.floor(twPoints * 0.5);
              status = 'partial';
              break;
            case 'Karşılamıyor':
              earnedPoints = 0;
              status = 'doesNotMeet';
              break;
            case 'Kapsam Dışı':
              earnedPoints = 0;
              status = 'outOfScope';
              break;
          }

          const questionData = {
            id: response.questionId,
            text: response.question.questionText,
            category: response.question.category,
            maxPoints: twPoints,
            earnedPoints: earnedPoints,
            status: status,
            successRate: Math.round((earnedPoints / twPoints) * 100) || 0
          };

          categoryInfo.questions.push(questionData);
          categoryInfo.summary.total++;
          categoryInfo.summary.maxPoints += twPoints;
          categoryInfo.summary.earnedPoints += earnedPoints;

          // Count status types
          switch (status) {
            case 'meets':
              categoryInfo.summary.meets++;
              break;
            case 'partial':
              categoryInfo.summary.partial++;
              break;
            case 'doesNotMeet':
              categoryInfo.summary.doesNotMeet++;
              break;
            case 'outOfScope':
              categoryInfo.summary.outOfScope++;
              break;
          }
        });

        // Calculate category success rate and grade
        categoryInfo.summary.successRate = Math.round(
          (categoryInfo.summary.earnedPoints / categoryInfo.summary.maxPoints) * 100
        ) || 0;

        // Assign grade based on success rate
        if (categoryInfo.summary.successRate >= 90) categoryInfo.summary.grade = 'AA';
        else if (categoryInfo.summary.successRate >= 80) categoryInfo.summary.grade = 'A';
        else if (categoryInfo.summary.successRate >= 70) categoryInfo.summary.grade = 'B';
        else if (categoryInfo.summary.successRate >= 60) categoryInfo.summary.grade = 'C';
        else if (categoryInfo.summary.successRate >= 50) categoryInfo.summary.grade = 'D';
        else categoryInfo.summary.grade = 'E';

        return categoryInfo;
      }).sort((a, b) => a.summary.successRate - b.summary.successRate); // Sort by success rate (lowest first)

      // Calculate section overall stats
      const sectionSummary = {
        total: 0,
        meets: 0,
        partial: 0,
        doesNotMeet: 0,
        outOfScope: 0,
        maxPoints: 0,
        earnedPoints: 0,
        successRate: 0,
        grade: 'E'
      };

      categoryData.forEach(category => {
        sectionSummary.total += category.summary.total;
        sectionSummary.meets += category.summary.meets;
        sectionSummary.partial += category.summary.partial;
        sectionSummary.doesNotMeet += category.summary.doesNotMeet;
        sectionSummary.outOfScope += category.summary.outOfScope;
        sectionSummary.maxPoints += category.summary.maxPoints;
        sectionSummary.earnedPoints += category.summary.earnedPoints;
      });

      sectionSummary.successRate = Math.round(
        (sectionSummary.earnedPoints / sectionSummary.maxPoints) * 100
      ) || 0;

      // Assign section grade
      if (sectionSummary.successRate >= 90) sectionSummary.grade = 'AA';
      else if (sectionSummary.successRate >= 80) sectionSummary.grade = 'A';
      else if (sectionSummary.successRate >= 70) sectionSummary.grade = 'B';
      else if (sectionSummary.successRate >= 60) sectionSummary.grade = 'C';
      else if (sectionSummary.successRate >= 50) sectionSummary.grade = 'D';
      else sectionSummary.grade = 'E';

      // Add section with its categories to the main analysis
      analysisData.sections.push({
        id: section.id,
        title: section.name,
        categories: categoryData,
        summary: sectionSummary
      });

      // Update overall stats
      analysisData.overall.totalQuestions += sectionSummary.total;
      analysisData.overall.totalPossiblePoints += sectionSummary.maxPoints;
      analysisData.overall.totalEarnedPoints += sectionSummary.earnedPoints;
      analysisData.overall.meetsCriteria += sectionSummary.meets;
      analysisData.overall.partiallyMeets += sectionSummary.partial;
      analysisData.overall.doesNotMeet += sectionSummary.doesNotMeet;
      analysisData.overall.outOfScope += sectionSummary.outOfScope;
    });

    console.log('Final analysis data:', analysisData);
    return analysisData;
  };

  const analysis = processDetailedAnalysis();

  // Status color and text functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'meets': return 'bg-green-100 text-green-800 border-green-300';
      case 'partial': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'doesNotMeet': return 'bg-red-100 text-red-800 border-red-300';
      case 'outOfScope': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'meets': return 'Karşılıyor';
      case 'partial': return 'Kısmen';
      case 'doesNotMeet': return 'Karşılamıyor';
      case 'outOfScope': return 'Kapsam Dışı';
      default: return 'Bilinmiyor';
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-lg text-gray-600">Denetim analizi yükleniyor...</div>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-lg text-red-600">Analiz verileri yüklenemedi.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Denetim Analizi</h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="text-sm text-gray-600">Hastane</div>
                  <div className="font-medium">{hospital?.name || 'Bilinmiyor'}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-green-600" />
                <div>
                  <div className="text-sm text-gray-600">Kontrol Listesi</div>
                  <div className="font-medium">{template?.title || 'Bilinmiyor'}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-purple-600" />
                <div>
                  <div className="text-sm text-gray-600">Denetim Tarihi</div>
                  <div className="font-medium">
                    {assignment?.startDate ? new Date(assignment.startDate).toLocaleDateString('tr-TR') : 'Bilinmiyor'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Overall Stats */}
      <Card className="mb-8">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardTitle className="flex items-center gap-2">
            <Target className="w-6 h-6 text-blue-600" />
            Genel Değerlendirme
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{analysis.overall.totalQuestions}</div>
              <div className="text-sm text-gray-600">Toplam Soru</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{analysis.overall.meetsCriteria}</div>
              <div className="text-sm text-gray-600">Karşılıyor</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">{analysis.overall.partiallyMeets}</div>
              <div className="text-sm text-gray-600">Kısmen</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">{analysis.overall.doesNotMeet}</div>
              <div className="text-sm text-gray-600">Karşılamıyor</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section-based Detailed Analysis with Tabs */}
      <Card className="mb-8">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            Bölüm Bazında Detaylı Analiz
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs defaultValue={analysis.sections[0]?.id} className="w-full">
            <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 mb-6">
              {analysis.sections.map((section: any) => (
                <TabsTrigger key={section.id} value={section.id} className="text-sm">
                  {section.title}
                  <Badge className="ml-2" variant="outline">
                    {section.summary.successRate}%
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>
            
            {analysis.sections.map((section: any) => (
              <TabsContent key={section.id} value={section.id}>
                <Card>
                  <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-100">
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        {section.title}
                      </span>
                      <div className="flex items-center gap-4">
                        <Badge className="text-lg px-3 py-1" variant="outline">
                          Not: {section.summary.grade}
                        </Badge>
                        <Badge className="text-lg px-3 py-1" variant="outline">
                          {section.summary.successRate}%
                        </Badge>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {section.categories.map((category: any, categoryIndex: number) => (
                        <Card key={category.id} className="border-l-4 border-l-blue-500">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-lg">{category.title}</CardTitle>
                              <div className="flex items-center gap-4">
                                <Badge variant="outline" className="text-sm">
                                  {category.summary.earnedPoints}/{category.summary.maxPoints} puan
                                </Badge>
                                <Badge variant="outline" className="text-sm">
                                  {category.summary.successRate}% - Not: {category.summary.grade}
                                </Badge>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="text-sm text-gray-600 mb-3">
                              Toplam {category.summary.total} soru • 
                              Karşılıyor: {category.summary.meets} • 
                              Kısmen: {category.summary.partial} • 
                              Karşılamıyor: {category.summary.doesNotMeet}
                            </div>
                            
                            {/* Category questions list */}
                            <div className="space-y-2">
                              {category.questions.map((question: any, qIndex: number) => (
                                <div key={question.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                  <div className="flex-1">
                                    <div className="text-sm font-medium">
                                      {categoryIndex + 1}.{qIndex + 1}. {question.text}
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
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

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
                      <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                        {section.summary.meets}
                      </span>
                    </td>
                    <td className="text-center p-4">
                      <span className="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm">
                        {section.summary.partial}
                      </span>
                    </td>
                    <td className="text-center p-4">
                      <span className="inline-flex items-center px-2 py-1 bg-red-100 text-red-800 rounded text-sm">
                        {section.summary.doesNotMeet}
                      </span>
                    </td>
                    <td className="text-center p-4">
                      <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-800 rounded text-sm">
                        {section.summary.outOfScope}
                      </span>
                    </td>
                    <td className="text-center p-4">{section.summary.maxPoints}</td>
                    <td className="text-center p-4">{section.summary.earnedPoints}</td>
                    <td className="text-center p-4">
                      <span className="font-bold text-lg">{section.summary.successRate}%</span>
                    </td>
                    <td className="text-center p-4">
                      <Badge className="text-lg px-3 py-1" variant="outline">
                        {section.summary.grade}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {/* Overall Total Row */}
                <tr className="bg-blue-50 border-t-2 border-blue-200 font-bold">
                  <td className="p-4">GENEL TOPLAM</td>
                  <td className="text-center p-4">{analysis.overall.totalQuestions}</td>
                  <td className="text-center p-4">
                    <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                      {analysis.overall.meetsCriteria}
                    </span>
                  </td>
                  <td className="text-center p-4">
                    <span className="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm">
                      {analysis.overall.partiallyMeets}
                    </span>
                  </td>
                  <td className="text-center p-4">
                    <span className="inline-flex items-center px-2 py-1 bg-red-100 text-red-800 rounded text-sm">
                      {analysis.overall.doesNotMeet}
                    </span>
                  </td>
                  <td className="text-center p-4">
                    <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-800 rounded text-sm">
                      {analysis.overall.outOfScope}
                    </span>
                  </td>
                  <td className="text-center p-4">{analysis.overall.totalPossiblePoints}</td>
                  <td className="text-center p-4">{analysis.overall.totalEarnedPoints}</td>
                  <td className="text-center p-4">
                    <span className="font-bold text-xl text-blue-600">
                      {Math.round((analysis.overall.totalEarnedPoints / analysis.overall.totalPossiblePoints) * 100) || 0}%
                    </span>
                  </td>
                  <td className="text-center p-4">
                    <Badge className="text-lg px-3 py-1" variant="outline">
                      {(() => {
                        const rate = Math.round((analysis.overall.totalEarnedPoints / analysis.overall.totalPossiblePoints) * 100) || 0;
                        if (rate >= 90) return 'AA';
                        else if (rate >= 80) return 'A';
                        else if (rate >= 70) return 'B';
                        else if (rate >= 60) return 'C';
                        else if (rate >= 50) return 'D';
                        else return 'E';
                      })()}
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