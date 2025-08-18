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

export class ModernPdfGenerator {
  async generateReport(reportData: ReportData): Promise<void> {
    // Open new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Popup engellendi. Popup engelleyiciyi devre dışı bırakın.');
    }

    const htmlContent = this.generateFullHTML(reportData);
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Wait for content to load then print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    };
  }

  private generateFullHTML(reportData: ReportData): string {
    return `
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>İSG Raporu - ${reportData.reportNumber}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        @page {
            size: A4;
            margin: 2cm;
        }

        @media print {
            body { 
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
                font-size: 12px;
                line-height: 1.4;
                color: #000;
            }
            
            .page-break {
                page-break-before: always;
            }
            
            .no-break {
                page-break-inside: avoid;
            }
        }

        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #000;
            background: white;
        }

        .cover-page {
            text-align: center;
            padding: 40px 0;
        }

        .header-line {
            width: 100%;
            height: 6px;
            background: linear-gradient(90deg, #003366, #0066cc);
            margin-bottom: 40px;
            border-radius: 3px;
        }

        .main-title {
            color: #003366;
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 15px;
        }

        .subtitle {
            color: #003366;
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 50px;
        }

        .logo-section {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 60px;
            margin: 50px 0;
            flex-wrap: wrap;
        }

        .logo-box {
            width: 120px;
            height: 80px;
            border: 2px dashed #ccc;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 8px;
            background: #f8f9fa;
        }

        .logo-box img {
            max-width: 100px;
            max-height: 60px;
            object-fit: contain;
        }

        .report-info {
            margin-top: 80px;
        }

        .section-title {
            color: #003366;
            font-size: 20px;
            font-weight: 700;
            margin-bottom: 30px;
            border-bottom: 2px solid #003366;
            padding-bottom: 10px;
        }

        .info-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 40px;
        }

        .info-table td {
            padding: 15px;
            border: 1px solid #ddd;
        }

        .info-table .label {
            background: #f0f8ff;
            font-weight: 600;
            color: #003366;
            width: 40%;
        }

        .page-header {
            height: 4px;
            background: linear-gradient(90deg, #003366, #0066cc);
            margin-bottom: 30px;
            border-radius: 2px;
        }

        .finding-title {
            color: #003366;
            font-size: 18px;
            font-weight: 700;
            margin-bottom: 25px;
        }

        .finding-section h3 {
            color: #003366;
            font-size: 14px;
            font-weight: 600;
            margin: 20px 0 8px 0;
        }

        .finding-content {
            margin-bottom: 15px;
            text-align: justify;
        }

        .risk-badge {
            display: inline-block;
            padding: 8px 16px;
            color: white;
            font-weight: 600;
            border-radius: 4px;
            margin: 20px 0;
        }

        .risk-high { background-color: #dc2626; }
        .risk-medium { background-color: #f59e0b; }
        .risk-low { background-color: #22c55e; }

        .process-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }

        .process-table th,
        .process-table td {
            padding: 8px 12px;
            border: 1px solid #ddd;
            text-align: left;
        }

        .process-table th {
            background: #f0f8ff;
            color: #003366;
            font-weight: 600;
        }

        .footer {
            position: fixed;
            bottom: 2cm;
            left: 2cm;
            right: 2cm;
        }

        .footer-line {
            height: 1px;
            background: #003366;
            margin-bottom: 10px;
        }

        .footer-text {
            color: #666;
            font-size: 10px;
            text-align: center;
        }

        @media screen {
            body {
                max-width: 800px;
                margin: 20px auto;
                padding: 20px;
                background: #f5f5f5;
            }
            
            .page-break {
                margin-top: 50px;
                padding-top: 50px;
                border-top: 2px dashed #ccc;
            }
        }
    </style>
</head>
<body>
    ${this.generateCoverPage(reportData)}
    
    ${reportData.managementSummary ? this.generateManagementSummary(reportData.managementSummary) : ''}
    
    ${this.generateFindingsPages(reportData)}
    
    ${reportData.generalEvaluation ? this.generateGeneralEvaluation(reportData.generalEvaluation) : ''}
</body>
</html>`;
  }

  private generateCoverPage(reportData: ReportData): string {
    return `
    <div class="cover-page">
        <div class="header-line"></div>
        
        <h1 class="main-title">İstinye Üniversite Topkapı Liv Hastanesi</h1>
        <h2 class="subtitle">İş Sağlığı ve Güvenliği Saha Gözlem Raporu</h2>
        
        <div class="logo-section">
            <div class="logo-box">
                <span style="color: #666; font-size: 11px;">LOGO ALANI</span>
            </div>
            
            <div class="logo-box">
                <img src="/attached_assets/logo_1755548921510.jpg" alt="MLP Care" 
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                <span style="color: #666; font-size: 11px; display: none;">MLP CARE</span>
            </div>
            
            <div class="logo-box">
                <div style="text-align: center;">
                    <div style="color: #666; font-size: 10px;">HASTANE</div>
                    <div style="color: #666; font-size: 10px;">LOGOSU</div>
                </div>
            </div>
        </div>

        <div class="report-info">
            <h3 class="section-title">RAPOR BİLGİLERİ</h3>
            
            <table class="info-table">
                <tr>
                    <td class="label">Rapor Numarası:</td>
                    <td>${reportData.reportNumber || '2025-001'}</td>
                </tr>
                <tr>
                    <td class="label">Rapor Tarihi:</td>
                    <td>${reportData.reportDate || new Date().toLocaleDateString('tr-TR')}</td>
                </tr>
                <tr>
                    <td class="label">Proje Lokasyonu:</td>
                    <td>${reportData.projectLocation || 'İstinye Üniversitesi Topkapı Liv Hastanesi'}</td>
                </tr>
                <tr>
                    <td class="label">Raporlayan Uzman:</td>
                    <td>${reportData.reporter || 'Metin Salık'}</td>
                </tr>
                <tr>
                    <td class="label">Toplam Bulgu Sayısı:</td>
                    <td>${reportData.findings?.length || 0}</td>
                </tr>
            </table>
        </div>
    </div>
    
    <div class="footer">
        <div class="footer-line"></div>
        <p class="footer-text">Bu rapor ${new Date().toLocaleDateString('tr-TR')} tarihinde oluşturulmuştur.</p>
    </div>`;
  }

  private generateManagementSummary(summary: string): string {
    return `
    <div class="page-break">
        <div class="page-header"></div>
        <h1 class="section-title">YÖNETİCİ ÖZETİ</h1>
        <div class="finding-content">
            ${summary.split('\n').map(paragraph => 
                paragraph.trim() ? `<p style="margin-bottom: 15px;">${paragraph}</p>` : ''
            ).join('')}
        </div>
    </div>`;
  }

  private generateFindingsPages(reportData: ReportData): string {
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
    <div class="page-break">
        <div class="page-header"></div>
        <h1 class="finding-title">BULGU ${findingNumber}: ${sectionTitle}</h1>

        <table class="info-table">
            <tr>
                <td class="label">Tespit Yeri/Konum:</td>
                <td>${finding.location || finding.title}</td>
            </tr>
            <tr>
                <td class="label">Tespit Tarihi:</td>
                <td>${new Date().toLocaleDateString('tr-TR')}</td>
            </tr>
        </table>

        <div class="finding-section">
            <h3>MEVCUT DURUM</h3>
            <div class="finding-content">${finding.description || 'Belirtilmemiş'}</div>

            <h3>YASAL DAYANAK</h3>
            <div class="finding-content">İş Sağlığı ve Güvenliği Kanunu ve ilgili yönetmelikler</div>

            <h3>İSG UZMANI GÖRÜŞÜ</h3>
            <div class="finding-content">${finding.recommendation || 'Gerekli önlemler alınmalıdır.'}</div>

            <h3>FOTOĞRAF ALANI</h3>
            <div style="display: flex; gap: 15px; margin-bottom: 20px;">
                <div style="width: 150px; height: 100px; border: 2px dashed #ccc; display: flex; align-items: center; justify-content: center; background: #f8f9fa; border-radius: 4px;">
                    <span style="color: #666; font-size: 11px;">Fotoğraf 1</span>
                </div>
                <div style="width: 150px; height: 100px; border: 2px dashed #ccc; display: flex; align-items: center; justify-content: center; background: #f8f9fa; border-radius: 4px;">
                    <span style="color: #666; font-size: 11px;">Fotoğraf 2</span>
                </div>
            </div>

            <div class="risk-badge ${riskClass}">
                RİSK: ${riskTexts[finding.dangerLevel as keyof typeof riskTexts] || 'ORTA RİSK'}
            </div>

            ${finding.processSteps && finding.processSteps.length > 0 ? `
                <h3>SÜREÇ YÖNETİMİ</h3>
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
            ` : ''}
        </div>
    </div>`;
  }

  private generateGeneralEvaluation(evaluation: string): string {
    return `
    <div class="page-break">
        <div class="page-header"></div>
        <h1 class="section-title">GENEL DEĞERLENDİRME</h1>
        <div class="finding-content">
            ${evaluation.split('\n').map(paragraph => 
                paragraph.trim() ? `<p style="margin-bottom: 15px;">${paragraph}</p>` : ''
            ).join('')}
        </div>
    </div>`;
  }
}