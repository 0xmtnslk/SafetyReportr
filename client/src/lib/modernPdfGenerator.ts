import jsPDF from 'jspdf';

interface ReportData {
  id: string;
  reportNumber: string;
  reportDate: string;
  projectLocation: string;
  reporter: string;
  managementSummary?: string;
  generalEvaluation?: string;
  findings: Array<{
    id: string;
    title: string;
    section: number;
    currentSituation: string;
    dangerLevel: 'high' | 'medium' | 'low';
    recommendation?: string;
    legalBasis?: string;
    images?: string[];
    isCompleted: boolean;
    processSteps?: Array<{date: string, description: string}>;
  }>;
}

export class ModernPDFGenerator {
  private doc: jsPDF;
  private pageHeight: number;
  private pageWidth: number;
  private currentY: number;
  private margin: number;

  constructor() {
    this.doc = new jsPDF('p', 'mm', 'a4');
    this.pageHeight = this.doc.internal.pageSize.height;
    this.pageWidth = this.doc.internal.pageSize.width;
    this.currentY = 15;
    this.margin = 15;
  }

  private checkPageBreak(requiredSpace: number = 20) {
    if (this.currentY + requiredSpace > this.pageHeight - this.margin) {
      this.doc.addPage();
      this.currentY = this.margin;
    }
  }

  private addText(text: string, x: number, y: number, options: {
    size?: number;
    style?: 'normal' | 'bold' | 'italic';
    color?: number[];
    align?: 'left' | 'center' | 'right';
    maxWidth?: number;
  } = {}) {
    const {
      size = 10,
      style = 'normal',
      color = [0, 0, 0],
      align = 'left',
      maxWidth = this.pageWidth - 2 * this.margin
    } = options;

    this.doc.setFontSize(size);
    this.doc.setFont('helvetica', style);
    this.doc.setTextColor(...color);

    if (text.length > 0) {
      if (maxWidth) {
        const lines = this.doc.splitTextToSize(text, maxWidth);
        for (let i = 0; i < lines.length; i++) {
          if (align === 'center') {
            this.doc.text(lines[i], this.pageWidth / 2, y + (i * 5), { align: 'center' });
          } else if (align === 'right') {
            this.doc.text(lines[i], this.pageWidth - this.margin, y + (i * 5), { align: 'right' });
          } else {
            this.doc.text(lines[i], x, y + (i * 5));
          }
        }
        return lines.length * 5;
      } else {
        this.doc.text(text, x, y);
        return 5;
      }
    }
    return 0;
  }

  private addTableHeader() {
    // Company logo area - simple blue header
    this.doc.setFillColor(52, 73, 94); // Dark blue
    this.doc.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 25, 'F');
    
    // Company name in white
    this.addText('İŞ SAĞLIĞI VE GÜVENLİĞİ RAPORU', this.margin + 5, this.currentY + 8, {
      size: 14,
      style: 'bold',
      color: [255, 255, 255]
    });
    
    this.currentY += 30;
  }

  private addReportInfo(data: ReportData) {
    // Report info table
    const tableY = this.currentY;
    const colWidth = (this.pageWidth - 2 * this.margin) / 2;
    
    // Table borders
    this.doc.setDrawColor(200, 200, 200);
    this.doc.setLineWidth(0.2);
    
    // Header row with report details
    this.doc.setFillColor(240, 240, 240);
    this.doc.rect(this.margin, tableY, this.pageWidth - 2 * this.margin, 8, 'FD');
    
    this.addText('Raporlayan:', this.margin + 2, tableY + 5, { size: 8, style: 'bold' });
    this.addText(data.reporter, this.margin + colWidth + 2, tableY + 5, { size: 8 });
    
    // Report date and number
    this.doc.rect(this.margin, tableY + 8, colWidth, 8, 'D');
    this.doc.rect(this.margin + colWidth, tableY + 8, colWidth, 8, 'D');
    
    this.addText('Rapor Tar.:', this.margin + 2, tableY + 13, { size: 8, style: 'bold' });
    this.addText(new Date(data.reportDate).toLocaleDateString('tr-TR'), this.margin + 25, tableY + 13, { size: 8 });
    
    this.addText('Rapor No:', this.margin + colWidth + 2, tableY + 13, { size: 8, style: 'bold' });
    this.addText(data.reportNumber, this.margin + colWidth + 25, tableY + 13, { size: 8 });
    
    this.currentY = tableY + 20;
  }

  private addFindingSection(finding: any, index: number) {
    this.checkPageBreak(50);
    
    const startY = this.currentY;
    
    // Finding number and title
    this.addText(`${index + 1}. Yangın Kapıları ve Manyetik Tutucullar`, this.margin, this.currentY, {
      size: 10,
      style: 'bold'
    });
    this.currentY += 8;
    
    // Two column layout for image and content
    const imageX = this.margin;
    const imageWidth = 60;
    const imageHeight = 80;
    const contentX = imageX + imageWidth + 5;
    const contentWidth = this.pageWidth - contentX - this.margin;
    
    // Image placeholder (you can add actual image loading here)
    this.doc.setFillColor(220, 220, 220);
    this.doc.rect(imageX, this.currentY, imageWidth, imageHeight, 'F');
    this.doc.setDrawColor(180, 180, 180);
    this.doc.rect(imageX, this.currentY, imageWidth, imageHeight, 'D');
    
    // Add red arrow indicator in image area
    this.doc.setFillColor(220, 38, 38);
    this.doc.triangle(imageX + 10, this.currentY + 40, imageX + 20, this.currentY + 35, imageX + 20, this.currentY + 45, 'F');
    
    // Content area
    let contentY = this.currentY;
    
    // Tespit Tarihi
    this.addText('Tespit Tarihi:', contentX, contentY, { size: 8, style: 'bold' });
    this.addText(new Date().toLocaleDateString('tr-TR'), contentX + 25, contentY, { size: 8 });
    contentY += 6;
    
    // Mevcut Durum
    this.addText('Mevcut Durum:', contentX, contentY, { size: 8, style: 'bold' });
    contentY += 5;
    const situationHeight = this.addText(finding.currentSituation || 'Yangın kapıları merdiven ayrılığı konumunda değildir. Kapıların manyetik tutucudan ayrıldığımızda kendini kendine kapanmıyor. Kapıların yolun dışarısını sertifikasyonun tespit edilememiştir. Açma kuvveti ve kapıları olan saha yapılamamıştır.', 
      contentX, contentY, { size: 8, maxWidth: contentWidth });
    contentY += situationHeight + 5;
    
    // Dayanak
    this.addText('Dayanak:', contentX, contentY, { size: 8, style: 'bold' });
    contentY += 5;
    this.addText('Binaların Yangından Korunması Hakkında Yönetmelik: TS EN 1634-3', contentX, contentY, { size: 8 });
    contentY += 6;
    
    // İGÜ Görüşü
    this.addText('İGÜ Görüşü:', contentX, contentY, { size: 8, style: 'bold' });
    contentY += 5;
    const recommendationHeight = this.addText(finding.recommendation || 'Yangın kapıları, TS EN 1634-3 standardına uygun şekilde yangın merdiven sahalarını ayrı ötelemektedir. Sistemlerin alınması gereken tedbirler; Kapı merdiverileri kontrol edilmeli ve acil durum anında güvenlik manyetik tutucular bırakıldığında kapılar ek herhangi bir müdahale gerek duyulmadan kendi', 
      contentX, contentY, { size: 8, maxWidth: contentWidth });
    
    this.currentY = Math.max(this.currentY + imageHeight, contentY + recommendationHeight) + 10;
    
    // Action table at bottom
    this.addActionTable();
  }

  private addActionTable() {
    const tableY = this.currentY;
    const tableWidth = this.pageWidth - 2 * this.margin;
    
    // Green header
    this.doc.setFillColor(34, 197, 94);
    this.doc.rect(this.margin, tableY, tableWidth, 8, 'F');
    this.addText('Tedbike Skalası', this.margin + 2, tableY + 5, {
      size: 9,
      style: 'bold',
      color: [255, 255, 255]
    });
    
    // Table rows
    const rowHeight = 8;
    this.doc.setFillColor(255, 255, 255);
    this.doc.setDrawColor(200, 200, 200);
    
    // Header row
    this.doc.rect(this.margin, tableY + 8, tableWidth, rowHeight, 'D');
    this.addText('Süreç Yönetimi', this.margin + 2, tableY + 13, { size: 8, style: 'bold' });
    this.addText('Açıklama', this.margin + tableWidth/2, tableY + 13, { size: 8, style: 'bold' });
    
    // Data row
    this.doc.rect(this.margin, tableY + 16, tableWidth, rowHeight, 'D');
    this.addText('Tarih', this.margin + 2, tableY + 21, { size: 8 });
    this.addText('01.08.2025', this.margin + 20, tableY + 21, { size: 8 });
    this.addText('Kapı koridor geçişlerinde bulunan yangın kapıları montajı ve açılışları yapılıyor ve tamamlanıyor.', 
      this.margin + tableWidth/2, tableY + 21, { size: 8, maxWidth: tableWidth/2 - 5 });
    
    this.currentY = tableY + 30;
  }

  public async generateReport(reportData: ReportData): Promise<Blob> {
    // Add header
    this.addTableHeader();
    
    // Add report info
    this.addReportInfo(reportData);
    
    // Add findings from different sections
    const relevantFindings = reportData.findings.filter(f => f.section === 2 || f.section === 3);
    
    relevantFindings.forEach((finding, index) => {
      this.addFindingSection(finding, index);
      this.currentY += 10; // Space between findings
    });
    
    // Add management summary if available
    if (reportData.managementSummary) {
      this.checkPageBreak(30);
      this.addText('YÖNETİCİ ÖZETİ', this.margin, this.currentY, {
        size: 12,
        style: 'bold'
      });
      this.currentY += 10;
      
      this.addText(reportData.managementSummary, this.margin, this.currentY, {
        size: 10,
        maxWidth: this.pageWidth - 2 * this.margin
      });
      this.currentY += 20;
    }
    
    // Add general evaluation if available
    if (reportData.generalEvaluation) {
      this.checkPageBreak(30);
      this.addText('GENEL DEĞERLENDİRME', this.margin, this.currentY, {
        size: 12,
        style: 'bold'
      });
      this.currentY += 10;
      
      this.addText(reportData.generalEvaluation, this.margin, this.currentY, {
        size: 10,
        maxWidth: this.pageWidth - 2 * this.margin
      });
    }
    
    // Generate and return PDF blob
    return new Promise((resolve) => {
      const pdfBlob = this.doc.output('blob');
      resolve(pdfBlob);
    });
  }
}

export const downloadModernReportPDF = async (reportData: ReportData) => {
  const generator = new ModernPDFGenerator();
  const pdfBlob = await generator.generateReport(reportData);
  
  // Create download link
  const url = URL.createObjectURL(pdfBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `ISG_Rapor_${reportData.reportNumber}_${new Date().toLocaleDateString('tr-TR').replace(/\./g, '_')}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};