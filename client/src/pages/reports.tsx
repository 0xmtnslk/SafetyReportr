import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Download, Plus, FileText, Edit, Eye, Trash2, CheckSquare, Search, TrendingUp, Users } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import PDFPreview from "@/components/pdf-preview";

export default function Reports() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Get initial tab from URL params with role-based access control
  const getInitialTab = () => {
    const searchParams = new URLSearchParams(window.location.search);
    const requestedTab = searchParams.get('tab');
    const availableTabs = ['free-reports', 'checklist-reports'];
    
    // Add admin-only tabs if user has access
    if (['central_admin', 'admin'].includes(user?.role || '')) {
      availableTabs.push('inspection-results', 'admin-inspections');
    }
    
    return requestedTab && availableTabs.includes(requestedTab) 
      ? requestedTab 
      : 'free-reports';
  };
  
  const [activeTab, setActiveTab] = useState(getInitialTab);
  
  // Update URL when tab changes using wouter's setLocation
  const handleTabChange = (tab: string) => {
    // Guard against unauthorized admin tabs
    const availableTabs = ['free-reports', 'checklist-reports'];
    if (['central_admin', 'admin'].includes(user?.role || '')) {
      availableTabs.push('inspection-results', 'admin-inspections');
    }
    
    if (!availableTabs.includes(tab)) {
      toast({
        title: "Yetkisiz Erişim",
        description: "Bu sekmeye erişim yetkiniz bulunmamaktadır.",
        variant: "destructive",
      });
      return;
    }
    
    setActiveTab(tab);
    const newUrl = `/reports${tab !== 'free-reports' ? `?tab=${tab}` : ''}`;
    setLocation(newUrl);
  };
  
  // Handle browser back/forward navigation
  React.useEffect(() => {
    const handlePopState = () => {
      const newTab = getInitialTab();
      setActiveTab(newTab);
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [user?.role]); // Re-run if user role changes

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Raporlar</h1>
            <p className="text-gray-600 dark:text-gray-400">Tüm rapor türlerinizi tek yerden yönetin</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setLocation("/create-report")}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              data-testid="button-create-report"
            >
              <Plus className="mr-2 h-4 w-4" />
              Yeni Serbest Rapor
            </Button>
            {['central_admin', 'admin'].includes(user?.role || '') && (
              <Button
                onClick={() => setLocation("/checklist")}
                variant="outline"
                className="border-green-600 text-green-600 hover:bg-green-50"
                data-testid="button-checklist-management"
              >
                <CheckSquare className="mr-2 h-4 w-4" />
                Checklist Oluştur
              </Button>
            )}
          </div>
        </div>
        
        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className={`grid w-full ${['central_admin', 'admin'].includes(user?.role || '') ? 'grid-cols-4' : 'grid-cols-2'}`}>
            <TabsTrigger value="free-reports" data-testid="tab-free-reports">
              <FileText className="mr-2 h-4 w-4" />
              Serbest Raporlar
            </TabsTrigger>
            <TabsTrigger value="checklist-reports" data-testid="tab-checklist-reports">
              <CheckSquare className="mr-2 h-4 w-4" />
              Checklist Raporları
            </TabsTrigger>
            {['central_admin', 'admin'].includes(user?.role || '') && (
              <>
                <TabsTrigger value="inspection-results" data-testid="tab-inspection-results">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Denetim Sonuçları
                </TabsTrigger>
                <TabsTrigger value="admin-inspections" data-testid="tab-admin-inspections">
                  <Users className="mr-2 h-4 w-4" />
                  Admin Denetimleri
                </TabsTrigger>
              </>
            )}
          </TabsList>
          
          {/* Free Reports Tab */}
          <TabsContent value="free-reports" className="space-y-6">
            <FreeReportsContent />
          </TabsContent>
          
          {/* Checklist Reports Tab */}
          <TabsContent value="checklist-reports" className="space-y-6">
            <ChecklistReportsContent />
          </TabsContent>
          
          {/* Inspection Results Tab */}
          {['central_admin', 'admin'].includes(user?.role || '') && (
            <>
              <TabsContent value="inspection-results" className="space-y-6">
                <InspectionResultsContent />
              </TabsContent>
              
              <TabsContent value="admin-inspections" className="space-y-6">
                <AdminInspectionsContent />
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </div>
  );
}

// Free Reports Component (Original Reports functionality)
function FreeReportsContent() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedReportForPDF, setSelectedReportForPDF] = useState<any>(null);
  const [reportFindings, setReportFindings] = useState<any[]>([]);

  const handleDeleteReport = async (reportId: string, reportNumber: string, status: string) => {
    if (status === 'completed') {
      toast({
        title: "Uyarı",
        description: "Tamamlanmış raporlar silinemez",
        variant: "destructive",
      });
      return;
    }

    if (confirm(`${reportNumber} raporu silinecek. Emin misiniz?`)) {
      try {
        const response = await fetch(`/api/reports/${reportId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Silme işlemi başarısız');
        }
        
        await queryClient.invalidateQueries({ queryKey: ['/api/reports'] });
        
        toast({
          title: "Başarılı",
          description: `${reportNumber} raporu silindi`,
        });
      } catch (error: any) {
        toast({
          title: "Hata",
          description: error.message || "Rapor silinirken hata oluştu",
          variant: "destructive",
        });
      }
    }
  };

  const [filters, setFilters] = useState({
    status: "all",
    riskLevel: "all",
    startDate: "",
    endDate: "",
  });

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["/api/reports"],
  });

  const handleExportPDF = async (report: any) => {
    try {
      toast({
        title: "PDF Oluşturuluyor",
        description: "Rapor PDF olarak hazırlanıyor...",
      });

      const response = await fetch(`/api/reports/${report.id}/pdf`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('PDF oluşturulamadı');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ISG_Raporu_${report.reportNumber || new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "PDF İndirildi",
        description: "Rapor başarıyla PDF olarak indirildi.",
      });
    } catch (error) {
      console.error('PDF export error:', error);
      toast({
        title: "Hata",
        description: `PDF oluşturulurken hata: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`,
        variant: "destructive",
      });
    }
  };

  const filteredReports = Array.isArray(reports) ? reports.filter((report: any) => {
    if (filters.status !== "all") {
      if (filters.status === "in_progress" && report.status !== "in_progress" && report.status !== "draft") {
        return false;
      } else if (filters.status === "completed" && report.status !== "completed") {
        return false;
      } else if (filters.status === "draft" && report.status !== "draft") {
        return false;
      }
    }
    if (filters.startDate && new Date(report.reportDate) < new Date(filters.startDate)) return false;
    if (filters.endDate && new Date(report.reportDate) > new Date(filters.endDate)) return false;
    return true;
  }) : [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-success bg-opacity-10 text-success";
      case "in_progress":
        return "bg-warning bg-opacity-10 text-warning";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Tamamlandı";
      case "in_progress":
        return "Devam Ediyor";
      case "draft":
        return "Devam Ediyor";
      default:
        return "Devam Ediyor";
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 bg-gray-200 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 sm:mb-0">
          Serbest Raporlar ({reports.length})
        </h2>
        <div className="flex space-x-3">
          <Button variant="outline" data-testid="button-export-all" onClick={() => toast({ title: "Export functionality is under development." })}>
            <Download className="mr-2" size={16} />
            Dışa Aktar
          </Button>
          <Button onClick={() => setLocation("/create-report")} data-testid="button-new-report">
            <Plus className="mr-2" size={16} />
            Yeni Rapor
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Duruma Göre Filtrele</Label>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters({ ...filters, status: value })}
              >
                <SelectTrigger data-testid="filter-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  <SelectItem value="in_progress">Devam Ediyor</SelectItem>
                  <SelectItem value="completed">Tamamlandı</SelectItem>
                  <SelectItem value="draft">Taslak</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Risk Seviyesi</Label>
              <Select
                value={filters.riskLevel}
                onValueChange={(value) => setFilters({ ...filters, riskLevel: value })}
              >
                <SelectTrigger data-testid="filter-risk">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  <SelectItem value="high">Yüksek Risk</SelectItem>
                  <SelectItem value="medium">Orta Risk</SelectItem>
                  <SelectItem value="low">Düşük Risk</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">Başlangıç Tarihi</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                data-testid="filter-start-date"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">Bitiş Tarihi</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                data-testid="filter-end-date"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredReports.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <FileText className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Rapor Bulunamadı
            </h3>
            <p className="text-gray-500 mb-6">
              Seçili filtrelere uygun rapor bulunmuyor.
            </p>
            <Button onClick={() => setLocation("/create-report")}>
              <Plus className="mr-2" size={16} />
              İlk Raporunuzu Oluşturun
            </Button>
          </div>
        ) : (
          filteredReports.map((report: any) => (
            <Card
              key={report.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              data-testid={`report-card-${report.id}`}
              onClick={() => setLocation(`/view-report/${report.id}`)}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-gray-500">
                    Rapor #{report.reportNumber}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                      report.status
                    )}`}
                  >
                    {getStatusText(report.status)}
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {report.projectLocation}
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  {new Date(report.reportDate).toLocaleDateString("tr-TR")} - {report.reporter}
                </p>

                <div className="space-y-3">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-danger rounded-full mr-2"></div>
                      <span className="text-sm text-gray-600">{report.highRiskCount || 0} Yüksek</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-warning rounded-full mr-2"></div>
                      <span className="text-sm text-gray-600">{report.mediumRiskCount || 0} Orta</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-success rounded-full mr-2"></div>
                      <span className="text-sm text-gray-600">{report.lowRiskCount || 0} Düşük</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLocation(`/edit-report/${report.id}`);
                        }}
                        data-testid={`button-edit-${report.id}`}
                        className="text-xs px-3 py-1"
                      >
                        <Edit size={12} className="mr-1" />
                        Düzenle
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLocation(`/view-report/${report.id}`);
                        }}
                        data-testid={`button-view-${report.id}`}
                        className="text-xs px-3 py-1"
                      >
                        <Eye size={12} className="mr-1" />
                        Önizle
                      </Button>
                      {(report.status === 'draft' || report.status === 'in_progress') && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteReport(report.id, report.reportNumber, report.status);
                          }}
                          data-testid={`button-delete-${report.id}`}
                          className="text-xs px-3 py-1 text-red-600 hover:text-red-800 hover:border-red-300"
                        >
                          <Trash2 size={12} className="mr-1" />
                          Sil
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExportPDF(report);
                        }}
                        data-testid={`button-export-${report.id}`}
                        className="text-xs px-3 py-1"
                      >
                        <Download size={12} className="mr-1" />
                        İndir
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {selectedReportForPDF && (
        <PDFPreview
          reportData={selectedReportForPDF}
          findings={reportFindings}
        />
      )}
    </div>
  );
}

// Checklist Reports Component
function ChecklistReportsContent() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  // Fetch checklist templates
  const { data: templates = [], isLoading: templatesLoading } = useQuery<any[]>({
    queryKey: ["/api/checklist/templates"],
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Checklist Raporları</h2>
          <p className="text-sm text-gray-600">Kontrol listelerinden oluşturulan raporlar</p>
        </div>
        {['central_admin', 'admin'].includes(user?.role || '') && (
          <Button onClick={() => setLocation("/checklist")} variant="outline" data-testid="button-checklist-management">
            <CheckSquare className="mr-2 h-4 w-4" />
            Checklist Yönetimi
          </Button>
        )}
      </div>
      
      {templatesLoading ? (
        <div className="text-center py-4">Yükleniyor...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <Card key={template.id} className="hover:shadow-lg transition-shadow" data-testid={`template-card-${template.id}`}>
              <CardHeader>
                <CardTitle className="text-lg">{template.name}</CardTitle>
                <p className="text-sm text-gray-600">{template.description}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Durum:</span>
                    <Badge variant={template.isActive ? "default" : "secondary"}>
                      {template.isActive ? "Aktif" : "Pasif"}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tür:</span>
                    <span className="capitalize">{template.templateType}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Versiyon:</span>
                    <span>{template.version}</span>
                  </div>
                  <div className="pt-2 flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => setLocation(`/checklist/template/${template.id}`)}
                      className="flex-1"
                      data-testid={`button-view-template-${template.id}`}
                    >
                      <Eye className="mr-1 h-3 w-3" />
                      Görüntüle
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setLocation(`/checklist/results/${template.id}`)}
                      className="flex-1"
                      data-testid={`button-view-reports-${template.id}`}
                    >
                      <FileText className="mr-1 h-3 w-3" />
                      Raporlar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Inspection Results Component
function InspectionResultsContent() {
  const { data: inspections = [], isLoading: inspectionsLoading } = useQuery({
    queryKey: ["/api/admin/inspections"],
  });
  
  const { data: inspectionTitles = [], isLoading: titlesLoading } = useQuery({
    queryKey: ["/api/admin/inspection-titles"],
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Denetim Sonuçları</h2>
        <p className="text-sm text-gray-600">Tamamlanan denetim sonuçlarını görüntüleyin</p>
      </div>
      
      {inspectionsLoading || titlesLoading ? (
        <div className="text-center py-4">Yükleniyor...</div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-blue-600" data-testid="total-inspections">{inspections.length}</div>
                <div className="text-sm text-gray-600">Toplam Denetim</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-600" data-testid="completed-inspections">
                  {inspections.filter((i: any) => i.status === 'completed').length}
                </div>
                <div className="text-sm text-gray-600">Tamamlanmış</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-orange-600" data-testid="pending-inspections">
                  {inspections.filter((i: any) => i.status === 'pending').length}
                </div>
                <div className="text-sm text-gray-600">Beklemede</div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Son Denetimler</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {inspections.slice(0, 5).map((inspection: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg" data-testid={`inspection-item-${index}`}>
                    <div>
                      <div className="font-medium">{inspection.inspectionTitle}</div>
                      <div className="text-sm text-gray-600">{inspection.hospitalName}</div>
                    </div>
                    <div className="text-right">
                      <Badge variant={inspection.status === 'completed' ? 'default' : 'secondary'}>
                        {inspection.status === 'completed' ? 'Tamamlandı' : 'Beklemede'}
                      </Badge>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(inspection.completedAt || inspection.createdAt).toLocaleDateString('tr-TR')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// Admin Inspections Component
function AdminInspectionsContent() {
  const { data: inspections = [], isLoading } = useQuery({
    queryKey: ["/api/admin/inspections"],
  });

  // Process inspections to group by hospital
  const processInspectionsByHospital = () => {
    const hospitalMap: Record<string, any> = {};
    
    inspections.forEach((inspection: any) => {
      const hospitalName = inspection.hospitalName || 'Bilinmeyen Hastane';
      if (!hospitalMap[hospitalName]) {
        hospitalMap[hospitalName] = {
          name: hospitalName,
          inspections: [],
          totalScore: 0,
          completedCount: 0
        };
      }
      
      hospitalMap[hospitalName].inspections.push(inspection);
      
      if (inspection.status === 'completed' && inspection.score) {
        hospitalMap[hospitalName].totalScore += inspection.score;
        hospitalMap[hospitalName].completedCount += 1;
      }
    });
    
    return Object.values(hospitalMap).map((hospital: any) => ({
      ...hospital,
      averageScore: hospital.completedCount > 0 
        ? Math.round(hospital.totalScore / hospital.completedCount) 
        : 0
    }));
  };

  const hospitalData = processInspectionsByHospital();

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Admin Denetimleri</h2>
        <p className="text-sm text-gray-600">Hastane bazında denetim yönetimi</p>
      </div>
      
      {isLoading ? (
        <div className="text-center py-4">Yükleniyor...</div>
      ) : (
        <div className="space-y-4">
          {hospitalData.map((hospital: any, index: number) => (
            <Card key={index} data-testid={`hospital-card-${index}`}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{hospital.name}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {hospital.inspections.length} Denetim
                    </Badge>
                    <Badge variant={hospital.averageScore >= 80 ? 'default' : hospital.averageScore >= 60 ? 'secondary' : 'destructive'}>
                      Ort. %{hospital.averageScore}
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {hospital.inspections.slice(0, 3).map((inspection: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded" data-testid={`hospital-inspection-${index}-${idx}`}>
                      <div>
                        <div className="text-sm font-medium">{inspection.inspectionTitle}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(inspection.createdAt).toLocaleDateString('tr-TR')}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={inspection.status === 'completed' ? 'default' : 'secondary'}>
                          {inspection.status === 'completed' ? 'Tamamlandı' : 'Beklemede'}
                        </Badge>
                        {inspection.score && (
                          <div className="text-xs text-gray-600 mt-1">%{inspection.score}</div>
                        )}
                      </div>
                    </div>
                  ))}
                  {hospital.inspections.length > 3 && (
                    <div className="text-center text-sm text-gray-500 pt-2">
                      +{hospital.inspections.length - 3} daha fazla denetim
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}