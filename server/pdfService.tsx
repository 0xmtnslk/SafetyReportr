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

  constructor() {
    this.loadLogo();
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


  // Enhanced text wrapper with Turkish support
  private addTextWithWrap(pdf: jsPDF, text: string, x: number, y: number, fontSize: number = 11, fontStyle: string = 'normal', maxWidth: number = 170): number {
    if (!text) return y;
    
    pdf.setFontSize(fontSize);
    pdf.setFont('helvetica', fontStyle);
    
    // Use text as-is with UTF-8 support
    const lines = pdf.splitTextToSize(text, maxWidth);
    
    const lineHeight = fontSize * 0.6; // Better spacing

    lines.forEach((line: string, index: number) => {
      if (line.trim()) {
        pdf.text(line, x, y + (index * lineHeight));
      }
    });

    return y + (lines.length * lineHeight) + (fontSize * 0.4);
  }

  // NEW: Enhanced header with proper Turkish characters
  private addPageHeader(pdf: jsPDF) {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 15;
    
    // Blue background like in logo color
    pdf.setFillColor(37, 99, 235);
    pdf.rect(0, 0, pageWidth, 45, 'F');
    
    // Logo
    if (this.logoBase64) {
      try {
        pdf.addImage(this.logoBase64, 'PNG', margin, 10, 25, 25);
      } catch (error) {
        console.warn('Could not add logo:', error);
      }
    }
    
    // Hospital name in WHITE - Turkish characters fixed
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    
    // Hospital name with original Turkish characters
    pdf.text('İstinye Üniversitesi Topkapı Liv Hastanesi', margin + (this.logoBase64 ? 30 : 0), 27);
  }

  // NEW: Enhanced footer with Turkish characters
  private addPageFooter(pdf: jsPDF, pageNumber: number, totalPages: number) {
    const pageHeight = pdf.internal.pageSize.getHeight();
    const pageWidth = pdf.internal.pageSize.getWidth();
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 100, 100);
    
    // Footer line
    pdf.setDrawColor(220, 220, 220);
    pdf.line(15, pageHeight - 25, pageWidth - 15, pageHeight - 25);
    
    // Hospital name and report type with Turkish characters
    const footerText = 'İstinye Üniversitesi Topkapı Liv Hastanesi İSG Raporu';
    const pageText = `Sayfa ${pageNumber}/${totalPages}`;
    
    pdf.text(footerText, 15, pageHeight - 15);
    pdf.text(pageText, pageWidth - 50, pageHeight - 15);
  }

  // Helper function to check if new page is needed
  private checkNewPage(pdf: jsPDF, currentY: number, neededHeight: number, margin: number = 15): number {
    const pageHeight = pdf.internal.pageSize.getHeight();
    if (currentY + neededHeight > pageHeight - 60) { // Account for footer
      pdf.addPage();
      this.addPageHeader(pdf);
      return 60; // Start after header
    }
    return currentY;
  }

  async generatePDF(reportData: ReportData): Promise<Uint8Array> {
    console.log('PDF generating for report:', reportData.reportNumber);
    console.log('Report data check:', {
      projectLocation: reportData.projectLocation,
      reporter: reportData.reporter,
      managementSummary: reportData.managementSummary?.substring(0, 100)
    });

    const pdf = new jsPDF('p', 'mm', 'a4');
    
    // Setup for Turkish characters
    pdf.setFont('helvetica');
    
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);
    let currentY = 60; // Start after header

    // Add header to first page
    this.addPageHeader(pdf);

    // COVER PAGE CONTENT
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    
    currentY += 30;
    pdf.text('İSG DENETİM RAPORU', pageWidth / 2, currentY, { align: 'center' });
    
    currentY += 20;
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'normal');
    
    pdf.text(`Rapor No: ${reportData.reportNumber}`, pageWidth / 2, currentY, { align: 'center' });
    
    currentY += 15;
    pdf.text(`Proje Lokasyonu: ${reportData.projectLocation}`, pageWidth / 2, currentY, { align: 'center' });
    
    currentY += 15;
    const reportDateStr = reportData.reportDate instanceof Date ? 
      reportData.reportDate.toLocaleDateString('tr-TR') : 
      new Date(reportData.reportDate).toLocaleDateString('tr-TR');
    pdf.text(`Rapor Tarihi: ${reportDateStr}`, pageWidth / 2, currentY, { align: 'center' });
    
    currentY += 15;
    pdf.text(`Rapor Eden: ${reportData.reporter}`, pageWidth / 2, currentY, { align: 'center' });

    // Add footer to first page
    this.addPageFooter(pdf, 1, 1);

    let pageNumber = 2;

    // PAGE 2 - YÖNETICI ÖZETİ
    pdf.addPage();
    this.addPageHeader(pdf);
    currentY = 70;

    // Section title
    pdf.setFillColor(37, 99, 235);
    pdf.rect(margin, currentY, contentWidth, 12, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text(('YÖNETICI ÖZETİ'), margin + 5, currentY + 8);

    currentY += 20;

    // Content background
    pdf.setFillColor(248, 250, 252);
    const summaryHeight = Math.max(80, Math.min(160, (reportData.managementSummary?.length || 0) / 8));
    pdf.rect(margin, currentY, contentWidth, summaryHeight, 'F');
    
    pdf.setTextColor(0, 0, 0);
    const summary = reportData.managementSummary || ('Yönetici özeti henüz eklenmemiştir.');
    currentY = this.addTextWithWrap(pdf, (summary), margin + 8, currentY + 12, 11, 'normal', contentWidth - 16);

    this.addPageFooter(pdf, pageNumber++, 1);

    // PAGE 3 - BULGULAR (by sections)
    const findingsBySections = {
      1: reportData.findings.filter(f => f.section === 1),
      2: reportData.findings.filter(f => f.section === 2), 
      3: reportData.findings.filter(f => f.section === 3)
    };

    // Section 1
    if (findingsBySections[1].length > 0) {
      pdf.addPage();
      this.addPageHeader(pdf);
      currentY = await this.addSectionContent(pdf, ('BÖLÜM 1 - TASARIM/ÜRETIM HATALARI'), findingsBySections[1], 70, margin, contentWidth, pageHeight);
      this.addPageFooter(pdf, pageNumber++, 1);
    }

    // Section 2  
    if (findingsBySections[2].length > 0) {
      pdf.addPage();
      this.addPageHeader(pdf);
      currentY = await this.addSectionContent(pdf, ('BÖLÜM 2 - GÜVENLİK BULGULARI'), findingsBySections[2], 70, margin, contentWidth, pageHeight);
      this.addPageFooter(pdf, pageNumber++, 1);
    }

    // Section 3
    if (findingsBySections[3].length > 0) {
      pdf.addPage();
      this.addPageHeader(pdf);
      currentY = await this.addSectionContent(pdf, ('BÖLÜM 3 - TAMAMLANAN BULGULAR'), findingsBySections[3], 70, margin, contentWidth, pageHeight);
      this.addPageFooter(pdf, pageNumber++, 1);
    }

    // FINAL PAGE - GENEL DEĞERLENDİRME
    pdf.addPage();
    this.addPageHeader(pdf);
    currentY = 70;

    // Section title
    pdf.setFillColor(37, 99, 235);
    pdf.rect(margin, currentY, contentWidth, 12, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text(('GENEL DEĞERLENDİRME'), margin + 5, currentY + 8);

    currentY += 20;

    // Content
    pdf.setFillColor(248, 250, 252);
    const evalContentHeight = Math.max(120, Math.min(180, (reportData.generalEvaluation?.length || 0) / 6));
    pdf.rect(margin, currentY, contentWidth, evalContentHeight, 'F');
    
    pdf.setTextColor(0, 0, 0);
    const evaluation = reportData.generalEvaluation || ('Genel değerlendirme henüz eklenmemiştir.');
    currentY = this.addTextWithWrap(pdf, (evaluation), margin + 8, currentY + 12, 11, 'normal', contentWidth - 16);

    this.addPageFooter(pdf, pageNumber++, 1);

    console.log('PDF generated successfully');
    
    // Fix total pages count
    const totalPages = pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      
      // Clear and update page number
      pdf.setFillColor(255, 255, 255);
      pdf.rect(pageWidth - 70, pageHeight - 20, 60, 10, 'F');
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 100, 100);
      const pageText = (`Sayfa ${i}/${totalPages}`);
      pdf.text(pageText, pageWidth - 50, pageHeight - 15);
    }
    
    return new Uint8Array(pdf.output('arraybuffer'));
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

    // Process each finding
    for (const finding of findings) {
      currentY = this.checkNewPage(pdf, currentY, 60, margin);

      // Finding title
      pdf.setFillColor(240, 240, 240);
      pdf.rect(margin, currentY, contentWidth, 10, 'F');
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text((finding.title), margin + 5, currentY + 7);

      currentY += 15;

      // Risk level indicator
      const riskColors = {
        high: [220, 53, 69],    // Red
        medium: [255, 193, 7],  // Yellow
        low: [40, 167, 69]      // Green
      };
      
      const [r, g, b] = riskColors[finding.dangerLevel];
      pdf.setFillColor(r, g, b);
      pdf.rect(margin, currentY, 60, 8, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      
      const riskText = finding.dangerLevel === 'high' ? 'YUKSEK' : 
                      finding.dangerLevel === 'medium' ? 'ORTA' : 'DUSUK';
      pdf.text((riskText), margin + 30, currentY + 5, { align: 'center' });

      currentY += 15;

      // Description
      pdf.setTextColor(0, 0, 0);
      pdf.setFont('helvetica', 'normal');
      currentY = this.addTextWithWrap(pdf, (`Aciklama: ${finding.description}`), margin, currentY, 10, 'normal', contentWidth);
      
      currentY += 5;

      // Current situation (if available)
      if (finding.currentSituation) {
        currentY = this.addTextWithWrap(pdf, (`Mevcut Durum: ${finding.currentSituation}`), margin, currentY, 10, 'normal', contentWidth);
        currentY += 5;
      }

      // Recommendation (if available)
      if (finding.recommendation) {
        currentY = this.addTextWithWrap(pdf, (`Oneri: ${finding.recommendation}`), margin, currentY, 10, 'normal', contentWidth);
        currentY += 5;
      }

      // Legal basis (if available)
      if (finding.legalBasis) {
        currentY = this.addTextWithWrap(pdf, (`Yasal Dayanak: ${finding.legalBasis}`), margin, currentY, 10, 'normal', contentWidth);
        currentY += 5;
      }

      // Location (if available)
      if (finding.location) {
        currentY = this.addTextWithWrap(pdf, (`Konum: ${finding.location}`), margin, currentY, 10, 'normal', contentWidth);
        currentY += 5;
      }

      // Add images if available
      if (finding.images && finding.images.length > 0) {
        for (const imageUrl of finding.images.slice(0, 2)) { // Max 2 images per finding
          currentY = this.checkNewPage(pdf, currentY, 70, margin);
          
          try {
            const optimizedImage = await this.optimizeImage(imageUrl);
            if (optimizedImage) {
              pdf.addImage(optimizedImage, 'JPEG', margin, currentY, 80, 60);
              currentY += 65;
            }
          } catch (error) {
            console.warn('Could not add image to PDF:', error);
          }
        }
      }

      currentY += 10; // Space between findings
    }

    return currentY;
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
}