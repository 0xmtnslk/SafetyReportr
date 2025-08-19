import { jsPDF } from 'jspdf';

interface ReportData {
  id: string;
  reportNumber: string;
  reportDate: string | Date;
  projectLocation: string;
  reporter: string;
  managementSummary?: string;
  generalEvaluation?: string;
  findings: Finding[];
}

interface Finding {
  id: string;
  section: number;
  title: string;
  description: string;
  currentSituation?: string;
  dangerLevel: 'high' | 'medium' | 'low';
  recommendation?: string;
  legalBasis?: string;
  images?: string[];
  location?: string;
  processSteps?: ProcessStep[];
  isCompleted?: boolean;
  status?: string;
}

interface ProcessStep {
  date: string;
  description: string;
}

export class ReactPdfService {
  // Helper function to handle Turkish characters properly in PDF
  private handleTurkishText(text: string): string {
    if (!text) return '';
    return text
      .replace(/ğ/g, 'g')
      .replace(/Ğ/g, 'G')
      .replace(/ü/g, 'u')
      .replace(/Ü/g, 'U')
      .replace(/ş/g, 's')
      .replace(/Ş/g, 'S')
      .replace(/ı/g, 'i')
      .replace(/İ/g, 'I')
      .replace(/ö/g, 'o')
      .replace(/Ö/g, 'O')
      .replace(/ç/g, 'c')
      .replace(/Ç/g, 'C');
  }

  // Helper function to add text with word wrap
  private addTextWithWrap(pdf: jsPDF, text: string, x: number, y: number, fontSize: number = 10, fontStyle: string = 'normal', maxWidth: number = 170): number {
    pdf.setFontSize(fontSize);
    pdf.setFont('helvetica', fontStyle);
    const lines = pdf.splitTextToSize(this.handleTurkishText(text), maxWidth);
    const lineHeight = fontSize * 0.35;

    lines.forEach((line: string, index: number) => {
      pdf.text(line, x, y + (index * lineHeight));
    });

    return y + (lines.length * lineHeight) + 3; // Return new Y position
  }

  // Helper function to check if new page is needed
  private checkNewPage(pdf: jsPDF, currentY: number, neededHeight: number, margin: number = 15): number {
    const pageHeight = pdf.internal.pageSize.getHeight();
    if (currentY + neededHeight > pageHeight - margin) {
      pdf.addPage();
      return margin;
    }
    return currentY;
  }

  // Optimize and convert image to base64
  private async optimizeImage(imageUrl: string): Promise<string> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        const maxSize = 400;
        let { width, height } = img;

        // Resize if too large
        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx!.drawImage(img, 0, 0, width, height);

        const optimizedImageData = canvas.toDataURL('image/jpeg', 0.8);
        resolve(optimizedImageData);
      };

      img.onerror = () => {
        resolve(''); // Return empty string on error
      };

      img.src = imageUrl;
    });
  }

  async generatePDF(reportData: ReportData): Promise<Uint8Array> {
    console.log('PDF generating for report:', reportData.reportNumber);

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);
    let currentY = margin;

    // COVER PAGE
    // Header with logo background
    pdf.setFillColor(37, 99, 235); // Blue background
    pdf.rect(0, 0, pageWidth, 45, 'F');

    // Company logo text
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('MLPCARE', margin, 25);

    // Title
    pdf.setTextColor(37, 99, 235);
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    currentY = 70;
    currentY = this.addTextWithWrap(pdf, 'IS SAGLIGI VE GUVENLIGI', margin, currentY, 24, 'bold', contentWidth);
    currentY = this.addTextWithWrap(pdf, 'SAHA GOZLEM RAPORU', margin, currentY, 24, 'bold', contentWidth);

    // Project location
    pdf.setTextColor(100, 100, 100);
    pdf.setFontSize(16);
    currentY += 10;
    currentY = this.addTextWithWrap(pdf, reportData.projectLocation, margin, currentY, 16, 'normal', contentWidth);

    // Report info table
    currentY += 20;
    const tableData = [
      ['Rapor Numarasi:', reportData.reportNumber],
      ['Rapor Tarihi:', typeof reportData.reportDate === 'string' ? reportData.reportDate : new Date(reportData.reportDate).toLocaleDateString('tr-TR')],
      ['Proje Lokasyonu:', reportData.projectLocation],
      ['ISG Uzmani:', reportData.reporter],
      ['Toplam Bulgu:', (reportData.findings?.length || 0).toString()]
    ];

    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(11);

    tableData.forEach(([label, value]) => {
      currentY = this.checkNewPage(pdf, currentY, 15, margin);
      
      // Label
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(37, 99, 235);
      pdf.text(this.handleTurkishText(label), margin, currentY);
      
      // Value
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);
      pdf.text(this.handleTurkishText(value), margin + 60, currentY);
      
      currentY += 8;
    });

    // Footer note
    currentY += 20;
    pdf.setFontSize(9);
    pdf.setTextColor(100, 100, 100);
    currentY = this.addTextWithWrap(pdf, 'Bu rapor Is Sagligi ve Guvenligi Kanunu kapsaminda hazirlanmistir.', margin, currentY, 9, 'normal', contentWidth);

    // PAGE 2 - YÖNETICI ÖZETI
    pdf.addPage();
    currentY = margin;

    // Page header
    pdf.setFillColor(37, 99, 235);
    pdf.rect(0, 0, pageWidth, 35, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('MLPCARE', margin, 15);
    pdf.text(this.handleTurkishText('YONETICI OZETI'), margin, 25);

    currentY = 50;

    // Section title
    pdf.setFillColor(37, 99, 235);
    pdf.rect(margin, currentY, contentWidth, 12, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text(this.handleTurkishText('YONETICI OZETI'), margin + 5, currentY + 8);

    currentY += 20;

    // Content
    pdf.setFillColor(248, 250, 252);
    const contentHeight = 40;
    pdf.rect(margin, currentY, contentWidth, contentHeight, 'F');
    
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    const summary = reportData.managementSummary || 'Yonetici ozeti henuz eklenmemistir.';
    currentY = this.addTextWithWrap(pdf, summary, margin + 5, currentY + 8, 10, 'normal', contentWidth - 10);

    // PAGE 3 - TASARIM HATALARI
    pdf.addPage();
    currentY = margin;

    // Page header
    pdf.setFillColor(37, 99, 235);
    pdf.rect(0, 0, pageWidth, 35, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('MLPCARE', margin, 15);
    pdf.text(this.handleTurkishText('TASARIM/IMALAT/MONTAJ HATALARI'), margin, 25);

    currentY = 50;

    // Section title
    pdf.setFillColor(37, 99, 235);
    pdf.rect(margin, currentY, contentWidth, 12, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text(this.handleTurkishText('TASARIM/IMALAT/MONTAJ HATALARI'), margin + 5, currentY + 8);

    currentY += 20;

    const designErrors = reportData.findings?.filter(f => f.section === 1) || [];
    
    if (designErrors.length === 0) {
      pdf.setFillColor(248, 250, 252);
      pdf.rect(margin, currentY, contentWidth, 20, 'F');
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(10);
      pdf.text(this.handleTurkishText('Bu bolumde herhangi bir bulgu tespit edilmemistir.'), margin + 5, currentY + 12);
    } else {
      currentY = await this.addFindings(pdf, designErrors, currentY, margin, contentWidth, pageHeight);
    }

    // PAGE 4 - İŞ SAĞLIĞI VE GÜVENLİĞİ BULGULARI
    pdf.addPage();
    currentY = margin;

    // Page header
    pdf.setFillColor(37, 99, 235);
    pdf.rect(0, 0, pageWidth, 35, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('MLPCARE', margin, 15);
    pdf.text(this.handleTurkishText('IS SAGLIGI VE GUVENLIGI BULGULARI'), margin, 25);

    currentY = 50;

    // Section title
    pdf.setFillColor(37, 99, 235);
    pdf.rect(margin, currentY, contentWidth, 12, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text(this.handleTurkishText('IS SAGLIGI VE GUVENLIGI BULGULARI'), margin + 5, currentY + 8);

    currentY += 20;

    const safetyFindings = reportData.findings?.filter(f => f.section === 2 || f.section === 3) || [];
    
    if (safetyFindings.length === 0) {
      pdf.setFillColor(248, 250, 252);
      pdf.rect(margin, currentY, contentWidth, 20, 'F');
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(10);
      pdf.text(this.handleTurkishText('Bu bolumde herhangi bir bulgu tespit edilmemistir.'), margin + 5, currentY + 12);
    } else {
      currentY = await this.addFindings(pdf, safetyFindings, currentY, margin, contentWidth, pageHeight);
    }

    // PAGE 5 - TAMAMLANMIŞ BULGULAR
    pdf.addPage();
    currentY = margin;

    // Page header
    pdf.setFillColor(37, 99, 235);
    pdf.rect(0, 0, pageWidth, 35, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('MLPCARE', margin, 15);
    pdf.text(this.handleTurkishText('TAMAMLANMIS BULGULAR'), margin, 25);

    currentY = 50;

    // Section title
    pdf.setFillColor(37, 99, 235);
    pdf.rect(margin, currentY, contentWidth, 12, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text(this.handleTurkishText('TAMAMLANMIS BULGULAR'), margin + 5, currentY + 8);

    currentY += 20;

    const completedFindings = reportData.findings?.filter(f => f.isCompleted || f.status === 'completed') || [];
    
    if (completedFindings.length === 0) {
      pdf.setFillColor(248, 250, 252);
      pdf.rect(margin, currentY, contentWidth, 20, 'F');
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(10);
      pdf.text(this.handleTurkishText('Henuz tamamlanan bulgu bulunmamaktadir.'), margin + 5, currentY + 12);
    } else {
      currentY = await this.addFindings(pdf, completedFindings, currentY, margin, contentWidth, pageHeight);
    }

    // PAGE 6 - GENEL DEĞERLENDİRME
    pdf.addPage();
    currentY = margin;

    // Page header
    pdf.setFillColor(37, 99, 235);
    pdf.rect(0, 0, pageWidth, 35, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('MLPCARE', margin, 15);
    pdf.text(this.handleTurkishText('GENEL DEGERLENDIRME'), margin, 25);

    currentY = 50;

    // Section title
    pdf.setFillColor(37, 99, 235);
    pdf.rect(margin, currentY, contentWidth, 12, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text(this.handleTurkishText('GENEL DEGERLENDIRME'), margin + 5, currentY + 8);

    currentY += 20;

    // Content
    pdf.setFillColor(248, 250, 252);
    const evalContentHeight = 100;
    pdf.rect(margin, currentY, contentWidth, evalContentHeight, 'F');
    
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    const evaluation = reportData.generalEvaluation || 'Genel degerlendirme henuz eklenmemistir.';
    currentY = this.addTextWithWrap(pdf, evaluation, margin + 5, currentY + 8, 10, 'normal', contentWidth - 10);

    console.log('PDF generated successfully');
    return new Uint8Array(pdf.output('arraybuffer'));
  }

  private async addFindings(pdf: jsPDF, findings: Finding[], startY: number, margin: number, contentWidth: number, pageHeight: number): Promise<number> {
    let currentY = startY;

    for (let i = 0; i < findings.length; i++) {
      const finding = findings[i];
      
      currentY = this.checkNewPage(pdf, currentY, 50, margin);

      // Finding box
      pdf.setFillColor(243, 244, 246);
      pdf.rect(margin, currentY, contentWidth, 12, 'F');

      // Finding title
      pdf.setTextColor(17, 24, 39);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(this.handleTurkishText(`BULGU ${i + 1}: ${finding.title}`), margin + 5, currentY + 8);

      // Risk level and location
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(107, 114, 128);
      pdf.text(this.handleTurkishText(`Konum: ${finding.location || 'Belirtilmemis'}`), margin + 5, currentY + 20);

      // Risk badge
      const riskText = this.getRiskText(finding.dangerLevel);
      const riskColor = this.getRiskColor(finding.dangerLevel);
      
      pdf.setFillColor(riskColor.r, riskColor.g, riskColor.b);
      pdf.rect(margin + contentWidth - 40, currentY + 15, 35, 8, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.text(this.handleTurkishText(riskText), margin + contentWidth - 37, currentY + 20);

      currentY += 30;

      // Finding content
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text(this.handleTurkishText('Mevcut Durum:'), margin + 5, currentY);
      currentY += 5;
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      currentY = this.addTextWithWrap(pdf, finding.currentSituation || finding.description, margin + 5, currentY, 9, 'normal', contentWidth - 10);

      if (finding.legalBasis) {
        currentY += 5;
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.text(this.handleTurkishText('Hukuki Dayanak:'), margin + 5, currentY);
        currentY += 5;
        
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        currentY = this.addTextWithWrap(pdf, finding.legalBasis, margin + 5, currentY, 9, 'normal', contentWidth - 10);
      }

      if (finding.recommendation) {
        currentY += 5;
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.text(this.handleTurkishText('Oneri/Cozum:'), margin + 5, currentY);
        currentY += 5;
        
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        currentY = this.addTextWithWrap(pdf, finding.recommendation, margin + 5, currentY, 9, 'normal', contentWidth - 10);
      }

      // Images section
      if (finding.images && finding.images.length > 0) {
        currentY += 10;
        currentY = this.checkNewPage(pdf, currentY, 60, margin);
        
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.text(this.handleTurkishText('Fotograflar:'), margin + 5, currentY);
        currentY += 10;

        // Display first image (if browser environment)
        if (typeof window !== 'undefined' && finding.images[0]) {
          try {
            const optimizedImage = await this.optimizeImage(finding.images[0]);
            if (optimizedImage) {
              const imageWidth = (contentWidth - 20) / 2;
              const imageHeight = imageWidth * 0.75;
              
              currentY = this.checkNewPage(pdf, currentY, imageHeight + 10, margin);
              pdf.addImage(optimizedImage, 'JPEG', margin + 10, currentY, imageWidth, imageHeight);
              currentY += imageHeight + 5;
            }
          } catch (error) {
            console.warn('Could not add image:', error);
          }
        }
        
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.text(this.handleTurkishText(`${finding.images.length} adet fotograf eklenmistir.`), margin + 5, currentY);
        currentY += 10;
      }

      currentY += 15; // Space between findings
    }

    return currentY;
  }

  private getRiskText(level: string): string {
    switch (level) {
      case 'high': return 'YUKSEK RISK';
      case 'medium': return 'ORTA RISK';
      case 'low': return 'DUSUK RISK';
      default: return 'ORTA RISK';
    }
  }

  private getRiskColor(level: string): { r: number; g: number; b: number } {
    switch (level) {
      case 'high': return { r: 220, g: 38, b: 38 };
      case 'medium': return { r: 234, g: 88, b: 12 };
      case 'low': return { r: 22, g: 163, b: 74 };
      default: return { r: 234, g: 88, b: 12 };
    }
  }
}