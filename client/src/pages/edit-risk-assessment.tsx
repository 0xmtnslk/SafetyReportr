import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRoute, useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  ArrowLeft, 
  Save, 
  AlertTriangle, 
  Calculator,
  Users,
  Image as ImageIcon,
  Target,
  CheckCircle,
  Shield
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface RiskCategory {
  id: string;
  name: string;
}

interface RiskSubCategory {
  id: string;
  categoryId: string;
  name: string;
}

interface FineKinneyValues {
  probability: { value: number; label: string }[];
  frequency: { value: number; label: string }[];
  severity: { value: number; label: string }[];
}

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
}

const AFFECTED_PERSONS_OPTIONS = [
  'Doktor',
  'Hemşire', 
  'YSP',
  'Teknisyen',
  'Hasta',
  'Hasta Yakını',
  'Çalışan',
  'Ziyaretçi',
  'Diğer'
];

const riskAssessmentSchema = z.object({
  detectionDate: z.string().min(1, 'Tespit tarihi zorunludur'),
  categoryId: z.string().min(1, 'Risk kategorisi seçilmelidir'),
  subCategoryId: z.string().min(1, 'Alt risk kategorisi seçilmelidir'),
  area: z.string().optional(),
  activity: z.string().optional(),
  hazardDescription: z.string().min(1, 'Tehlike tanımı zorunludur'),
  riskSituation: z.string().min(1, 'Risk durumu zorunludur'),
  potentialConsequence: z.string().optional(),
  affectedPersons: z.array(z.string()).min(1, 'En az bir etkilenen kişi seçilmelidir'),
  otherAffectedPersons: z.string().optional(),
  currentStateDescription: z.string().min(1, 'Mevcut durum açıklaması zorunludur'),
  currentStateImages: z.array(z.string()).default([]),
  currentProbability: z.number().min(0.2, 'Olasılık seçilmelidir'),
  currentFrequency: z.number().min(0.5, 'Sıklık seçilmelidir'),
  currentSeverity: z.number().min(1, 'Şiddet seçilmelidir'),
  improvementMeasures: z.string().min(1, 'İyileştirme önlemleri zorunludur'),
  improvementResponsible: z.string().min(1, 'Sorumlu kişi zorunludur'),
  targetDate: z.string().min(1, 'Hedef tarih zorunludur'),
  status: z.string().default('open'),
  priority: z.string().default('medium'),
});

type RiskAssessmentFormData = z.infer<typeof riskAssessmentSchema>;

export default function EditRiskAssessmentPage() {
  const [, params] = useRoute('/risk-assessment/edit/:id');
  const assessmentId = params?.id;
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedAffectedPersons, setSelectedAffectedPersons] = useState<string[]>([]);
  const [showOtherPersons, setShowOtherPersons] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<RiskAssessmentFormData>({
    resolver: zodResolver(riskAssessmentSchema),
    defaultValues: {
      detectionDate: format(new Date(), 'yyyy-MM-dd'),
      affectedPersons: [],
      currentStateImages: [],
      status: 'open',
      priority: 'medium',
    },
  });

  // Fetch existing risk assessment
  const { data: assessment, isLoading: loadingAssessment } = useQuery<RiskAssessment>({
    queryKey: ['/api/risk/assessments', assessmentId],
    queryFn: async () => {
      const response = await fetch(`/api/risk/assessments/${assessmentId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Risk değerlendirmesi bulunamadı');
        }
        throw new Error('Risk değerlendirmesi yüklenemedi');
      }
      return response.json();
    },
    enabled: !!assessmentId,
  });

  // Fetch risk categories
  const { data: categories } = useQuery<RiskCategory[]>({
    queryKey: ['/api/risk/categories'],
  });

  // Fetch risk subcategories
  const { data: subCategories } = useQuery<RiskSubCategory[]>({
    queryKey: ['/api/risk/sub-categories'],
  });

  // Fetch Fine-Kinney values
  const { data: fineKinneyValues } = useQuery<FineKinneyValues>({
    queryKey: ['/api/risk/fine-kinney-values'],
  });

  // Update form when assessment data is loaded
  useEffect(() => {
    if (assessment) {
      const formData = {
        detectionDate: format(new Date(assessment.detectionDate), 'yyyy-MM-dd'),
        categoryId: assessment.categoryId,
        subCategoryId: assessment.subCategoryId,
        area: assessment.area || '',
        activity: assessment.activity || '',
        hazardDescription: assessment.hazardDescription,
        riskSituation: assessment.riskSituation,
        potentialConsequence: assessment.potentialConsequence || '',
        affectedPersons: assessment.affectedPersons,
        otherAffectedPersons: assessment.otherAffectedPersons || '',
        currentStateDescription: assessment.currentStateDescription,
        currentStateImages: assessment.currentStateImages,
        currentProbability: assessment.currentProbability,
        currentFrequency: assessment.currentFrequency,
        currentSeverity: assessment.currentSeverity,
        improvementMeasures: assessment.improvementMeasures,
        improvementResponsible: assessment.improvementResponsible,
        targetDate: format(new Date(assessment.targetDate), 'yyyy-MM-dd'),
        status: assessment.status,
        priority: assessment.priority,
      };

      // Reset form with new data
      form.reset(formData);
      setSelectedCategory(assessment.categoryId);
      setSelectedAffectedPersons(assessment.affectedPersons);
      setShowOtherPersons(assessment.affectedPersons.includes('Diğer'));
    }
  }, [assessment, form]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: RiskAssessmentFormData) => {
      return apiRequest('PUT', `/api/risk/assessments/${assessmentId}`, data);
    },
    onSuccess: (updatedAssessment) => {
      queryClient.invalidateQueries({ queryKey: ['/api/risk/assessments'] });
      toast({
        title: 'Başarılı',
        description: 'Risk değerlendirmesi güncellendi',
      });
      // Navigate back to assessment list
      setLocation(`/risk-assessment/department/${updatedAssessment.departmentId}`);
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: error.message || 'Risk değerlendirmesi güncellenemedi',
      });
    },
  });

  // Calculate risk score
  const currentProbability = form.watch('currentProbability');
  const currentFrequency = form.watch('currentFrequency');
  const currentSeverity = form.watch('currentSeverity');
  
  const riskScore = currentProbability && currentFrequency && currentSeverity 
    ? currentProbability * currentFrequency * currentSeverity 
    : 0;

  const getRiskLevel = (score: number) => {
    if (score >= 400) return { level: 'Tolerans Gösterilemez Risk', color: 'bg-red-900' };
    if (score >= 200) return { level: 'Yüksek Risk', color: 'bg-red-500' };
    if (score >= 70) return { level: 'Önemli Risk', color: 'bg-orange-500' };
    if (score >= 20) return { level: 'Olası Risk', color: 'bg-yellow-600' };
    return { level: 'Düşük Risk', color: 'bg-green-500' };
  };

  const riskLevel = getRiskLevel(riskScore);

  // Handle form submission
  const onSubmit = (data: RiskAssessmentFormData) => {
    updateMutation.mutate(data);
  };

  // Handle affected persons change
  const handleAffectedPersonChange = (person: string, checked: boolean) => {
    let newPersons = [...selectedAffectedPersons];
    
    if (checked) {
      if (!newPersons.includes(person)) {
        newPersons.push(person);
      }
    } else {
      newPersons = newPersons.filter(p => p !== person);
    }
    
    setSelectedAffectedPersons(newPersons);
    setShowOtherPersons(newPersons.includes('Diğer'));
    form.setValue('affectedPersons', newPersons);
  };

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

  const filteredSubCategories = subCategories?.filter(
    sub => sub.categoryId === selectedCategory
  ) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={() => setLocation(`/risk-assessment/department/${assessment.departmentId}`)}
                data-testid="button-back"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Risk Listesi
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <Shield className="h-8 w-8 text-red-600" />
                  Risk Değerlendirmesi Düzenle
                </h1>
                <p className="text-gray-600 mt-2">
                  {assessment.assessmentNumber} - Fine-Kinney metodolojisi ile risk değerlendirmesi
                </p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic Information */}
          <Card className="bg-white shadow-sm border border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Temel Bilgiler
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="detectionDate">Tespit Tarihi *</Label>
                  <Input
                    id="detectionDate"
                    type="date"
                    {...form.register('detectionDate')}
                    className="w-full"
                    data-testid="input-detection-date"
                  />
                  {form.formState.errors.detectionDate && (
                    <p className="text-sm text-red-600">{form.formState.errors.detectionDate.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Risk Kategorisi *</Label>
                  <Select
                    value={form.watch('categoryId')}
                    onValueChange={(value) => {
                      form.setValue('categoryId', value);
                      setSelectedCategory(value);
                      form.setValue('subCategoryId', ''); // Reset subcategory
                    }}
                  >
                    <SelectTrigger data-testid="select-category">
                      <SelectValue placeholder="Risk kategorisi seçin..." />
                    </SelectTrigger>
                    <SelectContent>
                      {categories?.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.categoryId && (
                    <p className="text-sm text-red-600">{form.formState.errors.categoryId.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Alt Risk Kategorisi *</Label>
                  <Select
                    value={form.watch('subCategoryId')}
                    onValueChange={(value) => form.setValue('subCategoryId', value)}
                    disabled={!selectedCategory}
                  >
                    <SelectTrigger data-testid="select-subcategory">
                      <SelectValue placeholder="Alt risk kategorisi seçin..." />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredSubCategories.map((subCategory) => (
                        <SelectItem key={subCategory.id} value={subCategory.id}>
                          {subCategory.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.subCategoryId && (
                    <p className="text-sm text-red-600">{form.formState.errors.subCategoryId.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="area">Alan/Ekipman</Label>
                  <Input
                    id="area"
                    {...form.register('area')}
                    placeholder="İş alanı, ekipman vb..."
                    data-testid="input-area"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="activity">Faaliyet/İş Tanımı</Label>
                <Input
                  id="activity"
                  {...form.register('activity')}
                  placeholder="Yapılan iş veya olay tanımı..."
                  data-testid="input-activity"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="hazardDescription">Tehlike Tanımı *</Label>
                  <Textarea
                    id="hazardDescription"
                    {...form.register('hazardDescription')}
                    placeholder="Tespit edilen tehlike..."
                    rows={3}
                    data-testid="input-hazard-description"
                  />
                  {form.formState.errors.hazardDescription && (
                    <p className="text-sm text-red-600">{form.formState.errors.hazardDescription.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="riskSituation">Risk Durumu *</Label>
                  <Textarea
                    id="riskSituation"
                    {...form.register('riskSituation')}
                    placeholder="İlişkili risk durumu..."
                    rows={3}
                    data-testid="input-risk-situation"
                  />
                  {form.formState.errors.riskSituation && (
                    <p className="text-sm text-red-600">{form.formState.errors.riskSituation.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="potentialConsequence">Olası Sonuç/Zarar</Label>
                <Textarea
                  id="potentialConsequence"
                  {...form.register('potentialConsequence')}
                  placeholder="Muhtemel hasar veya zarar..."
                  rows={2}
                  data-testid="input-potential-consequence"
                />
              </div>
            </CardContent>
          </Card>

          {/* Affected Persons */}
          <Card className="bg-white shadow-sm border border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Etkilenen Kişiler
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {AFFECTED_PERSONS_OPTIONS.map((person) => (
                  <div key={person} className="flex items-center space-x-2">
                    <Checkbox
                      id={`affected-${person}`}
                      checked={selectedAffectedPersons.includes(person)}
                      onCheckedChange={(checked) => 
                        handleAffectedPersonChange(person, !!checked)
                      }
                      data-testid={`checkbox-affected-${person.toLowerCase()}`}
                    />
                    <Label 
                      htmlFor={`affected-${person}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {person}
                    </Label>
                  </div>
                ))}
              </div>

              {showOtherPersons && (
                <div className="space-y-2">
                  <Label htmlFor="otherAffectedPersons">Diğer - Belirtiniz</Label>
                  <Input
                    id="otherAffectedPersons"
                    {...form.register('otherAffectedPersons')}
                    placeholder="Diğer etkilenen kişiler..."
                    data-testid="input-other-affected-persons"
                  />
                </div>
              )}

              {form.formState.errors.affectedPersons && (
                <p className="text-sm text-red-600">{form.formState.errors.affectedPersons.message}</p>
              )}
            </CardContent>
          </Card>

          {/* Current State */}
          <Card className="bg-white shadow-sm border border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-green-600" />
                Mevcut Durum
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="currentStateDescription">Mevcut Durum Açıklaması *</Label>
                <Textarea
                  id="currentStateDescription"
                  {...form.register('currentStateDescription')}
                  placeholder="Mevcut durumun detaylı açıklaması..."
                  rows={4}
                  data-testid="input-current-state-description"
                />
                {form.formState.errors.currentStateDescription && (
                  <p className="text-sm text-red-600">{form.formState.errors.currentStateDescription.message}</p>
                )}
              </div>

              {/* Fine-Kinney Risk Assessment */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Fine-Kinney Risk Skorlaması
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="space-y-2">
                    <Label>Olasılık (P) *</Label>
                    <Select
                      value={form.watch('currentProbability')?.toString()}
                      onValueChange={(value) => form.setValue('currentProbability', parseFloat(value))}
                    >
                      <SelectTrigger data-testid="select-probability">
                        <SelectValue placeholder="Olasılık seçin..." />
                      </SelectTrigger>
                      <SelectContent>
                        {fineKinneyValues?.probability.map((prob) => (
                          <SelectItem key={prob.value} value={prob.value.toString()}>
                            {prob.value} - {prob.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.currentProbability && (
                      <p className="text-sm text-red-600">{form.formState.errors.currentProbability.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Sıklık (F) *</Label>
                    <Select
                      value={form.watch('currentFrequency')?.toString()}
                      onValueChange={(value) => form.setValue('currentFrequency', parseFloat(value))}
                    >
                      <SelectTrigger data-testid="select-frequency">
                        <SelectValue placeholder="Sıklık seçin..." />
                      </SelectTrigger>
                      <SelectContent>
                        {fineKinneyValues?.frequency.map((freq) => (
                          <SelectItem key={freq.value} value={freq.value.toString()}>
                            {freq.value} - {freq.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.currentFrequency && (
                      <p className="text-sm text-red-600">{form.formState.errors.currentFrequency.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Şiddet (S) *</Label>
                    <Select
                      value={form.watch('currentSeverity')?.toString()}
                      onValueChange={(value) => form.setValue('currentSeverity', parseFloat(value))}
                    >
                      <SelectTrigger data-testid="select-severity">
                        <SelectValue placeholder="Şiddet seçin..." />
                      </SelectTrigger>
                      <SelectContent>
                        {fineKinneyValues?.severity.map((sev) => (
                          <SelectItem key={sev.value} value={sev.value.toString()}>
                            {sev.value} - {sev.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.currentSeverity && (
                      <p className="text-sm text-red-600">{form.formState.errors.currentSeverity.message}</p>
                    )}
                  </div>
                </div>

                {/* Risk Score Display */}
                <div className="bg-white p-4 rounded-lg border-2 border-dashed border-gray-300">
                  <div className="text-center">
                    <div className="text-2xl font-bold mb-2" data-testid="text-risk-score">
                      Risk Skoru: {riskScore > 0 ? riskScore.toFixed(1) : '-'}
                    </div>
                    {riskScore > 0 && (
                      <div className={`inline-block px-4 py-2 rounded-full text-white text-sm font-medium ${riskLevel.color}`}>
                        {riskLevel.level}
                      </div>
                    )}
                  </div>
                </div>
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
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="improvementMeasures">İyileştirme Önlemleri *</Label>
                <Textarea
                  id="improvementMeasures"
                  {...form.register('improvementMeasures')}
                  placeholder="Alınacak önlemler ve iyileştirme planı..."
                  rows={4}
                  data-testid="input-improvement-measures"
                />
                {form.formState.errors.improvementMeasures && (
                  <p className="text-sm text-red-600">{form.formState.errors.improvementMeasures.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="improvementResponsible">Sorumlu Kişi/Birim *</Label>
                  <Input
                    id="improvementResponsible"
                    {...form.register('improvementResponsible')}
                    placeholder="İyileştirmeden sorumlu kişi veya birim..."
                    data-testid="input-improvement-responsible"
                  />
                  {form.formState.errors.improvementResponsible && (
                    <p className="text-sm text-red-600">{form.formState.errors.improvementResponsible.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetDate">Hedef Tamamlanma Tarihi *</Label>
                  <Input
                    id="targetDate"
                    type="date"
                    {...form.register('targetDate')}
                    className="w-full"
                    data-testid="input-target-date"
                  />
                  {form.formState.errors.targetDate && (
                    <p className="text-sm text-red-600">{form.formState.errors.targetDate.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Durum</Label>
                  <Select
                    value={form.watch('status')}
                    onValueChange={(value) => form.setValue('status', value)}
                  >
                    <SelectTrigger data-testid="select-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Açık</SelectItem>
                      <SelectItem value="in_progress">Devam Ediyor</SelectItem>
                      <SelectItem value="completed">Tamamlandı</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Öncelik</Label>
                  <Select
                    value={form.watch('priority')}
                    onValueChange={(value) => form.setValue('priority', value)}
                  >
                    <SelectTrigger data-testid="select-priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Düşük</SelectItem>
                      <SelectItem value="medium">Orta</SelectItem>
                      <SelectItem value="high">Yüksek</SelectItem>
                      <SelectItem value="critical">Kritik</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation(`/risk-assessment/department/${assessment.departmentId}`)}
              data-testid="button-cancel"
            >
              İptal
            </Button>
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
              data-testid="button-update-assessment"
            >
              {updateMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Güncelleniyor...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Güncelle
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}