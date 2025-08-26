import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, CheckSquare, AlertTriangle, Upload, Save, BarChart3, Plus } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface InspectionDetailProps {
  inspectionId: string;
}

const EVALUATION_OPTIONS = [
  { value: "Karşılıyor", label: "Karşılıyor", color: "bg-green-100 text-green-800" },
  { value: "Kısmen Karşılıyor", label: "Kısmen Karşılıyor", color: "bg-yellow-100 text-yellow-800" },
  { value: "Karşılamıyor", label: "Karşılamıyor", color: "bg-red-100 text-red-800" },
  { value: "Kapsam Dışı", label: "Kapsam Dışı", color: "bg-gray-100 text-gray-800" }
];

const CATEGORIES = [
  "Afet ve Acil Durum Yönetimi",
  "Altyapı", 
  "Emniyet",
  "Güvenlik",
  "Tıbbi Cihaz Yönetimi",
  "Malzeme-Cihaz Yönetimi",
  "Tehlikeli Madde Yönetimi",
  "Atık Yönetimi",
  "Yangın Güvenliği"
];

export default function InspectionDetail({ inspectionId }: InspectionDetailProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [currentScore, setCurrentScore] = useState({ total: 0, max: 0, percentage: 0, grade: "E" });
  const [sectionScores, setSectionScores] = useState<Record<string, any>>({});
  const [showAddQuestionForm, setShowAddQuestionForm] = useState<string | null>(null);
  const [newQuestionText, setNewQuestionText] = useState("");

  // Fetch inspection details
  const { data: inspection, isLoading: inspectionLoading } = useQuery<any>({
    queryKey: ["/api/checklist/inspections", inspectionId],
  });

  // Fetch template with sections and questions
  const { data: template, isLoading: templateLoading } = useQuery<any>({
    queryKey: ["/api/checklist/templates", inspection?.templateId],
    enabled: !!inspection?.templateId,
  });

  // Fetch template sections
  const { data: rawSections = [], isLoading: sectionsLoading } = useQuery<any[]>({
    queryKey: ["/api/checklist/templates", inspection?.templateId, "sections"],
    enabled: !!inspection?.templateId,
  });

  // Fetch questions for each section
  const sectionIds = rawSections.map(s => s.id);
  const questionQueries = useQuery({
    queryKey: ["/api/checklist/sections", "questions", sectionIds],
    queryFn: async () => {
      if (sectionIds.length === 0) return [];
      
      const questionPromises = sectionIds.map(async (sectionId) => {
        const response = await fetch(`/api/checklist/sections/${sectionId}/questions`, {
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
          },
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch questions for section ${sectionId}`);
        }
        
        const questions = await response.json();
        return { sectionId, questions };
      });
      
      return Promise.all(questionPromises);
    },
    enabled: sectionIds.length > 0,
  });

  // Combine sections with their questions
  const sections = rawSections.map(section => ({
    ...section,
    questions: questionQueries.data?.find(q => q.sectionId === section.id)?.questions || []
  }));

  // Fetch existing answers
  const { data: existingAnswers = [], isLoading: answersLoading } = useQuery<any[]>({
    queryKey: ["/api/checklist/inspections", inspectionId, "answers"],
    enabled: !!inspectionId,
  });

  // Load existing answers into state
  useEffect(() => {
    if (existingAnswers.length > 0) {
      const answerMap: Record<string, any> = {};
      existingAnswers.forEach((answer: any) => {
        answerMap[answer.questionId] = {
          evaluation: answer.evaluation,
          category: answer.category,
          twScore: answer.twScore,
          notes: answer.notes || "",
          photos: answer.photos || [],
          documents: answer.documents || []
        };
      });
      setAnswers(answerMap);
    }
  }, [existingAnswers]);

  // Calculate score whenever answers change
  useEffect(() => {
    if (sections.length > 0) {
      let totalScore = 0;
      let maxPossibleScore = 0;
      const sectionScoresMap: Record<string, any> = {};
      
      sections.forEach((section: any) => {
        let sectionScore = 0;
        let sectionMaxScore = 0;
        
        section.questions?.forEach((question: any) => {
          const answer = answers[question.id];
          if (answer) {
            const twScore = parseInt(answer.twScore) || 1;
            sectionMaxScore += twScore;
            maxPossibleScore += twScore;
            
            // Excel formulas: Meets=1×TW, Partially=0.5×TW, Doesn't Meet=-1×TW, Out of Scope=NA
            switch (answer.evaluation) {
              case "Karşılıyor":
                sectionScore += 1 * twScore;
                totalScore += 1 * twScore;
                break;
              case "Kısmen Karşılıyor":
                sectionScore += 0.5 * twScore;
                totalScore += 0.5 * twScore;
                break;
              case "Karşılamıyor":
                sectionScore += -1 * twScore;
                totalScore += -1 * twScore;
                break;
              case "Kapsam Dışı":
                // Don't add to max possible score for out of scope
                sectionMaxScore -= twScore;
                maxPossibleScore -= twScore;
                break;
            }
          }
        });
        
        // Calculate section percentage and grade
        const sectionPercentage = sectionMaxScore > 0 ? Math.max(0, Math.round((sectionScore / sectionMaxScore) * 100)) : 0;
        let sectionGrade = "E";
        if (sectionPercentage >= 90) sectionGrade = "A";
        else if (sectionPercentage >= 75) sectionGrade = "B";
        else if (sectionPercentage >= 50) sectionGrade = "C";
        else if (sectionPercentage >= 25) sectionGrade = "D";
        
        sectionScoresMap[section.id] = {
          score: sectionScore,
          maxScore: sectionMaxScore,
          percentage: sectionPercentage,
          grade: sectionGrade
        };
      });
      
      const percentage = maxPossibleScore > 0 ? Math.max(0, Math.round((totalScore / maxPossibleScore) * 100)) : 0;
      let grade = "E";
      if (percentage >= 90) grade = "A";
      else if (percentage >= 75) grade = "B";
      else if (percentage >= 50) grade = "C";
      else if (percentage >= 25) grade = "D";
      
      setCurrentScore({ total: totalScore, max: maxPossibleScore, percentage, grade });
      setSectionScores(sectionScoresMap);
    }
  }, [answers, sections]);

  // Save answer mutation
  const saveAnswer = useMutation({
    mutationFn: async (answerData: any) => {
      const response = await fetch(`/api/checklist/answers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(answerData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Cevap kaydedilemedi");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/checklist/answers", inspectionId] });
      queryClient.invalidateQueries({ queryKey: ["/api/checklist/inspections", inspectionId] });
    },
  });

  // Complete inspection mutation
  const completeInspection = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/checklist/inspections/${inspectionId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          status: "completed",
          totalScore: currentScore.total,
          maxPossibleScore: currentScore.max,
          successPercentage: currentScore.percentage,
          letterGrade: currentScore.grade,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Denetim tamamlanamadı");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Denetim Tamamlandı",
        description: `Denetim başarıyla tamamlandı. Not: ${currentScore.grade} (%${currentScore.percentage})`,
      });
      setLocation('/checklist');
    },
  });

  // Add new question mutation
  const addQuestion = useMutation({
    mutationFn: async (data: { sectionId: string; questionText: string }) => {
      // Get max order index for this section
      const currentSection = sections.find(s => s.id === data.sectionId);
      const maxOrderIndex = Math.max(0, ...(currentSection?.questions?.map(q => q.orderIndex) || [0]));
      
      const response = await fetch(`/api/checklist/questions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          sectionId: data.sectionId,
          questionText: data.questionText,
          orderIndex: maxOrderIndex + 1,
          isRequired: true,
          allowPhoto: true,
          allowDocument: true,
          isActive: true,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Soru eklenemedi");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/checklist/sections", "questions"] });
      setShowAddQuestionForm(null);
      setNewQuestionText("");
      toast({
        title: "Soru Eklendi",
        description: "Yeni soru başarıyla eklendi.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // File upload handler
  const handleFileUpload = async (questionId: string, type: 'photo' | 'document', file?: File) => {
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Dosya yüklenemedi');
      }

      const result = await response.json();
      
      // Update answer with uploaded file
      setAnswers(prev => {
        const currentAnswer = prev[questionId] || {};
        const currentFiles = type === 'photo' ? (currentAnswer.photos || []) : (currentAnswer.documents || []);
        
        return {
          ...prev,
          [questionId]: {
            ...currentAnswer,
            [type === 'photo' ? 'photos' : 'documents']: [...currentFiles, result.originalName]
          }
        };
      });

      toast({
        title: "Dosya Yüklendi",
        description: `${result.originalName} başarıyla yüklendi.`,
      });

    } catch (error: any) {
      toast({
        title: "Yükleme Hatası",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updateAnswer = (questionId: string, field: string, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        [field]: value
      }
    }));
  };

  const saveQuestionAnswer = async (questionId: string) => {
    const answer = answers[questionId];
    if (!answer?.evaluation || !answer?.category || !answer?.twScore) {
      toast({
        title: "Eksik Bilgi",
        description: "Lütfen değerlendirme, kategori ve TW skorunu doldurun.",
        variant: "destructive",
      });
      return;
    }

    // Check if "Karşılamıyor" is selected but no files uploaded
    if (answer.evaluation === "Karşılamıyor" && (!answer.photos?.length && !answer.documents?.length)) {
      toast({
        title: "Dosya Gerekli",
        description: "'Karşılamıyor' seçimi için fotoğraf veya doküman yüklemek zorunludur.",
        variant: "destructive",
      });
      return;
    }

    try {
      await saveAnswer.mutateAsync({
        inspectionId,
        questionId,
        evaluation: answer.evaluation,
        category: answer.category,
        twScore: parseInt(answer.twScore),
        notes: answer.notes || "",
        photos: answer.photos || [],
        documents: answer.documents || [],
      });
      
      toast({
        title: "Cevap Kaydedildi",
        description: "Soru cevabı başarıyla kaydedildi.",
      });
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (inspectionLoading || templateLoading || sectionsLoading || questionQueries.isLoading || answersLoading) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!inspection || !template || sections.length === 0) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="text-center py-12">
          <AlertTriangle className="mx-auto text-red-500 mb-4" size={48} />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Denetim Bulunamadı</h2>
          <p className="text-gray-600 mb-4">Bu denetim mevcut değil veya erişim izniniz yok.</p>
          <Button onClick={() => setLocation('/checklist')}>
            Kontrol Listelerine Dön
          </Button>
        </div>
      </div>
    );
  }

  const allAnswered = sections.every((section: any) =>
    section.questions?.every((question: any) => answers[question.id]?.evaluation)
  );

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation('/checklist')}
          className="flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          Kontrol Listelerine Dön
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">
            Denetim Detayı
          </h1>
          <p className="text-gray-600">
            {template.name} - {new Date(inspection.inspectionDate).toLocaleDateString('tr-TR')}
          </p>
        </div>
        <Badge variant={inspection.status === 'completed' ? 'default' : 'secondary'} className="text-sm">
          {inspection.status === 'completed' ? 'Tamamlandı' : 'Taslak'}
        </Badge>
      </div>

      {/* Score Card */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 size={20} />
            Güncel Skor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{currentScore.total}</div>
              <div className="text-sm text-gray-600">Toplam Puan</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{currentScore.max}</div>
              <div className="text-sm text-gray-600">Maksimum Puan</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">%{currentScore.percentage}</div>
              <div className="text-sm text-gray-600">Başarı Yüzdesi</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${
                currentScore.grade === 'A' ? 'text-green-600' :
                currentScore.grade === 'B' ? 'text-blue-600' :
                currentScore.grade === 'C' ? 'text-yellow-600' :
                currentScore.grade === 'D' ? 'text-orange-600' : 'text-red-600'
              }`}>
                {currentScore.grade}
              </div>
              <div className="text-sm text-gray-600">Harf Notu</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questions by Section */}
      {sections.map((section: any, sectionIndex: number) => {
        const sectionScore = sectionScores[section.id] || { score: 0, maxScore: 0, percentage: 0, grade: "E" };
        
        return (
          <Card key={section.id} className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckSquare size={20} />
                  {section.name}
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-600">
                    {sectionScore.score}/{sectionScore.maxScore} puan
                  </span>
                  <span className="text-gray-600">
                    %{sectionScore.percentage}
                  </span>
                  <Badge variant={
                    sectionScore.grade === 'A' ? 'default' :
                    sectionScore.grade === 'B' ? 'secondary' :
                    sectionScore.grade === 'C' ? 'outline' :
                    'destructive'
                  } className="font-bold">
                    {sectionScore.grade}
                  </Badge>
                </div>
              </CardTitle>
              {section.description && (
                <p className="text-gray-600">{section.description}</p>
              )}
            </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {section.questions?.map((question: any, questionIndex: number) => {
                const answer = answers[question.id] || {};
                const isAnswered = !!answer.evaluation;
                
                return (
                  <div key={question.id} className="border-l-4 border-blue-200 pl-6 py-4 bg-gray-50 rounded-r-lg">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-medium text-lg text-gray-900">
                        {sectionIndex + 1}.{questionIndex + 1} {question.questionText}
                      </h4>
                      {isAnswered && (
                        <Badge variant="default" className="ml-4">
                          Cevaplandı
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Evaluation */}
                      <div className="space-y-2">
                        <Label>Değerlendirme *</Label>
                        <Select
                          value={answer.evaluation || ""}
                          onValueChange={(value) => updateAnswer(question.id, 'evaluation', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Değerlendirme seçin" />
                          </SelectTrigger>
                          <SelectContent>
                            {EVALUATION_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                <div className="flex items-center gap-2">
                                  <div className={`w-3 h-3 rounded-full ${option.color}`}></div>
                                  {option.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Category */}
                      <div className="space-y-2">
                        <Label>Kategori *</Label>
                        <Select
                          value={answer.category || ""}
                          onValueChange={(value) => updateAnswer(question.id, 'category', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Kategori seçin" />
                          </SelectTrigger>
                          <SelectContent>
                            {CATEGORIES.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* TW Score */}
                      <div className="space-y-2">
                        <Label>TW Skoru (1-10) *</Label>
                        <Input
                          type="number"
                          min="1"
                          max="10"
                          value={answer.twScore || ""}
                          onChange={(e) => updateAnswer(question.id, 'twScore', e.target.value)}
                          placeholder="1-10 arası skor"
                        />
                      </div>
                    </div>

                    {/* Notes */}
                    <div className="mt-4 space-y-2">
                      <Label>Notlar (İsteğe bağlı)</Label>
                      <Textarea
                        value={answer.notes || ""}
                        onChange={(e) => updateAnswer(question.id, 'notes', e.target.value)}
                        placeholder="Bu soru hakkında ek notlar..."
                        rows={2}
                      />
                    </div>

                    {/* File Upload Warning for "Karşılamıyor" */}
                    {answer.evaluation === "Karşılamıyor" && (
                      <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-red-800">
                          <AlertTriangle size={16} />
                          <span className="font-medium">Dikkat!</span>
                        </div>
                        <p className="text-red-700 text-sm mt-1">
                          "Karşılamıyor" seçimi için fotoğraf veya doküman yüklemek zorunludur.
                        </p>
                        <div className="mt-3 flex gap-2">
                          <div>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleFileUpload(question.id, 'photo', e.target.files?.[0])}
                              style={{ display: 'none' }}
                              id={`photo-${question.id}`}
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => document.getElementById(`photo-${question.id}`)?.click()}
                            >
                              <Upload size={14} className="mr-1" />
                              Fotoğraf Yükle
                            </Button>
                          </div>
                          <div>
                            <input
                              type="file"
                              accept=".pdf,.doc,.docx,.txt"
                              onChange={(e) => handleFileUpload(question.id, 'document', e.target.files?.[0])}
                              style={{ display: 'none' }}
                              id={`document-${question.id}`}
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => document.getElementById(`document-${question.id}`)?.click()}
                            >
                              <Upload size={14} className="mr-1" />
                              Doküman Yükle
                            </Button>
                          </div>
                        </div>
                        
                        {/* Display uploaded files */}
                        {(answer.photos?.length > 0 || answer.documents?.length > 0) && (
                          <div className="mt-2 p-2 bg-gray-100 rounded">
                            {answer.photos?.map((photo: string, index: number) => (
                              <div key={index} className="flex items-center gap-2 text-sm text-green-600">
                                📷 {photo}
                              </div>
                            ))}
                            {answer.documents?.map((doc: string, index: number) => (
                              <div key={index} className="flex items-center gap-2 text-sm text-blue-600">
                                📄 {doc}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Save Button */}
                    <div className="mt-4 flex justify-end">
                      <Button
                        onClick={() => saveQuestionAnswer(question.id)}
                        disabled={!answer.evaluation || !answer.category || !answer.twScore || saveAnswer.isPending}
                        size="sm"
                      >
                        <Save size={14} className="mr-1" />
                        {saveAnswer.isPending ? "Kaydediliyor..." : "Cevabı Kaydet"}
                      </Button>
                    </div>
                  </div>
                );
              })}
              
              {/* Add Question Button */}
              {showAddQuestionForm === section.id ? (
                <div className="border-2 border-dashed border-blue-300 p-6 rounded-lg bg-blue-50">
                  <h4 className="font-medium text-lg mb-4">Yeni Soru Ekle</h4>
                  <div className="space-y-4">
                    <div>
                      <Label>Soru Metni *</Label>
                      <Textarea
                        value={newQuestionText}
                        onChange={(e) => setNewQuestionText(e.target.value)}
                        placeholder="Yeni soru metnini yazın..."
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          if (newQuestionText.trim()) {
                            addQuestion.mutate({
                              sectionId: section.id,
                              questionText: newQuestionText.trim(),
                            });
                          }
                        }}
                        disabled={!newQuestionText.trim() || addQuestion.isPending}
                        size="sm"
                      >
                        {addQuestion.isPending ? "Ekleniyor..." : "Soruyu Ekle"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowAddQuestionForm(null);
                          setNewQuestionText("");
                        }}
                        size="sm"
                      >
                        İptal
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddQuestionForm(section.id)}
                    className="flex items-center gap-2"
                  >
                    <Plus size={16} />
                    Soru Ekle
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        );
      })}

      {/* Complete Inspection */}
      {inspection.status !== 'completed' && (
        <Card className="mt-8">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <h3 className="text-lg font-semibold">Denetimi Tamamla</h3>
              <p className="text-gray-600">
                Tüm soruları cevaplayarak denetimi tamamlayabilirsiniz.
              </p>
              {!allAnswered && (
                <p className="text-yellow-600 text-sm">
                  ⚠️ Henüz tüm sorular cevaplanmamış. Lütfen tüm soruları cevaplayın.
                </p>
              )}
              <Button
                onClick={() => completeInspection.mutate()}
                disabled={!allAnswered || completeInspection.isPending}
                size="lg"
                className="min-w-[200px]"
              >
                {completeInspection.isPending ? "Tamamlanıyor..." : "Denetimi Tamamla"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}