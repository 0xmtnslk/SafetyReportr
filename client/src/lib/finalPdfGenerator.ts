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

export class FinalPdfGenerator {
  async generateReport(reportData: ReportData): Promise<void> {
    try {
      // Create print-friendly HTML content
      const printContent = this.generatePrintableHTML(reportData);
      
      // Create new window for printing
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (!printWindow) {
        throw new Error('Popup engellendi. Lütfen popup engelleyiciyi devre dışı bırakın.');
      }

      // Write content to new window
      printWindow.document.open();
      printWindow.document.write(printContent);
      printWindow.document.close();

      // Wait for images to load then print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          // Don't close automatically, let user close after printing
        }, 1000);
      };
    } catch (error) {
      console.error('PDF Generation Error:', error);
      throw error;
    }
  }

  private generatePrintableHTML(reportData: ReportData): string {
    return `
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <title>İSG Raporu ${reportData.reportNumber || ''}</title>
    <style>
        /* Font import for better Turkish support */
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap');
        
        * { 
            margin: 0; 
            padding: 0; 
            box-sizing: border-box; 
        }
        
        @page { 
            size: A4; 
            margin: 20mm; 
        }
        
        body {
            font-family: 'Roboto', Arial, sans-serif;
            font-size: 11pt;
            line-height: 1.4;
            color: #000;
            background: white;
        }
        
        @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .page-break { page-break-before: always; }
            .no-break { page-break-inside: avoid; }
        }
        
        .cover-page {
            text-align: center;
            padding: 40px 0;
            min-height: 100vh;
            position: relative;
        }
        
        .header-gradient {
            width: 100%;
            height: 8px;
            background: linear-gradient(90deg, #1e3a8a, #3b82f6);
            margin-bottom: 40px;
        }
        
        .hospital-title {
            font-size: 22pt;
            font-weight: 700;
            color: #1e3a8a;
            margin-bottom: 12px;
            letter-spacing: 0.5px;
        }
        
        .report-title {
            font-size: 16pt;
            font-weight: 500;
            color: #1e3a8a;
            margin-bottom: 60px;
        }
        
        .info-section {
            margin-top: 80px;
            text-align: left;
        }
        
        .section-header {
            font-size: 18pt;
            font-weight: 700;
            color: #1e3a8a;
            margin-bottom: 30px;
            border-bottom: 3px solid #1e3a8a;
            padding-bottom: 8px;
        }
        
        .info-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 40px;
            border: 2px solid #1e3a8a;
        }
        
        .info-table td {
            padding: 12px 16px;
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
        
        .page-header {
            height: 6px;
            background: linear-gradient(90deg, #1e3a8a, #3b82f6);
            margin-bottom: 30px;
        }
        
        .finding-page {
            padding-top: 20px;
        }
        
        .finding-title {
            font-size: 16pt;
            font-weight: 700;
            color: #1e3a8a;
            margin-bottom: 25px;
        }
        
        .finding-detail-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
            border: 1px solid #1e3a8a;
        }
        
        .finding-detail-table td {
            padding: 10px 12px;
            border: 1px solid #cbd5e1;
        }
        
        .detail-label {
            background: #e0f2fe;
            font-weight: 600;
            color: #1e3a8a;
            width: 30%;
        }
        
        .detail-value {
            background: white;
            color: #374151;
        }
        
        .content-section {
            margin-bottom: 20px;
        }
        
        .content-title {
            font-size: 12pt;
            font-weight: 600;
            color: #1e3a8a;
            margin-bottom: 8px;
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
            padding: 8px 16px;
            font-weight: 700;
            font-size: 10pt;
            border-radius: 4px;
            margin: 15px 0;
            color: white;
            text-transform: uppercase;
        }
        
        .risk-high { background-color: #dc2626; }
        .risk-medium { background-color: #ea580c; }
        .risk-low { background-color: #16a34a; }
        
        .photo-section {
            display: flex;
            gap: 20px;
            margin: 15px 0;
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
            font-size: 9pt;
            border-radius: 4px;
        }
        
        .process-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
            border: 1px solid #1e3a8a;
        }
        
        .process-table th {
            background: #e0f2fe;
            color: #1e3a8a;
            font-weight: 600;
            padding: 8px 10px;
            border: 1px solid #cbd5e1;
            font-size: 9pt;
        }
        
        .process-table td {
            padding: 6px 10px;
            border: 1px solid #cbd5e1;
            font-size: 9pt;
            color: #374151;
        }
        
        .footer {
            position: fixed;
            bottom: 20mm;
            left: 20mm;
            right: 20mm;
            text-align: center;
        }
        
        .footer-line {
            height: 2px;
            background: #1e3a8a;
            margin-bottom: 10px;
        }
        
        .footer-text {
            font-size: 9pt;
            color: #6b7280;
        }
        
        @media screen {
            body {
                max-width: 800px;
                margin: 20px auto;
                padding: 20px;
                box-shadow: 0 0 20px rgba(0,0,0,0.1);
            }
            .page-break {
                margin-top: 60px;
                padding-top: 40px;
                border-top: 3px dashed #cbd5e1;
            }
        }
    </style>
</head>
<body>
    <!-- Cover Page -->
    <div class="cover-page">
        <div class="header-gradient"></div>
        
        <h1 class="hospital-title">İstinye Üniversite Topkapı Liv Hastanesi</h1>
        <h2 class="report-title">İş Sağlığı ve Güvenliği Saha Gözlem Raporu</h2>
        
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
    
    <div class="footer">
        <div class="footer-line"></div>
        <div class="footer-text">Bu rapor ${new Date().toLocaleDateString('tr-TR')} tarihinde oluşturulmuştur.</div>
    </div>
    
    ${reportData.managementSummary ? this.generateManagementSummary(reportData.managementSummary) : ''}
    
    ${this.generateFindingPages(reportData)}
    
    ${reportData.generalEvaluation ? this.generateGeneralEvaluation(reportData.generalEvaluation) : ''}
</body>
</html>`;
  }

  private generateManagementSummary(summary: string): string {
    return `
    <div class="page-break">
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
    <div class="page-break">
        <div class="page-header"></div>
        <div class="finding-page">
            <h2 class="finding-title">BULGU ${findingNumber}: ${sectionTitle}</h2>

            <table class="finding-detail-table">
                <tr>
                    <td class="detail-label">Tespit Yeri/Konum</td>
                    <td class="detail-value">${finding.location || finding.title}</td>
                </tr>
                <tr>
                    <td class="detail-label">Tespit Tarihi</td>
                    <td class="detail-value">${new Date().toLocaleDateString('tr-TR')}</td>
                </tr>
            </table>

            <div class="content-section">
                <div class="content-title">Mevcut Durum</div>
                <div class="content-text">${finding.description || 'Belirtilmemiş'}</div>
            </div>

            <div class="content-section">
                <div class="content-title">Yasal Dayanak</div>
                <div class="content-text">İş Sağlığı ve Güvenliği Kanunu ve ilgili yönetmelikler</div>
            </div>

            <div class="content-section">
                <div class="content-title">İSG Uzmanı Görüşü</div>
                <div class="content-text">${finding.recommendation || 'Gerekli önlemler alınmalıdır.'}</div>
            </div>

            <div class="content-section">
                <div class="content-title">Fotoğraf Alanı</div>
                <div class="photo-section">
                    <div class="photo-placeholder">Fotoğraf 1</div>
                    <div class="photo-placeholder">Fotoğraf 2</div>
                </div>
            </div>

            <div class="risk-badge ${riskClass}">
                Risk: ${riskTexts[finding.dangerLevel as keyof typeof riskTexts] || 'ORTA RİSK'}
            </div>

            ${finding.processSteps && finding.processSteps.length > 0 ? `
                <div class="content-section">
                    <div class="content-title">Süreç Yönetimi</div>
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
        </div>
    </div>`;
  }

  private generateGeneralEvaluation(evaluation: string): string {
    return `
    <div class="page-break">
        <div class="page-header"></div>
        <h2 class="section-header">GENEL DEĞERLENDİRME</h2>
        <div class="content-text">${evaluation.replace(/\n/g, '<br><br>')}</div>
    </div>`;
  }
}