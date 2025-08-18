import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Eye, FileText, Loader2 } from "lucide-react";
import { downloadProfessionalReportPDF } from "@/lib/professionalPdfGenerator";
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
        id: reportData.id,
        reportNumber: reportData.reportNumber,
        reportDate: reportData.reportDate,
        projectLocation: reportData.projectLocation,
        reporter: reportData.reporter,
        managementSummary: reportData.managementSummary,
        generalEvaluation: reportData.generalEvaluation,
        findings: findings || []
      };

      // Generate PDF blob
      const generator = (await import('@/lib/professionalPdfGenerator')).ProfessionalPDFGenerator;
      const pdfGenerator = new generator();
      const pdfBlob = await pdfGenerator.generateReport(formattedData);
      
      // Create URL for preview
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
        description: "PDF önizlemesi oluşturulamadı",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDialogClose = () => {
    setIsOpen(false);
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
  };

  const handleDownload = async () => {
    try {
      await downloadProfessionalReportPDF({
        id: reportData.id,
        reportNumber: reportData.reportNumber,
        reportDate: reportData.reportDate,
        projectLocation: reportData.projectLocation,
        reporter: reportData.reporter,
        managementSummary: reportData.managementSummary,
        generalEvaluation: reportData.generalEvaluation,
        findings: findings || []
      });
      
      toast({
        title: "PDF İndirildi",
        description: "Rapor başarıyla PDF olarak indirildi.",
      });
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
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          disabled={isLoading || !reportData}
          onClick={() => {
            setIsOpen(true);
            if (!pdfUrl && !isGenerating) {
              generatePreview();
            }
          }}
          data-testid="button-pdf-preview"
        >
          <Eye size={16} className="mr-2" />
          Raporu Görüntüle
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText size={20} />
            PDF Önizlemesi - {reportData?.reportNumber || 'Yeni Rapor'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 min-h-[500px]">
          {isGenerating ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                <p className="text-muted-foreground">PDF oluşturuluyor...</p>
              </div>
            </div>
          ) : pdfUrl ? (
            <iframe
              src={pdfUrl}
              className="w-full h-full border rounded-lg"
              title="PDF Önizlemesi"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-4">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto" />
                <p className="text-muted-foreground">PDF önizlemesi yükleniyor...</p>
                <Button onClick={generatePreview} disabled={isGenerating}>
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