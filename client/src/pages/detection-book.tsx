import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertDetectionBookEntrySchema } from "@shared/schema";
import { z } from "zod";
import { Plus, FileText, Image, Calendar, User, Building, Hash, Eye, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

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

export default function DetectionBookPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

  // Get current user to determine role
  const { data: user } = useQuery({
    queryKey: ['/api/user/me'],
    staleTime: 5 * 60 * 1000
  });

  // Fetch detection book entries
  const { data: entries, isLoading } = useQuery({
    queryKey: ['/api/detection-book'],
    staleTime: 2 * 60 * 1000
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/detection-book'] });
      setIsAddDialogOpen(false);
      form.reset();
      setSelectedFile(null);
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

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'safety_specialist':
        return 'İş Güvenliği Uzmanı';
      case 'occupational_physician':
        return 'İşyeri Hekimi';
      case 'central_admin':
        return 'Sistem Yöneticisi';
      default:
        return role;
    }
  };

  const canAddEntry = user && typeof user === 'object' && 'role' in user && 
    ['safety_specialist', 'occupational_physician', 'central_admin'].includes((user as any).role);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">İSG Tespit ve Öneri Defteri</h1>
          <p className="text-gray-600 mt-1">
            İş Sağlığı ve Güvenliğine İlişkin Tespit ve Öneri Defteri Kayıtları
          </p>
        </div>
        
        {canAddEntry && (
          <Button onClick={() => setIsAddDialogOpen(true)} data-testid="button-add-detection">
            <Plus className="h-4 w-4 mr-2" />
            Yeni Ekle
          </Button>
        )}
      </div>

      {/* Entries List */}
      {isLoading ? (
        <div className="text-center py-8">Kayıtlar yükleniyor...</div>
      ) : !entries || entries.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Henüz tespit defteri kaydı bulunmamaktadır</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {entries && Array.isArray(entries) && entries.map((entry: DetectionBookEntry) => (
            <Card key={entry.id} className="hover:shadow-md transition-shadow" data-testid={`card-entry-${entry.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{entry.workplaceTitle}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant={entry.documentType === 'pdf' ? 'default' : 'secondary'}>
                      {entry.documentType === 'pdf' ? (
                        <FileText className="h-3 w-3 mr-1" />
                      ) : (
                        <Image className="h-3 w-3 mr-1" />
                      )}
                      {entry.documentType === 'pdf' ? 'PDF' : 'Fotoğraf'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-gray-500" />
                    <div>
                      <div className="font-medium">SGK Sicil No</div>
                      <div className="text-gray-600">{entry.sgkRegistrationNumber}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <div>
                      <div className="font-medium">Tarih</div>
                      <div className="text-gray-600">
                        {format(new Date(entry.entryDate), 'dd MMMM yyyy', { locale: tr })}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-gray-500" />
                    <div>
                      <div className="font-medium">Sayfa No</div>
                      <div className="text-gray-600">{entry.pageNumber}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <div>
                      <div className="font-medium">Ekleyen</div>
                      <div className="text-gray-600">
                        {user && typeof user === 'object' && 'id' in user && (user as any).id === entry.userId ? 'Siz' : 'Uzman/Hekim'}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="font-medium mb-2">Değerlendirmeler:</div>
                  <div className="text-gray-700 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">
                    {entry.evaluationText}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="text-sm text-gray-500">
                    Eklendi: {format(new Date(entry.createdAt), 'dd.MM.yyyy HH:mm', { locale: tr })}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(entry.documentUrl, '_blank')}
                      data-testid={`button-view-document-${entry.id}`}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Belgeyi Görüntüle
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Entry Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Yeni Tespit Defteri Kaydı</DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
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
                          data-testid="input-sgk-number"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                  onClick={() => setIsAddDialogOpen(false)}
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
        </DialogContent>
      </Dialog>
    </div>
  );
}