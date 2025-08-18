import jsPDF from 'jspdf';
import logoPath from '@assets/logo_1755544106935.jpg';
import coverImagePath from '@assets/image_1755544198442.png';
import hospitalImagePath from '@assets/image_1755544216251.png';

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
    
    // UTF-8 encoding ayarları
    this.doc.setFont('helvetica', 'normal');
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
      maxWidth = this.pageWidth - (this.margin * 2)
    } = options;

    this.doc.setFontSize(size);
    this.doc.setFont('helvetica', style);
    this.doc.setTextColor(color[0], color[1], color[2]);

    // Türkçe karakter desteği için encoding
    const encodedText = this.encodeTurkishText(text);
    
    if (maxWidth && this.doc.getTextWidth(encodedText) > maxWidth) {
      const lines = this.doc.splitTextToSize(encodedText, maxWidth);
      
      if (align === 'center') {
        x = this.pageWidth / 2;
      } else if (align === 'right') {
        x = this.pageWidth - this.margin;
      }

      lines.forEach((line: string, index: number) => {
        this.doc.text(line, x, y + (index * size * 0.4), { align });
      });
      
      return lines.length * size * 0.4;
    } else {
      if (align === 'center') {
        x = this.pageWidth / 2;
      } else if (align === 'right') {
        x = this.pageWidth - this.margin;
      }

      this.doc.text(encodedText, x, y, { align });
      return size * 0.4;
    }
  }

  private encodeTurkishText(text: string): string {
    // jsPDF ile Türkçe karakterler için özel işlem
    // Metni düzgün gösterebilmek için encode ediyoruz
    try {
      return decodeURIComponent(escape(text));
    } catch (error) {
      // Fallback: Türkçe karakterleri İngilizce eşdeğerleri ile değiştir
      const turkishMap: { [key: string]: string } = {
        'ç': 'c', 'Ç': 'C',
        'ğ': 'g', 'Ğ': 'G', 
        'ı': 'i', 'İ': 'I',
        'ö': 'o', 'Ö': 'O',
        'ş': 's', 'Ş': 'S',
        'ü': 'u', 'Ü': 'U'
      };
      
      return text.replace(/[çÇğĞıİöÖşŞüÜ]/g, (char) => turkishMap[char] || char);
    }
  }

  private async loadImageAsBase64(imagePath: string): Promise<string> {
    try {
      const response = await fetch(imagePath);
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Image loading error:', error);
      return '';
    }
  }

  private async addCoverPage(reportData: ReportData) {
    // Beyaz arka plan
    this.doc.setFillColor(255, 255, 255);
    this.doc.rect(0, 0, this.pageWidth, this.pageHeight, 'F');

    // Logo (sol üst köşe)
    try {
      const logo = await this.loadImageAsBase64(logoPath);
      if (logo) {
        this.doc.addImage(logo, 'JPG', this.margin, this.margin, 60, 25, '', 'FAST');
      }
    } catch (error) {
      console.error('Logo error:', error);
    }

    // Gri alan (sağ taraf)
    this.doc.setFillColor(170, 170, 170);
    this.doc.rect(this.pageWidth / 2, 0, this.pageWidth / 2, this.pageHeight, 'F');

    // Yıl (gri alanda)
    this.safeText('2025', this.pageWidth - 50, 80, {
      size: 48,
      style: 'bold',
      color: [255, 255, 255],
      align: 'center'
    });

    // Siyah başlık çubuğu
    this.doc.setFillColor(0, 0, 0);
    this.doc.rect(0, 130, this.pageWidth, 25, 'F');

    // Ana başlık (siyah çubukta beyaz yazı)
    this.safeText('İstinye Üniversite Topkapı Liv Hastanesi', this.pageWidth / 2, 143, {
      size: 12,
      style: 'bold',
      color: [255, 255, 255],
      align: 'center'
    });

    // Alt başlık
    this.safeText('İş Sağlığı ve Güvenliği Saha Gözlem Raporu', this.pageWidth / 2, 148, {
      size: 10,
      style: 'bold',
      color: [255, 255, 255],
      align: 'center'
    });

    // Hastane görseli (orta kısım)
    try {
      const hospitalImage = await this.loadImageAsBase64(hospitalImagePath);
      if (hospitalImage) {
        this.doc.addImage(hospitalImage, 'PNG', 20, 170, this.pageWidth - 120, 100, '', 'FAST');
      }
    } catch (error) {
      console.error('Hospital image error:', error);
    }

    // Alt bilgiler (gri alanda)
    this.safeText('Meslek Salk. - İş Güvenliği Uzmanı (A)', this.pageWidth - 30, this.pageHeight - 40, {
      size: 8,
      color: [255, 255, 255],
      align: 'right'
    });
    
    this.safeText('İSG Toplantısı Liv Hastanesi', this.pageWidth - 30, this.pageHeight - 30, {
      size: 8,
      color: [255, 255, 255],
      align: 'right'
    });
    
    this.safeText(new Date().toLocaleDateString('tr-TR'), this.pageWidth - 30, this.pageHeight - 20, {
      size: 8,
      color: [255, 255, 255],
      align: 'right'
    });
  }

  private addTableOfContents(reportData: ReportData) {
    this.safeText('İÇİNDEKİLER', this.margin, this.currentY, {
      size: 16,
      style: 'bold'
    });
    this.currentY += 15;

    const contents = [
      'YÖNETİCİ ÖZETİ',
      'TASARIM/İMALAT/MONTAJ HATALARI',
      'İŞ SAĞLIĞI VE GÜVENLİĞİ BULGULARI',
      'TAMAMLANMIŞ BULGULAR',
      'GENEL DEĞERLENDİRME'
    ];

    contents.forEach((item, index) => {
      this.safeText(`${index + 1}. ${item}`, this.margin + 5, this.currentY, {
        size: 10
      });
      this.currentY += 8;
    });
  }

  private addSection(title: string, content: string) {
    this.safeText(title, this.margin, this.currentY, {
      size: 14,
      style: 'bold'
    });
    this.currentY += 10;

    this.safeText(content, this.margin, this.currentY, {
      size: 10,
      maxWidth: this.pageWidth - (this.margin * 2)
    });
    this.currentY += 20;
  }

  private async addFindingsSections(reportData: ReportData) {
    const sectionTitles = {
      2: 'TASARIM/İMALAT/MONTAJ HATALARI',
      3: 'İŞ SAĞLIĞI VE GÜVENLİĞİ BULGULARI',
      4: 'TAMAMLANMIŞ BULGULAR'
    };

    // Her bölüm için ayrı sayfa
    for (const sectionNum of [2, 3, 4]) {
      const sectionFindings = reportData.findings.filter(f => 
        sectionNum === 4 ? f.isCompleted : f.section === sectionNum && !f.isCompleted
      );

      if (sectionFindings.length > 0) {
        this.doc.addPage();
        this.currentY = this.margin;
        
        this.safeText(sectionTitles[sectionNum as keyof typeof sectionTitles] || `BÖLÜM ${sectionNum}`, 
          this.margin, this.currentY, {
            size: 14,
            style: 'bold'
          });
        this.currentY += 15;

        // Her bulguyu ayrı sayfada göster
        for (let i = 0; i < sectionFindings.length; i++) {
          if (i > 0) {
            this.doc.addPage();
            this.currentY = this.margin;
          }
          
          await this.addFinding(sectionFindings[i], i + 1);
        }
      }
    }
  }

  private async addFinding(finding: any, index: number) {
    // Başlık
    this.safeText(`${index}. ${finding.title}`, this.margin, this.currentY, {
      size: 12,
      style: 'bold'
    });
    this.currentY += 10;

    // Risk seviyesi
    const riskColors = {
      high: [220, 38, 38],
      medium: [234, 88, 12], 
      low: [34, 197, 94]
    };
    
    const riskTexts = {
      high: 'YÜKSEK RİSK',
      medium: 'ORTA RİSK',
      low: 'DÜŞÜK RİSK'
    };

    const riskText = riskTexts[finding.dangerLevel as keyof typeof riskTexts];
    const riskColor = riskColors[finding.dangerLevel as keyof typeof riskColors];
    
    this.safeText(riskText, this.margin, this.currentY, {
      size: 10,
      style: 'bold',
      color: riskColor as [number, number, number]
    });
    this.currentY += 8;

    // Mevcut durum
    this.safeText('Mevcut Durum:', this.margin, this.currentY, {
      size: 10,
      style: 'bold'
    });
    this.currentY += 5;

    const situationHeight = this.safeText(finding.currentSituation, this.margin, this.currentY, {
      size: 9,
      maxWidth: this.pageWidth - (this.margin * 2)
    });
    this.currentY += situationHeight + 5;

    // Yasal dayanak
    if (finding.legalBasis) {
      this.safeText('Yasal Dayanak:', this.margin, this.currentY, {
        size: 10,
        style: 'bold'
      });
      this.currentY += 5;

      const basisHeight = this.safeText(finding.legalBasis, this.margin, this.currentY, {
        size: 9,
        maxWidth: this.pageWidth - (this.margin * 2)
      });
      this.currentY += basisHeight + 5;
    }

    // Öneri
    if (finding.recommendation) {
      this.safeText('Öneri:', this.margin, this.currentY, {
        size: 10,
        style: 'bold'
      });
      this.currentY += 5;

      const recommendationHeight = this.safeText(finding.recommendation, this.margin, this.currentY, {
        size: 9,
        maxWidth: this.pageWidth - (this.margin * 2)
      });
      this.currentY += recommendationHeight + 5;
    }

    // Süreç adımları
    if (finding.processSteps && finding.processSteps.length > 0) {
      this.safeText('Süreç Adımları:', this.margin, this.currentY, {
        size: 10,
        style: 'bold'
      });
      this.currentY += 5;

      finding.processSteps.forEach((step: any, stepIndex: number) => {
        const stepText = `${stepIndex + 1}. ${step.date}: ${step.description}`;
        const stepHeight = this.safeText(stepText, this.margin + 5, this.currentY, {
          size: 9,
          maxWidth: this.pageWidth - (this.margin * 2) - 5
        });
        this.currentY += stepHeight + 3;
      });
    }

    // Durum
    const statusText = finding.isCompleted ? 'TAMAMLANDI ✓' : 'DEVAM EDİYOR';
    const statusColor = finding.isCompleted ? [34, 197, 94] : [234, 88, 12];
    
    this.safeText(statusText, this.margin, this.currentY, {
      size: 10,
      style: 'bold',
      color: statusColor as [number, number, number]
    });
  }

  async generateReport(reportData: ReportData): Promise<Blob> {
    try {
      console.log('Generating PDF report...', reportData);
      
      // Kapak sayfası
      await this.addCoverPage(reportData);
      
      // Yeni sayfa - İçindekiler
      this.doc.addPage();
      this.currentY = this.margin;
      this.addTableOfContents(reportData);
      
      // Yönetici özeti
      if (reportData.managementSummary) {
        this.doc.addPage();
        this.currentY = this.margin;
        this.addSection('YÖNETİCİ ÖZETİ', reportData.managementSummary);
      }
      
      // Bulgular bölümleri - Her bulgu ayrı sayfa
      await this.addFindingsSections(reportData);
      
      // Genel değerlendirme
      if (reportData.generalEvaluation) {
        this.doc.addPage();
        this.currentY = this.margin;
        this.addSection('GENEL DEĞERLENDİRME', reportData.generalEvaluation);
      }
      
      const pdfBlob = this.doc.output('blob');
      console.log('PDF generated successfully');
      return pdfBlob;
      
    } catch (error) {
      console.error('PDF generation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      throw new Error('PDF oluşturulamadı: ' + errorMessage);
    }
  }
}

export async function generateProfessionalPDF(
  report: any,
  findings: any[]
): Promise<Blob> {
  const generator = new ProfessionalPDFGenerator();
  
  const reportData: ReportData = {
    id: report.id,
    reportNumber: report.reportNumber,
    reportDate: new Date(report.createdAt).toLocaleDateString('tr-TR'),
    projectLocation: report.projectLocation,
    reporter: report.inspectorName,
    managementSummary: report.managementSummary,
    generalEvaluation: report.generalEvaluation,
    findings: findings.map(f => ({
      id: f.id,
      title: f.title,
      section: f.section,
      currentSituation: f.currentSituation,
      dangerLevel: f.dangerLevel,
      recommendation: f.recommendation,
      legalBasis: f.legalBasis,
      images: f.images,
      isCompleted: f.isCompleted,
      processSteps: f.processSteps
    }))
  };

  return generator.generateReport(reportData);
}