import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckSquare, Play, FileText, Calendar } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function ChecklistDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Fetch the main template
  const { data: template, isLoading: templateLoading } = useQuery<any>({
    queryKey: ["/api/checklist/templates"],
    select: (data) => data?.[0] // Get first template (İSG Teknik Alanlar)
  });

  // Create new inspection mutation (direct)
  const createNewInspection = useMutation({
    mutationFn: async () => {
      if (!template) throw new Error("Template bulunamadı");
      
      const response = await fetch(`/api/checklist/inspections`, {
        method: "POST", 
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          templateId: template.id,
          locationId: "cc12b0d8-01d8-41b5-aba0-82754e4a5a1a", // MLPCARE Merkez
          inspectionDate: new Date().toISOString(),
          notes: "Direkt kontrol listesi denetimi",
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Denetim oluşturulamadı");
      }
      
      return response.json();
    },
    onSuccess: (inspection) => {
      toast({
        title: "Kontrol Listesi Açıldı",
        description: "İSG Teknik Alanlar kontrol listesine yönlendiriliyorsunuz...",
      });
      setLocation(`/checklist/inspections/${inspection.id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Hata", 
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (templateLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          İSG Teknik Alanlar Kontrol Listesi
        </h1>
        <p className="text-gray-600 text-lg">
          Hastane teknik altyapı sistemlerinin güvenlik ve uygunluk denetimi
        </p>
      </div>

      {/* Template Info Card */}
      {template && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText size={24} />
              {template.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Kontrol Alanları:</h3>
                <ul className="space-y-1 text-gray-600">
                  <li>• ADP (Yangın Algılama) Sistemleri - 10 kontrol maddesi</li>
                  <li>• UPS (Kesintisiz Güç) Sistemleri - 10 kontrol maddesi</li>
                  <li>• Jeneratör Sistemleri - 10 kontrol maddesi</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Özellikler:</h3>
                <ul className="space-y-1 text-gray-600">
                  <li>• TW Skorları (1-10 arası değerlendirme)</li>
                  <li>• Excel formülleri ile otomatik hesaplama</li>
                  <li>• Fotoğraf ve doküman yükleme</li>
                  <li>• Dinamik soru ekleme (+ butonu)</li>
                  <li>• Bölüm bazlı skorlama ve harf notları</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Start Button */}
      <div className="text-center">
        <Card className="inline-block">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-center mb-4">
                <div className="bg-primary/10 p-4 rounded-full">
                  <CheckSquare size={48} className="text-primary" />
                </div>
              </div>
              <h2 className="text-2xl font-bold">Kontrol Listesini Başlat</h2>
              <p className="text-gray-600 max-w-md">
                Yeni bir İSG teknik alanlar denetimi başlatın. 
                Tüm kontrol maddelerini değerlendirin ve skorlama yapın.
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-4">
                <Calendar size={16} />
                <span>{new Date().toLocaleDateString('tr-TR', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</span>
              </div>
              <Button
                onClick={() => createNewInspection.mutate()}
                disabled={createNewInspection.isPending || !template}
                size="lg"
                className="min-w-[200px]"
              >
                <Play size={20} className="mr-2" />
                {createNewInspection.isPending ? "Başlatılıyor..." : "Kontrol Listesini Başlat"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Footer */}
      <div className="mt-12 text-center text-gray-500 text-sm">
        <p>
          Kontrol listesi sisteminde her madde için değerlendirme yapacak, 
          TW skorları girecek ve gerektiğinde fotoğraf/doküman yükleyeceksiniz.
        </p>
      </div>
    </div>
  );
}