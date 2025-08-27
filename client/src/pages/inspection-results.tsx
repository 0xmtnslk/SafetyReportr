import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trophy, TrendingUp, BarChart3, Award, Target } from "lucide-react";
import { useLocation } from "wouter";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

interface InspectionResultsProps {
  assignmentId: string;
}

export default function InspectionResults({ assignmentId }: InspectionResultsProps) {
  const [, setLocation] = useLocation();

  // Fetch assignment data with detailed results
  const { data: assignment, isLoading } = useQuery({
    queryKey: ["/api/assignments", assignmentId],
  });

  // Fetch inspection responses for analysis
  const { data: responses = [] } = useQuery({
    queryKey: ["/api/assignments", assignmentId, "responses"],
    enabled: !!assignmentId,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Calculate results from responses
  const calculateResults = () => {
    const totalQuestions = responses.length;
    const compliantCount = responses.filter((r: any) => r.answer === "Karşılıyor").length;
    const partiallyCompliantCount = responses.filter((r: any) => r.answer === "Kısmen Karşılıyor").length;
    const nonCompliantCount = responses.filter((r: any) => r.answer === "Karşılamıyor").length;
    const notApplicableCount = responses.filter((r: any) => r.answer === "Kapsam Dışı").length;

    // Calculate score
    const totalScore = responses.reduce((sum: number, r: any) => sum + (r.score || 0), 0);
    const maxPossibleScore = responses.reduce((sum: number, r: any) => {
      if (r.answer === "Kapsam Dışı") return sum;
      return sum + 10; // Assuming max TW score of 10
    }, 0);

    const scorePercentage = maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;
    
    // Letter grade calculation
    const letterGrade = scorePercentage >= 90 ? "A" : 
                       scorePercentage >= 75 ? "B" :
                       scorePercentage >= 50 ? "C" :
                       scorePercentage >= 25 ? "D" : "E";

    return {
      totalQuestions,
      compliantCount,
      partiallyCompliantCount, 
      nonCompliantCount,
      notApplicableCount,
      totalScore,
      maxPossibleScore,
      scorePercentage,
      letterGrade
    };
  };

  // Group responses by category for analysis
  const getCategoryAnalysis = () => {
    const categoryMap: Record<string, any> = {};
    
    responses.forEach((r: any) => {
      const category = r.question?.category || "Genel";
      if (!categoryMap[category]) {
        categoryMap[category] = {
          name: category,
          total: 0,
          compliant: 0,
          partiallyCompliant: 0,
          nonCompliant: 0,
          notApplicable: 0,
          score: 0,
          maxScore: 0
        };
      }
      
      categoryMap[category].total++;
      categoryMap[category].score += r.score || 0;
      
      if (r.answer !== "Kapsam Dışı") {
        categoryMap[category].maxScore += 10;
      }
      
      switch (r.answer) {
        case "Karşılıyor":
          categoryMap[category].compliant++;
          break;
        case "Kısmen Karşılıyor":
          categoryMap[category].partiallyCompliant++;
          break;
        case "Karşılamıyor":
          categoryMap[category].nonCompliant++;
          break;
        case "Kapsam Dışı":
          categoryMap[category].notApplicable++;
          break;
      }
    });

    return Object.values(categoryMap).map((cat: any) => ({
      ...cat,
      percentage: cat.maxScore > 0 ? Math.round((cat.score / cat.maxScore) * 100) : 0
    }));
  };

  const results = calculateResults();
  const categoryAnalysis = getCategoryAnalysis();

  // Data for charts
  const pieChartData = [
    { name: "Karşılıyor", value: results.compliantCount, color: "#10B981" },
    { name: "Kısmen Karşılıyor", value: results.partiallyCompliantCount, color: "#F59E0B" },
    { name: "Karşılamıyor", value: results.nonCompliantCount, color: "#EF4444" },
    { name: "Kapsam Dışı", value: results.notApplicableCount, color: "#6B7280" },
  ];

  const barChartData = categoryAnalysis.map(cat => ({
    name: cat.name.length > 15 ? cat.name.substring(0, 15) + '...' : cat.name,
    percentage: cat.percentage,
    compliant: cat.compliant,
    nonCompliant: cat.nonCompliant
  }));

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

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setLocation('/dashboard')}>
            <ArrowLeft size={16} className="mr-2" />
            Dashboard'a Dön
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Denetim Sonuçları</h1>
            <p className="text-gray-600 mt-1">
              {assignment?.location?.name || 'Denetim'} - Sonuç Analizi
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className={`px-6 py-3 rounded-xl border-2 ${getGradeColor(results.letterGrade)}`}>
            <div className="text-center">
              <div className="text-2xl font-bold">{results.letterGrade}</div>
              <div className="text-sm font-medium">Harf Notu</div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Genel Skor</p>
                <p className={`text-2xl font-bold ${getScoreColor(results.scorePercentage)}`}>
                  {results.scorePercentage}%
                </p>
                <p className="text-xs text-gray-500">
                  {results.totalScore}/{results.maxPossibleScore} puan
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Başarılı</p>
                <p className="text-2xl font-bold text-green-600">{results.compliantCount}</p>
                <p className="text-xs text-gray-500">
                  %{Math.round((results.compliantCount / results.totalQuestions) * 100)} oran
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">İyileştirme</p>
                <p className="text-2xl font-bold text-red-600">{results.nonCompliantCount}</p>
                <p className="text-xs text-gray-500">
                  %{Math.round((results.nonCompliantCount / results.totalQuestions) * 100)} oran
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Toplam Soru</p>
                <p className="text-2xl font-bold text-gray-900">{results.totalQuestions}</p>
                <p className="text-xs text-gray-500">
                  {categoryAnalysis.length} kategori
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Genel Dağılım
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Kategori Başarı Oranları
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  fontSize={10}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="percentage" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Category Details */}
      <Card>
        <CardHeader>
          <CardTitle>Kategori Detayları</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {categoryAnalysis.map((category, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-lg">{category.name}</h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{category.percentage}%</Badge>
                    <Badge className={`${getGradeColor(
                      category.percentage >= 90 ? "A" :
                      category.percentage >= 75 ? "B" :
                      category.percentage >= 50 ? "C" :
                      category.percentage >= 25 ? "D" : "E"
                    )}`}>
                      {category.percentage >= 90 ? "A" :
                       category.percentage >= 75 ? "B" :
                       category.percentage >= 50 ? "C" :
                       category.percentage >= 25 ? "D" : "E"}
                    </Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-green-600 font-semibold text-xl">{category.compliant}</div>
                    <div className="text-gray-600">Karşılıyor</div>
                  </div>
                  <div className="text-center">
                    <div className="text-yellow-600 font-semibold text-xl">{category.partiallyCompliant}</div>
                    <div className="text-gray-600">Kısmen</div>
                  </div>
                  <div className="text-center">
                    <div className="text-red-600 font-semibold text-xl">{category.nonCompliant}</div>
                    <div className="text-gray-600">Karşılamıyor</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-600 font-semibold text-xl">{category.notApplicable}</div>
                    <div className="text-gray-600">Kapsam Dışı</div>
                  </div>
                </div>
                
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${category.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        <Button variant="outline" onClick={() => setLocation('/dashboard')}>
          Dashboard'a Dön
        </Button>
        <Button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700">
          Raporu Yazdır
        </Button>
      </div>
    </div>
  );
}