import React from 'react';
import { renderToBuffer, Font, Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

// Simplified logo - small, clean SVG as base64 
const LOGO_BASE64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

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
    fontSize: 10,
    lineHeight: 1.4
  },
  coverPage: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '100%',
    padding: 40,
    fontFamily: 'Times-Roman'
  },
  logo: { width: 120, height: 40, marginBottom: 30, backgroundColor: '#1e40af' },
  coverTitle: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    color: '#1e40af', 
    textAlign: 'center', 
    marginBottom: 15, 
    fontFamily: 'Times-Bold' 
  },
  coverSubtitle: { fontSize: 16, color: '#475569', textAlign: 'center', marginBottom: 30 },
  coverInfo: { width: '100%', maxWidth: 400, marginTop: 30 },
  coverInfoRow: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    borderBottomStyle: 'solid'
  },
  coverInfoLabel: { 
    width: '45%', 
    fontSize: 11, 
    fontWeight: 'bold', 
    color: '#1e40af', 
    fontFamily: 'Times-Bold' 
  },
  coverInfoValue: { width: '55%', fontSize: 11, color: '#374151' },

  header: {
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 18, 
    paddingBottom: 10,
    borderBottomWidth: 2, 
    borderBottomColor: '#1e40af', 
    borderBottomStyle: 'solid'
  },
  headerLogo: { width: 80, height: 30, backgroundColor: '#1e40af' },
  headerTitle: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#1e40af', 
    fontFamily: 'Times-Bold' 
  },

  sectionContainer: { marginBottom: 22 },
  sectionHeader: { 
    backgroundColor: '#1e40af', 
    color: '#FFFFFF', 
    padding: 10, 
    fontSize: 14, 
    fontWeight: 'bold', 
    marginBottom: 12, 
    fontFamily: 'Times-Bold' 
  },
  sectionContent: { 
    padding: 12, 
    backgroundColor: '#f8fafc', 
    borderWidth: 1, 
    borderColor: '#e2e8f0', 
    borderStyle: 'solid' 
  },

  findingContainer: {
    marginBottom: 16,
    borderWidth: 1, 
    borderColor: '#d1d5db', 
    borderStyle: 'solid', 
    borderRadius: 6
  },
  findingHeader: { 
    backgroundColor: '#f3f4f6', 
    padding: 10, 
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
  findingMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  findingLocation: { fontSize: 9, color: '#6b7280' },

  riskBadge: { 
    paddingVertical: 3, 
    paddingHorizontal: 6, 
    borderRadius: 3, 
    fontSize: 8, 
    fontWeight: 'bold', 
    color: '#FFFFFF', 
    textAlign: 'center', 
    fontFamily: 'Times-Bold' 
  },
  riskHigh: { backgroundColor: '#dc2626' },
  riskMedium: { backgroundColor: '#ea580c' },
  riskLow: { backgroundColor: '#16a34a' },

  findingContent: { padding: 10 },
  findingLabel: { 
    fontSize: 10, 
    fontWeight: 'bold', 
    color: '#1e40af', 
    marginBottom: 5, 
    marginTop: 8, 
    fontFamily: 'Times-Bold' 
  },
  findingText: { 
    fontSize: 9, 
    lineHeight: 1.35, 
    color: '#374151', 
    textAlign: 'justify', 
    marginBottom: 6 
  },

  processStepsContainer: { marginTop: 10 },
  processStep: { 
    flexDirection: 'row', 
    marginBottom: 6, 
    padding: 6, 
    backgroundColor: '#f9fafb', 
    borderWidth: 1, 
    borderColor: '#e5e7eb', 
    borderStyle: 'solid', 
    borderRadius: 3 
  },
  processStepNumber: { 
    width: 16, 
    fontSize: 8, 
    fontWeight: 'bold', 
    color: '#1e40af', 
    fontFamily: 'Times-Bold' 
  },
  processStepContent: { flex: 1, fontSize: 8, color: '#374151' },
  processStepMeta: { fontSize: 7, color: '#6b7280', marginTop: 2 },

  footer: {
    position: 'absolute', 
    bottom: 15, 
    left: 30, 
    right: 30,
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    fontSize: 8, 
    color: '#6b7280',
    borderTopWidth: 1, 
    borderTopColor: '#e5e7eb', 
    borderTopStyle: 'solid',
    paddingTop: 8
  },
  pageNumber: { fontSize: 8, color: '#6b7280' },

  findingImage: { 
    width: 140, 
    height: 90, 
    marginTop: 6, 
    marginBottom: 6, 
    objectFit: 'cover' 
  }
});

// Simple logo placeholder - just colored rectangle for now
const LogoComponent = ({ style }: { style?: any }) => (
  <View style={[style, { backgroundColor: '#1e40af', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }]}>
    <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: 'bold', fontFamily: 'Times-Bold' }}>
      MLP
    </Text>
  </View>
);

const PageHeader = ({ title }: { title: string }) => (
  <View style={styles.header}>
    <LogoComponent style={styles.headerLogo} />
    <Text style={styles.headerTitle}>{title}</Text>
  </View>
);

const PageFooter = ({ pageNumber }: { pageNumber: number }) => (
  <View style={styles.footer} fixed>
    <Text>MLPCARE Medical Park Hospital - İSG Raporu</Text>
    <Text style={styles.pageNumber}>Sayfa {pageNumber}</Text>
  </View>
);

const CoverPage = ({ reportData }: { reportData: ReportData }) => (
  <Page size="A4" style={styles.coverPage}>
    <View style={{ alignItems: 'center' }}>
      <LogoComponent style={styles.logo} />
      <Text style={styles.coverTitle}>İŞ SAĞLIĞI VE GÜVENLİĞİ</Text>
      <Text style={styles.coverTitle}>SAHA GÖZLEM RAPORU</Text>
      <Text style={styles.coverSubtitle}>{reportData.projectLocation}</Text>
    </View>

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

    <Text style={{ fontSize: 9, color: '#6b7280', textAlign: 'center', marginTop: 20 }}>
      Bu rapor İş Sağlığı ve Güvenliği Kanunu kapsamında hazırlanmıştır.
    </Text>
  </Page>
);

const ManagementSummaryPage = ({ reportData, pageNo }: { reportData: ReportData; pageNo: number }) => (
  <Page size="A4" style={styles.page}>
    <PageHeader title="YÖNETİCİ ÖZETİ" />
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionHeader}>1. YÖNETİCİ ÖZETİ</Text>
      <View style={{ backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe', borderStyle: 'solid', padding: 12, borderRadius: 6 }}>
        <Text style={{ fontSize: 10, lineHeight: 1.45, color: '#374151', textAlign: 'justify' }}>
          {reportData.managementSummary || 
            'Bu rapor, işyerinde gerçekleştirilen İş Sağlığı ve Güvenliği denetimi sonucunda tespit edilen bulgular ve önerileri içermektedir. Raporda yer alan tespitlerin ivedilikle değerlendirilmesi ve gerekli önlemlerin alınması önerilmektedir.'}
        </Text>
      </View>
    </View>
    <PageFooter pageNumber={pageNo} />
  </Page>
);

const RepairFindingsPage = ({ findings, pageNo }: { findings: Finding[]; pageNo: number }) => {
  const repairFindings = findings.filter((f) => f.section === 1);
  return (
    <Page size="A4" style={styles.page}>
      <PageHeader title="TAMİRAT-TADİLAT BULGULARI" />
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionHeader}>2. TAMİRAT-TADİLAT BULGULARI</Text>
        {repairFindings.length === 0 ? (
          <View style={styles.sectionContent}>
            <Text style={{ fontSize: 10, lineHeight: 1.45, color: '#374151', textAlign: 'justify' }}>
              Bu bölümde herhangi bir bulgu tespit edilmemiştir.
            </Text>
          </View>
        ) : (
          repairFindings.map((finding, index) => (
            <View key={finding.id} wrap={false}>
              <FindingComponent finding={finding} findingNumber={index + 1} />
            </View>
          ))
        )}
      </View>
      <PageFooter pageNumber={pageNo} />
    </Page>
  );
};

const SafetyFindingsPage = ({ findings, pageNo }: { findings: Finding[]; pageNo: number }) => {
  const safetyFindings = findings.filter((f) => f.section === 2 || f.section === 3);
  return (
    <Page size="A4" style={styles.page}>
      <PageHeader title="İSG BULGULARI" />
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionHeader}>3. İŞ SAĞLIĞI VE GÜVENLİĞİ BULGULARI</Text>
        {safetyFindings.length === 0 ? (
          <View style={styles.sectionContent}>
            <Text style={{ fontSize: 10, lineHeight: 1.45, color: '#374151', textAlign: 'justify' }}>
              Bu bölümde herhangi bir bulgu tespit edilmemiştir.
            </Text>
          </View>
        ) : (
          safetyFindings.map((finding, index) => (
            <View key={finding.id} wrap={false}>
              <FindingComponent finding={finding} findingNumber={index + 1} />
            </View>
          ))
        )}
      </View>
      <PageFooter pageNumber={pageNo} />
    </Page>
  );
};

const CompletedFindingsPage = ({ findings, pageNo }: { findings: Finding[]; pageNo: number }) => {
  const completedFindings = findings.filter((f) => f.isCompleted || f.status === 'completed');
  return (
    <Page size="A4" style={styles.page}>
      <PageHeader title="TAMAMLANAN BULGULAR" />
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionHeader}>4. TAMAMLANAN BULGULAR</Text>
        {completedFindings.length === 0 ? (
          <View style={styles.sectionContent}>
            <Text style={{ fontSize: 10, lineHeight: 1.45, color: '#374151', textAlign: 'justify' }}>
              Henüz tamamlanan bulgu bulunmamaktadır.
            </Text>
          </View>
        ) : (
          completedFindings.map((finding, index) => (
            <View key={finding.id} wrap={false}>
              <FindingComponent finding={finding} findingNumber={index + 1} />
            </View>
          ))
        )}
      </View>
      <PageFooter pageNumber={pageNo} />
    </Page>
  );
};

const GeneralEvaluationPage = ({ reportData, pageNo }: { reportData: ReportData; pageNo: number }) => (
  <Page size="A4" style={styles.page}>
    <PageHeader title="GENEL DEĞERLENDİRME" />
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionHeader}>5. GENEL DEĞERLENDİRME VE ÖNERİLER</Text>
      <View style={styles.sectionContent}>
        <Text style={{ fontSize: 10, lineHeight: 1.45, color: '#374151', textAlign: 'justify' }}>
          {reportData.generalEvaluation ||
            'Gerçekleştirilen İş Sağlığı ve Güvenliği denetimi sonucunda, işyerinde tespit edilen bulgular değerlendirilmiş ve gerekli öneriler sunulmuştur. Tüm tespitlerin mevzuat uygunluğu açısından değerlendirilmesi ve ivedilikle gerekli önlemlerin alınması önerilmektedir.'}
        </Text>
        
        <Text style={styles.findingLabel}>Genel Öneriler:</Text>
        <Text style={{ fontSize: 10, lineHeight: 1.45, color: '#374151', marginBottom: 6 }}>
          • İş Sağlığı ve Güvenliği mevzuatına tam uyum sağlanmalıdır.
        </Text>
        <Text style={{ fontSize: 10, lineHeight: 1.45, color: '#374151', marginBottom: 6 }}>
          • Çalışanlara düzenli eğitimler verilmelidir.
        </Text>
        <Text style={{ fontSize: 10, lineHeight: 1.45, color: '#374151', marginBottom: 6 }}>
          • Risk değerlendirmesi güncel tutulmalıdır.
        </Text>
        <Text style={{ fontSize: 10, lineHeight: 1.45, color: '#374151', marginBottom: 6 }}>
          • Periyodik kontroller aksatılmamalıdır.
        </Text>
      </View>
    </View>
    <PageFooter pageNumber={pageNo} />
  </Page>
);

const FindingComponent = ({ finding, findingNumber }: { finding: Finding; findingNumber: number }) => {
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

  const isValidBase64Image = (src?: string) => {
    return src && src.startsWith('data:image/') && src.includes('base64,');
  };

  return (
    <View style={styles.findingContainer}>
      <View style={styles.findingHeader}>
        <Text style={styles.findingTitle}>BULGU {findingNumber}: {finding.title}</Text>
        <View style={styles.findingMeta}>
          <Text style={styles.findingLocation}>Konum: {finding.location || 'Belirtilmemiş'}</Text>
          <View style={getRiskStyle(finding.dangerLevel)}>
            <Text style={{ color: '#FFFFFF', fontSize: 8, fontWeight: 'bold' }}>
              {getRiskText(finding.dangerLevel)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.findingContent}>
        <Text style={styles.findingLabel}>Mevcut Durum:</Text>
        <Text style={styles.findingText}>{finding.currentSituation || finding.description}</Text>

        {!!finding.legalBasis && (
          <>
            <Text style={styles.findingLabel}>Hukuki Dayanak:</Text>
            <Text style={styles.findingText}>{finding.legalBasis}</Text>
          </>
        )}

        {!!finding.recommendation && (
          <>
            <Text style={styles.findingLabel}>Öneri/Çözüm:</Text>
            <Text style={styles.findingText}>{finding.recommendation}</Text>
          </>
        )}

        {!!finding.processSteps?.length && (
          <View style={styles.processStepsContainer}>
            <Text style={styles.findingLabel}>Süreç Adımları:</Text>
            {finding.processSteps.map((step, index) => (
              <View key={index} style={styles.processStep}>
                <Text style={styles.processStepNumber}>{index + 1}.</Text>
                <View style={styles.processStepContent}>
                  <Text style={{ fontSize: 8 }}>{step.description}</Text>
                  <Text style={styles.processStepMeta}>Tarih: {step.date}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {!!finding.images?.length && (
          <>
            <Text style={styles.findingLabel}>Ekteki Fotoğraflar:</Text>
            {finding.images.slice(0, 3).map((imageUrl, index) => (
              <View key={index}>
                {isValidBase64Image(imageUrl) ? (
                  <Image style={styles.findingImage} src={imageUrl!} />
                ) : (
                  <Text style={styles.findingText}>
                    Fotoğraf {index + 1}: Format desteklenmiyor (data:image/...;base64,... gerekli)
                  </Text>
                )}
              </View>
            ))}
          </>
        )}
      </View>
    </View>
  );
};

const ReportDocument = ({ reportData }: { reportData: ReportData }) => (
  <Document>
    <CoverPage reportData={reportData} />
    <ManagementSummaryPage reportData={reportData} pageNo={2} />
    <RepairFindingsPage findings={reportData.findings || []} pageNo={3} />
    <SafetyFindingsPage findings={reportData.findings || []} pageNo={4} />
    <CompletedFindingsPage findings={reportData.findings || []} pageNo={5} />
    <GeneralEvaluationPage reportData={reportData} pageNo={6} />
  </Document>
);

export class ReactPdfService {
  async generatePDF(reportData: ReportData): Promise<Uint8Array> {
    try {
      console.log('PDF generating for report:', reportData.reportNumber);
      
      // Normalize dates and ensure we have clean data
      const processedData: ReportData = {
        ...reportData,
        reportDate:
          typeof reportData.reportDate === 'string'
            ? reportData.reportDate
            : new Date(reportData.reportDate).toLocaleDateString('tr-TR'),
        findings: (reportData.findings || []).map((finding) => ({
          ...finding,
          title: (finding.title || '').trim() || 'Başlıksız Bulgu',
          description: (finding.description || finding.currentSituation || '').trim() || 'Açıklama girilmemiş',
          location: (finding.location || finding.title || '').trim() || 'Belirtilmemiş',
          processSteps: finding.processSteps || [],
          images: (finding.images || []).filter(img => img && img.length > 10) // Valid images only
        }))
      };

      const pdfBuffer = await renderToBuffer(<ReportDocument reportData={processedData} />);
      console.log('PDF generated successfully, size:', pdfBuffer.length);
      
      return pdfBuffer instanceof Uint8Array ? pdfBuffer : new Uint8Array(pdfBuffer);
    } catch (error) {
      console.error('PDF generation error:', error);
      throw new Error(`PDF oluşturulurken hata: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
    }
  }
}