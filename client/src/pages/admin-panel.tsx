import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Users, UserPlus, Edit, Trash2, Shield, MapPin, Key, Building2, Phone, Mail, Plus, Search, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Helper function to get role display names
const getRoleDisplayName = (role: string) => {
  const roleNames: Record<string, string> = {
    'central_admin': 'Merkez Yönetim (ADMIN)',
    'safety_specialist': 'İş Güvenliği Uzmanı',
    'occupational_physician': 'İşyeri Hekimi',
    'responsible_manager': 'Sorumlu Müdür',
    'user': 'Normal Kullanıcı'
  };
  return roleNames[role] || role;
};

// Örnek lokasyonlar (placeholder için)
const LOCATION_EXAMPLES = [
  "Topkapı Liv Hastanesi",
  "GOP MedicalPark",
  "Merkez Hastane",
  "Anadolu Sağlık Merkezi"
];

// Turkey City-District Data (All 81 provinces)
const TURKEY_CITIES = {
  "Adana": ["Aladağ", "Ceyhan", "Çukurova", "Feke", "İmamoğlu", "Karaisalı", "Karataş", "Kozan", "Pozantı", "Saimbeyli", "Sarıçam", "Seyhan", "Tufanbeyli", "Yumurtalık", "Yüreğir"],
  "Adıyaman": ["Besni", "Çelikhan", "Gerger", "Gölbaşı", "Kahta", "Merkez", "Samsat", "Sincik", "Tut"],
  "Afyonkarahisar": ["Başmakçı", "Bayat", "Bolvadin", "Çay", "Çobanlar", "Dazkırı", "Dinar", "Emirdağ", "Evciler", "Hocalar", "İhsaniye", "İscehisar", "Kızılören", "Merkez", "Sandıklı", "Sinanpaşa", "Sultandağı", "Şuhut"],
  "Ağrı": ["Diyadin", "Doğubayazıt", "Eleşkirt", "Hamur", "Merkez", "Patnos", "Taşlıçay", "Tutak"],
  "Amasya": ["Göynücek", "Gümüşhacıköy", "Hamamözü", "Merkez", "Merzifon", "Suluova", "Taşova"],
  "Ankara": ["Akyurt", "Altındağ", "Ayaş", "Bala", "Beypazarı", "Çamlıdere", "Çankaya", "Çubuk", "Elmadağ", "Etimesgut", "Evren", "Gölbaşı", "Güdül", "Haymana", "Kalecik", "Kazan", "Keçiören", "Kızılcahamam", "Mamak", "Nallıhan", "Polatlı", "Pursaklar", "Sincan", "Şereflikoçhisar", "Yenimahalle"],
  "Antalya": ["Akseki", "Aksu", "Alanya", "Demre", "Döşemealtı", "Elmalı", "Finike", "Gazipaşa", "Gündoğmuş", "İbradı", "Kaş", "Kemer", "Kepez", "Konyaaltı", "Korkuteli", "Kumluca", "Manavgat", "Muratpaşa", "Serik"],
  "Artvin": ["Ardanuç", "Arhavi", "Borçka", "Hopa", "Merkez", "Murgul", "Şavşat", "Yusufeli"],
  "Aydın": ["Bozdoğan", "Buharkent", "Çine", "Didim", "Germencik", "İncirliova", "Karacasu", "Karpuzlu", "Koçarlı", "Köşk", "Kuşadası", "Kuyucak", "Merkez", "Nazilli", "Söke", "Sultanhisar", "Yenipazar"],
  "Balıkesir": ["Altıeylül", "Ayvalık", "Balya", "Bandırma", "Bigadiç", "Burhaniye", "Dursunbey", "Edremit", "Erdek", "Gömeç", "Gönen", "Havran", "İvrindi", "Karesi", "Kepsut", "Manyas", "Marmara", "Savaştepe", "Sındırgı", "Susurluk"],
  "Bilecik": ["Bozüyük", "Gölpazarı", "İnhisar", "Merkez", "Osmaneli", "Pazaryeri", "Söğüt", "Yenipazar"],
  "Bingöl": ["Adaklı", "Genç", "Karlıova", "Kiğı", "Merkez", "Solhan", "Yayladere", "Yedisu"],
  "Bitlis": ["Adilcevaz", "Ahlat", "Güroymak", "Hizan", "Merkez", "Mutki", "Tatvan"],
  "Bolu": ["Dörtdivan", "Gerede", "Göynük", "Kıbrıscık", "Mengen", "Merkez", "Mudurnu", "Seben", "Yeniçağa"],
  "Burdur": ["Ağlasun", "Altınyayla", "Bucak", "Çavdır", "Çeltikçi", "Gölhisar", "Karamanlı", "Kemer", "Merkez", "Tefenni", "Yeşilova"],
  "Bursa": ["Büyükorhan", "Gemlik", "Gürsu", "Harmancık", "İnegöl", "İznik", "Karacabey", "Keles", "Kestel", "Mudanya", "Mustafakemalpaşa", "Nilüfer", "Orhaneli", "Orhangazi", "Osmangazi", "Yenişehir", "Yıldırım"],
  "Çanakkale": ["Ayvacık", "Bayramiç", "Biga", "Bozcaada", "Çan", "Eceabat", "Ezine", "Gelibolu", "Gökçeada", "Lapseki", "Merkez", "Yenice"],
  "Çankırı": ["Atkaracalar", "Bayramören", "Çerkeş", "Eldivan", "Ilgaz", "Kızılırmak", "Korgun", "Kurşunlu", "Merkez", "Orta", "Şabanözü", "Yapraklı"],
  "Çorum": ["Alaca", "Bayat", "Boğazkale", "Dodurga", "İskilip", "Kargı", "Laçin", "Mecitözü", "Merkez", "Oğuzlar", "Ortaköy", "Osmancık", "Sungurlu", "Uğurludağ"],
  "Denizli": ["Acıpayam", "Babadağ", "Baklan", "Bekilli", "Beyağaç", "Bozkurt", "Buldan", "Çal", "Çameli", "Çardak", "Çivril", "Güney", "Honaz", "Kale", "Merkezefendi", "Pamukkale", "Sarayköy", "Serinhisar", "Tavas"],
  "Diyarbakır": ["Bağlar", "Bismil", "Çermik", "Çınar", "Çüngüş", "Dicle", "Eğil", "Ergani", "Hani", "Hazro", "Kayapınar", "Kocaköy", "Kulp", "Lice", "Silvan", "Sur", "Yenişehir"],
  "Düzce": ["Akçakoca", "Cumayeri", "Çilimli", "Gölyaka", "Gümüşova", "Kaynaşlı", "Merkez", "Yığılca"],
  "Edirne": ["Enez", "Havsa", "İpsala", "Keşan", "Lalapaşa", "Merkez", "Meriç", "Süloğlu", "Uzunköprü"],
  "Elazığ": ["Ağın", "Alacakaya", "Arıcak", "Baskil", "Karakoçan", "Keban", "Kovancılar", "Maden", "Merkez", "Palu", "Sivrice"],
  "Erzincan": ["Çayırlı", "İliç", "Kemah", "Kemaliye", "Merkez", "Otlukbeli", "Refahiye", "Tercan", "Üzümlü"],
  "Erzurum": ["Aşkale", "Aziziye", "Çat", "Hınıs", "Horasan", "İspir", "Karaçoban", "Karayazı", "Köprüköy", "Narman", "Oltu", "Olur", "Palandöken", "Pasinler", "Pazaryolu", "Şenkaya", "Tekman", "Tortum", "Uzundere", "Yakutiye"],
  "Eskişehir": ["Alpu", "Beylikova", "Çifteler", "Günyüzü", "Han", "İnönü", "Mahmudiye", "Mihalgazi", "Mihalıççık", "Odunpazarı", "Sarıcakaya", "Seyitgazi", "Sivrihisar", "Tepebaşı"],
  "Gaziantep": ["Araban", "İslahiye", "Karkamış", "Nizip", "Nurdağı", "Oğuzeli", "Şahinbey", "Şehitkamil", "Yavuzeli"],
  "Giresun": ["Alucra", "Bulancak", "Çamoluk", "Çanakçı", "Dereli", "Doğankent", "Espiye", "Eynesil", "Görele", "Güce", "Keşap", "Merkez", "Piraziz", "Şebinkarahisar", "Tirebolu", "Yağlıdere"],
  "Gümüşhane": ["Kelkit", "Köse", "Kürtün", "Merkez", "Şiran", "Torul"],
  "Hakkari": ["Çukurca", "Derecik", "Merkez", "Şemdinli", "Yüksekova"],
  "Hatay": ["Altınözü", "Antakya", "Arsuz", "Belen", "Defne", "Dörtyol", "Erzin", "Hassa", "İskenderun", "Kırıkhan", "Kumlu", "Payas", "Reyhanlı", "Samandağ", "Yayladağı"],
  "Isparta": ["Aksu", "Atabey", "Eğirdir", "Gelendost", "Gönen", "Keçiborlu", "Merkez", "Senirkent", "Sütçüler", "Şarkikaraağaç", "Uluborlu", "Yalvaç", "Yenişarbademli"],
  "Mersin": ["Akdeniz", "Anamur", "Aydıncık", "Bozyazı", "Çamlıyayla", "Erdemli", "Gülnar", "Mezitli", "Mut", "Silifke", "Tarsus", "Toroslar", "Yenişehir"],
  "İstanbul": ["Adalar", "Arnavutköy", "Ataşehir", "Avcılar", "Bağcılar", "Bahçelievler", "Bakırköy", "Başakşehir", "Bayrampaşa", "Beşiktaş", "Beykoz", "Beylikdüzü", "Beyoğlu", "Büyükçekmece", "Çatalca", "Çekmeköy", "Esenler", "Esenyurt", "Eyüpsultan", "Fatih", "Gaziosmanpaşa", "Güngören", "Kadıköy", "Kağıthane", "Kartal", "Küçükçekmece", "Maltepe", "Pendik", "Sancaktepe", "Sarıyer", "Silivri", "Sultanbeyli", "Sultangazi", "Şile", "Şişli", "Tuzla", "Ümraniye", "Üsküdar", "Zeytinburnu"],
  "İzmir": ["Aliağa", "Balçova", "Bayındır", "Bayraklı", "Bergama", "Beydağ", "Bornova", "Buca", "Çeşme", "Çiğli", "Dikili", "Foça", "Gaziemir", "Güzelbahçe", "Karabağlar", "Karaburun", "Karşıyaka", "Kemalpaşa", "Kınık", "Kiraz", "Konak", "Menderes", "Menemen", "Narlıdere", "Ödemiş", "Seferihisar", "Selçuk", "Tire", "Torbalı", "Urla"],
  "Kars": ["Akyaka", "Arpaçay", "Digor", "Kağızman", "Merkez", "Sarıkamış", "Selim", "Susuz"],
  "Kastamonu": ["Abana", "Ağlı", "Araç", "Azdavay", "Bozkurt", "Cide", "Çatalzeytin", "Daday", "Devrekani", "Doğanyurt", "Hanönü", "İhsangazi", "İnebolu", "Küre", "Merkez", "Pınarbaşı", "Seydiler", "Şenpazar", "Taşköprü", "Tosya"],
  "Kayseri": ["Akkışla", "Bünyan", "Develi", "Felahiye", "Hacılar", "İncesu", "Kocasinan", "Melikgazi", "Özvatan", "Pınarbaşı", "Sarıoğlan", "Sarız", "Talas", "Tomarza", "Yahyalı", "Yeşilhisar"],
  "Kırklareli": ["Babaeski", "Demirköy", "Kofçaz", "Lüleburgaz", "Merkez", "Pehlivanköy", "Pınarhisar", "Vize"],
  "Kırşehir": ["Akçakent", "Akpınar", "Boztepe", "Çiçekdağı", "Kaman", "Merkez", "Mucur"],
  "Kocaeli": ["Başiskele", "Çayırova", "Darıca", "Derince", "Dilovası", "Gebze", "Gölcük", "İzmit", "Kandıra", "Karamürsel", "Kartepe", "Körfez"],
  "Konya": ["Ahırlı", "Akören", "Akşehir", "Altınekin", "Beyşehir", "Bozkır", "Cihanbeyli", "Çeltik", "Çumra", "Derbent", "Derebucak", "Doğanhisar", "Emirgazi", "Ereğli", "Güneysınır", "Hadim", "Halkapınar", "Hüyük", "Ilgın", "Kadınhanı", "Karapınar", "Karatay", "Kulu", "Meram", "Sarayönü", "Selçuklu", "Seydişehir", "Taşkent", "Tuzlukçu", "Yalıhüyük", "Yunak"],
  "Kütahya": ["Altıntaş", "Aslanapa", "Çavdarhisar", "Domaniç", "Dumlupınar", "Emet", "Gediz", "Hisarcık", "Merkez", "Pazarlar", "Simav", "Şaphane", "Tavşanlı"],
  "Malatya": ["Akçadağ", "Arapgir", "Arguvan", "Battalgazi", "Darende", "Doğanşehir", "Doğanyol", "Hekimhan", "Kale", "Kuluncak", "Pütürge", "Yazıhan", "Yeşilyurt"],
  "Manisa": ["Ahmetli", "Akhisar", "Alaşehir", "Demirci", "Gölmarmara", "Gördes", "Kırkağaç", "Köprübaşı", "Kula", "Salihli", "Sarıgöl", "Saruhanlı", "Selendi", "Soma", "Şehzadeler", "Turgutlu", "Yunusemre"],
  "Mardin": ["Artuklu", "Dargeçit", "Derik", "Kızıltepe", "Mazıdağı", "Midyat", "Nusaybin", "Ömerli", "Savur", "Yeşilli"],
  "Muğla": ["Bodrum", "Dalaman", "Datça", "Fethiye", "Kavaklıdere", "Köyceğiz", "Marmaris", "Menteşe", "Milas", "Ortaca", "Seydikemer", "Ula", "Yatağan"],
  "Muş": ["Bulanık", "Hasköy", "Korkut", "Malazgirt", "Merkez", "Varto"],
  "Nevşehir": ["Acıgöl", "Avanos", "Derinkuyu", "Gülşehir", "Hacıbektaş", "Kozaklı", "Merkez", "Ürgüp"],
  "Niğde": ["Altunhisar", "Bor", "Çamardı", "Çiftlik", "Merkez", "Ulukışla"],
  "Ordu": ["Akkuş", "Altınordu", "Aybastı", "Çamaş", "Çatalpınar", "Çaybaşı", "Fatsa", "Gölköy", "Gülyalı", "Gürgentepe", "İkizce", "Kabadüz", "Kabataş", "Korgan", "Kumru", "Mesudiye", "Perşembe", "Ulubey", "Ünye"],
  "Rize": ["Ardeşen", "Çamlıhemşin", "Çayeli", "Derepazarı", "Fındıklı", "Güneysu", "Hemşin", "İkizdere", "İyidere", "Kalkandere", "Merkez", "Pazar"],
  "Sakarya": ["Adapazarı", "Akyazı", "Arifiye", "Erenler", "Ferizli", "Geyve", "Hendek", "Karapürçek", "Karasu", "Kaynarca", "Kocaali", "Pamukova", "Sapanca", "Serdivan", "Söğütlü", "Taraklı"],
  "Samsun": ["19 Mayıs", "Alaçam", "Asarcık", "Atakum", "Ayvacık", "Bafra", "Canik", "Çarşamba", "Havza", "İlkadım", "Kavak", "Ladik", "Ondokuzmayıs", "Salıpazarı", "Tekkeköy", "Terms", "Vezirköprü", "Yakakent"],
  "Siirt": ["Baykan", "Eruh", "Kurtalan", "Merkez", "Pervari", "Şirvan", "Tillo"],
  "Sinop": ["Ayancık", "Boyabat", "Dikmen", "Durağan", "Erfelek", "Gerze", "Merkez", "Saraydüzü", "Türkeli"],
  "Sivas": ["Akıncılar", "Altınyayla", "Divriği", "Doğanşar", "Gemerek", "Gölova", "Gürün", "Hafik", "İmranlı", "Kangal", "Koyulhisar", "Merkez", "Suşehri", "Şarkışla", "Ulaş", "Yıldızeli", "Zara"],
  "Tekirdağ": ["Çerkezköy", "Çorlu", "Ergene", "Hayrabolu", "Kapaklı", "Malkara", "Marmaraereğlisi", "Muratlı", "Saray", "Şarköy", "Süleymanpaşa"],
  "Tokat": ["Almus", "Artova", "Başçiftlik", "Erbaa", "Merkez", "Niksar", "Pazar", "Reşadiye", "Sulusaray", "Turhal", "Yeşilyurt", "Zile"],
  "Trabzon": ["Akçaabat", "Araklı", "Arsin", "Beşikdüzü", "Çaykara", "Çarşıbaşı", "Dernekpazarı", "Düzköy", "Hayrat", "Köprübaşı", "Maçka", "Of", "Ortahisar", "Sürmene", "Şalpazarı", "Tonya", "Vakfıkebir", "Yomra"],
  "Tunceli": ["Çemişgezek", "Hozat", "Mazgirt", "Merkez", "Nazımiye", "Ovacık", "Pertek", "Pülümür"],
  "Şanlıurfa": ["Akçakale", "Birecik", "Bozova", "Ceylanpınar", "Eyyübiye", "Halfeti", "Haliliye", "Harran", "Hilvan", "Karaköprü", "Siverek", "Suruç", "Viranşehir"],
  "Uşak": ["Banaz", "Eşme", "Karahallı", "Merkez", "Sivaslı", "Ulubey"],
  "Van": ["Bahçesaray", "Başkale", "Çaldıran", "Çatak", "Edremit", "Erciş", "Gevaş", "Gürpınar", "İpekyolu", "Muradiye", "Özalp", "Saray", "Tuşba"],
  "Yozgat": ["Akdağmadeni", "Aydıncık", "Boğazlıyan", "Çandır", "Çayıralan", "Çekerek", "Kadışehri", "Merkez", "Saraykent", "Sarıkaya", "Şefaatli", "Sorgun", "Yenifakılı", "Yerköy"],
  "Zonguldak": ["Alaplı", "Çaycuma", "Devrek", "Ereğli", "Gökçebey", "Kilimli", "Kozlu", "Merkez"]
};

// Searchable Select Component
interface SearchableSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  disabled?: boolean;
  "data-testid"?: string;
}

function SearchableSelect({ value, onValueChange, options, placeholder, disabled = false, "data-testid": testId }: SearchableSelectProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
          data-testid={testId}
        >
          {value ? options.find((option) => option.value === value)?.label : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Arama yapın..." />
          <CommandEmpty>Sonuç bulunamadı.</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-y-auto">
            {options.map((option) => (
              <CommandItem
                key={option.value}
                value={option.value}
                onSelect={(currentValue) => {
                  onValueChange(currentValue === value ? "" : currentValue);
                  setOpen(false);
                }}
              >
                <Check
                  className={`mr-2 h-4 w-4 ${value === option.value ? "opacity-100" : "opacity-0"}`}
                />
                {option.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// Reusable Search Input Component
interface SearchInputProps {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  "data-testid"?: string;
}

function SearchInput({ placeholder, value, onChange, className = "", "data-testid": testId }: SearchInputProps) {
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10 pr-10"
        data-testid={testId}
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          data-testid="clear-search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

// User type from shared schema
interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  profileImage?: string;
  role: 'central_admin' | 'safety_specialist' | 'occupational_physician' | 'responsible_manager' | 'user';
  position?: string;
  department?: string;
  location?: string;
  locationId?: string;
  firstLogin: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Location type from shared schema
interface Location {
  id: string;
  name: string;
  shortName?: string;
  logo?: string;
  type: 'hospital' | 'medical_center' | 'clinic' | 'office';
  phone: string;
  email: string;
  website?: string;
  address: string;
  district: string;
  city: string;
  postalCode?: string;
  country: string;
  taxNumber?: string;
  legalRepresentative?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Form schemas
const createUserSchema = z.object({
  username: z.string().min(3, "Kullanıcı adı en az 3 karakter olmalıdır"),
  fullName: z.string().min(2, "Ad soyad en az 2 karakter olmalıdır"),
  role: z.enum(['central_admin', 'safety_specialist', 'occupational_physician', 'responsible_manager', 'user'], 
    { required_error: "Rol seçiniz" }),
  position: z.string().optional(),
  location: z.string().optional(),
  locationId: z.string().optional(),
  password: z.string().optional()
});

const editUserSchema = z.object({
  username: z.string().min(3, "Kullanıcı adı en az 3 karakter olmalıdır"),
  fullName: z.string().min(2, "Ad soyad en az 2 karakter olmalıdır"),
  email: z.string().email("Geçerli bir e-posta adresi giriniz"),
  phone: z.string().min(10, "Telefon numarası en az 10 karakter olmalıdır"),
  role: z.enum(['central_admin', 'safety_specialist', 'occupational_physician', 'responsible_manager', 'user'], 
    { required_error: "Rol seçiniz" }),
  position: z.string().optional(),
  department: z.string().optional(),
  location: z.string().optional(),
  locationId: z.string().optional(),
  isActive: z.boolean()
});

// Hospital schemas
const createHospitalSchema = z.object({
  name: z.string().min(1, "Hastane adı gerekli"),
  shortName: z.string().optional(),
  address: z.string().min(1, "Adres gerekli"),
  phone: z.string().min(1, "Telefon gerekli"),
  email: z.string().email("Geçerli email gerekli"),
  website: z.string().url().optional().or(z.literal("")),
  district: z.string().min(1, "İlçe gerekli"),
  city: z.string().min(1, "Şehir gerekli"),
  postalCode: z.string().optional(),
  country: z.string().default("Türkiye"),
  taxNumber: z.string().optional(),
  legalRepresentative: z.string().optional(),
  type: z.enum(["hospital", "medical_center", "clinic", "office"]).default("hospital"),
  isActive: z.boolean().default(true)
});

const editHospitalSchema = createHospitalSchema.extend({
  isActive: z.boolean()
});

type CreateUserForm = z.infer<typeof createUserSchema>;
type EditUserForm = z.infer<typeof editUserSchema>;
type CreateHospitalForm = z.infer<typeof createHospitalSchema>;
type EditHospitalForm = z.infer<typeof editHospitalSchema>;

export default function AdminPanel() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  // Hospital state
  const [isCreateHospitalDialogOpen, setIsCreateHospitalDialogOpen] = useState(false);
  const [isEditHospitalDialogOpen, setIsEditHospitalDialogOpen] = useState(false);
  const [editingHospital, setEditingHospital] = useState<Location | null>(null);
  
  // City/District state  
  const [selectedCreateCity, setSelectedCreateCity] = useState<string>("");
  const [selectedEditCity, setSelectedEditCity] = useState<string>("");
  
  // Search states
  const [hospitalSearch, setHospitalSearch] = useState<string>("");
  const [userSearch, setUserSearch] = useState<string>("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch users
  const { data: users, isLoading, error } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
  });

  // Fetch hospitals
  const { data: hospitals, isLoading: isHospitalsLoading, error: hospitalsError } = useQuery<Location[]>({
    queryKey: ['/api/admin/hospitals'],
  });

  // Filtered data based on search
  const filteredUsers = (users || []).filter(user => 
    user.fullName.toLowerCase().includes(userSearch.toLowerCase()) ||
    user.username.toLowerCase().includes(userSearch.toLowerCase()) ||
    user.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    user.phone.toLowerCase().includes(userSearch.toLowerCase()) ||
    getRoleDisplayName(user.role).toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredHospitals = (hospitals || []).filter(hospital => 
    hospital.name.toLowerCase().includes(hospitalSearch.toLowerCase()) ||
    hospital.shortName?.toLowerCase().includes(hospitalSearch.toLowerCase()) ||
    hospital.city?.toLowerCase().includes(hospitalSearch.toLowerCase()) ||
    hospital.district?.toLowerCase().includes(hospitalSearch.toLowerCase()) ||
    hospital.address?.toLowerCase().includes(hospitalSearch.toLowerCase()) ||
    hospital.phone?.toLowerCase().includes(hospitalSearch.toLowerCase()) ||
    hospital.email?.toLowerCase().includes(hospitalSearch.toLowerCase())
  );

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: (userData: CreateUserForm) => 
      apiRequest('POST', '/api/admin/users', userData),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setIsCreateDialogOpen(false);
      createForm.reset();
      toast({
        title: "Başarılı",
        description: data.message || "Kullanıcı başarıyla oluşturuldu",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Kullanıcı oluşturulurken hata oluştu",
        variant: "destructive",
      });
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: ({ id, userData }: { id: string; userData: EditUserForm }) => 
      apiRequest('PUT', `/api/admin/users/${id}`, userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setIsEditDialogOpen(false);
      setEditingUser(null);
      editForm.reset();
      toast({
        title: "Başarılı",
        description: "Kullanıcı başarıyla güncellendi",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Kullanıcı güncellenirken hata oluştu",
        variant: "destructive",
      });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => 
      apiRequest('DELETE', `/api/admin/users/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "Başarılı",
        description: "Kullanıcı başarıyla silindi",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Kullanıcı silinirken hata oluştu",
        variant: "destructive",
      });
    },
  });

  // Hospital Mutations
  // Create hospital mutation
  const createHospitalMutation = useMutation({
    mutationFn: (hospitalData: CreateHospitalForm) => 
      apiRequest('POST', '/api/admin/hospitals', hospitalData),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/hospitals'] });
      setIsCreateHospitalDialogOpen(false);
      createHospitalForm.reset();
      toast({
        title: "Başarılı",
        description: data.message || "Hastane başarıyla oluşturuldu",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Hastane oluşturulurken hata oluştu",
        variant: "destructive",
      });
    },
  });

  // Update hospital mutation
  const updateHospitalMutation = useMutation({
    mutationFn: ({ id, hospitalData }: { id: string; hospitalData: EditHospitalForm }) => 
      apiRequest('PUT', `/api/admin/hospitals/${id}`, hospitalData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/hospitals'] });
      setIsEditHospitalDialogOpen(false);
      setEditingHospital(null);
      editHospitalForm.reset();
      toast({
        title: "Başarılı",
        description: "Hastane başarıyla güncellendi",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Hastane güncellenirken hata oluştu",
        variant: "destructive",
      });
    },
  });

  // Delete hospital mutation
  const deleteHospitalMutation = useMutation({
    mutationFn: (hospitalId: string) => 
      apiRequest('DELETE', `/api/admin/hospitals/${hospitalId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/hospitals'] });
      toast({
        title: "Başarılı",
        description: "Hastane başarıyla silindi",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Hastane silinirken hata oluştu",
        variant: "destructive",
      });
    },
  });

  // Forms
  const createForm = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      username: "",
      fullName: "",
      role: "user",
      location: "",
      password: ""
    },
  });

  const editForm = useForm<EditUserForm>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      username: "",
      fullName: "",
      role: "user",
      location: "",
      isActive: true
    },
  });

  // Hospital Forms
  const createHospitalForm = useForm<CreateHospitalForm>({
    resolver: zodResolver(createHospitalSchema),
    defaultValues: {
      name: "",
      shortName: "",
      address: "",
      phone: "",
      email: "",
      website: "",
      district: "",
      city: "",
      postalCode: "",
      country: "Türkiye",
      taxNumber: "",
      legalRepresentative: "",
      type: "hospital",
      isActive: true
    },
  });

  const editHospitalForm = useForm<EditHospitalForm>({
    resolver: zodResolver(editHospitalSchema),
    defaultValues: {
      name: "",
      shortName: "",
      address: "",
      phone: "",
      email: "",
      website: "",
      district: "",
      city: "",
      postalCode: "",
      country: "Türkiye",
      taxNumber: "",
      legalRepresentative: "",
      type: "hospital",
      isActive: true
    },
  });

  // Handle create user
  const onCreateSubmit = (data: CreateUserForm) => {
    createUserMutation.mutate(data);
  };

  // Handle edit user
  const onEditSubmit = (data: EditUserForm) => {
    if (editingUser) {
      updateUserMutation.mutate({ id: editingUser.id, userData: data });
    }
  };

  // Generate random password
  const generatePassword = () => {
    const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  };

  // Handle create dialog open
  const handleCreateDialogOpen = () => {
    const autoPassword = generatePassword();
    createForm.setValue("password", autoPassword);
    setIsCreateDialogOpen(true);
  };

  // Handle edit dialog open
  const handleEditUser = (user: User) => {
    setEditingUser(user);
    editForm.setValue("username", user.username);
    editForm.setValue("fullName", user.fullName);
    editForm.setValue("role", user.role);
    editForm.setValue("location", user.location);
    editForm.setValue("isActive", user.isActive);
    setIsEditDialogOpen(true);
  };

  // Handle delete user
  const handleDeleteUser = (userId: string) => {
    deleteUserMutation.mutate(userId);
  };

  // Hospital Handlers
  // Handle create hospital
  const onCreateHospitalSubmit = (data: CreateHospitalForm) => {
    createHospitalMutation.mutate(data);
  };

  // Handle edit hospital
  const onEditHospitalSubmit = (data: EditHospitalForm) => {
    if (editingHospital) {
      updateHospitalMutation.mutate({ id: editingHospital.id, hospitalData: data });
    }
  };

  // Handle edit hospital dialog open
  const handleEditHospital = (hospital: Location) => {
    setEditingHospital(hospital);
    editHospitalForm.setValue("name", hospital.name);
    editHospitalForm.setValue("shortName", hospital.shortName || "");
    editHospitalForm.setValue("address", hospital.address || "");
    editHospitalForm.setValue("phone", hospital.phone || "");
    editHospitalForm.setValue("email", hospital.email || "");
    editHospitalForm.setValue("website", hospital.website || "");
    editHospitalForm.setValue("district", hospital.district || "");
    editHospitalForm.setValue("city", hospital.city || "");
    editHospitalForm.setValue("postalCode", hospital.postalCode || "");
    editHospitalForm.setValue("country", hospital.country || "Türkiye");
    editHospitalForm.setValue("taxNumber", hospital.taxNumber || "");
    editHospitalForm.setValue("legalRepresentative", hospital.legalRepresentative || "");
    editHospitalForm.setValue("type", hospital.type || "hospital");
    editHospitalForm.setValue("isActive", hospital.isActive);
    
    // Set selected city for dropdown to work properly
    setSelectedEditCity(hospital.city || "");
    setIsEditHospitalDialogOpen(true);
  };

  // Handle delete hospital
  const handleDeleteHospital = (hospitalId: string) => {
    deleteHospitalMutation.mutate(hospitalId);
  };

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-red-600">
              Admin paneline erişilirken hata oluştu. Bu sayfaya erişim yetkiniz bulunmuyor olabilir.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold">Admin Paneli</h1>
            <p className="text-muted-foreground">Kullanıcı yönetimi ve sistem ayarları</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Kullanıcı Yönetimi
          </TabsTrigger>
          <TabsTrigger value="hospitals" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Hastane Yönetimi
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          {/* Users Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Toplam Kullanıcı</p>
                    <p className="text-2xl font-bold">{users?.length || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Admin Kullanıcı</p>
                    <p className="text-2xl font-bold">
                      {users?.filter(u => ['central_admin', 'location_manager'].includes(u.role)).length || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-amber-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">İlk Giriş Bekleyen</p>
                    <p className="text-2xl font-bold">
                      {users?.filter(u => u.firstLogin).length || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* User Management Header and Search */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-xl font-semibold">Kullanıcılar ({filteredUsers?.length || 0})</h2>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <SearchInput
                placeholder="Kullanıcı, email, telefon veya rol ara..."
                value={userSearch}
                onChange={setUserSearch}
                className="w-full sm:w-80"
                data-testid="search-users"
              />
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      className="flex items-center gap-2" 
                      onClick={handleCreateDialogOpen}
                      data-testid="button-add-user"
                    >
                      <UserPlus className="h-4 w-4" />
                      Kullanıcı Ekle
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                  <DialogTitle>Yeni Kullanıcı Ekle</DialogTitle>
                  <DialogDescription>
                    Sisteme yeni kullanıcı ekleyin. Şifre belirtilmezse otomatik üretilir.
                  </DialogDescription>
                </DialogHeader>
                <Form {...createForm}>
                  <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                    <FormField
                      control={createForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Kullanıcı Adı</FormLabel>
                          <FormControl>
                            <Input placeholder="kullanici_adi" {...field} data-testid="input-username" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ad Soyad</FormLabel>
                          <FormControl>
                            <Input placeholder="Ad Soyad" {...field} data-testid="input-fullname" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rol</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-role">
                                <SelectValue placeholder="Rol seçiniz" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="user">Normal Kullanıcı</SelectItem>
                              <SelectItem value="responsible_manager">Sorumlu Müdür</SelectItem>
                              <SelectItem value="occupational_physician">İşyeri Hekimi</SelectItem>
                              <SelectItem value="safety_specialist">İş Güvenliği Uzmanı</SelectItem>
                              <SelectItem value="central_admin">Merkez Yönetim (ADMIN)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="position"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pozisyon</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Örn: İş Güvenliği Uzmanı, Teknik Müdür" 
                              data-testid="input-position"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={createForm.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lokasyon</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Örn: Topkapı Liv Hastanesi, GOP MedicalPark"
                              {...field} 
                              data-testid="input-location"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Şifre</FormLabel>
                          <div className="flex gap-2">
                            <FormControl>
                              <Input 
                                type="text" 
                                placeholder="Otomatik üretildi"
                                {...field} 
                                data-testid="input-password"
                              />
                            </FormControl>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                const newPassword = generatePassword();
                                createForm.setValue("password", newPassword);
                              }}
                              data-testid="button-generate-password"
                            >
                              Yenile
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Bu şifreyi kullanıcıya verin. İlk girişte değiştirmesi gerekecek.
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex gap-2 pt-4">
                      <Button 
                        type="submit" 
                        disabled={createUserMutation.isPending}
                        data-testid="button-submit-create"
                      >
                        {createUserMutation.isPending ? "Oluşturuluyor..." : "Kullanıcı Oluştur"}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsCreateDialogOpen(false)}
                        data-testid="button-cancel-create"
                      >
                        İptal
                      </Button>
                    </div>
                  </form>
                </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

          {/* Users Table */}
          <Card>
            <CardContent className="p-6">
              {isLoading ? (
                <div className="text-center py-8">
                  <p>Kullanıcılar yükleniyor...</p>
                </div>
              ) : filteredUsers?.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Hiç kullanıcı bulunamadı.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredUsers?.map((user) => (
                    <div 
                      key={user.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                      data-testid={`user-card-${user.id}`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold" data-testid={`text-username-${user.id}`}>
                            {user.fullName}
                          </h3>
                          <Badge variant={['central_admin', 'location_manager', 'safety_specialist'].includes(user.role) ? 'default' : 'secondary'}>
                            {getRoleDisplayName(user.role)}
                          </Badge>
                          {user.firstLogin && (
                            <Badge variant="outline" className="text-amber-600">
                              İlk Giriş
                            </Badge>
                          )}
                          {!user.isActive && (
                            <Badge variant="destructive">
                              Pasif
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span data-testid={`text-login-${user.id}`}>@{user.username}</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {user.location || 'Lokasyon belirtilmemiş'}
                          </span>
                          {user.position && (
                            <span className="text-sm text-blue-600">
                              {user.position}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditUser(user)}
                          data-testid={`button-edit-${user.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              data-testid={`button-delete-${user.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Kullanıcı Sil</AlertDialogTitle>
                              <AlertDialogDescription>
                                {user.fullName} kullanıcısını sistemden silmek istediğinizden emin misiniz? 
                                Bu işlem geri alınamaz.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>İptal</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeleteUser(user.id)}
                                className="bg-red-600 hover:bg-red-700"
                                data-testid={`button-confirm-delete-${user.id}`}
                              >
                                Sil
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hospitals" className="space-y-6">
          {/* Hospitals Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Building2 className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Toplam Hastane</p>
                    <p className="text-2xl font-bold" data-testid="text-total-hospitals">
                      {hospitals?.length || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Building2 className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Aktif Hastane</p>
                    <p className="text-2xl font-bold" data-testid="text-active-hospitals">
                      {hospitals?.filter(h => h.isActive).length || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <MapPin className="h-8 w-8 text-orange-600" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Şehir Sayısı</p>
                    <p className="text-2xl font-bold" data-testid="text-city-count">
                      {hospitals ? new Set(hospitals.map(h => h.city)).size : 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Hospitals Actions */}
          <Card>
            <CardHeader>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Hastane Yönetimi</CardTitle>
                    <CardDescription>
                      Sistem hastanelerini ve sağlık tesislerini yönetin
                    </CardDescription>
                  </div>
                  <Button 
                    onClick={() => setIsCreateHospitalDialogOpen(true)}
                    className="flex items-center gap-2"
                    data-testid="button-add-hospital"
                  >
                    <Plus className="h-4 w-4" />
                    Yeni Hastane
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Hastaneler ({filteredHospitals?.length || 0})</h3>
                  <SearchInput
                    placeholder="Hastane adı, şehir, ilçe veya telefon ara..."
                    value={hospitalSearch}
                    onChange={setHospitalSearch}
                    className="w-80"
                    data-testid="search-hospitals"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Hospitals Loading State */}
              {isHospitalsLoading && (
                <div className="text-center py-8">
                  <p>Hastaneler yükleniyor...</p>
                </div>
              )}

              {/* Hospitals Error State */}
              {hospitalsError && (
                <div className="text-center py-8 text-red-600">
                  <p>Hastaneler yüklenirken hata oluştu.</p>
                </div>
              )}

              {/* No Hospitals Found */}
              {!isHospitalsLoading && !hospitalsError && filteredHospitals && filteredHospitals.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    {hospitalSearch ? "Arama kriterlerine uygun hastane bulunamadı." : "Hiç hastane bulunamadı."}
                  </p>
                </div>
              )}

              {/* Hospitals Table */}
              {filteredHospitals && filteredHospitals.length > 0 && (
                <div className="rounded-md border">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="p-3 text-left font-medium">Hastane Adı</th>
                        <th className="p-3 text-left font-medium">Tür</th>
                        <th className="p-3 text-left font-medium">Şehir</th>
                        <th className="p-3 text-left font-medium">İletişim</th>
                        <th className="p-3 text-left font-medium">Durum</th>
                        <th className="p-3 text-center font-medium">İşlemler</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredHospitals.map((hospital) => (
                        <tr key={hospital.id} className="border-b">
                          <td className="p-3">
                            <div>
                              <p className="font-medium" data-testid={`text-hospital-name-${hospital.id}`}>
                                {hospital.name}
                              </p>
                              {hospital.shortName && (
                                <p className="text-sm text-muted-foreground">
                                  {hospital.shortName}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="p-3">
                            <Badge variant="secondary">
                              {hospital.type === 'hospital' ? 'Hastane' :
                               hospital.type === 'medical_center' ? 'Tıp Merkezi' :
                               hospital.type === 'clinic' ? 'Klinik' : 'Ofis'}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <div>
                              <p className="font-medium">{hospital.city}</p>
                              <p className="text-sm text-muted-foreground">{hospital.district}</p>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <Phone className="h-3 w-3" />
                                <span className="text-sm">{hospital.phone}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Mail className="h-3 w-3" />
                                <span className="text-sm">{hospital.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <Badge variant={hospital.isActive ? "default" : "secondary"}>
                              {hospital.isActive ? "Aktif" : "Pasif"}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center justify-center gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleEditHospital(hospital)}
                                data-testid={`button-edit-hospital-${hospital.id}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="text-red-600 hover:text-red-700"
                                    data-testid={`button-delete-hospital-${hospital.id}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Hastaneyi Sil</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      "{hospital.name}" hastanesini silmek istediğinizden emin misiniz?
                                      Bu işlem geri alınamaz ve bu hastaneye bağlı kullanıcılar etkilenebilir.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>İptal</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => {/* TODO: handleDeleteHospital(hospital.id) */}}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Sil
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* No Hospitals */}
              {hospitals && hospitals.length === 0 && (
                <div className="text-center py-8">
                  <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Henüz hastane eklenmemiş</p>
                  <Button 
                    onClick={() => setIsCreateHospitalDialogOpen(true)}
                    className="mt-4"
                  >
                    İlk Hastaneyi Ekle
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Hospital Create Dialog Placeholder */}
          {/* TODO: Add Hospital Create/Edit Forms */}
        </TabsContent>
      </Tabs>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kullanıcı Düzenle</DialogTitle>
            <DialogDescription>
              Kullanıcı bilgilerini güncelleyin.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kullanıcı Adı</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-edit-username" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ad Soyad</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-edit-fullname" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rol</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-edit-role">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="user">Normal Kullanıcı</SelectItem>
                        <SelectItem value="responsible_manager">Sorumlu Müdür</SelectItem>
                        <SelectItem value="occupational_physician">İşyeri Hekimi</SelectItem>
                        <SelectItem value="safety_specialist">İş Güvenliği Uzmanı</SelectItem>
                        <SelectItem value="central_admin">Merkez Yönetim (ADMIN)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lokasyon</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Örn: Topkapı Liv Hastanesi, GOP MedicalPark"
                        {...field} 
                        data-testid="input-edit-location"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-2 pt-4">
                <Button 
                  type="submit" 
                  disabled={updateUserMutation.isPending}
                  data-testid="button-submit-edit"
                >
                  {updateUserMutation.isPending ? "Güncelleniyor..." : "Güncelle"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                  data-testid="button-cancel-edit"
                >
                  İptal
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Create Hospital Dialog */}
      <Dialog open={isCreateHospitalDialogOpen} onOpenChange={setIsCreateHospitalDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Yeni Hastane Ekle
            </DialogTitle>
            <DialogDescription>
              Sisteme yeni bir hastane/sağlık kuruluşu ekleyin. Tüm bilgileri doğru doldurunuz.
            </DialogDescription>
          </DialogHeader>
          <Form {...createHospitalForm}>
            <form onSubmit={createHospitalForm.handleSubmit(onCreateHospitalSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={createHospitalForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hastane Adı *</FormLabel>
                      <FormControl>
                        <Input placeholder="Hastane adını giriniz" {...field} data-testid="input-create-hospital-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createHospitalForm.control}
                  name="shortName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kısa Ad</FormLabel>
                      <FormControl>
                        <Input placeholder="Kısa ad (isteğe bağlı)" {...field} data-testid="input-create-hospital-short-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={createHospitalForm.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adres *</FormLabel>
                    <FormControl>
                      <Input placeholder="Tam adres giriniz" {...field} data-testid="input-create-hospital-address" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={createHospitalForm.control}
                  name="city"
                  render={({ field }) => {
                    const cityOptions = Object.keys(TURKEY_CITIES).map(city => ({ value: city, label: city }));
                    return (
                      <FormItem>
                        <FormLabel>Şehir *</FormLabel>
                        <FormControl>
                          <SearchableSelect
                            value={field.value}
                            onValueChange={(value) => {
                              field.onChange(value);
                              setSelectedCreateCity(value);
                              createHospitalForm.setValue("district", ""); // Reset district when city changes
                            }}
                            options={cityOptions}
                            placeholder="Şehir seçiniz (arama yapabilirsiniz)"
                            data-testid="select-create-hospital-city"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
                <FormField
                  control={createHospitalForm.control}
                  name="district"
                  render={({ field }) => {
                    const districtOptions = selectedCreateCity ? 
                      TURKEY_CITIES[selectedCreateCity as keyof typeof TURKEY_CITIES]?.map(district => ({ value: district, label: district })) || [] 
                      : [];
                    return (
                      <FormItem>
                        <FormLabel>İlçe *</FormLabel>
                        <FormControl>
                          <SearchableSelect
                            value={field.value}
                            onValueChange={field.onChange}
                            options={districtOptions}
                            placeholder={selectedCreateCity ? "İlçe seçiniz (arama yapabilirsiniz)" : "Önce şehir seçiniz"}
                            disabled={!selectedCreateCity}
                            data-testid="select-create-hospital-district"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={createHospitalForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefon *</FormLabel>
                      <FormControl>
                        <Input placeholder="0212-555-0000" {...field} data-testid="input-create-hospital-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createHospitalForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-posta *</FormLabel>
                      <FormControl>
                        <Input placeholder="info@hastane.com" type="email" {...field} data-testid="input-create-hospital-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={createHospitalForm.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input placeholder="https://hastane.com" type="url" {...field} data-testid="input-create-hospital-website" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createHospitalForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kuruluş Tipi *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-create-hospital-type">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="hospital">Hastane</SelectItem>
                          <SelectItem value="medical_center">Tıp Merkezi</SelectItem>
                          <SelectItem value="clinic">Klinik</SelectItem>
                          <SelectItem value="office">Ofis</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button 
                  type="submit" 
                  disabled={createHospitalMutation.isPending}
                  data-testid="button-submit-create-hospital"
                >
                  {createHospitalMutation.isPending ? "Oluşturuluyor..." : "Hastane Oluştur"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsCreateHospitalDialogOpen(false)}
                  data-testid="button-cancel-create-hospital"
                >
                  İptal
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Hospital Dialog */}
      <Dialog open={isEditHospitalDialogOpen} onOpenChange={setIsEditHospitalDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Hastane Düzenle
            </DialogTitle>
            <DialogDescription>
              {editingHospital?.name} hastanesinin bilgilerini güncelleyin.
            </DialogDescription>
          </DialogHeader>
          <Form {...editHospitalForm}>
            <form onSubmit={editHospitalForm.handleSubmit(onEditHospitalSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editHospitalForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hastane Adı *</FormLabel>
                      <FormControl>
                        <Input placeholder="Hastane adını giriniz" {...field} data-testid="input-edit-hospital-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editHospitalForm.control}
                  name="shortName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kısa Ad</FormLabel>
                      <FormControl>
                        <Input placeholder="Kısa ad (isteğe bağlı)" {...field} data-testid="input-edit-hospital-short-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={editHospitalForm.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adres *</FormLabel>
                    <FormControl>
                      <Input placeholder="Tam adres giriniz" {...field} data-testid="input-edit-hospital-address" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editHospitalForm.control}
                  name="city"
                  render={({ field }) => {
                    const cityOptions = Object.keys(TURKEY_CITIES).map(city => ({ value: city, label: city }));
                    return (
                      <FormItem>
                        <FormLabel>Şehir *</FormLabel>
                        <FormControl>
                          <SearchableSelect
                            value={field.value}
                            onValueChange={(value) => {
                              field.onChange(value);
                              setSelectedEditCity(value);
                              editHospitalForm.setValue("district", ""); // Reset district when city changes
                            }}
                            options={cityOptions}
                            placeholder="Şehir seçiniz (arama yapabilirsiniz)"
                            data-testid="select-edit-hospital-city"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
                <FormField
                  control={editHospitalForm.control}
                  name="district"
                  render={({ field }) => {
                    const districtOptions = selectedEditCity ? 
                      TURKEY_CITIES[selectedEditCity as keyof typeof TURKEY_CITIES]?.map(district => ({ value: district, label: district })) || [] 
                      : [];
                    return (
                      <FormItem>
                        <FormLabel>İlçe *</FormLabel>
                        <FormControl>
                          <SearchableSelect
                            value={field.value}
                            onValueChange={field.onChange}
                            options={districtOptions}
                            placeholder={selectedEditCity ? "İlçe seçiniz (arama yapabilirsiniz)" : "Önce şehir seçiniz"}
                            disabled={!selectedEditCity}
                            data-testid="select-edit-hospital-district"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editHospitalForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefon *</FormLabel>
                      <FormControl>
                        <Input placeholder="0212-555-0000" {...field} data-testid="input-edit-hospital-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editHospitalForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-posta *</FormLabel>
                      <FormControl>
                        <Input placeholder="info@hastane.com" type="email" {...field} data-testid="input-edit-hospital-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editHospitalForm.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input placeholder="https://hastane.com" type="url" {...field} data-testid="input-edit-hospital-website" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editHospitalForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kuruluş Tipi *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-edit-hospital-type">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="hospital">Hastane</SelectItem>
                          <SelectItem value="medical_center">Tıp Merkezi</SelectItem>
                          <SelectItem value="clinic">Klinik</SelectItem>
                          <SelectItem value="office">Ofis</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={editHospitalForm.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Aktif Durum</FormLabel>
                      <FormDescription>
                        Hastane aktif mi pasif mi?
                      </FormDescription>
                    </div>
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        data-testid="checkbox-edit-hospital-active"
                        className="h-4 w-4"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className="flex gap-2 pt-4">
                <Button 
                  type="submit" 
                  disabled={updateHospitalMutation.isPending}
                  data-testid="button-submit-edit-hospital"
                >
                  {updateHospitalMutation.isPending ? "Güncelleniyor..." : "Hastane Güncelle"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditHospitalDialogOpen(false)}
                  data-testid="button-cancel-edit-hospital"
                >
                  İptal
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}