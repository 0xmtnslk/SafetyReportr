import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, Edit, Plus, Trash2
} from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface SectionDetailProps {
  sectionId: string;
  templateId?: string;
}

export default function SectionDetail({ sectionId, templateId }: SectionDetailProps) {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Check if user is admin (only admins can add/edit questions)
  const isAdmin = user?.role === 'central_admin';

  // Fetch section details
  const { data: section, isLoading: sectionLoading } = useQuery<any>({
    queryKey: ["/api/checklist/sections", sectionId],
  });

  // Fetch questions for this section
  const { data: questions = [], isLoading: questionsLoading, refetch: refetchQuestions } = useQuery<any[]>({
    queryKey: ["/api/checklist/sections", sectionId, "questions"],
    staleTime: 0,
    refetchInterval: false,
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
      queryClient.invalidateQueries({ queryKey: ['/api/checklist/sections', sectionId, 'questions'] });
      refetchQuestions();
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: "Soru silinirken bir hata oluştu.",
        variant: "destructive"
      });
    }
  });

  if (sectionLoading || questionsLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Yükleniyor...</div>
      </div>
    );
  }

  if (!section) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Bölüm bulunamadı</div>
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
            onClick={() => {
              if (templateId) {
                setLocation(`/checklist/templates/${templateId}`);
              } else {
                setLocation('/checklist/templates');
              }
            }}
          >
            <ArrowLeft size={16} className="mr-2" />
            Şablona Dön
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{section.name}</h1>
            {section.description && (
              <p className="text-gray-600 mt-1">{section.description}</p>
            )}
          </div>
        </div>
        
        {isAdmin && (
          <Button 
            onClick={() => setLocation(`/checklist/sections/${sectionId}/add-question?templateId=${templateId}`)}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus size={16} className="mr-2" />
            Yeni Soru Ekle
          </Button>
        )}
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {questions.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-gray-500 mb-4">
                Bu bölümde henüz soru bulunmuyor.
              </div>
              {isAdmin && (
                <Button 
                  size="sm"
                  onClick={() => setLocation(`/checklist/sections/${sectionId}/add-question?templateId=${templateId}`)}
                >
                  <Plus size={14} className="mr-1" />
                  İlk Soruyu Ekle
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          questions.map((question, index) => (
            <Card key={question.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium mb-2 text-lg">
                      {index + 1}. {question.questionText || question.text || 'Soru metni yok'}
                    </h4>
                    {question.description && (
                      <p className="text-sm text-gray-600 mb-3">{question.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <Badge variant="secondary">
                        TW Skoru: {question.twScore || question.tw_score || 'Belirtilmemiş'}
                      </Badge>
                      <Badge variant="outline">
                        {question.category || 'Genel'}
                      </Badge>
                      <span>Sıra: {question.orderIndex}</span>
                      {(question.allowPhoto || question.allowDocument || question.requires_file) && (
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                          Dosya Gerekli
                        </Badge>
                      )}
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setLocation(`/checklist/questions/${question.id}/edit?templateId=${templateId}`)}
                      >
                        <Edit size={16} className="mr-1" />
                        Düzenle
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                        onClick={() => {
                          if (window.confirm('Bu soruyu silmek istediğinizden emin misiniz?')) {
                            deleteQuestion.mutate(question.id);
                          }
                        }}
                        disabled={deleteQuestion.isPending}
                      >
                        <Trash2 size={16} className="mr-1" />
                        Sil
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}