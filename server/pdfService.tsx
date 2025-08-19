import puppeteer from 'puppeteer';
import { readFileSync } from 'fs';
import { join } from 'path';

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

  private getRiskBadgeColor(level: string): string {
    switch (level) {
      case 'high': return '#dc2626';
      case 'medium': return '#ea580c';
      case 'low': return '#16a34a';
      default: return '#ea580c';
    }
  }

  private getRiskText(level: string): string {
    switch (level) {
      case 'high': return 'YÜKSEK RİSK';
      case 'medium': return 'ORTA RİSK';
      case 'low': return 'DÜŞÜK RİSK';
      default: return 'ORTA RİSK';
    }
  }

  private generateHTMLReport(reportData: ReportData): string {
    const formatDate = (date: string | Date): string => {
      return typeof date === 'string' ? date : new Date(date).toLocaleDateString('tr-TR');
    };

    const designErrors = reportData.findings?.filter(f => f.section === 1) || [];
    const safetyFindings = reportData.findings?.filter(f => f.section === 2 || f.section === 3) || [];
    const completedFindings = reportData.findings?.filter(f => f.isCompleted || f.status === 'completed') || [];

    return `
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>İSG Raporu ${reportData.reportNumber}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            line-height: 1.4;
            color: #374151;
            background: white;
        }
        
        .page {
            width: 210mm;
            min-height: 297mm;
            padding: 15mm;
            margin: 0 auto;
            background: white;
            page-break-after: always;
            position: relative;
        }
        
        .page:last-child {
            page-break-after: auto;
        }
        
        .header {
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            margin: -15mm -15mm 20mm -15mm;
            padding: 15mm;
            color: white;
            display: flex;
            align-items: center;
            gap: 15px;
        }
        
        .logo {
            width: 80px;
            height: auto;
        }
        
        .header-text h1 {
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 5px;
        }
        
        .header-text h2 {
            font-size: 18px;
            font-weight: 500;
            opacity: 0.9;
        }
        
        .cover-title {
            text-align: center;
            margin: 40mm 0;
        }
        
        .cover-title h1 {
            font-size: 32px;
            font-weight: 700;
            color: #2563eb;
            margin-bottom: 10px;
        }
        
        .cover-title h2 {
            font-size: 28px;
            font-weight: 600;
            color: #2563eb;
            margin-bottom: 20px;
        }
        
        .cover-subtitle {
            font-size: 20px;
            color: #6b7280;
            margin-bottom: 40px;
        }
        
        .info-table {
            width: 100%;
            max-width: 500px;
            margin: 0 auto;
            border-collapse: collapse;
        }
        
        .info-table tr {
            border-bottom: 1px solid #e5e7eb;
        }
        
        .info-table td {
            padding: 12px 0;
            font-size: 14px;
        }
        
        .info-table td:first-child {
            font-weight: 600;
            color: #2563eb;
            width: 40%;
        }
        
        .section-title {
            background: #2563eb;
            color: white;
            padding: 15px;
            font-size: 16px;
            font-weight: 700;
            text-align: center;
            margin: 20px 0;
        }
        
        .section-content {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 20px;
            margin-bottom: 25px;
            border-radius: 8px;
        }
        
        .section-content p {
            font-size: 12px;
            line-height: 1.6;
            text-align: justify;
        }
        
        .finding {
            border: 1px solid #d1d5db;
            border-radius: 8px;
            margin-bottom: 25px;
            overflow: hidden;
        }
        
        .finding-header {
            background: #f3f4f6;
            padding: 15px;
            border-bottom: 1px solid #d1d5db;
        }
        
        .finding-title {
            font-size: 14px;
            font-weight: 700;
            color: #111827;
            margin-bottom: 8px;
        }
        
        .finding-meta {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 10px;
        }
        
        .finding-location {
            font-size: 11px;
            color: #6b7280;
        }
        
        .risk-badge {
            padding: 6px 12px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 700;
            color: white;
        }
        
        .finding-content {
            padding: 15px;
        }
        
        .field-label {
            font-size: 12px;
            font-weight: 700;
            color: #2563eb;
            margin-bottom: 6px;
            margin-top: 15px;
        }
        
        .field-label:first-child {
            margin-top: 0;
        }
        
        .field-text {
            font-size: 11px;
            line-height: 1.5;
            color: #374151;
            margin-bottom: 10px;
            text-align: justify;
        }
        
        .process-steps {
            margin-top: 10px;
        }
        
        .process-step {
            font-size: 10px;
            margin-bottom: 4px;
            padding-left: 15px;
            position: relative;
        }
        
        .process-step:before {
            content: "•";
            position: absolute;
            left: 0;
            color: #2563eb;
        }
        
        .photos-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 15px;
        }
        
        .photo-item img {
            width: 100%;
            height: auto;
            max-height: 150px;
            object-fit: cover;
            border-radius: 6px;
            border: 1px solid #e5e7eb;
        }
        
        .footer {
            position: absolute;
            bottom: 15mm;
            left: 15mm;
            right: 15mm;
            border-top: 1px solid #e5e7eb;
            padding-top: 10px;
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            color: #6b7280;
        }
        
        .footer-note {
            text-align: center;
            font-size: 11px;
            color: #6b7280;
            margin-top: 30px;
            font-style: italic;
        }
        
        @media print {
            .page {
                margin: 0;
                box-shadow: none;
            }
        }
    </style>
</head>
<body>
    <!-- COVER PAGE -->
    <div class="page">
        <div class="header">
            ${this.logoBase64 ? `<img src="${this.logoBase64}" alt="MLPCARE Logo" class="logo">` : ''}
            <div class="header-text">
                <h1>MLPCARE</h1>
                <h2>Medical Park Hospital</h2>
            </div>
        </div>
        
        <div class="cover-title">
            <h1>İŞ SAĞLIĞI VE GÜVENLİĞİ</h1>
            <h2>SAHA GÖZLEM RAPORU</h2>
            <div class="cover-subtitle">${reportData.projectLocation}</div>
        </div>
        
        <table class="info-table">
            <tr>
                <td>Rapor Numarası:</td>
                <td>${reportData.reportNumber}</td>
            </tr>
            <tr>
                <td>Rapor Tarihi:</td>
                <td>${formatDate(reportData.reportDate)}</td>
            </tr>
            <tr>
                <td>Proje Lokasyonu:</td>
                <td>${reportData.projectLocation}</td>
            </tr>
            <tr>
                <td>İSG Uzmanı:</td>
                <td>${reportData.reporter}</td>
            </tr>
            <tr>
                <td>Toplam Bulgu:</td>
                <td>${reportData.findings?.length || 0}</td>
            </tr>
        </table>
        
        <div class="footer-note">
            Bu rapor İş Sağlığı ve Güvenliği Kanunu kapsamında hazırlanmıştır.
        </div>
        
        <div class="footer">
            <span>MLPCARE Medical Park Hospital - İSG Raporu</span>
            <span>Sayfa 1</span>
        </div>
    </div>

    <!-- YÖNETİCİ ÖZETİ -->
    <div class="page">
        <div class="header">
            ${this.logoBase64 ? `<img src="${this.logoBase64}" alt="MLPCARE Logo" class="logo">` : ''}
            <div class="header-text">
                <h1>MLPCARE</h1>
                <h2>YÖNETİCİ ÖZETİ</h2>
            </div>
        </div>
        
        <div class="section-title">YÖNETİCİ ÖZETİ</div>
        
        <div class="section-content">
            <p>${reportData.managementSummary || 'Yönetici özeti henüz eklenmemiştir.'}</p>
        </div>
        
        <div class="footer">
            <span>MLPCARE Medical Park Hospital - İSG Raporu</span>
            <span>Sayfa 2</span>
        </div>
    </div>

    <!-- TASARIM/İMALAT/MONTAJ HATALARI -->
    <div class="page">
        <div class="header">
            ${this.logoBase64 ? `<img src="${this.logoBase64}" alt="MLPCARE Logo" class="logo">` : ''}
            <div class="header-text">
                <h1>MLPCARE</h1>
                <h2>TASARIM/İMALAT/MONTAJ HATALARI</h2>
            </div>
        </div>
        
        <div class="section-title">TASARIM/İMALAT/MONTAJ HATALARI</div>
        
        ${designErrors.length === 0 ? 
            '<div class="section-content"><p>Bu bölümde herhangi bir bulgu tespit edilmemiştir.</p></div>' :
            designErrors.map((finding, index) => this.generateFindingHTML(finding, index + 1)).join('')
        }
        
        <div class="footer">
            <span>MLPCARE Medical Park Hospital - İSG Raporu</span>
            <span>Sayfa 3</span>
        </div>
    </div>

    <!-- İŞ SAĞLIĞI VE GÜVENLİĞİ BULGULARI -->
    <div class="page">
        <div class="header">
            ${this.logoBase64 ? `<img src="${this.logoBase64}" alt="MLPCARE Logo" class="logo">` : ''}
            <div class="header-text">
                <h1>MLPCARE</h1>
                <h2>İŞ SAĞLIĞI VE GÜVENLİĞİ BULGULARI</h2>
            </div>
        </div>
        
        <div class="section-title">İŞ SAĞLIĞI VE GÜVENLİĞİ BULGULARI</div>
        
        ${safetyFindings.length === 0 ? 
            '<div class="section-content"><p>Bu bölümde herhangi bir bulgu tespit edilmemiştir.</p></div>' :
            safetyFindings.map((finding, index) => this.generateFindingHTML(finding, index + 1)).join('')
        }
        
        <div class="footer">
            <span>MLPCARE Medical Park Hospital - İSG Raporu</span>
            <span>Sayfa 4</span>
        </div>
    </div>

    <!-- TAMAMLANMIŞ BULGULAR -->
    <div class="page">
        <div class="header">
            ${this.logoBase64 ? `<img src="${this.logoBase64}" alt="MLPCARE Logo" class="logo">` : ''}
            <div class="header-text">
                <h1>MLPCARE</h1>
                <h2>TAMAMLANMIŞ BULGULAR</h2>
            </div>
        </div>
        
        <div class="section-title">TAMAMLANMIŞ BULGULAR</div>
        
        ${completedFindings.length === 0 ? 
            '<div class="section-content"><p>Henüz tamamlanan bulgu bulunmamaktadır.</p></div>' :
            completedFindings.map((finding, index) => this.generateFindingHTML(finding, index + 1)).join('')
        }
        
        <div class="footer">
            <span>MLPCARE Medical Park Hospital - İSG Raporu</span>
            <span>Sayfa 5</span>
        </div>
    </div>

    <!-- GENEL DEĞERLENDİRME -->
    <div class="page">
        <div class="header">
            ${this.logoBase64 ? `<img src="${this.logoBase64}" alt="MLPCARE Logo" class="logo">` : ''}
            <div class="header-text">
                <h1>MLPCARE</h1>
                <h2>GENEL DEĞERLENDİRME</h2>
            </div>
        </div>
        
        <div class="section-title">GENEL DEĞERLENDİRME</div>
        
        <div class="section-content">
            <p>${reportData.generalEvaluation || 'Genel değerlendirme henüz eklenmemiştir.'}</p>
        </div>
        
        <div class="footer">
            <span>MLPCARE Medical Park Hospital - İSG Raporu</span>
            <span>Sayfa 6</span>
        </div>
    </div>
</body>
</html>`;
  }

  private generateFindingHTML(finding: Finding, findingNumber: number): string {
    const riskColor = this.getRiskBadgeColor(finding.dangerLevel);
    const riskText = this.getRiskText(finding.dangerLevel);

    return `
        <div class="finding">
            <div class="finding-header">
                <div class="finding-title">BULGU ${findingNumber}: ${finding.title}</div>
                <div class="finding-meta">
                    <div class="finding-location">Konum: ${finding.location || 'Belirtilmemiş'}</div>
                    <div class="risk-badge" style="background-color: ${riskColor};">${riskText}</div>
                </div>
            </div>
            <div class="finding-content">
                <div class="field-label">Mevcut Durum:</div>
                <div class="field-text">${finding.currentSituation || finding.description}</div>
                
                ${finding.legalBasis ? `
                    <div class="field-label">Hukuki Dayanak:</div>
                    <div class="field-text">${finding.legalBasis}</div>
                ` : ''}
                
                ${finding.recommendation ? `
                    <div class="field-label">Öneri/Çözüm:</div>
                    <div class="field-text">${finding.recommendation}</div>
                ` : ''}
                
                ${finding.processSteps && finding.processSteps.length > 0 ? `
                    <div class="field-label">Süreç Skalası:</div>
                    <div class="process-steps">
                        ${finding.processSteps.map(step => `
                            <div class="process-step">${step.date}: ${step.description}</div>
                        `).join('')}
                    </div>
                ` : ''}
                
                ${finding.images && finding.images.length > 0 ? `
                    <div class="field-label">Fotoğraflar:</div>
                    <div class="photos-grid">
                        ${finding.images.map(image => `
                            <div class="photo-item">
                                <img src="${image}" alt="Bulgu fotoğrafı" />
                            </div>
                        `).join('')}
                    </div>
                    <div class="field-text">${finding.images.length} adet fotoğraf eklenmiştir.</div>
                ` : ''}
            </div>
        </div>`;
  }

  async generatePDF(reportData: ReportData): Promise<Uint8Array> {
    console.log('PDF generating for report:', reportData.reportNumber);

    const html = this.generateHTMLReport(reportData);
    
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });

    try {
      const page = await browser.newPage();
      
      await page.setContent(html, { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '0mm',
          right: '0mm',
          bottom: '0mm',
          left: '0mm'
        }
      });

      console.log('PDF generated successfully');
      return new Uint8Array(pdfBuffer);
    } finally {
      await browser.close();
    }
  }
}