import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { FileText, Download, Edit, ArrowLeft, Calendar, MapPin, User, AlertTriangle } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { TurkishPDFGenerator } from "@/lib/turkishPdfGenerator";

interface ViewReportProps {
  id: string;
}

export default function ViewReport({ id }: ViewReportProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: report, isLoading: reportLoading } = useQuery({
    queryKey: [`/api/reports/${id}`],
    enabled: !!id && id !== 'undefined'
  });

  const { data: findings = [], isLoading: findingsLoading } = useQuery({
    queryKey: [`/api/reports/${id}/findings`],
    enabled: !!id && id !== 'undefined'
  });

  const handleExportPDF = async () => {
    if (!report) {
      toast({
        title: "Hata",
        description: "Rapor verisi bulunamadı.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('PDF export başlıyor, rapor:', report);
      console.log('Bulgular:', findings);

      toast({
        title: "PDF Oluşturuluyor",
        description: "Rapor PDF olarak hazırlanıyor...",
      });

      const reportData = {
        id: (report as any).id,
        reportNumber: (report as any).reportNumber,
        reportDate: (report as any).reportDate,
        projectLocation: (report as any).projectLocation,
        reporter: (report as any).reporter,
        managementSummary: (report as any).managementSummary,
        generalEvaluation: (report as any).generalEvaluation,
        findings: (findings as any[])?.map((finding: any) => ({
          id: finding.id,
          section: finding.section || 3,
          title: finding.title,
          description: finding.currentSituation || finding.description,
          dangerLevel: finding.dangerLevel,
          recommendation: finding.recommendation,
          images: finding.images || [],
          location: finding.location || finding.title,
          processSteps: finding.processSteps || [],
          isCompleted: finding.status === 'completed'
        })) || []
      };

      console.log('PDF için hazırlanan veri:', reportData);

      const pdfGenerator = new TurkishPDFGenerator();
      const pdfBlob = await pdfGenerator.generateReport(reportData);
      
      // PDF'i indir
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ISG_Raporu_${reportData.reportNumber || new Date().toISOString().split('T')[0]}.pdf`;
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

  const getRiskBadgeVariant = (level: string) => {
    switch (level) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getRiskText = (level: string) => {
    switch (level) {
      case 'high': return 'Yüksek Risk';
      case 'medium': return 'Orta Risk';
      case 'low': return 'Düşük Risk';
      default: return level;
    }
  };

  const getSectionName = (section: number) => {
    switch (section) {
      case 1: return 'Tasarım/İmalat Hataları';
      case 2: return 'İSG Tespitleri';
      case 3: return 'Tamamlanan Tespitler';
      case 4: return 'Genel Değerlendirme';
      case 5: return 'Yönetici Özeti';
      default: return `Bölüm ${section}`;
    }
  };

  if (reportLoading || findingsLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded-lg"></div>
            <div className="h-64 bg-gray-200 rounded-lg"></div>
            <div className="h-48 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <FileText className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Rapor Bulunamadı</h3>
          <p className="text-gray-500 mb-6">Bu rapor mevcut değil veya erişim izniniz yok.</p>
          <Button onClick={() => setLocation('/reports')}>
            <ArrowLeft className="mr-2" size={16} />
            Raporlara Dön
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div className="flex items-center mb-4 sm:mb-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLocation('/reports')}
            className="mr-4"
            data-testid="button-back"
          >
            <ArrowLeft size={16} className="mr-1" />
            Geri
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Rapor #{(report as any).reportNumber}
            </h1>
            <p className="text-gray-600">
              {new Date((report as any).reportDate).toLocaleDateString("tr-TR")}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setLocation(`/edit-report/${(report as any).id}`)}
            data-testid="button-edit-report"
          >
            <Edit size={16} className="mr-2" />
            Düzenle
          </Button>
          <Button
            onClick={handleExportPDF}
            data-testid="button-export-pdf"
          >
            <Download size={16} className="mr-2" />
            PDF İndir
          </Button>
        </div>
      </div>

      {/* Report Info */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="mr-2" size={20} />
            Rapor Bilgileri
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center">
              <MapPin className="text-gray-400 mr-2" size={16} />
              <div>
                <p className="text-sm text-gray-500">Proje Lokasyonu</p>
                <p className="font-medium">{(report as any).projectLocation}</p>
              </div>
            </div>
            <div className="flex items-center">
              <User className="text-gray-400 mr-2" size={16} />
              <div>
                <p className="text-sm text-gray-500">Raporu Hazırlayan</p>
                <p className="font-medium">{(report as any).reporter}</p>
              </div>
            </div>
            <div className="flex items-center">
              <Calendar className="text-gray-400 mr-2" size={16} />
              <div>
                <p className="text-sm text-gray-500">Rapor Tarihi</p>
                <p className="font-medium">
                  {new Date((report as any).reportDate).toLocaleDateString("tr-TR")}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Management Summary */}
      {(report as any).managementSummary && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Yönetici Özeti</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {(report as any).managementSummary}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Findings */}
      {Array.isArray(findings) && findings.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="mr-2" size={20} />
              Tespitler ({Array.isArray(findings) ? findings.length : 0})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {Array.isArray(findings) && findings.map((finding: any, index: number) => (
              <div key={finding.id} className="border rounded-lg p-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4">
                  <div className="mb-2 sm:mb-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">{getSectionName(finding.section)}</Badge>
                      <Badge variant={getRiskBadgeVariant(finding.dangerLevel)}>
                        {getRiskText(finding.dangerLevel)}
                      </Badge>
                      {finding.isCompleted && (
                        <Badge variant="secondary">Tamamlandı</Badge>
                      )}
                    </div>
                    <h3 className="font-semibold text-lg text-gray-900">
                      {index + 1}. {finding.title}
                    </h3>
                  </div>
                </div>
                
                {finding.currentSituation && (
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Mevcut Durum</h4>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {finding.currentSituation}
                    </p>
                  </div>
                )}

                {finding.recommendation && (
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">İSG Görüşü</h4>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {finding.recommendation}
                    </p>
                  </div>
                )}

                {finding.images && finding.images.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Fotoğraflar</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {finding.images.map((image: string, imgIndex: number) => (
                        <img
                          key={imgIndex}
                          src={image}
                          alt={`${finding.title} - ${imgIndex + 1}`}
                          className="w-full h-24 object-cover rounded border"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {finding.processSteps && finding.processSteps.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Süreç Adımları</h4>
                    <div className="space-y-2">
                      {finding.processSteps.map((step: any, stepIndex: number) => (
                        <div key={stepIndex} className="flex items-start space-x-3 p-2 bg-gray-50 rounded">
                          <div className="flex-1">
                            <p className="text-sm font-medium">{step.description}</p>
                            {step.date && (
                              <p className="text-xs text-gray-500">
                                Hedef Tarih: {new Date(step.date).toLocaleDateString("tr-TR")}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* General Evaluation */}
      {(report as any).generalEvaluation && (
        <Card>
          <CardHeader>
            <CardTitle>Genel Değerlendirme</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {(report as any).generalEvaluation}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}