import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

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

export class HTMLToPDFGenerator {
  async generateReport(reportData: ReportData): Promise<Blob> {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Generate cover page
    await this.addCoverPage(pdf, reportData);

    // Add management summary
    if (reportData.managementSummary) {
      pdf.addPage();
      await this.addManagementSummary(pdf, reportData.managementSummary);
    }

    // Add findings
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
          pdf.addPage();
          await this.addFindingPage(pdf, finding, findingCounter, section.title);
          findingCounter++;
        }
      }
    }

    // Add general evaluation
    if (reportData.generalEvaluation) {
      pdf.addPage();
      await this.addGeneralEvaluation(pdf, reportData.generalEvaluation);
    }

    return pdf.output('blob');
  }

  private async addCoverPage(pdf: jsPDF, reportData: ReportData): Promise<void> {
    const htmlContent = `
      <div style="width: 794px; height: 1123px; padding: 40px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: white; position: relative;">
        <!-- Header Line -->
        <div style="height: 6px; background: linear-gradient(90deg, #003366, #0066cc); margin-bottom: 40px; border-radius: 3px;"></div>
        
        <!-- Main Title -->
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #003366; font-size: 24px; font-weight: bold; margin: 0; line-height: 1.3;">
            İstinye Üniversite Topkapı Liv Hastanesi
          </h1>
          <h2 style="color: #003366; font-size: 18px; font-weight: 600; margin: 10px 0 0 0;">
            İş Sağlığı ve Güvenliği Saha Gözlem Raporu
          </h2>
        </div>

        <!-- Logo Section -->
        <div style="text-align: center; margin: 50px 0;">
          <div style="display: inline-flex; align-items: center; gap: 60px;">
            <!-- Left Logo Placeholder -->
            <div style="width: 120px; height: 80px; border: 2px dashed #cccccc; display: flex; align-items: center; justify-content: center; border-radius: 8px; background: #f8f9fa;">
              <span style="color: #666; font-size: 12px;">LOGO ALANI</span>
            </div>
            
            <!-- MLP Care Logo -->
            <div style="width: 120px; height: 80px; display: flex; align-items: center; justify-content: center; border-radius: 8px; background: #f8f9fa; border: 1px solid #e0e0e0;">
              <img src="/attached_assets/logo_1755548921510.jpg" style="max-width: 100px; max-height: 60px; object-fit: contain;" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
              <span style="color: #666; font-size: 12px; display: none;">MLP CARE</span>
            </div>
            
            <!-- Right Logo Placeholder -->
            <div style="width: 120px; height: 80px; border: 2px dashed #cccccc; display: flex; align-items: center; justify-content: center; border-radius: 8px; background: #f8f9fa; flex-direction: column;">
              <span style="color: #666; font-size: 11px;">HASTANE</span>
              <span style="color: #666; font-size: 11px;">LOGOSU</span>
            </div>
          </div>
        </div>

        <!-- Report Information -->
        <div style="margin-top: 80px;">
          <h3 style="color: #003366; font-size: 20px; font-weight: bold; margin-bottom: 30px; border-bottom: 2px solid #003366; padding-bottom: 10px;">
            RAPOR BİLGİLERİ
          </h3>
          
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="background: #f0f8ff; padding: 15px; border: 1px solid #ddd; font-weight: bold; color: #003366; width: 40%;">
                Rapor Numarası:
              </td>
              <td style="padding: 15px; border: 1px solid #ddd; color: #333;">
                ${reportData.reportNumber || '2025-001'}
              </td>
            </tr>
            <tr>
              <td style="background: #f0f8ff; padding: 15px; border: 1px solid #ddd; font-weight: bold; color: #003366;">
                Rapor Tarihi:
              </td>
              <td style="padding: 15px; border: 1px solid #ddd; color: #333;">
                ${reportData.reportDate || new Date().toLocaleDateString('tr-TR')}
              </td>
            </tr>
            <tr>
              <td style="background: #f0f8ff; padding: 15px; border: 1px solid #ddd; font-weight: bold; color: #003366;">
                Proje Lokasyonu:
              </td>
              <td style="padding: 15px; border: 1px solid #ddd; color: #333;">
                ${reportData.projectLocation || 'İstinye Üniversitesi Topkapı Liv Hastanesi'}
              </td>
            </tr>
            <tr>
              <td style="background: #f0f8ff; padding: 15px; border: 1px solid #ddd; font-weight: bold; color: #003366;">
                Raporlayan Uzman:
              </td>
              <td style="padding: 15px; border: 1px solid #ddd; color: #333;">
                ${reportData.reporter || 'Metin Salık'}
              </td>
            </tr>
            <tr>
              <td style="background: #f0f8ff; padding: 15px; border: 1px solid #ddd; font-weight: bold; color: #003366;">
                Toplam Bulgu Sayısı:
              </td>
              <td style="padding: 15px; border: 1px solid #ddd; color: #333;">
                ${reportData.findings?.length || 0}
              </td>
            </tr>
          </table>
        </div>

        <!-- Footer -->
        <div style="position: absolute; bottom: 40px; left: 40px; right: 40px;">
          <div style="height: 1px; background: #003366; margin-bottom: 20px;"></div>
          <p style="color: #666; font-size: 12px; margin: 0; text-align: center;">
            Bu rapor ${new Date().toLocaleDateString('tr-TR')} tarihinde oluşturulmuştur.
          </p>
        </div>
      </div>
    `;

    await this.addHtmlPageToPdf(pdf, htmlContent);
  }

  private async addManagementSummary(pdf: jsPDF, summary: string): Promise<void> {
    const htmlContent = `
      <div style="width: 794px; height: 1123px; padding: 40px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: white;">
        <!-- Header -->
        <div style="height: 4px; background: linear-gradient(90deg, #003366, #0066cc); margin-bottom: 30px; border-radius: 2px;"></div>
        
        <h1 style="color: #003366; font-size: 22px; font-weight: bold; margin-bottom: 30px; border-bottom: 2px solid #003366; padding-bottom: 10px;">
          YÖNETİCİ ÖZETİ
        </h1>
        
        <div style="font-size: 14px; line-height: 1.6; color: #333; text-align: justify;">
          ${summary.split('\n').map(paragraph => `<p style="margin-bottom: 15px;">${paragraph}</p>`).join('')}
        </div>
      </div>
    `;

    await this.addHtmlPageToPdf(pdf, htmlContent);
  }

  private async addFindingPage(pdf: jsPDF, finding: Finding, findingNumber: number, sectionTitle: string): Promise<void> {
    const riskColors = {
      'high': '#dc2626',
      'medium': '#f59e0b', 
      'low': '#22c55e'
    };

    const riskTexts = {
      'high': 'YÜKSEK RİSK',
      'medium': 'ORTA RİSK',
      'low': 'DÜŞÜK RİSK'
    };

    const htmlContent = `
      <div style="width: 794px; height: 1123px; padding: 40px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: white;">
        <!-- Header -->
        <div style="height: 4px; background: linear-gradient(90deg, #003366, #0066cc); margin-bottom: 20px; border-radius: 2px;"></div>
        
        <h1 style="color: #003366; font-size: 20px; font-weight: bold; margin-bottom: 30px;">
          BULGU ${findingNumber}: ${sectionTitle}
        </h1>

        <!-- Basic Info Table -->
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 25px;">
          <tr>
            <td style="background: #f0f8ff; padding: 12px; border: 1px solid #ddd; font-weight: bold; color: #003366; width: 40%;">
              Tespit Yeri/Konum:
            </td>
            <td style="padding: 12px; border: 1px solid #ddd; color: #333;">
              ${finding.location || finding.title}
            </td>
          </tr>
          <tr>
            <td style="background: #f0f8ff; padding: 12px; border: 1px solid #ddd; font-weight: bold; color: #003366;">
              Tespit Tarihi:
            </td>
            <td style="padding: 12px; border: 1px solid #ddd; color: #333;">
              ${new Date().toLocaleDateString('tr-TR')}
            </td>
          </tr>
        </table>

        <!-- Current Situation -->
        <div style="margin-bottom: 25px;">
          <h3 style="color: #003366; font-size: 16px; font-weight: bold; margin-bottom: 10px;">MEVCUT DURUM</h3>
          <p style="font-size: 13px; line-height: 1.5; color: #333; text-align: justify; margin: 0;">
            ${finding.description || 'Belirtilmemiş'}
          </p>
        </div>

        <!-- Legal Basis -->
        <div style="margin-bottom: 25px;">
          <h3 style="color: #003366; font-size: 16px; font-weight: bold; margin-bottom: 10px;">YASAL DAYANAK</h3>
          <p style="font-size: 13px; line-height: 1.5; color: #333; margin: 0;">
            İş Sağlığı ve Güvenliği Kanunu ve ilgili yönetmelikler
          </p>
        </div>

        <!-- Expert Opinion -->
        <div style="margin-bottom: 25px;">
          <h3 style="color: #003366; font-size: 16px; font-weight: bold; margin-bottom: 10px;">İSG UZMANI GÖRÜŞÜ</h3>
          <p style="font-size: 13px; line-height: 1.5; color: #333; text-align: justify; margin: 0;">
            ${finding.recommendation || 'Gerekli önlemler alınmalıdır.'}
          </p>
        </div>

        <!-- Photo Area -->
        <div style="margin-bottom: 25px;">
          <h3 style="color: #003366; font-size: 16px; font-weight: bold; margin-bottom: 10px;">FOTOĞRAF ALANI</h3>
          <div style="display: flex; gap: 15px;">
            <div style="width: 150px; height: 100px; border: 2px dashed #ccc; display: flex; align-items: center; justify-content: center; background: #f8f9fa; border-radius: 4px;">
              <span style="color: #666; font-size: 12px;">Fotoğraf 1</span>
            </div>
            <div style="width: 150px; height: 100px; border: 2px dashed #ccc; display: flex; align-items: center; justify-content: center; background: #f8f9fa; border-radius: 4px;">
              <span style="color: #666; font-size: 12px;">Fotoğraf 2</span>
            </div>
          </div>
        </div>

        <!-- Risk Level -->
        <div style="margin-bottom: 25px;">
          <div style="background: ${riskColors[finding.dangerLevel] || riskColors['medium']}; color: white; padding: 10px 20px; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 14px;">
            RİSK: ${riskTexts[finding.dangerLevel] || 'ORTA RİSK'}
          </div>
        </div>

        <!-- Process Management -->
        ${finding.processSteps && finding.processSteps.length > 0 ? `
          <div>
            <h3 style="color: #003366; font-size: 16px; font-weight: bold; margin-bottom: 15px;">SÜREÇ YÖNETİMİ</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
              <thead>
                <tr style="background: #f0f8ff;">
                  <th style="border: 1px solid #ddd; padding: 10px; text-align: left; color: #003366; font-weight: bold;">Faaliyet</th>
                  <th style="border: 1px solid #ddd; padding: 10px; text-align: left; color: #003366; font-weight: bold;">Hedef Tarih</th>
                  <th style="border: 1px solid #ddd; padding: 10px; text-align: left; color: #003366; font-weight: bold;">Sorumlu</th>
                  <th style="border: 1px solid #ddd; padding: 10px; text-align: left; color: #003366; font-weight: bold;">Durum</th>
                </tr>
              </thead>
              <tbody>
                ${finding.processSteps.map(step => `
                  <tr>
                    <td style="border: 1px solid #ddd; padding: 8px; color: #333;">${step.description}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; color: #333;">${step.targetDate}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; color: #333;">${step.responsible}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; color: #333;">${step.status}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : ''}
      </div>
    `;

    await this.addHtmlPageToPdf(pdf, htmlContent);
  }

  private async addGeneralEvaluation(pdf: jsPDF, evaluation: string): Promise<void> {
    const htmlContent = `
      <div style="width: 794px; height: 1123px; padding: 40px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: white;">
        <!-- Header -->
        <div style="height: 4px; background: linear-gradient(90deg, #003366, #0066cc); margin-bottom: 30px; border-radius: 2px;"></div>
        
        <h1 style="color: #003366; font-size: 22px; font-weight: bold; margin-bottom: 30px; border-bottom: 2px solid #003366; padding-bottom: 10px;">
          GENEL DEĞERLENDİRME
        </h1>
        
        <div style="font-size: 14px; line-height: 1.6; color: #333; text-align: justify;">
          ${evaluation.split('\n').map(paragraph => `<p style="margin-bottom: 15px;">${paragraph}</p>`).join('')}
        </div>
      </div>
    `;

    await this.addHtmlPageToPdf(pdf, htmlContent);
  }

  private async addHtmlPageToPdf(pdf: jsPDF, htmlContent: string): Promise<void> {
    // Create temporary div
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '-9999px';
    document.body.appendChild(tempDiv);

    try {
      // Generate canvas from HTML
      const canvas = await html2canvas(tempDiv.firstElementChild as HTMLElement, {
        width: 794,
        height: 1123,
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff'
      });

      // Add to PDF
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
      
    } finally {
      // Clean up
      document.body.removeChild(tempDiv);
    }
  }
}