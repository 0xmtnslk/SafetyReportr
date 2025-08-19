import React from 'react';
import { renderToBuffer, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

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
    padding: 25,
    fontFamily: 'Times-Roman',
    fontSize: 10,
    lineHeight: 1.3
  },
  
  // Header 
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2563eb',
    borderBottomStyle: 'solid'
  },
  headerLogo: {
    backgroundColor: '#2563eb',
    color: '#FFFFFF',
    padding: 8,
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'Times-Bold'
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2563eb',
    fontFamily: 'Times-Bold'
  },
  
  // Cover page
  coverPage: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    padding: 40
  },
  coverLogo: {
    backgroundColor: '#2563eb',
    color: '#FFFFFF',
    padding: 15,
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'Times-Bold',
    marginBottom: 30,
    textAlign: 'center',
    width: 180
  },
  coverTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2563eb',
    textAlign: 'center',
    marginBottom: 10,
    fontFamily: 'Times-Bold'
  },
  coverSubtitle: {
    fontSize: 16,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 30,
    fontFamily: 'Times-Roman'
  },
  
  // Info table
  infoTable: {
    width: '100%',
    maxWidth: 400,
    marginTop: 30
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    borderBottomStyle: 'solid'
  },
  infoLabel: {
    width: '45%',
    fontSize: 11,
    fontWeight: 'bold',
    color: '#2563eb',
    fontFamily: 'Times-Bold'
  },
  infoValue: {
    width: '55%',
    fontSize: 11,
    color: '#374151',
    fontFamily: 'Times-Roman'
  },
  
  // Sections
  sectionTitle: {
    backgroundColor: '#2563eb',
    color: '#FFFFFF',
    padding: 12,
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 15,
    fontFamily: 'Times-Bold',
    textAlign: 'center'
  },
  sectionContent: {
    padding: 15,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'solid',
    marginBottom: 20
  },
  sectionText: {
    fontSize: 10,
    lineHeight: 1.4,
    color: '#374151',
    textAlign: 'left',
    fontFamily: 'Times-Roman'
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
    fontSize: 12,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 6,
    fontFamily: 'Times-Bold'
  },
  findingMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  findingLocation: {
    fontSize: 9,
    color: '#6b7280',
    fontFamily: 'Times-Roman'
  },
  
  // Risk badges
  riskHigh: {
    backgroundColor: '#dc2626',
    color: '#FFFFFF',
    padding: 4,
    fontSize: 8,
    fontWeight: 'bold',
    fontFamily: 'Times-Bold'
  },
  riskMedium: {
    backgroundColor: '#ea580c',
    color: '#FFFFFF',
    padding: 4,
    fontSize: 8,
    fontWeight: 'bold',
    fontFamily: 'Times-Bold'
  },
  riskLow: {
    backgroundColor: '#16a34a',
    color: '#FFFFFF',
    padding: 4,
    fontSize: 8,
    fontWeight: 'bold',
    fontFamily: 'Times-Bold'
  },
  
  // Finding content
  findingContent: {
    padding: 12
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 4,
    marginTop: 8,
    fontFamily: 'Times-Bold'
  },
  fieldText: {
    fontSize: 9,
    lineHeight: 1.3,
    color: '#374151',
    marginBottom: 8,
    fontFamily: 'Times-Roman'
  },
  
  // Footer
  footer: {
    position: 'absolute',
    bottom: 15,
    left: 25,
    right: 25,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 8,
    color: '#6b7280',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    borderTopStyle: 'solid',
    paddingTop: 8,
    fontFamily: 'Times-Roman'
  }
});

// Header component
const Header = ({ title }: { title: string }) => (
  <View style={styles.header}>
    <Text style={styles.headerLogo}>MLPCARE</Text>
    <Text style={styles.headerTitle}>{title}</Text>
  </View>
);

// Footer component
const Footer = ({ pageNumber }: { pageNumber: number }) => (
  <View style={styles.footer} fixed>
    <Text>MLPCARE Medical Park Hospital - İSG Raporu</Text>
    <Text>Sayfa {pageNumber}</Text>
  </View>
);

// Cover page
const CoverPage = ({ reportData }: { reportData: ReportData }) => (
  <Page size="A4" style={styles.coverPage}>
    <Text style={styles.coverLogo}>MLPCARE</Text>
    
    <Text style={styles.coverTitle}>İŞ SAĞLIĞI VE GÜVENLİĞİ</Text>
    <Text style={styles.coverTitle}>SAHA GÖZLEM RAPORU</Text>
    <Text style={styles.coverSubtitle}>{reportData.projectLocation}</Text>
    
    <View style={styles.infoTable}>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Rapor Numarası:</Text>
        <Text style={styles.infoValue}>{reportData.reportNumber}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Rapor Tarihi:</Text>
        <Text style={styles.infoValue}>
          {typeof reportData.reportDate === 'string' 
            ? reportData.reportDate 
            : new Date(reportData.reportDate).toLocaleDateString('tr-TR')}
        </Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Proje Lokasyonu:</Text>
        <Text style={styles.infoValue}>{reportData.projectLocation}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>İSG Uzmanı:</Text>
        <Text style={styles.infoValue}>{reportData.reporter}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Toplam Bulgu:</Text>
        <Text style={styles.infoValue}>{reportData.findings?.length || 0}</Text>
      </View>
    </View>
    
    <Text style={{ fontSize: 9, color: '#6b7280', textAlign: 'center', marginTop: 25, fontFamily: 'Times-Roman' }}>
      Bu rapor İş Sağlığı ve Güvenliği Kanunu kapsamında hazırlanmıştır.
    </Text>
  </Page>
);

// 1. Yönetici Özeti
const ManagementSummaryPage = ({ reportData }: { reportData: ReportData }) => (
  <Page size="A4" style={styles.page}>
    <Header title="YÖNETİCİ ÖZETİ" />
    <Text style={styles.sectionTitle}>YÖNETİCİ ÖZETİ</Text>
    <View style={styles.sectionContent}>
      <Text style={styles.sectionText}>
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
          <Text style={styles.sectionText}>Bu bölümde herhangi bir bulgu tespit edilmemiştir.</Text>
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
          <Text style={styles.sectionText}>Bu bölümde herhangi bir bulgu tespit edilmemiştir.</Text>
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
          <Text style={styles.sectionText}>Henüz tamamlanan bulgu bulunmamaktadır.</Text>
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
      <Text style={styles.sectionText}>
        {reportData.generalEvaluation || 'Genel değerlendirme henüz eklenmemiştir.'}
      </Text>
    </View>
    <Footer pageNumber={6} />
  </Page>
);

// Finding component
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
        <Text style={styles.findingTitle}>
          BULGU {findingNumber}: {finding.title}
        </Text>
        <View style={styles.findingMeta}>
          <Text style={styles.findingLocation}>
            Konum: {finding.location || 'Belirtilmemiş'}
          </Text>
          <Text style={getRiskStyle(finding.dangerLevel)}>
            {getRiskText(finding.dangerLevel)}
          </Text>
        </View>
      </View>
      
      <View style={styles.findingContent}>
        <Text style={styles.fieldLabel}>Mevcut Durum:</Text>
        <Text style={styles.fieldText}>
          {finding.currentSituation || finding.description}
        </Text>
        
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
            <Text style={styles.fieldText}>
              {finding.images.length} adet fotoğraf eklenmiştir.
            </Text>
          </>
        )}
      </View>
    </View>
  );
};

// Main document
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
    console.log('PDF generating for report:', reportData.reportNumber);
    
    try {
      const pdfBuffer = await renderToBuffer(<ReportDocument reportData={reportData} />);
      console.log('PDF generated successfully, size:', pdfBuffer.length);
      
      return pdfBuffer instanceof Uint8Array ? pdfBuffer : new Uint8Array(pdfBuffer);
    } catch (error) {
      console.error('PDF generation error:', error);
      throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}