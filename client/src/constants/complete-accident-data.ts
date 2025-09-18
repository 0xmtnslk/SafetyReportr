// Complete Accident Management Data Constants with all Turkish healthcare positions
import { ALL_HEALTHCARE_POSITIONS } from "./all-positions-data";

export const WORK_SHIFTS = [
  { value: "Gündüz Mesaisi", label: "Gündüz Mesaisi" },
  { value: "Gece Mesaisi", label: "Gece Mesaisi" }
];

export const EVENT_TYPES = [
  { value: "İş Kazası", label: "İş Kazası" },
  { value: "Ramak Kala", label: "Ramak Kala" }
];

export const EVENT_AREAS = [
  { value: "Atık Alanları", label: "Atık Alanları" },
  { value: "Depo Alanları", label: "Depo Alanları" },
  { value: "Genel - Ofis Alanları", label: "Genel - Ofis Alanları" },
  { value: "Hasta Bakım Alanları", label: "Hasta Bakım Alanları" },
  { value: "Teknik Alanlar", label: "Teknik Alanlar" },
  { value: "Diğer Alanlar", label: "Diğer Alanlar" }
];

export const EVENT_PLACES = {
  "Atık Alanları": [
    { value: "Tıbbi Atık Alanı", label: "Tıbbi Atık Alanı" },
    { value: "Tehlikeli Atık Alanı", label: "Tehlikeli Atık Alanı" },
    { value: "Evsel Atık Alanı", label: "Evsel Atık Alanı" },
    { value: "Geri Dönüşüm Alanı", label: "Geri Dönüşüm Alanı" },
    { value: "Radyoaktif Atık Alanı", label: "Radyoaktif Atık Alanı" }
  ],
  "Depo Alanları": [
    { value: "Ameliyathane Depo", label: "Ameliyathane Depo" },
    { value: "Ana Depo", label: "Ana Depo" },
    { value: "Eczane Depo", label: "Eczane Depo" },
    { value: "Kimyasal Malzeme Deposu", label: "Kimyasal Malzeme Deposu" },
    { value: "Mutfak Depo", label: "Mutfak Depo" },
    { value: "Temizlik Depo", label: "Temizlik Depo" }
  ],
  "Genel - Ofis Alanları": [
    { value: "Asansörler", label: "Asansörler" },
    { value: "Bebek Bakım Odası", label: "Bebek Bakım Odası" },
    { value: "Dış Alan-Hastane Bahçesi", label: "Dış Alan-Hastane Bahçesi" },
    { value: "Diğer Ortak Alanlar (Lobi, Koridor vb.)", label: "Diğer Ortak Alanlar (Lobi, Koridor vb.)" },
    { value: "İbadethaneler", label: "İbadethaneler" },
    { value: "İdari Ofisler", label: "İdari Ofisler" },
    { value: "Kafeterya", label: "Kafeterya" },
    { value: "Lojman", label: "Lojman" },
    { value: "Merdivenler / Yürüyen Merdivenler", label: "Merdivenler / Yürüyen Merdivenler" },
    { value: "Otopark", label: "Otopark" },
    { value: "Servis / Şirket Aracı", label: "Servis / Şirket Aracı" },
    { value: "Soyunma Odaları", label: "Soyunma Odaları" },
    { value: "Yemekhane", label: "Yemekhane" }
  ],
  "Hasta Bakım Alanları": [
    { value: "Acil Servis", label: "Acil Servis" },
    { value: "Ameliyathane", label: "Ameliyathane" },
    { value: "Anjiyo Gözlem", label: "Anjiyo Gözlem" },
    { value: "Endoskopi", label: "Endoskopi" },
    { value: "Fizik Tedavi ve Rehabilitasyon Ünitesi", label: "Fizik Tedavi ve Rehabilitasyon Ünitesi" },
    { value: "Kan Alma", label: "Kan Alma" },
    { value: "Kemoterapi-Onkoloji", label: "Kemoterapi-Onkoloji" },
    { value: "Laboratuvar", label: "Laboratuvar" },
    { value: "Merkezi Sterilizasyon Ünitesi", label: "Merkezi Sterilizasyon Ünitesi" },
    { value: "Nükleer Tıp", label: "Nükleer Tıp" },
    { value: "Poliklinik", label: "Poliklinik" },
    { value: "Radyasyon Onkolojisi", label: "Radyasyon Onkolojisi" },
    { value: "Radyoloji", label: "Radyoloji" },
    { value: "Saç Ekimi", label: "Saç Ekimi" },
    { value: "Tüp Bebek (IVF) Ünitesi", label: "Tüp Bebek (IVF) Ünitesi" },
    { value: "Yatan Hasta Servisi ve Hasta Bakım Alanı", label: "Yatan Hasta Servisi ve Hasta Bakım Alanı" },
    { value: "Yoğun Bakım (Erişkin)", label: "Yoğun Bakım (Erişkin)" },
    { value: "Yoğun Bakım (Koroner)", label: "Yoğun Bakım (Koroner)" },
    { value: "Yoğun Bakım (KVC)", label: "Yoğun Bakım (KVC)" },
    { value: "Yoğun Bakım (Pediatri)", label: "Yoğun Bakım (Pediatri)" },
    { value: "Yoğun Bakım (Yenidoğan)", label: "Yoğun Bakım (Yenidoğan)" },
    { value: "Diğer", label: "Diğer" }
  ],
  "Teknik Alanlar": [
    { value: "ADP Alanı", label: "ADP Alanı" },
    { value: "Asansör Makine Dairesi", label: "Asansör Makine Dairesi" },
    { value: "Biyomedikal Ofis / Atölye", label: "Biyomedikal Ofis / Atölye" },
    { value: "Çatı Alanı", label: "Çatı Alanı" },
    { value: "Hidrofor Alanı", label: "Hidrofor Alanı" },
    { value: "Jeneratör Alanı", label: "Jeneratör Alanı" },
    { value: "Kazan Dairesi", label: "Kazan Dairesi" },
    { value: "Klima Santral Alanı", label: "Klima Santral Alanı" },
    { value: "Medikal Gaz Alanı", label: "Medikal Gaz Alanı" },
    { value: "Pano Odası", label: "Pano Odası" },
    { value: "Server Alanı", label: "Server Alanı" },
    { value: "Teknik Ofis / Atölye", label: "Teknik Ofis / Atölye" },
    { value: "Trafo Alanı", label: "Trafo Alanı" },
    { value: "UPS Odası", label: "UPS Odası" },
    { value: "Diğer", label: "Diğer" }
  ],
  "Diğer Alanlar": [
    { value: "Arşiv", label: "Arşiv" },
    { value: "CCTV", label: "CCTV" },
    { value: "Çamaşırhane", label: "Çamaşırhane" },
    { value: "Eczane", label: "Eczane" },
    { value: "Morg", label: "Morg" },
    { value: "Mutfak", label: "Mutfak" },
    { value: "Santral / Çağrı Merkezi", label: "Santral / Çağrı Merkezi" },
    { value: "Diğer", label: "Diğer" }
  ]
};

export const EMPLOYEE_STATUS = [
  { value: "Kadrolu", label: "Kadrolu" },
  { value: "Kadrosuz", label: "Kadrosuz" },
  { value: "Stajyer", label: "Stajyer" },
  { value: "Geçici Taşeron", label: "Geçici Taşeron" },
  { value: "Sürekli Taşeron", label: "Sürekli Taşeron" }
];

export const PROFESSION_GROUPS = [
  { value: "Atık Personeli", label: "Atık Personeli" },
  { value: "Destek Personeli", label: "Destek Personeli" },
  { value: "Estetisyen / Diyetisyen / Fizyoterapist / Psikolog", label: "Estetisyen / Diyetisyen / Fizyoterapist / Psikolog" },
  { value: "Eczacı", label: "Eczacı" },
  { value: "Güvenlik Personeli", label: "Güvenlik Personeli" },
  { value: "Hekim", label: "Hekim" },
  { value: "Hemşire / Ebe / ATT", label: "Hemşire / Ebe / ATT" },
  { value: "İdari Personel", label: "İdari Personel" },
  { value: "Mutfak Personeli", label: "Mutfak Personeli" },
  { value: "Paramedik", label: "Paramedik" },
  { value: "Porter / YP", label: "Porter / YP" },
  { value: "Teknik Personel", label: "Teknik Personel" },
  { value: "Tekniker / Teknisyen", label: "Tekniker / Teknisyen" },
  { value: "Temizlik Personeli", label: "Temizlik Personeli" },
  { value: "Vale / Şoför", label: "Vale / Şoför" },
  { value: "Diğer", label: "Diğer" }
];

export const DEPARTMENTS = [
  { value: "Anlaşmalı Kurumlar Müdürlüğü", label: "Anlaşmalı Kurumlar Müdürlüğü" },
  { value: "Başhekimlik", label: "Başhekimlik" },
  { value: "Bilgi Sistemleri Müdürlüğü", label: "Bilgi Sistemleri Müdürlüğü" },
  { value: "Biyomedikal Müdürlüğü", label: "Biyomedikal Müdürlüğü" },
  { value: "Çağrı Merkezi", label: "Çağrı Merkezi" },
  { value: "Dış Görüntüleme ve İhale Müdürlüğü", label: "Dış Görüntüleme ve İhale Müdürlüğü" },
  { value: "Hasta Bakım Hizmetleri Müdürlüğü", label: "Hasta Bakım Hizmetleri Müdürlüğü" },
  { value: "Hasta Hakları Müdürlüğü", label: "Hasta Hakları Müdürlüğü" },
  { value: "Hekimlik", label: "Hekimlik" },
  { value: "Hukuk Müşavirliği", label: "Hukuk Müşavirliği" },
  { value: "İnsan Kaynakları Müdürlüğü", label: "İnsan Kaynakları Müdürlüğü" },
  { value: "İş Sağlığı ve Güvenliği", label: "İş Sağlığı ve Güvenliği" },
  { value: "Kalite Müdürlüğü", label: "Kalite Müdürlüğü" },
  { value: "Kurumsal Faturalama Müdürlüğü", label: "Kurumsal Faturalama Müdürlüğü" },
  { value: "Kurumsal Tanıtım Müdürlüğü", label: "Kurumsal Tanıtım Müdürlüğü" },
  { value: "Mali İşler Müdürlüğü", label: "Mali İşler Müdürlüğü" },
  { value: "Misafir Hizmetleri Müdürlüğü", label: "Misafir Hizmetleri Müdürlüğü" },
  { value: "Otelcilik Hizmetleri Müdürlüğü", label: "Otelcilik Hizmetleri Müdürlüğü" },
  { value: "Resmi İşlemler ve Ruhsatlandırma Müdürlüğü", label: "Resmi İşlemler ve Ruhsatlandırma Müdürlüğü" },
  { value: "Satınalma Müdürlüğü", label: "Satınalma Müdürlüğü" },
  { value: "Teknik Hizmetler Müdürlüğü", label: "Teknik Hizmetler Müdürlüğü" },
  { value: "Uluslararası Misafir Hizmetleri Müdürlüğü", label: "Uluslararası Misafir Hizmetleri Müdürlüğü" },
  { value: "Üst Yönetim", label: "Üst Yönetim" }
];

// Export the complete 700+ positions from Turkish healthcare settings
export const COMPLETE_POSITIONS = ALL_HEALTHCARE_POSITIONS;

// Accident Cause Types
export const ACCIDENT_CAUSE_TYPES = [
  { value: "Tehlikeli Durum", label: "Tehlikeli Durum" },
  { value: "Tehlikeli Hareket", label: "Tehlikeli Hareket" },
  { value: "Tehlikeli Durum ve Tehlikeli Hareket", label: "Tehlikeli Durum ve Tehlikeli Hareket" }
];

// Kaza Ciddiyeti
export const ACCIDENT_SEVERITY = [
  { value: "Sadece Zarar", label: "Sadece Zarar" },
  { value: "Hafif Yaralanma", label: "Hafif Yaralanma" },
  { value: "Ciddi Yaralanma", label: "Ciddi Yaralanma" },
  { value: "Çok Ciddi Yaralanma", label: "Çok Ciddi Yaralanma" },
  { value: "Ölümcül Kaza", label: "Ölümcül Kaza" }
];

// Kazalanan Vücut Bölgesi
export const INJURED_BODY_PARTS = [
  { value: "Ayak", label: "Ayak" },
  { value: "Bacak", label: "Bacak" },
  { value: "Bel", label: "Bel" },
  { value: "Boyun", label: "Boyun" },
  { value: "Göğüs", label: "Göğüs" },
  { value: "Göz", label: "Göz" },
  { value: "Kol", label: "Kol" },
  { value: "Kulak", label: "Kulak" },
  { value: "Omuz", label: "Omuz" },
  { value: "Parmak", label: "Parmak" },
  { value: "Sırt", label: "Sırt" },
  { value: "Solunum Bölgesi", label: "Solunum Bölgesi" },
  { value: "Yüz", label: "Yüz" },
  { value: "Vücudun Çeşitli Bölgeleri", label: "Vücudun Çeşitli Bölgeleri" }
];

// Yaralanmaya Neden Olan Unsur / Ekipman
export const CAUSING_EQUIPMENT = [
  { value: "Asansör ve Yürüyen Merdivenler", label: "Asansör ve Yürüyen Merdivenler" },
  { value: "Basınçlı Gaz Tüpleri", label: "Basınçlı Gaz Tüpleri" },
  { value: "Bina Tamamlayıcı Unsurları (Kaplamalar, Korkuluklar, Kapılar ve Pencereler vb.)", label: "Bina Tamamlayıcı Unsurları (Kaplamalar, Korkuluklar, Kapılar ve Pencereler vb.)" },
  { value: "Bina Yapısal Unsurları (Zeminler, Duvarlar, Çatı, Merdiven vb.)", label: "Bina Yapısal Unsurları (Zeminler, Duvarlar, Çatı, Merdiven vb.)" },
  { value: "Döner Kapı, Kayar kapı veya şeffaf kapılar", label: "Döner Kapı, Kayar kapı veya şeffaf kapılar" },
  { value: "El Aletleri (Tornavida, pense, çekiç vb.)", label: "El Aletleri (Tornavida, pense, çekiç vb.)" },
  { value: "Elektrikli El Aletleri (Matkap, taşlama, testere vb.)", label: "Elektrikli El Aletleri (Matkap, taşlama, testere vb.)" },
  { value: "Elektrikli Mutfak Aletleri (Sıyırıcı-doğrama makineleri, su ısıtıcıları, benmariler vb.)", label: "Elektrikli Mutfak Aletleri (Sıyırıcı-doğrama makineleri, su ısıtıcıları, benmariler vb.)" },
  { value: "Elektrikli Ofis Aletleri (Bilgisayar, yazıcı, televizyon vb.)", label: "Elektrikli Ofis Aletleri (Bilgisayar, yazıcı, televizyon vb.)" },
  { value: "Evsel Atıklar", label: "Evsel Atıklar" },
  { value: "Hasta Ampulleri", label: "Hasta Ampulleri" },
  { value: "İğne ve İğne Uçları", label: "İğne ve İğne Uçları" },
  { value: "Isı Ampulleri", label: "Isı Ampulleri" },
  { value: "Kaldırma ve Taşıma Araçları (Forklift, Manlift, Transpalet vb.)", label: "Kaldırma ve Taşıma Araçları (Forklift, Manlift, Transpalet vb.)" },
  { value: "Kaygan Zemin", label: "Kaygan Zemin" },
  { value: "Kesici Mutfak Aletleri (Bıçaklar, soymalar ve doğrama araçları vb.)", label: "Kesici Mutfak Aletleri (Bıçaklar, soymalar ve doğrama araçları vb.)" },
  { value: "Kesici Tıbbi Materyaller (Bistüri, Kotter Ucu, Lam-Lamel vb.)", label: "Kesici Tıbbi Materyaller (Bistüri, Kotter Ucu, Lam-Lamel vb.)" },
  { value: "Kimyasal Maddeler ve Atıkları", label: "Kimyasal Maddeler ve Atıkları" },
  { value: "Motorlu Taşıtlar", label: "Motorlu Taşıtlar" },
  { value: "Sıcak İçecekler", label: "Sıcak İçecekler" },
  { value: "Sitotoksik İlaçlar ve Atıklar", label: "Sitotoksik İlaçlar ve Atıklar" },
  { value: "Temizlik Arabaları", label: "Temizlik Arabaları" },
  { value: "Tıbbi Atık", label: "Tıbbi Atık" },
  { value: "Tıbbi Cihazlar", label: "Tıbbi Cihazlar" },
  { value: "Pasif Olmayan Unsurlar (Dolap, koltuk, sandalye, mobilya vb.)", label: "Pasif Olmayan Unsurlar (Dolap, koltuk, sandalye, mobilya vb.)" },
  { value: "Yenik Taşıma Arabaları", label: "Yenik Taşıma Arabaları" }
];

// Dangerous Situations from attached document
export const DANGEROUS_SITUATIONS = [
  { value: "Bakımsız, Kusurlu veya Uygun Olmayan Makine, Alet", label: "Bakımsız, Kusurlu veya Uygun Olmayan Makine, Alet" },
  { value: "Bina Kusurları", label: "Bina Kusurları" },
  { value: "Bozuk Zemin", label: "Bozuk Zemin" },
  { value: "Eğitim Eksikliği", label: "Eğitim Eksikliği" },
  { value: "Ekipman Eksikliği", label: "Ekipman Eksikliği" },
  { value: "Ekipmanın Erişim Alanı, Yetersiz Alet ve Makine", label: "Ekipmanın Erişim Alanı, Yetersiz Alet ve Makine" },
  { value: "Emniyetsiz Yöntem ve Şartlar", label: "Emniyetsiz Yöntem ve Şartlar" },
  { value: "Kaygan Zemin", label: "Kaygan Zemin" },
  { value: "Kişisel Koruyucu Donanımlar", label: "Kişisel Koruyucu Donanımlar" },
  { value: "Mobbing", label: "Mobbing" },
  { value: "Uygun Olmayan Koruyucular", label: "Uygun Olmayan Koruyucular" },
  { value: "Yetersiz Havalandırma", label: "Yetersiz Havalandırma" },
  { value: "Yetersiz Personel", label: "Yetersiz Personel" },
  { value: "Kişisel Koruyucu Donanım Kullanımı", label: "Kişisel Koruyucu Donanım Kullanımı" },
  { value: "Uygun Olmayan Aydınlatma", label: "Uygun Olmayan Aydınlatma" },
  { value: "Uygun Olmayan Elektrik Tesisatı", label: "Uygun Olmayan Elektrik Tesisatı" }
];

// Dangerous Actions/Behaviors from attached document
export const DANGEROUS_ACTIONS = [
  { value: "Atık Yönetimi Kurallarına Uyulmaması", label: "Atık Yönetimi Kurallarına Uyulmaması" },
  { value: "Dalgınlık ve Dikkatsizlik", label: "Dalgınlık ve Dikkatsizlik" },
  { value: "Ehli Olmayan Kişilerin Makineleri Kullanmaları", label: "Ehli Olmayan Kişilerin Makineleri Kullanmaları" },
  { value: "Emniyetsiz Çalışma", label: "Emniyetsiz Çalışma" },
  { value: "Emniyetsiz Yükleme, Taşıma, İstifleme", label: "Emniyetsiz Yükleme, Taşıma, İstifleme" },
  { value: "Güvencesiz Çalışma", label: "Güvencesiz Çalışma" },
  { value: "İş Disiplinine Uymamak", label: "İş Disiplinine Uymamak" },
  { value: "İşe Uygun Ekipman Kullanmamak", label: "İşe Uygun Ekipman Kullanmamak" },
  { value: "İçeriye Şakalaşma", label: "İçeriye Şakalaşma" },
  { value: "Kan ve Vücut Sıvıları ile İlgili İşlem Sırasında Güvencesiz Çalışma", label: "Kan ve Vücut Sıvıları ile İlgili İşlem Sırasında Güvencesiz Çalışma" },
  { value: "Kesici Delici Aletlerin Alanda Bırakılması", label: "Kesici Delici Aletlerin Alanda Bırakılması" },
  { value: "Kesici Delici Aletlerin Güvencesiz Kullanımı", label: "Kesici Delici Aletlerin Güvencesiz Kullanımı" },
  { value: "Kişisel Koruyucu Donanım Kullanmama", label: "Kişisel Koruyucu Donanım Kullanmama" },
  { value: "Makine ve Ekipmanların Koruyucularının Çalışmaz Duruma Getirilmesi", label: "Makine ve Ekipmanların Koruyucularının Çalışmaz Duruma Getirilmesi" },
  { value: "Talimatları Uygulamama", label: "Talimatları Uygulamama" },
  { value: "Tehlikeli Hızla Çalışmak", label: "Tehlikeli Hızla Çalışmak" },
  { value: "Uygun Olmayan Emniyet Donanımı", label: "Uygun Olmayan Emniyet Donanımı" },
  { value: "Yetkisiz ve İzinsiz Olarak Tehlikeli Bölgede Çalışmak", label: "Yetkisiz ve İzinsiz Olarak Tehlikeli Bölgede Çalışmak" }
];

// Helper function to get places based on selected area
export const getEventPlacesByArea = (area: string) => {
  return EVENT_PLACES[area as keyof typeof EVENT_PLACES] || [];
};

// Helper functions for dangerous situations and actions based on accident cause type
export const getDangerousOptions = (causeType: string) => {
  switch (causeType) {
    case "Tehlikeli Durum":
      return DANGEROUS_SITUATIONS;
    case "Tehlikeli Hareket":
      return DANGEROUS_ACTIONS;
    case "Tehlikeli Durum ve Tehlikeli Hareket":
      return [...DANGEROUS_SITUATIONS, ...DANGEROUS_ACTIONS];
    default:
      return [];
  }
};