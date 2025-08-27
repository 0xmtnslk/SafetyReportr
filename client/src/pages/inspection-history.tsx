import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Search, FileBarChart, TrendingUp, Calendar, Eye, CheckCircle2 } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function InspectionHistory() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [gradeFilter, setGradeFilter] = useState("all");

  // Fetch user's completed inspections
  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ["/api/user/assignments"],
  });

  // Filter completed inspections only
  const completedInspections = assignments.filter((assignment: any) => 
    assignment.status === 'completed'
  );

  // Apply search and filters
  const filteredInspections = completedInspections.filter((assignment: any) => {
    const matchesSearch = assignment.inspection?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         assignment.location?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "recent" && assignment.completedAt && 
       new Date(assignment.completedAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    const matchesGrade = gradeFilter === "all" || assignment.letterGrade === gradeFilter;
    
    return matchesSearch && matchesStatus && matchesGrade;
  }).sort((a: any, b: any) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());

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
          <Button variant="outline" onClick={() => setLocation('/dashboard')}>
            <ArrowLeft size={16} className="mr-2" />
            Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Denetim Geçmişim</h1>
            <p className="text-gray-600 mt-1">Tamamladığınız denetim sonuçlarını görüntüleyin</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline">{filteredInspections.length} Denetim</Badge>
          <Badge className="bg-green-100 text-green-800">
            {completedInspections.length} Tamamlandı
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
                  placeholder="Denetim ara..."
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

      {/* Inspection History Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredInspections.map((assignment: any) => (
          <Card key={assignment.id} className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-green-500">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-lg truncate" title={assignment.inspection?.title}>
                      {assignment.inspection?.title}
                    </CardTitle>
                    <p className="text-sm text-gray-600 truncate" title={assignment.location?.name}>
                      {assignment.location?.name}
                    </p>
                  </div>
                </div>
                
                <div className={`px-3 py-2 rounded-lg border-2 ${getGradeColor(assignment.letterGrade || 'E')}`}>
                  <div className="text-xl font-bold">{assignment.letterGrade || 'E'}</div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Score Display */}
              <div className="text-center">
                <div className={`text-3xl font-bold ${getScoreColor(assignment.scorePercentage || 0)}`}>
                  {assignment.scorePercentage || 0}%
                </div>
                <p className="text-sm text-gray-600">Final Puan</p>
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-xl font-semibold text-gray-900">
                    {assignment.answeredQuestions || 0}
                  </div>
                  <p className="text-xs text-gray-600">Cevaplanan</p>
                </div>
                <div>
                  <div className="text-xl font-semibold text-gray-900">
                    {assignment.completedAt ? 
                      new Date(assignment.completedAt).toLocaleDateString('tr-TR', { 
                        day: '2-digit', 
                        month: '2-digit',
                        year: '2-digit'
                      }) : 
                      'N/A'
                    }
                  </div>
                  <p className="text-xs text-gray-600">Tamamlandı</p>
                </div>
              </div>
              
              {/* Completion Date */}
              <div className="flex items-center justify-center gap-1 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>
                  {assignment.completedAt ? 
                    new Date(assignment.completedAt).toLocaleDateString('tr-TR', { 
                      day: 'numeric', 
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : 
                    'Tarih bilinmiyor'
                  }
                </span>
              </div>
              
              {/* Action Button */}
              <div className="pt-2">
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={() => setLocation(`/inspection-results/${assignment.id}`)}
                >
                  <Eye size={14} className="mr-2" />
                  Sonuçları Görüntüle
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredInspections.length === 0 && (
        <div className="text-center py-12">
          <FileBarChart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {completedInspections.length === 0 ? 'Henüz Tamamlanmış Denetim Yok' : 'Denetim Bulunamadı'}
          </h3>
          <p className="text-gray-600">
            {completedInspections.length === 0 
              ? 'Denetimlerinizi tamamladığınızda sonuçları burada görebileceksiniz.'
              : 'Arama kriterlerinize uygun denetim sonucu bulunamadı.'
            }
          </p>
        </div>
      )}
    </div>
  );
}