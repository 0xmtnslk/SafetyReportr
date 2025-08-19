
import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

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
  currentSituation?: string;
  dangerLevel: 'high' | 'medium' | 'low';
  recommendation?: string;
  images?: string[];
  location?: string;
  processSteps?: ProcessStep[];
  isCompleted?: boolean;
  status?: string;
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
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 11,
    lineHeight: 1.4,
  },
  
  // Cover Page Styles
  coverPage: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '100%',
    padding: 60,
  },
  
  logo: {
    width: 200,
    height: 80,
    marginBottom: 40,
  },
  
  coverTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2563eb',
    textAlign: 'center',
    marginBottom: 20,
  },
  
  coverSubtitle: {
    fontSize: 20,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 40,
  },
  
  coverInfo: {
    width: '100%',
    maxWidth: 400,
    marginTop: 40,
  },
  
  coverInfoRow: {
    flexDirection: 'row',
    marginBottom: 15,
    borderBottom: '1px solid #e2e8f0',
    paddingBottom: 10,
  },
  
  coverInfoLabel: {
    width: '40%',
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e40af',
  },
  
  coverInfoValue: {
    width: '60%',
    fontSize: 12,
    color: '#374151',
  },
  
  // Header Styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    paddingBottom: 15,
    borderBottom: '2px solid #2563eb',
  },
  
  headerLogo: {
    width: 120,
    height: 48,
  },
  
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e40af',
  },
  
  // Section Styles
  sectionContainer: {
    marginBottom: 30,
  },
  
  sectionHeader: {
    backgroundColor: '#2563eb',
    color: 'white',
    padding: 15,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  
  sectionContent: {
    padding: 20,
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
  },
  
  // Finding Styles
  findingContainer: {
    marginBottom: 25,
    border: '1px solid #d1d5db',
    borderRadius: 8,
    overflow: 'hidden',
  },
  
  findingHeader: {
    backgroundColor: '#f3f4f6',
    padding: 15,
    borderBottom: '1px solid #d1d5db',
  },
  
  findingTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  
  findingMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  findingLocation: {
    fontSize: 10,
    color: '#6b7280',
  },
  
  riskBadge: {
    padding: '4 8',
    borderRadius: 4,
    fontSize: 9,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
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
  
  findingContent: {
    padding: 15,
  },
  
  findingLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 6,
    marginTop: 12,
  },
  
  findingText: {
    fontSize: 10,
    lineHeight: 1.5,
    color: '#374151',
    textAlign: 'justify',
  },
  
  // Process Steps
  processStepsContainer: {
    marginTop: 15,
  },
  
  processStep: {
    flexDirection: 'row',
    marginBottom: 8,
    padding: 8,
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: 4,
  },
  
  processStepNumber: {
    width: 20,
    fontSize: 9,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  
  processStepContent: {
    flex: 1,
    fontSize: 9,
    color: '#374151',
  },
  
  processStepMeta: {
    fontSize: 8,
    color: '#6b7280',
    marginTop: 2,
  },
  
  // Footer Styles
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 9,
    color: '#6b7280',
    borderTop: '1px solid #e5e7eb',
    paddingTop: 10,
  },
  
  pageNumber: {
    fontSize: 9,
    color: '#6b7280',
  },
  
  // Text Styles
  bodyText: {
    fontSize: 11,
    lineHeight: 1.6,
    color: '#374151',
    textAlign: 'justify',
    marginBottom: 15,
  },
  
  summaryContainer: {
    backgroundColor: '#eff6ff',
    border: '1px solid #bfdbfe',
    padding: 20,
    borderRadius: 8,
    marginBottom: 20,
  },
});

// Logo component (base64 encoded MLPCARE logo placeholder)
const LogoComponent = ({ style }: { style?: any }) => (
  <View style={style}>
    <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#2563eb' }}>MLPCARE</Text>
    <Text style={{ fontSize: 10, color: '#6b7280' }}>MEDICAL PARK HOSPITAL</Text>
  </View>
);

// Cover Page Component
const CoverPage = ({ reportData }: { reportData: ReportData }) => (
  <Page size="A4" style={styles.coverPage}>
    <View style={{ alignItems: 'center' }}>
      <LogoComponent style={styles.logo} />
      
      <Text style={styles.coverTitle}>
        İŞ SAĞLIĞI VE GÜVENLİĞİ
      </Text>
      <Text style={styles.coverTitle}>
        SAHA GÖZLEM RAPORU
      </Text>
      
      <Text style={styles.coverSubtitle}>
        {reportData.projectLocation}
      </Text>
    </View>

    <View style={styles.coverInfo}>
      <View style={styles.coverInfoRow}>
        <Text style={styles.coverInfoLabel}>Rapor Numarası:</Text>
        <Text style={styles.coverInfoValue}>{reportData.reportNumber}</Text>
      </View>
      
      <View style={styles.coverInfoRow}>
        <Text style={styles.coverInfoLabel}>Rapor Tarihi:</Text>
        <Text style={styles.coverInfoValue}>{reportData.reportDate}</Text>
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

    <Text style={{ fontSize: 10, color: '#6b7280', textAlign: 'center' }}>
      Bu rapor İş Sağlığı ve Güvenliği Kanunu kapsamında hazırlanmıştır.
    </Text>
  </Page>
);

// Header Component for content pages
const PageHeader = ({ title }: { title: string }) => (
  <View style={styles.header}>
    <LogoComponent style={styles.headerLogo} />
    <Text style={styles.headerTitle}>{title}</Text>
  </View>
);

// Footer Component
const PageFooter = ({ pageNumber }: { pageNumber: number }) => (
  <View style={styles.footer}>
    <Text>MLPCARE Medical Park Hospital - İSG Raporu</Text>
    <Text style={styles.pageNumber}>Sayfa {pageNumber}</Text>
  </View>
);

// Section Components
const ManagementSummaryPage = ({ reportData }: { reportData: ReportData }) => (
  <Page size="A4" style={styles.page}>
    <PageHeader title="YÖNETİCİ ÖZETİ" />
    
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionHeader}>1. YÖNETİCİ ÖZETİ</Text>
      
      <View style={styles.summaryContainer}>
        <Text style={styles.bodyText}>
          {reportData.managementSummary || 
           'Bu rapor, işyerinde gerçekleştirilen İş Sağlığı ve Güvenliği denetimi sonucunda tespit edilen bulgular ve önerileri içermektedir. Raporda yer alan tespitlerin ivedilikle değerlendirilmesi ve gerekli önlemlerin alınması önerilmektedir.'}
        </Text>
      </View>
    </View>
    
    <PageFooter pageNumber={2} />
  </Page>
);

const RepairFindingsPage = ({ findings }: { findings: Finding[] }) => {
  const repairFindings = findings.filter(f => f.section === 1);
  
  return (
    <Page size="A4" style={styles.page}>
      <PageHeader title="TAMİRAT-TADİLAT BULGULARI" />
      
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionHeader}>2. TAMİRAT-TADİLAT BULGULARI</Text>
        
        {repairFindings.length === 0 ? (
          <View style={styles.sectionContent}>
            <Text style={styles.bodyText}>Bu bölümde herhangi bir bulgu tespit edilmemiştir.</Text>
          </View>
        ) : (
          repairFindings.map((finding, index) => (
            <FindingComponent key={finding.id} finding={finding} findingNumber={index + 1} />
          ))
        )}
      </View>
      
      <PageFooter pageNumber={3} />
    </Page>
  );
};

const SafetyFindingsPage = ({ findings }: { findings: Finding[] }) => {
  const safetyFindings = findings.filter(f => f.section === 2 || f.section === 3);
  
  return (
    <Page size="A4" style={styles.page}>
      <PageHeader title="İSG BULGULARI" />
      
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionHeader}>3. İŞ SAĞLIĞI VE GÜVENLİĞİ BULGULARI</Text>
        
        {safetyFindings.length === 0 ? (
          <View style={styles.sectionContent}>
            <Text style={styles.bodyText}>Bu bölümde herhangi bir bulgu tespit edilmemiştir.</Text>
          </View>
        ) : (
          safetyFindings.map((finding, index) => (
            <FindingComponent key={finding.id} finding={finding} findingNumber={index + 1} />
          ))
        )}
      </View>
      
      <PageFooter pageNumber={4} />
    </Page>
  );
};

const CompletedFindingsPage = ({ findings }: { findings: Finding[] }) => {
  const completedFindings = findings.filter(f => f.isCompleted || f.status === 'completed');
  
  return (
    <Page size="A4" style={styles.page}>
      <PageHeader title="TAMAMLANAN BULGULAR" />
      
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionHeader}>4. TAMAMLANAN BULGULAR</Text>
        
        {completedFindings.length === 0 ? (
          <View style={styles.sectionContent}>
            <Text style={styles.bodyText}>Henüz tamamlanan bulgu bulunmamaktadır.</Text>
          </View>
        ) : (
          completedFindings.map((finding, index) => (
            <FindingComponent key={finding.id} finding={finding} findingNumber={index + 1} />
          ))
        )}
      </View>
      
      <PageFooter pageNumber={5} />
    </Page>
  );
};

const GeneralEvaluationPage = ({ reportData }: { reportData: ReportData }) => (
  <Page size="A4" style={styles.page}>
    <PageHeader title="GENEL DEĞERLENDİRME" />
    
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionHeader}>5. GENEL DEĞERLENDİRME VE ÖNERİLER</Text>
      
      <View style={styles.sectionContent}>
        <Text style={styles.bodyText}>
          {reportData.generalEvaluation || 
           'Gerçekleştirilen İş Sağlığı ve Güvenliği denetimi sonucunda, işyerinde tespit edilen bulgular değerlendirilmiş ve gerekli öneriler sunulmuştur. Tüm tespitlerin mevzuat uygunluğu açısından değerlendirilmesi ve ivedilikle gerekli önlemlerin alınması önerilmektedir.'}
        </Text>
        
        <Text style={styles.findingLabel}>Genel Öneriler:</Text>
        <Text style={styles.bodyText}>
          • İş Sağlığı ve Güvenliği mevzuatına tam uyum sağlanmalıdır.{'\n'}
          • Çalışanlara düzenli eğitimler verilmelidir.{'\n'}
          • Risk değerlendirmesi güncel tutulmalıdır.{'\n'}
          • Periyodik kontroller aksatılmamalıdır.
        </Text>
      </View>
    </View>
    
    <PageFooter pageNumber={6} />
  </Page>
);

// Finding Component
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

  return (
    <View style={styles.findingContainer}>
      <View style={styles.findingHeader}>
        <Text style={styles.findingTitle}>
          BULGU {findingNumber}: {finding.title}
        </Text>
        <View style={styles.findingMeta}>
          <Text style={styles.findingLocation}>
            Konum: {finding.location || 'Belirtilmemiş'}
          </Text>
          <View style={getRiskStyle(finding.dangerLevel)}>
            <Text>{getRiskText(finding.dangerLevel)}</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.findingContent}>
        <Text style={styles.findingLabel}>Mevcut Durum:</Text>
        <Text style={styles.findingText}>
          {finding.currentSituation || finding.description}
        </Text>
        
        {finding.recommendation && (
          <>
            <Text style={styles.findingLabel}>Öneri/Çözüm:</Text>
            <Text style={styles.findingText}>{finding.recommendation}</Text>
          </>
        )}
        
        {finding.processSteps && finding.processSteps.length > 0 && (
          <View style={styles.processStepsContainer}>
            <Text style={styles.findingLabel}>Süreç Yönetimi:</Text>
            {finding.processSteps.map((step, index) => (
              <View key={index} style={styles.processStep}>
                <Text style={styles.processStepNumber}>{index + 1}.</Text>
                <View style={styles.processStepContent}>
                  <Text style={{ fontSize: 9 }}>{step.description}</Text>
                  <Text style={styles.processStepMeta}>
                    Sorumlu: {step.responsible} | Hedef: {step.targetDate} | Durum: {step.status}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
        
        {finding.images && finding.images.length > 0 && (
          <>
            <Text style={styles.findingLabel}>Ekteki Fotoğraflar:</Text>
            <Text style={styles.findingText}>
              Bu bulguya ait {finding.images.length} adet fotoğraf raporda mevcuttur.
            </Text>
          </>
        )}
      </View>
    </View>
  );
};

// Main Document Component
const ReportDocument = ({ reportData }: { reportData: ReportData }) => (
  <Document>
    <CoverPage reportData={reportData} />
    <ManagementSummaryPage reportData={reportData} />
    <RepairFindingsPage findings={reportData.findings || []} />
    <SafetyFindingsPage findings={reportData.findings || []} />
    <CompletedFindingsPage findings={reportData.findings || []} />
    <GeneralEvaluationPage reportData={reportData} />
  </Document>
);

export class ReactPdfService {
  async generatePDF(reportData: ReportData): Promise<Uint8Array> {
    try {
      console.log('Generating PDF for report:', reportData.reportNumber);
      
      // Ensure Turkish characters are properly handled
      const processedData = {
        ...reportData,
        reportDate: typeof reportData.reportDate === 'string' 
          ? reportData.reportDate 
          : new Date(reportData.reportDate).toLocaleDateString('tr-TR'),
        findings: (reportData.findings || []).map(finding => ({
          ...finding,
          title: finding.title || 'Başlıksız Bulgu',
          description: finding.description || finding.currentSituation || 'Açıklama girilmemiş',
          location: finding.location || finding.title || 'Belirtilmemiş',
          processSteps: finding.processSteps || [],
          images: finding.images || []
        }))
      };

      const pdfBuffer = await renderToBuffer(
        React.createElement(ReportDocument, { reportData: processedData })
      );
      
      console.log('PDF generated successfully, size:', pdfBuffer.length);
      return new Uint8Array(pdfBuffer);
    } catch (error) {
      console.error('PDF generation error:', error);
      throw new Error(`PDF oluşturulurken hata: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
    }
  }
}
