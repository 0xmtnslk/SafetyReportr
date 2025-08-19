import { jsPDF } from 'jspdf';
import { readFileSync } from 'fs';
import { join } from 'path';

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
  private logoBase64: string = '';
  private tahomaFont: string = '';
  private tahomaBoldFont: string = '';

  constructor() {
    this.loadLogo();
    this.loadTahomaFonts();
  }

  private loadLogo() {
    try {
      const logoPath = join(process.cwd(), 'client/src/assets/mlp-logo.png');
      const logoBuffer = readFileSync(logoPath);
      this.logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
    } catch (error) {
      console.warn('Could not load logo:', error);
      this.logoBase64 = '';
    }
  }

  private loadTahomaFonts() {
    try {
      // Load Tahoma Regular
      const tahomaPath = join(process.cwd(), 'assets/fonts/Tahoma.ttf');
      const tahomaBuffer = readFileSync(tahomaPath);
      this.tahomaFont = tahomaBuffer.toString('base64');
      
      // Load Tahoma Bold
      const tahomaBoldPath = join(process.cwd(), 'assets/fonts/TahomaBold.ttf');
      const tahomaBoldBuffer = readFileSync(tahomaBoldPath);
      this.tahomaBoldFont = tahomaBoldBuffer.toString('base64');
    } catch (error) {
      console.warn('Could not load Tahoma fonts:', error);
      this.tahomaFont = '';
      this.tahomaBoldFont = '';
    }
  }

  // Setup Tahoma fonts in PDF
  private setupFonts(pdf: jsPDF) {
    try {
      if (this.tahomaFont) {
        pdf.addFileToVFS('Tahoma.ttf', this.tahomaFont);
        pdf.addFont('Tahoma.ttf', 'Tahoma', 'normal');
      }
      if (this.tahomaBoldFont) {
        pdf.addFileToVFS('TahomaBold.ttf', this.tahomaBoldFont);
        pdf.addFont('TahomaBold.ttf', 'Tahoma', 'bold');
      }
    } catch (error) {
      console.warn('Font setup failed, using default fonts:', error);
    }
  }

  // Helper function to add text with proper Turkish encoding and word wrap
  private addTextWithWrap(pdf: jsPDF, text: string, x: number, y: number, fontSize: number = 10, fontStyle: string = 'normal', maxWidth: number = 170): number {
    pdf.setFontSize(fontSize);
    
    // Use Tahoma if available, otherwise fallback to Helvetica
    try {
      if (this.tahomaFont && (fontStyle === 'normal' || fontStyle === 'bold')) {
        pdf.setFont('Tahoma', fontStyle);
      } else {
        pdf.setFont('helvetica', fontStyle);
      }
    } catch (fontError) {
      pdf.setFont('helvetica', fontStyle);
    }
    
    // Keep Turkish characters as-is - both fonts support Turkish
    const processedText = text || '';
    const lines = pdf.splitTextToSize(processedText, maxWidth);
    const lineHeight = fontSize * 0.35;

    lines.forEach((line: string, index: number) => {
      pdf.text(line, x, y + (index * lineHeight));
    });

    return y + (lines.length * lineHeight) + 3;
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

  // Add page numbers with proper Turkish text
  private addPageNumber(pdf: jsPDF, pageNumber: number) {
    const pageHeight = pdf.internal.pageSize.getHeight();
    const pageWidth = pdf.internal.pageSize.getWidth();
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 100, 100);
    
    // Footer line
    pdf.setDrawColor(200, 200, 200);
    pdf.line(15, pageHeight - 20, pageWidth - 15, pageHeight - 20);
    
    // Page info with Turkish characters
    pdf.text('MLPCARE Medical Park Hospital - İSG Raporu', 15, pageHeight - 10);
    pdf.text(`Sayfa ${pageNumber}`, pageWidth - 35, pageHeight - 10);
  }

  // Optimize and convert image to base64
  private async optimizeImage(imageUrl: string): Promise<string> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined') {
        resolve('');
        return;
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        const maxSize = 400;
        let { width, height } = img;

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
        resolve('');
      };

      img.crossOrigin = 'anonymous';
      img.src = imageUrl;
    });
  }

  async generatePDF(reportData: ReportData): Promise<Uint8Array> {
    console.log('PDF generating for report:', reportData.reportNumber);

    const pdf = new jsPDF('p', 'mm', 'a4');
    
    // Setup Tahoma fonts for Turkish character support
    this.setupFonts(pdf);
    
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);
    let currentY = margin;
    let pageNumber = 1;

    // COVER PAGE
    // Header with logo background
    pdf.setFillColor(37, 99, 235);
    pdf.rect(0, 0, pageWidth, 45, 'F');

    // Add actual logo if available
    if (this.logoBase64) {
      try {
        pdf.addImage(this.logoBase64, 'PNG', margin, 8, 30, 30);
      } catch (error) {
        console.warn('Could not add logo to PDF:', error);
      }
    }

    // Company name
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('MLPCARE', margin + (this.logoBase64 ? 35 : 0), 25);

    // Title with REAL Turkish characters - we won't convert them anymore
    pdf.setTextColor(37, 99, 235);
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    currentY = 70;
    currentY = this.addTextWithWrap(pdf, 'İŞ SAĞLIĞI VE GÜVENLİĞİ', margin, currentY, 24, 'bold', contentWidth);
    currentY = this.addTextWithWrap(pdf, 'SAHA GÖZLEM RAPORU', margin, currentY, 24, 'bold', contentWidth);

    // Project location
    pdf.setTextColor(100, 100, 100);
    pdf.setFontSize(16);
    currentY += 10;
    currentY = this.addTextWithWrap(pdf, reportData.projectLocation, margin, currentY, 16, 'normal', contentWidth);

    // Report info table
    currentY += 20;
    const tableData = [
      ['Rapor Numarası:', reportData.reportNumber],
      ['Rapor Tarihi:', typeof reportData.reportDate === 'string' ? reportData.reportDate : new Date(reportData.reportDate).toLocaleDateString('tr-TR')],
      ['Proje Lokasyonu:', reportData.projectLocation],
      ['İSG Uzmanı:', reportData.reporter],
      ['Toplam Bulgu:', (reportData.findings?.length || 0).toString()]
    ];

    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(11);

    tableData.forEach(([label, value]) => {
      currentY = this.checkNewPage(pdf, currentY, 15, margin);
      
      // Label
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(37, 99, 235);
      pdf.text(label, margin, currentY);
      
      // Value
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);
      pdf.text(value, margin + 60, currentY);
      
      currentY += 8;
    });

    // Footer note
    currentY += 20;
    pdf.setFontSize(9);
    pdf.setTextColor(100, 100, 100);
    currentY = this.addTextWithWrap(pdf, 'Bu rapor İş Sağlığı ve Güvenliği Kanunu kapsamında hazırlanmıştır.', margin, currentY, 9, 'normal', contentWidth);

    this.addPageNumber(pdf, pageNumber++);

    // PAGE 2 - YÖNETİCİ ÖZETİ
    pdf.addPage();
    currentY = margin;

    // Page header
    pdf.setFillColor(37, 99, 235);
    pdf.rect(0, 0, pageWidth, 35, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    if (this.logoBase64) {
      try {
        pdf.addImage(this.logoBase64, 'PNG', margin, 5, 25, 25);
      } catch (error) {
        console.warn('Could not add logo:', error);
      }
    }
    pdf.text('MLPCARE', margin + (this.logoBase64 ? 30 : 0), 15);
    pdf.text('YÖNETİCİ ÖZETİ', margin + (this.logoBase64 ? 30 : 0), 25);

    currentY = 50;

    // Section title
    pdf.setFillColor(37, 99, 235);
    pdf.rect(margin, currentY, contentWidth, 12, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('YÖNETİCİ ÖZETİ', margin + 5, currentY + 8);

    currentY += 20;

    // Content
    pdf.setFillColor(248, 250, 252);
    const contentHeight = Math.max(40, Math.min(100, (reportData.managementSummary?.length || 0) / 8));
    pdf.rect(margin, currentY, contentWidth, contentHeight, 'F');
    
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    const summary = reportData.managementSummary || 'Yönetici özeti henüz eklenmemiştir.';
    currentY = this.addTextWithWrap(pdf, summary, margin + 5, currentY + 8, 10, 'normal', contentWidth - 10);

    this.addPageNumber(pdf, pageNumber++);

    // PAGE 3 - TASARIM HATALARI
    pdf.addPage();
    currentY = margin;
    this.addPageHeader(pdf, 'TASARIM/İMALAT/MONTAJ HATALARI');
    currentY = 50;

    const designErrors = reportData.findings?.filter(f => f.section === 1) || [];
    currentY = await this.addSectionContent(pdf, 'TASARIM/İMALAT/MONTAJ HATALARI', designErrors, currentY, margin, contentWidth, pageHeight);
    this.addPageNumber(pdf, pageNumber++);

    // PAGE 4 - İŞ SAĞLIĞI VE GÜVENLİĞİ BULGULARI
    pdf.addPage();
    currentY = margin;
    this.addPageHeader(pdf, 'İŞ SAĞLIĞI VE GÜVENLİĞİ BULGULARI');
    currentY = 50;

    const safetyFindings = reportData.findings?.filter(f => f.section === 2 || f.section === 3) || [];
    currentY = await this.addSectionContent(pdf, 'İŞ SAĞLIĞI VE GÜVENLİĞİ BULGULARI', safetyFindings, currentY, margin, contentWidth, pageHeight);
    this.addPageNumber(pdf, pageNumber++);

    // PAGE 5 - TAMAMLANMIŞ BULGULAR
    pdf.addPage();
    currentY = margin;
    this.addPageHeader(pdf, 'TAMAMLANMIŞ BULGULAR');
    currentY = 50;

    const completedFindings = reportData.findings?.filter(f => f.isCompleted || f.status === 'completed') || [];
    currentY = await this.addSectionContent(pdf, 'TAMAMLANMIŞ BULGULAR', completedFindings, currentY, margin, contentWidth, pageHeight);
    this.addPageNumber(pdf, pageNumber++);

    // PAGE 6 - GENEL DEĞERLENDİRME
    pdf.addPage();
    currentY = margin;
    this.addPageHeader(pdf, 'GENEL DEĞERLENDİRME');
    currentY = 50;

    // Section title
    pdf.setFillColor(37, 99, 235);
    pdf.rect(margin, currentY, contentWidth, 12, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('GENEL DEĞERLENDİRME', margin + 5, currentY + 8);

    currentY += 20;

    // Content
    pdf.setFillColor(248, 250, 252);
    const evalContentHeight = Math.max(100, Math.min(150, (reportData.generalEvaluation?.length || 0) / 8));
    pdf.rect(margin, currentY, contentWidth, evalContentHeight, 'F');
    
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    const evaluation = reportData.generalEvaluation || 'Genel değerlendirme henüz eklenmemiştir.';
    currentY = this.addTextWithWrap(pdf, evaluation, margin + 5, currentY + 8, 10, 'normal', contentWidth - 10);

    this.addPageNumber(pdf, pageNumber++);

    console.log('PDF generated successfully');
    return new Uint8Array(pdf.output('arraybuffer'));
  }

  private addPageHeader(pdf: jsPDF, title: string) {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 15;
    
    pdf.setFillColor(37, 99, 235);
    pdf.rect(0, 0, pageWidth, 35, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    
    if (this.logoBase64) {
      try {
        pdf.addImage(this.logoBase64, 'PNG', margin, 5, 25, 25);
      } catch (error) {
        console.warn('Could not add logo:', error);
      }
    }
    
    pdf.text('MLPCARE', margin + (this.logoBase64 ? 30 : 0), 15);
    pdf.text(title, margin + (this.logoBase64 ? 30 : 0), 25);
  }

  private async addSectionContent(pdf: jsPDF, sectionTitle: string, findings: Finding[], startY: number, margin: number, contentWidth: number, pageHeight: number): Promise<number> {
    let currentY = startY;

    // Section title
    pdf.setFillColor(37, 99, 235);
    pdf.rect(margin, currentY, contentWidth, 12, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text(sectionTitle, margin + 5, currentY + 8);

    currentY += 20;

    if (findings.length === 0) {
      pdf.setFillColor(248, 250, 252);
      pdf.rect(margin, currentY, contentWidth, 20, 'F');
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(10);
      pdf.text('Bu bölümde herhangi bir bulgu tespit edilmemiştir.', margin + 5, currentY + 12);
      return currentY + 30;
    }

    return await this.addFindings(pdf, findings, currentY, margin, contentWidth, pageHeight);
  }

  private async addFindings(pdf: jsPDF, findings: Finding[], startY: number, margin: number, contentWidth: number, pageHeight: number): Promise<number> {
    let currentY = startY;

    for (let i = 0; i < findings.length; i++) {
      const finding = findings[i];
      
      currentY = this.checkNewPage(pdf, currentY, 80, margin);

      // Finding box
      pdf.setFillColor(243, 244, 246);
      pdf.rect(margin, currentY, contentWidth, 12, 'F');

      // Finding title
      pdf.setTextColor(17, 24, 39);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`BULGU ${i + 1}: ${finding.title}`, margin + 5, currentY + 8);

      // Risk level and location
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(107, 114, 128);
      pdf.text(`Konum: ${finding.location || 'Belirtilmemiş'}`, margin + 5, currentY + 20);

      // Risk badge
      const riskText = this.getRiskText(finding.dangerLevel);
      const riskColor = this.getRiskColor(finding.dangerLevel);
      
      pdf.setFillColor(riskColor.r, riskColor.g, riskColor.b);
      pdf.rect(margin + contentWidth - 40, currentY + 15, 35, 8, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.text(riskText, margin + contentWidth - 37, currentY + 20);

      currentY += 30;

      // Finding content
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Mevcut Durum:', margin + 5, currentY);
      currentY += 5;
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      currentY = this.addTextWithWrap(pdf, finding.currentSituation || finding.description, margin + 5, currentY, 9, 'normal', contentWidth - 10);

      if (finding.legalBasis) {
        currentY += 5;
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.text('Hukuki Dayanak:', margin + 5, currentY);
        currentY += 5;
        
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        currentY = this.addTextWithWrap(pdf, finding.legalBasis, margin + 5, currentY, 9, 'normal', contentWidth - 10);
      }

      if (finding.recommendation) {
        currentY += 5;
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.text('Öneri/Çözüm:', margin + 5, currentY);
        currentY += 5;
        
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        currentY = this.addTextWithWrap(pdf, finding.recommendation, margin + 5, currentY, 9, 'normal', contentWidth - 10);
      }

      // Process timeline if available
      if (finding.processSteps && finding.processSteps.length > 0) {
        currentY += 10;
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.text('Süreç Skalası:', margin + 5, currentY);
        currentY += 5;
        
        finding.processSteps.forEach(step => {
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(8);
          pdf.text(`• ${step.date}: ${step.description}`, margin + 10, currentY);
          currentY += 4;
        });
      }

      // Images section with ACTUAL display
      if (finding.images && finding.images.length > 0) {
        currentY += 10;
        currentY = this.checkNewPage(pdf, currentY, 80, margin);
        
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.text('Fotoğraflar:', margin + 5, currentY);
        currentY += 10;

        // Display first image
        if (finding.images[0]) {
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
        pdf.text(`${finding.images.length} adet fotoğraf eklenmiştir.`, margin + 5, currentY);
        currentY += 10;
      }

      currentY += 15; // Space between findings
    }

    return currentY;
  }

  private getRiskText(level: string): string {
    switch (level) {
      case 'high': return 'YÜKSEK RİSK';
      case 'medium': return 'ORTA RİSK';
      case 'low': return 'DÜŞÜK RİSK';
      default: return 'ORTA RİSK';
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