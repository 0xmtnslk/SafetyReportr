import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, CheckSquare, ClipboardList, TrendingUp, AlertTriangle, Calendar, Plus, FileText, Clock, Target } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "../hooks/useAuth";

export default function SpecialistDashboard() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  // Fetch user's hospital and checklists
  const { data: userAssignments = [], isLoading: assignmentsLoading } = useQuery({
    queryKey: ["/api/user/assignments"],
  });

  // Fetch checklist templates for specialist's hospital
  const { data: checklistTemplates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ["/api/checklist/templates"],
  });

  // Get user's hospital (assuming specialist is assigned to one hospital)
  const userHospital = userAssignments[0]?.hospital || null;
  const hospitalId = userHospital?.id;

  // Fetch recent inspections for this hospital
  const { data: recentInspections = [], isLoading: inspectionsLoading } = useQuery({
    queryKey: [`/api/hospital/${hospitalId}/recent-inspections`],
    enabled: !!hospitalId,
  });

  // Fetch reports for specialist
  const { data: reports = [], isLoading: reportsLoading } = useQuery({
    queryKey: ["/api/reports"],
  });

  // Fetch stats for reports
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stats"],
  });

  const isLoading = assignmentsLoading || templatesLoading || inspectionsLoading || reportsLoading || statsLoading;

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const pendingInspections = recentInspections.filter((inspection: any) => inspection.status === 'pending').length;
  const completedInspections = recentInspections.filter((inspection: any) => inspection.status === 'completed').length;
  const inProgressInspections = recentInspections.filter((inspection: any) => inspection.status === 'in_progress').length;

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">İş Güvenliği Uzmanı Paneli</h1>
          <p className="text-gray-600 mt-1">
            {userHospital?.name || 'Hastane bilgisi yükleniyor...'}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="bg-green-50 text-green-700">
              <Building2 className="w-4 h-4 mr-1" />
              {user?.fullName}
            </Badge>
            <Badge variant="outline">
              {user?.role === 'safety_specialist' ? 'İş Güvenliği Uzmanı' : 'İşyeri Hekimi'}
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-lg px-4 py-2">
            <Calendar className="w-4 h-4 mr-2" />
            {new Date().toLocaleDateString('tr-TR')}
          </Badge>
        </div>
      </div>

      {/* Main Content - Two Columns */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

        {/* LEFT COLUMN - ASSIGNED INSPECTIONS */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Atanan Denetimler</h2>
            <Button 
              onClick={() => setLocation('/inspection-history')}
              data-testid="button-view-inspection-history"
            >
              Denetim Geçmişi
            </Button>
          </div>

          {/* Inspection Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="text-2xl font-bold text-yellow-600">{pendingInspections}</div>
                <p className="text-sm text-gray-600">Bekleyen Denetim</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                </div>
                <div className="text-2xl font-bold text-orange-600">{inProgressInspections}</div>
                <p className="text-sm text-gray-600">Devam Eden</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <CheckSquare className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-green-600">{completedInspections}</div>
                <p className="text-sm text-gray-600">Tamamlanan</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <ClipboardList className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{checklistTemplates.length}</div>
                <p className="text-sm text-gray-600">Aktif Checklist</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Assigned Inspections */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Son Atanan Denetimler
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentInspections.length > 0 ? (
                <div className="space-y-3">
                  {recentInspections.slice(0, 4).map((inspection: any) => (
                    <div key={inspection.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          inspection.status === 'completed' ? 'bg-green-500' :
                          inspection.status === 'in_progress' ? 'bg-orange-500' :
                          'bg-red-500'
                        }`}></div>
                        <div>
                          <div className="font-medium text-sm">{inspection.title}</div>
                          <div className="text-xs text-gray-600">{inspection.templateName}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className={`text-xs ${
                          inspection.status === 'completed' ? 'bg-green-50 text-green-700' :
                          inspection.status === 'in_progress' ? 'bg-orange-50 text-orange-700' :
                          'bg-red-50 text-red-700'
                        }`}>
                          {inspection.status === 'completed' ? 'Tamamlandı' :
                           inspection.status === 'in_progress' ? 'Devam Ediyor' :
                           'Bekliyor'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  
                  {recentInspections.length > 4 && (
                    <Button 
                      variant="outline" 
                      onClick={() => setLocation('/inspection-history')}
                      className="w-full mt-4"
                    >
                      +{recentInspections.length - 4} Denetim Daha...
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Henüz atanan denetim bulunmuyor.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN - REPORTS SYSTEM */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Rapor Sistemi</h2>
            <Button 
              onClick={() => setLocation('/reports')}
              data-testid="button-view-all-reports"
            >
              Tümünü Görüntüle
            </Button>
          </div>

          {/* Report Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{stats?.totalReports || 0}</div>
                <p className="text-sm text-gray-600">Toplam Rapor</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div className="text-2xl font-bold text-red-600">{stats?.highRiskFindings || 0}</div>
                <p className="text-sm text-gray-600">Yüksek Risk</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <AlertTriangle className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="text-2xl font-bold text-yellow-600">{stats?.mediumRiskFindings || 0}</div>
                <p className="text-sm text-gray-600">Orta Risk</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <CheckSquare className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-green-600">{stats?.completedFindings || 0}</div>
                <p className="text-sm text-gray-600">Tamamlanan</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Report Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Rapor İşlemleri
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button 
                  onClick={() => setLocation('/create-report')}
                  className="w-full flex items-center gap-2 h-auto py-4"
                  data-testid="button-create-report"
                >
                  <Plus className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-medium">Yeni Rapor Oluştur</div>
                    <div className="text-sm opacity-80">Güvenlik raporu hazırla</div>
                  </div>
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => setLocation('/reports')}
                  className="w-full flex items-center gap-2 h-auto py-4"
                  data-testid="button-view-reports"
                >
                  <FileText className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-medium">Raporları Görüntüle</div>
                    <div className="text-sm opacity-80">Mevcut raporları incele</div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Reports */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Son Raporlar
              </CardTitle>
            </CardHeader>
            <CardContent>
              {reports.length > 0 ? (
                <div className="space-y-3">
                  {reports.slice(0, 4).map((report: any) => (
                    <div key={report.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <div>
                          <div className="font-medium">{report.title}</div>
                          <div className="text-sm text-gray-600">{report.location}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500">
                          {new Date(report.createdAt).toLocaleDateString('tr-TR')}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {reports.length > 4 && (
                    <Button 
                      variant="outline" 
                      onClick={() => setLocation('/reports')}
                      className="w-full mt-4"
                    >
                      +{reports.length - 4} Rapor Daha...
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Henüz rapor bulunmuyor.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Activity - Full Width */}
      <Card className="xl:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Son Aktiviteler
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentInspections.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentInspections.slice(0, 6).map((inspection: any) => (
                <div key={inspection.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      inspection.status === 'completed' ? 'bg-green-500' :
                      inspection.status === 'in_progress' ? 'bg-yellow-500' :
                      'bg-gray-400'
                    }`}></div>
                    <div>
                      <div className="font-medium text-sm">{inspection.title}</div>
                      <div className="text-xs text-gray-600">{inspection.templateName}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className={`text-xs ${
                      inspection.status === 'completed' ? 'bg-green-50 text-green-700' :
                      inspection.status === 'in_progress' ? 'bg-yellow-50 text-yellow-700' :
                      'bg-gray-50 text-gray-700'
                    }`}>
                      {inspection.status === 'completed' ? 'Tamamlandı' :
                       inspection.status === 'in_progress' ? 'Devam Ediyor' :
                       'Bekliyor'}
                    </Badge>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(inspection.createdAt).toLocaleDateString('tr-TR')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Henüz aktivite bulunmuyor.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}