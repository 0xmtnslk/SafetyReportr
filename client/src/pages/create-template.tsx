import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus } from "lucide-react";
import { useLocation } from "wouter";

export default function CreateTemplate() {
  const [, setLocation] = useLocation();

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => setLocation('/checklist')}
          >
            <ArrowLeft size={16} className="mr-2" />
            Geri
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Yeni Şablon Oluştur</h1>
            <p className="text-gray-600 mt-1">Yeni kontrol listesi şablonu oluşturun</p>
          </div>
        </div>
        
        <Button className="bg-primary hover:bg-primary/90">
          <Plus size={16} className="mr-2" />
          Şablonu Oluştur
        </Button>
      </div>

      <Card>
        <CardContent className="text-center py-12">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Şablon Oluşturma Sayfası
          </h3>
          <p className="text-gray-600 mb-6">
            Bu sayfa yakında tamamlanacak. Şimdilik mevcut şablonu düzenleyebilirsiniz.
          </p>
          <Button onClick={() => setLocation('/checklist')}>
            <ArrowLeft size={16} className="mr-2" />
            Şablon Listesine Dön
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}