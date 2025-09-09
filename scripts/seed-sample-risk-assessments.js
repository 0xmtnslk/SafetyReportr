// Sample risk assessment data seeding script
import { db } from '../server/db.js';
import { riskAssessments, hospitalDepartments, riskCategories, riskSubCategories } from '../shared/schema.js';
import { eq } from 'drizzle-orm';

const sampleRiskAssessments = {
  "Acil Servis": [
    {
      hazardDescription: "Acil serviste hasta nakil sedyelerinin fren sistemlerinde arıza",
      riskSituation: "Hasta nakil sırasında sedyenin kontrolsüz hareket etmesi",
      potentialConsequence: "Hasta ve personel yaralanması, hasta düşmesi",
      affectedPersons: ["Hasta", "Hemşire", "Doktor", "YSP"],
      currentStateDescription: "Sedyelerin bir kısmında fren sistemi düzgün çalışmıyor, bakım yetersiz",
      currentProbability: 3,
      currentFrequency: 6,
      currentSeverity: 15,
      improvementMeasures: "Sedyelerin düzenli bakım ve kontrolü, arızalı sedyelerin hemen değiştirilmesi",
      improvementResponsible: "Teknik Personel",
      targetDate: "2024-02-15",
      status: "open",
      priority: "high"
    },
    {
      hazardDescription: "Acil serviste enfeksiyon kontrol protokollerinin yetersiz uygulanması",
      riskSituation: "Hasta bakımı sırasında çapraz enfeksiyon riski",
      potentialConsequence: "Hastane enfeksiyonları, epidemi riski",
      affectedPersons: ["Hasta", "Hemşire", "Doktor", "Temizlik Personeli"],
      currentStateDescription: "El hijyeni protokolleri tam uygulanmıyor, dezenfektan kullanımı yetersiz",
      currentProbability: 6,
      currentFrequency: 6,
      currentSeverity: 40,
      improvementMeasures: "Enfeksiyon kontrol eğitimleri, protokol hatırlatıcıları, düzenli denetim",
      improvementResponsible: "Enfeksiyon Kontrol Hemşiresi",
      targetDate: "2024-01-30",
      status: "in_progress",
      priority: "critical"
    },
    {
      hazardDescription: "Acil serviste aşırı iş yükü nedeniyle personel yorgunluğu",
      riskSituation: "Yoğun çalışma temposu sonucu dikkat dağınıklığı ve hatalar",
      potentialConsequence: "Tıbbi hatalar, yanlış ilaç uygulaması, hasta güvenliği riski",
      affectedPersons: ["Hasta", "Doktor", "Hemşire"],
      currentStateDescription: "Vardiya başına düşen hasta sayısı fazla, personel rotasyonu yetersiz",
      currentProbability: 6,
      currentFrequency: 10,
      currentSeverity: 40,
      improvementMeasures: "Ek personel alımı, vardiya planlamasının iyileştirilmesi, molaların düzenlenmesi",
      improvementResponsible: "İnsan Kaynakları Müdürü",
      targetDate: "2024-03-01",
      status: "open",
      priority: "high"
    },
    {
      hazardDescription: "Acil servis girişinde hasta ve ziyaretçi kalabalığı",
      riskSituation: "Acil durumda tahliye güçlüğü, güvenlik problemleri",
      potentialConsequence: "Yangın veya acil durumda tahliye gecikmesi",
      affectedPersons: ["Hasta", "Ziyaretçi", "Çalışan"],
      currentStateDescription: "Bekleme alanı dar, hasta akış yönetimi yetersiz",
      currentProbability: 1,
      currentFrequency: 3,
      currentSeverity: 15,
      improvementMeasures: "Bekleme alanının genişletilmesi, hasta akış sisteminin iyileştirilmesi",
      improvementResponsible: "İdari İşler Müdürü",
      targetDate: "2024-04-01",
      status: "open",
      priority: "medium"
    },
    {
      hazardDescription: "Defibrilatör cihazlarının düzenli test edilmemesi",
      riskSituation: "Kritik anında cihaz çalışmaması",
      potentialConsequence: "Hasta kaybı, yaşam tehlikesi",
      affectedPersons: ["Hasta", "Doktor", "Hemşire"],
      currentStateDescription: "Cihazların günlük kontrolü yapılmıyor, pil seviyeleri kontrol edilmiyor",
      currentProbability: 0.5,
      currentFrequency: 1,
      currentSeverity: 100,
      improvementMeasures: "Günlük cihaz kontrol listesi oluşturulması, sorumlu personel atanması",
      improvementResponsible: "Biyomedikal Mühendisi",
      targetDate: "2024-01-20",
      status: "completed",
      priority: "critical"
    }
  ],
  "Ameliyathane": [
    {
      hazardDescription: "Ameliyat masası pozisyonlama sisteminde arıza",
      riskSituation: "Ameliyat sırasında hasta pozisyonunun bozulması",
      potentialConsequence: "Hasta yaralanması, ameliyat komplikasyonları",
      affectedPersons: ["Hasta", "Doktor", "Anestezi Teknisyeni"],
      currentStateDescription: "Bazı masaların hidrolik sisteminde sızıntı var",
      currentProbability: 1,
      currentFrequency: 2,
      currentSeverity: 40,
      improvementMeasures: "Ameliyat masalarının periyodik bakımı, yedek parça temini",
      improvementResponsible: "Biyomedikal Mühendisi",
      targetDate: "2024-02-01",
      status: "in_progress",
      priority: "high"
    },
    {
      hazardDescription: "Ameliyathanede havalandırma sisteminin yetersizliği",
      riskSituation: "Steril ortam koşullarının bozulması",
      potentialConsequence: "Ameliyat sonrası enfeksiyon riski",
      affectedPersons: ["Hasta", "Doktor", "Hemşire", "Anestezi Teknisyeni"],
      currentStateDescription: "HEPA filtre değişimi gecikmeli, basınç farkları kontrol edilmiyor",
      currentProbability: 3,
      currentFrequency: 6,
      currentSeverity: 40,
      improvementMeasures: "Filtre değişim planı oluşturulması, havalandırma sisteminin iyileştirilmesi",
      improvementResponsible: "Teknik Hizmetler Müdürü",
      targetDate: "2024-01-25",
      status: "open",
      priority: "high"
    },
    {
      hazardDescription: "Cerrahi aletlerin sterilizasyon süreçlerinde eksiklikler",
      riskSituation: "Steril olmayan aletlerle ameliyat yapılması riski",
      potentialConsequence: "Hastane enfeksiyonları, sepsis riski",
      affectedPersons: ["Hasta", "Doktor"],
      currentStateDescription: "Sterilizasyon indikatörleri düzenli kontrol edilmiyor",
      currentProbability: 0.5,
      currentFrequency: 3,
      currentSeverity: 100,
      improvementMeasures: "Sterilizasyon protokollerinin güncellenmesi, düzenli eğitimler",
      improvementResponsible: "CSSD Sorumlusu",
      targetDate: "2024-01-15",
      status: "completed",
      priority: "critical"
    },
    {
      hazardDescription: "Anestezi makinelerinin kalibrasyonu eksikliği",
      riskSituation: "Yanlış dozda anestezi uygulaması",
      potentialConsequence: "Hasta güvenliği riski, anestezi komplikasyonları",
      affectedPersons: ["Hasta", "Anestezi Doktoru"],
      currentStateDescription: "Cihazların periyodik kalibrasyonu yapılmıyor",
      currentProbability: 1,
      currentFrequency: 3,
      currentSeverity: 100,
      improvementMeasures: "Kalibrасyon planı oluşturulması, yetkin teknik personel eğitimi",
      improvementResponsible: "Biyomedikal Mühendisi",
      targetDate: "2024-02-10",
      status: "open",
      priority: "critical"
    },
    {
      hazardDescription: "Ameliyat sırasında elektrik kesintisi riski",
      riskSituation: "Kritik ameliyatların yarıda kalması",
      potentialConsequence: "Hasta kaybı riski, ameliyat komplikasyonları",
      affectedPersons: ["Hasta", "Doktor", "Anestezi Doktoru"],
      currentStateDescription: "UPS sistemi yetersiz, jeneratör bağlantısında gecikmeler",
      currentProbability: 0.2,
      currentFrequency: 1,
      currentSeverity: 100,
      improvementMeasures: "UPS kapasitesinin artırılması, jeneratör sisteminin iyileştirilmesi",
      improvementResponsible: "Elektrik Teknisyeni",
      targetDate: "2024-03-15",
      status: "open",
      priority: "critical"
    }
  ],
  "Yoğun Bakım": [
    {
      hazardDescription: "Mekanik ventilatör alarmlarının gecikmeli yanıtlanması",
      riskSituation: "Kritik hasta durumunda müdahale gecikmesi",
      potentialConsequence: "Hasta kaybı, solunum yetmezliği",
      affectedPersons: ["Hasta", "Yoğun Bakım Hemşiresi", "Doktor"],
      currentStateDescription: "Hemşire-hasta oranı yüksek, alarm sistemi yetersiz",
      currentProbability: 3,
      currentFrequency: 6,
      currentSeverity: 100,
      improvementMeasures: "Merkezi alarm sistemi kurulması, personel sayısının artırılması",
      improvementResponsible: "Yoğun Bakım Sorumlu Hemşiresi",
      targetDate: "2024-02-01",
      status: "open",
      priority: "critical"
    },
    {
      hazardDescription: "İnvaziv girişim yerlerinde enfeksiyon kontrol eksiklikleri",
      riskSituation: "Kateter ile ilişkili enfeksiyonlar",
      potentialConsequence: "Sepsis, uzun yatış süresi, hasta kaybı riski",
      affectedPersons: ["Hasta", "Hemşire", "Doktor"],
      currentStateDescription: "Kateter bakım protokolleri tam uygulanmıyor",
      currentProbability: 6,
      currentFrequency: 6,
      currentSeverity: 40,
      improvementMeasures: "Kateter bakım protokollerinin güncellenmesi, düzenli eğitimler",
      improvementResponsible: "Enfeksiyon Kontrol Hemşiresi",
      targetDate: "2024-01-30",
      status: "in_progress",
      priority: "high"
    },
    {
      hazardDescription: "İlaç pompa sistemlerinde programlama hataları",
      riskSituation: "Yanlış dozda ilaç infüzyonu",
      potentialConsequence: "İlaç intoksikasyonu, hasta güvenliği riski",
      affectedPersons: ["Hasta", "Hemşire"],
      currentStateDescription: "Çift kontrol sistemi uygulanmıyor, eğitim yetersiz",
      currentProbability: 1,
      currentFrequency: 3,
      currentSeverity: 100,
      improvementMeasures: "İlaç pompa eğitimleri, çift kontrol sisteminin uygulanması",
      improvementResponsible: "Hemşire Eğitim Sorumlusu",
      targetDate: "2024-01-20",
      status: "completed",
      priority: "critical"
    },
    {
      hazardDescription: "Yoğun bakımda gece vardiyasında personel yetersizliği",
      riskSituation: "Hasta başına düşen hemşire sayısının azalması",
      potentialConsequence: "Hasta takibinde gecikme, komplikasyonların atlanması",
      affectedPersons: ["Hasta", "Hemşire"],
      currentStateDescription: "Gece vardiyasında 1 hemşire 4-5 hastaya bakıyor",
      currentProbability: 6,
      currentFrequency: 10,
      currentSeverity: 40,
      improvementMeasures: "Gece vardiyası personel sayısının artırılması",
      improvementResponsible: "İnsan Kaynakları Müdürü",
      targetDate: "2024-03-01",
      status: "open",
      priority: "high"
    }
  ],
  "Laboratuvar": [
    {
      hazardDescription: "Kan örneklerinin yanlış etiketlenmesi",
      riskSituation: "Hasta karışıklığı ve yanlış sonuçlar",
      potentialConsequence: "Yanlış tanı, yanlış tedavi uygulaması",
      affectedPersons: ["Hasta", "Laboratuvar Teknisyeni", "Doktor"],
      currentStateDescription: "Manuel etiketleme sistemi, çift kontrol uygulanmıyor",
      currentProbability: 3,
      currentFrequency: 6,
      currentSeverity: 40,
      improvementMeasures: "Barkod sistemi uygulanması, çift kontrol protokolü",
      improvementResponsible: "Laboratuvar Müdürü",
      targetDate: "2024-02-15",
      status: "open",
      priority: "high"
    },
    {
      hazardDescription: "Kimyasal maddelerin uygunsuz depolanması",
      riskSituation: "Kimyasal sızıntı ve buhar maruziyeti",
      potentialConsequence: "Personel sağlığında bozulma, kimyasal yanık riski",
      affectedPersons: ["Laboratuvar Teknisyeni", "Temizlik Personeli"],
      currentStateDescription: "Havalandırma yetersiz, depo düzeni uygun değil",
      currentProbability: 1,
      currentFrequency: 2,
      currentSeverity: 15,
      improvementMeasures: "Kimyasal depo düzenlemesi, havalandırma iyileştirmesi",
      improvementResponsible: "İş Güvenliği Uzmanı",
      targetDate: "2024-01-25",
      status: "in_progress",
      priority: "medium"
    },
    {
      hazardDescription: "Biyomedikal atık yönetiminde eksiklikler",
      riskSituation: "Enfeksiyöz atıkların karışması",
      potentialConsequence: "Çevre kirliliği, personel enfeksiyon riski",
      affectedPersons: ["Laboratuvar Teknisyeni", "Temizlik Personeli", "Çalışan"],
      currentStateDescription: "Atık ayrıştırma tam yapılmıyor, eğitim yetersiz",
      currentProbability: 3,
      currentFrequency: 6,
      currentSeverity: 15,
      improvementMeasures: "Atık yönetimi eğitimleri, kontrol sisteminin güçlendirilmesi",
      improvementResponsible: "Çevre Güvenliği Sorumlusu",
      targetDate: "2024-02-01",
      status: "open",
      priority: "medium"
    }
  ],
  "Radyoloji": [
    {
      hazardDescription: "Radyasyon güvenlik protokollerinin eksik uygulanması",
      riskSituation: "Personel ve hasta radyasyon maruziyeti",
      potentialConsequence: "Uzun vadeli sağlık sorunları, kanser riski",
      affectedPersons: ["Hasta", "Radyoloji Teknisyeni", "Doktor"],
      currentStateDescription: "Kurşun önlük kullanımı tam değil, dozimetre kontrolleri eksik",
      currentProbability: 6,
      currentFrequency: 10,
      currentSeverity: 40,
      improvementMeasures: "Radyasyon güvenlik eğitimleri, düzenli dozimetre kontrolü",
      improvementResponsible: "Radyasyon Güvenlik Sorumlusu",
      targetDate: "2024-01-30",
      status: "open",
      priority: "high"
    },
    {
      hazardDescription: "MR cihazı manyetik alanında metal obje riski",
      riskSituation: "Manyetik alanda metal cisimlerin çekilmesi",
      potentialConsequence: "Ciddi yaralanma, cihaz hasarı",
      affectedPersons: ["Hasta", "Radyoloji Teknisyeni", "Ziyaretçi"],
      currentStateDescription: "Güvenlik kontrolleri yetersiz, uyarı işaretleri eksik",
      currentProbability: 1,
      currentFrequency: 2,
      currentSeverity: 100,
      improvementMeasures: "Metal detektör kurulması, güvenlik protokollerinin güçlendirilmesi",
      improvementResponsible: "Radyoloji Müdürü",
      targetDate: "2024-02-01",
      status: "in_progress",
      priority: "critical"
    },
    {
      hazardDescription: "Kontrast madde reaksiyon yönetimi eksikleri",
      riskSituation: "Alerjik reaksiyonlara müdahale gecikmesi",
      potentialConsequence: "Anafilaktik şok, hasta kaybı riski",
      affectedPersons: ["Hasta", "Radyoloji Teknisyeni", "Doktor"],
      currentStateDescription: "Acil müdahale kiti eksik, personel eğitimi yetersiz",
      currentProbability: 0.5,
      currentFrequency: 3,
      currentSeverity: 100,
      improvementMeasures: "Acil müdahale protokolü oluşturulması, düzenli simülasyon eğitimleri",
      improvementResponsible: "Radyoloji Doktoru",
      targetDate: "2024-01-20",
      status: "open",
      priority: "critical"
    }
  ]
};

async function seedSampleData() {
  console.log('🌱 Starting sample risk assessment seeding...');
  
  try {
    // Get user (admin/safety specialist) for assessor
    const users = await db.select().from(users).limit(1);
    if (users.length === 0) {
      console.error('No users found. Please create users first.');
      return;
    }
    
    const assessorId = users[0].id;
    
    // Get hospital departments and categories
    const departments = await db.select().from(hospitalDepartments);
    const categories = await db.select().from(riskCategories);
    const subCategories = await db.select().from(riskSubCategories);
    
    if (departments.length === 0 || categories.length === 0 || subCategories.length === 0) {
      console.error('Missing required data. Please ensure departments, categories, and sub-categories exist.');
      return;
    }
    
    // Default category and subcategory (use first available)
    const defaultCategory = categories[0];
    const defaultSubCategory = subCategories[0];
    
    let totalInserted = 0;
    
    for (const department of departments) {
      const sampleData = sampleRiskAssessments[department.name] || [];
      
      console.log(`Seeding ${sampleData.length} assessments for ${department.name}...`);
      
      for (let i = 0; i < sampleData.length; i++) {
        const sample = sampleData[i];
        
        // Calculate risk score
        const currentRiskScore = sample.currentProbability * sample.currentFrequency * sample.currentSeverity;
        
        // Determine risk level and color
        let currentRiskLevel = "Düşük Risk";
        let currentRiskColor = "bg-green-500";
        
        if (currentRiskScore >= 400) {
          currentRiskLevel = "Tolerans Gösterilemez Risk";
          currentRiskColor = "bg-red-600";
        } else if (currentRiskScore >= 200) {
          currentRiskLevel = "Yüksek Risk";
          currentRiskColor = "bg-red-500";
        } else if (currentRiskScore >= 70) {
          currentRiskLevel = "Önemli Risk";
          currentRiskColor = "bg-orange-500";
        } else if (currentRiskScore >= 20) {
          currentRiskLevel = "Olası Risk";
          currentRiskColor = "bg-yellow-600";
        }
        
        const assessmentNumber = `RA-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
        
        const assessmentData = {
          locationId: department.locationId,
          departmentId: department.id,
          assessorId,
          assessmentNumber,
          detectionDate: new Date(),
          categoryId: defaultCategory.id,
          subCategoryId: defaultSubCategory.id,
          area: `${department.name} Birimi`,
          activity: `${department.name} hizmet faaliyetleri`,
          hazardDescription: sample.hazardDescription,
          riskSituation: sample.riskSituation,
          potentialConsequence: sample.potentialConsequence,
          affectedPersons: sample.affectedPersons,
          currentStateDescription: sample.currentStateDescription,
          currentStateImages: [],
          currentProbability: sample.currentProbability,
          currentFrequency: sample.currentFrequency,
          currentSeverity: sample.currentSeverity,
          currentRiskScore,
          currentRiskLevel,
          currentRiskColor,
          improvementMeasures: sample.improvementMeasures,
          improvementResponsible: sample.improvementResponsible,
          targetDate: new Date(sample.targetDate),
          status: sample.status,
          priority: sample.priority,
        };
        
        await db.insert(riskAssessments).values(assessmentData);
        totalInserted++;
      }
    }
    
    console.log(`✅ Successfully seeded ${totalInserted} sample risk assessments!`);
    
  } catch (error) {
    console.error('❌ Error seeding sample data:', error);
  }
}

seedSampleData();