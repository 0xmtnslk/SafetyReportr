import jsPDF from 'jspdf';
import 'jspdf/dist/jspdf.es.min.js';

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

export class TurkishPDFGenerator {
  private doc: jsPDF;
  private pageWidth: number = 210;  // A4 width in mm
  private pageHeight: number = 297; // A4 height in mm
  private margin: number = 20;

  constructor() {
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });
  }

  async generateReport(reportData: ReportData): Promise<Blob> {
    try {
      console.log('Türkçe PDF oluşturuluyor...', reportData);
      
      // 1. Cover page
      await this.createCoverPage(reportData);
      
      // 2. Management summary
      if (reportData.managementSummary) {
        this.doc.addPage();
        this.addManagementSummary(reportData.managementSummary);
      }
      
      // 3. Findings pages
      const sections = [
        { number: 2, title: 'Tasarım/İmalat/Montaj Hataları' },
        { number: 3, title: 'İş Sağlığı ve Güvenliği Bulguları' },
        { number: 4, title: 'Tamamlanmış Bulgular' }
      ];

      let findingCounter = 1;
      
      if (reportData.findings && reportData.findings.length > 0) {
        for (const section of sections) {
          const sectionFindings = reportData.findings.filter(f => f.section === section.number);
          
          for (const finding of sectionFindings) {
            this.doc.addPage();
            await this.addFindingPage(finding, findingCounter, section.title);
            findingCounter++;
          }
        }
      }
      
      // 4. General evaluation
      if (reportData.generalEvaluation) {
        this.doc.addPage();
        this.addGeneralEvaluation(reportData.generalEvaluation);
      }

      console.log('PDF hazır, blob oluşturuluyor...');
      return this.doc.output('blob');
      
    } catch (error) {
      console.error('PDF oluşturma hatası:', error);
      throw error;
    }
  }

  private async createCoverPage(reportData: ReportData): Promise<void> {
    // Header line
    this.doc.setDrawColor(0, 51, 102);
    this.doc.setLineWidth(3);
    this.doc.line(this.margin, 20, this.pageWidth - this.margin, 20);

    // Main title
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(18);
    this.doc.setTextColor(0, 51, 102);
    this.centerText('İstinye Üniversite Topkapı Liv Hastanesi', 40);

    // Subtitle  
    this.doc.setFontSize(14);
    this.centerText('İş Sağlığı ve Güvenliği Saha Gözlem Raporu', 55);

    // Add logo
    await this.addLogo();

    // Report info section
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(14);
    this.doc.setTextColor(0, 51, 102);
    this.doc.text('RAPOR BİLGİLERİ', this.margin, 120);

    // Report info table
    const tableData = [
      ['Rapor Numarası:', reportData.reportNumber || '2025-001'],
      ['Rapor Tarihi:', reportData.reportDate || new Date().toLocaleDateString('tr-TR')],
      ['Proje Lokasyonu:', reportData.projectLocation || 'İstinye Üniversitesi Topkapı Liv Hastanesi'],
      ['Raporlayan Uzman:', reportData.reporter || 'Metin Salık'],
      ['Toplam Bulgu Sayısı:', reportData.findings?.length?.toString() || '0']
    ];

    this.createTable(130, tableData);

    // Footer
    this.doc.setDrawColor(0, 51, 102);
    this.doc.setLineWidth(1);
    this.doc.line(this.margin, this.pageHeight - 40, this.pageWidth - this.margin, this.pageHeight - 40);
    
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(10);
    this.doc.setTextColor(100, 100, 100);
    this.doc.text(`Bu rapor ${new Date().toLocaleDateString('tr-TR')} tarihinde oluşturulmuştur.`, this.margin, this.pageHeight - 25);
  }

  private async addLogo(): Promise<void> {
    try {
      const logoImg = new Image();
      logoImg.crossOrigin = 'anonymous';
      
      await new Promise<void>((resolve) => {
        logoImg.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = logoImg.width;
            canvas.height = logoImg.height;
            ctx?.drawImage(logoImg, 0, 0);
            
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            this.doc.addImage(dataUrl, 'JPEG', this.pageWidth/2 - 25, 70, 50, 25);
          } catch (err) {
            console.warn('Logo eklenemedi:', err);
          }
          resolve();
        };
        logoImg.onerror = () => {
          console.warn('Logo yüklenemedi');
          resolve();
        };
        logoImg.src = '/attached_assets/logo_1755548921510.jpg';
      });
    } catch (error) {
      console.warn('Logo işleme hatası:', error);
    }
  }

  private async addFindingPage(finding: Finding, findingNumber: number, sectionTitle: string): Promise<void> {
    // Page header
    this.doc.setDrawColor(0, 51, 102);
    this.doc.setLineWidth(2);
    this.doc.line(this.margin, 15, this.pageWidth - this.margin, 15);

    // Finding title
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(16);
    this.doc.setTextColor(0, 51, 102);
    this.doc.text(`BULGU ${findingNumber}: ${sectionTitle}`, this.margin, 30);

    let currentY = 45;

    // Basic info table
    const basicInfo = [
      ['Tespit Yeri/Konum:', finding.location || finding.title],
      ['Tespit Tarihi:', new Date().toLocaleDateString('tr-TR')]
    ];
    
    this.createTable(currentY, basicInfo);
    currentY += 30;

    // Current situation
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(12);
    this.doc.setTextColor(0, 51, 102);
    this.doc.text('MEVCUT DURUM', this.margin, currentY);
    currentY += 8;
    
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(10);
    this.doc.setTextColor(0, 0, 0);
    const currentSituation = this.doc.splitTextToSize(finding.description || 'Belirtilmemiş', this.pageWidth - 2 * this.margin);
    this.doc.text(currentSituation, this.margin, currentY);
    currentY += Math.max(20, currentSituation.length * 5);

    // Legal basis
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(12);
    this.doc.setTextColor(0, 51, 102);
    this.doc.text('YASAL DAYANAK', this.margin, currentY);
    currentY += 8;
    
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(10);
    this.doc.setTextColor(0, 0, 0);
    const legalText = 'İş Sağlığı ve Güvenliği Kanunu ve ilgili yönetmelikler';
    this.doc.text(legalText, this.margin, currentY);
    currentY += 20;

    // Expert opinion
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(12);
    this.doc.setTextColor(0, 51, 102);
    this.doc.text('İSG UZMANI GÖRÜŞÜ', this.margin, currentY);
    currentY += 8;
    
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(10);
    this.doc.setTextColor(0, 0, 0);
    const recommendation = this.doc.splitTextToSize(finding.recommendation || 'Gerekli önlemler alınmalıdır.', this.pageWidth - 2 * this.margin);
    this.doc.text(recommendation, this.margin, currentY);
    currentY += Math.max(20, recommendation.length * 5);

    // Images section
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(12);
    this.doc.setTextColor(0, 51, 102);
    this.doc.text('FOTOĞRAF ALANI', this.margin, currentY);
    currentY += 10;
    
    await this.addImages(finding.images || [], currentY);
    currentY += 60; // Space for images

    // Risk level
    this.addRiskLevel(finding.dangerLevel, currentY);
    currentY += 20;

    // Process steps if available
    if (finding.processSteps && finding.processSteps.length > 0) {
      this.addProcessSteps(finding.processSteps, currentY);
    }
  }

  private async addImages(images: string[], y: number): Promise<void> {
    const imageWidth = 70;
    const imageHeight = 50;
    let x = this.margin;
    
    if (images.length > 0) {
      for (let i = 0; i < Math.min(images.length, 2); i++) {
        try {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          
          await new Promise<void>((resolve) => {
            img.onload = () => {
              try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.width;
                canvas.height = img.height;
                ctx?.drawImage(img, 0, 0);
                
                const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                this.doc.addImage(dataUrl, 'JPEG', x, y, imageWidth, imageHeight);
              } catch (err) {
                console.warn('Fotoğraf eklenemedi:', err);
                this.doc.setDrawColor(150, 150, 150);
                this.doc.rect(x, y, imageWidth, imageHeight);
              }
              resolve();
            };
            img.onerror = () => {
              this.doc.setDrawColor(150, 150, 150);
              this.doc.rect(x, y, imageWidth, imageHeight);
              resolve();
            };
            img.src = images[i];
          });
        } catch (error) {
          console.warn('Fotoğraf işleme hatası:', error);
          this.doc.setDrawColor(150, 150, 150);
          this.doc.rect(x, y, imageWidth, imageHeight);
        }
        
        x += imageWidth + 15;
      }
    } else {
      // Empty placeholder
      this.doc.setDrawColor(150, 150, 150);
      this.doc.rect(x, y, imageWidth, imageHeight);
    }
  }

  private addRiskLevel(dangerLevel: string, y: number): void {
    const colors: { [key: string]: [number, number, number] } = {
      'high': [220, 38, 38],    // Red
      'medium': [245, 158, 11], // Orange  
      'low': [34, 197, 94]      // Green
    };

    const levelTexts: { [key: string]: string } = {
      'high': 'YÜKSEK RİSK',
      'medium': 'ORTA RİSK',
      'low': 'DÜŞÜK RİSK'
    };

    const color = colors[dangerLevel] || colors['medium'];
    
    this.doc.setFillColor(color[0], color[1], color[2]);
    this.doc.rect(this.margin, y, 80, 15, 'F');
    this.doc.setDrawColor(0, 0, 0);
    this.doc.rect(this.margin, y, 80, 15);
    
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(10);
    this.doc.setTextColor(255, 255, 255);
    this.doc.text(levelTexts[dangerLevel] || 'ORTA RİSK', this.margin + 5, y + 10);
  }

  private addProcessSteps(processSteps: ProcessStep[], y: number): void {
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(12);
    this.doc.setTextColor(0, 51, 102);
    this.doc.text('SÜREÇ YÖNETİMİ', this.margin, y);
    y += 10;
    
    const tableData = [
      ['Faaliyet', 'Hedef Tarih', 'Sorumlu', 'Durum']
    ];
    
    processSteps.forEach(step => {
      tableData.push([
        step.description,
        step.targetDate,
        step.responsible,
        step.status
      ]);
    });
    
    this.createProcessTable(y, tableData);
  }

  private addManagementSummary(summary: string): void {
    this.doc.setDrawColor(0, 51, 102);
    this.doc.setLineWidth(2);
    this.doc.line(this.margin, 15, this.pageWidth - this.margin, 15);

    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(16);
    this.doc.setTextColor(0, 51, 102);
    this.doc.text('YÖNETİCİ ÖZETİ', this.margin, 30);

    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(11);
    this.doc.setTextColor(0, 0, 0);
    
    const text = this.doc.splitTextToSize(summary, this.pageWidth - 2 * this.margin);
    this.doc.text(text, this.margin, 50);
  }

  private addGeneralEvaluation(evaluation: string): void {
    this.doc.setDrawColor(0, 51, 102);
    this.doc.setLineWidth(2);
    this.doc.line(this.margin, 15, this.pageWidth - this.margin, 15);

    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(16);
    this.doc.setTextColor(0, 51, 102);
    this.doc.text('GENEL DEĞERLENDİRME', this.margin, 30);

    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(11);
    this.doc.setTextColor(0, 0, 0);
    
    const text = this.doc.splitTextToSize(evaluation, this.pageWidth - 2 * this.margin);
    this.doc.text(text, this.margin, 50);
  }

  private createTable(y: number, data: string[][]): void {
    const rowHeight = 12;
    const colWidth = (this.pageWidth - 2 * this.margin) / 2;

    data.forEach((row, index) => {
      // Left column (label) - colored background
      this.doc.setFillColor(240, 248, 255);
      this.doc.rect(this.margin, y, colWidth, rowHeight, 'F');
      this.doc.setDrawColor(0, 0, 0);
      this.doc.rect(this.margin, y, colWidth, rowHeight);
      
      // Right column (value)
      this.doc.rect(this.margin + colWidth, y, colWidth, rowHeight);
      
      // Text
      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(10);
      this.doc.setTextColor(0, 51, 102);
      this.doc.text(row[0], this.margin + 2, y + 8);
      
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(0, 0, 0);
      const valueText = this.doc.splitTextToSize(row[1], colWidth - 4);
      this.doc.text(valueText, this.margin + colWidth + 2, y + 8);
      
      y += rowHeight;
    });
  }

  private createProcessTable(y: number, data: string[][]): void {
    const rowHeight = 12;
    const totalWidth = this.pageWidth - 2 * this.margin;
    const colWidths = [totalWidth * 0.4, totalWidth * 0.2, totalWidth * 0.2, totalWidth * 0.2];
    
    data.forEach((row, index) => {
      let x = this.margin;
      
      row.forEach((cell, colIndex) => {
        if (index === 0) {
          // Header row
          this.doc.setFillColor(240, 248, 255);
          this.doc.rect(x, y, colWidths[colIndex], rowHeight, 'F');
        }
        
        this.doc.setDrawColor(0, 0, 0);
        this.doc.rect(x, y, colWidths[colIndex], rowHeight);
        
        this.doc.setFont('helvetica', index === 0 ? 'bold' : 'normal');
        this.doc.setFontSize(9);
        this.doc.setTextColor(index === 0 ? 0 : 0, index === 0 ? 51 : 0, index === 0 ? 102 : 0);
        
        const cellText = this.doc.splitTextToSize(cell, colWidths[colIndex] - 4);
        this.doc.text(cellText, x + 2, y + 8);
        
        x += colWidths[colIndex];
      });
      
      y += rowHeight;
    });
  }

  private centerText(text: string, y: number): void {
    const textWidth = this.doc.getTextWidth(text);
    const x = (this.pageWidth - textWidth) / 2;
    this.doc.text(text, x, y);
  }
}