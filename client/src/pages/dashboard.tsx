import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FileText, AlertTriangle, CheckCircle, Clock, CheckCircle2, TrendingUp, Shield, Target, Search, Building2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useState, useMemo } from "react";

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");

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

  const { data: hospitals = [], isLoading: hospitalsLoading } = useQuery({
    queryKey: ["/api/admin/hospitals"],
  });

  if (statsLoading || reportsLoading || hospitalsLoading) {
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

  const recentReportsData = Array.isArray(recentReports) ? recentReports : [];
  
  // Group reports by hospital
  const groupedReports = useMemo(() => {
    const filtered = recentReportsData.filter(report => {
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      return (
        report.reportNumber?.toLowerCase().includes(searchLower) ||
        report.reporter?.toLowerCase().includes(searchLower) ||
        report.location?.toLowerCase().includes(searchLower) ||
        hospitals.find(h => h.id === report.locationId)?.name.toLowerCase().includes(searchLower)
      );
    });

    const groups = filtered.reduce((acc, report) => {
      const hospital = hospitals.find(h => h.id === report.locationId);
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
      .map(([hospitalId, data]) => ({
        hospitalId,
        ...data,
        reports: data.reports.sort((a, b) => new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime())
      }))
      .sort((a, b) => a.hospitalName.localeCompare(b.hospitalName, 'tr'));
  }, [recentReportsData, hospitals, searchTerm]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
        </CardContent>
      </Card>
    </div>
  );
}
