import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckSquare, ArrowLeft, Edit, Plus, Trash2, Settings
} from "lucide-react";
import { useLocation } from "wouter";

interface TemplateDetailProps {
  templateId: string;
}

export default function TemplateDetail({ templateId }: TemplateDetailProps) {
  const [, setLocation] = useLocation();

  // Fetch template details
  const { data: template, isLoading: templateLoading } = useQuery<any>({
    queryKey: ["/api/checklist/templates", templateId],
  });

  // Fetch template sections
  const { data: sections = [], isLoading: sectionsLoading } = useQuery<any[]>({
    queryKey: ["/api/checklist/templates", templateId, "sections"],
  });

  // Fetch questions for each section
  const { data: questionsData = {} } = useQuery<Record<string, any[]>>({
    queryKey: ["/api/checklist/sections/questions", templateId],
    queryFn: async () => {
      const questionPromises = sections.map(async (section) => {
        const response = await fetch(`/api/checklist/sections/${section.id}/questions`);
        const questions = await response.json();
        return { sectionId: section.id, questions };
      });
      
      const results = await Promise.all(questionPromises);
      return results.reduce((acc, { sectionId, questions }) => {
        acc[sectionId] = questions;
        return acc;
      }, {} as Record<string, any[]>);
    },
    enabled: sections.length > 0,
  });

  if (templateLoading || sectionsLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Şablon Bulunamadı</h3>
            <p className="text-gray-600 mb-4">Aradığınız şablon mevcut değil.</p>
            <Button onClick={() => setLocation('/checklist')}>
              <ArrowLeft size={16} className="mr-2" />
              Geri Dön
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
            <h1 className="text-3xl font-bold text-gray-900">{template.name}</h1>
            <p className="text-gray-600 mt-1">{template.description}</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={() => setLocation(`/checklist/templates/${templateId}/edit`)}
            className="bg-primary hover:bg-primary/90"
          >
            <Edit size={16} className="mr-2" />
            Şablonu Düzenle
          </Button>
        </div>
      </div>

      {/* Template Info */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Şablon Bilgileri</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Genel Bilgiler:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Tip: {template.type === 'hospital_technical' ? 'Hastane Teknik Altyapı' : template.type}</li>
                <li>• Toplam Bölüm: {sections.length}</li>
                <li>• Oluşturulma: {new Date(template.created_at).toLocaleDateString('tr-TR')}</li>
                <li>• Son Güncelleme: {new Date(template.updated_at).toLocaleDateString('tr-TR')}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Değerlendirme Sistemi:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• TW Skorları: 1-10 arası değerlendirme</li>
                <li>• Karşılıyor: 1 × TW Skoru</li>
                <li>• Kısmen Karşılıyor: 0.5 × TW Skoru</li>
                <li>• Karşılamıyor: -1 × TW Skoru</li>
                <li>• Kapsam Dışı: Hesaplama dışı</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sections */}
      <div className="space-y-6">
        {sections.map((section, index) => {
          const sectionQuestions = questionsData[section.id] || [];
          const sectionColors = ['border-l-red-500', 'border-l-blue-500', 'border-l-green-500'];
          
          return (
            <Card key={section.id} className={`border-l-4 ${sectionColors[index % 3]}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <CheckSquare size={20} />
                    {section.name}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Badge variant="outline">
                      {sectionQuestions.length} Soru
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setLocation(`/checklist/sections/${section.id}/edit`)}
                    >
                      <Edit size={14} className="mr-1" />
                      Düzenle
                    </Button>
                  </div>
                </div>
                {section.description && (
                  <p className="text-gray-600 text-sm mt-2">{section.description}</p>
                )}
              </CardHeader>
              
              <CardContent>
                {sectionQuestions.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">Bu bölümde henüz soru yok</p>
                    <Button 
                      size="sm"
                      onClick={() => setLocation(`/checklist/sections/${section.id}/add-question`)}
                    >
                      <Plus size={14} className="mr-1" />
                      İlk Soruyu Ekle
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sectionQuestions.map((question, qIndex) => (
                      <div key={question.id} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium mb-1">
                              {qIndex + 1}. {question.text}
                            </h4>
                            {question.description && (
                              <p className="text-sm text-gray-600">{question.description}</p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                              <span>TW Skoru: {question.tw_score}</span>
                              <span>Kategori: {question.category}</span>
                              {question.requires_file && (
                                <Badge variant="outline" className="text-xs">
                                  Dosya Gerekli
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setLocation(`/checklist/questions/${question.id}/edit`)}
                            >
                              <Edit size={12} />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 size={12} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    <div className="text-center pt-4">
                      <Button 
                        variant="outline"
                        onClick={() => setLocation(`/checklist/sections/${section.id}/add-question`)}
                      >
                        <Plus size={16} className="mr-2" />
                        Yeni Soru Ekle
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add Section Button */}
      <Card className="mt-6">
        <CardContent className="text-center py-8">
          <Button 
            onClick={() => setLocation(`/checklist/templates/${templateId}/add-section`)}
            variant="outline"
            size="lg"
          >
            <Plus size={20} className="mr-2" />
            Yeni Bölüm Ekle
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}