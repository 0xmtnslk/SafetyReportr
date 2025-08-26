import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckSquare, ArrowLeft, Plus, Eye
} from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";

interface TemplateDetailProps {
  templateId: string;
}

export default function TemplateDetail({ templateId }: TemplateDetailProps) {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  
  // Check if user is admin (only admins can add sections)
  const isAdmin = user?.role === 'central_admin';

  // Fetch template details
  const { data: template, isLoading: templateLoading } = useQuery<any>({
    queryKey: ["/api/checklist/templates", templateId],
  });

  // Fetch template sections
  const { data: sections = [], isLoading: sectionsLoading } = useQuery<any[]>({
    queryKey: ["/api/checklist/templates", templateId, "sections"],
  });

  // Fetch questions for each section - with better error handling
  const { data: questionsData = {}, isLoading: questionsLoading, refetch: refetchQuestions } = useQuery<Record<string, any[]>>({
    queryKey: ["/api/checklist/sections/questions", templateId, sections.map(s => s?.id).join(',')],
    queryFn: async () => {
      console.log('Loading questions for sections:', sections);
      
      if (!sections || sections.length === 0) {
        return {};
      }

      const questionPromises = sections.map(async (section) => {
        try {
          const response = await fetch(`/api/checklist/sections/${section.id}/questions`, {
            headers: {
              "Authorization": `Bearer ${localStorage.getItem("token")}`,
            },
          });
          
          if (!response.ok) {
            console.error(`Failed to fetch questions for section ${section.id}:`, response.status);
            return { sectionId: section.id, questions: [] };
          }
          
          const questions = await response.json();
          console.log(`Loaded ${Array.isArray(questions) ? questions.length : 0} questions for section ${section.id}`);
          return { sectionId: section.id, questions: Array.isArray(questions) ? questions : [] };
        } catch (error) {
          console.error(`Error fetching questions for section ${section.id}:`, error);
          return { sectionId: section.id, questions: [] };
        }
      });
      
      const results = await Promise.all(questionPromises);
      const questionsMap = results.reduce((acc, { sectionId, questions }) => {
        acc[sectionId] = questions;
        return acc;
      }, {} as Record<string, any[]>);
      
      console.log('Final questions data:', questionsMap);
      return questionsMap;
    },
    enabled: sections.length > 0 && !sectionsLoading,
    refetchInterval: false, // Disable automatic refetching
    staleTime: 0, // Consider data stale immediately
  });

  // Delete question mutation
  const deleteQuestion = useMutation({
    mutationFn: async (questionId: string) => {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/checklist/questions/${questionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to delete question');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Soru Silindi",
        description: "Soru başarıyla silindi.",
      });
      
      // Aggressively invalidate and refetch all related caches
      queryClient.invalidateQueries({ queryKey: ['/api/checklist'] });
      queryClient.invalidateQueries({ queryKey: ['/api/checklist/sections'] });
      queryClient.invalidateQueries({ queryKey: ['/api/checklist/templates'] });
      queryClient.invalidateQueries({ queryKey: ['/api/checklist/questions'] });
      
      // Force immediate refetch of questions
      refetchQuestions();
      
      // Also invalidate specific section queries
      sections.forEach(section => {
        queryClient.invalidateQueries({ queryKey: ['/api/checklist/sections', section.id, 'questions'] });
        queryClient.refetchQueries({ queryKey: ['/api/checklist/sections', section.id, 'questions'] });
      });
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: "Soru silinirken bir hata oluştu.",
        variant: "destructive"
      });
    }
  });

  if (templateLoading || sectionsLoading || questionsLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          <p className="ml-4 text-gray-600">
            {templateLoading && "Şablon yükleniyor..."}
            {sectionsLoading && "Bölümler yükleniyor..."}
            {questionsLoading && "Sorular yükleniyor..."}
          </p>
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
            <h1 className="text-3xl font-bold text-gray-900">Şablon Düzenle: {template.name}</h1>
            <p className="text-gray-600 mt-1">{template.description}</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          {isAdmin && (
            <Button 
              onClick={() => setLocation(`/checklist/templates/${templateId}/edit`)}
              className="bg-primary hover:bg-primary/90"
            >
              <Edit size={16} className="mr-2" />
              Şablonu Düzenle
            </Button>
          )}
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
          const sectionQuestions = Array.isArray(questionsData[section.id]) ? questionsData[section.id] : [];
          const sectionColors = ['border-l-red-500', 'border-l-blue-500', 'border-l-green-500'];
          
          console.log(`Section ${section.name} (${section.id}):`, sectionQuestions.length, 'questions');
          
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
                    {isAdmin && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setLocation(`/checklist/sections/${section.id}/edit`)}
                      >
                        <Edit size={14} className="mr-1" />
                        Düzenle
                      </Button>
                    )}
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
                    {isAdmin && (
                      <Button 
                        size="sm"
                        onClick={() => setLocation(`/checklist/sections/${section.id}/add-question?templateId=${templateId}`)}
                      >
                        <Plus size={14} className="mr-1" />
                        İlk Soruyu Ekle
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sectionQuestions.map((question, qIndex) => (
                      <div key={question.id} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium mb-1">
                              {qIndex + 1}. {question.questionText || question.text || 'Soru metni yok'}
                            </h4>
                            {question.description && (
                              <p className="text-sm text-gray-600">{question.description}</p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                              <span>TW Skoru: {question.twScore || question.tw_score || 'Belirtilmemiş'}</span>
                              <span>Kategori: {question.category || 'Genel'}</span>
                              <span>Sıra: {question.orderIndex}</span>
                              {(question.allowPhoto || question.allowDocument || question.requires_file) && (
                                <Badge variant="outline" className="text-xs">
                                  Dosya Gerekli
                                </Badge>
                              )}
                            </div>
                          </div>
                          {isAdmin && (
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setLocation(`/checklist/questions/${question.id}/edit?from=/checklist/templates/${templateId}`)}
                              >
                                <Edit size={12} />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-600 hover:text-red-700"
                                onClick={() => {
                                  if (window.confirm('Bu soruyu silmek istediğinizden emin misiniz?')) {
                                    deleteQuestion.mutate(question.id);
                                  }
                                }}
                                disabled={deleteQuestion.isPending}
                              >
                                <Trash2 size={12} />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {isAdmin && (
                      <div className="text-center pt-4">
                        <Button 
                          variant="outline"
                          onClick={() => setLocation(`/checklist/sections/${section.id}/add-question?templateId=${templateId}`)}
                        >
                          <Plus size={16} className="mr-2" />
                          Yeni Soru Ekle
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add Section Button */}
      {isAdmin && (
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
      )}
    </div>
  );
}