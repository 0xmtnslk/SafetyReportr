import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Search, Building2, TrendingUp, Award, Eye, Filter, CheckSquare, Activity, ChevronRight, Calendar, Users } from "lucide-react";
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

  // Group inspections by checklist -> inspection title -> hospitals
  const processInspectionsByChecklist = () => {
    const checklistMap: Record<string, any> = {};
    
    inspections.forEach((inspection: any) => {
      const checklistId = inspection.inspection?.id || 'unknown';
      const checklistTitle = inspection.inspection?.title || 'Bilinmeyen Kontrol Listesi';
      const inspectionTitle = inspection.inspectionTitle || inspection.title || 'Belirsiz Denetim'; // Denetim başlığı
      const locationName = inspection.location?.name || 'Bilinmeyen Hastane';
      
      // Ana kontrol listesi grubu
      if (!checklistMap[checklistId]) {
        checklistMap[checklistId] = {
          checklistId,
          checklistTitle,
          inspectionGroups: {},
          totalInspections: 0,
          averageScore: 0,
          letterGrade: 'E'
        };
      }
      
      // Denetim başlığı alt grubu
      if (!checklistMap[checklistId].inspectionGroups[inspectionTitle]) {
        checklistMap[checklistId].inspectionGroups[inspectionTitle] = {
          inspectionTitle,
          hospitals: [],
          totalHospitals: 0,
          averageScore: 0,
          letterGrade: 'E',
          lastInspection: null,
          trend: 'stable'
        };
      }
      
      // Hastane sonucunu ekle
      checklistMap[checklistId].inspectionGroups[inspectionTitle].hospitals.push({
        locationName,
        inspection,
        scorePercentage: inspection.scorePercentage || 0,
        letterGrade: inspection.letterGrade || 'E',
        completedAt: inspection.completedAt
      });
      
      checklistMap[checklistId].inspectionGroups[inspectionTitle].totalHospitals++;
      checklistMap[checklistId].totalInspections++;
      
      // Son denetimi güncelle
      if (!checklistMap[checklistId].inspectionGroups[inspectionTitle].lastInspection || 
          new Date(inspection.completedAt) > new Date(checklistMap[checklistId].inspectionGroups[inspectionTitle].lastInspection.completedAt)) {
        checklistMap[checklistId].inspectionGroups[inspectionTitle].lastInspection = inspection;
      }
    });
    
    // İstatistikleri hesapla
    Object.values(checklistMap).forEach((checklist: any) => {
      let totalScore = 0;
      let totalCount = 0;
      
      Object.values(checklist.inspectionGroups).forEach((group: any) => {
        // Grup ortalaması
        const scores = group.hospitals.map((h: any) => h.scorePercentage || 0);
        group.averageScore = scores.length > 0 ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : 0;
        group.letterGrade = group.averageScore >= 90 ? "A" :
                           group.averageScore >= 75 ? "B" :
                           group.averageScore >= 50 ? "C" :
                           group.averageScore >= 25 ? "D" : "E";
        
        // Trend hesapla
        if (scores.length >= 2) {
          const sortedHospitals = group.hospitals.sort((a: any, b: any) => 
            new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
          );
          const firstHalf = sortedHospitals.slice(0, Math.floor(sortedHospitals.length / 2));
          const secondHalf = sortedHospitals.slice(Math.floor(sortedHospitals.length / 2));
          
          const firstAvg = firstHalf.reduce((a, b) => a + b.scorePercentage, 0) / firstHalf.length;
          const secondAvg = secondHalf.reduce((a, b) => a + b.scorePercentage, 0) / secondHalf.length;
          
          if (secondAvg > firstAvg + 5) group.trend = 'improving';
          else if (secondAvg < firstAvg - 5) group.trend = 'declining';
          else group.trend = 'stable';
        }
        
        totalScore += group.averageScore * group.totalHospitals;
        totalCount += group.totalHospitals;
      });
      
      // Kontrol listesi genel ortalaması
      checklist.averageScore = totalCount > 0 ? Math.round(totalScore / totalCount) : 0;
      checklist.letterGrade = checklist.averageScore >= 90 ? "A" :
                             checklist.averageScore >= 75 ? "B" :
                             checklist.averageScore >= 50 ? "C" :
                             checklist.averageScore >= 25 ? "D" : "E";
    });
    
    return Object.values(checklistMap);
  };

  // Filter grouped checklists
  const filteredChecklists = processInspectionsByChecklist().filter((checklist: any) => {
    const matchesSearch = checklist.checklistTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         Object.keys(checklist.inspectionGroups).some((title: string) => 
                           title.toLowerCase().includes(searchQuery.toLowerCase())
                         );
    const matchesGrade = gradeFilter === "all" || checklist.letterGrade === gradeFilter;
    
    return matchesSearch && matchesGrade;
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
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
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
            <p className="text-gray-600 mt-1">Hastane ve kontrol listesi kombinasyonu bazlı trend analizi</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline">{filteredChecklists.length} Kontrol Listesi</Badge>
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
                  placeholder="Hastane veya kontrol listesi ara..."
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

      {/* Inspection Groups - Liste Format */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5" />
            Hastane + Kontrol Listesi Kombinasyonları
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {filteredChecklists.map((checklist: any, index: number) => (
              <div key={checklist.checklistId} className="">
                {/* Kontrol Listesi Başlığı */}
                <div className="p-6 bg-gray-50 border-l-4 border-l-blue-500">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                        <CheckSquare className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{checklist.checklistTitle}</h3>
                        <p className="text-sm text-gray-600">
                          {Object.keys(checklist.inspectionGroups).length} Denetim Dönemi • 
                          {checklist.totalInspections} Toplam Denetim
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className={`text-3xl font-bold ${getScoreColor(checklist.averageScore)}`}>
                          {checklist.averageScore}%
                        </div>
                        <p className="text-xs text-gray-500">Genel Ortalama</p>
                      </div>
                      <div className={`px-4 py-3 rounded-xl border-2 ${getGradeColor(checklist.letterGrade)}`}>
                        <div className="text-2xl font-bold text-center">{checklist.letterGrade}</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Denetim Başlıkları */}
                <div className="divide-y bg-white">
                  {Object.entries(checklist.inspectionGroups).map(([inspectionTitle, group]: [string, any]) => (
                    <div key={inspectionTitle} className="p-6 pl-20 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h4 className="font-semibold text-gray-900">{inspectionTitle}</h4>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Building2 className="w-4 h-4" />
                              <span>{group.totalHospitals} Hastane</span>
                              <Calendar className="w-4 h-4 ml-2" />
                              <span>
                                {group.lastInspection ? 
                                  new Date(group.lastInspection.completedAt).toLocaleDateString('tr-TR', { 
                                    day: '2-digit', 
                                    month: '2-digit',
                                    year: '2-digit'
                                  }) : 
                                  'N/A'
                                }
                              </span>
                            </div>
                          </div>
                          
                          {/* Hastane Listesi */}
                          <div className="mt-3 flex flex-wrap gap-2">
                            {group.hospitals.map((hospital: any, idx: number) => (
                              <div key={idx} className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-lg text-sm">
                                <span className="text-gray-700">{hospital.locationName}</span>
                                <span className={`font-semibold ${
                                  hospital.scorePercentage >= 90 ? 'text-green-600' :
                                  hospital.scorePercentage >= 75 ? 'text-blue-600' :
                                  hospital.scorePercentage >= 50 ? 'text-yellow-600' :
                                  hospital.scorePercentage >= 25 ? 'text-orange-600' : 'text-red-600'
                                }`}>
                                  {hospital.scorePercentage}%
                                </span>
                                <span className={`px-2 py-1 rounded text-xs font-bold ${getGradeColor(hospital.letterGrade)}`}>
                                  {hospital.letterGrade}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 flex-shrink-0">
                          <div className="text-center">
                            <div className={`text-xl font-bold ${getScoreColor(group.averageScore)}`}>
                              {group.averageScore}%
                            </div>
                            <p className="text-xs text-gray-500">Ortalama</p>
                          </div>
                          
                          <div className={`px-3 py-2 rounded-lg border-2 ${getGradeColor(group.letterGrade)}`}>
                            <div className="text-lg font-bold text-center">{group.letterGrade}</div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {getTrendIcon(group.trend)}
                            <span className={`text-sm font-medium ${
                              group.trend === 'improving' ? 'text-green-600' : 
                              group.trend === 'declining' ? 'text-red-600' : 'text-gray-600'
                            }`}>
                              {group.trend === 'improving' ? 'Gelişiyor' : 
                               group.trend === 'declining' ? 'Düşüyor' : 'Sabit'}
                            </span>
                          </div>
                          
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => alert(`${inspectionTitle} detayları geliştiriliyor...`)}
                          >
                            <TrendingUp size={14} className="mr-1" />
                            Analiz
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Empty State */}
      {filteredChecklists.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <CheckSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Kontrol Listesi Bulunamadı
            </h3>
            <p className="text-gray-600">
              Arama kriterlerinize uygun kontrol listesi sonucu bulunamadı.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}