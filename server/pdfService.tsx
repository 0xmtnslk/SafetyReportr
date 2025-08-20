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
    // Tahoma fonts disabled due to loading issues
    // Using Helvetica which has excellent Turkish character support
    console.log('Using Helvetica font for Turkish character support');
    this.tahomaFont = '';
    this.tahomaBoldFont = '';
  }

  // Helper function to properly encode Turkish characters
  private encodeTurkishText(text: string): string {
    if (!text) return '';
    // Normalize to NFC and ensure proper UTF-8 encoding for Turkish characters
    return text
      .normalize('NFC')
      .replace(/\u0131/g, 'ı')  // ı
      .replace(/\u0130/g, 'İ')  // İ  
      .replace(/\u011F/g, 'ğ')  // ğ
      .replace(/\u011E/g, 'Ğ')  // Ğ
      .replace(/\u015F/g, 'ş')  // ş
      .replace(/\u015E/g, 'Ş')  // Ş
      .replace(/\u00FC/g, 'ü')  // ü
      .replace(/\u00DC/g, 'Ü')  // Ü
      .replace(/\u00F6/g, 'ö')  // ö
      .replace(/\u00D6/g, 'Ö')  // Ö
      .replace(/\u00E7/g, 'ç')  // ç
      .replace(/\u00C7/g, 'Ç');  // Ç
  }

  private setupFonts(pdf: jsPDF) {
    // Use built-in Helvetica font which supports Turkish characters well
    console.log('Using built-in Helvetica font for reliable Turkish character support');
    // No custom font loading needed - Helvetica works great with Turkish
  }

  // Helper function to add text with proper Turkish encoding and word wrap
  private addTextWithWrap(pdf: jsPDF, text: string, x: number, y: number, fontSize: number = 11, fontStyle: string = 'normal', maxWidth: number = 170): number {
    if (!text) return y;
    
    pdf.setFontSize(fontSize);
    
    // Use Helvetica which has excellent Turkish character support
    pdf.setFont('helvetica', fontStyle);
    
    // Properly encode Turkish characters
    const processedText = this.encodeTurkishText(text);
    const lines = pdf.splitTextToSize(processedText, maxWidth);
    
    // Better line height for Turkish text readability
    const lineHeight = fontSize * 0.52; // Increased from 0.35 to 0.52

    lines.forEach((line: string, index: number) => {
      if (line.trim()) { // Skip empty lines
        pdf.text(line, x, y + (index * lineHeight));
      }
    });

    return y + (lines.length * lineHeight) + (fontSize * 0.3); // Better spacing
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
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 100, 100);
    
    // Footer line
    pdf.setDrawColor(200, 200, 200);
    pdf.line(15, pageHeight - 22, pageWidth - 15, pageHeight - 22);
    
    // Page info with Turkish characters
    const footerText = this.encodeTurkishText('MLPCARE Medical Park Hospital - İSG Raporu');
    const pageText = this.encodeTurkishText(`Sayfa ${pageNumber}`);
    pdf.text(footerText, 15, pageHeight - 12);
    pdf.text(pageText, pageWidth - 40, pageHeight - 12);
  }

  // Optimize and convert image to base64 using Sharp (server-side)
  private async optimizeImage(imageUrl: string): Promise<string> {
    try {
      // Import Sharp dynamically since it's a server-side only package
      const sharp = await import('sharp');
      const fs = await import('fs');
      const path = await import('path');
      
      let imagePath = imageUrl;
      
      // Handle different types of image URLs/paths
      if (imageUrl.startsWith('data:')) {
        // Already a base64 image, extract and process
        const base64Data = imageUrl.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');
        
        const optimized = await sharp.default(buffer)
          .resize(400, 400, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 80 })
          .toBuffer();
        
        return `data:image/jpeg;base64,${optimized.toString('base64')}`;
      } else if (imageUrl.startsWith('/uploads/')) {
        // Local upload path
        imagePath = path.join(process.cwd(), imageUrl);
      } else if (imageUrl.startsWith('uploads/')) {
        // Relative upload path
        imagePath = path.join(process.cwd(), imageUrl);
      }
      
      // Check if file exists
      if (!fs.existsSync(imagePath)) {
        console.warn('Image file not found:', imagePath);
        return '';
      }
      
      // Process the image with Sharp
      const optimized = await sharp.default(imagePath)
        .resize(400, 400, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toBuffer();
      
      return `data:image/jpeg;base64,${optimized.toString('base64')}`;
    } catch (error) {
      console.warn('Could not optimize image:', error);
      return '';
    }
  }

  async generatePDF(reportData: ReportData): Promise<Uint8Array> {
    console.log('PDF generating for report:', reportData.reportNumber);

    const pdf = new jsPDF('p', 'mm', 'a4');
    
    // Setup fonts for Turkish character support
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

    // Title with proper Turkish character encoding
    pdf.setTextColor(37, 99, 235);
    pdf.setFontSize(22);
    pdf.setFont('helvetica', 'bold');
    currentY = 70;
    currentY = this.addTextWithWrap(pdf, 'İŞ SAĞLIĞI VE GÜVENLİĞİ', margin, currentY, 22, 'bold', contentWidth);
    currentY = this.addTextWithWrap(pdf, 'SAHA GÖZLEM RAPORU', margin, currentY, 22, 'bold', contentWidth);

    // Project location
    pdf.setTextColor(100, 100, 100);
    pdf.setFontSize(14);
    currentY += 15;
    currentY = this.addTextWithWrap(pdf, reportData.projectLocation, margin, currentY, 14, 'normal', contentWidth);

    // Report info table
    currentY += 25;
    const tableData = [
      ['Rapor Numarası:', reportData.reportNumber],
      ['Rapor Tarihi:', typeof reportData.reportDate === 'string' ? reportData.reportDate : new Date(reportData.reportDate).toLocaleDateString('tr-TR')],
      ['Proje Lokasyonu:', reportData.projectLocation],
      ['İSG Uzmanı:', reportData.reporter],
      ['Toplam Bulgu:', (reportData.findings?.length || 0).toString()]
    ];

    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(12);

    tableData.forEach(([label, value]) => {
      currentY = this.checkNewPage(pdf, currentY, 15, margin);
      
      // Label
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(37, 99, 235);
      pdf.text(this.encodeTurkishText(label), margin, currentY);
      
      // Value
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);
      pdf.text(this.encodeTurkishText(value), margin + 65, currentY);
      
      currentY += 10; // Increased spacing
    });

    // Footer note
    currentY += 25;
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    currentY = this.addTextWithWrap(pdf, 'Bu rapor İş Sağlığı ve Güvenliği Kanunu kapsamında hazırlanmıştır.', margin, currentY, 10, 'normal', contentWidth);

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
    const contentHeight = Math.max(50, Math.min(120, (reportData.managementSummary?.length || 0) / 6));
    pdf.rect(margin, currentY, contentWidth, contentHeight, 'F');
    
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    
    const summary = reportData.managementSummary || 'Yönetici özeti henüz eklenmemiştir.';
    currentY = this.addTextWithWrap(pdf, summary, margin + 8, currentY + 12, 11, 'normal', contentWidth - 16);

    this.addPageNumber(pdf, pageNumber++);

    // PAGE 3 - TASARIM HATALARI
    pdf.addPage();
    currentY = margin;
    this.addPageHeader(pdf, 'TASARIM/İMALAT/MONTAJ HATALARI');
    currentY = 50;

    const designErrors = reportData.findings?.filter(f => f.section === 2) || [];
    currentY = await this.addSectionContent(pdf, 'TASARIM/İMALAT/MONTAJ HATALARI', designErrors, currentY, margin, contentWidth, pageHeight);
    this.addPageNumber(pdf, pageNumber++);

    // PAGE 4 - İŞ SAĞLIĞI VE GÜVENLİĞİ BULGULARI
    pdf.addPage();
    currentY = margin;
    this.addPageHeader(pdf, 'İŞ SAĞLIĞI VE GÜVENLİĞİ BULGULARI');
    currentY = 50;

    const safetyFindings = reportData.findings?.filter(f => f.section === 3) || [];
    currentY = await this.addSectionContent(pdf, 'İŞ SAĞLIĞI VE GÜVENLİĞİ BULGULARI', safetyFindings, currentY, margin, contentWidth, pageHeight);
    this.addPageNumber(pdf, pageNumber++);

    // PAGE 5 - TAMAMLANMIŞ BULGULAR
    pdf.addPage();
    currentY = margin;
    this.addPageHeader(pdf, 'TAMAMLANMIŞ BULGULAR');
    currentY = 50;

    const completedFindings = reportData.findings?.filter(f => f.section === 4) || [];
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
    const evalContentHeight = Math.max(120, Math.min(180, (reportData.generalEvaluation?.length || 0) / 6));
    pdf.rect(margin, currentY, contentWidth, evalContentHeight, 'F');
    
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    
    const evaluation = reportData.generalEvaluation || 'Genel değerlendirme henüz eklenmemiştir.';
    currentY = this.addTextWithWrap(pdf, evaluation, margin + 8, currentY + 12, 11, 'normal', contentWidth - 16);

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
    pdf.text(this.encodeTurkishText(title), margin + (this.logoBase64 ? 30 : 0), 25);
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
      pdf.rect(margin, currentY, contentWidth, 25, 'F');
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(11);
      pdf.text(this.encodeTurkishText('Bu bölümde herhangi bir bulgu tespit edilmemiştir.'), margin + 8, currentY + 16);
      return currentY + 35;
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
      pdf.setFontSize(13);
      pdf.setFont('helvetica', 'bold');
      pdf.text(this.encodeTurkishText(`BULGU ${i + 1}: ${finding.title}`), margin + 8, currentY + 9);

      // Risk level and location
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(107, 114, 128);
      pdf.text(this.encodeTurkishText(`Konum: ${finding.location || 'Belirtilmemiş'}`), margin + 8, currentY + 22);

      // Risk badge
      const riskText = this.getRiskText(finding.dangerLevel);
      const riskColor = this.getRiskColor(finding.dangerLevel);
      
      pdf.setFillColor(riskColor.r, riskColor.g, riskColor.b);
      pdf.rect(margin + contentWidth - 45, currentY + 16, 40, 10, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text(this.encodeTurkishText(riskText), margin + contentWidth - 42, currentY + 22);

      currentY += 35;

      // Finding content
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text(this.encodeTurkishText('Mevcut Durum:'), margin + 8, currentY);
      currentY += 8;
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      currentY = this.addTextWithWrap(pdf, finding.currentSituation || finding.description, margin + 8, currentY, 10, 'normal', contentWidth - 16);

      if (finding.legalBasis) {
        currentY += 8;
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(11);
        pdf.text(this.encodeTurkishText('Hukuki Dayanak:'), margin + 8, currentY);
        currentY += 8;
        
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        currentY = this.addTextWithWrap(pdf, finding.legalBasis, margin + 8, currentY, 10, 'normal', contentWidth - 16);
      }

      if (finding.recommendation) {
        currentY += 8;
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(11);
        pdf.text(this.encodeTurkishText('Öneri/Çözüm:'), margin + 8, currentY);
        currentY += 8;
        
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        currentY = this.addTextWithWrap(pdf, finding.recommendation, margin + 8, currentY, 10, 'normal', contentWidth - 16);
      }

      // Process timeline if available
      if (finding.processSteps && finding.processSteps.length > 0) {
        currentY += 12;
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(11);
        pdf.text(this.encodeTurkishText('Süreç Skalası:'), margin + 8, currentY);
        currentY += 8;
        
        finding.processSteps.forEach(step => {
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(9);
          pdf.text(this.encodeTurkishText(`• ${step.date}: ${step.description}`), margin + 12, currentY);
          currentY += 6;
        });
      }

      // Images section with ACTUAL display
      if (finding.images && finding.images.length > 0) {
        currentY += 12;
        currentY = this.checkNewPage(pdf, currentY, 80, margin);
        
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(11);
        pdf.text(this.encodeTurkishText('Fotoğraflar:'), margin + 8, currentY);
        currentY += 12;

        // Display first image
        if (finding.images[0]) {
          try {
            const optimizedImage = await this.optimizeImage(finding.images[0]);
            if (optimizedImage) {
              const imageWidth = (contentWidth - 30) / 2;
              const imageHeight = imageWidth * 0.75;
              
              currentY = this.checkNewPage(pdf, currentY, imageHeight + 15, margin);
              pdf.addImage(optimizedImage, 'JPEG', margin + 15, currentY, imageWidth, imageHeight);
              currentY += imageHeight + 8;
            }
          } catch (error) {
            console.warn('Could not add image:', error);
          }
        }
        
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        pdf.text(this.encodeTurkishText(`${finding.images.length} adet fotoğraf eklenmiştir.`), margin + 8, currentY);
        currentY += 12;
      }

      currentY += 20; // Better space between findings
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