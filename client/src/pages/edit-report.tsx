import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, FileText, AlertTriangle, CheckCircle, Save, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import FindingForm from "@/components/finding-form";
import PDFPreview from "@/components/pdf-preview";

export default function EditReport() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [reportData, setReportData] = useState({
    reportNumber: "",
    reportDate: "",
    reporter: "",
    projectLocation: "",
    managementSummary: "",
    generalEvaluation: "",
    status: "draft"
  });
  
  const [currentView, setCurrentView] = useState<'sections' | 'management' | 'evaluation' | 'findings'>('sections');
  const [selectedSection, setSelectedSection] = useState<number>(2);
  const [showFindingForm, setShowFindingForm] = useState(false);
  const [editingFinding, setEditingFinding] = useState<any>(null);

  // Fetch report data
  const { data: report, isLoading } = useQuery({
    queryKey: [`/api/reports/${id}`],
    enabled: !!id,
  });

  // Fetch findings
  const { data: findings = [] } = useQuery({
    queryKey: [`/api/reports/${id}/findings`],
    enabled: !!id,
  });

  useEffect(() => {
    if (report) {
      setReportData({
        reportNumber: report.reportNumber || "",
        reportDate: report.reportDate ? new Date(report.reportDate).toISOString().split('T')[0] : "",
        reporter: report.reporter || "",
        projectLocation: report.projectLocation || "",
        managementSummary: report.managementSummary || "",
        generalEvaluation: report.generalEvaluation || "",
        status: report.status || "draft"
      });
    }
  }, [report]);

  // Update report mutation
  const updateReportMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PUT", `/api/reports/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/reports/${id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      toast({
        title: "Başarılı",
        description: "Rapor başarıyla güncellendi",
      });
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Rapor güncellenirken bir hata oluştu",
        variant: "destructive",
      });
    },
  });

  // Delete finding mutation
  const deleteFindingMutation = useMutation({
    mutationFn: async (findingId: string) => {
      await apiRequest("DELETE", `/api/findings/${findingId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/reports/${id}/findings`] });
      toast({
        title: "Başarılı",
        description: "Bulgu başarıyla silindi",
      });
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Bulgu silinirken bir hata oluştu",
        variant: "destructive",
      });
    },
  });

  const handleSaveBasicInfo = (e: React.FormEvent) => {
    e.preventDefault();
    updateReportMutation.mutate({
      ...reportData,
      reportDate: new Date(reportData.reportDate),
    });
  };

  const handleSaveText = (field: 'managementSummary' | 'generalEvaluation', value: string) => {
    updateReportMutation.mutate({
      [field]: value,
    });
  };

  const getDangerLevelColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-destructive text-destructive-foreground';
      case 'medium': return 'bg-warning text-warning-foreground';
      case 'low': return 'bg-success text-success-foreground';
      default: return 'bg-muted';
    }
  };

  const getDangerLevelText = (level: string) => {
    switch (level) {
      case 'high': return 'Yüksek';
      case 'medium': return 'Orta';
      case 'low': return 'Düşük';
      default: return level;
    }
  };

  // Filter findings by section
  const getSectionFindings = (section: number) => {
    return findings.filter((f: any) => f.section === section);
  };

  // Get completed findings (section 4)
  const getCompletedFindings = () => {
    return findings.filter((f: any) => f.section === 4 || (f.isCompleted && f.dangerLevel === 'low'));
  };

  // Count findings by danger level for a section
  const getFindingCounts = (section: number) => {
    const sectionFindings = getSectionFindings(section);
    return {
      high: sectionFindings.filter((f: any) => f.dangerLevel === 'high').length,
      medium: sectionFindings.filter((f: any) => f.dangerLevel === 'medium').length,
      low: sectionFindings.filter((f: any) => f.dangerLevel === 'low').length,
    };
  };

  if (isLoading) {
    return <div className="p-6">Yükleniyor...</div>;
  }

  if (!report) {
    return <div className="p-6">Rapor bulunamadı.</div>;
  }

  // Render sections overview
  if (currentView === 'sections') {
    const section2Counts = getFindingCounts(2);
    const section3Counts = getFindingCounts(3);
    const completedCount = getCompletedFindings().length;

    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            onClick={() => setLocation('/reports')}
            className="mr-4"
            data-testid="button-back"
          >
            <ArrowLeft size={20} className="mr-2" />
            Raporlara Dön
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{report.reportNumber}</h1>
            <p className="text-gray-600">{report.projectLocation}</p>
          </div>
        </div>

        {/* Basic Report Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Rapor Bilgileri</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveBasicInfo} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="reportNumber">Rapor Numarası</Label>
                  <Input
                    id="reportNumber"
                    value={reportData.reportNumber}
                    onChange={(e) => setReportData(prev => ({ ...prev, reportNumber: e.target.value }))}
                    data-testid="input-report-number"
                  />
                </div>
                <div>
                  <Label htmlFor="reportDate">Rapor Tarihi</Label>
                  <Input
                    id="reportDate"
                    type="date"
                    value={reportData.reportDate}
                    onChange={(e) => setReportData(prev => ({ ...prev, reportDate: e.target.value }))}
                    data-testid="input-report-date"
                  />
                </div>
                <div>
                  <Label htmlFor="reporter">Raporlayan</Label>
                  <Input
                    id="reporter"
                    value={reportData.reporter}
                    onChange={(e) => setReportData(prev => ({ ...prev, reporter: e.target.value }))}
                    data-testid="input-reporter"
                  />
                </div>
                <div>
                  <Label htmlFor="projectLocation">Proje Lokasyonu</Label>
                  <Input
                    id="projectLocation"
                    value={reportData.projectLocation}
                    onChange={(e) => setReportData(prev => ({ ...prev, projectLocation: e.target.value }))}
                    data-testid="input-project-location"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={updateReportMutation.isPending} data-testid="button-save-info">
                  <Save size={16} className="mr-2" />
                  Bilgileri Kaydet
                </Button>
                <PDFPreview
                  reportData={{
                    id: report.id,
                    reportNumber: reportData.reportNumber,
                    reportDate: reportData.reportDate,
                    projectLocation: reportData.projectLocation,
                    reporter: reportData.reporter,
                    managementSummary: reportData.managementSummary,
                    generalEvaluation: reportData.generalEvaluation,
                  }}
                  findings={findings}
                />
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Report Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Yönetici Özeti */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setCurrentView('management')}>
            <CardContent className="p-6">
              <div className="flex items-start">
                <div className="bg-primary text-white rounded-lg w-12 h-12 flex items-center justify-center text-lg font-bold mr-4">
                  <FileText size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">Yönetici Özeti</h3>
                  <p className="text-sm text-gray-600 mb-2">Rapor özet bilgileri</p>
                  <Badge variant="outline">
                    {reportData.managementSummary ? 'Yazıldı' : 'Yazılacak'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tasarım/İmalat/Montaj Hataları */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => {
            setSelectedSection(2);
            setCurrentView('findings');
          }}>
            <CardContent className="p-6">
              <div className="flex items-start">
                <div className="bg-destructive text-white rounded-lg w-12 h-12 flex items-center justify-center text-lg font-bold mr-4">
                  <AlertTriangle size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">Tasarım/İmalat/Montaj Hataları</h3>
                  <p className="text-sm text-gray-600 mb-2">Yapısal ve montaj sorunları</p>
                  <div className="flex space-x-2">
                    {section2Counts.high > 0 && (
                      <Badge className="bg-destructive text-destructive-foreground">
                        {section2Counts.high} Yüksek
                      </Badge>
                    )}
                    {section2Counts.medium > 0 && (
                      <Badge className="bg-warning text-warning-foreground">
                        {section2Counts.medium} Orta
                      </Badge>
                    )}
                    {section2Counts.low > 0 && (
                      <Badge className="bg-success text-success-foreground">
                        {section2Counts.low} Düşük
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* İş Sağlığı ve Güvenliği Bulguları */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => {
            setSelectedSection(3);
            setCurrentView('findings');
          }}>
            <CardContent className="p-6">
              <div className="flex items-start">
                <div className="bg-warning text-white rounded-lg w-12 h-12 flex items-center justify-center text-lg font-bold mr-4">
                  <AlertTriangle size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">İş Sağlığı ve Güvenliği Bulguları</h3>
                  <p className="text-sm text-gray-600 mb-2">Güvenlik açığı ve risk tespitleri</p>
                  <div className="flex space-x-2">
                    {section3Counts.high > 0 && (
                      <Badge className="bg-destructive text-destructive-foreground">
                        {section3Counts.high} Yüksek
                      </Badge>
                    )}
                    {section3Counts.medium > 0 && (
                      <Badge className="bg-warning text-warning-foreground">
                        {section3Counts.medium} Orta
                      </Badge>
                    )}
                    {section3Counts.low > 0 && (
                      <Badge className="bg-success text-success-foreground">
                        {section3Counts.low} Düşük
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tamamlanmış Bulgular */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => {
            setSelectedSection(4);
            setCurrentView('findings');
          }}>
            <CardContent className="p-6">
              <div className="flex items-start">
                <div className="bg-success text-white rounded-lg w-12 h-12 flex items-center justify-center text-lg font-bold mr-4">
                  <CheckCircle size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">Tamamlanmış Bulgular</h3>
                  <p className="text-sm text-gray-600 mb-2">Çözümlenmiş sorunlar</p>
                  <Badge className="bg-success text-success-foreground">
                    {completedCount} bulgu
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Genel Değerlendirme */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setCurrentView('evaluation')}>
            <CardContent className="p-6">
              <div className="flex items-start">
                <div className="bg-slate-600 text-white rounded-lg w-12 h-12 flex items-center justify-center text-lg font-bold mr-4">
                  <FileText size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">Genel Değerlendirme</h3>
                  <p className="text-sm text-gray-600 mb-2">Kapanış değerlendirmesi</p>
                  <Badge variant="outline">
                    {reportData.generalEvaluation ? 'Yazıldı' : 'Yazılacak'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Render management summary editor
  if (currentView === 'management') {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            onClick={() => setCurrentView('sections')}
            className="mr-4"
          >
            <ArrowLeft size={20} className="mr-2" />
            Bölümlere Dön
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Yönetici Özeti</h1>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <Label htmlFor="managementSummary">Yönetici Özeti</Label>
              <Textarea
                id="managementSummary"
                value={reportData.managementSummary}
                onChange={(e) => setReportData(prev => ({ ...prev, managementSummary: e.target.value }))}
                placeholder="Rapor özet bilgilerini buraya yazın..."
                className="min-h-[200px]"
              />
              <Button
                onClick={() => handleSaveText('managementSummary', reportData.managementSummary)}
                disabled={updateReportMutation.isPending}
              >
                <Save size={16} className="mr-2" />
                Kaydet
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render general evaluation editor
  if (currentView === 'evaluation') {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            onClick={() => setCurrentView('sections')}
            className="mr-4"
          >
            <ArrowLeft size={20} className="mr-2" />
            Bölümlere Dön
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Genel Değerlendirme</h1>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <Label htmlFor="generalEvaluation">Genel Değerlendirme</Label>
              <Textarea
                id="generalEvaluation"
                value={reportData.generalEvaluation}
                onChange={(e) => setReportData(prev => ({ ...prev, generalEvaluation: e.target.value }))}
                placeholder="Genel değerlendirme metnini buraya yazın..."
                className="min-h-[200px]"
              />
              <Button
                onClick={() => handleSaveText('generalEvaluation', reportData.generalEvaluation)}
                disabled={updateReportMutation.isPending}
              >
                <Save size={16} className="mr-2" />
                Kaydet
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render findings section
  if (currentView === 'findings') {
    const sectionFindings = selectedSection === 4 ? getCompletedFindings() : getSectionFindings(selectedSection);
    const sectionTitle = selectedSection === 2 ? 'Tasarım/İmalat/Montaj Hataları' :
                        selectedSection === 3 ? 'İş Sağlığı ve Güvenliği Bulguları' :
                        'Tamamlanmış Bulgular';

    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button
              variant="ghost"
              onClick={() => setCurrentView('sections')}
              className="mr-4"
            >
              <ArrowLeft size={20} className="mr-2" />
              Bölümlere Dön
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">{sectionTitle}</h1>
          </div>
          {selectedSection !== 4 && (
            <Button
              onClick={() => {
                setEditingFinding(null);
                setShowFindingForm(true);
              }}
              data-testid="button-add-finding"
            >
              <Plus size={16} className="mr-2" />
              Bulgu Ekle
            </Button>
          )}
        </div>

        {/* Existing Findings */}
        <div className="space-y-4 mb-6">
          {sectionFindings.map((finding: any) => (
            <Card key={finding.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <h3 className="text-lg font-semibold mr-2">{finding.title}</h3>
                      <Badge className={getDangerLevelColor(finding.dangerLevel)}>
                        {getDangerLevelText(finding.dangerLevel)}
                      </Badge>
                    </div>
                    <p className="text-gray-600 mb-2">{finding.currentSituation}</p>
                    {finding.recommendation && (
                      <p className="text-sm text-gray-500">
                        <strong>Öneri:</strong> {finding.recommendation}
                      </p>
                    )}
                    {finding.processSteps && finding.processSteps.length > 0 && (
                      <div className="mt-2">
                        <strong className="text-sm">Süreç Adımları:</strong>
                        <div className="mt-1 space-y-1">
                          {finding.processSteps.map((step: any, index: number) => (
                            <div key={index} className="text-sm text-gray-600">
                              <span className="font-medium">{step.date}:</span> {step.description}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingFinding(finding);
                        setShowFindingForm(true);
                      }}
                    >
                      <Edit size={14} />
                    </Button>
                    {selectedSection !== 4 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteFindingMutation.mutate(finding.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {sectionFindings.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">Bu bölümde henüz bulgu bulunmamaktadır.</p>
              {selectedSection !== 4 && (
                <Button
                  className="mt-4"
                  onClick={() => {
                    setEditingFinding(null);
                    setShowFindingForm(true);
                  }}
                >
                  <Plus size={16} className="mr-2" />
                  İlk Bulguyu Ekle
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Finding Form Modal */}
        {showFindingForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <FindingForm
                reportId={id!}
                section={selectedSection}
                initialData={editingFinding}
                onClose={() => {
                  setShowFindingForm(false);
                  setEditingFinding(null);
                }}
                onSave={() => {
                  setShowFindingForm(false);
                  setEditingFinding(null);
                  queryClient.invalidateQueries({ queryKey: [`/api/reports/${id}/findings`] });
                }}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}