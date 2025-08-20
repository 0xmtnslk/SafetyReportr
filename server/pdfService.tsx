import { jsPDF } from 'jspdf';
import { readFileSync } from 'fs';
import { join } from 'path';
import { addCustomFonts } from './fonts/addCustomFont';

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
    // Initialize custom fonts for jsPDF
    addCustomFonts();
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

  // REMOVED: No need for character replacement with Roboto font!
  // Roboto font properly supports Turkish characters: İ, ı, Ğ, ğ, Ş, ş, Ü, ü, Ö, ö, Ç, ç

  // WHITE TEXT FOR HEADERS ONLY
  private addHeaderText(
    pdf: jsPDF, 
    text: string, 
    x: number, 
    y: number, 
    fontSize: number = 12, 
    fontStyle: string = 'bold'
  ): void {
    pdf.setTextColor(255, 255, 255); // WHITE for headers
    pdf.setFontSize(fontSize);
    pdf.setFont('Roboto', fontStyle);
    pdf.text(text, x, y);
  }

  // BLACK TEXT FOR ALL CONTENT - NO EXCEPTIONS
  private addContentText(
    pdf: jsPDF, 
    text: string, 
    x: number, 
    y: number, 
    fontSize: number = 11, 
    fontStyle: string = 'normal', 
    maxWidth: number = 170
  ): number {
    if (!text) return y;
    
    // ALWAYS BLACK - NEVER CHANGES
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(fontSize);
    pdf.setFont('Roboto', fontStyle);
    
    // Use original text with Turkish characters
    const lines = pdf.splitTextToSize(text, maxWidth);
    const lineHeight = fontSize * 0.6;

    lines.forEach((line: string, index: number) => {
      if (line.trim()) {
        // GUARANTEE BLACK for each line
        pdf.setTextColor(0, 0, 0);
        pdf.text(line, x, y + (index * lineHeight));
      }
    });

    // Return the actual Y position after text
    return y + (lines.length * lineHeight);
  }
  
  // NEW: Calculate required height for text (for dynamic boxes)
  private calculateTextHeight(pdf: jsPDF, text: string, fontSize: number, maxWidth: number): number {
    if (!text) return 0;
    
    pdf.setFontSize(fontSize);
    // Use original text - Roboto supports Turkish characters
    const lines = pdf.splitTextToSize(text, maxWidth);
    const lineHeight = fontSize * 0.6;
    
    return lines.length * lineHeight;
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
    
    // Hospital name - USE HEADER FUNCTION
    this.addHeaderText(pdf, 'İstinye Üniversitesi Topkapı Liv Hastanesi', margin + (this.logoBase64 ? 30 : 0), 27, 16, 'bold');
  }

  // NEW: Enhanced footer with Turkish characters
  private addPageFooter(pdf: jsPDF, pageNumber: number, totalPages: number) {
    const pageHeight = pdf.internal.pageSize.getHeight();
    const pageWidth = pdf.internal.pageSize.getWidth();
    
    pdf.setFontSize(10);
    pdf.setFont('Roboto', 'normal');
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

    const pdf = new jsPDF({
      orientation: 'p',
      unit: 'mm', 
      format: 'a4',
      compress: true,
      precision: 2,
      filters: ['ASCIIHexEncode']
    });
    
    // Enhanced Turkish character setup with Roboto font
    pdf.setFont('Roboto');
    pdf.setR2L(false);
    pdf.setLanguage('tr');
    
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
    pdf.setFont('Roboto', 'bold');
    
    currentY += 30;
    pdf.text('İSG DENETİM RAPORU', pageWidth / 2, currentY, { align: 'center' });
    
    currentY += 20;
    pdf.setFontSize(16);
    pdf.setFont('Roboto', 'normal');
    
    pdf.text(`Rapor No: ${reportData.reportNumber}`, pageWidth / 2, currentY, { align: 'center' });
    
    currentY += 15;
    pdf.text(`Proje Lokasyonu: ${reportData.projectLocation}`, pageWidth / 2, currentY, { align: 'center' });
    
    currentY += 15;
    // Use current date for report generation
    const currentDate = new Date();
    const reportDateStr = currentDate.toLocaleDateString('tr-TR');
    pdf.text(`Rapor Tarihi: ${reportDateStr}`, pageWidth / 2, currentY, { align: 'center' });
    
    currentY += 15;
    pdf.text(`Rapor Eden: ${reportData.reporter}`, pageWidth / 2, currentY, { align: 'center' });

    // Add footer to first page
    this.addPageFooter(pdf, 1, 1);

    let pageNumber = 2;

    // PAGE 2 - YÖNETİCİ ÖZETİ
    pdf.addPage();
    this.addPageHeader(pdf);
    currentY = 70;

    // Section title
    pdf.setFillColor(37, 99, 235);
    pdf.rect(margin, currentY, contentWidth, 12, 'F');
    this.addHeaderText(pdf, 'YÖNETİCİ ÖZETİ', margin + 5, currentY + 8);

    currentY += 20;

    // Content background - FIXED HEIGHT
    const summaryBoxHeight = 120; // Fixed height box
    pdf.setFillColor(248, 250, 252);
    pdf.rect(margin, currentY, contentWidth, summaryBoxHeight, 'F');
    
    pdf.setTextColor(0, 0, 0);
    const summary = reportData.managementSummary || 'Yönetici özeti henüz eklenmemiştir.';
    
    // Use CONTENT text (guaranteed black)
    this.addContentText(
      pdf, 
      summary, 
      margin + 8, 
      currentY + 12, 
      11, 
      'normal', 
      contentWidth - 16
    );
    
    currentY += summaryBoxHeight;

    this.addPageFooter(pdf, pageNumber++, 1);

    // FINDINGS - EACH ON SEPARATE PAGES
    const findingsBySections = {
      1: reportData.findings.filter(f => f.section === 1),
      2: reportData.findings.filter(f => f.section === 2), 
      3: reportData.findings.filter(f => f.section === 3)
    };

    // Section 1 - Tasarim/Imalat/Montaj Hatalari
    if (findingsBySections[1].length > 0) {
      await this.addSectionContent(
        pdf, 
        'BÖLÜM 1 - TASARIM/İMALAT/MONTAJ HATALARI', 
        findingsBySections[1], 
        70, 
        margin, 
        contentWidth, 
        pageHeight,
        1
      );
    }

    // Section 2 - Is Sagligi ve Guvenligi Bulgulari  
    if (findingsBySections[2].length > 0) {
      await this.addSectionContent(
        pdf, 
        'BÖLÜM 2 - İŞ SAĞLIĞI VE GÜVENLİĞİ BULGULARI', 
        findingsBySections[2], 
        70, 
        margin, 
        contentWidth, 
        pageHeight,
        2
      );
    }

    // Section 3 - Tamamlanmis Bulgular (with original section references)
    if (findingsBySections[3].length > 0) {
      await this.addSectionContent(
        pdf, 
        'BÖLÜM 3 - TAMAMLANMIŞ BULGULAR', 
        findingsBySections[3], 
        70, 
        margin, 
        contentWidth, 
        pageHeight,
        3 // Special handling for completed findings
      );
    }

    // FINAL PAGE - GENEL DEĞERLENDİRME
    pdf.addPage();
    this.addPageHeader(pdf);
    currentY = 70;

    // Section title
    pdf.setFillColor(37, 99, 235);
    pdf.rect(margin, currentY, contentWidth, 12, 'F');
    this.addHeaderText(pdf, 'GENEL DEĞERLENDİRME', margin + 5, currentY + 8);

    currentY += 20;

    // Content - FIXED HEIGHT
    const evalBoxHeight = 150; // Fixed height box
    pdf.setFillColor(248, 250, 252);
    pdf.rect(margin, currentY, contentWidth, evalBoxHeight, 'F');
    
    pdf.setTextColor(0, 0, 0);
    const evaluation = reportData.generalEvaluation || 'Genel değerlendirme henüz eklenmemiştir.';
    
    // Use CONTENT text (guaranteed black)
    this.addContentText(
      pdf, 
      evaluation, 
      margin + 8, 
      currentY + 12, 
      11, 
      'normal', 
      contentWidth - 16
    );
    
    currentY += evalBoxHeight;

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
      pdf.setFont('Roboto', 'normal');
      pdf.setTextColor(100, 100, 100);
      const pageText = `Sayfa ${i}/${totalPages}`;
      pdf.text(pageText, pageWidth - 50, pageHeight - 15);
    }
    
    return new Uint8Array(pdf.output('arraybuffer'));
  }

  // IMPROVED: Dynamic content-based boxes with optimized layout
  private async addSectionContent(
    pdf: jsPDF, 
    sectionTitle: string, 
    findings: Finding[], 
    startY: number, 
    margin: number, 
    contentWidth: number, 
    pageHeight: number,
    sectionNumber?: number // For section 3 special handling
  ): Promise<number> {
    let currentY = startY;
    
    // Process each finding on separate pages
    for (const finding of findings) {
      // NEW PAGE for each finding
      pdf.addPage();
      this.addPageHeader(pdf);
      currentY = 50; // Reduced from 70

      // Section title (repeated on each page) - minimal spacing
      pdf.setFillColor(37, 99, 235);
      pdf.rect(margin, currentY, contentWidth, 12, 'F');
      this.addHeaderText(pdf, sectionTitle, margin + 5, currentY + 8);

      currentY += 15; // Reduced from 20
      
      // SPECIAL: For section 3 (Completed findings), show original section
      if (sectionNumber === 3 && finding.section && finding.section !== 3) {
        const originalSectionName = finding.section === 1 ? 
          'Tasarım/İmalat/Montaj Hataları' : 
          'İş Sağlığı ve Güvenliği Bulguları';
        
        pdf.setFillColor(220, 220, 220);
        pdf.rect(margin, currentY, contentWidth, 8, 'F');
        pdf.setTextColor(80, 80, 80);
        pdf.setFontSize(9);
        pdf.setFont('Roboto', 'italic');
        pdf.text(`Orijinal Bölüm: ${originalSectionName}`, margin + 5, currentY + 6);
        currentY += 15;
      }

      // Finding title box
      pdf.setFillColor(240, 240, 240);
      pdf.rect(margin, currentY, contentWidth, 10, 'F');
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(11);
      pdf.setFont('Roboto', 'bold');
      pdf.text(finding.title, margin + 5, currentY + 7);

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
      const riskText = finding.dangerLevel === 'high' ? 'YÜKSEK' : 
                      finding.dangerLevel === 'medium' ? 'ORTA' : 'DÜŞÜK';
      this.addHeaderText(pdf, riskText, margin + 30, currentY + 5, 9, 'bold');

      currentY += 10; // Reduced spacing

      // ULTRA COMPACT LAYOUT - Minimal spacing everywhere
      const boxPadding = 4; // Reduced from 6
      const labelHeight = 8;  // Reduced from 10
      const fieldWidth = contentWidth;
      const spacing = 2; // Reduced from 3

      // SMART LAYOUT - Only show fields that have data
      const halfWidth = (fieldWidth - 5) / 2;
      let maxHeight = 0;
      
      // Check what data we have
      const hasSituation = finding.currentSituation && finding.currentSituation.trim();
      const hasRecommendation = finding.recommendation && finding.recommendation.trim();
      
      // Current situation & Recommendation side by side (only if BOTH exist and have data)
      if (hasSituation && hasRecommendation) {
        const situationHeight = Math.min(this.calculateTextHeight(pdf, finding.currentSituation, 9, halfWidth - 10) + labelHeight + boxPadding, 35);
        const recHeight = Math.min(this.calculateTextHeight(pdf, finding.recommendation, 9, halfWidth - 10) + labelHeight + boxPadding, 35);
        maxHeight = Math.max(situationHeight, recHeight);
        
        // Left: Current situation - DARKER BACKGROUND
        pdf.setFillColor(240, 240, 240);
        pdf.rect(margin, currentY, halfWidth, situationHeight, 'F');
        // Black label
        pdf.setTextColor(0, 0, 0);
        pdf.setFont('Roboto', 'bold');
        pdf.setFontSize(9);
        pdf.text('Mevcut Durum:', margin + 5, currentY + 5);
        // Black content - guaranteed
        this.addContentText(pdf, finding.currentSituation, margin + 5, currentY + 10, 8, 'normal', halfWidth - 10);
        
        // Right: Recommendation - DARKER BACKGROUND
        pdf.setFillColor(240, 240, 240);
        pdf.rect(margin + halfWidth + 5, currentY, halfWidth, recHeight, 'F');
        // Black label
        pdf.setTextColor(0, 0, 0);
        pdf.setFont('Roboto', 'bold');
        pdf.text('Öneri:', margin + halfWidth + 10, currentY + 5);
        // Black content - guaranteed
        this.addContentText(pdf, finding.recommendation, margin + halfWidth + 10, currentY + 10, 8, 'normal', halfWidth - 10);
        
        currentY += maxHeight + spacing;
      } else {
        // Single field if only one exists (full width) - ONLY if it has data
        if (hasSituation) {
          const situationHeight = Math.min(this.calculateTextHeight(pdf, finding.currentSituation, 9, fieldWidth - 12) + labelHeight + boxPadding, 30);
          pdf.setFillColor(240, 240, 240);
          pdf.rect(margin, currentY, fieldWidth, situationHeight, 'F');
          // Black label
          pdf.setTextColor(0, 0, 0);
          pdf.setFont('Roboto', 'bold');
          pdf.setFontSize(9);
          pdf.text('Mevcut Durum:', margin + 5, currentY + 5);
          // Black content - guaranteed
          this.addContentText(pdf, finding.currentSituation, margin + 5, currentY + 10, 8, 'normal', fieldWidth - 10);
          currentY += situationHeight + spacing;
        }
        
        if (hasRecommendation) {
          const recHeight = Math.min(this.calculateTextHeight(pdf, finding.recommendation, 9, fieldWidth - 12) + labelHeight + boxPadding, 30);
          pdf.setFillColor(240, 240, 240);
          pdf.rect(margin, currentY, fieldWidth, recHeight, 'F');
          // Black label
          pdf.setTextColor(0, 0, 0);
          pdf.setFont('Roboto', 'bold');
          pdf.setFontSize(9);
          pdf.text('Öneri:', margin + 5, currentY + 5);
          // Black content - guaranteed
          this.addContentText(pdf, finding.recommendation, margin + 5, currentY + 10, 8, 'normal', fieldWidth - 10);
          currentY += recHeight + spacing;
        }
      }

      // Legal basis only (ONLY if it has data)
      if (finding.legalBasis && finding.legalBasis.trim()) {
        const legalHeight = Math.min(this.calculateTextHeight(pdf, finding.legalBasis, 8, fieldWidth - 12) + labelHeight + boxPadding, 25);
        pdf.setFillColor(240, 240, 240);
        pdf.rect(margin, currentY, fieldWidth, legalHeight, 'F');
        // Black label
        pdf.setTextColor(0, 0, 0);
        pdf.setFont('Roboto', 'bold');
        pdf.setFontSize(9);
        pdf.text('Yasal Dayanak:', margin + 5, currentY + 5);
        // Black content - guaranteed
        this.addContentText(pdf, finding.legalBasis, margin + 5, currentY + 10, 8, 'normal', fieldWidth - 10);
        currentY += legalHeight + spacing;
      }
      
      // Process steps (ONLY if they exist and have data)
      if (finding.processSteps && finding.processSteps.length > 0) {
        const processHeight = Math.min((finding.processSteps.length * 10) + labelHeight + boxPadding, 40);
        pdf.setFillColor(240, 240, 240);
        pdf.rect(margin, currentY, fieldWidth, processHeight, 'F');
        // Black label
        pdf.setTextColor(0, 0, 0);
        pdf.setFont('Roboto', 'bold');
        pdf.setFontSize(9);
        pdf.text('Süreç Adımları:', margin + 5, currentY + 5);
        
        let stepY = currentY + 10;
        finding.processSteps.forEach((step, index) => {
          const stepDate = new Date(step.date).toLocaleDateString('tr-TR');
          const stepText = `${index + 1}. ${stepDate}: ${step.description}`;
          // Use content function for guaranteed black text
          this.addContentText(pdf, stepText, margin + 5, stepY, 7, 'normal', fieldWidth - 10);
          stepY += 8;
        });
        
        currentY += processHeight + spacing;
      }

      // KEEP IMAGES ON SAME PAGE - Ultra compact image management
      if (finding.images && finding.images.length > 0) {
        const imageWidth = 75; // Compact size
        const imageHeight = 50;
        const imageSpacing = 8;
        const maxImages = 2;
        const imagesCount = Math.min(finding.images.length, maxImages);
        
        // Calculate required space for images
        const totalImageHeight = imageHeight + 20; // Title + images + small buffer
        const spaceLeft = pageHeight - 50 - currentY; // Account for footer (reduced from 60)
        
        // ONLY move to new page if absolutely no space (very conservative)
        if (spaceLeft < totalImageHeight && currentY > 200) { // Increased threshold from 150
          console.log('Moving images to new page due to insufficient space');
          // This should rarely happen now
        }
        
        // Add images title - compact
        pdf.setFont('Roboto', 'bold');
        pdf.setFontSize(8);
        pdf.setTextColor(0, 0, 0);
        pdf.text('Fotoğraflar:', margin, currentY);
        currentY += 8; // Reduced from 12
        
        // Images layout - side by side if 2, centered if 1
        const totalWidth = (imagesCount * imageWidth) + ((imagesCount - 1) * imageSpacing);
        const startX = margin + (fieldWidth - totalWidth) / 2;
        
        for (let i = 0; i < imagesCount; i++) {
          const xOffset = startX + (i * (imageWidth + imageSpacing));
          const yOffset = currentY;
          
          try {
            const optimizedImage = await this.optimizeImage(finding.images[i]);
            if (optimizedImage) {
              pdf.addImage(optimizedImage, 'JPEG', xOffset, yOffset, imageWidth, imageHeight);
            }
          } catch (error) {
            console.warn('Could not add image to PDF:', error);
          }
        }
        
        currentY += imageHeight + 5; // Reduced buffer
      }
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