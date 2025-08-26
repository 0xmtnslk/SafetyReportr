import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, AlertTriangle, CheckCircle, Clock, CheckCircle2, TrendingUp, Shield, Target, Search, Building2, Grid3X3, List } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useState, useMemo } from "react";

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [selectedCity, setSelectedCity] = useState<string>("all");

  // Progress calculation function
  const calculateProgress = (report: any) => {
    // Basic progress: if report has managementSummary and generalEvaluation = 100%
    // Otherwise calculate based on available sections
    let completedSections = 0;
    const totalSections = 5; // Yönetici Özeti, Tasarım, İSG, Tamamlanmış, Genel Değerlendirme
    
    if (report.managementSummary) completedSections++;
    if (report.generalEvaluation) completedSections++;
    
    // For now, assume other sections are partially completed for demo
    // In real implementation, you'd check actual sections
    completedSections += 2; // Assume 2 more sections have some content
    
    return Math.min((completedSections / totalSections) * 100, 90); // Max 90% until fully completed
  };

  const { data: stats = {}, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stats"],
  });

  const { data: recentReports = [], isLoading: reportsLoading } = useQuery({
    queryKey: ["/api/reports"],
  });

  // For safety specialists, fetch their assignments instead of all hospitals
  const { data: hospitals = [], isLoading: hospitalsLoading } = useQuery({
    queryKey: ["/api/admin/hospitals"],
    enabled: ['central_admin', 'admin'].includes(user?.role || ''),
  });

  // Get user assignments for safety specialists
  const { data: userAssignments = [], isLoading: assignmentsLoading } = useQuery({
    queryKey: ["/api/user/assignments"],
    enabled: ['safety_specialist', 'occupational_physician'].includes(user?.role || ''),
  });

  const recentReportsData = Array.isArray(recentReports) ? recentReports : [];
  
  // Group reports by hospital
  const groupedReports = useMemo(() => {
    const hospitalsArray = Array.isArray(hospitals) ? hospitals : [];
    
    // First filter by city if selected
    let cityFilteredHospitals = hospitalsArray;
    if (selectedCity && selectedCity !== "all") {
      cityFilteredHospitals = hospitalsArray.filter((h: any) => h.city === selectedCity);
    }
    
    // Then filter reports by search term
    const filtered = recentReportsData.filter((report: any) => {
      // Only include reports from hospitals in selected city
      const hospital = cityFilteredHospitals.find((h: any) => h.id === report.locationId);
      if (!hospital) return false;
      
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      return (
        report.reportNumber?.toLowerCase().includes(searchLower) ||
        report.reporter?.toLowerCase().includes(searchLower) ||
        report.location?.toLowerCase().includes(searchLower) ||
        hospital.name.toLowerCase().includes(searchLower)
      );
    });

    const groups = filtered.reduce((acc: any, report: any) => {
      const hospital = cityFilteredHospitals.find((h: any) => h.id === report.locationId);
      const hospitalName = hospital?.name || 'Belirtilmemiş Kuruluş';
      const hospitalId = report.locationId || 'unknown';
      
      if (!acc[hospitalId]) {
        acc[hospitalId] = {
          hospitalName,
          hospitalInfo: hospital,
          reports: []
        };
      }
      acc[hospitalId].reports.push(report);
      return acc;
    }, {} as Record<string, { hospitalName: string; hospitalInfo: any; reports: any[] }>);

    // Sort hospitals by name and reports by date (newest first)
    return Object.entries(groups)
      .map(([hospitalId, data]: [string, any]) => ({
        hospitalId,
        hospitalName: data.hospitalName,
        hospitalInfo: data.hospitalInfo,
        reports: data.reports.sort((a: any, b: any) => new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime())
      }))
      .sort((a, b) => a.hospitalName.localeCompare(b.hospitalName, 'tr'));
  }, [recentReportsData, hospitals, searchTerm, selectedCity]);

  if (statsLoading || reportsLoading || hospitalsLoading || assignmentsLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

  // Safety specialists see both their reports and assigned inspections
  if (['safety_specialist', 'occupational_physician'].includes(user?.role || '')) {
    // Calculate time remaining for assignments
    const calculateTimeRemaining = (dueDate: string) => {
      const now = new Date();
      const due = new Date(dueDate);
      const diff = due.getTime() - now.getTime();
      
      if (diff <= 0) return "Süre dolmuş";
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      
      return `${days} gün ${hours} saat`;
    };

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* My Reports Section */}
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Hazırladığım Raporlar
            </h2>
            <p className="text-gray-600">
              Tarafınızca oluşturulan güvenlik raporları.
            </p>
          </div>
          
          <div className="space-y-4">
            {recentReportsData.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Henüz Rapor Oluşturulmamış
                  </h3>
                  <p className="text-gray-500">
                    İlk güvenlik raporunuzu oluşturmak için "Yeni Rapor" butonunu kullanın.
                  </p>
                </CardContent>
              </Card>
            ) : (
              recentReportsData.slice(0, 5).map((report: any) => (
                <Card key={report.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-gray-900">{report.reportNumber}</h4>
                        <p className="text-sm text-gray-600">{report.location}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(report.reportDate).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setLocation(`/reports/${report.id}`)}
                      >
                        Görüntüle
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Assigned Inspections Section */}
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Atanmış Denetimler
            </h2>
            <p className="text-gray-600">
              Size atanmış denetimleri görüntüleyebilir ve başlatabilirsiniz.
            </p>
          </div>

          <div className="space-y-6">
          {userAssignments.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Henüz Atanmış Denetim Yok
                </h3>
                <p className="text-gray-500">
                  Size atanmış bir denetim bulunmuyor. Yeni atamalar için yöneticilerle iletişim kurun.
                </p>
              </CardContent>
            </Card>
          ) : (
            userAssignments.map((assignment: any) => (
              <Card key={assignment.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {assignment.inspection?.title || 'Denetim'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        📍 {assignment.location?.name || 'Konum belirtilmemiş'}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className={`inline-flex px-2 py-1 text-xs rounded-full ${
                        assignment.status === 'pending' 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : assignment.status === 'in_progress'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {assignment.status === 'pending' ? 'Beklemede' : 
                         assignment.status === 'in_progress' ? 'Devam Ediyor' : 'Tamamlandı'}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div>
                      <span className="text-gray-500">Son Tarih:</span>
                      <div className="font-medium">
                        {assignment.inspection?.dueDate 
                          ? new Date(assignment.inspection.dueDate).toLocaleDateString('tr-TR') + ' ' + 
                            new Date(assignment.inspection.dueDate).toLocaleTimeString('tr-TR', {hour: '2-digit', minute: '2-digit'})
                          : 'Belirtilmemiş'}
                      </div>
                      {assignment.inspection?.dueDate && (
                        <div className="text-sm text-orange-600 font-medium mt-1">
                          Kalan süre: {calculateTimeRemaining(assignment.inspection.dueDate)}
                        </div>
                      )}
                    </div>
                    <div>
                      <span className="text-gray-500">Soru Sayısı:</span>
                      <div className="font-medium">{assignment.totalQuestions || 0} soru</div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                      Atanma: {assignment.createdAt 
                        ? new Date(assignment.createdAt).toLocaleDateString('tr-TR')
                        : 'Bilinmiyor'}
                    </div>
                    <Button 
                      onClick={() => setLocation(`/live-checklist?assignmentId=${assignment.id}`)}
                      disabled={assignment.status === 'completed'}
                      className="bg-primary hover:bg-primary/90"
                    >
                      {assignment.status === 'pending' ? 'Denetime Başla' : 
                       assignment.status === 'in_progress' ? 'Devam Et' : 'Tamamlandı'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Hoş Geldiniz{user?.fullName ? `, ${user.fullName}` : ""}
        </h2>
        <p className="text-gray-600">
          İş sağlığı ve güvenliği raporlarınızı burada yönetebilirsiniz.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="bg-blue-500 bg-opacity-10 p-3 rounded-xl">
                <TrendingUp className="text-blue-500 text-xl" size={20} />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Toplam Rapor</p>
                <p className="text-xl font-bold text-gray-900" data-testid="stat-total-reports">
                  {(stats as any)?.totalReports || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="bg-red-500 bg-opacity-10 p-3 rounded-xl">
                <Shield className="text-red-500 text-xl" size={20} />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Yüksek Risk Bulguları</p>
                <p className="text-xl font-bold text-gray-900" data-testid="stat-high-risk">
                  {(stats as any)?.highRiskFindings || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="bg-yellow-500 bg-opacity-10 p-3 rounded-xl">
                <AlertTriangle className="text-yellow-500 text-xl" size={20} />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Orta Risk Bulguları</p>
                <p className="text-xl font-bold text-gray-900" data-testid="stat-medium-risk">
                  {(stats as any)?.mediumRiskFindings || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="bg-green-500 bg-opacity-10 p-3 rounded-xl">
                <Target className="text-green-500 text-xl" size={20} />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Tamamlanan Bulgular</p>
                <p className="text-xl font-bold text-gray-900" data-testid="stat-completed">
                  {(stats as any)?.completedFindings || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reports by Hospital */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Hastane Raporları
            </CardTitle>
            <div className="flex items-center gap-4">
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger className="w-32" data-testid="select-city">
                  <SelectValue placeholder="Tüm Şehirler" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Şehirler</SelectItem>
                  <SelectItem value="Adana">Adana</SelectItem>
                  <SelectItem value="İstanbul">İstanbul</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Rapor, hastane veya kişi ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-80"
                  data-testid="input-search-reports"
                />
              </div>
              <div className="flex bg-muted rounded-lg p-1">
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="h-8 px-3"
                  data-testid="button-view-list"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="h-8 px-3"
                  data-testid="button-view-grid"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {recentReportsData.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Henüz rapor bulunmuyor. İlk raporunuzu oluşturun.
            </p>
          ) : groupedReports.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Arama kriterlerinize uygun rapor bulunamadı.
            </p>
          ) : (
            <>
              {/* List View */}
              {viewMode === 'list' && (
                <div className="space-y-8">
                  {groupedReports.map(({ hospitalId, hospitalName, hospitalInfo, reports }) => (
                    <div key={hospitalId} className="space-y-4">
                      {/* Hospital Header */}
                      <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
                        <div className="w-8 h-8 bg-blue-500 bg-opacity-10 rounded-lg flex items-center justify-center">
                          {hospitalInfo?.logo ? (
                            <img 
                              src={hospitalInfo.logo} 
                              alt={hospitalName}
                              className="w-6 h-6 object-contain"
                            />
                          ) : (
                            <Building2 className="text-blue-500 h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{hospitalName}</h3>
                          <p className="text-sm text-gray-500">{reports.length} rapor</p>
                        </div>
                      </div>
                      
                      {/* Hospital Reports */}
                      <div className="space-y-3 ml-2">
                        {reports.map((report: any) => (
                          <div
                            key={report.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer gap-3 border border-gray-100"
                            data-testid={`report-item-${report.id}`}
                            onClick={() => setLocation(`/view-report/${report.id}`)}
                          >
                            <div className="flex items-center flex-1 min-w-0">
                              <div className="w-10 h-10 bg-primary bg-opacity-10 rounded-xl flex items-center justify-center mr-3 flex-shrink-0">
                                <FileText className="text-primary" size={18} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-gray-900 truncate">
                                  Rapor #{report.reportNumber}
                                </p>
                                <p className="text-sm text-gray-500 truncate">
                                  {new Date(report.reportDate).toLocaleDateString("tr-TR")} - {report.reporter}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 sm:justify-end flex-shrink-0">
                              <div className="flex items-center gap-2">
                                {report.status === "completed" ? (
                                  <div className="flex flex-col gap-2">
                                    <div className="relative w-32 bg-success h-6 rounded-full flex items-center justify-center">
                                      <CheckCircle2 size={14} className="mr-1" />
                                      <span className="text-xs font-medium text-white">
                                        Tamamlandı
                                      </span>
                                    </div>
                                    <div className="text-xs text-gray-500 text-center">
                                      %100 tamamlandı
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex flex-col gap-2">
                                    <div className="relative w-32 bg-gray-200 rounded-full h-6">
                                      <div 
                                        className="bg-warning h-6 rounded-full transition-all duration-300 flex items-center justify-center" 
                                        style={{ width: `${Math.max(calculateProgress(report), 25)}%` }}
                                      >
                                        <span className="text-xs font-medium text-white whitespace-nowrap px-2">
                                          {calculateProgress(report) === 100 ? 'Hazır' : 'Devam Ediyor'}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="text-xs text-gray-500 text-center">
                                      {Math.round(calculateProgress(report))}% tamamlandı
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Grid View */}
              {viewMode === 'grid' && (
                <div className="space-y-8">
                  {groupedReports.map(({ hospitalId, hospitalName, hospitalInfo, reports }) => (
                    <div key={hospitalId} className="space-y-4">
                      {/* Hospital Header */}
                      <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
                        <div className="w-8 h-8 bg-blue-500 bg-opacity-10 rounded-lg flex items-center justify-center">
                          {hospitalInfo?.logo ? (
                            <img 
                              src={hospitalInfo.logo} 
                              alt={hospitalName}
                              className="w-6 h-6 object-contain"
                            />
                          ) : (
                            <Building2 className="text-blue-500 h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{hospitalName}</h3>
                          <p className="text-sm text-gray-500">{reports.length} rapor</p>
                        </div>
                      </div>
                      
                      {/* Hospital Reports Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ml-2">
                        {reports.map((report: any) => (
                          <Card
                            key={report.id}
                            className="cursor-pointer hover:shadow-md transition-shadow border border-gray-100"
                            onClick={() => setLocation(`/view-report/${report.id}`)}
                            data-testid={`report-card-${report.id}`}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-3">
                                <div className="w-10 h-10 bg-primary bg-opacity-10 rounded-xl flex items-center justify-center">
                                  <FileText className="text-primary" size={18} />
                                </div>
                                <div className="text-right">
                                  {report.status === "completed" ? (
                                    <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success text-white">
                                      <CheckCircle2 size={12} className="mr-1" />
                                      Tamamlandı
                                    </div>
                                  ) : (
                                    <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-warning text-white">
                                      <Clock size={12} className="mr-1" />
                                      Devam Ediyor
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <h4 className="font-medium text-gray-900">
                                  Rapor #{report.reportNumber}
                                </h4>
                                <p className="text-sm text-gray-500">
                                  {new Date(report.reportDate).toLocaleDateString("tr-TR")}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {report.reporter}
                                </p>
                                
                                {/* Progress Bar for Grid View */}
                                <div className="mt-3">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs text-gray-500">İlerleme</span>
                                    <span className="text-xs text-gray-500">
                                      {report.status === "completed" ? "100" : Math.round(calculateProgress(report))}%
                                    </span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                      className={`h-2 rounded-full transition-all duration-300 ${
                                        report.status === "completed" ? "bg-success" : "bg-warning"
                                      }`}
                                      style={{ 
                                        width: `${report.status === "completed" ? "100" : Math.max(calculateProgress(report), 25)}%` 
                                      }}
                                    ></div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
