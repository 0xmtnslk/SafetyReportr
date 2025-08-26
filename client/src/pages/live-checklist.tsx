import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { 
  CheckSquare, Save, ArrowLeft, Camera, FileText, AlertTriangle, Plus, ChevronRight, ChevronLeft
} from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { ObjectUploader } from "@/components/ObjectUploader";

interface Question {
  id: string;
  text?: string;
  questionText?: string;
  description?: string;
  category?: string;
  tw_score?: number;
  twScore?: number;
  requires_file?: boolean;
  allowPhoto?: boolean;
  allowDocument?: boolean;
  orderIndex?: number;
}

interface Section {
  id: string;
  name: string;
  description?: string;
  questions: Question[];
}

interface Answer {
  questionId: string;
  answer: 'compliant' | 'partially_compliant' | 'non_compliant' | 'not_applicable';
  tw_score: number;
  notes: string;
  files: string[]; // File URLs
}

interface LiveChecklistProps {
  templateId?: string;
}

export default function LiveChecklist({ templateId = "7c39d8c0-7ff5-47ad-84f0-cd04de8bfd2a" }: LiveChecklistProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // State for current section and progress
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  
  // State for answers
  const [answers, setAnswers] = useState<Record<string, Answer>>({});

  // Fetch template sections and questions
  const { data: template } = useQuery({
    queryKey: ["/api/checklist/templates", templateId],
  });

  const { data: sectionsData = [] } = useQuery<any[]>({
    queryKey: ["/api/checklist/templates", templateId, "sections"],
  });

  const { data: questionsData = {} } = useQuery<Record<string, any[]>>({
    queryKey: ["/api/checklist/sections/questions", templateId],
    queryFn: async () => {
      const questionPromises = sectionsData.map(async (section: any) => {
        const response = await fetch(`/api/checklist/sections/${section.id}/questions`, {
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const questions = await response.json();
        return { sectionId: section.id, questions };
      });
      
      const results = await Promise.all(questionPromises);
      return results.reduce((acc: Record<string, any[]>, { sectionId, questions }: { sectionId: string, questions: any[] }) => {
        acc[sectionId] = Array.isArray(questions) ? questions : [];
        return acc;
      }, {} as Record<string, any[]>);
    },
    enabled: sectionsData.length > 0,
  });

  // Process sections with questions
  const sections: Section[] = sectionsData.map((section: any) => ({
    id: section.id,
    name: section.name,
    description: section.description,
    questions: questionsData[section.id] || []
  }));

  const currentSection = sections[currentSectionIndex];
  const totalSections = sections.length;

  // Progress calculation
  const getCurrentSectionProgress = () => {
    if (!currentSection) return 0;
    const answeredQuestions = currentSection.questions.filter(q => answers[q.id]?.answer);
    return currentSection.questions.length > 0 ? (answeredQuestions.length / currentSection.questions.length) * 100 : 0;
  };

  const isCurrentSectionComplete = () => {
    if (!currentSection) return false;
    return currentSection.questions.every(q => answers[q.id]?.answer);
  };

  const getTotalProgress = () => {
    const totalQuestions = sections.reduce((total, section) => total + section.questions.length, 0);
    const answeredQuestions = Object.keys(answers).length;
    return totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;
  };

  // Navigation handlers
  const goToNextSection = () => {
    if (currentSectionIndex < totalSections - 1 && isCurrentSectionComplete()) {
      setCurrentSectionIndex(prev => prev + 1);
    }
  };

  const goToPreviousSection = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(prev => prev - 1);
    }
  };

  // Answer handlers
  const updateAnswer = (questionId: string, field: keyof Answer, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        questionId,
        answer: prev[questionId]?.answer || 'compliant',
        tw_score: prev[questionId]?.tw_score || 0,
        notes: prev[questionId]?.notes || '',
        files: prev[questionId]?.files || [],
        [field]: value
      }
    }));
  };

  const addFileToAnswer = (questionId: string, fileUrl: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        questionId,
        answer: prev[questionId]?.answer || 'compliant',
        tw_score: prev[questionId]?.tw_score || 0,
        notes: prev[questionId]?.notes || '',
        files: [...(prev[questionId]?.files || []), fileUrl]
      }
    }));
  };

  const getAnswerLabel = (value: string) => {
    const labels = {
      'compliant': 'Karşılıyor',
      'partially_compliant': 'Kısmen Karşılıyor', 
      'non_compliant': 'Karşılamıyor',
      'not_applicable': 'Kapsam Dışı'
    };
    return labels[value as keyof typeof labels] || value;
  };

  const getAnswerColor = (value: string) => {
    const colors = {
      'compliant': 'bg-green-100 text-green-800',
      'partially_compliant': 'bg-yellow-100 text-yellow-800',
      'non_compliant': 'bg-red-100 text-red-800', 
      'not_applicable': 'bg-gray-100 text-gray-800'
    };
    return colors[value as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const calculateScore = (answer: Answer, question: Question) => {
    const twScore = question.twScore || question.tw_score || 1;
    switch (answer.answer) {
      case 'compliant': return twScore * 1;
      case 'partially_compliant': return twScore * 0.5;
      case 'non_compliant': return twScore * -1;
      case 'not_applicable': return 0;
      default: return 0;
    }
  };

  const getTotalScore = () => {
    const allQuestions = sections.flatMap(section => section.questions);
    return allQuestions.reduce((total, question) => {
      const answer = answers[question.id];
      return total + (answer ? calculateScore(answer, question) : 0);
    }, 0);
  };

  const getMaxPossibleScore = () => {
    const allQuestions = sections.flatMap(section => section.questions);
    return allQuestions.reduce((total, question) => {
      const answer = answers[question.id];
      if (answer?.answer === 'not_applicable') return total;
      return total + (question.twScore || question.tw_score || 1);
    }, 0);
  };

  const handleSave = () => {
    toast({
      title: "Kontrol Listesi Kaydedildi",
      description: "Değerlendirmeleriniz başarıyla kaydedildi.",
    });
  };

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
            <h1 className="text-3xl font-bold text-gray-900">{(template as any)?.name || "Kontrol Listesi"}</h1>
            <p className="text-gray-600 mt-1">{(template as any)?.description || "İSG denetim kontrol listesi"}</p>
          </div>
        </div>
        
        <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">
          <Save size={16} className="mr-2" />
          Kaydet
        </Button>
      </div>

      {/* Progress & Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Genel İlerleme</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Progress value={getTotalProgress()} className="w-full" />
              <div className="text-sm text-gray-600">
                {Math.round(getTotalProgress())}% tamamlandı
              </div>
              <div className="text-sm">
                Bölüm {currentSectionIndex + 1} / {totalSections}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mevcut Bölüm</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <h3 className="font-semibold">{currentSection?.name}</h3>
              <Progress value={getCurrentSectionProgress()} className="w-full" />
              <div className="text-sm text-gray-600">
                {Math.round(getCurrentSectionProgress())}% tamamlandı
              </div>
              <div className="text-sm">
                {currentSection?.questions.length || 0} soru
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Skor Durumu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Mevcut Skor:</span>
                <span className="font-bold">{getTotalScore()}</span>
              </div>
              <div className="flex justify-between">
                <span>Maksimum Skor:</span>
                <span className="font-bold">{getMaxPossibleScore()}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span>Başarı Oranı:</span>
                <span className="font-bold">
                  {getMaxPossibleScore() > 0 
                    ? Math.round((getTotalScore() / getMaxPossibleScore()) * 100) 
                    : 0}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Section Questions */}
      {currentSection && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-3">
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    Bölüm {currentSectionIndex + 1}
                  </span>
                  {currentSection.name}
                </CardTitle>
                {currentSection.description && (
                  <p className="text-gray-600 text-sm mt-2">{currentSection.description}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPreviousSection}
                  disabled={currentSectionIndex === 0}
                >
                  <ChevronLeft size={16} className="mr-1" />
                  Önceki
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextSection}
                  disabled={currentSectionIndex === totalSections - 1 || !isCurrentSectionComplete()}
                >
                  Sonraki
                  <ChevronRight size={16} className="ml-1" />
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Questions */}
      <div className="space-y-6">
        {currentSection?.questions.map((question, index) => {
          const answer = answers[question.id];
          const score = answer ? calculateScore(answer, question) : 0;
          
          return (
            <Card key={question.id} className="border-l-4 border-l-blue-500">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-3 mb-2">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
                        {index + 1}
                      </span>
                      <span>{question.questionText || question.text || 'Soru metni yok'}</span>
                    </CardTitle>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <Badge variant="outline">{question.category || 'Genel'}</Badge>
                      <span>TW Skoru: {question.twScore || question.tw_score || 'Belirtilmemiş'}</span>
                      <span>Puan: {score}</span>
                      {(question.allowPhoto || question.allowDocument) && (
                        <Badge className="bg-orange-100 text-orange-800">
                          <Camera size={12} className="mr-1" />
                          Dosya Gerekli
                        </Badge>
                      )}
                    </div>
                  </div>
                  {answer && (
                    <Badge className={getAnswerColor(answer.answer)}>
                      {getAnswerLabel(answer.answer)}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Evaluation */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor={`answer-${question.id}`}>Değerlendirme</Label>
                      <Select
                        value={answer?.answer || ''}
                        onValueChange={(value) => updateAnswer(question.id, 'answer', value)}
                      >
                        <SelectTrigger id={`answer-${question.id}`}>
                          <SelectValue placeholder="Değerlendirme seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="compliant">✅ Karşılıyor</SelectItem>
                          <SelectItem value="partially_compliant">⚠️ Kısmen Karşılıyor</SelectItem>
                          <SelectItem value="non_compliant">❌ Karşılamıyor</SelectItem>
                          <SelectItem value="not_applicable">➖ Kapsam Dışı</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor={`notes-${question.id}`}>Notlar</Label>
                      <Textarea
                        id={`notes-${question.id}`}
                        placeholder="Değerlendirme notlarınızı yazın..."
                        value={answer?.notes || ''}
                        onChange={(e) => updateAnswer(question.id, 'notes', e.target.value)}
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* File Upload */}
                  <div className="space-y-4">
                    <div>
                      <Label>Fotoğraf/Doküman Yükleme</Label>
                      {(question.allowPhoto || question.allowDocument) ? (
                        <div className="space-y-3">
                          <ObjectUploader
                            maxNumberOfFiles={5}
                            maxFileSize={10485760}
                            onGetUploadParameters={async () => {
                              const response = await fetch('/api/objects/upload', {
                                method: 'POST',
                                headers: {
                                  'Authorization': `Bearer ${localStorage.getItem('token')}`,
                                  'Content-Type': 'application/json'
                                }
                              });
                              const data = await response.json();
                              return {
                                method: 'PUT' as const,
                                url: data.uploadURL
                              };
                            }}
                            onComplete={(result) => {
                              if (result.successful) {
                                result.successful.forEach((file: any) => {
                                  if (file.uploadURL) {
                                    addFileToAnswer(question.id, file.uploadURL);
                                    toast({
                                      title: "Dosya Yüklendi",
                                      description: "Dosya başarıyla yüklendi.",
                                    });
                                  }
                                });
                              }
                            }}
                            buttonClassName="w-full"
                          >
                            <div className="flex items-center justify-center gap-2">
                              <Camera size={16} />
                              <FileText size={16} />
                              <span>Dosya Yükle</span>
                            </div>
                          </ObjectUploader>
                          
                          {/* Show uploaded files */}
                          {answer?.files && answer.files.length > 0 && (
                            <div className="space-y-2">
                              <Label className="text-sm">Yüklenen Dosyalar:</Label>
                              <div className="space-y-1">
                                {answer.files.map((fileUrl, fileIndex) => (
                                  <div key={fileIndex} className="flex items-center gap-2 p-2 bg-gray-50 rounded text-sm">
                                    <FileText size={14} />
                                    <span>Dosya {fileIndex + 1}</span>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => window.open(fileUrl, '_blank')}
                                      className="ml-auto"
                                    >
                                      Görüntüle
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center text-gray-400">
                          <p className="text-sm">Bu soru için dosya yükleme gerekli değil</p>
                        </div>
                      )}
                      
                      {(question.allowPhoto || question.allowDocument) && answer?.answer === 'non_compliant' && (!answer.files || answer.files.length === 0) && (
                        <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                          <AlertTriangle size={16} />
                          <span>Bu madde için fotoğraf/doküman yükleme zorunludur</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Section Navigation */}
      <Card className="mt-6">
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={goToPreviousSection}
              disabled={currentSectionIndex === 0}
            >
              <ChevronLeft size={16} className="mr-2" />
              Önceki Bölüm
            </Button>
            
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Bölüm {currentSectionIndex + 1} / {totalSections}
              </p>
              {!isCurrentSectionComplete() && (
                <p className="text-xs text-red-600 mt-1">
                  Sonraki bölüme geçmek için tüm soruları cevaplayın
                </p>
              )}
            </div>
            
            <Button
              onClick={goToNextSection}
              disabled={currentSectionIndex === totalSections - 1 || !isCurrentSectionComplete()}
              className={isCurrentSectionComplete() ? "bg-green-600 hover:bg-green-700" : ""}
            >
              Sonraki Bölüm
              <ChevronRight size={16} className="ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Değerlendirme Özeti</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">
                {Object.values(answers).filter(a => a.answer === 'compliant').length}
              </div>
              <div className="text-sm text-gray-600">Karşılıyor</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">
                {Object.values(answers).filter(a => a.answer === 'partially_compliant').length}
              </div>
              <div className="text-sm text-gray-600">Kısmen Karşılıyor</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                {Object.values(answers).filter(a => a.answer === 'non_compliant').length}
              </div>
              <div className="text-sm text-gray-600">Karşılamıyor</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-600">
                {Object.values(answers).filter(a => a.answer === 'not_applicable').length}
              </div>
              <div className="text-sm text-gray-600">Kapsam Dışı</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}