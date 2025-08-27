import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Search, Building2, TrendingUp, Award, Eye, Filter } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";

export default function AdminInspections() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [gradeFilter, setGradeFilter] = useState("all");

  // Fetch all completed inspections grouped by hospital
  const { data: inspections = [], isLoading } = useQuery({
    queryKey: ["/api/admin/inspections"],
  });

  // Process inspections to group by hospital
  const processInspectionsByHospital = () => {
    const hospitalMap: Record<string, any> = {};
    
    inspections.forEach((inspection: any) => {
      const hospitalId = inspection.location?.id || 'unknown';
      const hospitalName = inspection.location?.name || 'Bilinmeyen Hastane';
      
      if (!hospitalMap[hospitalId]) {
        hospitalMap[hospitalId] = {
          id: hospitalId,
          name: hospitalName,
          inspections: [],
          totalInspections: 0,
          averageScore: 0,
          letterGrade: 'E',
          lastInspection: null
        };
      }
      
      hospitalMap[hospitalId].inspections.push(inspection);
      hospitalMap[hospitalId].totalInspections++;
      
      if (!hospitalMap[hospitalId].lastInspection || 
          new Date(inspection.completedAt) > new Date(hospitalMap[hospitalId].lastInspection.completedAt)) {
        hospitalMap[hospitalId].lastInspection = inspection;
      }
    });
    
    // Calculate averages and grades
    Object.values(hospitalMap).forEach((hospital: any) => {
      const scores = hospital.inspections.map((i: any) => i.scorePercentage || 0);
      hospital.averageScore = Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length);
      hospital.letterGrade = hospital.averageScore >= 90 ? "A" :
                            hospital.averageScore >= 75 ? "B" :
                            hospital.averageScore >= 50 ? "C" :
                            hospital.averageScore >= 25 ? "D" : "E";
    });
    
    return Object.values(hospitalMap);
  };

  // Filter hospitals based on search and filters
  const filteredHospitals = processInspectionsByHospital().filter((hospital: any) => {
    const matchesSearch = hospital.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "recent" && hospital.lastInspection && 
       new Date(hospital.lastInspection.completedAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    const matchesGrade = gradeFilter === "all" || hospital.letterGrade === gradeFilter;
    
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
          <Button variant="outline" onClick={() => setLocation('/admin')}>
            <ArrowLeft size={16} className="mr-2" />
            Admin Panel
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Denetim Yönetimi</h1>
            <p className="text-gray-600 mt-1">Hastane denetim sonuçları ve performans analizi</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline">{filteredHospitals.length} Hastane</Badge>
          <Badge className="bg-blue-100 text-blue-800">
            {inspections.length} Denetim
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
                  placeholder="Hastane ara..."
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

      {/* Hospital Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredHospitals.map((hospital: any, index: number) => (
          <Card key={hospital.id} className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-lg truncate">{hospital.name}</CardTitle>
                    <p className="text-sm text-gray-600">
                      Sıralama: #{index + 1}
                    </p>
                  </div>
                </div>
                
                <div className={`px-3 py-2 rounded-lg border-2 ${getGradeColor(hospital.letterGrade)}`}>
                  <div className="text-xl font-bold">{hospital.letterGrade}</div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Score Display */}
              <div className="text-center">
                <div className={`text-3xl font-bold ${getScoreColor(hospital.averageScore)}`}>
                  {hospital.averageScore}%
                </div>
                <p className="text-sm text-gray-600">Ortalama Puan</p>
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-xl font-semibold text-gray-900">
                    {hospital.totalInspections}
                  </div>
                  <p className="text-xs text-gray-600">Denetim</p>
                </div>
                <div>
                  <div className="text-xl font-semibold text-gray-900">
                    {hospital.lastInspection ? 
                      new Date(hospital.lastInspection.completedAt).toLocaleDateString('tr-TR', { 
                        day: '2-digit', 
                        month: '2-digit' 
                      }) : 
                      'N/A'
                    }
                  </div>
                  <p className="text-xs text-gray-600">Son Denetim</p>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => setLocation(`/admin/hospital/${hospital.id}/inspections`)}
                >
                  <Eye size={14} className="mr-1" />
                  Detaylar
                </Button>
                <Button 
                  size="sm" 
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  onClick={() => setLocation(`/admin/hospital/${hospital.id}/analysis`)}
                >
                  <TrendingUp size={14} className="mr-1" />
                  Analiz
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredHospitals.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
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