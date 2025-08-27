import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Search, Building2, TrendingUp, Award, Eye, Filter, CheckSquare, Activity } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";

export default function InspectionResultsAdmin() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [gradeFilter, setGradeFilter] = useState("all");

  // Fetch all completed inspections grouped by checklist
  const { data: inspections = [], isLoading } = useQuery({
    queryKey: ["/api/admin/inspections"],
  });

  // Group inspections by checklist and location
  const processInspectionsByChecklist = () => {
    const checklistMap: Record<string, any> = {};
    
    inspections.forEach((inspection: any) => {
      const checklistId = inspection.inspection?.id || 'unknown';
      const checklistTitle = inspection.inspection?.title || 'Bilinmeyen Kontrol Listesi';
      const locationId = inspection.location?.id || 'unknown';
      const locationName = inspection.location?.name || 'Bilinmeyen Hastane';
      const groupKey = `${checklistId}-${locationId}`;
      
      if (!checklistMap[groupKey]) {
        checklistMap[groupKey] = {
          id: groupKey,
          checklistId,
          checklistTitle,
          locationId,
          locationName,
          inspections: [],
          totalInspections: 0,
          averageScore: 0,
          letterGrade: 'E',
          lastInspection: null,
          trend: 'stable' // stable, improving, declining
        };
      }
      
      checklistMap[groupKey].inspections.push(inspection);
      checklistMap[groupKey].totalInspections++;
      
      if (!checklistMap[groupKey].lastInspection || 
          new Date(inspection.completedAt) > new Date(checklistMap[groupKey].lastInspection.completedAt)) {
        checklistMap[groupKey].lastInspection = inspection;
      }
    });
    
    // Calculate averages, grades, and trends
    Object.values(checklistMap).forEach((group: any) => {
      const scores = group.inspections.map((i: any) => i.scorePercentage || 0);
      group.averageScore = Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length);
      group.letterGrade = group.averageScore >= 90 ? "A" :
                         group.averageScore >= 75 ? "B" :
                         group.averageScore >= 50 ? "C" :
                         group.averageScore >= 25 ? "D" : "E";
      
      // Calculate trend (simple: compare first half vs second half)
      if (scores.length >= 2) {
        const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
        const secondHalf = scores.slice(Math.floor(scores.length / 2));
        const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
        
        if (secondAvg > firstAvg + 5) group.trend = 'improving';
        else if (secondAvg < firstAvg - 5) group.trend = 'declining';
        else group.trend = 'stable';
      }
    });
    
    return Object.values(checklistMap);
  };

  // Filter grouped inspections
  const filteredGroups = processInspectionsByChecklist().filter((group: any) => {
    const matchesSearch = group.checklistTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         group.locationName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "recent" && group.lastInspection && 
       new Date(group.lastInspection.completedAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    const matchesGrade = gradeFilter === "all" || group.letterGrade === gradeFilter;
    
    return matchesSearch && matchesStatus && matchesGrade;
  }).sort((a: any, b: any) => b.averageScore - a.averageScore);

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

  const getTrendIcon = (trend: string) => {
    if (trend === 'improving') return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (trend === 'declining') return <Activity className="w-4 h-4 text-red-600 transform rotate-180" />;
    return <Activity className="w-4 h-4 text-gray-400" />;
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
            Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Kontrol Listesi Bazlı Denetim Sonuçları</h1>
            <p className="text-gray-600 mt-1">Aynı kontrol listesinin zaman içindeki performansı ve trendi</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline">{filteredGroups.length} Grup</Badge>
          <Badge className="bg-blue-100 text-blue-800">
            {inspections.length} Tamamlanan Denetim
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  placeholder="Kontrol listesi veya hastane ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Durumlar</SelectItem>
                <SelectItem value="recent">Son 30 Gün</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={gradeFilter} onValueChange={setGradeFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Notlar</SelectItem>
                <SelectItem value="A">A Notu</SelectItem>
                <SelectItem value="B">B Notu</SelectItem>
                <SelectItem value="C">C Notu</SelectItem>
                <SelectItem value="D">D Notu</SelectItem>
                <SelectItem value="E">E Notu</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Inspection Groups */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredGroups.map((group: any, index: number) => (
          <Card key={group.id} className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <CheckSquare className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base truncate" title={group.checklistTitle}>
                      {group.checklistTitle}
                    </CardTitle>
                    <p className="text-sm text-gray-600 truncate" title={group.locationName}>
                      {group.locationName}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 flex-shrink-0">
                  {getTrendIcon(group.trend)}
                  <div className={`px-3 py-1 rounded-lg border-2 ${getGradeColor(group.letterGrade)}`}>
                    <div className="text-lg font-bold">{group.letterGrade}</div>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Score Display */}
              <div className="text-center">
                <div className={`text-2xl font-bold ${getScoreColor(group.averageScore)}`}>
                  {group.averageScore}%
                </div>
                <p className="text-sm text-gray-600">Ortalama Puan</p>
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-lg font-semibold text-gray-900">
                    {group.totalInspections}
                  </div>
                  <p className="text-xs text-gray-600">Denetim</p>
                </div>
                <div>
                  <div className="text-lg font-semibold text-gray-900">
                    {group.lastInspection ? 
                      new Date(group.lastInspection.completedAt).toLocaleDateString('tr-TR', { 
                        day: '2-digit', 
                        month: '2-digit' 
                      }) : 
                      'N/A'
                    }
                  </div>
                  <p className="text-xs text-gray-600">Son Denetim</p>
                </div>
              </div>
              
              {/* Trend Indicator */}
              <div className="flex items-center justify-center gap-1 text-sm">
                {getTrendIcon(group.trend)}
                <span className="text-gray-600">
                  {group.trend === 'improving' ? 'Gelişiyor' : 
                   group.trend === 'declining' ? 'Düşüyor' : 'Sabit'}
                </span>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => setLocation(`/inspection-results/${group.lastInspection?.id}`)}
                >
                  <Eye size={14} className="mr-1" />
                  Son Sonuç
                </Button>
                <Button 
                  size="sm" 
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  onClick={() => alert(`${group.checklistTitle} - ${group.locationName} için detaylı trend analizi geliştiriliyor...`)}
                >
                  <TrendingUp size={14} className="mr-1" />
                  Trend
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredGroups.length === 0 && (
        <div className="text-center py-12">
          <CheckSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Denetim Bulunamadı
          </h3>
          <p className="text-gray-600">
            Arama kriterlerinize uygun denetim sonucu bulunamadı.
          </p>
        </div>
      )}
    </div>
  );
}