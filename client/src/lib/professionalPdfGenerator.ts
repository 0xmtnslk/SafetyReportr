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
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm', 
      format: 'a4',
      putOnlyUsedFonts: true,
      compress: true
    });
    
    // A4 exact dimensions for proper printing
    this.pageWidth = 210;
    this.pageHeight = 297;
    this.margin = 20; // Professional A4 margin
    
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
    if (!text) return '';
    // jsPDF Türkçe karakterleri desteklemiyor, sadece orijinal metni döndür
    return text;
  }

  private async generateCoverPage(reportData: ReportData): Promise<void> {
    // Professional cover page design
    
    // Add header border
    this.doc.setDrawColor(0, 51, 102); // Dark blue
    this.doc.setLineWidth(2);
    this.doc.line(this.margin, 20, this.pageWidth - this.margin, 20);
    
    // Main title
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(18);
    this.doc.setTextColor(0, 51, 102); // Dark blue
    const titleText = this.encodeTurkishText('İstinye Üniversite Topkapı Liv Hastanesi');
    const titleWidth = this.doc.getTextWidth(titleText);
    this.doc.text(titleText, (this.pageWidth - titleWidth) / 2, 35);
    
    // Subtitle
    this.doc.setFontSize(16);
    this.doc.setTextColor(0, 0, 0); // Black
    const subtitleText = this.encodeTurkishText('İş Sağlığı ve Güvenliği Saha Gözlem Raporu');
    const subtitleWidth = this.doc.getTextWidth(subtitleText);
    this.doc.text(subtitleText, (this.pageWidth - subtitleWidth) / 2, 50);

    // Add logos
    await this.addLogoAndHospitalImage();

    // Professional report information section
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(14);
    this.doc.setTextColor(0, 51, 102);
    this.doc.text(this.encodeTurkishText('RAPOR BİLGİLERİ'), this.margin, 110);
    
    // Information table with better styling
    const startY = 125;
    this.drawProfessionalTable(startY, [
      [this.encodeTurkishText('Rapor Numarası:'), this.encodeTurkishText(reportData.reportNumber || 'N/A')],
      [this.encodeTurkishText('Rapor Tarihi:'), reportData.reportDate ? new Date(reportData.reportDate).toLocaleDateString('tr-TR') : 'N/A'],
      [this.encodeTurkishText('Proje Lokasyonu:'), this.encodeTurkishText(reportData.projectLocation || 'N/A')],
      [this.encodeTurkishText('Raporlayan Uzman:'), this.encodeTurkishText(reportData.reporter || 'N/A')],
      [this.encodeTurkishText('Toplam Bulgu Sayısı:'), (reportData.findings?.length || 0).toString()],
    ]);

    // Footer section
    this.doc.setDrawColor(0, 51, 102);
    this.doc.setLineWidth(1);
    this.doc.line(this.margin, this.pageHeight - 40, this.pageWidth - this.margin, this.pageHeight - 40);
    
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(10);
    this.doc.setTextColor(100, 100, 100);
    const footerText = this.encodeTurkishText(`Bu rapor ${new Date().toLocaleDateString('tr-TR')} tarihinde oluşturulmuştur.`);
    this.doc.text(footerText, this.margin, this.pageHeight - 25);
  }

  private async addLogoAndHospitalImage(): Promise<void> {
    try {
      // Load and add MLPCARE logo (top left) 
      const logoImg = new Image();
      logoImg.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        logoImg.onload = () => {
          try {
            // Create canvas to convert image
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = logoImg.width;
            canvas.height = logoImg.height;
            ctx?.drawImage(logoImg, 0, 0);
            
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            this.doc.addImage(dataUrl, 'JPEG', 15, 60, 40, 20);
            resolve(null);
          } catch (err) {
            console.warn('Logo could not be added:', err);
            resolve(null);
          }
        };
        logoImg.onerror = () => {
          console.warn('Logo could not be loaded');
          resolve(null);
        };
        logoImg.src = '/attached_assets/logo_1755544106935.jpg';
      });

      // Load and add hospital image (top right)
      const hospitalImg = new Image();
      hospitalImg.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        hospitalImg.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = hospitalImg.width;
            canvas.height = hospitalImg.height;
            ctx?.drawImage(hospitalImg, 0, 0);
            
            const dataUrl = canvas.toDataURL('image/png', 0.8);
            this.doc.addImage(dataUrl, 'PNG', this.pageWidth - 55, 60, 40, 20);
            resolve(null);
          } catch (err) {
            console.warn('Hospital image could not be added:', err);
            resolve(null);
          }
        };
        hospitalImg.onerror = () => {
          console.warn('Hospital image could not be loaded');
          resolve(null);
        };
        hospitalImg.src = '/attached_assets/image_1755544248685.png';
      });
      
    } catch (error) {
      console.warn('Images could not be loaded:', error);
      // Fallback to text placeholders
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(8);
      this.doc.text('[Logo]', 25, 75);
      this.doc.text('[Hastane]', this.pageWidth - 45, 75);
    }
  }

  private async addFindingPage(finding: Finding, findingNumber: number, sectionTitle: string): Promise<void> {
    // Page header with section info
    this.doc.setDrawColor(0, 51, 102);
    this.doc.setLineWidth(2);
    this.doc.line(this.margin, 15, this.pageWidth - this.margin, 15);
    
    // Finding title with number
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(14);
    this.doc.setTextColor(0, 51, 102);
    const findingTitle = this.encodeTurkishText(`BULGU ${findingNumber}: ${sectionTitle}`);
    this.doc.text(findingTitle, this.margin, 25);

    // Location and inspection date info
    let currentY = 35;
    this.drawProfessionalTable(currentY, [
      [this.encodeTurkishText('Tespit Yeri/Konum:'), this.encodeTurkishText(finding.location || finding.title)],
      [this.encodeTurkishText('Tespit Tarihi:'), new Date().toLocaleDateString('tr-TR')]
    ]);
    currentY += 35;

    // Main content sections
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(12);
    this.doc.setTextColor(0, 51, 102);
    this.doc.text(this.encodeTurkishText('MEVCUT DURUM'), this.margin, currentY);
    currentY += 10;
    
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(10);
    this.doc.setTextColor(0, 0, 0);
    const currentSituation = this.doc.splitTextToSize(
      this.encodeTurkishText(finding.description || 'Belirtilmemiş'), 
      this.pageWidth - 2 * this.margin
    );
    this.doc.text(currentSituation, this.margin, currentY);
    currentY += Math.max(20, currentSituation.length * 5);

    // Legal basis section
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(12);
    this.doc.setTextColor(0, 51, 102);
    this.doc.text(this.encodeTurkishText('YASAL DAYANAK'), this.margin, currentY);
    currentY += 10;
    
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(10);
    this.doc.setTextColor(0, 0, 0);
    const legalBasis = this.doc.splitTextToSize(
      this.encodeTurkishText('İş Sağlığı ve Güvenliği Kanunu ve ilgili yönetmelikler'), 
      this.pageWidth - 2 * this.margin
    );
    this.doc.text(legalBasis, this.margin, currentY);
    currentY += 25;

    // ISG Opinion section
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(12);
    this.doc.setTextColor(0, 51, 102);
    this.doc.text(this.encodeTurkishText('İSG UZMANI GÖRÜŞü'), this.margin, currentY);
    currentY += 10;
    
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(10);
    this.doc.setTextColor(0, 0, 0);
    const isgOpinion = this.doc.splitTextToSize(
      this.encodeTurkishText(finding.recommendation || 'Düzeltici faaliyet önerileri değerlendirilmelidir.'), 
      this.pageWidth - 2 * this.margin
    );
    this.doc.text(isgOpinion, this.margin, currentY);
    currentY += Math.max(25, isgOpinion.length * 5);

    // Image section - bigger photos
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(12);
    this.doc.setTextColor(0, 51, 102);
    this.doc.text(this.encodeTurkishText('FOTO ALANI'), this.margin, currentY);
    currentY += 10;
    
    // Calculate available space for images
    const availableWidth = this.pageWidth - 2 * this.margin;
    const imageWidth = 70; // Bigger images
    const imageHeight = 50;
    const spacing = 15;
    let imageX = this.margin;
    
    // Add multiple images if available
    if (finding.images && finding.images.length > 0) {
      for (let i = 0; i < Math.min(finding.images.length, 3); i++) {
        this.doc.setDrawColor(150, 150, 150);
        this.doc.setLineWidth(1);
        this.doc.rect(imageX, currentY, imageWidth, imageHeight);
        
        // Add actual image
        await this.addFindingImage(finding.images[i], imageX + 2, currentY + 2, imageWidth - 4, imageHeight - 4);
        
        imageX += imageWidth + spacing;
        if (imageX + imageWidth > this.pageWidth - this.margin) {
          break; // No more space
        }
      }
    } else {
      // Empty placeholder
      this.doc.setDrawColor(150, 150, 150);
      this.doc.setLineWidth(1);
      this.doc.rect(this.margin, currentY, imageWidth, imageHeight);
    }
    
    currentY += imageHeight + 15;

    // Danger level indicator with color  
    this.addDangerLevelSection(currentY, finding.dangerLevel);
    currentY += 25;
    
    // Process steps section
    if (finding.processSteps && finding.processSteps.length > 0) {
      this.addProcessStepsSection(currentY, finding.processSteps);
    }
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
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx?.drawImage(img, 0, 0);
            
            const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
            this.doc.addImage(dataUrl, 'JPEG', x, y, width, height);
            resolve(null);
          } catch (err) {
            console.warn('Finding image could not be added:', err);
            resolve(null);
          }
        };
        img.onerror = () => {
          console.warn('Finding image could not be loaded:', imagePath);
          resolve(null);
        };
        img.src = imagePath;
      });
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
    const rowHeight = 12;
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
      this.doc.text(row[0], this.margin + 2, y + 8);
      
      this.doc.setFont('helvetica', 'normal');
      const splitText = this.doc.splitTextToSize(row[1], colWidth - 4);
      this.doc.text(splitText, this.margin + colWidth + 2, y + 8);
    });
  }

  private drawProfessionalTable(startY: number, rows: string[][]): void {
    const rowHeight = 15;
    const labelWidth = 80;
    const valueWidth = this.pageWidth - 2 * this.margin - labelWidth;
    
    this.doc.setDrawColor(100, 100, 100);
    this.doc.setLineWidth(0.5);
    
    rows.forEach((row, index) => {
      const y = startY + (index * rowHeight);
      
      // Header cell with light blue background
      this.doc.setFillColor(240, 248, 255);
      this.doc.rect(this.margin, y, labelWidth, rowHeight, 'F');
      this.doc.rect(this.margin, y, labelWidth, rowHeight);
      
      // Value cell  
      this.doc.rect(this.margin + labelWidth, y, valueWidth, rowHeight);
      
      // Label text
      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(10);
      this.doc.setTextColor(0, 51, 102);
      this.doc.text(row[0], this.margin + 3, y + 10);
      
      // Value text
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(0, 0, 0);
      const splitText = this.doc.splitTextToSize(row[1], valueWidth - 6);
      this.doc.text(splitText, this.margin + labelWidth + 3, y + 10);
    });
  }

  private addManagementSummary(summary: string): void {
    // Header
    this.doc.setDrawColor(0, 51, 102);
    this.doc.setLineWidth(2);
    this.doc.line(this.margin, 15, this.pageWidth - this.margin, 15);
    
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(16);
    this.doc.setTextColor(0, 51, 102);
    this.doc.text(this.encodeTurkishText('YÖNETİCİ ÖZETİ'), this.margin, 30);
    
    // Content
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(11);
    this.doc.setTextColor(0, 0, 0);
    const splitText = this.doc.splitTextToSize(this.encodeTurkishText(summary), this.pageWidth - 2 * this.margin);
    this.doc.text(splitText, this.margin, 50);
  }

  private addGeneralEvaluation(evaluation: string): void {
    // Header
    this.doc.setDrawColor(0, 51, 102);
    this.doc.setLineWidth(2);
    this.doc.line(this.margin, 15, this.pageWidth - this.margin, 15);
    
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(16);
    this.doc.setTextColor(0, 51, 102);
    this.doc.text(this.encodeTurkishText('GENEL DEĞERLENDİRME'), this.margin, 30);
    
    // Content
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(11);
    this.doc.setTextColor(0, 0, 0);
    const splitText = this.doc.splitTextToSize(this.encodeTurkishText(evaluation), this.pageWidth - 2 * this.margin);
    this.doc.text(splitText, this.margin, 50);
  }

  private addDangerLevelSection(currentY: number, dangerLevel: string): void {
    // Danger level box with color - no separate title
    const dangerColor = this.getDangerColor(dangerLevel);
    this.doc.setFillColor(dangerColor[0], dangerColor[1], dangerColor[2]);
    this.doc.rect(this.margin, currentY, 80, 15, 'F');
    this.doc.setDrawColor(0, 0, 0);
    this.doc.rect(this.margin, currentY, 80, 15);
    
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(10);
    this.doc.setTextColor(255, 255, 255);
    this.doc.text(this.encodeTurkishText(`RISK: ${this.getDangerLevelText(dangerLevel).toUpperCase()}`), this.margin + 5, currentY + 10);
  }

  private addProcessStepsSection(currentY: number, processSteps: ProcessStep[]): void {
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(12);
    this.doc.setTextColor(0, 51, 102);
    this.doc.text(this.encodeTurkishText('SUREC YONETIMI'), this.margin, currentY);
    currentY += 10;
    
    // Process steps table
    const rowHeight = 12;
    const colWidths = [60, 40, 50, 40]; // Description, Target Date, Responsible, Status
    
    // Header
    this.doc.setFillColor(240, 248, 255);
    this.doc.rect(this.margin, currentY, this.pageWidth - 2 * this.margin, rowHeight, 'F');
    this.doc.setDrawColor(0, 0, 0);
    this.doc.rect(this.margin, currentY, this.pageWidth - 2 * this.margin, rowHeight);
    
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(9);
    this.doc.setTextColor(0, 51, 102);
    let x = this.margin + 2;
    this.doc.text('FAALIYET', x, currentY + 8);
    x += colWidths[0];
    this.doc.text('HEDEF TARIH', x, currentY + 8);
    x += colWidths[1];
    this.doc.text('SORUMLU', x, currentY + 8);
    x += colWidths[2];
    this.doc.text('DURUM', x, currentY + 8);
    
    currentY += rowHeight;
    
    // Process steps
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(8);
    this.doc.setTextColor(0, 0, 0);
    
    processSteps.forEach((step, index) => {
      this.doc.rect(this.margin, currentY, this.pageWidth - 2 * this.margin, rowHeight);
      
      x = this.margin + 2;
      const descText = this.doc.splitTextToSize(this.encodeTurkishText(step.description), colWidths[0] - 4);
      this.doc.text(descText, x, currentY + 8);
      
      x += colWidths[0];
      this.doc.text(step.targetDate || '', x, currentY + 8);
      
      x += colWidths[1];
      this.doc.text(this.encodeTurkishText(step.responsible || ''), x, currentY + 8);
      
      x += colWidths[2];
      this.doc.text(this.encodeTurkishText(step.status || ''), x, currentY + 8);
      
      currentY += rowHeight;
    });
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