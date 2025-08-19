import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import fs from 'fs';
import path from 'path';

// Doğru MLP logo base64
const LOGO_BASE64 = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAOoAAAByCAYAAABdoU1gAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAACv3SURBVHhe7Z13nFXVtfi/+5Tby/QZpjHg0ASRIk1RbLHGhqLErrEbTWLai4lJXt4vLyb68vKSqDHGRGONGmOLilgQRcSCVOkinYGpt7dzzu+PW7htEAI3PF8P5/9zzn7nrvPPnvtsvbaa4nzrvmOgYmJySGNlH/BxMTk0MMUVBOTEsAUVBOTEsAUVBOTEsAUVBOTEsAUVBOTEsAUVBOTEsAUVBOTEsAUVBOTEsAUVBOTEsAUVBOTEsAUVBOTEsAUVBOTEsAUVBOTEsAUVBOTEsAUVBOTEsAUVBOTEsAUVBOTEsAUVBOTEsAUVBOTEsAUVBOTEsAU1C8BkiShKgpWi4rNasGiqsiS+elLCVFq7kKFENRUljOwcQCyLOffBiAeT7Dqs88JBMMYRuHrCSFwOx2MGDIIqZcGm0gk2LS1je07OzLXyrxuWgc2oarKrowGBMNhVqxdTzye2HV9NwghcLucjBwyGET+3VwSCY1gOExXt48ef4BINIau6/nZChBC4HLaaRpQy6DmBgbUVON1O5FlmVA4QkdXNxu3bGfths10dvWQ0LSidVWMhroa6murUZTi9Q8QCIZYsXY9iYSWfwtS5Sv3uhk2uGWPdWAYBpFoDJ8/QLcvQDAUIhZP9FpeRZEZNawVu9W6x2f3Rmd3Dxs2byMSjeXfOii`;

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

// Helper function to convert image to base64
const getImageAsBase64 = (imagePath: string): string | null => {
  try {
    if (imagePath.startsWith('data:')) {
      return imagePath; // Already base64
    }
    
    if (imagePath.startsWith('/uploads/')) {
      const fullPath = path.join(process.cwd(), imagePath);
      if (fs.existsSync(fullPath)) {
        const imageBuffer = fs.readFileSync(fullPath);
        const ext = path.extname(imagePath).toLowerCase();
        const mimeType = ext === '.png' ? 'image/png' : 
                        ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' :
                        ext === '.webp' ? 'image/webp' : 'image/jpeg';
        return `data:${mimeType};base64,${imageBuffer.toString('base64')}`;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error converting image to base64:', error);
    return null;
  }
};

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: 'white',
    padding: 25,
    fontFamily: 'Helvetica',
    fontSize: 9,
    lineHeight: 1.3,
  },
  
  // Cover Page
  coverPage: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '100%',
    padding: 30,
  },
  
  logo: {
    width: 120,
    height: 45,
    marginBottom: 20,
  },
  
  coverTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e40af',
    textAlign: 'center',
    marginBottom: 10,
    fontFamily: 'Helvetica-Bold',
  },
  
  coverSubtitle: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 25,
  },
  
  coverInfo: {
    width: '100%',
    maxWidth: 350,
    marginTop: 25,
  },
  
  coverInfoRow: {
    flexDirection: 'row',
    marginBottom: 10,
    borderBottom: '1px solid #e2e8f0',
    paddingBottom: 6,
  },
  
  coverInfoLabel: {
    width: '45%',
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1e40af',
    fontFamily: 'Helvetica-Bold',
  },
  
  coverInfoValue: {
    width: '55%',
    fontSize: 10,
    color: '#374151',
  },
  
  // Headers
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 8,
    borderBottom: '2px solid #1e40af',
  },
  
  headerLogo: {
    width: 80,
    height: 30,
  },
  
  headerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e40af',
    fontFamily: 'Helvetica-Bold',
  },
  
  // Sections
  sectionContainer: {
    marginBottom: 20,
  },
  
  sectionHeader: {
    backgroundColor: '#1e40af',
    color: 'white',
    padding: 10,
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 12,
    fontFamily: 'Helvetica-Bold',
  },
  
  sectionContent: {
    padding: 12,
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
  },
  
  // Findings
  findingContainer: {
    marginBottom: 15,
    border: '1px solid #d1d5db',
    borderRadius: 4,
    overflow: 'hidden',
    breakInside: 'avoid',
  },
  
  findingHeader: {
    backgroundColor: '#f3f4f6',
    padding: 10,
    borderBottom: '1px solid #d1d5db',
  },
  
  findingTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 5,
    fontFamily: 'Helvetica-Bold',
  },
  
  findingMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  findingLocation: {
    fontSize: 8,
    color: '#6b7280',
  },
  
  riskBadge: {
    padding: '2 5',
    borderRadius: 2,
    fontSize: 7,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    fontFamily: 'Helvetica-Bold',
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
    padding: 10,
  },
  
  findingLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 4,
    marginTop: 8,
    fontFamily: 'Helvetica-Bold',
  },
  
  findingText: {
    fontSize: 8,
    lineHeight: 1.4,
    color: '#374151',
    textAlign: 'justify',
    marginBottom: 6,
  },
  
  // Process Steps
  processStepsContainer: {
    marginTop: 10,
  },
  
  processStep: {
    flexDirection: 'row',
    marginBottom: 4,
    padding: 4,
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: 2,
  },
  
  processStepNumber: {
    width: 12,
    fontSize: 7,
    fontWeight: 'bold',
    color: '#1e40af',
    fontFamily: 'Helvetica-Bold',
  },
  
  processStepContent: {
    flex: 1,
    fontSize: 7,
    color: '#374151',
  },
  
  processStepMeta: {
    fontSize: 6,
    color: '#6b7280',
    marginTop: 1,
  },
  
  // Footer
  footer: {
    position: 'absolute',
    bottom: 12,
    left: 25,
    right: 25,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 7,
    color: '#6b7280',
    borderTop: '1px solid #e5e7eb',
    paddingTop: 6,
  },
  
  pageNumber: {
    fontSize: 7,
    color: '#6b7280',
  },
  
  // Text
  bodyText: {
    fontSize: 9,
    lineHeight: 1.4,
    color: '#374151',
    textAlign: 'justify',
    marginBottom: 10,
  },
  
  summaryContainer: {
    backgroundColor: '#eff6ff',
    border: '1px solid #bfdbfe',
    padding: 12,
    borderRadius: 4,
    marginBottom: 12,
  },
  
  listText: {
    fontSize: 9,
    lineHeight: 1.4,
    color: '#374151',
    marginBottom: 6,
  },
  
  coverFooter: {
    fontSize: 8,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 15,
  },
  
  // Image
  findingImage: {
    width: 120,
    height: 80,
    marginTop: 6,
    marginBottom: 6,
    marginRight: 6,
  },
  
  imageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
  },
});

// Components
const LogoComponent = ({ style }: { style?: any }) => (
  <Image style={style} src={LOGO_BASE64} />
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

    <Text style={styles.coverFooter}>
      Bu rapor İş Sağlığı ve Güvenliği Kanunu kapsamında hazırlanmıştır.
    </Text>
  </Page>
);

const PageHeader = ({ title }: { title: string }) => (
  <View style={styles.header}>
    <LogoComponent style={styles.headerLogo} />
    <Text style={styles.headerTitle}>{title}</Text>
  </View>
);

const PageFooter = ({ pageNumber }: { pageNumber: number }) => (
  <View style={styles.footer}>
    <Text>MLPCARE Medical Park Hospital - İSG Raporu</Text>
    <Text style={styles.pageNumber}>Sayfa {pageNumber}</Text>
  </View>
);

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

const SafetyFindingsPage = ({ findings }: { findings: Finding[] }) => {
  const safetyFindings = findings.filter(f => f.section === 2 || f.section === 3);
  
  return (
    <Page size="A4" style={styles.page}>
      <PageHeader title="İSG BULGULARI" />
      
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionHeader}>2. İŞ SAĞLIĞI VE GÜVENLİĞİ BULGULARI</Text>
        
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
      
      <PageFooter pageNumber={3} />
    </Page>
  );
};

const GeneralEvaluationPage = ({ reportData }: { reportData: ReportData }) => (
  <Page size="A4" style={styles.page}>
    <PageHeader title="GENEL DEĞERLENDİRME" />
    
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionHeader}>3. GENEL DEĞERLENDİRME VE ÖNERİLER</Text>
      
      <View style={styles.sectionContent}>
        <Text style={styles.bodyText}>
          {reportData.generalEvaluation || 
           'Gerçekleştirilen İş Sağlığı ve Güvenliği denetimi sonucunda, işyerinde tespit edilen bulgular değerlendirilmiş ve gerekli öneriler sunulmuştur. Tüm tespitlerin mevzuat uygunluğu açısından değerlendirilmesi ve ivedilikle gerekli önlemlerin alınması önerilmektedir.'}
        </Text>
        
        <Text style={styles.findingLabel}>Genel Öneriler:</Text>
        <Text style={styles.listText}>• İş Sağlığı ve Güvenliği mevzuatına tam uyum sağlanmalıdır.</Text>
        <Text style={styles.listText}>• Çalışanlara düzenli eğitimler verilmelidir.</Text>
        <Text style={styles.listText}>• Risk değerlendirmesi güncel tutulmalıdır.</Text>
        <Text style={styles.listText}>• Periyodik kontroller aksatılmamalıdır.</Text>
      </View>
    </View>
    
    <PageFooter pageNumber={4} />
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
            <Text style={{ color: 'white' }}>{getRiskText(finding.dangerLevel)}</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.findingContent}>
        <Text style={styles.findingLabel}>Mevcut Durum:</Text>
        <Text style={styles.findingText}>
          {finding.currentSituation || finding.description}
        </Text>
        
        {finding.legalBasis && (
          <>
            <Text style={styles.findingLabel}>Hukuki Dayanak:</Text>
            <Text style={styles.findingText}>{finding.legalBasis}</Text>
          </>
        )}
        
        {finding.recommendation && (
          <>
            <Text style={styles.findingLabel}>Öneri/Çözüm:</Text>
            <Text style={styles.findingText}>{finding.recommendation}</Text>
          </>
        )}
        
        {finding.processSteps && finding.processSteps.length > 0 && (
          <View style={styles.processStepsContainer}>
            <Text style={styles.findingLabel}>Süreç Adımları:</Text>
            {finding.processSteps.map((step, index) => (
              <View key={index} style={styles.processStep}>
                <Text style={styles.processStepNumber}>{index + 1}.</Text>
                <View style={styles.processStepContent}>
                  <Text style={{ fontSize: 7 }}>{step.description}</Text>
                  <Text style={styles.processStepMeta}>Tarih: {step.date}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
        
        {finding.images && finding.images.length > 0 && (
          <>
            <Text style={styles.findingLabel}>Ekteki Fotoğraflar:</Text>
            <View style={styles.imageContainer}>
              {finding.images.map((imageUrl, index) => {
                const base64Image = getImageAsBase64(imageUrl);
                return base64Image ? (
                  <Image
                    key={index}
                    style={styles.findingImage}
                    src={base64Image}
                  />
                ) : (
                  <Text key={index} style={styles.findingText}>
                    Fotoğraf {index + 1} yüklenemedi
                  </Text>
                );
              })}
            </View>
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
    <SafetyFindingsPage findings={reportData.findings || []} />
    <GeneralEvaluationPage reportData={reportData} />
  </Document>
);

export class ReactPdfService {
  async generatePDF(reportData: ReportData): Promise<Uint8Array> {
    try {
      console.log('Generating PDF for report:', reportData.reportNumber);
      
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
        <ReportDocument reportData={processedData} />
      );
      
      console.log('PDF generated successfully, size:', pdfBuffer.length);
      return new Uint8Array(pdfBuffer);
    } catch (error) {
      console.error('PDF generation error:', error);
      throw new Error(`PDF oluşturulurken hata: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
    }
  }
}