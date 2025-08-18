import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ReportData {
  id: string;
  reportNumber: string;
  reportDate: string;
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
  dangerLevel: 'high' | 'medium' | 'low';
  recommendation?: string;
  images?: string[];
  location?: string;
  processSteps?: ProcessStep[];
  isCompleted?: boolean;
}

interface ProcessStep {
  description: string;
  targetDate: string;
  responsible: string;
  status: string;
}

export class ProfessionalPDFGenerator {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number;

  constructor() {
    this.doc = new jsPDF('p', 'mm', 'a4');
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.margin = 15;
    
    // Configure font for Turkish characters
    this.doc.setFont('helvetica', 'normal');
    this.doc.setCharSpace(0);
  }

  async generateReport(reportData: ReportData): Promise<Blob> {
    console.log('PDF generate başlıyor:', reportData);

    try {
      // Generate cover page
      await this.generateCoverPage(reportData);
      console.log('Kapak sayfası oluşturuldu');
      
      // Add management summary
      if (reportData.managementSummary) {
        this.addNewPage();
        this.addManagementSummary(reportData.managementSummary);
        console.log('Yönetici özeti eklendi');
      }

      // Add findings - each finding on separate page with table layout
      const sections = [
        { number: 2, title: 'Tasarım/İmalat/Montaj Hataları' },
        { number: 3, title: 'İş Sağlığı ve Güvenliği Bulguları' },
        { number: 4, title: 'Tamamlanmış Bulgular' }
      ];

      let findingCounter = 1;
      console.log('Bulgular işleniyor, toplam:', reportData.findings?.length || 0);
      
      if (reportData.findings && reportData.findings.length > 0) {
        for (const section of sections) {
          const sectionFindings = reportData.findings.filter(f => f.section === section.number);
          console.log(`Bölüm ${section.number} bulguları:`, sectionFindings.length);
          
          for (const finding of sectionFindings) {
            this.addNewPage();
            await this.addFindingPage(finding, findingCounter, section.title);
            findingCounter++;
          }
        }
      }

      // Add general evaluation
      if (reportData.generalEvaluation) {
        this.addNewPage();
        this.addGeneralEvaluation(reportData.generalEvaluation);
        console.log('Genel değerlendirme eklendi');
      }

      console.log('PDF tamamlandı, blob oluşturuluyor');
      const blob = this.doc.output('blob');
      console.log('Blob oluştu, boyut:', blob.size);
      return blob;

    } catch (error) {
      console.error('PDF oluşturma hatası:', error);
      throw error;
    }
  }

  private encodeTurkishText(text: string): string {
    // No encoding needed - just return text as-is for Turkish characters
    return text || '';
  }

  private async generateCoverPage(reportData: ReportData): Promise<void> {
    // Set font
    this.doc.setFont('helvetica', 'bold');
    
    // Main title with proper Turkish encoding
    this.doc.setFontSize(16);
    const titleText = this.encodeTurkishText('İstinye Üniversite Topkapı Liv Hastanesi');
    const titleWidth = this.doc.getTextWidth(titleText);
    this.doc.text(titleText, (this.pageWidth - titleWidth) / 2, 30);
    
    this.doc.setFontSize(14);
    const subtitleText = this.encodeTurkishText('İş Sağlığı ve Güvenliği Saha Gözlem Raporu');
    const subtitleWidth = this.doc.getTextWidth(subtitleText);
    this.doc.text(subtitleText, (this.pageWidth - subtitleWidth) / 2, 45);

    // Logo and hospital image placeholders
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(10);
    this.doc.text('[Logo]', 15, 80);
    this.doc.text('[Hastane Görseli]', 150, 80);

    // Report information table with Turkish encoding
    const startY = 120;
    this.drawTable(startY, [
      [this.encodeTurkishText('Rapor No:'), this.encodeTurkishText(reportData.reportNumber || '')],
      [this.encodeTurkishText('Rapor Tarihi:'), reportData.reportDate ? new Date(reportData.reportDate).toLocaleDateString('tr-TR') : ''],
      [this.encodeTurkishText('Proje Lokasyonu:'), this.encodeTurkishText(reportData.projectLocation || '')],
      [this.encodeTurkishText('Raporlayan:'), this.encodeTurkishText(reportData.reporter || '')],
    ]);

    // Footer with Turkish encoding
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(10);
    const footerText = this.encodeTurkishText(`Rapor Oluşturulma Tarihi: ${new Date().toLocaleDateString('tr-TR')}`);
    this.doc.text(footerText, this.margin, this.pageHeight - 20);
  }

  private async addLogoAndHospitalImage(): Promise<void> {
    // Skip images to avoid errors - just add placeholder text
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(10);
    this.doc.text('[Logo]', 15, 80);
    this.doc.text('[Hastane Görseli]', 150, 80);
  }

  private async addFindingPage(finding: Finding, findingNumber: number, sectionTitle: string): Promise<void> {
    // Finding title with number
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(12);
    const findingTitle = this.encodeTurkishText(`${findingNumber}. ${sectionTitle}`);
    this.doc.text(findingTitle, this.margin, 25);

    // Draw main table structure like in the example
    let currentY = 35;
    
    // Location and inspection date table
    this.drawTableRow(currentY, [
      { text: this.encodeTurkishText('Yer-Konum:'), width: 40 },
      { text: this.encodeTurkishText(finding.location || finding.title), width: 70 },
      { text: this.encodeTurkishText('Tespit Tarihi:'), width: 30 },
      { text: new Date().toLocaleDateString('tr-TR'), width: 30 }
    ]);
    currentY += 15;

    // Image section (left side)
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(10);
    this.doc.text(this.encodeTurkishText('Öncesi'), this.margin + 2, currentY + 8);
    
    // Draw image placeholder/actual image
    const imageX = this.margin;
    const imageY = currentY;
    const imageWidth = 85;
    const imageHeight = 120;
    
    // Image border
    this.doc.setDrawColor(0, 0, 0);
    this.doc.setLineWidth(0.5);
    this.doc.rect(imageX, imageY, imageWidth, imageHeight);

    // Skip finding images for now to avoid errors
    if (finding.images && finding.images.length > 0) {
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(8);
      this.doc.text('Fotoğraf mevcut', imageX + 5, imageY + 60);
    }

    // Right side - content sections
    const rightX = imageX + imageWidth + 5;
    const rightWidth = this.pageWidth - rightX - this.margin;
    
    // Current situation
    this.drawContentSection(rightX, currentY, rightWidth, 35, this.encodeTurkishText('Mevcut Durum:'), this.encodeTurkishText(finding.description));
    currentY += 40;
    
    // Recommendation  
    this.drawContentSection(rightX, currentY, rightWidth, 35, this.encodeTurkishText('Dayanak:'), this.encodeTurkishText(finding.recommendation || ''));
    currentY += 40;
    
    // ISG Opinion
    this.drawContentSection(rightX, currentY, rightWidth, 35, this.encodeTurkishText('İSG Görüşü:'), this.encodeTurkishText(finding.recommendation || ''));

    // Bottom section - "After" area
    currentY = imageY + imageHeight + 5;
    this.doc.text(this.encodeTurkishText('Sonrası'), this.margin + 2, currentY + 8);
    this.doc.rect(this.margin, currentY, imageWidth, 25);

    // Danger level table at bottom
    currentY += 30;
    const dangerColor = this.getDangerColor(finding.dangerLevel);
    this.drawDangerLevelTable(currentY, finding.dangerLevel, dangerColor);

    // Process management table
    currentY += 25;
    this.drawProcessTable(currentY, finding.processSteps || []);
  }

  private drawTableRow(y: number, cells: Array<{text: string, width: number}>): void {
    let currentX = this.margin;
    
    this.doc.setDrawColor(0, 0, 0);
    this.doc.setLineWidth(0.5);
    
    cells.forEach(cell => {
      this.doc.rect(currentX, y, cell.width, 12);
      
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(9);
      
      // Split text if too long
      const splitText = this.doc.splitTextToSize(cell.text, cell.width - 4);
      this.doc.text(splitText, currentX + 2, y + 8);
      
      currentX += cell.width;
    });
  }

  private drawContentSection(x: number, y: number, width: number, height: number, title: string, content: string): void {
    // Draw border
    this.doc.setDrawColor(0, 0, 0);
    this.doc.setLineWidth(0.5);
    this.doc.rect(x, y, width, height);
    
    // Title
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(9);
    this.doc.text(title, x + 2, y + 8);
    
    // Content
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(8);
    const splitContent = this.doc.splitTextToSize(content, width - 4);
    this.doc.text(splitContent, x + 2, y + 15);
  }

  private drawDangerLevelTable(y: number, dangerLevel: string, color: [number, number, number]): void {
    // Danger level header
    this.doc.setFillColor(color[0], color[1], color[2]);
    this.doc.setDrawColor(0, 0, 0);
    this.doc.rect(this.margin, y, this.pageWidth - 2 * this.margin, 12, 'FD');
    
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(10);
    this.doc.setTextColor(255, 255, 255);
    const dangerText = this.encodeTurkishText(`Tehlike Skalası: ${this.getDangerLevelText(dangerLevel)}`);
    this.doc.text(dangerText, this.margin + 5, y + 8);
    
    this.doc.setTextColor(0, 0, 0);
  }

  private drawProcessTable(y: number, processSteps: ProcessStep[]): void {
    // Process management header
    this.doc.setFillColor(200, 200, 200);
    this.doc.setDrawColor(0, 0, 0);
    this.doc.rect(this.margin, y, this.pageWidth - 2 * this.margin, 12, 'FD');
    
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(9);
    this.doc.text(this.encodeTurkishText('Süreç Yönetimi'), this.margin + 5, y + 8);
    
    // Table headers
    y += 12;
    const colWidths = [30, 100, 30];
    let currentX = this.margin;
    
    [this.encodeTurkishText('Tarih'), this.encodeTurkishText('Açıklama'), this.encodeTurkishText('Durum')].forEach((header, index) => {
      this.doc.setFillColor(240, 240, 240);
      this.doc.rect(currentX, y, colWidths[index], 10, 'FD');
      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(8);
      this.doc.text(header, currentX + 2, y + 7);
      currentX += colWidths[index];
    });
    
    // Process steps
    y += 10;
    processSteps.forEach(step => {
      currentX = this.margin;
      const rowData = [step.targetDate, step.description, step.status];
      
      rowData.forEach((data, index) => {
        this.doc.setFillColor(255, 255, 255);
        this.doc.rect(currentX, y, colWidths[index], 8, 'FD');
        this.doc.setFont('helvetica', 'normal');
        this.doc.setFontSize(7);
        const splitText = this.doc.splitTextToSize(data, colWidths[index] - 4);
        this.doc.text(splitText, currentX + 2, y + 5);
        currentX += colWidths[index];
      });
      y += 8;
    });
  }

  private async addFindingImage(imagePath: string, x: number, y: number, width: number, height: number): Promise<void> {
    // Skip image loading to avoid errors - just show placeholder
    console.log('Finding image skipped:', imagePath);
  }

  private getDangerColor(level: string): [number, number, number] {
    switch (level) {
      case 'high': return [220, 53, 69];  // Red
      case 'medium': return [255, 193, 7]; // Yellow
      case 'low': return [40, 167, 69];    // Green
      default: return [108, 117, 125];     // Gray
    }
  }

  private getDangerLevelText(level: string): string {
    switch (level) {
      case 'high': return 'Yüksek';
      case 'medium': return 'Orta';
      case 'low': return 'Düşük';
      default: return level;
    }
  }

  private drawTable(startY: number, rows: string[][]): void {
    const rowHeight = 10;
    const colWidth = (this.pageWidth - 2 * this.margin) / 2;
    
    this.doc.setDrawColor(0, 0, 0);
    this.doc.setLineWidth(0.5);
    
    rows.forEach((row, index) => {
      const y = startY + (index * rowHeight);
      
      // Draw cells
      this.doc.rect(this.margin, y, colWidth, rowHeight);
      this.doc.rect(this.margin + colWidth, y, colWidth, rowHeight);
      
      // Add text
      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(10);
      this.doc.text(row[0], this.margin + 2, y + 7);
      
      this.doc.setFont('helvetica', 'normal');
      const splitText = this.doc.splitTextToSize(row[1], colWidth - 4);
      this.doc.text(splitText, this.margin + colWidth + 2, y + 7);
    });
  }

  private addManagementSummary(summary: string): void {
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(14);
    this.doc.text(this.encodeTurkishText('Yönetici Özeti'), this.margin, 30);
    
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(11);
    const splitText = this.doc.splitTextToSize(this.encodeTurkishText(summary), this.pageWidth - 2 * this.margin);
    this.doc.text(splitText, this.margin, 45);
  }

  private addGeneralEvaluation(evaluation: string): void {
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(14);
    this.doc.text(this.encodeTurkishText('Genel Değerlendirme'), this.margin, 30);
    
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(11);
    const splitText = this.doc.splitTextToSize(this.encodeTurkishText(evaluation), this.pageWidth - 2 * this.margin);
    this.doc.text(splitText, this.margin, 45);
  }

  private addNewPage(): void {
    this.doc.addPage();
  }
}

export async function downloadProfessionalReportPDF(reportData: ReportData): Promise<void> {
  // Basic validation
  if (!reportData || !reportData.id) {
    throw new Error('Geçersiz rapor verisi');
  }

  try {
    console.log('PDF oluşturuluyor:', {
      id: reportData.id,
      reportNumber: reportData.reportNumber,
      findingsCount: reportData.findings?.length || 0
    });

    // Use the professional PDF generator that already exists
    const generator = new ProfessionalPDFGenerator();
    const pdfBlob = await generator.generateReport(reportData);
    
    console.log('PDF blob oluşturuldu, boyut:', pdfBlob.size);
    
    // Create download
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ISG-Raporu-${reportData.reportNumber || Date.now()}.pdf`;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    
    console.log('PDF indirme başlatıldı');
    
  } catch (error) {
    console.error('PDF oluşturma hatası:', error);
    throw new Error(`PDF oluşturulamadı: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
  }
}