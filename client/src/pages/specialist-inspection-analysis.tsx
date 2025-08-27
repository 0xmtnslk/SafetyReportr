import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Building2, CheckSquare, Award, TrendingUp, AlertTriangle, Target, BarChart3, PieChart, FileText, Calendar, User, Clock } from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { useAuth } from "@/hooks/useAuth";

export default function SpecialistInspectionAnalysis() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [, params] = useRoute("/specialist/inspection-analysis/:checklistId/:inspectionId");
  const { checklistId, inspectionId } = params || {};

  // Fetch inspection data for specialist
  const { data: inspectionData, isLoading: inspectionLoading } = useQuery({
    queryKey: [`/api/specialist/inspection/${inspectionId}/analysis`],
  });

  // Fetch checklist template info
  const { data: checklistTemplate, isLoading: templateLoading } = useQuery({
    queryKey: [`/api/checklist/templates/${checklistId}`],
  });

  // Fetch specialist hospital info
  const { data: hospitals = [], isLoading: hospitalsLoading } = useQuery({
    queryKey: ["/api/specialist/hospitals"],
  });

  const isLoading = inspectionLoading || templateLoading || hospitalsLoading;

  const hospital = (hospitals as any[])[0]; // Specialist has only one hospital

  // Mock analysis data for now
  const analysisData = {
    overall: {
      totalQuestions: 45,
      totalPossiblePoints: 450,
      totalEarnedPoints: 383,
      scorePercentage: 85,
      letterGrade: 'B',
      meetsCriteria: 32,
      partiallyMeets: 8,
      doesNotMeet: 3,
      outOfScope: 2
    },
    sections: [
      {
        id: 'section-1',
        title: 'İş Sağlığı ve Güvenliği Politikası',
        totalQuestions: 15,
        earnedPoints: 135,
        maxPoints: 150,
        successRate: 90,
        grade: 'A',
        meets: 12,
        partial: 2,
        doesNotMeet: 1,
        outOfScope: 0
      },
      {
        id: 'section-2', 
        title: 'Risk Değerlendirmesi',
        totalQuestions: 20,
        earnedPoints: 160,
        maxPoints: 200,
        successRate: 80,
        grade: 'B',
        meets: 14,
        partial: 4,
        doesNotMeet: 2,
        outOfScope: 0
      },
      {
        id: 'section-3',
        title: 'Acil Durum Planları',
        totalQuestions: 10,
        earnedPoints: 88,
        maxPoints: 100,
        successRate: 88,
        grade: 'B+',
        meets: 6,
        partial: 2,
        doesNotMeet: 0,
        outOfScope: 2
      }
    ]
  };

  const getGradeColor = (grade: string) => {
    if (grade === 'A' || grade === 'A+') return 'text-green-600 bg-green-50';
    if (grade === 'B' || grade === 'B+') return 'text-blue-600 bg-blue-50';
    if (grade === 'C' || grade === 'C+') return 'text-yellow-600 bg-yellow-50';
    if (grade === 'D' || grade === 'D+') return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'meets': return 'text-green-600 bg-green-50';
      case 'partial': return 'text-yellow-600 bg-yellow-50'; 
      case 'doesNotMeet': return 'text-red-600 bg-red-50';
      case 'outOfScope': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center space-x-4 mb-8">
          <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLocation('/inspection-history')}
            data-testid="button-back-to-history"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Denetim Geçmişi
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Denetim Analizi</h1>
            <div className="flex items-center space-x-4 mt-2">
              <div className="flex items-center text-gray-600">
                <Building2 className="w-4 h-4 mr-1" />
                <span>{hospital?.name || 'Hastane Bilgisi'}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <CheckSquare className="w-4 h-4 mr-1" />
                <span>{checklistTemplate?.name || 'Kontrol Listesi'}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Calendar className="w-4 h-4 mr-1" />
                <span>{new Date().toLocaleDateString('tr-TR')}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Badge className={`text-lg px-4 py-2 ${getGradeColor(analysisData.overall.letterGrade)}`}>
            <Award className="w-4 h-4 mr-2" />
            {analysisData.overall.letterGrade} Derecesi
          </Badge>
          <Badge variant="outline" className="text-lg px-4 py-2">
            %{analysisData.overall.scorePercentage} Başarı
          </Badge>
        </div>
      </div>

      {/* Overall Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{analysisData.overall.totalQuestions}</div>
            <p className="text-sm text-gray-600">Toplam Soru</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <CheckSquare className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-600">{analysisData.overall.meetsCriteria}</div>
            <p className="text-sm text-gray-600">Kriterleri Karşılıyor</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="text-2xl font-bold text-yellow-600">{analysisData.overall.partiallyMeets}</div>
            <p className="text-sm text-gray-600">Kısmen Karşılıyor</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Target className="w-6 h-6 text-red-600" />
            </div>
            <div className="text-2xl font-bold text-red-600">{analysisData.overall.doesNotMeet}</div>
            <p className="text-sm text-gray-600">Karşılamıyor</p>
          </CardContent>
        </Card>
      </div>

      {/* Overall Progress */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Genel Başarı Oranı
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Toplam Puan</span>
              <span className="font-medium">{analysisData.overall.totalEarnedPoints} / {analysisData.overall.totalPossiblePoints}</span>
            </div>
            <Progress value={analysisData.overall.scorePercentage} className="h-3" />
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Başarı Yüzdesi</span>
              <span className="font-medium text-lg">%{analysisData.overall.scorePercentage}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section Analysis */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <BarChart3 className="w-6 h-6 mr-2" />
          Bölüm Analizi
        </h2>

        <div className="grid gap-6">
          {analysisData.sections.map((section: any) => (
            <Card key={section.id} className="border-l-4 border-l-primary">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{section.title}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      {section.totalQuestions} soru • {section.earnedPoints}/{section.maxPoints} puan
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge className={`${getGradeColor(section.grade)}`}>
                      {section.grade}
                    </Badge>
                    <span className="text-lg font-bold">%{section.successRate}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Progress value={section.successRate} className="h-2" />
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">{section.meets}</div>
                      <div className="text-xs text-gray-600">Karşılıyor</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-yellow-600">{section.partial}</div>
                      <div className="text-xs text-gray-600">Kısmen</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-red-600">{section.doesNotMeet}</div>
                      <div className="text-xs text-gray-600">Karşılamıyor</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-600">{section.outOfScope}</div>
                      <div className="text-xs text-gray-600">Kapsam Dışı</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
        <Button
          variant="outline"
          onClick={() => setLocation('/inspection-history')}
          data-testid="button-back-to-list"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Denetim Listesi
        </Button>

        <div className="flex space-x-3">
          <Button variant="outline" data-testid="button-export-pdf">
            <FileText className="w-4 h-4 mr-2" />
            PDF İndir
          </Button>
          <Button data-testid="button-view-details">
            <PieChart className="w-4 h-4 mr-2" />
            Detaylı Rapor
          </Button>
        </div>
      </div>
    </div>
  );
}