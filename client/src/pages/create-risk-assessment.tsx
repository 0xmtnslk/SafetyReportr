import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useRoute, useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Calculator, AlertTriangle, ArrowLeft, Calendar, Users, Save } from 'lucide-react';

interface HospitalDepartment {
  id: string;
  name: string;
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

interface FineKinneyValue {
  value: number;
  label: string;
}

interface FineKinneyValues {
  probability: FineKinneyValue[];
  frequency: FineKinneyValue[];
  severity: FineKinneyValue[];
}

const createRiskAssessmentSchema = z.object({
  departmentId: z.string().min(1, 'Bölüm seçimi zorunludur'),
  categoryId: z.string().min(1, 'Kategori seçimi zorunludur'),
  subCategoryId: z.string().optional(),
  area: z.string().min(1, 'Alan tanımı zorunludur'),
  activity: z.string().min(1, 'Faaliyet tanımı zorunludur'),
  hazard: z.string().min(1, 'Tehlike tanımı zorunludur'),
  risk: z.string().min(1, 'Risk tanımı zorunludur'),
  potentialConsequence: z.string().min(1, 'Potansiyel sonuç zorunludur'),
  currentStateDescription: z.string().min(1, 'Mevcut durum açıklaması zorunludur'),
  currentProbability: z.number().refine(val => [0.2, 0.5, 1, 3, 6, 10].includes(val)),
  currentFrequency: z.number().refine(val => [0.5, 1, 2, 3, 6, 10].includes(val)),
  currentSeverity: z.number().refine(val => [1, 3, 7, 15, 40, 100].includes(val)),
  improvementMeasures: z.string().min(1, 'İyileştirme önlemleri zorunludur'),
  improvementResponsible: z.string().min(1, 'Sorumlu kişi zorunludur'),
  targetDate: z.string().min(1, 'Hedef tarih zorunludur'),
  affectedPersons: z.array(z.string()).default([]),
  otherAffectedPersons: z.string().optional(),
  currentStateImages: z.array(z.string()).default([]),
  // İyileştirme sonrası alanları
  improvementProbability: z.number().refine(val => [0.2, 0.5, 1, 3, 6, 10].includes(val)).optional(),
  improvementFrequency: z.number().refine(val => [0.5, 1, 2, 3, 6, 10].includes(val)).optional(),
  improvementSeverity: z.number().refine(val => [1, 3, 7, 15, 40, 100].includes(val)).optional(),
  effectivenessMeasurement: z.string().optional(),
  result: z.string().optional(),
  relatedRegulation: z.string().optional(),
});

type CreateRiskAssessmentForm = z.infer<typeof createRiskAssessmentSchema>;

export default function CreateRiskAssessmentPage() {
  const [, params] = useRoute('/risk-assessment/create/:departmentId');
  const departmentId = params?.departmentId;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [calculatedRisk, setCalculatedRisk] = useState<{
    score: number;
    level: string;
    color: string;
  } | null>(null);
  
  const [calculatedImprovementRisk, setCalculatedImprovementRisk] = useState<{
    score: number;
    level: string;
    color: string;
  } | null>(null);

  const form = useForm<CreateRiskAssessmentForm>({
    resolver: zodResolver(createRiskAssessmentSchema),
    defaultValues: {
      departmentId: departmentId || '',
      currentProbability: 1,
      currentFrequency: 1,
      currentSeverity: 1,
      affectedPersons: [],
      currentStateImages: [],
    },
  });

  // Fetch department info
  const { data: department } = useQuery<HospitalDepartment>({
    queryKey: ['/api/risk/hospital-departments', departmentId],
    queryFn: async () => {
      const response = await fetch(`/api/risk/hospital-departments`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch department');
      const departments = await response.json();
      return departments.find((d: HospitalDepartment) => d.id === departmentId);
    },
    enabled: !!departmentId,
  });

  // Fetch risk categories
  const { data: categories } = useQuery<RiskCategory[]>({
    queryKey: ['/api/risk/categories'],
  });

  // Fetch sub-categories based on selected category
  const selectedCategoryId = form.watch('categoryId');
  const { data: subCategories } = useQuery<RiskSubCategory[]>({
    queryKey: ['/api/risk/sub-categories', selectedCategoryId],
    queryFn: async () => {
      if (!selectedCategoryId) return [];
      const response = await fetch(`/api/risk/sub-categories?categoryId=${selectedCategoryId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch sub-categories');
      return response.json();
    },
    enabled: !!selectedCategoryId,
  });

  // Fetch Fine-Kinney values
  const { data: fineKinneyValues } = useQuery<FineKinneyValues>({
    queryKey: ['/api/risk/fine-kinney-values'],
  });

  // Watch risk factors for calculation
  const probability = form.watch('currentProbability');
  const frequency = form.watch('currentFrequency');
  const severity = form.watch('currentSeverity');
  
  // Watch improvement risk factors for calculation
  const improvementProbability = form.watch('improvementProbability');
  const improvementFrequency = form.watch('improvementFrequency');
  const improvementSeverity = form.watch('improvementSeverity');

  // Calculate current risk score and level
  useEffect(() => {
    const score = probability * frequency * severity;
    
    let level = '';
    let color = '';
    
    if (score >= 400) {
      level = 'Tolerans Gösterilemez Risk';
      color = '#7c2d12'; // brown-800
    } else if (score >= 200) {
      level = 'Yüksek Risk';
      color = '#dc2626'; // red-600
    } else if (score >= 70) {
      level = 'Önemli Risk';
      color = '#ea580c'; // orange-600
    } else if (score >= 20) {
      level = 'Olası Risk';
      color = '#ca8a04'; // yellow-600
    } else {
      level = 'Düşük Risk';
      color = '#16a34a'; // green-600
    }
    
    setCalculatedRisk({ score, level, color });
  }, [probability, frequency, severity]);

  // Calculate improvement risk score and level
  useEffect(() => {
    if (!improvementProbability || !improvementFrequency || !improvementSeverity) {
      setCalculatedImprovementRisk(null);
      return;
    }

    const score = improvementProbability * improvementFrequency * improvementSeverity;
    
    let level = '';
    let color = '';
    
    if (score >= 400) {
      level = 'Tolerans Gösterilemez Risk';
      color = '#7c2d12'; // brown-800
    } else if (score >= 200) {
      level = 'Yüksek Risk';
      color = '#dc2626'; // red-600
    } else if (score >= 70) {
      level = 'Önemli Risk';
      color = '#ea580c'; // orange-600
    } else if (score >= 20) {
      level = 'Olası Risk';
      color = '#ca8a04'; // yellow-600
    } else {
      level = 'Düşük Risk';
      color = '#16a34a'; // green-600
    }
    
    setCalculatedImprovementRisk({ score, level, color });
  }, [improvementProbability, improvementFrequency, improvementSeverity]);

  // Create risk assessment mutation
  const createMutation = useMutation({
    mutationFn: async (data: CreateRiskAssessmentForm) => {
      const payload = {
        ...data,
        locationId: user?.locationId || 'cc12b0d8-01d8-41b5-aba0-82754e4a5a1a', // Default locationId
        detectionDate: new Date().toISOString(),
        status: 'open',
        priority: 'medium'
      };
      return apiRequest('POST', '/api/risk/assessments', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/risk/assessments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/risk/stats'] });
      toast({
        title: 'Başarılı',
        description: 'Risk değerlendirmesi oluşturuldu',
      });
      setLocation(`/risk-assessment/department/${departmentId}`);
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: error.message || 'Risk değerlendirmesi oluşturulamadı',
      });
    },
  });

  const onSubmit = (data: CreateRiskAssessmentForm) => {
    createMutation.mutate(data);
  };

  if (!departmentId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold">Bölüm Bulunamadı</h2>
          <Link href="/risk-assessment">
            <Button className="mt-4" variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Geri Dön
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <Link href={`/risk-assessment/department/${departmentId}`}>
              <Button variant="ghost" size="sm" data-testid="button-back">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {department?.name}
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <AlertTriangle className="h-8 w-8 text-red-600" />
                Yeni Risk Değerlendirmesi
              </h1>
              <p className="text-gray-600 mt-2">
                Fine-Kinney metodolojisi ile risk değerlendirmesi oluşturun
              </p>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Basic Information Card */}
            <Card className="bg-white shadow-sm border border-gray-200">
              <CardHeader>
                <CardTitle>Temel Bilgiler</CardTitle>
                <CardDescription>Risk değerlendirmesi için temel bilgileri girin</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Risk Kategorisi *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-category">
                            <SelectValue placeholder="Kategori seçin..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories?.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedCategoryId && subCategories && subCategories.length > 0 && (
                  <FormField
                    control={form.control}
                    name="subCategoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Alt Kategori</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-subcategory">
                              <SelectValue placeholder="Alt kategori seçin..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {subCategories.map((subCat) => (
                              <SelectItem key={subCat.id} value={subCat.id}>
                                {subCat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="area"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alan *</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Örn: Ameliyathane 3, Acil Müdahale Odası"
                          data-testid="input-area"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="activity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Faaliyet *</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Örn: Cerrahi operasyon, hasta nakli"
                          data-testid="input-activity"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Risk Details Card */}
            <Card className="bg-white shadow-sm border border-gray-200">
              <CardHeader>
                <CardTitle>Risk Detayları</CardTitle>
                <CardDescription>Tehlike ve risk durumunu detaylı tanımlayın</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="hazard"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tehlike *</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Tehlike durumunu tanımlayın..."
                            rows={3}
                            data-testid="input-hazard"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="risk"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Risk *</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Risk durumunu tanımlayın..."
                            rows={3}
                            data-testid="input-risk"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="potentialConsequence"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Potansiyel Sonuç *</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Riskin potansiyel sonuçlarını açıklayın..."
                          rows={2}
                          data-testid="input-potential-consequence"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="currentStateDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mevcut Durum Açıklaması *</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Mevcut durumu detaylı açıklayın..."
                          rows={3}
                          data-testid="input-current-state"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Affected Persons Card */}
            <Card className="bg-white shadow-sm border border-gray-200">
              <CardHeader>
                <CardTitle>Etkilenecek Kişiler</CardTitle>
                <CardDescription>Risk durumundan etkilenebilecek kişi gruplarını belirtin</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="affectedPersons"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Etkilenecek Kişi Grupları</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          value={field.value?.join(', ') || ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            field.onChange(value ? value.split(',').map(s => s.trim()) : []);
                          }}
                          placeholder="Örn: Hemşireler, Doktorlar, Hasta yakınları..."
                          data-testid="input-affected-persons"
                        />
                      </FormControl>
                      <p className="text-xs text-gray-500">Virgülle ayırarak birden fazla grup ekleyebilirsiniz</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="otherAffectedPersons"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Diğer Etkilenecek Kişiler</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Diğer etkilenebilecek kişiler ve özel durumlar..."
                          rows={2}
                          data-testid="input-other-affected-persons"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Photo Upload Card */}
            <Card className="bg-white shadow-sm border border-gray-200">
              <CardHeader>
                <CardTitle>Fotoğraflar</CardTitle>
                <CardDescription>Mevcut durumu gösteren fotoğrafları yükleyin</CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="currentStateImages"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mevcut Durum Fotoğrafları</FormLabel>
                      <FormControl>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                          <div className="space-y-2">
                            <div className="text-gray-400">
                              <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </div>
                            <div className="text-gray-600">
                              <p className="text-sm">Fotoğraf yükleme özelliği yakında eklenecek</p>
                              <p className="text-xs text-gray-400">Şimdilik bu alan boş bırakılabilir</p>
                            </div>
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Current Risk Assessment Card */}
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-blue-600" />
                  Mevcut Risk Skoru
                </CardTitle>
                <CardDescription>
                  Olasılık × Sıklık × Şiddet = Risk Skoru
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="currentProbability"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Olasılık *</FormLabel>
                      <Select onValueChange={(value) => field.onChange(Number(value))}>
                        <FormControl>
                          <SelectTrigger data-testid="select-probability">
                            <SelectValue placeholder="Seçin..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {fineKinneyValues?.probability.map((item) => (
                            <SelectItem key={item.value} value={item.value.toString()}>
                              {item.value} - {item.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="currentFrequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sıklık *</FormLabel>
                      <Select onValueChange={(value) => field.onChange(Number(value))}>
                        <FormControl>
                          <SelectTrigger data-testid="select-frequency">
                            <SelectValue placeholder="Seçin..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {fineKinneyValues?.frequency.map((item) => (
                            <SelectItem key={item.value} value={item.value.toString()}>
                              {item.value} - {item.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="currentSeverity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Şiddet *</FormLabel>
                      <Select onValueChange={(value) => field.onChange(Number(value))}>
                        <FormControl>
                          <SelectTrigger data-testid="select-severity">
                            <SelectValue placeholder="Seçin..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {fineKinneyValues?.severity.map((item) => (
                            <SelectItem key={item.value} value={item.value.toString()}>
                              {item.value} - {item.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Risk Calculation Result */}
                {calculatedRisk && (
                  <div className="md:col-span-3">
                    <div className="mt-4 p-4 bg-white rounded-lg border">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Hesaplanan Risk Skoru</p>
                          <p className="text-3xl font-bold" data-testid="calculated-risk-score">
                            {calculatedRisk.score.toFixed(0)}
                          </p>
                        </div>
                        <Badge 
                          style={{ backgroundColor: calculatedRisk.color }}
                          className="text-white text-lg px-4 py-2"
                          data-testid="calculated-risk-level"
                        >
                          {calculatedRisk.level}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Improvement Plan Card */}
            <Card className="bg-white shadow-sm border border-gray-200">
              <CardHeader>
                <CardTitle>İyileştirme Planı</CardTitle>
                <CardDescription>Risk azaltma için alınacak önlemler</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="improvementMeasures"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>İyileştirme Önlemleri *</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Alınacak önlemleri detaylı yazın..."
                          rows={4}
                          data-testid="input-improvement-measures"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="improvementResponsible"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sorumlu Kişi *</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="Sorumlu kişi adı ve ünvanı"
                            data-testid="input-improvement-responsible"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="targetDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hedef Tarih *</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="date"
                            data-testid="input-target-date"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Effectiveness and Results Card - Moved After Improvement Plan */}
            <Card className="bg-white shadow-sm border border-gray-200">
              <CardHeader>
                <CardTitle>İyileştirme Etkinlik Ölçümü ve Sonuç</CardTitle>
                <CardDescription>İyileştirme önlemlerinin etkinliği ve sonuçları</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="effectivenessMeasurement"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>İyileştirme Etkinlik Ölçümü</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="İyileştirme önlemlerinin etkinliğini nasıl ölçeceğinizi açıklayın..."
                          rows={3}
                          data-testid="input-effectiveness-measurement"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="result"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sonuç</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="İyileştirme çalışmalarının genel sonuçlarını açıklayın..."
                          rows={3}
                          data-testid="input-result"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Second Photo Upload - After Improvement */}
                <FormField
                  control={form.control}
                  name="currentStateImages"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>İyileştirme Sonrası Fotoğrafları</FormLabel>
                      <FormControl>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                          <div className="space-y-2">
                            <div className="text-gray-400">
                              <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </div>
                            <div className="text-gray-600">
                              <p className="text-sm">İyileştirme sonrası fotoğraf yükleme özelliği yakında eklenecek</p>
                              <p className="text-xs text-gray-400">Şimdilik bu alan boş bırakılabilir</p>
                            </div>
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="relatedRegulation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>İlgili Mevzuat</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="İlgili kanun, yönetmelik, tebliğ ve standartları belirtin..."
                          rows={2}
                          data-testid="input-related-regulation"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Improvement Post-Assessment Card - Moved After Effectiveness */}
            <Card className="bg-green-50 border-green-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-green-600" />
                  İyileştirme Sonrası Risk Skoru
                </CardTitle>
                <CardDescription>
                  İyileştirme önlemleri uygulandıktan sonraki beklenen risk seviyesi
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="improvementProbability"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>İyileştirilmiş Olasılık</FormLabel>
                      <Select onValueChange={(value) => field.onChange(value ? Number(value) : undefined)}>
                        <FormControl>
                          <SelectTrigger data-testid="select-improvement-probability">
                            <SelectValue placeholder="Seçin..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {fineKinneyValues?.probability.map((item) => (
                            <SelectItem key={item.value} value={item.value.toString()}>
                              {item.value} - {item.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="improvementFrequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>İyileştirilmiş Sıklık</FormLabel>
                      <Select onValueChange={(value) => field.onChange(value ? Number(value) : undefined)}>
                        <FormControl>
                          <SelectTrigger data-testid="select-improvement-frequency">
                            <SelectValue placeholder="Seçin..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {fineKinneyValues?.frequency.map((item) => (
                            <SelectItem key={item.value} value={item.value.toString()}>
                              {item.value} - {item.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="improvementSeverity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>İyileştirilmiş Şiddet</FormLabel>
                      <Select onValueChange={(value) => field.onChange(value ? Number(value) : undefined)}>
                        <FormControl>
                          <SelectTrigger data-testid="select-improvement-severity">
                            <SelectValue placeholder="Seçin..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {fineKinneyValues?.severity.map((item) => (
                            <SelectItem key={item.value} value={item.value.toString()}>
                              {item.value} - {item.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Improvement Risk Calculation Result */}
                {calculatedImprovementRisk && (
                  <div className="md:col-span-3">
                    <div className="mt-4 p-4 bg-white rounded-lg border">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Hesaplanan İyileştirilmiş Risk Skoru</p>
                          <p className="text-3xl font-bold" data-testid="calculated-improvement-risk-score">
                            {calculatedImprovementRisk.score.toFixed(0)}
                          </p>
                        </div>
                        <Badge 
                          style={{ backgroundColor: calculatedImprovementRisk.color }}
                          className="text-white text-lg px-4 py-2"
                          data-testid="calculated-improvement-risk-level"
                        >
                          {calculatedImprovementRisk.level}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 pb-8">
              <Link href={`/risk-assessment/department/${departmentId}`}>
                <Button variant="outline" data-testid="button-cancel">
                  İptal
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="bg-red-600 hover:bg-red-700 text-white min-w-32"
                data-testid="button-submit"
              >
                {createMutation.isPending ? (
                  'Kaydediliyor...'
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Kaydet
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}