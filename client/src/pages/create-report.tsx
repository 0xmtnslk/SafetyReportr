import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Plus, FileText, AlertTriangle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import FindingForm from "@/components/finding-form";
import { useLocation } from "wouter";

export default function CreateReport() {
  const [, setLocation] = useLocation();
  const [reportData, setReportData] = useState({
    reportNumber: "Otomatik oluşturulacak",
    reportDate: "",
    reporter: "",
    projectLocation: "",
  });
  const [currentReport, setCurrentReport] = useState<any>(null);
  const [showFindingForm, setShowFindingForm] = useState(false);
  const [selectedSection, setSelectedSection] = useState<number>(2);
  const { toast } = useToast();

  const createReportMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/reports", data);
      return response.json();
    },
    onSuccess: (data) => {
      setCurrentReport(data);
      toast({
        title: "Başarılı",
        description: "Rapor başarıyla oluşturuldu. Şimdi bölümleri doldurun.",
      });
      // Redirect to edit page after creation
      setTimeout(() => {
        setLocation(`/edit-report/${data.id}`);
      }, 1500);
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Rapor oluşturulurken bir hata oluştu",
        variant: "destructive",
      });
    },
  });

  const handleCreateReport = (e: React.FormEvent) => {
    e.preventDefault();
    createReportMutation.mutate({
      ...reportData,
      reportNumber: "", // Let backend generate automatic report number
      reportDate: reportData.reportDate, // Send as string, backend will handle conversion
      status: "draft",
    });
  };

  const handleSectionSelect = (section: number) => {
    if (section === 1) {
      toast({
        title: "Bilgilendirme",
        description: "Yönetici özeti rapor tamamlandıktan sonra yazılacaktır.",
      });
      return;
    }
    setSelectedSection(section);
    setShowFindingForm(true);
  };

  const sections = [
    {
      id: 1,
      title: "Yönetici Özeti",
      description: "Rapor tamamlandıktan sonra yazılır",
      color: "bg-primary",
      disabled: true,
    },
    {
      id: 2,
      title: "Tasarım, İmalat ve Montaj Hataları",
      description: "Bulgular ve çözüm önerileri",
      color: "bg-primary",
      disabled: false,
    },
    {
      id: 3,
      title: "Diğer İSG Bulguları",
      description: "İş sağlığı ve güvenliği bulguları",
      color: "bg-primary",
      disabled: false,
    },
    {
      id: 4,
      title: "Tamamlanmış Bulgular",
      description: "Çözülmüş sorunlar",
      color: "bg-success",
      disabled: false,
    },
    {
      id: 5,
      title: "Genel Değerlendirme",
      description: "Sonuç ve öneriler",
      color: "bg-secondary",
      disabled: false,
    },
  ];

  if (showFindingForm && currentReport) {
    return (
      <FindingForm
        reportId={currentReport.id}
        section={selectedSection}
        onClose={() => setShowFindingForm(false)}
        onSave={() => {
          setShowFindingForm(false);
          queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
        }}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {!currentReport ? (
        // Report Setup Form
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Yeni Rapor Oluştur
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateReport} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="reportDate">Rapor Tarihi</Label>
                    <Input
                      id="reportDate"
                      type="date"
                      value={reportData.reportDate}
                      onChange={(e) =>
                        setReportData({ ...reportData, reportDate: e.target.value })
                      }
                      required
                      data-testid="input-report-date"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reportNumber">Rapor Sayısı</Label>
                    <Input
                      id="reportNumber"
                      type="text"
                      value={reportData.reportNumber}
                      disabled
                      className="bg-gray-100 text-gray-600"
                      data-testid="input-report-number"
                    />
                    <p className="text-sm text-gray-500">Rapor numarası otomatik oluşturulacaktır</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reporter">Raporlayan</Label>
                  <Input
                    id="reporter"
                    type="text"
                    placeholder="Ad Soyad"
                    value={reportData.reporter}
                    onChange={(e) =>
                      setReportData({ ...reportData, reporter: e.target.value })
                    }
                    required
                    data-testid="input-reporter"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="projectLocation">Proje/Lokasyon</Label>
                  <Input
                    id="projectLocation"
                    type="text"
                    placeholder="İstinye Üniversite Topkapı Lv Hastanesi"
                    value={reportData.projectLocation}
                    onChange={(e) =>
                      setReportData({ ...reportData, projectLocation: e.target.value })
                    }
                    required
                    data-testid="input-project-location"
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={createReportMutation.isPending}
                    data-testid="button-start-report"
                  >
                    {createReportMutation.isPending ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                    ) : (
                      <ArrowRight className="mr-2" size={16} />
                    )}
                    Rapora Başla
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      ) : (
        // Report Sections Navigation
        <div>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Rapor Bölümleri</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sections.map((section) => (
                  <Button
                    key={section.id}
                    variant="outline"
                    className="p-4 h-auto text-left justify-start"
                    onClick={() => handleSectionSelect(section.id)}
                    disabled={section.disabled}
                    data-testid={`section-button-${section.id}`}
                  >
                    <div className="flex items-start w-full">
                      <span
                        className={`w-8 h-8 ${section.color} text-white rounded-lg flex items-center justify-center text-sm font-bold mr-3 mt-1`}
                      >
                        {section.id}
                      </span>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-1">
                          {section.title}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {section.description}
                        </p>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
