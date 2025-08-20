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

  // IMPROVED: Dynamic text wrapper that returns actual height used
  private addTextWithWrap(
    pdf: jsPDF, 
    text: string, 
    x: number, 
    y: number, 
    fontSize: number = 11, 
    fontStyle: string = 'normal', 
    maxWidth: number = 170
  ): number {
    if (!text) return y;
    
    pdf.setFontSize(fontSize);
    pdf.setFont('Roboto', fontStyle);
    
    // Use original text with Turkish characters - Roboto supports them!
    const lines = pdf.splitTextToSize(text, maxWidth);
    
    const lineHeight = fontSize * 0.6; // Better line spacing

    lines.forEach((line: string, index: number) => {
      if (line.trim()) {
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
    
    // Hospital name with proper Turkish encoding
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(16);
    pdf.setFont('Roboto', 'bold');
    pdf.text('İstinye Üniversitesi Topkapı Liv Hastanesi', margin + (this.logoBase64 ? 30 : 0), 27);
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
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(12);
    pdf.setFont('Roboto', 'bold');
    pdf.text('YÖNETİCİ ÖZETİ', margin + 5, currentY + 8);

    currentY += 20;

    // Content background - FIXED HEIGHT
    const summaryBoxHeight = 120; // Fixed height box
    pdf.setFillColor(248, 250, 252);
    pdf.rect(margin, currentY, contentWidth, summaryBoxHeight, 'F');
    
    pdf.setTextColor(0, 0, 0);
    const summary = reportData.managementSummary || 'Yönetici özeti henüz eklenmemiştir.';
    
    // Use text wrapping for summary
    this.addTextWithWrap(
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
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(12);
    pdf.setFont('Roboto', 'bold');
    pdf.text('GENEL DEĞERLENDİRME', margin + 5, currentY + 8);

    currentY += 20;

    // Content - FIXED HEIGHT
    const evalBoxHeight = 150; // Fixed height box
    pdf.setFillColor(248, 250, 252);
    pdf.rect(margin, currentY, contentWidth, evalBoxHeight, 'F');
    
    pdf.setTextColor(0, 0, 0);
    const evaluation = reportData.generalEvaluation || 'Genel değerlendirme henüz eklenmemiştir.';
    
    // Use text wrapping for evaluation
    this.addTextWithWrap(
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
      currentY = 70;

      // Section title (repeated on each page)
      pdf.setFillColor(37, 99, 235);
      pdf.rect(margin, currentY, contentWidth, 12, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(12);
      pdf.setFont('Roboto', 'bold');
      pdf.text(sectionTitle, margin + 5, currentY + 8);

      currentY += 20;
      
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
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(9);
      pdf.setFont('Roboto', 'bold');
      
      const riskText = finding.dangerLevel === 'high' ? 'YÜKSEK' : 
                      finding.dangerLevel === 'medium' ? 'ORTA' : 'DÜŞÜK';
      pdf.text(riskText, margin + 30, currentY + 5, { align: 'center' });

      currentY += 15;

      // COMPACT LAYOUT - No Description section (removed per user request)
      const boxPadding = 6;
      const labelHeight = 10;
      const fieldWidth = contentWidth;
      const spacing = 3;

      // Two-column layout: Current situation & Recommendation side by side  
      const halfWidth = (fieldWidth - 5) / 2;
      let maxHeight = 0;
      
      // Current situation & Recommendation side by side (if both exist)
      if (finding.currentSituation && finding.recommendation) {
        const situationHeight = Math.min(this.calculateTextHeight(pdf, finding.currentSituation, 9, halfWidth - 10) + labelHeight + boxPadding, 40);
        const recHeight = Math.min(this.calculateTextHeight(pdf, finding.recommendation, 9, halfWidth - 10) + labelHeight + boxPadding, 40);
        maxHeight = Math.max(situationHeight, recHeight);
        
        // Left: Current situation
        pdf.setFillColor(250, 250, 250);
        pdf.rect(margin, currentY, halfWidth, situationHeight, 'F');
        pdf.setFont('Roboto', 'bold');
        pdf.setFontSize(9);
        pdf.text('Mevcut Durum:', margin + 5, currentY + 6);
        pdf.setFont('Roboto', 'normal');
        this.addTextWithWrap(pdf, finding.currentSituation, margin + 5, currentY + 12, 9, 'normal', halfWidth - 10);
        
        // Right: Recommendation
        pdf.setFillColor(250, 250, 250);
        pdf.rect(margin + halfWidth + 5, currentY, halfWidth, recHeight, 'F');
        pdf.setFont('Roboto', 'bold');
        pdf.text('Öneri:', margin + halfWidth + 10, currentY + 6);
        pdf.setFont('Roboto', 'normal');
        this.addTextWithWrap(pdf, finding.recommendation, margin + halfWidth + 10, currentY + 12, 9, 'normal', halfWidth - 10);
        
        currentY += maxHeight + spacing;
      } else {
        // Single field if only one exists (full width)
        if (finding.currentSituation) {
          const situationHeight = Math.min(this.calculateTextHeight(pdf, finding.currentSituation, 9, fieldWidth - 16) + labelHeight + boxPadding, 35);
          pdf.setFillColor(250, 250, 250);
          pdf.rect(margin, currentY, fieldWidth, situationHeight, 'F');
          pdf.setFont('Roboto', 'bold');
          pdf.setFontSize(9);
          pdf.text('Mevcut Durum:', margin + 5, currentY + 6);
          pdf.setFont('Roboto', 'normal');
          this.addTextWithWrap(pdf, finding.currentSituation, margin + 5, currentY + 12, 9, 'normal', fieldWidth - 10);
          currentY += situationHeight + spacing;
        }
        
        if (finding.recommendation) {
          const recHeight = Math.min(this.calculateTextHeight(pdf, finding.recommendation, 9, fieldWidth - 16) + labelHeight + boxPadding, 35);
          pdf.setFillColor(250, 250, 250);
          pdf.rect(margin, currentY, fieldWidth, recHeight, 'F');
          pdf.setFont('Roboto', 'bold');
          pdf.setFontSize(9);
          pdf.text('Öneri:', margin + 5, currentY + 6);
          pdf.setFont('Roboto', 'normal');
          this.addTextWithWrap(pdf, finding.recommendation, margin + 5, currentY + 12, 9, 'normal', fieldWidth - 10);
          currentY += recHeight + spacing;
        }
      }

      // Legal basis only (Location removed per user request)
      if (finding.legalBasis) {
        const legalHeight = Math.min(this.calculateTextHeight(pdf, finding.legalBasis, 9, fieldWidth - 16) + labelHeight + boxPadding, 30);
        pdf.setFillColor(250, 250, 250);
        pdf.rect(margin, currentY, fieldWidth, legalHeight, 'F');
        pdf.setFont('Roboto', 'bold');
        pdf.setFontSize(9);
        pdf.text('Yasal Dayanak:', margin + 5, currentY + 6);
        pdf.setFont('Roboto', 'normal');
        this.addTextWithWrap(pdf, finding.legalBasis, margin + 5, currentY + 12, 8, 'normal', fieldWidth - 10);
        currentY += legalHeight + spacing;
      }
      
      // Process steps (NEW - requested by user)
      if (finding.processSteps && finding.processSteps.length > 0) {
        const processHeight = Math.min((finding.processSteps.length * 12) + labelHeight + boxPadding, 50);
        pdf.setFillColor(250, 250, 250);
        pdf.rect(margin, currentY, fieldWidth, processHeight, 'F');
        pdf.setFont('Roboto', 'bold');
        pdf.setFontSize(9);
        pdf.text('Süreç Adımları:', margin + 5, currentY + 6);
        pdf.setFont('Roboto', 'normal');
        
        let stepY = currentY + 12;
        finding.processSteps.forEach((step, index) => {
          const stepDate = new Date(step.date).toLocaleDateString('tr-TR');
          pdf.setFontSize(8);
          pdf.text(`${index + 1}. ${stepDate}: ${step.description}`, margin + 5, stepY);
          stepY += 10;
        });
        
        currentY += processHeight + spacing;
      }

      // FIXED Images - Always show images, better space management
      if (finding.images && finding.images.length > 0) {
        const imageWidth = 80; // Slightly larger
        const imageHeight = 55;
        const imageSpacing = 10;
        const maxImages = 2;
        const imagesCount = Math.min(finding.images.length, maxImages);
        
        // Calculate required space
        const totalImageHeight = imageHeight + 15; // Buffer for images
        const spaceLeft = pageHeight - 60 - currentY; // Account for footer
        
        // If not enough space, continue anyway but check space more carefully
        if (spaceLeft < totalImageHeight && currentY > 150) {
          // Add a new page for images if we're too far down
          pdf.addPage();
          this.addPageHeader(pdf);
          currentY = 70;
          
          // Add section title again
          pdf.setFillColor(37, 99, 235);
          pdf.rect(margin, currentY, contentWidth, 12, 'F');
          pdf.setTextColor(255, 255, 255);
          pdf.setFontSize(12);
          pdf.setFont('Roboto', 'bold');
          pdf.text(sectionTitle, margin + 5, currentY + 8);
          currentY += 20;
          
          // Finding title again
          pdf.setFillColor(240, 240, 240);
          pdf.rect(margin, currentY, contentWidth, 10, 'F');
          pdf.setTextColor(0, 0, 0);
          pdf.setFontSize(10);
          pdf.setFont('Roboto', 'bold');
          pdf.text(`${finding.title} (Fotoğraflar)`, margin + 5, currentY + 7);
          currentY += 15;
        }
        
        // Add images title
        pdf.setFont('Roboto', 'bold');
        pdf.setFontSize(9);
        pdf.setTextColor(0, 0, 0);
        pdf.text('Fotoğraflar:', margin, currentY);
        currentY += 12;
        
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
        
        currentY += imageHeight + 10;
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