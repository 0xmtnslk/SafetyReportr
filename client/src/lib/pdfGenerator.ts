import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Turkish character support configuration
const TURKISH_CHARS = {
  'ç': 'c',
  'ğ': 'g', 
  'ı': 'i',
  'ö': 'o',
  'ş': 's',
  'ü': 'u',
  'Ç': 'C',
  'Ğ': 'G',
  'İ': 'I',
  'Ö': 'O',
  'Ş': 'S',
  'Ü': 'U'
};

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

export class PDFGenerator {
  private doc: jsPDF;
  private pageHeight: number;
  private currentY: number;
  private margin: number;
  private lineHeight: number;

  constructor() {
    this.doc = new jsPDF('p', 'mm', 'a4');
    this.pageHeight = this.doc.internal.pageSize.height;
    this.currentY = 20;
    this.margin = 20;
    this.lineHeight = 7;
    
    // Configure for Turkish text support
    this.setupTurkishSupport();
  }

  private setupTurkishSupport() {
    // Set font (using Helvetica as closest to Tahoma for web compatibility)
    this.doc.setFont('helvetica', 'normal');
  }

  private addText(text: string, fontSize: number = 10, style: 'normal' | 'bold' = 'normal', alignment: 'left' | 'center' | 'right' = 'left') {
    this.doc.setFontSize(fontSize);
    this.doc.setFont('helvetica', style);
    
    // Process Turkish characters
    const processedText = this.processTurkishText(text);
    
    if (this.currentY > this.pageHeight - 30) {
      this.addNewPage();
    }

    const textWidth = this.doc.internal.pageSize.width - (this.margin * 2);
    const lines = this.doc.splitTextToSize(processedText, textWidth);
    
    let x = this.margin;
    if (alignment === 'center') {
      x = this.doc.internal.pageSize.width / 2;
    } else if (alignment === 'right') {
      x = this.doc.internal.pageSize.width - this.margin;
    }

    this.doc.text(lines, x, this.currentY, { align: alignment });
    this.currentY += lines.length * this.lineHeight;
  }

  private processTurkishText(text: string): string {
    // For better Turkish character support, we'll use the original text
    // jsPDF has improved Unicode support in recent versions
    return text;
  }

  private addNewPage() {
    this.doc.addPage();
    this.currentY = 20;
  }

  private addHeader(reportData: ReportData) {
    // Logo/Company area
    this.doc.setFillColor(41, 128, 185);
    this.doc.rect(this.margin, 10, this.doc.internal.pageSize.width - (this.margin * 2), 25, 'F');
    
    this.doc.setTextColor(255, 255, 255);
    this.addText('İŞ SAĞLIĞI VE GÜVENLİĞİ RAPORU', 16, 'bold', 'center');
    this.currentY = 45;
    
    this.doc.setTextColor(0, 0, 0);
    
    // Report info
    this.addText(`Rapor No: ${reportData.reportNumber}`, 12, 'bold');
    this.addText(`Tarih: ${new Date(reportData.reportDate).toLocaleDateString('tr-TR')}`, 11);
    this.addText(`Konum: ${reportData.projectLocation}`, 11);
    this.addText(`Müfettiş: ${reportData.reporter}`, 11);
    this.currentY += 10;
  }

  private addSection(title: string, content: string) {
    // Section header with background
    this.doc.setFillColor(230, 230, 230);
    this.doc.rect(this.margin, this.currentY - 5, this.doc.internal.pageSize.width - (this.margin * 2), 10, 'F');
    
    this.addText(title, 12, 'bold');
    this.currentY += 5;
    
    if (content) {
      this.addText(content, 10);
      this.currentY += 5;
    }
  }

  private addFinding(finding: any, index: number) {
    // Finding header
    const riskColor = this.getRiskColor(finding.dangerLevel);
    this.doc.setFillColor(riskColor.r, riskColor.g, riskColor.b);
    this.doc.rect(this.margin, this.currentY - 3, this.doc.internal.pageSize.width - (this.margin * 2), 8, 'F');
    
    this.doc.setTextColor(255, 255, 255);
    this.addText(`${index + 1}. ${finding.title} - ${this.getRiskText(finding.dangerLevel)}`, 11, 'bold');
    this.doc.setTextColor(0, 0, 0);
    
    this.currentY += 3;
    
    // Finding content
    this.addText(`Mevcut Durum: ${finding.currentSituation}`, 10);
    if (finding.legalBasis) {
      this.addText(`Yasal Dayanak: ${finding.legalBasis}`, 10);
    }
    if (finding.recommendation) {
      this.addText(`Öneri: ${finding.recommendation}`, 10);
    }
    this.addText(`Durum: ${finding.isCompleted ? 'Tamamlandı' : 'Açık'}`, 10);
    
    this.currentY += 5;
  }

  private getRiskColor(level: string) {
    switch (level) {
      case 'high': return { r: 231, g: 76, b: 60 }; // Red
      case 'medium': return { r: 241, g: 196, b: 15 }; // Yellow
      case 'low': return { r: 46, g: 204, b: 113 }; // Green
      default: return { r: 149, g: 165, b: 166 }; // Gray
    }
  }

  private getRiskText(level: string): string {
    switch (level) {
      case 'high': return 'YÜKSEK RİSK';
      case 'medium': return 'ORTA RİSK';
      case 'low': return 'DÜŞÜK RİSK';
      default: return 'BELİRSİZ';
    }
  }

  private getStatusText(status: string): string {
    switch (status) {
      case 'open': return 'Açık';
      case 'in_progress': return 'Devam Ediyor';
      case 'completed': return 'Tamamlandı';
      default: return 'Bilinmiyor';
    }
  }

  public async generateReport(reportData: ReportData): Promise<Blob> {
    // Header
    this.addHeader(reportData);
    
    // Management Summary Section
    this.addSection('1. YÖNETİCİ ÖZETİ', reportData.managementSummary || '');
    
    // Design/Manufacturing Errors Section (Section 2)
    const designFindings = reportData.findings.filter(f => f.section === 2);
    if (designFindings.length > 0) {
      this.addSection('2. TASARIM/İMALAT/MONTAJ HATALARI', '');
      designFindings.forEach((finding, index) => {
        this.addFinding(finding, index);
      });
    }
    
    // Safety Findings Section (Section 3)
    const safetyFindings = reportData.findings.filter(f => f.section === 3);
    if (safetyFindings.length > 0) {
      this.addSection('3. İŞ SAĞLIĞI VE GÜVENLİĞİ BULGULARI', '');
      safetyFindings.forEach((finding, index) => {
        this.addFinding(finding, index);
      });
    }
    
    // Completed Findings Section (Section 4)
    const completedFindings = reportData.findings.filter(f => f.section === 4 || f.isCompleted);
    if (completedFindings.length > 0) {
      this.addSection('4. TAMAMLANMIŞ BULGULAR', '');
      completedFindings.forEach((finding, index) => {
        this.addFinding(finding, index);
      });
    }
    
    // General Evaluation Section
    this.addSection('5. GENEL DEĞERLENDİRME', reportData.generalEvaluation || '');
    
    // Footer
    this.currentY = this.pageHeight - 20;
    this.doc.setFontSize(8);
    this.doc.text(
      `Bu rapor ${new Date().toLocaleDateString('tr-TR')} tarihinde oluşturulmuştur.`,
      this.margin,
      this.currentY
    );
    
    // Return PDF as blob
    return new Promise((resolve) => {
      const pdfBlob = this.doc.output('blob');
      resolve(pdfBlob);
    });
  }

  public downloadReport(reportData: ReportData, filename?: string) {
    const fileName = filename || `isg_raporu_${reportData.id}_${new Date().toISOString().split('T')[0]}.pdf`;
    this.generateReport(reportData).then((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }
}

// Export utility function for easy use
export async function generateReportPDF(reportData: ReportData): Promise<Blob> {
  const generator = new PDFGenerator();
  return await generator.generateReport(reportData);
}

export function downloadReportPDF(reportData: ReportData, filename?: string) {
  const generator = new PDFGenerator();
  generator.downloadReport(reportData, filename);
}