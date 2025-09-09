import { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { AlertTriangle, ArrowLeft, FileText, Users, Calendar, Target, Calculator, CheckCircle, ImageIcon, Edit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';

interface RiskAssessment {
  id: string;
  assessmentNumber: string;
  detectionDate: string;
  categoryId: string;
  subCategoryId: string;
  area: string;
  activity: string;
  hazardDescription: string;
  riskSituation: string;
  potentialConsequence: string;
  affectedPersons: string[];
  otherAffectedPersons?: string;
  currentStateDescription: string;
  currentStateImages: string[];
  currentProbability: number;
  currentFrequency: number;
  currentSeverity: number;
  currentRiskScore: number;
  currentRiskLevel: string;
  currentRiskColor: string;
  improvementMeasures: string;
  improvementResponsible: string;
  targetDate: string;
  status: string;
  priority: string;
  // İyileştirme sonrası alanları
  improvementProbability?: number;
  improvementFrequency?: number;
  improvementSeverity?: number;
  effectivenessMeasurement?: string;
  result?: string;
  relatedRegulation?: string;
}

interface RiskCategory {
  id: string;
  name: string;
}

interface RiskSubCategory {
  id: string;
  categoryId: string;
  name: string;
}

const getRiskLevel = (score: number) => {
  if (score >= 400) return { level: 'Tolerans Gösterilemez Risk', color: 'bg-red-900' };
  if (score >= 200) return { level: 'Yüksek Risk', color: 'bg-red-500' };
  if (score >= 70) return { level: 'Önemli Risk', color: 'bg-orange-500' };
  if (score >= 20) return { level: 'Olası Risk', color: 'bg-yellow-600' };
  return { level: 'Düşük Risk', color: 'bg-green-500' };
};

const getStatusText = (status: string) => {
  switch(status) {
    case 'open': return 'Açık';
    case 'in_progress': return 'Devam Ediyor';
    case 'completed': return 'Tamamlandı';
    default: return status;
  }
};

const getPriorityText = (priority: string) => {
  switch(priority) {
    case 'low': return 'Düşük';
    case 'medium': return 'Orta';
    case 'high': return 'Yüksek';
    case 'critical': return 'Kritik';
    default: return priority;
  }
};

const getPriorityColor = (priority: string) => {
  switch(priority) {
    case 'low': return 'bg-green-100 text-green-800';
    case 'medium': return 'bg-yellow-100 text-yellow-800';
    case 'high': return 'bg-orange-100 text-orange-800';
    case 'critical': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export default function ViewRiskAssessmentPage() {
  const [, params] = useRoute('/risk-assessment/view/:id');
  const assessmentId = params?.id;
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Fetch assessment data
  const { data: assessment, isLoading: loadingAssessment } = useQuery({
    queryKey: ['/api/risk/assessments', assessmentId],
    enabled: !!assessmentId,
  });

  // Fetch categories
  const { data: categories } = useQuery<RiskCategory[]>({
    queryKey: ['/api/risk/categories'],
  });

  // Fetch sub-categories
  const { data: subCategories } = useQuery<RiskSubCategory[]>({
    queryKey: ['/api/risk/sub-categories'],
  });

  const category = categories?.find(c => c.id === assessment?.categoryId);
  const subCategory = subCategories?.find(sc => sc.id === assessment?.subCategoryId);

  if (loadingAssessment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold">Risk Değerlendirmesi Bulunamadı</h2>
          <p className="text-gray-600 mt-2">Aradığınız risk değerlendirmesi mevcut değil veya erişim yetkiniz bulunmuyor.</p>
          <Button onClick={() => setLocation('/risk-assessment')} className="mt-4" variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Geri Dön
          </Button>
        </div>
      </div>
    );
  }

  // Calculate improvement risk score if available
  const improvementRiskScore = (assessment.improvementProbability && assessment.improvementFrequency && assessment.improvementSeverity) 
    ? assessment.improvementProbability * assessment.improvementFrequency * assessment.improvementSeverity 
    : null;
  const improvementRiskLevel = improvementRiskScore ? getRiskLevel(improvementRiskScore) : null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Button
              onClick={() => setLocation(`/risk-assessment/department/${assessment.departmentId || '/risk-assessment'}`)}
              variant="ghost"
              className="mb-4"
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Geri Dön
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">
              Risk Değerlendirmesi Detayları
            </h1>
            <p className="text-gray-600">
              {assessment.assessmentNumber} - {format(new Date(assessment.detectionDate), 'dd MMMM yyyy', { locale: tr })}
            </p>
          </div>
          <Button
            onClick={() => setLocation(`/risk-assessment/edit/${assessment.id}`)}
            className="bg-blue-600 hover:bg-blue-700"
            data-testid="button-edit"
          >
            <Edit className="h-4 w-4 mr-2" />
            Düzenle
          </Button>
        </div>

        {/* Basic Information */}
        <Card className="bg-white shadow-sm border border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Temel Bilgiler
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-700">Risk Kategorisi</label>
                <p className="mt-1 text-gray-900">{category?.name || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Alt Risk Kategorisi</label>
                <p className="mt-1 text-gray-900">{subCategory?.name || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Alan</label>
                <p className="mt-1 text-gray-900">{assessment.area || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Faaliyet</label>
                <p className="mt-1 text-gray-900">{assessment.activity || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Risk Details */}
        <Card className="bg-white shadow-sm border border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Risk Detayları
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Tehlike Tanımı</label>
              <p className="mt-1 text-gray-900 whitespace-pre-wrap">{assessment.hazardDescription}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Risk Durumu</label>
              <p className="mt-1 text-gray-900 whitespace-pre-wrap">{assessment.riskSituation}</p>
            </div>
            {assessment.potentialConsequence && (
              <div>
                <label className="text-sm font-medium text-gray-700">Potansiyel Sonuç</label>
                <p className="mt-1 text-gray-900 whitespace-pre-wrap">{assessment.potentialConsequence}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Affected Persons */}
        <Card className="bg-white shadow-sm border border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-600" />
              Etkilenecek Kişiler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-4">
              {assessment.affectedPersons.map((person, index) => (
                <Badge key={index} variant="secondary" className="px-3 py-1">
                  {person}
                </Badge>
              ))}
            </div>
            {assessment.otherAffectedPersons && (
              <div>
                <label className="text-sm font-medium text-gray-700">Diğer Etkilenecek Kişiler</label>
                <p className="mt-1 text-gray-900">{assessment.otherAffectedPersons}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Current State */}
        <Card className="bg-white shadow-sm border border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-purple-600" />
              Mevcut Durum
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Mevcut Durum Açıklaması</label>
              <p className="mt-1 text-gray-900 whitespace-pre-wrap">{assessment.currentStateDescription}</p>
            </div>
            {assessment.currentStateImages && assessment.currentStateImages.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-3 block">Fotoğraflar</label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {assessment.currentStateImages.map((image, index) => (
                    <div key={index} className="border rounded-lg p-2">
                      <img 
                        src={image} 
                        alt={`Mevcut durum ${index + 1}`}
                        className="w-full h-48 object-cover rounded"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Current Risk Assessment */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calculator className="h-5 w-5 text-blue-600" />
              Mevcut Risk Skoru
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">Olasılık (P)</p>
                <p className="text-2xl font-bold text-blue-600">{assessment.currentProbability}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Sıklık (F)</p>
                <p className="text-2xl font-bold text-blue-600">{assessment.currentFrequency}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Şiddet (S)</p>
                <p className="text-2xl font-bold text-blue-600">{assessment.currentSeverity}</p>
              </div>
            </div>
            
            <Separator />
            
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-700 mb-2">
                Risk Skoru: {assessment.currentRiskScore}
              </p>
              <Badge 
                className={`text-white text-lg px-6 py-2 ${getRiskLevel(assessment.currentRiskScore).color}`}
              >
                {getRiskLevel(assessment.currentRiskScore).level}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Improvement Plan */}
        <Card className="bg-white shadow-sm border border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-600" />
              İyileştirme Planı
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">İyileştirme Önlemleri</label>
              <p className="mt-1 text-gray-900 whitespace-pre-wrap">{assessment.improvementMeasures}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-700">Sorumlu Kişi/Birim</label>
                <p className="mt-1 text-gray-900">{assessment.improvementResponsible}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Hedef Tarih</label>
                <p className="mt-1 text-gray-900">{format(new Date(assessment.targetDate), 'dd MMMM yyyy', { locale: tr })}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-700">Durum</label>
                <p className="mt-1">
                  <Badge variant="outline">
                    {getStatusText(assessment.status)}
                  </Badge>
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Öncelik</label>
                <p className="mt-1">
                  <Badge className={getPriorityColor(assessment.priority)}>
                    {getPriorityText(assessment.priority)}
                  </Badge>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Improvement Effectiveness and Results */}
        {(assessment.effectivenessMeasurement || assessment.result || assessment.relatedRegulation) && (
          <Card className="bg-white shadow-sm border border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                İyileştirme Etkinlik Ölçümü ve Sonuç
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {assessment.effectivenessMeasurement && (
                <div>
                  <label className="text-sm font-medium text-gray-700">İyileştirme Etkinlik Ölçümü</label>
                  <p className="mt-1 text-gray-900 whitespace-pre-wrap">{assessment.effectivenessMeasurement}</p>
                </div>
              )}
              {assessment.result && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Sonuç</label>
                  <p className="mt-1 text-gray-900 whitespace-pre-wrap">{assessment.result}</p>
                </div>
              )}
              {assessment.relatedRegulation && (
                <div>
                  <label className="text-sm font-medium text-gray-700">İlgili Mevzuat</label>
                  <p className="mt-1 text-gray-900 whitespace-pre-wrap">{assessment.relatedRegulation}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Improvement Post-Assessment Risk Score */}
        {improvementRiskScore && (
          <Card className="bg-green-50 border-green-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calculator className="h-5 w-5 text-green-600" />
                İyileştirme Sonrası Risk Skoru
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600">İyileştirilmiş Olasılık (P)</p>
                  <p className="text-2xl font-bold text-green-600">{assessment.improvementProbability}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">İyileştirilmiş Sıklık (F)</p>
                  <p className="text-2xl font-bold text-green-600">{assessment.improvementFrequency}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">İyileştirilmiş Şiddet (S)</p>
                  <p className="text-2xl font-bold text-green-600">{assessment.improvementSeverity}</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="text-center">
                <p className="text-lg font-semibold text-gray-700 mb-2">
                  İyileştirme Sonrası Risk Skoru: {improvementRiskScore}
                </p>
                {improvementRiskLevel && (
                  <Badge 
                    className={`text-white text-lg px-6 py-2 ${improvementRiskLevel.color}`}
                  >
                    {improvementRiskLevel.level}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Risk Score Comparison */}
        {improvementRiskScore && (
          <Card className="bg-gray-50 border border-gray-200">
            <CardHeader>
              <CardTitle className="text-center">Risk Skorları Karşılaştırması</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">Mevcut Risk Skoru</p>
                  <p className="text-3xl font-bold text-blue-600 mb-2">{assessment.currentRiskScore}</p>
                  <Badge className={`${getRiskLevel(assessment.currentRiskScore).color} text-white`}>
                    {getRiskLevel(assessment.currentRiskScore).level}
                  </Badge>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">İyileştirme Sonrası Risk Skoru</p>
                  <p className="text-3xl font-bold text-green-600 mb-2">{improvementRiskScore}</p>
                  <Badge className={`${improvementRiskLevel!.color} text-white`}>
                    {improvementRiskLevel!.level}
                  </Badge>
                </div>
              </div>
              <div className="text-center mt-6">
                <p className="text-lg font-semibold">
                  Risk Azalması: {((assessment.currentRiskScore - improvementRiskScore) / assessment.currentRiskScore * 100).toFixed(1)}%
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}