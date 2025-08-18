
import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

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

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: 'white',
    padding: 30,
    fontFamily: 'Helvetica',
  },
  coverPage: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#1e40af',
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 30,
    textAlign: 'center',
    color: '#374151',
  },
  section: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1e40af',
  },
  text: {
    fontSize: 12,
    lineHeight: 1.5,
    marginBottom: 8,
    color: '#374151',
  },
  infoTable: {
    border: '1px solid #e2e8f0',
    marginBottom: 20,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #e2e8f0',
  },
  tableLabel: {
    width: '40%',
    padding: 10,
    backgroundColor: '#f1f5f9',
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e40af',
  },
  tableValue: {
    width: '60%',
    padding: 10,
    fontSize: 12,
    color: '#374151',
  },
  riskBadge: {
    padding: 8,
    marginBottom: 10,
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    borderRadius: 4,
  },
  riskHigh: {
    backgroundColor: '#dc2626',
  },
  riskMedium: {
    backgroundColor: '#ea580c',
  },
  riskLow: {
    backgroundColor: '#16a34a',
  },
  findingPage: {
    padding: 20,
  },
  findingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#1e40af',
  },
  contentSection: {
    marginBottom: 15,
  },
  contentLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#1e40af',
  },
  contentText: {
    fontSize: 11,
    lineHeight: 1.5,
    color: '#374151',
    textAlign: 'justify',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 9,
    color: '#6b7280',
  },
});

const CoverPage = ({ reportData }: { reportData: ReportData }) => 
  React.createElement(Page, { size: "A4", style: styles.page },
    React.createElement(View, { style: styles.coverPage },
      React.createElement(Text, { style: styles.title }, 'İstinye Üniversite Topkapı Liv Hastanesi'),
      React.createElement(Text, { style: styles.subtitle }, 'İş Sağlığı ve Güvenliği Saha Gözlem Raporu'),

      React.createElement(View, { style: styles.infoTable },
        React.createElement(View, { style: styles.tableRow },
          React.createElement(Text, { style: styles.tableLabel }, 'Rapor Numarası'),
          React.createElement(Text, { style: styles.tableValue }, reportData.reportNumber || 'RPT-2025-001')
        ),
        React.createElement(View, { style: styles.tableRow },
          React.createElement(Text, { style: styles.tableLabel }, 'Rapor Tarihi'),
          React.createElement(Text, { style: styles.tableValue }, String(reportData.reportDate || new Date().toLocaleDateString('tr-TR')))
        ),
        React.createElement(View, { style: styles.tableRow },
          React.createElement(Text, { style: styles.tableLabel }, 'Proje Lokasyonu'),
          React.createElement(Text, { style: styles.tableValue }, reportData.projectLocation || 'İstinye Üniversitesi Topkapı Liv Hastanesi')
        ),
        React.createElement(View, { style: styles.tableRow },
          React.createElement(Text, { style: styles.tableLabel }, 'Raporlayan Uzman'),
          React.createElement(Text, { style: styles.tableValue }, reportData.reporter || 'Metin Salık')
        ),
        React.createElement(View, { style: styles.tableRow },
          React.createElement(Text, { style: styles.tableLabel }, 'Toplam Bulgu Sayısı'),
          React.createElement(Text, { style: styles.tableValue }, String(reportData.findings?.length || 0))
        )
      )
    )
  );

const FindingPage = ({ finding, findingNumber }: { finding: Finding; findingNumber: number }) => {
  const getRiskStyle = (level: string) => {
    switch (level) {
      case 'high': return [styles.riskBadge, styles.riskHigh];
      case 'medium': return [styles.riskBadge, styles.riskMedium];
      case 'low': return [styles.riskBadge, styles.riskLow];
      default: return [styles.riskBadge, styles.riskMedium];
    }
  };

  const getRiskText = (level: string) => {
    switch (level) {
      case 'high': return 'YÜKSEK RİSK';
      case 'medium': return 'ORTA RİSK';
      case 'low': return 'DÜŞÜK RİSK';
      default: return 'ORTA RİSK';
    }
  };

  return React.createElement(Page, { size: "A4", style: styles.page },
    React.createElement(View, { style: styles.findingPage },
      React.createElement(Text, { style: styles.findingTitle }, `BULGU ${findingNumber}: ${finding.title}`),

      React.createElement(View, { style: styles.infoTable },
        React.createElement(View, { style: styles.tableRow },
          React.createElement(Text, { style: styles.tableLabel }, 'Tespit Yeri/Konum'),
          React.createElement(Text, { style: styles.tableValue }, finding.location || finding.title)
        ),
        React.createElement(View, { style: styles.tableRow },
          React.createElement(Text, { style: styles.tableLabel }, 'Tespit Tarihi'),
          React.createElement(Text, { style: styles.tableValue }, String(new Date().toLocaleDateString('tr-TR')))
        )
      ),

      React.createElement(View, { style: styles.contentSection },
        React.createElement(Text, { style: styles.contentLabel }, 'Mevcut Durum'),
        React.createElement(Text, { style: styles.contentText }, finding.description || 'Belirtilmemiş')
      ),

      React.createElement(View, { style: styles.contentSection },
        React.createElement(Text, { style: styles.contentLabel }, 'Yasal Dayanak'),
        React.createElement(Text, { style: styles.contentText }, 'İş Sağlığı ve Güvenliği Kanunu ve ilgili yönetmelikler kapsamında değerlendirilen bu bulgu, işyeri güvenliği standartlarına uygunluk açısından ele alınmıştır.')
      ),

      React.createElement(View, { style: styles.contentSection },
        React.createElement(Text, { style: styles.contentLabel }, 'İSG Uzmanı Görüşü'),
        React.createElement(Text, { style: styles.contentText }, 
          finding.recommendation || 'Tespit edilen durumun düzeltilmesi için gerekli önlemlerin alınması ve güvenlik standartlarına uygunluğun sağlanması önerilmektedir.'
        )
      ),

      React.createElement(View, { style: getRiskStyle(finding.dangerLevel || 'medium') },
        React.createElement(Text, null, `RİSK SEVİYESİ: ${getRiskText(finding.dangerLevel || 'medium')}`)
      )
    )
  );
};

const ReportDocument = ({ reportData }: { reportData: ReportData }) => 
  React.createElement(Document, null,
    React.createElement(CoverPage, { reportData }),

    reportData.managementSummary && React.createElement(Page, { size: "A4", style: styles.page },
      React.createElement(Text, { style: styles.sectionTitle }, 'YÖNETİCİ ÖZETİ'),
      React.createElement(Text, { style: styles.contentText }, reportData.managementSummary)
    ),

    ...reportData.findings?.map((finding, index) => 
      React.createElement(FindingPage, { key: finding.id, finding, findingNumber: index + 1 })
    ) || [],

    reportData.generalEvaluation && React.createElement(Page, { size: "A4", style: styles.page },
      React.createElement(Text, { style: styles.sectionTitle }, 'GENEL DEĞERLENDİRME VE ÖNERİLER'),
      React.createElement(Text, { style: styles.contentText }, reportData.generalEvaluation)
    )
  );

export class ReactPdfService {
  async generatePDF(reportData: ReportData): Promise<Uint8Array> {
    try {
      const pdfBuffer = await renderToBuffer(React.createElement(ReportDocument, { reportData }));
      return new Uint8Array(pdfBuffer);
    } catch (error) {
      console.error('React-PDF generation error:', error);
      throw new Error('PDF oluşturulurken hata oluştu');
    }
  }
}
