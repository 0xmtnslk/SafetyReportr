import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  CheckSquare, Save, ArrowLeft, Camera, FileText, AlertTriangle, Plus
} from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface Question {
  id: string;
  text: string;
  category: string;
  tw_score: number;
  requires_file?: boolean;
}

interface Answer {
  questionId: string;
  answer: 'compliant' | 'partially_compliant' | 'non_compliant' | 'not_applicable';
  tw_score: number;
  notes: string;
  files: File[];
}

export default function LiveChecklist() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // State for category filter
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  
  // Sample questions (in real app, fetch from API)
  const [questions] = useState<Question[]>([
    {
      id: "1",
      text: "ADP sistemi ana panelinde yangın detektörlerinin çalışır durumda olması",
      category: "ADP",
      tw_score: 8,
      requires_file: true
    },
    {
      id: "2", 
      text: "Duman dedektörlerinin temiz ve engelsiz olması",
      category: "ADP",
      tw_score: 7
    },
    {
      id: "3",
      text: "UPS sisteminin batarya seviyelerinin normal aralıkta olması",
      category: "UPS", 
      tw_score: 9,
      requires_file: true
    },
    {
      id: "4",
      text: "UPS bypass anahtarının kapalı konumda olması",
      category: "UPS",
      tw_score: 8
    },
    {
      id: "5",
      text: "Jeneratör yakıt seviyesinin minimum %75 olması",
      category: "Generator",
      tw_score: 10,
      requires_file: true
    },
    {
      id: "6",
      text: "Jeneratör batarya şarj seviyesinin normal aralıkta olması", 
      category: "Generator",
      tw_score: 8
    }
  ]);

  // State for answers
  const [answers, setAnswers] = useState<Record<string, Answer>>({});

  // Filter questions by category
  const filteredQuestions = selectedCategory === "all" 
    ? questions 
    : questions.filter(q => q.category === selectedCategory);

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
    switch (answer.answer) {
      case 'compliant': return question.tw_score * 1;
      case 'partially_compliant': return question.tw_score * 0.5;
      case 'non_compliant': return question.tw_score * -1;
      case 'not_applicable': return 0;
      default: return 0;
    }
  };

  const getTotalScore = () => {
    return filteredQuestions.reduce((total, question) => {
      const answer = answers[question.id];
      return total + (answer ? calculateScore(answer, question) : 0);
    }, 0);
  };

  const getMaxPossibleScore = () => {
    return filteredQuestions.reduce((total, question) => {
      const answer = answers[question.id];
      if (answer?.answer === 'not_applicable') return total;
      return total + question.tw_score;
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
            <h1 className="text-3xl font-bold text-gray-900">İSG Teknik Alanlar Kontrol Listesi</h1>
            <p className="text-gray-600 mt-1">Hastane teknik altyapı sistemlerinin güvenlik denetimi</p>
          </div>
        </div>
        
        <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">
          <Save size={16} className="mr-2" />
          Kaydet
        </Button>
      </div>

      {/* Category Filter & Score Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Kategori Filtresi</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Kategori seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Kategoriler</SelectItem>
                <SelectItem value="ADP">ADP (Yangın Algılama)</SelectItem>
                <SelectItem value="UPS">UPS (Kesintisiz Güç)</SelectItem>
                <SelectItem value="Generator">Jeneratör Sistemleri</SelectItem>
              </SelectContent>
            </Select>
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

      {/* Questions */}
      <div className="space-y-6">
        {filteredQuestions.map((question, index) => {
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
                      <span>{question.text}</span>
                    </CardTitle>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <Badge variant="outline">{question.category}</Badge>
                      <span>TW Skoru: {question.tw_score}</span>
                      <span>Puan: {score}</span>
                      {question.requires_file && (
                        <Badge className="bg-orange-100 text-orange-800">
                          <Camera size={12} className="mr-1" />
                          Fotoğraf Gerekli
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
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <div className="flex flex-col items-center space-y-2">
                          <div className="flex space-x-2">
                            <Camera size={24} className="text-gray-400" />
                            <FileText size={24} className="text-gray-400" />
                          </div>
                          <p className="text-sm text-gray-600">
                            Fotoğraf veya doküman yüklemek için tıklayın
                          </p>
                          <Button variant="outline" size="sm">
                            Dosya Seç
                          </Button>
                        </div>
                      </div>
                      {question.requires_file && answer?.answer === 'non_compliant' && (
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

      {/* Add Question Button */}
      <Card className="mt-6">
        <CardContent className="text-center py-8">
          <Button variant="outline" size="lg">
            <Plus size={20} className="mr-2" />
            Yeni Soru Ekle
          </Button>
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