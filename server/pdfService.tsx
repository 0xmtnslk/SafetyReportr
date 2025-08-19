import React from 'react';
import { renderToBuffer, Font, Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

// Doğru MLP logo base64 (tam logo data'sı)
const LOGO_BASE64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAOoAAAByCAYAAABdoU1gAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAACv3SURBVHhe7Z13nFXVtfi/+5Tby/QZpjHg0ASRIk1RbLHGhqLErrEbTWLai4lJXt4vLyb68vKSqDHGRGONGmOLilgQRcSCVOkinYGpt7dzzu+PW7htEAI3PF8P5/9zzn7nrvPPnvtsvbaa4nzrvmOgYmJySGNlH/BxMTk0MMUVBOTEsAUVBOTEsAUVBOTEsAUVBOTEsAUVBOTEsAUVBOTEsAUVBOTEsAUVBOTEsAUVBOTEsAUVBOTEsAUVBOTEsAUVBOTEsAUVBOTEsAUVBOTEsAUVBOTEsAUVBOTEsAUVBOTEsAUVBOTEsAUVBOTEsAU1C8BkiShKgpWi4rNasGiqsiS+elLCVFq7kKFENRUljOwcQCyLOffBiAeT7Dqs88JBMMYRuHrCSFwOx2MGDIIqZcGm0gk2LS1je07OzLXyrxuWgc2oarKrowGBMNhVqxdTzye2HV9NwghcLucjBwyGET+3VwSCY1gOExXt48ef4BINIau6/nZChBC4HLaaRpQy6DmBgbUVON1O5FlmVA4QkdXNxu3bGfths10dvWQ0LSidVWMhroa6murUZTi9Q8QCIZYsXY9iYSWfwtS5Sv3uhk2uGWPdWAYBpFoDJ8/QLcvQDAUIhZP9FpeRZEZNawVu9W6x2f3Rmd3Dxs2byMSjeXfOigcfEEVAkmWcDkcOB32/Mv5CCFw2G043A5kWeJ/Y9b1T2IYBn5/kHgiQSKh5V8FSJIEAkmWsFlUrBYLsiwhBAiRCn1pGAaSJCGL5KyAYaDpOpquo+s6uq6j6Tqarm2YthsGmq4XpF0Z0e+mxClJElYkrBYLqqIg7eW7zP33vn1Jb/e7ERBCUON1MXp4K44t+pFhJOorlbSCJEk0N9Zy9eXnI8syDwj8wRBPPf8qc+ZQ2qN1OGycdOxx+dciIcTW/Y/SfT9HpIKBiCSJXRCJ8O8LNdZUwbXn1wZfJNJ04z/NcO+M8xgxpJHOrl6eePb9iq8dfshjJu0+89ZbBOJxtJTyJhKJBABCCGxWC1arBZtVxWqxoKgKsiwjhLhkIWA2izCMOBEYMQ1d1+8kJUiGobQxNnF32ZF+PGOm6Oo6u32cKlMH25N/J4n7bA10Q/Ou/+1+LuLuHtyMpZUtZ3e4X9lH8R7OMFJShGnQEZ1t+K//iZUrnrYQUyJRhGxb48d8U13IhAP7cF/Zq3jy2pXN9LIBGpf59BF5TwelO1Cg/vl5Kzj2s4qZj2++3I4nY96TJQm73YbzH//Byd/5NjdeeQlOhyg==";

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
  images?: string[]; // data URL formatında gelecek: data:image/jpeg;base64,....
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
    fontFamily: 'Helvetica',
    fontSize: 10,
    lineHeight: 1.35
  },
  coverPage: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '100%',
    padding: 40,
    fontFamily: 'Helvetica'
  },
  logo: { width: 160, height: 60, marginBottom: 30 },
  coverTitle: { fontSize: 24, fontWeight: 'bold', color: '#1e40af', textAlign: 'center', marginBottom: 15, fontFamily: 'Helvetica-Bold' },
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
  coverInfoLabel: { width: '45%', fontSize: 11, fontWeight: 'bold', color: '#1e40af', fontFamily: 'Helvetica-Bold' },
  coverInfoValue: { width: '55%', fontSize: 11, color: '#374151' },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 18, paddingBottom: 10,
    borderBottomWidth: 2, borderBottomColor: '#1e40af', borderBottomStyle: 'solid'
  },
  headerLogo: { width: 100, height: 38 },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e40af', fontFamily: 'Helvetica-Bold' },

  sectionContainer: { marginBottom: 22 },
  sectionHeader: { backgroundColor: '#1e40af', color: '#FFFFFF', padding: 10, fontSize: 14, fontWeight: 'bold', marginBottom: 12, fontFamily: 'Helvetica-Bold' },
  sectionContent: { padding: 12, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderStyle: 'solid' },

  findingContainer: {
    marginBottom: 16,
    borderWidth: 1, borderColor: '#d1d5db', borderStyle: 'solid', borderRadius: 6
  },
  findingHeader: { backgroundColor: '#f3f4f6', padding: 10, borderBottomWidth: 1, borderBottomColor: '#d1d5db', borderBottomStyle: 'solid' },
  findingTitle: { fontSize: 12, fontWeight: 'bold', color: '#111827', marginBottom: 6, fontFamily: 'Helvetica-Bold' },
  findingMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  findingLocation: { fontSize: 9, color: '#6b7280' },

  riskBadge: { paddingVertical: 3, paddingHorizontal: 6, borderRadius: 3, fontSize: 8, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center', fontFamily: 'Helvetica-Bold' },
  riskHigh: { backgroundColor: '#dc2626' },
  riskMedium: { backgroundColor: '#ea580c' },
  riskLow: { backgroundColor: '#16a34a' },

  findingContent: { padding: 10 },
  findingLabel: { fontSize: 10, fontWeight: 'bold', color: '#1e40af', marginBottom: 5, marginTop: 8, fontFamily: 'Helvetica-Bold' },
  findingText: { fontSize: 9, lineHeight: 1.35, color: '#374151', textAlign: 'justify', marginBottom: 6 },

  processStepsContainer: { marginTop: 10 },
  processStep: { flexDirection: 'row', marginBottom: 6, padding: 6, backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderStyle: 'solid', borderRadius: 3 },
  processStepNumber: { width: 16, fontSize: 8, fontWeight: 'bold', color: '#1e40af', fontFamily: 'Helvetica-Bold' },
  processStepContent: { flex: 1, fontSize: 8, color: '#374151' },
  processStepMeta: { fontSize: 7, color: '#6b7280', marginTop: 2 },

  footer: {
    position: 'absolute', bottom: 15, left: 30, right: 30,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    fontSize: 8, color: '#6b7280',
    borderTopWidth: 1, borderTopColor: '#e5e7eb', borderTopStyle: 'solid',
    paddingTop: 8
  },
  pageNumber: { fontSize: 8, color: '#6b7280' },

  findingImage: { width: 150, height: 100, marginTop: 6, marginBottom: 6, objectFit: 'cover' }
});

const LogoComponent = ({ style }: { style?: any }) => <Image style={style} src={LOGO_BASE64} />;

const PageHeader = ({ title }: { title: string }) => (
  <View style={styles.header}>
    <LogoComponent style={styles.headerLogo} />
    <Text style={styles.headerTitle}>{title}</Text>
  </View>
);

// Footer'ı sabitliyoruz ki sayfa düzeni stabil olsun
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
            <Text style={{ fontSize: 10, lineHeight: 1.45, color: '#374151', textAlign: 'justify' }}>Bu bölümde herhangi bir bulgu tespit edilmemiştir.</Text>
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
            <Text style={{ fontSize: 10, lineHeight: 1.45, color: '#374151', textAlign: 'justify' }}>Bu bölümde herhangi bir bulgu tespit edilmemiştir.</Text>
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
            <Text style={{ fontSize: 10, lineHeight: 1.45, color: '#374151', textAlign: 'justify' }}>Henüz tamamlanan bulgu bulunmamaktadır.</Text>
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
        <Text style={{ fontSize: 10, lineHeight: 1.45, color: '#374151', marginBottom: 6 }}>• İş Sağlığı ve Güvenliği mevzuatına tam uyum sağlanmalıdır.</Text>
        <Text style={{ fontSize: 10, lineHeight: 1.45, color: '#374151', marginBottom: 6 }}>• Çalışanlara düzenli eğitimler verilmelidir.</Text>
        <Text style={{ fontSize: 10, lineHeight: 1.45, color: '#374151', marginBottom: 6 }}>• Risk değerlendirmesi güncel tutulmalıdır.</Text>
        <Text style={{ fontSize: 10, lineHeight: 1.45, color: '#374151', marginBottom: 6 }}>• Periyodik kontroller aksatılmamalıdır.</Text>
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

  // Sadece data URL (base64) göster. DB'den zaten base64 alacağımız için en sağlam yöntem bu.
  const isRenderableImage = (src?: string) => !!src && src.startsWith('data:image/');

  return (
    <View style={styles.findingContainer}>
      <View style={styles.findingHeader}>
        <Text style={styles.findingTitle}>BULGU {findingNumber}: {finding.title}</Text>
        <View style={styles.findingMeta}>
          <Text style={styles.findingLocation}>Konum: {finding.location || 'Belirtilmemiş'}</Text>
          <View style={getRiskStyle(finding.dangerLevel)}>
            <Text style={{ color: '#FFFFFF', fontSize: 8, fontWeight: 'bold' }}>{getRiskText(finding.dangerLevel)}</Text>
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
                {isRenderableImage(imageUrl) ? (
                  <Image style={styles.findingImage} src={imageUrl!} />
                ) : (
                  <Text style={styles.findingText}>
                    Fotoğraf {index + 1}: Geçersiz format. Lütfen data:image/...;base64,... veriniz.
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
      console.log('Generating PDF for report:', reportData.reportNumber);
      
      // Tarih ve metin normalizasyonu
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
          // DB'den gelen base64 görsellerin boş olmayanlarını alalım
          images: (finding.images || []).filter(Boolean)
        }))
      };

      const pdfBuffer = await renderToBuffer(<ReportDocument reportData={processedData} />);
      // Buffer veya Uint8Array gelebilir; normalize et
      console.log('PDF generated successfully, size:', pdfBuffer.length);
      return pdfBuffer instanceof Uint8Array ? pdfBuffer : new Uint8Array(pdfBuffer);
    } catch (error) {
      console.error('PDF generation error:', error);
      throw new Error(`PDF oluşturulurken hata: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
    }
  }
}