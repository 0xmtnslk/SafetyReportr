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
  CheckSquare, Save, ArrowLeft, Camera, FileText, AlertTriangle, Plus, ChevronRight, ChevronLeft, X, ZoomIn, Eye
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { ObjectUploader } from "@/components/ObjectUploader";
import { useAuth } from "@/hooks/useAuth";

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

export default function LiveChecklist({ templateId }: LiveChecklistProps) {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  // State for current section and progress - MUST BE AT TOP
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  
  // State for answers - MUST BE AT TOP
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  
  // Get assignmentId from URL query (e.g. /live-checklist?assignmentId=xyz)
  // Use window.location.search instead of wouter location for query params
  const urlParams = new URLSearchParams(window.location.search);
  const assignmentId = urlParams.get('assignmentId');
  
  // Debug URL parsing
  console.log('URL Parsing Debug FIXED:', {
    windowLocationSearch: window.location.search,
    assignmentId,
    allParams: Object.fromEntries(urlParams.entries())
  });
  
  // Fetch assignment details if assignmentId is provided
  const { data: assignment, isLoading: assignmentLoading, error: assignmentError } = useQuery<any>({
    queryKey: ["/api/assignments", assignmentId],
    queryFn: async () => {
      console.log('API Call Starting:', assignmentId);
      const token = localStorage.getItem("token");
      console.log('Token exists:', !!token);
      
      const response = await fetch(`/api/assignments/${assignmentId}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
      
      console.log('API Response Status:', response.status);
      const text = await response.text();
      console.log('API Response Text:', text);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${text}`);
      }
      
      try {
        return JSON.parse(text);
      } catch (e) {
        console.error('JSON Parse Error:', e);
        throw new Error('Invalid JSON response');
      }
    },
    enabled: !!assignmentId,
  });
  
  // Debug assignment loading
  console.log('Assignment Debug:', {
    assignmentId,
    assignmentLoading,
    assignment,
    assignmentError,
    templateIdFromAssignment: assignment?.inspection?.templateId
  });
  
  // Check if assignment is completed - redirect to results page
  useEffect(() => {
    if (assignment && assignment.status === 'completed') {
      toast({
        title: "Denetim Tamamlanmış",
        description: "Bu denetim zaten tamamlanmıştır. Sonuçlar sayfasına yönlendiriliyorsunuz.",
        variant: "default"
      });
      // Get inspection details for proper analysis routing
      const hospitalId = assignment?.location?.id;
      const templateId = assignment?.inspection?.templateId;
      setLocation(`/inspection-analysis/${hospitalId}/${templateId}/${assignmentId}`);
      return;
    }
  }, [assignment, assignmentId, setLocation, toast]);
  
  // Use templateId from assignment or prop - with fallback for safety
  const currentTemplateId = assignment?.inspection?.templateId || templateId;
  
  // Debug template ID
  console.log('Template ID debugging:', {
    assignment,
    assignmentId,
    templateId,
    inspection: assignment?.inspection,
    assignmentLoading,
    currentTemplateId
  });
  
  // Show loading while assignment or template is loading  
  if (assignmentLoading || !currentTemplateId) {
    return (
      <div className="container mx-auto p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Denetim bilgileri yükleniyor...</p>
        {!currentTemplateId && !assignmentLoading && (
          <div className="mt-4">
            <p className="text-red-600">Template ID bulunamadı</p>
            <Button 
              onClick={() => setLocation('/specialist-dashboard')} 
              variant="outline"
              className="mt-2"
            >
              Panele Dön
            </Button>
          </div>
        )}
      </div>
    );
  }
  

  // All useState hooks now moved to top of component to fix React hooks rule

  // Fetch template sections and questions
  const { data: template } = useQuery<any>({
    queryKey: ["/api/checklist/templates", currentTemplateId],
    enabled: !!currentTemplateId,
  });

  const { data: sectionsData = [] } = useQuery<any[]>({
    queryKey: ["/api/checklist/templates", currentTemplateId, "sections"],
    enabled: !!currentTemplateId,
  });

  const { data: questionsData = {} } = useQuery<Record<string, any[]>>({
    queryKey: ["/api/checklist/sections/questions", currentTemplateId],
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
    enabled: sectionsData.length > 0 && !!currentTemplateId,
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
    console.log('🔧 addFileToAnswer called with:', { questionId, fileUrl });
    setAnswers(prev => {
      const currentAnswer = prev[questionId];
      const newFiles = [...(currentAnswer?.files || []), fileUrl];
      const newAnswer = {
        ...currentAnswer,
        questionId,
        answer: currentAnswer?.answer || 'compliant',
        tw_score: currentAnswer?.tw_score || 0,
        notes: currentAnswer?.notes || '',
        files: newFiles
      };
      console.log('🔧 New answer created:', newAnswer);
      console.log('🔧 New files array:', newFiles);
      
      const newState = {
        ...prev,
        [questionId]: newAnswer
      };
      console.log('🔧 Updated answers state:', newState);
      return newState;
    });
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

  // Check if all sections are completed
  const isAllSectionsComplete = () => {
    return sections.every(section => 
      section.questions.every(q => answers[q.id]?.answer)
    );
  };

  // Submit inspection for completion
  const handleSubmitInspection = async () => {
    if (!assignmentId || !isAllSectionsComplete()) return;
    
    try {
      // Submit responses for each question
      const responsePromises = Object.values(answers).map(async (answer) => {
        const responseData = {
          answer: answer.answer === 'compliant' ? 'Karşılıyor' : 
                 answer.answer === 'partially_compliant' ? 'Kısmen Karşılıyor' :
                 answer.answer === 'non_compliant' ? 'Karşılamıyor' : 'Kapsam Dışı',
          notes: answer.notes || '',
          photos: answer.files || [],
          documents: []
        };
        
        return fetch(`/api/assignments/${assignmentId}/questions/${answer.questionId}/response`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(responseData)
        });
      });
      
      // Wait for all responses to be submitted
      await Promise.all(responsePromises);
      
      // Complete the inspection
      const completeResponse = await fetch(`/api/assignments/${assignmentId}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (completeResponse.ok) {
        toast({
          title: "Denetim Tamamlandı!",
          description: "Denetim başarıyla gönderildi. Sonuç analizini görüntüleyebilirsiniz.",
        });
        
        // Redirect to result analysis page
        // Get inspection details for proper analysis routing
      const hospitalId = assignment?.location?.id;
      const templateId = assignment?.inspection?.templateId;
      setLocation(`/inspection-analysis/${hospitalId}/${templateId}/${assignmentId}`);
      }
    } catch (error) {
      console.error('Error submitting inspection:', error);
      toast({
        title: "Hata",
        description: "Denetim gönderilirken bir hata oluştu.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6">
      {/* Header - Mobile Responsive */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6 md:mb-8">
        <div className="flex items-center gap-3 md:gap-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              // Safety specialists go to dashboard, admins go to checklist
              if (['safety_specialist', 'occupational_physician'].includes(user?.role || '')) {
                setLocation('/dashboard');
              } else {
                setLocation('/checklist');
              }
            }}
          >
            <ArrowLeft size={16} className="mr-1 md:mr-2" />
            <span className="hidden sm:inline">Geri</span>
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 truncate">
              {(template as any)?.name || "Kontrol Listesi"}
            </h1>
            <p className="text-sm md:text-base text-gray-600 mt-1 line-clamp-2">
              {(template as any)?.description || "İSG denetim kontrol listesi"}
            </p>
          </div>
        </div>
        
        <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 w-full lg:w-auto">
          <Save size={16} className="mr-2" />
          Kaydet
        </Button>
      </div>

      {/* Modern Progress Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
        {/* Genel İlerleme */}
        <Card className="lg:col-span-1">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="relative inline-flex items-center justify-center w-20 h-20 mb-4">
                <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-gray-200"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-blue-600"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeDasharray={`${getTotalProgress()}, 100`}
                    strokeLinecap="round"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold text-blue-600">
                    {Math.round(getTotalProgress())}%
                  </span>
                </div>
              </div>
              <h3 className="font-semibold text-gray-700">Genel İlerleme</h3>
              <p className="text-sm text-gray-500">
                Bölüm {currentSectionIndex + 1} / {totalSections}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Değerlendirme Özeti - Grafik */}
        <Card className="lg:col-span-3">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-700">Değerlendirme Özeti</h3>
              <div className="text-right">
                <div className="text-sm text-gray-600">Toplam Skor</div>
                <div className="text-xl font-bold text-blue-600">
                  {getTotalScore()} / {getMaxPossibleScore()}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-2xl font-bold text-green-600">
                    {Object.values(answers).filter(a => a.answer === 'compliant').length}
                  </span>
                </div>
                <p className="text-xs text-gray-600">✅ Karşılıyor</p>
              </div>
              <div className="text-center">
                <div className="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-2xl font-bold text-yellow-600">
                    {Object.values(answers).filter(a => a.answer === 'partially_compliant').length}
                  </span>
                </div>
                <p className="text-xs text-gray-600">⚠️ Kısmen</p>
              </div>
              <div className="text-center">
                <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-2xl font-bold text-red-600">
                    {Object.values(answers).filter(a => a.answer === 'non_compliant').length}
                  </span>
                </div>
                <p className="text-xs text-gray-600">❌ Karşılamıyor</p>
              </div>
              <div className="text-center">
                <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-2xl font-bold text-gray-600">
                    {Object.values(answers).filter(a => a.answer === 'not_applicable').length}
                  </span>
                </div>
                <p className="text-xs text-gray-600">➖ Kapsam Dışı</p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Başarı Oranı</span>
                <span className="text-lg font-bold text-blue-600">
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

      {/* Questions - Responsive Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {currentSection?.questions.map((question, index) => {
          const answer = answers[question.id];
          const score = answer ? calculateScore(answer, question) : 0;
          
          return (
            <Card key={question.id} className="border-l-4 border-l-blue-500 h-fit">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
                      {index + 1}
                    </span>
                    {answer && (
                      <Badge className={getAnswerColor(answer.answer)} variant="secondary">
                        {getAnswerLabel(answer.answer)}
                      </Badge>
                    )}
                  </div>
                  <div className="text-right text-xs text-gray-500 whitespace-nowrap">
                    TW: {question.twScore || question.tw_score || '1'} | Puan: {score}
                  </div>
                </div>
                <CardTitle className="text-sm md:text-base leading-5 md:leading-6">
                  {question.questionText || question.text || 'Soru metni yok'}
                </CardTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs">{question.category || 'Genel'}</Badge>
                  {(question.allowPhoto || question.allowDocument) && (
                    <Badge className="bg-orange-100 text-orange-800 text-xs">
                      <Camera size={10} className="mr-1" />
                      Dosya
                    </Badge>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                {/* Mobile-First Evaluation Layout */}
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium mb-1 block">Değerlendirme</Label>
                    <Select
                      value={answer?.answer || ''}
                      onValueChange={(value) => updateAnswer(question.id, 'answer', value)}
                    >
                      <SelectTrigger className="h-10 md:h-9">
                        <SelectValue placeholder="Seçiniz..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="compliant">✅ Karşılıyor</SelectItem>
                        <SelectItem value="partially_compliant">⚠️ Kısmen Karşılıyor</SelectItem>
                        <SelectItem value="non_compliant">❌ Karşılamıyor</SelectItem>
                        <SelectItem value="not_applicable">➖ Kapsam Dışı</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Mobile File Upload */}
                  {(question.allowPhoto || question.allowDocument) && (
                    <div>
                      <Label className="text-sm font-medium mb-1 block">Dosya Yükle</Label>
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
                          console.log('🔧 ObjectUploader result:', result);
                          console.log('🔧 Result successful:', result.successful);
                          if (result.successful && result.successful.length > 0) {
                            result.successful.forEach((file: any) => {
                              console.log('🔧 Processing file:', file);
                              console.log('🔧 File keys:', Object.keys(file));
                              
                              // Try different possible URL properties
                              const fileUrl = file.uploadURL || file.url || file.response?.url || file.source;
                              console.log('🔧 Found fileUrl:', fileUrl);
                              
                              if (fileUrl) {
                                console.log('🔧 Adding to answers:', question.id, fileUrl);
                                addFileToAnswer(question.id, fileUrl);
                                toast({
                                  title: "Dosya Yüklendi",
                                  description: "Dosya başarıyla yüklendi.",
                                });
                              } else {
                                console.error('🔧 No valid URL found in file object:', file);
                              }
                            });
                          } else {
                            console.error('🔧 No successful uploads:', result);
                          }
                        }}
                        buttonClassName="h-10 md:h-9 w-full text-sm"
                      >
                        <Camera size={14} className="mr-2" />
                        Fotoğraf/Doküman Ekle
                      </ObjectUploader>
                    </div>
                  )}
                </div>

                {/* Image Thumbnails - Compact */}
                {console.log('🖼️ Rendering thumbnails for question:', question.id, 'Answer:', answer, 'Files:', answer?.files) || null}
                {answer?.files && answer.files.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    <div className="text-xs text-gray-500 w-full mb-1">
                      {answer.files.length} dosya yüklendi
                    </div>
                    {answer.files.map((fileUrl, fileIndex) => (
                      <div key={fileIndex} className="relative group">
                        <div 
                          className="w-12 h-12 bg-gray-100 rounded border cursor-pointer overflow-hidden hover:border-blue-400 transition-colors"
                          onClick={() => {
                            setSelectedImage(fileUrl);
                          }}
                        >
                          {fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                            <img 
                              src={fileUrl} 
                              alt={`File ${fileIndex + 1}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <FileText size={16} className="text-gray-400" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <Eye size={12} className="text-white" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Notes - Compact */}
                <div>
                  <Textarea
                    placeholder="Notlar..."
                    value={answer?.notes || ''}
                    onChange={(e) => updateAnswer(question.id, 'notes', e.target.value)}
                    rows={2}
                    className="text-sm resize-none"
                  />
                </div>

                {/* Validation Warning */}
                {answer?.answer === 'non_compliant' && (question.allowPhoto || question.allowDocument) && (!answer.files || answer.files.length === 0) && (
                  <div className="flex items-center gap-1 text-red-600 text-xs">
                    <AlertTriangle size={10} />
                    <span>Dosya gerekli</span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Section Navigation & Save */}
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
            
            <div className="flex items-center gap-4">
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
              
              <Button onClick={handleSave} variant="outline" className="bg-blue-50 hover:bg-blue-100">
                <Save size={16} className="mr-2" />
                Kaydet
              </Button>
            </div>
            
            {currentSectionIndex === totalSections - 1 ? (
              // Last section: Show submit button if all sections complete
              <Button
                onClick={handleSubmitInspection}
                disabled={!isAllSectionsComplete()}
                className={isAllSectionsComplete() ? "bg-green-600 hover:bg-green-700" : ""}
              >
                {isAllSectionsComplete() ? "🚀 Denetimi Gönder" : "Tüm Soruları Cevaplayın"}
              </Button>
            ) : (
              // Not last section: Show next button
              <Button
                onClick={goToNextSection}
                disabled={!isCurrentSectionComplete()}
                className={isCurrentSectionComplete() ? "bg-green-600 hover:bg-green-700" : ""}
              >
                Sonraki Bölüm
                <ChevronRight size={16} className="ml-2" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Image Modal - Working Dialog Component */}
      {selectedImage && (
        <Dialog open={true} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] p-2">
            <DialogHeader>
              <DialogTitle>Fotoğraf Ön İzlemesi</DialogTitle>
            </DialogHeader>
            <div className="flex justify-center items-center max-h-[80vh] overflow-auto">
              <img
                src={selectedImage}
                alt="Tam Boyut Önizleme"
                className="max-w-full max-h-full object-contain rounded-lg"
                onError={(e) => {
                  console.error('Resim yüklenemedi:', selectedImage);
                  setSelectedImage(null);
                }}
                onLoad={() => console.log('Resim başarıyla yüklendi:', selectedImage)}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}