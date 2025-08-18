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

// Türkçe karakter dönüşüm haritası - daha kapsamlı
const turkishCharMap: Record<string, string> = {
  'ç': 'c', 'Ç': 'C',
  'ğ': 'g', 'Ğ': 'G',
  'ı': 'i', 'İ': 'I',
  'ö': 'o', 'Ö': 'O',
  'ş': 's', 'Ş': 'S',
  'ü': 'u', 'Ü': 'U'
};

function fixTurkishText(text: string): string {
  return text.replace(/[çÇğĞıİöÖşŞüÜ]/g, (char) => turkishCharMap[char] || char);
}

export class ProfessionalPDFGenerator {
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
    
    // Türkçe karakter desteği için font ayarları
    this.doc.setFont('helvetica', 'normal');
    this.doc.setCharSpace(0);
  }

  private checkPageBreak(requiredSpace: number = 25) {
    if (this.currentY + requiredSpace > this.pageHeight - this.margin) {
      this.doc.addPage();
      this.currentY = this.margin;
    }
  }

  private safeText(text: string, x: number, y: number, options: {
    size?: number;
    style?: 'normal' | 'bold' | 'italic';
    color?: [number, number, number];
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

    if (!text || text.trim() === '') return 5;

    this.doc.setFontSize(size);
    this.doc.setFont('helvetica', style);
    this.doc.setTextColor(color[0], color[1], color[2]);

    // Türkçe karakterleri düzelt
    const fixedText = fixTurkishText(text);

    if (maxWidth) {
      const lines = this.doc.splitTextToSize(fixedText, maxWidth);
      for (let i = 0; i < lines.length; i++) {
        const lineY = y + (i * 5);
        if (align === 'center') {
          this.doc.text(lines[i], this.pageWidth / 2, lineY, { align: 'center' });
        } else if (align === 'right') {
          this.doc.text(lines[i], this.pageWidth - this.margin, lineY, { align: 'right' });
        } else {
          this.doc.text(lines[i], x, lineY);
        }
      }
      return lines.length * 5;
    } else {
      if (align === 'center') {
        this.doc.text(fixedText, this.pageWidth / 2, y, { align: 'center' });
      } else if (align === 'right') {
        this.doc.text(fixedText, this.pageWidth - this.margin, y, { align: 'right' });
      } else {
        this.doc.text(fixedText, x, y);
      }
      return 5;
    }
  }

  private addHeader() {
    // Ana header - koyu mavi arka plan
    this.doc.setFillColor(52, 73, 94); // Koyu mavi
    this.doc.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 20, 'F');
    
    // Başlık metni - beyaz renkte
    this.safeText('İŞ SAĞLIĞI VE GÜVENLİĞİ RAPORU', this.margin + 5, this.currentY + 12, {
      size: 16,
      style: 'bold',
      color: [255, 255, 255]
    });
    
    this.currentY += 25;
  }

  private addReportInfoTable(data: ReportData) {
    const tableY = this.currentY;
    const tableWidth = this.pageWidth - 2 * this.margin;
    const rowHeight = 8;
    
    // Tablo çerçevesi
    this.doc.setDrawColor(200, 200, 200);
    this.doc.setLineWidth(0.3);
    
    // İlk satır - Raporlayan
    this.doc.setFillColor(245, 245, 245);
    this.doc.rect(this.margin, tableY, tableWidth, rowHeight, 'FD');
    
    this.safeText('Raporlayan:', this.margin + 3, tableY + 5, { size: 10, style: 'bold' });
    this.safeText(data.reporter, this.margin + tableWidth/2 + 3, tableY + 5, { size: 10 });
    
    // İkinci satır - Rapor Tarihi ve Rapor No
    this.doc.rect(this.margin, tableY + rowHeight, tableWidth/2, rowHeight, 'D');
    this.doc.rect(this.margin + tableWidth/2, tableY + rowHeight, tableWidth/2, rowHeight, 'D');
    
    this.safeText('Rapor Tar.:', this.margin + 3, tableY + rowHeight + 5, { size: 10, style: 'bold' });
    this.safeText(new Date(data.reportDate).toLocaleDateString('tr-TR'), this.margin + 30, tableY + rowHeight + 5, { size: 10 });
    
    this.safeText('Rapor No:', this.margin + tableWidth/2 + 3, tableY + rowHeight + 5, { size: 10, style: 'bold' });
    this.safeText(data.reportNumber, this.margin + tableWidth/2 + 25, tableY + rowHeight + 5, { size: 10 });
    
    this.currentY = tableY + 2 * rowHeight + 10;
  }

  private addFinding(finding: any, index: number) {
    this.checkPageBreak(100);
    
    const startY = this.currentY;
    
    // Başlık - bulgu numarası ve ismi
    this.safeText(`${index + 1}. ${finding.title || 'Yangın Kapıları ve Manyetik Tutucullar'}`, 
      this.margin, this.currentY, {
      size: 12,
      style: 'bold'
    });
    this.currentY += 10;
    
    // İki sütunlu düzen
    const imageX = this.margin;
    const imageWidth = 70;
    const imageHeight = 90;
    const contentX = imageX + imageWidth + 8;
    const contentWidth = this.pageWidth - contentX - this.margin;
    
    // Resim alanı - gri arka plan
    this.doc.setFillColor(230, 230, 230);
    this.doc.rect(imageX, this.currentY, imageWidth, imageHeight, 'F');
    this.doc.setDrawColor(180, 180, 180);
    this.doc.setLineWidth(0.5);
    this.doc.rect(imageX, this.currentY, imageWidth, imageHeight, 'D');
    
    // Kırmızı ok işareti ekle
    this.doc.setFillColor(220, 38, 38);
    const arrowX = imageX + imageWidth/2;
    const arrowY = this.currentY + imageHeight/2;
    this.doc.triangle(arrowX - 8, arrowY, arrowX + 8, arrowY - 5, arrowX + 8, arrowY + 5, 'F');
    
    // İçerik alanı
    let contentY = this.currentY;
    
    // Tespit Tarihi
    this.safeText('Tespit Tarihi:', contentX, contentY, { size: 9, style: 'bold' });
    this.safeText(new Date().toLocaleDateString('tr-TR'), contentX + 30, contentY, { size: 9 });
    contentY += 8;
    
    // Mevcut Durum
    this.safeText('Mevcut Durum:', contentX, contentY, { size: 9, style: 'bold' });
    contentY += 6;
    
    const situationText = finding.currentSituation || 
      'Medikal gaz sistem odasında FM-200 basınlı hava tamamlanmamış durumdadır.';
    const situationHeight = this.safeText(situationText, contentX, contentY, { 
      size: 9, 
      maxWidth: contentWidth 
    });
    contentY += situationHeight + 8;
    
    // Dayanak
    this.safeText('Dayanak:', contentX, contentY, { size: 9, style: 'bold' });
    contentY += 6;
    this.safeText('Binaların Yangından Korunması Hakkında Yönetmelik: TS EN 1634-3', 
      contentX, contentY, { size: 9, maxWidth: contentWidth });
    contentY += 12;
    
    // İGÜ Görüşü
    this.safeText('İGÜ Görüşü:', contentX, contentY, { size: 9, style: 'bold' });
    contentY += 6;
    
    const recommendationText = finding.recommendation || 
      'FM-200 gazlı söndürme sistemi devreye alınmalıdır.';
    this.safeText(recommendationText, contentX, contentY, { 
      size: 9, 
      maxWidth: contentWidth 
    });
    
    this.currentY = Math.max(this.currentY + imageHeight, contentY + 20);
    
    // Tedbir Skalası tablosu
    this.addActionTable();
  }

  private addActionTable() {
    const tableY = this.currentY;
    const tableWidth = this.pageWidth - 2 * this.margin;
    const headerHeight = 10;
    const rowHeight = 8;
    
    // Yeşil header
    this.doc.setFillColor(34, 197, 94);
    this.doc.rect(this.margin, tableY, tableWidth, headerHeight, 'F');
    this.safeText('Tedbike Skalası', this.margin + 5, tableY + 7, {
      size: 11,
      style: 'bold',
      color: [255, 255, 255]
    });
    
    // Tablo başlıkları
    this.doc.setFillColor(245, 245, 245);
    this.doc.setDrawColor(200, 200, 200);
    this.doc.rect(this.margin, tableY + headerHeight, tableWidth, rowHeight, 'FD');
    
    this.safeText('Süreç Yönetimi', this.margin + 3, tableY + headerHeight + 6, { 
      size: 9, 
      style: 'bold' 
    });
    this.safeText('Açıklama', this.margin + tableWidth/2 + 3, tableY + headerHeight + 6, { 
      size: 9, 
      style: 'bold' 
    });
    
    // Veri satırı
    this.doc.setFillColor(255, 255, 255);
    this.doc.rect(this.margin, tableY + headerHeight + rowHeight, tableWidth, rowHeight, 'FD');
    
    this.safeText('Tarih', this.margin + 3, tableY + headerHeight + rowHeight + 6, { size: 9 });
    this.safeText('01.08.2025', this.margin + 20, tableY + headerHeight + rowHeight + 6, { size: 9 });
    
    const actionText = 'Kapı koridor geçişlerinde bulunan yangın kapıları montajı ve açılışları yapılıyor ve tamamlanıyor.';
    this.safeText(actionText, this.margin + tableWidth/2 + 3, tableY + headerHeight + rowHeight + 6, { 
      size: 9, 
      maxWidth: tableWidth/2 - 10 
    });
    
    this.currentY = tableY + headerHeight + 2 * rowHeight + 15;
  }

  private addManagementSummary(summary: string) {
    this.checkPageBreak(30);
    
    this.safeText('YÖNETİCİ ÖZETİ', this.margin, this.currentY, {
      size: 14,
      style: 'bold'
    });
    this.currentY += 12;
    
    const summaryText = summary || 'Yangın Güvenlik Eksiklikleri: Yangın tüpleri, batariyeler ve FM-200 yangın söndürme sistemleri birçok alanda eksik tespit edilmiştir. Yangın dolaplarının bazı lantı noktaları hatalı ve kapaklar uygun değil. Bu durum acil durumlarda ciddi risk oluşturmaktadır.';
    
    this.safeText(summaryText, this.margin, this.currentY, {
      size: 10,
      maxWidth: this.pageWidth - 2 * this.margin
    });
    
    this.currentY += 25;
  }

  private addGeneralEvaluation(evaluation: string) {
    this.checkPageBreak(30);
    
    this.safeText('GENEL DEĞERLENDİRME', this.margin, this.currentY, {
      size: 14,
      style: 'bold'
    });
    this.currentY += 12;
    
    const evalText = evaluation || 'Tespit edilen eksikliklerin ivedilikle giderilmesi ve düzenli kontrollerin yapılması önerilmektedir.';
    
    this.safeText(evalText, this.margin, this.currentY, {
      size: 10,
      maxWidth: this.pageWidth - 2 * this.margin
    });
  }

  public async generateReport(reportData: ReportData): Promise<Blob> {
    // Header ekle
    this.addHeader();
    
    // Rapor bilgileri tablosu
    this.addReportInfoTable(reportData);
    
    // Bulgular (sadece section 2 ve 3)
    const relevantFindings = reportData.findings.filter(f => 
      f.section === 2 || f.section === 3
    );
    
    relevantFindings.forEach((finding, index) => {
      this.addFinding(finding, index);
    });
    
    // Yönetici özeti
    if (reportData.managementSummary) {
      this.addManagementSummary(reportData.managementSummary);
    }
    
    // Genel değerlendirme
    if (reportData.generalEvaluation) {
      this.addGeneralEvaluation(reportData.generalEvaluation);
    }
    
    return new Promise((resolve) => {
      const pdfBlob = this.doc.output('blob');
      resolve(pdfBlob);
    });
  }
}

export const downloadProfessionalReportPDF = async (reportData: ReportData) => {
  const generator = new ProfessionalPDFGenerator();
  const pdfBlob = await generator.generateReport(reportData);
  
  const url = URL.createObjectURL(pdfBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `ISG_Rapor_${reportData.reportNumber}_${new Date().toLocaleDateString('tr-TR').replace(/\./g, '_')}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};