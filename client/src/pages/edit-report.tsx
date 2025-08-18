import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus, FileText, AlertTriangle, CheckCircle, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import FindingForm from "@/components/finding-form";

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
  
  const [showFindingForm, setShowFindingForm] = useState(false);
  const [selectedSection, setSelectedSection] = useState<number>(2);

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

  const handleUpdateReport = (e: React.FormEvent) => {
    e.preventDefault();
    updateReportMutation.mutate({
      ...reportData,
      reportDate: new Date(reportData.reportDate),
    });
  };

  const handleSectionSelect = (section: number) => {
    if (section === 1) {
      // Allow editing management summary for drafts
      return;
    }
    setSelectedSection(section);
    setShowFindingForm(true);
  };

  const getSectionFindings = (sectionNumber: number) => {
    return findings.filter((f: any) => f.section === sectionNumber);
  };

  const getSectionStats = (sectionNumber: number) => {
    const sectionFindings = getSectionFindings(sectionNumber);
    const completed = sectionFindings.filter((f: any) => f.isCompleted).length;
    return { total: sectionFindings.length, completed };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Rapor Bulunamadı</h2>
          <Button onClick={() => setLocation("/reports")}>
            <ArrowLeft className="mr-2" size={16} />
            Raporlara Dön
          </Button>
        </div>
      </div>
    );
  }

  const sections = [
    {
      id: 1,
      title: "Yönetici Özeti",
      description: "Rapor özet bilgileri",
      color: "bg-primary",
      disabled: false,
    },
    {
      id: 2,
      title: "Tasarım/İmalat/Montaj Hataları",
      description: "Yapısal ve montaj sorunları",
      color: "bg-danger",
      disabled: false,
    },
    {
      id: 3,
      title: "İş Sağlığı ve Güvenliği Bulguları",
      description: "Güvenlik açığı ve risk tespitleri",
      color: "bg-warning",
      disabled: false,
    },
    {
      id: 4,
      title: "Tamamlanmış Bulgular",
      description: "Çözümlenmiş sorunlar",
      color: "bg-success",
      disabled: false,
    },
    {
      id: 5,
      title: "Genel Değerlendirme",
      description: "Kapanış değerlendirmesi",
      color: "bg-secondary",
      disabled: false,
    }
  ];

  if (showFindingForm) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => setShowFindingForm(false)}
              className="mb-4"
            >
              <ArrowLeft className="mr-2" size={16} />
              Bölümlere Dön
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">
              {sections.find(s => s.id === selectedSection)?.title}
            </h1>
          </div>
          
          <FindingForm
            reportId={id!}
            section={selectedSection}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: [`/api/reports/${id}/findings`] });
              setShowFindingForm(false);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => setLocation("/reports")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2" size={16} />
            Raporlara Dön
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Rapor Düzenle
          </h1>
          <p className="text-gray-600">
            Rapor bilgilerini güncelleyin ve bölümleri yönetin
          </p>
        </div>

        {/* Report Info Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Rapor Bilgileri</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateReport} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reportNumber">Rapor Numarası</Label>
                  <Input
                    id="reportNumber"
                    value={reportData.reportNumber}
                    onChange={(e) => setReportData({ ...reportData, reportNumber: e.target.value })}
                    data-testid="input-report-number"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reportDate">Rapor Tarihi</Label>
                  <Input
                    id="reportDate"
                    type="date"
                    value={reportData.reportDate}
                    onChange={(e) => setReportData({ ...reportData, reportDate: e.target.value })}
                    data-testid="input-report-date"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reporter">Rapor Eden</Label>
                  <Input
                    id="reporter"
                    value={reportData.reporter}
                    onChange={(e) => setReportData({ ...reportData, reporter: e.target.value })}
                    data-testid="input-reporter"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="projectLocation">Proje Konumu</Label>
                  <Input
                    id="projectLocation"
                    value={reportData.projectLocation}
                    onChange={(e) => setReportData({ ...reportData, projectLocation: e.target.value })}
                    data-testid="input-project-location"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="managementSummary">Yönetici Özeti</Label>
                <Textarea
                  id="managementSummary"
                  placeholder="Rapor özet bilgilerini buraya yazın..."
                  value={reportData.managementSummary}
                  onChange={(e) => setReportData({ ...reportData, managementSummary: e.target.value })}
                  className="min-h-[120px]"
                  data-testid="textarea-management-summary"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="generalEvaluation">Genel Değerlendirme</Label>
                <Textarea
                  id="generalEvaluation"
                  placeholder="Genel değerlendirme notlarını buraya yazın..."
                  value={reportData.generalEvaluation}
                  onChange={(e) => setReportData({ ...reportData, generalEvaluation: e.target.value })}
                  className="min-h-[120px]"
                  data-testid="textarea-general-evaluation"
                />
              </div>

              <Button 
                type="submit" 
                disabled={updateReportMutation.isPending}
                data-testid="button-save-report"
              >
                <Save className="mr-2" size={16} />
                {updateReportMutation.isPending ? "Kaydediliyor..." : "Raporu Kaydet"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Sections */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Rapor Bölümleri</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sections.map((section) => {
              const stats = getSectionStats(section.id);
              
              return (
                <Card 
                  key={section.id} 
                  className={`cursor-pointer hover:shadow-lg transition-all duration-200 ${
                    section.disabled ? 'opacity-50' : ''
                  }`}
                  onClick={() => !section.disabled && handleSectionSelect(section.id)}
                  data-testid={`section-${section.id}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className={`w-12 h-12 ${section.color} rounded-lg flex items-center justify-center text-white`}>
                        {section.id === 1 && <FileText size={24} />}
                        {section.id === 2 && <AlertTriangle size={24} />}
                        {section.id === 3 && <AlertTriangle size={24} />}
                        {section.id === 4 && <CheckCircle size={24} />}
                        {section.id === 5 && <FileText size={24} />}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-2">
                          {section.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-3">
                          {section.description}
                        </p>
                        {section.id > 1 && section.id < 5 && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">
                              {stats.total} bulgu
                            </span>
                            {stats.completed > 0 && (
                              <span className="text-green-600">
                                {stats.completed} tamamlandı
                              </span>
                            )}
                          </div>
                        )}
                        {section.id > 1 && section.id < 5 && (
                          <Button 
                            size="sm" 
                            className="mt-3 w-full"
                            variant="outline"
                          >
                            <Plus className="mr-2" size={14} />
                            Bulgu Ekle
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}