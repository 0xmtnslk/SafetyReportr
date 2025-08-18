import puppeteer from 'puppeteer';

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

export class PuppeteerPdfService {
  async generatePDF(reportData: ReportData): Promise<Uint8Array> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      
      const htmlContent = this.generateHTML(reportData);
      
      await page.setContent(htmlContent, {
        waitUntil: 'networkidle0',
        timeout: 30000
      });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        },
        printBackground: true,
        displayHeaderFooter: false
      });

      return pdfBuffer;
    } finally {
      await browser.close();
    }
  }

  private generateHTML(reportData: ReportData): string {
    return `
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>İSG Raporu ${reportData.reportNumber}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', Arial, sans-serif;
            font-size: 11pt;
            line-height: 1.4;
            color: #000;
        }
        
        .page {
            min-height: 100vh;
            padding: 20px;
            page-break-after: always;
        }
        
        .page:last-child {
            page-break-after: avoid;
        }
        
        .cover-page {
            text-align: center;
            display: flex;
            flex-direction: column;
            justify-content: center;
            min-height: 90vh;
        }
        
        .header-gradient {
            width: 100%;
            height: 8px;
            background: linear-gradient(90deg, #1e3a8a, #3b82f6);
            margin-bottom: 40px;
        }
        
        .hospital-title {
            font-size: 24pt;
            font-weight: 700;
            color: #1e3a8a;
            margin-bottom: 15px;
            letter-spacing: 0.5px;
        }
        
        .report-title {
            font-size: 18pt;
            font-weight: 500;
            color: #1e3a8a;
            margin-bottom: 60px;
        }
        
        .logo-section {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 40px;
            margin: 40px 0;
        }
        
        .logo-placeholder {
            width: 120px;
            height: 80px;
            border: 2px dashed #9ca3af;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f8fafc;
            color: #64748b;
            font-size: 10pt;
            border-radius: 8px;
        }
        
        .info-section {
            margin-top: 40px;
            text-align: left;
        }
        
        .section-header {
            font-size: 16pt;
            font-weight: 700;
            color: #1e3a8a;
            margin-bottom: 20px;
            border-bottom: 2px solid #1e3a8a;
            padding-bottom: 5px;
        }
        
        .info-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
            border: 1px solid #1e3a8a;
        }
        
        .info-table td {
            padding: 10px 12px;
            border: 1px solid #cbd5e1;
        }
        
        .info-label {
            background: #e0f2fe;
            font-weight: 600;
            color: #1e3a8a;
            width: 35%;
        }
        
        .info-value {
            background: white;
            color: #374151;
        }
        
        .finding-page {
            padding-top: 20px;
        }
        
        .page-header {
            height: 4px;
            background: linear-gradient(90deg, #1e3a8a, #3b82f6);
            margin-bottom: 25px;
        }
        
        .finding-title {
            font-size: 16pt;
            font-weight: 700;
            color: #1e3a8a;
            margin-bottom: 20px;
        }
        
        .content-section {
            margin-bottom: 15px;
        }
        
        .content-label {
            font-size: 12pt;
            font-weight: 600;
            color: #1e3a8a;
            margin-bottom: 5px;
            text-transform: uppercase;
        }
        
        .content-text {
            font-size: 10pt;
            line-height: 1.5;
            color: #374151;
            text-align: justify;
        }
        
        .risk-badge {
            display: inline-block;
            padding: 6px 12px;
            font-weight: 700;
            font-size: 10pt;
            border-radius: 4px;
            margin: 10px 0;
            color: white;
        }
        
        .risk-high { background-color: #dc2626; }
        .risk-medium { background-color: #ea580c; }
        .risk-low { background-color: #16a34a; }
        
        .photo-section {
            display: flex;
            gap: 15px;
            margin: 10px 0;
        }
        
        .photo-placeholder {
            width: 120px;
            height: 80px;
            border: 2px dashed #9ca3af;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f9fafb;
            color: #6b7280;
            font-size: 9pt;
        }
        
        .process-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            border: 1px solid #1e3a8a;
        }
        
        .process-table th {
            background: #e0f2fe;
            color: #1e3a8a;
            font-weight: 600;
            padding: 6px 8px;
            border: 1px solid #cbd5e1;
            font-size: 9pt;
        }
        
        .process-table td {
            padding: 5px 8px;
            border: 1px solid #cbd5e1;
            font-size: 9pt;
            color: #374151;
        }
    </style>
</head>
<body>
    <!-- Kapak Sayfası -->
    <div class="page cover-page">
        <div class="header-gradient"></div>
        
        <h1 class="hospital-title">İstinye Üniversite Topkapı Liv Hastanesi</h1>
        <h2 class="report-title">İş Sağlığı ve Güvenliği Saha Gözlem Raporu</h2>
        
        <div class="logo-section">
            <div class="logo-placeholder">ÜNIVERSITE LOGOSU</div>
            <div class="logo-placeholder">MLP CARE</div>
            <div class="logo-placeholder">HASTANE LOGOSU</div>
        </div>
        
        <div class="info-section">
            <h3 class="section-header">RAPOR BİLGİLERİ</h3>
            
            <table class="info-table">
                <tr>
                    <td class="info-label">Rapor Numarası</td>
                    <td class="info-value">${reportData.reportNumber || 'RPT-2025-001'}</td>
                </tr>
                <tr>
                    <td class="info-label">Rapor Tarihi</td>
                    <td class="info-value">${reportData.reportDate || new Date().toLocaleDateString('tr-TR')}</td>
                </tr>
                <tr>
                    <td class="info-label">Proje Lokasyonu</td>
                    <td class="info-value">${reportData.projectLocation || 'İstinye Üniversitesi Topkapı Liv Hastanesi'}</td>
                </tr>
                <tr>
                    <td class="info-label">Raporlayan Uzman</td>
                    <td class="info-value">${reportData.reporter || 'Metin Salık'}</td>
                </tr>
                <tr>
                    <td class="info-label">Toplam Bulgu Sayısı</td>
                    <td class="info-value">${reportData.findings?.length || 0}</td>
                </tr>
            </table>
        </div>
    </div>

    ${reportData.managementSummary ? this.generateManagementSummary(reportData.managementSummary) : ''}
    
    ${this.generateFindingPages(reportData)}
    
    ${reportData.generalEvaluation ? this.generateGeneralEvaluation(reportData.generalEvaluation) : ''}
</body>
</html>`;
  }

  private generateManagementSummary(summary: string): string {
    return `
    <div class="page">
        <div class="page-header"></div>
        <h2 class="section-header">YÖNETİCİ ÖZETİ</h2>
        <div class="content-text">${summary.replace(/\n/g, '<br><br>')}</div>
    </div>`;
  }

  private generateFindingPages(reportData: ReportData): string {
    if (!reportData.findings || reportData.findings.length === 0) {
      return '';
    }

    const sections = [
      { number: 2, title: 'Tasarım/İmalat/Montaj Hataları' },
      { number: 3, title: 'İş Sağlığı ve Güvenliği Bulguları' },
      { number: 4, title: 'Tamamlanmış Bulgular' }
    ];

    let html = '';
    let findingCounter = 1;

    for (const section of sections) {
      const sectionFindings = reportData.findings.filter(f => f.section === section.number);
      
      for (const finding of sectionFindings) {
        html += this.generateFindingPage(finding, findingCounter, section.title);
        findingCounter++;
      }
    }

    return html;
  }

  private generateFindingPage(finding: Finding, findingNumber: number, sectionTitle: string): string {
    const riskClass = `risk-${finding.dangerLevel || 'medium'}`;
    const riskTexts = {
      'high': 'YÜKSEK RİSK',
      'medium': 'ORTA RİSK', 
      'low': 'DÜŞÜK RİSK'
    };

    return `
    <div class="page finding-page">
        <div class="page-header"></div>
        <h2 class="finding-title">BULGU ${findingNumber}: ${sectionTitle}</h2>

        <table class="info-table">
            <tr>
                <td class="info-label">Tespit Yeri/Konum</td>
                <td class="info-value">${finding.location || finding.title}</td>
            </tr>
            <tr>
                <td class="info-label">Tespit Tarihi</td>
                <td class="info-value">${new Date().toLocaleDateString('tr-TR')}</td>
            </tr>
        </table>

        <div class="content-section">
            <div class="content-label">Mevcut Durum</div>
            <div class="content-text">${finding.description || 'Belirtilmemiş'}</div>
        </div>

        <div class="content-section">
            <div class="content-label">Yasal Dayanak</div>
            <div class="content-text">İş Sağlığı ve Güvenliği Kanunu ve ilgili yönetmelikler</div>
        </div>

        <div class="content-section">
            <div class="content-label">İSG Uzmanı Görüşü</div>
            <div class="content-text">${finding.recommendation || 'Gerekli önlemler alınmalıdır.'}</div>
        </div>

        <div class="content-section">
            <div class="content-label">Fotoğraf Alanı</div>
            <div class="photo-section">
                <div class="photo-placeholder">Fotoğraf 1</div>
                <div class="photo-placeholder">Fotoğraf 2</div>
            </div>
        </div>

        <div class="risk-badge ${riskClass}">
            RİSK: ${riskTexts[finding.dangerLevel as keyof typeof riskTexts] || 'ORTA RİSK'}
        </div>

        ${finding.processSteps && finding.processSteps.length > 0 ? `
            <div class="content-section">
                <div class="content-label">Süreç Yönetimi</div>
                <table class="process-table">
                    <thead>
                        <tr>
                            <th>Faaliyet</th>
                            <th>Hedef Tarih</th>
                            <th>Sorumlu</th>
                            <th>Durum</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${finding.processSteps.map(step => `
                            <tr>
                                <td>${step.description}</td>
                                <td>${step.targetDate}</td>
                                <td>${step.responsible}</td>
                                <td>${step.status}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        ` : ''}
    </div>`;
  }

  private generateGeneralEvaluation(evaluation: string): string {
    return `
    <div class="page">
        <div class="page-header"></div>
        <h2 class="section-header">GENEL DEĞERLENDİRME</h2>
        <div class="content-text">${evaluation.replace(/\n/g, '<br><br>')}</div>
    </div>`;
  }
}