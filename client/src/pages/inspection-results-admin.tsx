import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Search, Building2, TrendingUp, Award, Eye, Filter, CheckSquare, Activity, ChevronRight, Calendar, Users, BarChart3 } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";

export default function InspectionResultsAdmin() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");

  // Fetch all completed inspections
  const { data: inspections = [], isLoading: inspectionsLoading } = useQuery({
    queryKey: ["/api/admin/inspections"],
  });
  
  // Fetch all inspection titles (including pending)
  const { data: inspectionTitles = [], isLoading: titlesLoading } = useQuery({
    queryKey: ["/api/admin/inspection-titles"],
  });
  
  // Fetch all hospitals to get proper names
  const { data: hospitals = [], isLoading: hospitalsLoading } = useQuery({
    queryKey: ["/api/admin/hospitals"],
  });
  
  const isLoading = inspectionsLoading || titlesLoading || hospitalsLoading;
  
  // Create hospital lookup map
  const hospitalLookup = hospitals.reduce((acc: any, hospital: any) => {
    acc[hospital.id] = hospital.name;
    return acc;
  }, {});

  // Group inspections by hospital (both completed and pending)
  const processInspectionsByHospital = () => {
    const hospitalMap: Record<string, any> = {};
    
    // Process completed inspections first
    inspections.forEach((inspection: any) => {
      const locationId = inspection.location?.id || 'unknown';
      const locationName = inspection.location?.name || 'Bilinmeyen Hastane';
      const checklistTitle = inspection.inspection?.title || 'Bilinmeyen Kontrol Listesi';
      
      if (!hospitalMap[locationId]) {
        hospitalMap[locationId] = {
          id: locationId,
          name: locationName,
          inspectionTypes: new Set(),
          inspections: [],
          totalInspections: 0,
          pendingInspections: 0,
          averageScore: 0,
          letterGrade: 'E'
        };
      }
      
      hospitalMap[locationId].inspectionTypes.add(checklistTitle);
      hospitalMap[locationId].inspections.push(inspection);
      hospitalMap[locationId].totalInspections++;
    });
    
    // Process pending inspection titles to add hospitals and count pending
    inspectionTitles.forEach((inspectionTitle: any) => {
      const templateName = inspectionTitle.template?.name || 'Bilinmeyen Kontrol Listesi';
      
      // For each hospital this inspection is assigned to
      (inspectionTitle.targetLocationIds || []).forEach((locationId: string) => {
        // Try to get hospital name from existing data, or create new entry
        if (!hospitalMap[locationId]) {
          hospitalMap[locationId] = {
            id: locationId,
            name: hospitalLookup[locationId] || `Bilinmeyen Hastane ${locationId.substring(0, 8)}`, // Use real name
            inspectionTypes: new Set(),
            inspections: [],
            totalInspections: 0,
            pendingInspections: 0,
            averageScore: 0,
            letterGrade: 'E'
          };
        }
        
        hospitalMap[locationId].inspectionTypes.add(templateName);
        hospitalMap[locationId].pendingInspections++;
      });
    });
    
    // Calculate statistics for each hospital
    Object.values(hospitalMap).forEach((hospital: any) => {
      const scores = hospital.inspections.map((i: any) => i.scorePercentage || 0);
      hospital.averageScore = scores.length > 0 ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : 0;
      hospital.letterGrade = hospital.averageScore >= 90 ? "A" :
                            hospital.averageScore >= 75 ? "B" :
                            hospital.averageScore >= 50 ? "C" :
                            hospital.averageScore >= 25 ? "D" : "E";
      hospital.inspectionTypeCount = hospital.inspectionTypes.size;
      hospital.inspectionTypes = Array.from(hospital.inspectionTypes);
    });
    
    return Object.values(hospitalMap);
  };

  // Filter hospitals
  const filteredHospitals = processInspectionsByHospital().filter((hospital: any) => {
    const matchesSearch = hospital.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGrade = gradeFilter === "all" || hospital.letterGrade === gradeFilter;
    
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

  // Calculate overall statistics
  const totalHospitals = filteredHospitals.length;
  const totalInspections = filteredHospitals.reduce((sum, h) => sum + h.totalInspections, 0);
  const overallAverage = filteredHospitals.length > 0 ? 
    Math.round(filteredHospitals.reduce((sum, h) => sum + h.averageScore, 0) / filteredHospitals.length) : 0;

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
            <h1 className="text-3xl font-bold text-gray-900">Hastane Bazlı Denetim Sonuçları</h1>
            <p className="text-gray-600 mt-1">Hastanelerin genel denetim performansı ve detaylı analizler</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline">{totalHospitals} Hastane</Badge>
          <Badge className="bg-blue-100 text-blue-800">
            {totalInspections} Denetim
          </Badge>
          <Badge className={`${getGradeColor(
            overallAverage >= 90 ? "A" :
            overallAverage >= 75 ? "B" :
            overallAverage >= 50 ? "C" :
            overallAverage >= 25 ? "D" : "E"
          )}`}>
            Genel Ortalama: {overallAverage}%
          </Badge>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{totalHospitals}</div>
            <p className="text-sm text-gray-600">Toplam Hastane</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <CheckSquare className="w-6 h-6 text-green-600" />
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
            <div className="text-2xl font-bold text-gray-900">
              {filteredHospitals.filter(h => h.letterGrade === 'A').length}
            </div>
            <p className="text-sm text-gray-600">A Notlu Hastane</p>
          </CardContent>
        </Card>
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

      {/* Hospital List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Hastane Listesi
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {filteredHospitals.map((hospital: any) => (
              <div 
                key={hospital.id} 
                className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => setLocation(`/hospital-inspections/${hospital.id}`)}
              >
                <div className="flex items-center justify-between">
                  {/* Hospital Info */}
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-6 h-6 text-blue-600" />
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900">{hospital.name}</h3>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <CheckSquare className="w-4 h-4" />
                          <span>{hospital.inspectionTypeCount} Denetim Çeşidi</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>{hospital.totalInspections} Toplam Denetim</span>
                        </div>
                      </div>
                      
                      {/* Inspection Types */}
                      <div className="flex flex-wrap gap-2 mt-3">
                        {hospital.inspectionTypes.map((type: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {type}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Stats */}
                  <div className="flex items-center gap-6 flex-shrink-0">
                    <div className="text-center">
                      <div className={`text-3xl font-bold ${getScoreColor(hospital.averageScore)}`}>
                        {hospital.averageScore}%
                      </div>
                      <p className="text-xs text-gray-500">Genel Ortalama</p>
                    </div>
                    
                    <div className={`px-4 py-3 rounded-xl border-2 ${getGradeColor(hospital.letterGrade)}`}>
                      <div className="text-2xl font-bold text-center">{hospital.letterGrade}</div>
                    </div>
                    
                    <Button variant="outline" size="sm">
                      <Eye size={14} className="mr-2" />
                      Detaylar
                    </Button>
                    
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Empty State */}
      {filteredHospitals.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Hastane Bulunamadı
            </h3>
            <p className="text-gray-600">
              Arama kriterlerinize uygun hastane bulunamadı.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}