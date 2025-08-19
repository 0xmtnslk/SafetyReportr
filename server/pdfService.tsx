import React from 'react';
import { renderToBuffer, Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

// Real MLP logo as base64
const LOGO_BASE64 = "data:image/png;base64,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";

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

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
    fontFamily: 'Times-Roman',
    fontSize: 11,
    lineHeight: 1.4
  },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#1e40af',
    borderBottomStyle: 'solid'
  },
  logo: {
    width: 120,
    height: 40
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e40af',
    fontFamily: 'Times-Bold'
  },
  
  // Cover Page
  coverPage: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    padding: 40
  },
  coverLogo: {
    width: 200,
    height: 66,
    marginBottom: 40
  },
  coverTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e40af',
    textAlign: 'center',
    marginBottom: 10,
    fontFamily: 'Times-Bold'
  },
  coverSubtitle: {
    fontSize: 18,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 40
  },
  coverInfo: {
    width: '100%',
    maxWidth: 400,
    marginTop: 40
  },
  coverInfoRow: {
    flexDirection: 'row',
    marginBottom: 15,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    borderBottomStyle: 'solid'
  },
  coverInfoLabel: {
    width: '45%',
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e40af',
    fontFamily: 'Times-Bold'
  },
  coverInfoValue: {
    width: '55%',
    fontSize: 12,
    color: '#374151'
  },
  
  // Sections
  sectionTitle: {
    backgroundColor: '#1e40af',
    color: '#FFFFFF',
    padding: 12,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 15,
    fontFamily: 'Times-Bold'
  },
  sectionContent: {
    padding: 15,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'solid',
    marginBottom: 20
  },
  
  // Findings
  finding: {
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderStyle: 'solid'
  },
  findingHeader: {
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
    borderBottomStyle: 'solid'
  },
  findingTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 5,
    fontFamily: 'Times-Bold'
  },
  findingMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  findingLocation: {
    fontSize: 10,
    color: '#6b7280'
  },
  riskHigh: {
    backgroundColor: '#dc2626',
    color: '#FFFFFF',
    padding: 4,
    fontSize: 9,
    fontWeight: 'bold',
    fontFamily: 'Times-Bold'
  },
  riskMedium: {
    backgroundColor: '#ea580c',
    color: '#FFFFFF',
    padding: 4,
    fontSize: 9,
    fontWeight: 'bold',
    fontFamily: 'Times-Bold'
  },
  riskLow: {
    backgroundColor: '#16a34a',
    color: '#FFFFFF',
    padding: 4,
    fontSize: 9,
    fontWeight: 'bold',
    fontFamily: 'Times-Bold'
  },
  findingContent: {
    padding: 12
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 5,
    marginTop: 10,
    fontFamily: 'Times-Bold'
  },
  fieldText: {
    fontSize: 10,
    lineHeight: 1.4,
    color: '#374151',
    marginBottom: 8
  },
  
  // Images
  findingImage: {
    width: 150,
    height: 100,
    marginTop: 5,
    marginBottom: 5
  },
  
  // Footer
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 9,
    color: '#6b7280',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    borderTopStyle: 'solid',
    paddingTop: 10
  }
});

const Header = ({ title }: { title: string }) => (
  <View style={styles.header}>
    <Image style={styles.logo} src={LOGO_BASE64} />
    <Text style={styles.headerTitle}>{title}</Text>
  </View>
);

const Footer = ({ pageNumber }: { pageNumber: number }) => (
  <View style={styles.footer} fixed>
    <Text>MLPCARE Medical Park Hospital - İSG Raporu</Text>
    <Text>Sayfa {pageNumber}</Text>
  </View>
);

const CoverPage = ({ reportData }: { reportData: ReportData }) => (
  <Page size="A4" style={styles.coverPage}>
    <Image style={styles.coverLogo} src={LOGO_BASE64} />
    <Text style={styles.coverTitle}>İŞ SAĞLIĞI VE GÜVENLİĞİ</Text>
    <Text style={styles.coverTitle}>SAHA GÖZLEM RAPORU</Text>
    <Text style={styles.coverSubtitle}>{reportData.projectLocation}</Text>
    
    <View style={styles.coverInfo}>
      <View style={styles.coverInfoRow}>
        <Text style={styles.coverInfoLabel}>Rapor Numarası:</Text>
        <Text style={styles.coverInfoValue}>{reportData.reportNumber}</Text>
      </View>
      <View style={styles.coverInfoRow}>
        <Text style={styles.coverInfoLabel}>Rapor Tarihi:</Text>
        <Text style={styles.coverInfoValue}>
          {typeof reportData.reportDate === 'string' 
            ? reportData.reportDate 
            : new Date(reportData.reportDate).toLocaleDateString('tr-TR')}
        </Text>
      </View>
      <View style={styles.coverInfoRow}>
        <Text style={styles.coverInfoLabel}>Proje Lokasyonu:</Text>
        <Text style={styles.coverInfoValue}>{reportData.projectLocation}</Text>
      </View>
      <View style={styles.coverInfoRow}>
        <Text style={styles.coverInfoLabel}>İSG Uzmanı:</Text>
        <Text style={styles.coverInfoValue}>{reportData.reporter}</Text>
      </View>
      <View style={styles.coverInfoRow}>
        <Text style={styles.coverInfoLabel}>Toplam Bulgu:</Text>
        <Text style={styles.coverInfoValue}>{reportData.findings?.length || 0}</Text>
      </View>
    </View>
  </Page>
);

// 1. Yönetici Özeti
const ManagementSummaryPage = ({ reportData }: { reportData: ReportData }) => (
  <Page size="A4" style={styles.page}>
    <Header title="YÖNETİCİ ÖZETİ" />
    <Text style={styles.sectionTitle}>YÖNETİCİ ÖZETİ</Text>
    <View style={styles.sectionContent}>
      <Text style={styles.fieldText}>
        {reportData.managementSummary || 'Yönetici özeti henüz eklenmemiştir.'}
      </Text>
    </View>
    <Footer pageNumber={2} />
  </Page>
);

// 2. Tasarım/İmalat/Montaj Hataları  
const DesignErrorsPage = ({ findings }: { findings: Finding[] }) => {
  const designErrors = findings.filter(f => f.section === 1);
  return (
    <Page size="A4" style={styles.page}>
      <Header title="TASARIM/İMALAT/MONTAJ HATALARI" />
      <Text style={styles.sectionTitle}>TASARIM/İMALAT/MONTAJ HATALARI</Text>
      {designErrors.length === 0 ? (
        <View style={styles.sectionContent}>
          <Text style={styles.fieldText}>Bu bölümde herhangi bir bulgu tespit edilmemiştir.</Text>
        </View>
      ) : (
        designErrors.map((finding, index) => (
          <FindingComponent key={finding.id} finding={finding} findingNumber={index + 1} />
        ))
      )}
      <Footer pageNumber={3} />
    </Page>
  );
};

// 3. İş Sağlığı ve Güvenliği Bulguları
const SafetyFindingsPage = ({ findings }: { findings: Finding[] }) => {
  const safetyFindings = findings.filter(f => f.section === 2 || f.section === 3);
  return (
    <Page size="A4" style={styles.page}>
      <Header title="İŞ SAĞLIĞI VE GÜVENLİĞİ BULGULARI" />
      <Text style={styles.sectionTitle}>İŞ SAĞLIĞI VE GÜVENLİĞİ BULGULARI</Text>
      {safetyFindings.length === 0 ? (
        <View style={styles.sectionContent}>
          <Text style={styles.fieldText}>Bu bölümde herhangi bir bulgu tespit edilmemiştir.</Text>
        </View>
      ) : (
        safetyFindings.map((finding, index) => (
          <FindingComponent key={finding.id} finding={finding} findingNumber={index + 1} />
        ))
      )}
      <Footer pageNumber={4} />
    </Page>
  );
};

// 4. Tamamlanmış Bulgular
const CompletedFindingsPage = ({ findings }: { findings: Finding[] }) => {
  const completed = findings.filter(f => f.isCompleted || f.status === 'completed');
  return (
    <Page size="A4" style={styles.page}>
      <Header title="TAMAMLANMIŞ BULGULAR" />
      <Text style={styles.sectionTitle}>TAMAMLANMIŞ BULGULAR</Text>
      {completed.length === 0 ? (
        <View style={styles.sectionContent}>
          <Text style={styles.fieldText}>Henüz tamamlanan bulgu bulunmamaktadır.</Text>
        </View>
      ) : (
        completed.map((finding, index) => (
          <FindingComponent key={finding.id} finding={finding} findingNumber={index + 1} />
        ))
      )}
      <Footer pageNumber={5} />
    </Page>
  );
};

// 5. Genel Değerlendirme
const GeneralEvaluationPage = ({ reportData }: { reportData: ReportData }) => (
  <Page size="A4" style={styles.page}>
    <Header title="GENEL DEĞERLENDİRME" />
    <Text style={styles.sectionTitle}>GENEL DEĞERLENDİRME</Text>
    <View style={styles.sectionContent}>
      <Text style={styles.fieldText}>
        {reportData.generalEvaluation || 'Genel değerlendirme henüz eklenmemiştir.'}
      </Text>
    </View>
    <Footer pageNumber={6} />
  </Page>
);

const FindingComponent = ({ finding, findingNumber }: { finding: Finding; findingNumber: number }) => {
  const getRiskStyle = (level: string) => {
    switch (level) {
      case 'high': return styles.riskHigh;
      case 'medium': return styles.riskMedium;
      case 'low': return styles.riskLow;
      default: return styles.riskMedium;
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

  return (
    <View style={styles.finding} wrap={false}>
      <View style={styles.findingHeader}>
        <Text style={styles.findingTitle}>BULGU {findingNumber}: {finding.title}</Text>
        <View style={styles.findingMeta}>
          <Text style={styles.findingLocation}>Konum: {finding.location || 'Belirtilmemiş'}</Text>
          <Text style={getRiskStyle(finding.dangerLevel)}>{getRiskText(finding.dangerLevel)}</Text>
        </View>
      </View>
      
      <View style={styles.findingContent}>
        <Text style={styles.fieldLabel}>Mevcut Durum:</Text>
        <Text style={styles.fieldText}>{finding.currentSituation || finding.description}</Text>
        
        {finding.legalBasis && (
          <>
            <Text style={styles.fieldLabel}>Hukuki Dayanak:</Text>
            <Text style={styles.fieldText}>{finding.legalBasis}</Text>
          </>
        )}
        
        {finding.recommendation && (
          <>
            <Text style={styles.fieldLabel}>Öneri/Çözüm:</Text>
            <Text style={styles.fieldText}>{finding.recommendation}</Text>
          </>
        )}
        
        {finding.images && finding.images.length > 0 && (
          <>
            <Text style={styles.fieldLabel}>Fotoğraflar:</Text>
            {finding.images.slice(0, 3).map((imageUrl, index) => {
              if (imageUrl && imageUrl.startsWith('data:image/')) {
                return <Image key={index} style={styles.findingImage} src={imageUrl} />;
              }
              return null;
            })}
          </>
        )}
      </View>
    </View>
  );
};

const ReportDocument = ({ reportData }: { reportData: ReportData }) => (
  <Document>
    <CoverPage reportData={reportData} />
    <ManagementSummaryPage reportData={reportData} />
    <DesignErrorsPage findings={reportData.findings || []} />
    <SafetyFindingsPage findings={reportData.findings || []} />
    <CompletedFindingsPage findings={reportData.findings || []} />
    <GeneralEvaluationPage reportData={reportData} />
  </Document>
);

export class ReactPdfService {
  async generatePDF(reportData: ReportData): Promise<Uint8Array> {
    console.log('Generating PDF for report:', reportData.reportNumber);
    
    const pdfBuffer = await renderToBuffer(<ReportDocument reportData={reportData} />);
    console.log('PDF generated successfully, size:', pdfBuffer.length);
    
    return pdfBuffer instanceof Uint8Array ? pdfBuffer : new Uint8Array(pdfBuffer);
  }
}