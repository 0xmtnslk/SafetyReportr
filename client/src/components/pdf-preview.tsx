import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Eye, FileText, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
    if (!reportData) {
      toast({
        title: "Hata",
        description: "Rapor verileri bulunamadı",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch(`/api/reports/${reportData.id}/pdf`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);

      toast({
        title: "Başarılı",
        description: "PDF önizlemesi hazırlandı",
      });
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        title: "Hata",
        description: `PDF oluşturulurken hata: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (pdfUrl) {
      const a = document.createElement('a');
      a.href = pdfUrl;
      a.download = `ISG_Raporu_${reportData?.reportNumber || 'Yeni'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      toast({
        title: "İndirildi",
        description: "PDF başarıyla indirildi",
      });
    }
  };

  const handleDialogClose = () => {
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
    setIsOpen(false);
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
          className="w-full sm:w-auto text-xs"
        >
          <Eye size={12} className="mr-1" />
          PDF Önizle
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
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
                <p className="text-muted-foreground">Professional PDF oluşturuluyor...</p>
                <p className="text-sm text-muted-foreground">Puppeteer ile yüksek kaliteli render</p>
              </div>
            </div>
          ) : pdfUrl ? (
            <div className="h-full">
              <iframe
                src={`${pdfUrl}#view=FitH`}
                className="w-full h-full border-0 rounded-lg"
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