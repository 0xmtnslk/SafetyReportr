import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertDetectionBookEntrySchema } from "@shared/schema";
import { z } from "zod";
import { Plus, FileText, Image, Calendar, User, Building, Hash, Eye, ArrowLeft, Search } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { useLocation } from "wouter";

interface DetectionBookPageProps {
  entryId?: string;
  mode?: 'new';
}

type DetectionBookEntry = {
  id: string;
  workplaceTitle: string;
  sgkRegistrationNumber: string;
  entryDate: string;
  pageNumber: number;
  evaluationText: string;
  documentUrl: string;
  documentType: 'pdf' | 'photo';
  documentName: string;
  userId: string;
  locationId: string;
  createdAt: string;
  updatedAt: string;
  creator?: {
    id: string;
    fullName: string;
    role: string;
    safetySpecialistClass?: string;
    certificateNumber?: string;
  };
};

// Form schema - omit auto-generated fields and add file validation
const detectionBookFormSchema = insertDetectionBookEntrySchema.omit({
  documentUrl: true,
  documentType: true,
  documentName: true,
  userId: true,
  locationId: true
}).extend({
  entryDate: z.string().min(1, "Tarih seçimi zorunludur")
});

type DetectionBookFormData = z.infer<typeof detectionBookFormSchema>;

export default function DetectionBookPage({ entryId, mode }: DetectionBookPageProps) {
  const [location, setLocation] = useLocation();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  // Determine current view based on route
  const currentView = location.includes('/new') ? 'new' : 
                     location.match(/\/detection-book\/([^?/]+)/) ? 'detail' : 'list';
  const selectedEntryId = entryId || location.match(/\/detection-book\/([^?/]+)/)?.[1];

  // Get current user to determine role
  const { data: user } = useQuery({
    queryKey: ['/api/user/me'],
    staleTime: 5 * 60 * 1000
  });

  // Get user's location info for workplace title
  const { data: userLocation } = useQuery({
    queryKey: ['/api/locations', user?.locationId],
    enabled: !!user?.locationId,
    staleTime: 10 * 60 * 1000
  });

  // Fetch detection book entries (filtered by user's location)
  const { data: entries, isLoading } = useQuery({
    queryKey: ['/api/detection-book'],
    staleTime: 2 * 60 * 1000
  });

  // Fetch single entry for detail view  
  const { data: selectedEntry, isLoading: isLoadingEntry } = useQuery<DetectionBookEntry>({
    queryKey: ['/api/detection-book', selectedEntryId],
    enabled: !!selectedEntryId && currentView === 'detail',
  });

  // Form setup
  const form = useForm<DetectionBookFormData>({
    resolver: zodResolver(detectionBookFormSchema),
    defaultValues: {
      workplaceTitle: "",
      sgkRegistrationNumber: "",
      entryDate: "",
      pageNumber: 1,
      evaluationText: '6331 sayılı yasa gereği yetkilendirilen işyeri hekimi ve İş Güvenliği Uzmanı tarafından ilgili tespitler yapılmış ve İşveren önerilmiştir.\n\n'
    }
  });

  // Auto-fill workplace title and SGK number when user location loads
  useEffect(() => {
    if (userLocation && typeof userLocation === 'object' && 'name' in userLocation) {
      form.setValue('workplaceTitle', (userLocation as any).name);
      if ('sgkRegistrationNumber' in userLocation && (userLocation as any).sgkRegistrationNumber) {
        form.setValue('sgkRegistrationNumber', (userLocation as any).sgkRegistrationNumber);
      }
    }
  }, [userLocation, form]);

  // Reset form when switching to new view
  useEffect(() => {
    if (currentView === 'new') {
      form.reset({
        workplaceTitle: userLocation && typeof userLocation === 'object' && 'name' in userLocation ? (userLocation as any).name : '',
        sgkRegistrationNumber: userLocation && typeof userLocation === 'object' && 'sgkRegistrationNumber' in userLocation ? (userLocation as any).sgkRegistrationNumber : '',
        entryDate: '',
        pageNumber: 1,
        evaluationText: '6331 sayılı yasa gereği yetkilendirilen işyeri hekimi ve İş Güvenliği Uzmanı tarafından ilgili tespitler yapılmış ve İşveren önerilmiştir.\n\n'
      });
      setSelectedFile(null);
    }
  }, [currentView, form, userLocation]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: DetectionBookFormData & { document: File }) => {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (key !== 'document') {
          formData.append(key, value.toString());
        }
      });
      formData.append('document', data.document);
      
      const response = await fetch('/api/detection-book', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Kayıt eklenirken hata oluştu');
      }
      
      return await response.json();
    },
    onSuccess: (newEntry: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/detection-book'] });
      if (newEntry && newEntry.id) {
        setLocation(`/detection-book/${newEntry.id}`);
      } else {
        setLocation('/detection-book');
      }
      toast({
        title: "Başarılı",
        description: "Tespit defteri kaydı başarıyla eklendi"
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Hata",
        description: error.message || "Tespit defteri kaydı eklenirken hata oluştu"
      });
    }
  });

  const onSubmit = (data: DetectionBookFormData) => {
    if (!selectedFile) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "PDF veya fotoğraf dosyası yüklenmesi zorunludur"
      });
      return;
    }

    createMutation.mutate({ ...data, document: selectedFile });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file type (PDF or image)
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          variant: "destructive",
          title: "Hata",
          description: "Sadece PDF veya resim dosyaları (JPG, PNG) yüklenebilir"
        });
        return;
      }

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "Hata", 
          description: "Dosya boyutu 5MB'dan büyük olamaz"
        });
        return;
      }

      setSelectedFile(file);
    }
  };

  const canAddEntry = user && typeof user === 'object' && 'role' in user && 
    ['safety_specialist', 'occupational_physician', 'central_admin'].includes((user as any).role);

  // Filter and group entries by year
  const filteredEntries = entries && Array.isArray(entries) 
    ? entries.filter((entry: DetectionBookEntry) => 
        entry.workplaceTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.sgkRegistrationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.evaluationText.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  // Group entries by year (newest first)
  const entriesByYear = filteredEntries.reduce((acc: Record<string, DetectionBookEntry[]>, entry) => {
    const year = new Date(entry.entryDate).getFullYear().toString();
    if (!acc[year]) acc[year] = [];
    acc[year].push(entry);
    return acc;
  }, {});

  // Sort years in descending order (newest first)
  const sortedYears = Object.keys(entriesByYear).sort((a, b) => parseInt(b) - parseInt(a));

  // Entry List Component
  const EntryList = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Kayıtlarda ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search-entries"
          />
        </div>
        {canAddEntry && (
          <Button onClick={() => setLocation('/detection-book/new')} data-testid="button-add-detection">
            <Plus className="h-4 w-4 mr-2" />
            Yeni Ekle
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-8">Kayıtlar yükleniyor...</div>
      ) : filteredEntries.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">
            {searchTerm ? 'Arama kriterlerine uygun kayıt bulunamadı' : 'Henüz tespit defteri kaydı bulunmamaktadır'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedYears.map((year) => (
            <div key={year}>
              <div className="sticky top-0 bg-background border-b pb-2 mb-3">
                <h3 className="font-semibold text-lg text-gray-700">{year}</h3>
                <p className="text-xs text-gray-500">{entriesByYear[year].length} kayıt</p>
              </div>
              <div className="space-y-3">
                {entriesByYear[year]
                  .sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime())
                  .map((entry: DetectionBookEntry) => (
                  <Card 
                    key={entry.id} 
                    className={`cursor-pointer hover:shadow-md transition-shadow ${
                      selectedEntryId === entry.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setLocation(`/detection-book/${entry.id}`)}
                    data-testid={`card-entry-${entry.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium text-sm line-clamp-1">{entry.workplaceTitle}</h3>
                        <Badge variant={entry.documentType === 'pdf' ? 'default' : 'secondary'} className="ml-2">
                          {entry.documentType === 'pdf' ? (
                            <FileText className="h-3 w-3 mr-1" />
                          ) : (
                            <Image className="h-3 w-3 mr-1" />
                          )}
                          {entry.documentType === 'pdf' ? 'PDF' : 'Foto'}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-600 space-y-1">
                        <div>SGK: {entry.sgkRegistrationNumber}</div>
                        <div>Sayfa: {entry.pageNumber}</div>
                        <div>{format(new Date(entry.entryDate), 'dd.MM.yyyy', { locale: tr })}</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Entry Form Component
  const EntryForm = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4 pb-4 border-b">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation('/detection-book')}
          data-testid="button-back-to-list"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Geri
        </Button>
        <h2 className="text-lg font-semibold">Yeni Tespit Defteri Kaydı</h2>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="workplaceTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>İşyeri Ünvanı *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Hastane adını girin" 
                      {...field}
                      value={field.value}
                      readOnly={true}
                      disabled={true}
                      className="bg-gray-50 cursor-not-allowed"
                      data-testid="input-workplace-title"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="sgkRegistrationNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SGK Sicil Numarası *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="SGK sicil numarasını girin" 
                      {...field}
                      readOnly={true}
                      disabled={true}
                      className="bg-gray-50 cursor-not-allowed"
                      data-testid="input-sgk-number"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="entryDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tespit Tarihi *</FormLabel>
                  <FormControl>
                    <Input 
                      type="date" 
                      {...field}
                      data-testid="input-entry-date"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="pageNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Defter Sayfa Numarası *</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="1"
                      placeholder="Sayfa numarası" 
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                      data-testid="input-page-number"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="evaluationText"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Değerlendirmeler *</FormLabel>
                <FormControl>
                  <Textarea 
                    rows={8}
                    placeholder="Değerlendirme metnini girin..."
                    {...field}
                    data-testid="textarea-evaluation"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div>
            <label className="block text-sm font-medium mb-2">
              Belge Yükle (PDF veya Fotoğraf) *
            </label>
            <Input
              type="file"
              accept="application/pdf,image/jpeg,image/jpg,image/png"
              onChange={handleFileChange}
              className="cursor-pointer"
              data-testid="input-document-upload"
            />
            {selectedFile && (
              <div className="mt-2 text-sm text-gray-600">
                Seçili dosya: {selectedFile.name}
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1">
              PDF, JPG veya PNG formatında, maksimum 5MB
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setLocation('/detection-book')}
              data-testid="button-cancel-add"
            >
              İptal
            </Button>
            <Button 
              type="submit" 
              disabled={createMutation.isPending}
              data-testid="button-submit-add"
            >
              {createMutation.isPending ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );

  // Entry Detail Component
  const EntryDetail = () => {
    if (isLoadingEntry) {
      return (
        <div className="space-y-6">
          <div className="flex items-center gap-4 pb-4 border-b">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/detection-book')}
              data-testid="button-back-to-list"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Geri
            </Button>
            <h2 className="text-lg font-semibold">Kayıt Yükleniyor...</h2>
          </div>
          <div className="text-center py-12">
            <p className="text-gray-500">Kayıt detayları yükleniyor...</p>
          </div>
        </div>
      );
    }
    
    if (!selectedEntry) {
      return (
        <div className="space-y-6">
          <div className="flex items-center gap-4 pb-4 border-b">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/detection-book')}
              data-testid="button-back-to-list"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Geri
            </Button>
            <h2 className="text-lg font-semibold">Kayıt Bulunamadı</h2>
          </div>
          <div className="text-center py-12">
            <p className="text-gray-500">Seçilen kayıt bulunamadı</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 pb-4 border-b">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation('/detection-book')}
            data-testid="button-back-to-list"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Geri
          </Button>
          <h2 className="text-lg font-semibold">Tespit Defteri Detayı</h2>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">{selectedEntry.workplaceTitle}</CardTitle>
              <Badge variant={selectedEntry.documentType === 'pdf' ? 'default' : 'secondary'}>
                {selectedEntry.documentType === 'pdf' ? (
                  <FileText className="h-3 w-3 mr-1" />
                ) : (
                  <Image className="h-3 w-3 mr-1" />
                )}
                {selectedEntry.documentType === 'pdf' ? 'PDF' : 'Fotoğraf'}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center gap-3">
                <Building className="h-5 w-5 text-gray-500" />
                <div>
                  <div className="font-medium text-sm">SGK Sicil No</div>
                  <div className="text-gray-600">{selectedEntry.sgkRegistrationNumber}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-500" />
                <div>
                  <div className="font-medium text-sm">Tarih</div>
                  <div className="text-gray-600">
                    {format(new Date(selectedEntry.entryDate), 'dd MMMM yyyy', { locale: tr })}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Hash className="h-5 w-5 text-gray-500" />
                <div>
                  <div className="font-medium text-sm">Sayfa No</div>
                  <div className="text-gray-600">{selectedEntry.pageNumber}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-gray-500" />
                <div>
                  <div className="font-medium text-sm">Ekleyen</div>
                  <div className="text-gray-600">
                    {selectedEntry.creator ? (
                      <div>
                        <div className="font-medium">{selectedEntry.creator.fullName}</div>
                        <div className="text-xs text-gray-500">
                          {selectedEntry.creator.safetySpecialistClass && selectedEntry.creator.certificateNumber ? (
                            <>
                              {selectedEntry.creator.safetySpecialistClass} - Belge No: {selectedEntry.creator.certificateNumber}
                            </>
                          ) : (
                            <>{selectedEntry.creator.role === 'safety_specialist' ? 'İş Güvenliği Uzmanı' : 
                              selectedEntry.creator.role === 'occupational_physician' ? 'İşyeri Hekimi' : 
                              selectedEntry.creator.role}</>
                          )}
                        </div>
                      </div>
                    ) : (
                      user && typeof user === 'object' && 'id' in user && (user as any).id === selectedEntry.userId ? 'Siz' : 'Uzman/Hekim'
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="font-medium mb-3">Değerlendirmeler:</div>
              <div className="text-gray-700 bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">
                {selectedEntry.evaluationText}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-gray-500">
                Eklendi: {format(new Date(selectedEntry.createdAt), 'dd.MM.yyyy HH:mm', { locale: tr })}
              </div>
              
              <Button
                variant="outline"
                onClick={() => window.open(selectedEntry.documentUrl, '_blank')}
                data-testid={`button-view-document-${selectedEntry.id}`}
              >
                <Eye className="h-4 w-4 mr-2" />
                Belgeyi Görüntüle
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Mobile Layout with Tabs
  const MobileLayout = () => {
    // Derive tab from route
    const derivedTab = currentView === 'new' ? 'yeni' : currentView === 'detail' ? 'detay' : 'liste';
    
    const handleTabChange = (tab: string) => {
      if (tab === 'liste') setLocation('/detection-book');
      else if (tab === 'yeni') setLocation('/detection-book/new');
      // For 'detay', stay on current detail route
    };

    return (
      <div className="md:hidden">
        <Tabs value={derivedTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="liste" onClick={() => setLocation('/detection-book')}>Liste</TabsTrigger>
            <TabsTrigger value="yeni" onClick={() => setLocation('/detection-book/new')} disabled={!canAddEntry}>Yeni Ekle</TabsTrigger>
            <TabsTrigger value="detay" disabled={!selectedEntryId}>Detay</TabsTrigger>
          </TabsList>
          <TabsContent value="liste" className="mt-6">
            <EntryList />
          </TabsContent>
          <TabsContent value="yeni" className="mt-6">
            <EntryForm />
          </TabsContent>
          <TabsContent value="detay" className="mt-6">
            <EntryDetail />
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  // Desktop Layout with Two Panels
  const DesktopLayout = () => (
    <div className="hidden md:grid md:grid-cols-[320px,1fr] gap-6 h-[calc(100vh-120px)]">
      {/* Left Panel - Entry List */}
      <div className="border-r pr-6 overflow-y-auto">
        <EntryList />
      </div>
      
      {/* Right Panel - Form or Detail */}
      <div className="overflow-y-auto">
        {currentView === 'new' && <EntryForm />}
        {currentView === 'detail' && <EntryDetail />}
        {currentView === 'list' && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">Bir kayıt seçin veya yeni kayıt ekleyin</p>
              {canAddEntry && (
                <Button onClick={() => setLocation('/detection-book/new')} data-testid="button-add-detection-empty">
                  <Plus className="h-4 w-4 mr-2" />
                  Yeni Kayıt Ekle
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">İSG Tespit ve Öneri Defteri</h1>
        <p className="text-gray-600 mt-1">
          İş Sağlığı ve Güvenliğine İlişkin Tespit ve Öneri Defteri Kayıtları
        </p>
      </div>

      <MobileLayout />
      <DesktopLayout />
    </div>
  );
}