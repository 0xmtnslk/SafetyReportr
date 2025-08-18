import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Eye, FileText, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PDFPreviewProps {
  reportData: any;
  findings: any[];
  isLoading?: boolean;
}

export default function PDFPreview({ reportData, findings, isLoading = false }: PDFPreviewProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const generatePreview = async () => {
    setIsGenerating(true);
    try {
      // Transform report data for PDF generator
      const formattedData = {
        id: reportData.id || '',
        reportNumber: reportData.reportNumber || '',
        reportDate: reportData.reportDate || '',
        projectLocation: reportData.projectLocation || '',
        reporter: reportData.reporter || '',
        managementSummary: reportData.managementSummary || '',
        generalEvaluation: reportData.generalEvaluation || '',
        findings: findings?.map(finding => ({
          id: finding.id || '',
          section: finding.section || 3,
          title: finding.title || '',
          description: finding.currentSituation || finding.description || '',
          dangerLevel: finding.dangerLevel as 'high' | 'medium' | 'low',
          recommendation: finding.recommendation || '',
          images: finding.images || [],
          location: finding.title || '',
          processSteps: finding.processSteps?.map((step: any) => ({
            description: step.description || '',
            targetDate: step.date || '',
            responsible: 'Sorumlular',
            status: 'Bekliyor'
          })) || [],
          isCompleted: finding.isCompleted || false
        })) || []
      };

      // Dynamically import and generate PDF
      const { ProfessionalPDFGenerator } = await import('@/lib/professionalPdfGenerator');
      const pdfGenerator = new ProfessionalPDFGenerator();
      const pdfBlob = await pdfGenerator.generateReport(formattedData);
      
      // Create blob URL for iframe preview
      const url = URL.createObjectURL(pdfBlob);
      setPdfUrl(url);
      
      toast({
        title: "PDF Hazır",
        description: "PDF önizlemesi oluşturuldu",
      });
    } catch (error) {
      console.error('PDF preview error:', error);
      toast({
        title: "Hata", 
        description: "PDF önizlemesi oluşturulamadı: " + (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDialogClose = () => {
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
    setIsOpen(false);
  };

  const handleDownload = async () => {
    try {
      if (pdfUrl) {
        // Use existing PDF blob for download
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = `ISG-Raporu-${reportData.reportNumber || 'Yeni'}-${new Date().toLocaleDateString('tr-TR').replace(/\./g, '-')}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
          title: "PDF İndirildi",
          description: "Rapor başarıyla indirildi",
        });
      } else {
        // Generate new PDF if not available
        const { downloadProfessionalReportPDF } = await import('@/lib/professionalPdfGenerator');
        const downloadData = {
          id: reportData.id || '',
          reportNumber: reportData.reportNumber || '',
          reportDate: reportData.reportDate || '',
          projectLocation: reportData.projectLocation || '',
          reporter: reportData.reporter || '',
          managementSummary: reportData.managementSummary || '',
          generalEvaluation: reportData.generalEvaluation || '',
          findings: findings?.map(finding => ({
            id: finding.id || '',
            section: finding.section || 3,
            title: finding.title || '',
            description: finding.currentSituation || finding.description || '',
            dangerLevel: finding.dangerLevel as 'high' | 'medium' | 'low',
            recommendation: finding.recommendation || '',
            images: finding.images || [],
            location: finding.title || '',
            processSteps: finding.processSteps?.map((step: any) => ({
              description: step.description || '',
              targetDate: step.date || '',
              responsible: 'Sorumlular',
              status: 'Bekliyor'
            })) || [],
            isCompleted: finding.isCompleted || false
          })) || []
        };
        await downloadProfessionalReportPDF(downloadData);
        
        toast({
          title: "PDF İndirildi",
          description: "Rapor başarıyla indirildi",
        });
      }
    } catch (error) {
      console.error('PDF download error:', error);
      toast({
        title: "Hata",
        description: "PDF indirme sırasında hata oluştu.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        handleDialogClose();
      }
      setIsOpen(open);
    }}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          disabled={isLoading || !reportData}
          onClick={() => {
            if (!pdfUrl && !isGenerating) {
              generatePreview();
            }
          }}
          data-testid="button-pdf-preview"
        >
          <Eye size={14} className="mr-1" />
          Önizle
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText size={20} />
            PDF Önizlemesi - {reportData?.reportNumber || 'Yeni Rapor'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 min-h-[600px]">
          {isGenerating ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                <p className="text-muted-foreground">PDF oluşturuluyor...</p>
              </div>
            </div>
          ) : pdfUrl ? (
            <div className="h-full">
              <iframe
                src={`${pdfUrl}#view=FitH`}
                className="w-full h-full border rounded-lg"
                title="PDF Önizlemesi"
                style={{ minHeight: '600px' }}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-4">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto" />
                <p className="text-muted-foreground">PDF önizlemesi için tıklayın</p>
                <Button onClick={generatePreview} disabled={isGenerating}>
                  <FileText size={16} className="mr-2" />
                  Önizleme Oluştur
                </Button>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={handleDialogClose}>
            Kapat
          </Button>
          <Button onClick={handleDownload} disabled={!pdfUrl}>
            <FileText size={16} className="mr-2" />
            PDF İndir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}