import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

interface AddQuestionProps {
  sectionId: string;
}

export default function AddQuestion({ sectionId }: AddQuestionProps) {
  const [, setLocation] = useLocation();

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-4 mb-8">
        <Button 
          variant="outline" 
          onClick={() => setLocation('/checklist')}
        >
          <ArrowLeft size={16} className="mr-2" />
          Geri
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">Yeni Soru Ekle</h1>
      </div>

      <Card>
        <CardContent className="text-center py-12">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Soru Ekleme Sayfası
          </h3>
          <p className="text-gray-600 mb-6">Bu sayfa yakında tamamlanacak.</p>
          <Button onClick={() => setLocation('/checklist')}>Geri Dön</Button>
        </CardContent>
      </Card>
    </div>
  );
}