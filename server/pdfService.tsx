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

  // NEW: Robust Turkish character support using Unicode escape sequences
  private fixTurkishText(text: string): string {
    if (!text) return '';
    
    // Convert to proper Unicode and then to jsPDF compatible format
    return text
      .replace(/İ/g, '\u0130')  // Turkish İ
      .replace(/ı/g, '\u0131')  // Turkish ı 
      .replace(/Ğ/g, '\u011E')  // Turkish Ğ
      .replace(/ğ/g, '\u011F')  // Turkish ğ
      .replace(/Ş/g, '\u015E')  // Turkish Ş
      .replace(/ş/g, '\u015F')  // Turkish ş
      .replace(/Ü/g, '\u00DC')  // Turkish Ü
      .replace(/ü/g, '\u00FC')  // Turkish ü
      .replace(/Ö/g, '\u00D6')  // Turkish Ö
      .replace(/ö/g, '\u00F6')  // Turkish ö
      .replace(/Ç/g, '\u00C7')  // Turkish Ç
      .replace(/ç/g, '\u00E7');  // Turkish ç
  }

  // Enhanced text wrapper with Turkish support
  private addTextWithWrap(pdf: jsPDF, text: string, x: number, y: number, fontSize: number = 11, fontStyle: string = 'normal', maxWidth: number = 170): number {
    if (!text) return y;
    
    pdf.setFontSize(fontSize);
    pdf.setFont('helvetica', fontStyle);
    
    // Process Turkish characters
    const processedText = this.fixTurkishText(text);
    const lines = pdf.splitTextToSize(processedText, maxWidth);
    
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
    
    // Use fixed Turkish text
    const hospitalName = this.fixTurkishText('İstinye Üniversitesi Topkapı Liv Hastanesi');
    pdf.text(hospitalName, margin + (this.logoBase64 ? 30 : 0), 27);
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
    const footerText = this.fixTurkishText('İstinye Üniversitesi Topkapı Liv Hastanesi İSG Raporu');
    const pageText = this.fixTurkishText(`Sayfa ${pageNumber}/${totalPages}`);
    
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
    const reportTitle = this.fixTurkishText('İSG DENETİM RAPORU');
    pdf.text(reportTitle, pageWidth / 2, currentY, { align: 'center' });
    
    currentY += 20;
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'normal');
    
    const reportNumber = this.fixTurkishText(`Rapor No: ${reportData.reportNumber}`);
    pdf.text(reportNumber, pageWidth / 2, currentY, { align: 'center' });
    
    currentY += 15;
    const projectLocation = this.fixTurkishText(`Proje Lokasyonu: ${reportData.projectLocation}`);
    pdf.text(projectLocation, pageWidth / 2, currentY, { align: 'center' });
    
    currentY += 15;
    const reportDate = this.fixTurkishText(`Rapor Tarihi: ${new Date(reportData.reportDate).toLocaleDateString('tr-TR')}`);
    pdf.text(reportDate, pageWidth / 2, currentY, { align: 'center' });
    
    currentY += 15;
    const reporter = this.fixTurkishText(`Rapor Eden: ${reportData.reporter}`);
    pdf.text(reporter, pageWidth / 2, currentY, { align: 'center' });

    // Add footer to first page
    this.addPageFooter(pdf, 1, 1);

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
      const pageText = this.fixTurkishText(`Sayfa ${i}/${totalPages}`);
      pdf.text(pageText, pageWidth - 50, pageHeight - 15);
    }
    
    return new Uint8Array(pdf.output('arraybuffer'));
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