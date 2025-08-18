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
  }

  async generateReport(reportData: ReportData): Promise<Blob> {
    // Generate cover page
    await this.generateCoverPage(reportData);
    
    // Add management summary
    if (reportData.managementSummary) {
      this.addNewPage();
      this.addManagementSummary(reportData.managementSummary);
    }

    // Add findings - each finding on separate page with table layout
    const sections = [
      { number: 2, title: 'Tasarım/İmalat/Montaj Hataları' },
      { number: 3, title: 'İş Sağlığı ve Güvenliği Bulguları' },
      { number: 4, title: 'Tamamlanmış Bulgular' }
    ];

    let findingCounter = 1;
    for (const section of sections) {
      const sectionFindings = reportData.findings.filter(f => f.section === section.number);
      
      for (const finding of sectionFindings) {
        this.addNewPage();
        await this.addFindingPage(finding, findingCounter, section.title);
        findingCounter++;
      }
    }

    // Add general evaluation
    if (reportData.generalEvaluation) {
      this.addNewPage();
      this.addGeneralEvaluation(reportData.generalEvaluation);
    }

    return new Blob([this.doc.output('blob')], { type: 'application/pdf' });
  }

  private async generateCoverPage(reportData: ReportData): Promise<void> {
    // Set font
    this.doc.setFont('helvetica', 'bold');
    
    // Main title
    this.doc.setFontSize(16);
    const titleText = 'İstinye Üniversite Topkapı Liv Hastanesi';
    const titleWidth = this.doc.getTextWidth(titleText);
    this.doc.text(titleText, (this.pageWidth - titleWidth) / 2, 30);
    
    this.doc.setFontSize(14);
    const subtitleText = 'İş Sağlığı ve Güvenliği Saha Gözlem Raporu';
    const subtitleWidth = this.doc.getTextWidth(subtitleText);
    this.doc.text(subtitleText, (this.pageWidth - subtitleWidth) / 2, 45);

    // Add hospital image and logo
    try {
      await this.addLogoAndHospitalImage();
    } catch (error) {
      console.warn('Could not load cover images:', error);
    }

    // Report information table
    const startY = 120;
    this.drawTable(startY, [
      ['Rapor No:', reportData.reportNumber || ''],
      ['Rapor Tarihi:', reportData.reportDate ? new Date(reportData.reportDate).toLocaleDateString('tr-TR') : ''],
      ['Proje Lokasyonu:', reportData.projectLocation || ''],
      ['Raporlayan:', reportData.reporter || ''],
    ]);

    // Footer
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(10);
    const footerText = `Rapor Oluşturulma Tarihi: ${new Date().toLocaleDateString('tr-TR')}`;
    this.doc.text(footerText, this.margin, this.pageHeight - 20);
  }

  private async addLogoAndHospitalImage(): Promise<void> {
    try {
      // Load and add MLPCARE logo (top left)
      const logoResponse = await fetch('/attached_assets/logo_1755544106935.jpg');
      if (logoResponse.ok) {
        const logoBlob = await logoResponse.blob();
        const logoCanvas = document.createElement('canvas');
        const logoCtx = logoCanvas.getContext('2d');
        const logoImg = new Image();
        
        await new Promise((resolve) => {
          logoImg.onload = () => {
            logoCanvas.width = logoImg.width;
            logoCanvas.height = logoImg.height;
            logoCtx?.drawImage(logoImg, 0, 0);
            resolve(null);
          };
          logoImg.src = URL.createObjectURL(logoBlob);
        });

        const logoDataUrl = logoCanvas.toDataURL('image/jpeg', 0.8);
        this.doc.addImage(logoDataUrl, 'JPEG', 15, 60, 40, 20);
      }

      // Load and add hospital image (top right)
      const hospitalResponse = await fetch('/attached_assets/image_1755544248685.png');
      if (hospitalResponse.ok) {
        const hospitalBlob = await hospitalResponse.blob();
        const hospitalCanvas = document.createElement('canvas');
        const hospitalCtx = hospitalCanvas.getContext('2d');
        const hospitalImg = new Image();
        
        await new Promise((resolve) => {
          hospitalImg.onload = () => {
            hospitalCanvas.width = hospitalImg.width;
            hospitalCanvas.height = hospitalImg.height;
            hospitalCtx?.drawImage(hospitalImg, 0, 0);
            resolve(null);
          };
          hospitalImg.src = URL.createObjectURL(hospitalBlob);
        });

        const hospitalDataUrl = hospitalCanvas.toDataURL('image/png', 0.8);
        this.doc.addImage(hospitalDataUrl, 'PNG', this.pageWidth - 55, 60, 40, 20);
      }
    } catch (error) {
      console.warn('Could not load cover page images:', error);
    }
  }

  private async addFindingPage(finding: Finding, findingNumber: number, sectionTitle: string): Promise<void> {
    // Finding title with number
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(12);
    const findingTitle = `${findingNumber}. ${sectionTitle}`;
    this.doc.text(findingTitle, this.margin, 25);

    // Draw main table structure like in the example
    let currentY = 35;
    
    // Location and inspection date table
    this.drawTableRow(currentY, [
      { text: 'Yer-Konum:', width: 40 },
      { text: finding.location || finding.title, width: 70 },
      { text: 'Tespit Tarihi:', width: 30 },
      { text: new Date().toLocaleDateString('tr-TR'), width: 30 }
    ]);
    currentY += 15;

    // Image section (left side)
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(10);
    this.doc.text('Öncesi', this.margin + 2, currentY + 8);
    
    // Draw image placeholder/actual image
    const imageX = this.margin;
    const imageY = currentY;
    const imageWidth = 85;
    const imageHeight = 120;
    
    // Image border
    this.doc.setDrawColor(0, 0, 0);
    this.doc.setLineWidth(0.5);
    this.doc.rect(imageX, imageY, imageWidth, imageHeight);

    // Add actual image if available
    if (finding.images && finding.images.length > 0) {
      try {
        await this.addFindingImage(finding.images[0], imageX + 2, imageY + 12, imageWidth - 4, imageHeight - 15);
      } catch (error) {
        console.warn('Could not load finding image:', error);
      }
    }

    // Right side - content sections
    const rightX = imageX + imageWidth + 5;
    const rightWidth = this.pageWidth - rightX - this.margin;
    
    // Current situation
    this.drawContentSection(rightX, currentY, rightWidth, 35, 'Mevcut Durum:', finding.description);
    currentY += 40;
    
    // Recommendation  
    this.drawContentSection(rightX, currentY, rightWidth, 35, 'Dayanak:', finding.recommendation || '');
    currentY += 40;
    
    // ISG Opinion
    this.drawContentSection(rightX, currentY, rightWidth, 35, 'İSG Görüşü:', finding.recommendation || '');

    // Bottom section - "After" area
    currentY = imageY + imageHeight + 5;
    this.doc.text('Sonrası', this.margin + 2, currentY + 8);
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
    const dangerText = `Tehlike Skalası: ${this.getDangerLevelText(dangerLevel)}`;
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
    this.doc.text('Süreç Yönetimi', this.margin + 5, y + 8);
    
    // Table headers
    y += 12;
    const colWidths = [30, 100, 30];
    let currentX = this.margin;
    
    ['Tarih', 'Açıklama', 'Durum'].forEach((header, index) => {
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
    try {
      const response = await fetch(imagePath);
      if (!response.ok) return;
      
      const blob = await response.blob();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      await new Promise((resolve, reject) => {
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx?.drawImage(img, 0, 0);
          resolve(null);
        };
        img.onerror = reject;
        img.src = URL.createObjectURL(blob);
      });

      const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
      this.doc.addImage(dataUrl, 'JPEG', x, y, width, height);
    } catch (error) {
      console.warn('Could not add finding image:', error);
    }
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
    this.doc.text('Yönetici Özeti', this.margin, 30);
    
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(11);
    const splitText = this.doc.splitTextToSize(summary, this.pageWidth - 2 * this.margin);
    this.doc.text(splitText, this.margin, 45);
  }

  private addGeneralEvaluation(evaluation: string): void {
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(14);
    this.doc.text('Genel Değerlendirme', this.margin, 30);
    
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(11);
    const splitText = this.doc.splitTextToSize(evaluation, this.pageWidth - 2 * this.margin);
    this.doc.text(splitText, this.margin, 45);
  }

  private addNewPage(): void {
    this.doc.addPage();
  }
}

export async function downloadProfessionalReportPDF(reportData: ReportData): Promise<void> {
  const generator = new ProfessionalPDFGenerator();
  const pdfBlob = await generator.generateReport(reportData);
  
  // Create download link
  const url = URL.createObjectURL(pdfBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `ISG-Raporu-${reportData.reportNumber || 'Yeni'}-${new Date().toLocaleDateString('tr-TR').replace(/\./g, '-')}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}