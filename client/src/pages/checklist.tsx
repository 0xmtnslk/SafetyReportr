import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckSquare, FileText, Eye, Edit, Plus, Settings, Copy
} from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

export default function ChecklistDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Get current user info
  const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = ['central_admin', 'location_manager'].includes(userInfo?.role);

  // Fetch all templates
  const { data: templates = [], isLoading: templatesLoading } = useQuery<any[]>({
    queryKey: ["/api/checklist/templates"],
  });

  if (templatesLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            İSG Kontrol Listesi Şablonları
          </h1>
          <p className="text-gray-600 mt-2">
            Kontrol listesi şablonlarını görüntüleyin, düzenleyin ve yeni şablonlar oluşturun
          </p>
        </div>
        
        <Button 
          onClick={() => setLocation('/checklist/create-template')}
          className="bg-primary hover:bg-primary/90"
        >
          <Plus size={20} className="mr-2" />
          Yeni Şablon Oluştur
        </Button>
      </div>

      {/* Templates Grid */}
      {templates.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText size={64} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Henüz Şablon Yok
            </h3>
            <p className="text-gray-600 mb-6">
              İlk kontrol listesi şablonunuzu oluşturun.
            </p>
            <Button onClick={() => setLocation('/checklist/create-template')}>
              <Plus size={20} className="mr-2" />
              İlk Şablonu Oluştur
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {templates.map((template) => (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-3 mb-3">
                      <div className="bg-primary/10 p-2 rounded-lg">
                        <CheckSquare size={24} className="text-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold">{template.name}</h3>
                        <p className="text-sm text-gray-500 font-normal">
                          Oluşturulma: {new Date(template.created_at).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                    </CardTitle>
                    {template.description && (
                      <p className="text-gray-600 text-sm ml-14">{template.description}</p>
                    )}
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">
                    {template.type === 'hospital_technical' ? 'Hastane Teknik' : template.type}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                {/* Sections Preview */}
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h4 className="font-semibold mb-3">Kontrol Alanları:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-sm">ADP (Yangın Algılama) - 10 madde</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm">UPS (Kesintisiz Güç) - 10 madde</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Jeneratör Sistemleri - 10 madde</span>
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div className="mb-4">
                  <h4 className="font-semibold mb-2">Özellikler:</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-xs">TW Skorları (1-10)</Badge>
                    <Badge variant="outline" className="text-xs">Excel Formülleri</Badge>
                    <Badge variant="outline" className="text-xs">Fotoğraf/Doküman</Badge>
                    <Badge variant="outline" className="text-xs">Dinamik Sorular (+)</Badge>
                    <Badge variant="outline" className="text-xs">Harf Notları (A-E)</Badge>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-2 flex-wrap">
                  <Button
                    onClick={() => setLocation(`/checklist/templates/${template.id}`)}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Eye size={16} className="mr-2" />
                    Şablonu Görüntüle
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => setLocation(`/checklist/templates/${template.id}/edit`)}
                  >
                    <Edit size={16} className="mr-2" />
                    Düzenle
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => setLocation(`/checklist/templates/${template.id}/copy`)}
                  >
                    <Copy size={16} className="mr-2" />
                    Kopyala
                  </Button>

                  {isAdmin && (
                    <Button
                      variant="outline"
                      onClick={() => setLocation(`/checklist/templates/${template.id}/settings`)}
                    >
                      <Settings size={16} className="mr-2" />
                      Ayarlar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}