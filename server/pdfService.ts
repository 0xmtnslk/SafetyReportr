
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
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    });

    try {
      const page = await browser.newPage();
      
      // Set viewport for consistent rendering
      await page.setViewport({ width: 1200, height: 1600 });
      
      const htmlContent = this.generateHTML(reportData);
      
      await page.setContent(htmlContent, {
        waitUntil: 'networkidle0',
        timeout: 30000
      });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        margin: {
          top: '15mm',
          right: '15mm',
          bottom: '15mm',
          left: '15mm'
        },
        printBackground: true,
        displayHeaderFooter: false,
        preferCSSPageSize: true
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
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        @page {
            size: A4;
            margin: 15mm;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            font-size: 12px;
            line-height: 1.5;
            color: #1a1a1a;
            background: white;
        }
        
        .page {
            page-break-after: always;
            min-height: 100vh;
            padding: 20px 0;
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
            border-radius: 4px;
        }
        
        .hospital-title {
            font-size: 28px;
            font-weight: 700;
            color: #1e3a8a;
            margin-bottom: 15px;
            letter-spacing: 0.5px;
        }
        
        .report-title {
            font-size: 20px;
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
            flex-wrap: wrap;
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
            font-size: 11px;
            border-radius: 8px;
            font-weight: 500;
        }
        
        .info-section {
            margin-top: 40px;
            text-align: left;
            max-width: 600px;
            margin-left: auto;
            margin-right: auto;
        }
        
        .section-header {
            font-size: 18px;
            font-weight: 700;
            color: #1e3a8a;
            margin-bottom: 20px;
            border-bottom: 3px solid #1e3a8a;
            padding-bottom: 8px;
        }
        
        .info-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
            border: 2px solid #1e3a8a;
            border-radius: 8px;
            overflow: hidden;
        }
        
        .info-table td {
            padding: 12px 15px;
            border-bottom: 1px solid #e2e8f0;
        }
        
        .info-table tr:last-child td {
            border-bottom: none;
        }
        
        .info-label {
            background: #f1f5f9;
            font-weight: 600;
            color: #1e3a8a;
            width: 40%;
            border-right: 1px solid #e2e8f0;
        }
        
        .info-value {
            background: white;
            color: #374151;
        }
        
        .content-page {
            padding-top: 20px;
        }
        
        .page-header {
            height: 4px;
            background: linear-gradient(90deg, #1e3a8a, #3b82f6);
            margin-bottom: 25px;
            border-radius: 2px;
        }
        
        .finding-title {
            font-size: 18px;
            font-weight: 700;
            color: #1e3a8a;
            margin-bottom: 20px;
        }
        
        .content-section {
            margin-bottom: 20px;
        }
        
        .content-label {
            font-size: 13px;
            font-weight: 600;
            color: #1e3a8a;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .content-text {
            font-size: 11px;
            line-height: 1.6;
            color: #374151;
            text-align: justify;
            background: #f8fafc;
            padding: 12px;
            border-radius: 6px;
            border-left: 4px solid #e2e8f0;
        }
        
        .risk-badge {
            display: inline-block;
            padding: 8px 16px;
            font-weight: 700;
            font-size: 11px;
            border-radius: 6px;
            margin: 10px 0;
            color: white;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .risk-high { background: linear-gradient(135deg, #dc2626, #b91c1c); }
        .risk-medium { background: linear-gradient(135deg, #ea580c, #c2410c); }
        .risk-low { background: linear-gradient(135deg, #16a34a, #15803d); }
        
        .photo-section {
            display: flex;
            gap: 15px;
            margin: 15px 0;
            flex-wrap: wrap;
        }
        
        .photo-placeholder {
            width: 140px;
            height: 100px;
            border: 2px dashed #9ca3af;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f9fafb;
            color: #6b7280;
            font-size: 10px;
            border-radius: 6px;
            font-weight: 500;
        }
        
        .process-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
            border: 2px solid #1e3a8a;
            border-radius: 8px;
            overflow: hidden;
        }
        
        .process-table th {
            background: linear-gradient(135deg, #1e3a8a, #1e40af);
            color: white;
            font-weight: 600;
            padding: 10px 8px;
            border-right: 1px solid #3b82f6;
            font-size: 10px;
            text-align: left;
        }
        
        .process-table th:last-child {
            border-right: none;
        }
        
        .process-table td {
            padding: 8px;
            border-right: 1px solid #e2e8f0;
            border-bottom: 1px solid #e2e8f0;
            font-size: 10px;
            color: #374151;
            background: white;
        }
        
        .process-table td:last-child {
            border-right: none;
        }
        
        .process-table tr:last-child td {
            border-bottom: none;
        }
        
        .footer {
            position: fixed;
            bottom: 10mm;
            left: 15mm;
            right: 15mm;
            text-align: center;
            font-size: 9px;
            color: #6b7280;
            border-top: 1px solid #e2e8f0;
            padding-top: 8px;
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
            <div class="logo-placeholder">ÜNİVERSİTE<br>LOGOSU</div>
            <div class="logo-placeholder">MLP CARE<br>LOGO</div>
            <div class="logo-placeholder">HASTANE<br>LOGOSU</div>
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
    
    <div class="footer">
        Bu rapor ${new Date().toLocaleDateString('tr-TR')} tarihinde oluşturulmuştur. | İstinye Üniversite Topkapı Liv Hastanesi
    </div>
</body>
</html>`;
  }

  private generateManagementSummary(summary: string): string {
    return `
    <div class="page content-page">
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
    <div class="page content-page">
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
            <div class="content-text">İş Sağlığı ve Güvenliği Kanunu ve ilgili yönetmelikler kapsamında değerlendirilen bu bulgu, işyeri güvenliği standartlarına uygunluk açısından ele alınmıştır.</div>
        </div>

        <div class="content-section">
            <div class="content-label">İSG Uzmanı Görüşü</div>
            <div class="content-text">${finding.recommendation || 'Tespit edilen durumun düzeltilmesi için gerekli önlemlerin alınması ve güvenlik standartlarına uygunluğun sağlanması önerilmektedir.'}</div>
        </div>

        <div class="content-section">
            <div class="content-label">Fotoğraf Alanı</div>
            <div class="photo-section">
                <div class="photo-placeholder">Fotoğraf 1</div>
                <div class="photo-placeholder">Fotoğraf 2</div>
                <div class="photo-placeholder">Fotoğraf 3</div>
            </div>
        </div>

        <div class="risk-badge ${riskClass}">
            RİSK SEVİYESİ: ${riskTexts[finding.dangerLevel as keyof typeof riskTexts] || 'ORTA RİSK'}
        </div>

        ${finding.processSteps && finding.processSteps.length > 0 ? `
            <div class="content-section">
                <div class="content-label">Süreç Yönetimi ve İzleme</div>
                <table class="process-table">
                    <thead>
                        <tr>
                            <th style="width: 40%;">Faaliyet Açıklaması</th>
                            <th style="width: 20%;">Hedef Tarih</th>
                            <th style="width: 20%;">Sorumlu Kişi</th>
                            <th style="width: 20%;">Mevcut Durum</th>
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
    <div class="page content-page">
        <div class="page-header"></div>
        <h2 class="section-header">GENEL DEĞERLENDİRME VE ÖNERİLER</h2>
        <div class="content-text">${evaluation.replace(/\n/g, '<br><br>')}</div>
        
        <div class="content-section" style="margin-top: 30px;">
            <div class="content-label">Sonuç ve Öneriler</div>
            <div class="content-text">
                Bu rapor kapsamında yapılan incelemelerde tespit edilen bulgular, işyeri güvenliği ve çalışan sağlığı açısından değerlendirilmiştir. 
                Önerilen düzeltici ve önleyici faaliyetlerin planlandığı şekilde uygulanması ve düzenli olarak izlenmesi önemlidir.
            </div>
        </div>
    </div>`;
  }
}
