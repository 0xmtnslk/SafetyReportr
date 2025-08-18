import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, pdf } from '@react-pdf/renderer';
import { createElement } from 'react';

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
    fontFamily: 'Helvetica',
    fontSize: 11,
    paddingTop: 35,
    paddingBottom: 65,
    paddingHorizontal: 35,
  },
  coverPage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLine: {
    width: '100%',
    height: 4,
    backgroundColor: '#003366',
    marginBottom: 30,
  },
  mainTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#003366',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#003366',
    textAlign: 'center',
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#003366',
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#003366',
    paddingBottom: 5,
  },
  table: {
    display: 'flex',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    marginBottom: 20,
  },
  tableRow: {
    margin: 'auto',
    flexDirection: 'row',
  },
  tableCol: {
    width: '50%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  tableCell: {
    margin: 'auto',
    marginTop: 5,
    fontSize: 10,
    padding: 8,
  },
  tableCellLabel: {
    margin: 'auto',
    marginTop: 5,
    fontSize: 10,
    padding: 8,
    backgroundColor: '#f0f8ff',
    fontWeight: 'bold',
    color: '#003366',
  },
  findingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#003366',
    marginBottom: 15,
  },
  findingSection: {
    marginBottom: 15,
  },
  findingLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#003366',
    marginBottom: 5,
  },
  findingContent: {
    fontSize: 10,
    lineHeight: 1.4,
    textAlign: 'justify',
  },
  riskBadge: {
    padding: 6,
    marginVertical: 10,
    alignSelf: 'flex-start',
    borderRadius: 3,
  },
  riskHigh: {
    backgroundColor: '#dc2626',
    color: 'white',
  },
  riskMedium: {
    backgroundColor: '#f59e0b',
    color: 'white',
  },
  riskLow: {
    backgroundColor: '#22c55e',
    color: 'white',
  },
  riskText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 35,
    right: 35,
  },
  footerLine: {
    width: '100%',
    height: 1,
    backgroundColor: '#003366',
    marginBottom: 10,
  },
  footerText: {
    fontSize: 8,
    color: '#666666',
    textAlign: 'center',
  },
});

const CoverPage = ({ reportData }: { reportData: ReportData }) => 
  createElement(Page, { size: "A4", style: styles.page }, [
    createElement(View, { style: styles.coverPage }, [
      createElement(View, { key: 'headerLine', style: styles.headerLine }),
      createElement(Text, { key: 'mainTitle', style: styles.mainTitle }, 'İstinye Üniversite Topkapı Liv Hastanesi'),
      createElement(Text, { key: 'subtitle', style: styles.subtitle }, 'İş Sağlığı ve Güvenliği Saha Gözlem Raporu'),
      createElement(View, { key: 'reportInfo', style: { marginTop: 80, width: '100%' } }, [
        createElement(Text, { key: 'sectionTitle', style: styles.sectionTitle }, 'RAPOR BİLGİLERİ'),
        createElement(View, { key: 'table', style: styles.table }, [
          createElement(View, { key: 'row1', style: styles.tableRow }, [
            createElement(View, { key: 'col1', style: [styles.tableCol, { width: '40%' }] }, 
              createElement(Text, { style: styles.tableCellLabel }, 'Rapor Numarası:')
            ),
            createElement(View, { key: 'col2', style: [styles.tableCol, { width: '60%' }] }, 
              createElement(Text, { style: styles.tableCell }, reportData.reportNumber || 'RPT-2025-001')
            )
          ]),
          createElement(View, { key: 'row2', style: styles.tableRow }, [
            createElement(View, { key: 'col1', style: [styles.tableCol, { width: '40%' }] }, 
              createElement(Text, { style: styles.tableCellLabel }, 'Rapor Tarihi:')
            ),
            createElement(View, { key: 'col2', style: [styles.tableCol, { width: '60%' }] }, 
              createElement(Text, { style: styles.tableCell }, reportData.reportDate || new Date().toLocaleDateString('tr-TR'))
            )
          ]),
          createElement(View, { key: 'row3', style: styles.tableRow }, [
            createElement(View, { key: 'col1', style: [styles.tableCol, { width: '40%' }] }, 
              createElement(Text, { style: styles.tableCellLabel }, 'Proje Lokasyonu:')
            ),
            createElement(View, { key: 'col2', style: [styles.tableCol, { width: '60%' }] }, 
              createElement(Text, { style: styles.tableCell }, reportData.projectLocation || 'İstinye Üniversitesi Topkapı Liv Hastanesi')
            )
          ]),
          createElement(View, { key: 'row4', style: styles.tableRow }, [
            createElement(View, { key: 'col1', style: [styles.tableCol, { width: '40%' }] }, 
              createElement(Text, { style: styles.tableCellLabel }, 'Raporlayan Uzman:')
            ),
            createElement(View, { key: 'col2', style: [styles.tableCol, { width: '60%' }] }, 
              createElement(Text, { style: styles.tableCell }, reportData.reporter || 'Metin Salık')
            )
          ]),
          createElement(View, { key: 'row5', style: styles.tableRow }, [
            createElement(View, { key: 'col1', style: [styles.tableCol, { width: '40%' }] }, 
              createElement(Text, { style: styles.tableCellLabel }, 'Toplam Bulgu Sayısı:')
            ),
            createElement(View, { key: 'col2', style: [styles.tableCol, { width: '60%' }] }, 
              createElement(Text, { style: styles.tableCell }, String(reportData.findings?.length || 0))
            )
          ])
        ])
      ])
    ]),
    createElement(View, { key: 'footer', style: styles.footer }, [
      createElement(View, { key: 'footerLine', style: styles.footerLine }),
      createElement(Text, { key: 'footerText', style: styles.footerText }, 
        `Bu rapor ${new Date().toLocaleDateString('tr-TR')} tarihinde oluşturulmuştur.`
      )
    ])
  ]);

const ManagementSummaryPage = ({ summary }: { summary: string }) => (
  <Page size="A4" style={styles.page}>
    <View style={styles.headerLine} />
    <Text style={styles.sectionTitle}>YÖNETİCİ ÖZETİ</Text>
    <Text style={styles.findingContent}>
      {summary}
    </Text>
  </Page>
);

const FindingPage = ({ finding, findingNumber, sectionTitle }: { 
  finding: Finding; 
  findingNumber: number; 
  sectionTitle: string; 
}) => {
  const riskStyles = {
    'high': [styles.riskBadge, styles.riskHigh],
    'medium': [styles.riskBadge, styles.riskMedium], 
    'low': [styles.riskBadge, styles.riskLow]
  };

  const riskTexts = {
    'high': 'YÜKSEK RİSK',
    'medium': 'ORTA RİSK',
    'low': 'DÜŞÜK RİSK'
  };

  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.headerLine} />
      <Text style={styles.findingTitle}>
        BULGU {findingNumber}: {sectionTitle}
      </Text>

      <View style={styles.table}>
        <View style={styles.tableRow}>
          <View style={[styles.tableCol, { width: '40%' }]}>
            <Text style={styles.tableCellLabel}>Tespit Yeri/Konum:</Text>
          </View>
          <View style={[styles.tableCol, { width: '60%' }]}>
            <Text style={styles.tableCell}>{finding.location || finding.title}</Text>
          </View>
        </View>
        
        <View style={styles.tableRow}>
          <View style={[styles.tableCol, { width: '40%' }]}>
            <Text style={styles.tableCellLabel}>Tespit Tarihi:</Text>
          </View>
          <View style={[styles.tableCol, { width: '60%' }]}>
            <Text style={styles.tableCell}>{new Date().toLocaleDateString('tr-TR')}</Text>
          </View>
        </View>
      </View>

      <View style={styles.findingSection}>
        <Text style={styles.findingLabel}>MEVCUT DURUM</Text>
        <Text style={styles.findingContent}>{finding.description || 'Belirtilmemiş'}</Text>
      </View>

      <View style={styles.findingSection}>
        <Text style={styles.findingLabel}>YASAL DAYANAK</Text>
        <Text style={styles.findingContent}>İş Sağlığı ve Güvenliği Kanunu ve ilgili yönetmelikler</Text>
      </View>

      <View style={styles.findingSection}>
        <Text style={styles.findingLabel}>İSG UZMANI GÖRÜŞÜ</Text>
        <Text style={styles.findingContent}>{finding.recommendation || 'Gerekli önlemler alınmalıdır.'}</Text>
      </View>

      <View style={styles.findingSection}>
        <Text style={styles.findingLabel}>FOTOĞRAF ALANI</Text>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
          <View style={{ width: 100, height: 60, border: 1, borderColor: '#ccc', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 8, color: '#666' }}>Fotoğraf 1</Text>
          </View>
          <View style={{ width: 100, height: 60, border: 1, borderColor: '#ccc', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 8, color: '#666' }}>Fotoğraf 2</Text>
          </View>
        </View>
      </View>

      <View style={riskStyles[finding.dangerLevel] || riskStyles['medium']}>
        <Text style={styles.riskText}>
          RİSK: {riskTexts[finding.dangerLevel as keyof typeof riskTexts] || 'ORTA RİSK'}
        </Text>
      </View>

      {finding.processSteps && finding.processSteps.length > 0 && (
        <View style={styles.findingSection}>
          <Text style={styles.findingLabel}>SÜREÇ YÖNETİMİ</Text>
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <View style={[styles.tableCol, { width: '25%' }]}>
                <Text style={styles.tableCellLabel}>Faaliyet</Text>
              </View>
              <View style={[styles.tableCol, { width: '25%' }]}>
                <Text style={styles.tableCellLabel}>Hedef Tarih</Text>
              </View>
              <View style={[styles.tableCol, { width: '25%' }]}>
                <Text style={styles.tableCellLabel}>Sorumlu</Text>
              </View>
              <View style={[styles.tableCol, { width: '25%' }]}>
                <Text style={styles.tableCellLabel}>Durum</Text>
              </View>
            </View>
            {finding.processSteps.map((step, index) => (
              <View key={index} style={styles.tableRow}>
                <View style={[styles.tableCol, { width: '25%' }]}>
                  <Text style={styles.tableCell}>{step.description}</Text>
                </View>
                <View style={[styles.tableCol, { width: '25%' }]}>
                  <Text style={styles.tableCell}>{step.targetDate}</Text>
                </View>
                <View style={[styles.tableCol, { width: '25%' }]}>
                  <Text style={styles.tableCell}>{step.responsible}</Text>
                </View>
                <View style={[styles.tableCol, { width: '25%' }]}>
                  <Text style={styles.tableCell}>{step.status}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
    </Page>
  );
};

const GeneralEvaluationPage = ({ evaluation }: { evaluation: string }) => (
  <Page size="A4" style={styles.page}>
    <View style={styles.headerLine} />
    <Text style={styles.sectionTitle}>GENEL DEĞERLENDİRME</Text>
    <Text style={styles.findingContent}>
      {evaluation}
    </Text>
  </Page>
);

const ReportDocument = ({ reportData }: { reportData: ReportData }) => {
  const sections = [
    { number: 2, title: 'Tasarım/İmalat/Montaj Hataları' },
    { number: 3, title: 'İş Sağlığı ve Güvenliği Bulguları' },
    { number: 4, title: 'Tamamlanmış Bulgular' }
  ];

  let findingCounter = 1;
  const findingPages = [];

  for (const section of sections) {
    const sectionFindings = reportData.findings?.filter(f => f.section === section.number) || [];
    
    for (const finding of sectionFindings) {
      findingPages.push(
        createElement(FindingPage, {
          key: `finding-${findingCounter}`,
          finding,
          findingNumber: findingCounter,
          sectionTitle: section.title
        })
      );
      findingCounter++;
    }
  }

  return createElement(Document, {}, [
    createElement(CoverPage, { key: 'cover', reportData }),
    ...(reportData.managementSummary ? [createElement(ManagementSummaryPage, { key: 'summary', summary: reportData.managementSummary })] : []),
    ...findingPages,
    ...(reportData.generalEvaluation ? [createElement(GeneralEvaluationPage, { key: 'evaluation', evaluation: reportData.generalEvaluation })] : [])
  ]);
};

export class ReactPdfGenerator {
  async generateReport(reportData: ReportData): Promise<Blob> {
    const doc = createElement(ReportDocument, { reportData });
    const asPdf = pdf(doc);
    return await asPdf.toBlob();
  }
}