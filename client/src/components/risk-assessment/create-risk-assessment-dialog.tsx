import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Calculator, AlertTriangle, Info } from 'lucide-react';

interface HospitalDepartment {
  id: string;
  name: string;
  description?: string;
}

interface RiskCategory {
  id: string;
  name: string;
  description?: string;
}

interface RiskSubCategory {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
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
  categoryId: z.string().optional(),
  subCategoryId: z.string().optional(),
  hazardDescription: z.string().min(1, 'Tehlike tanımı zorunludur'),
  riskSituation: z.string().min(1, 'Risk durumu açıklaması zorunludur'),
  currentProbability: z.number().min(0.2).max(10),
  currentFrequency: z.number().min(0.5).max(10),
  currentSeverity: z.number().min(1).max(100),
  affectedPersons: z.string().optional(),
  existingControls: z.string().optional(),
});

type CreateRiskAssessmentForm = z.infer<typeof createRiskAssessmentSchema>;

interface CreateRiskAssessmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateRiskAssessmentDialog({
  open,
  onOpenChange,
}: CreateRiskAssessmentDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [calculatedRisk, setCalculatedRisk] = useState<{
    score: number;
    level: string;
    color: string;
  } | null>(null);

  const form = useForm<CreateRiskAssessmentForm>({
    resolver: zodResolver(createRiskAssessmentSchema),
    defaultValues: {
      currentProbability: 1,
      currentFrequency: 1,
      currentSeverity: 1,
    },
  });

  // Fetch hospital departments
  const { data: departments } = useQuery<HospitalDepartment[]>({
    queryKey: ['/api/risk/hospital-departments'],
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

  // Calculate risk score and level
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

  // Create risk assessment mutation
  const createMutation = useMutation({
    mutationFn: async (data: CreateRiskAssessmentForm) => {
      return apiRequest('POST', '/api/risk/assessments', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/risk/assessments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/risk/stats'] });
      toast({
        title: 'Başarılı',
        description: 'Risk değerlendirmesi oluşturuldu',
      });
      form.reset();
      onOpenChange(false);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Yeni Risk Değerlendirmesi
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="departmentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bölüm *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-department">
                            <SelectValue placeholder="Bölüm seçin..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {departments?.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id}>
                              {dept.name}
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
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Risk Kategorisi</FormLabel>
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

                {selectedCategoryId && (
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
                            {subCategories?.map((subCat) => (
                              <SelectItem key={subCat.id} value={subCat.id}>
                                {subCat.name}
                              </SelectItem>
                            ))}
                            {(!subCategories || subCategories.length === 0) && (
                              <div className="px-2 py-1 text-sm text-gray-500">
                                Alt kategori yükleniyor...
                              </div>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="hazardDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tehlike Tanımı *</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Tehlike durumunu detaylı olarak tanımlayın..."
                          rows={3}
                          data-testid="input-hazard-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="riskSituation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Risk Durumu *</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Risk durumunu ve potansiyel sonuçlarını açıklayın..."
                          rows={3}
                          data-testid="input-risk-situation"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Fine-Kinney Assessment */}
              <div className="space-y-4">
                <Card className="bg-blue-50 border-blue-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calculator className="h-5 w-5 text-blue-600" />
                      Fine-Kinney Risk Değerlendirmesi
                    </CardTitle>
                    <CardDescription>
                      Olasılık × Sıklık × Şiddet = Risk Skoru
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="currentProbability"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Olasılık (0.2 - 10)</FormLabel>
                          <Select onValueChange={(value) => field.onChange(Number(value))}>
                            <FormControl>
                              <SelectTrigger data-testid="select-probability">
                                <SelectValue placeholder="Olasılık seçin..." />
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
                          <FormLabel>Sıklık (0.5 - 10)</FormLabel>
                          <Select onValueChange={(value) => field.onChange(Number(value))}>
                            <FormControl>
                              <SelectTrigger data-testid="select-frequency">
                                <SelectValue placeholder="Sıklık seçin..." />
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
                          <FormLabel>Şiddet (1 - 100)</FormLabel>
                          <Select onValueChange={(value) => field.onChange(Number(value))}>
                            <FormControl>
                              <SelectTrigger data-testid="select-severity">
                                <SelectValue placeholder="Şiddet seçin..." />
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
                      <div className="mt-4 p-4 bg-white rounded-lg border">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">Risk Skoru</p>
                            <p className="text-2xl font-bold" data-testid="calculated-risk-score">
                              {calculatedRisk.score.toFixed(0)}
                            </p>
                          </div>
                          <Badge 
                            style={{ backgroundColor: calculatedRisk.color }}
                            className="text-white"
                            data-testid="calculated-risk-level"
                          >
                            {calculatedRisk.level}
                          </Badge>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Additional Information */}
                <FormField
                  control={form.control}
                  name="affectedPersons"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Etkilenen Kişiler</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Riskten etkilenecek kişi/grup/departman..."
                          rows={2}
                          data-testid="input-affected-persons"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="existingControls"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mevcut Kontroller</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Mevcut risk kontrol önlemleri..."
                          rows={2}
                          data-testid="input-existing-controls"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel"
              >
                İptal
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="bg-red-600 hover:bg-red-700 text-white"
                data-testid="button-submit"
              >
                {createMutation.isPending ? 'Oluşturuluyor...' : 'Risk Değerlendirmesi Oluştur'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}