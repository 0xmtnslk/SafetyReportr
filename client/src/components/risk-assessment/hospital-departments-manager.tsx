import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  Building2, 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  Shield 
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface HospitalDepartment {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  isActive: boolean;
  orderIndex: number;
  createdAt: string;
}

interface DepartmentRiskStats {
  totalAssessments: number;
  avgRiskScore: number;
  riskDistribution: { level: string; count: number }[];
}

const departmentSchema = z.object({
  name: z.string().min(1, 'Bölüm adı zorunludur'),
  description: z.string().optional(),
});

type DepartmentForm = z.infer<typeof departmentSchema>;

const DepartmentStatsCard = ({ departmentId }: { departmentId: string }) => {
  const { data: stats, isLoading } = useQuery<DepartmentRiskStats>({
    queryKey: ['/api/risk/departments', departmentId, 'stats'],
    enabled: !!departmentId,
  });

  if (isLoading) {
    return (
      <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-3 bg-gray-200 rounded w-3/4 mt-1"></div>
        </div>
      </div>
    );
  }

  if (!stats || stats.totalAssessments === 0) {
    return (
      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="text-xs text-gray-500 text-center">
          Henüz risk değerlendirmesi yok
        </div>
      </div>
    );
  }

  const highRiskCount = stats.riskDistribution.find(r => r.level === 'Yüksek Risk')?.count || 0;
  const criticalRiskCount = stats.riskDistribution.find(r => r.level === 'Tolerans Gösterilemez Risk')?.count || 0;

  return (
    <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-xs font-medium text-gray-600">Risk Maddeleri</span>
        <Badge variant="secondary" className="text-xs">
          {stats.totalAssessments}
        </Badge>
      </div>
      
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-500">Ortalama Skor</span>
        <span className="text-xs font-medium text-gray-700">
          {stats.avgRiskScore.toFixed(1)}
        </span>
      </div>

      {(highRiskCount > 0 || criticalRiskCount > 0) && (
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">Yüksek Risk</span>
          <div className="flex gap-1">
            {criticalRiskCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {criticalRiskCount} Kritik
              </Badge>
            )}
            {highRiskCount > 0 && (
              <Badge className="bg-red-500 hover:bg-red-600 text-white text-xs">
                {highRiskCount}
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default function HospitalDepartmentsManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<HospitalDepartment | null>(null);

  const form = useForm<DepartmentForm>({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  // Fetch hospital departments
  const { data: departments, isLoading } = useQuery<HospitalDepartment[]>({
    queryKey: ['/api/risk/hospital-departments'],
  });

  // Create department mutation
  const createMutation = useMutation({
    mutationFn: async (data: DepartmentForm) => {
      return apiRequest('POST', '/api/risk/hospital-departments', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/risk/hospital-departments'] });
      toast({
        title: 'Başarılı',
        description: 'Hastane bölümü oluşturuldu',
      });
      form.reset();
      setShowCreateDialog(false);
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: error.message || 'Bölüm oluşturulamadı',
      });
    },
  });

  // Update department mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: DepartmentForm }) => {
      return apiRequest('PUT', `/api/risk/hospital-departments/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/risk/hospital-departments'] });
      toast({
        title: 'Başarılı',
        description: 'Hastane bölümü güncellendi',
      });
      form.reset();
      setEditingDepartment(null);
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: error.message || 'Bölüm güncellenemedi',
      });
    },
  });

  // Toggle department active status mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ departmentId, isActive }: { departmentId: string; isActive: boolean }) => {
      return apiRequest('PUT', `/api/risk/hospital-departments/${departmentId}/toggle`, { isActive });
    },
    onSuccess: (_, { isActive }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/risk/hospital-departments'] });
      toast({
        title: 'Başarılı',
        description: isActive ? 'Bölüm aktifleştirildi' : 'Bölüm devre dışı bırakıldı',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: error.message || 'Bölüm durumu değiştirilemedi',
      });
    },
  });

  const handleEdit = (department: HospitalDepartment) => {
    setEditingDepartment(department);
    form.setValue('name', department.name);
    form.setValue('description', department.description || '');
  };

  const handleSubmit = (data: DepartmentForm) => {
    if (editingDepartment) {
      updateMutation.mutate({ id: editingDepartment.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleCancel = () => {
    form.reset();
    setEditingDepartment(null);
    setShowCreateDialog(false);
  };

  if (isLoading) {
    return (
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardContent className="p-6">
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              Hastane Bölümleri Yönetimi
              {departments && (
                <Badge variant="secondary" className="ml-2">
                  {departments.length}
                </Badge>
              )}
            </CardTitle>
            
            <Dialog open={showCreateDialog || !!editingDepartment} onOpenChange={(open) => {
              if (!open) handleCancel();
              else setShowCreateDialog(true);
            }}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  data-testid="button-add-department"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Yeni Bölüm Ekle
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingDepartment ? 'Bölüm Düzenle' : 'Yeni Bölüm Ekle'}
                  </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bölüm Adı *</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="Örn: Acil Tıp, Kardiyoloji..."
                              data-testid="input-department-name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Açıklama</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder="Bölüm hakkında kısa açıklama..."
                              rows={3}
                              data-testid="input-department-description"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end space-x-4 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancel}
                        data-testid="button-cancel-department"
                      >
                        İptal
                      </Button>
                      <Button
                        type="submit"
                        disabled={createMutation.isPending || updateMutation.isPending}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        data-testid="button-save-department"
                      >
                        {createMutation.isPending || updateMutation.isPending
                          ? 'Kaydediliyor...'
                          : editingDepartment ? 'Güncelle' : 'Oluştur'
                        }
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent>
          {!departments || departments.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Henüz hastane bölümü yok
              </h3>
              <p className="text-gray-500 mb-6">
                Risk değerlendirmesi yapabilmek için önce hastane bölümlerini tanımlayın.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {departments.map((department) => (
                <Link 
                  key={department.id} 
                  href={`/risk-assessment/department/${department.id}`}
                >
                  <Card 
                    className="bg-gray-50 border border-gray-200 hover:shadow-lg hover:border-blue-300 transition-all duration-200 cursor-pointer group"
                    data-testid={`department-card-${department.id}`}
                  >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {department.name}
                          {department.isDefault && (
                            <Shield className="h-4 w-4 text-blue-500" title="Varsayılan bölüm" />
                          )}
                        </CardTitle>
                        {department.description && (
                          <p className="text-sm text-gray-600 mt-1">
                            {department.description}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1 ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleEdit(department);
                          }}
                          data-testid={`button-edit-department-${department.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                              }}
                              data-testid={`button-toggle-department-${department.id}`}
                            >
                              <Trash2 className={`h-4 w-4 ${department.isActive ? 'text-red-500' : 'text-green-500'}`} />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                {department.isActive ? 'Bölümü Devre Dışı Bırak' : 'Bölümü Aktifleştir'}
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                "{department.name}" bölümünü {department.isActive ? 'devre dışı bırakmak' : 'aktifleştirmek'} istediğinizden emin misiniz?
                                {department.isActive && ' Bu bölüm risk değerlendirmesi sayfasında görünmeyecektir.'}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>İptal</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => toggleActiveMutation.mutate({ departmentId: department.id, isActive: !department.isActive })}
                                className={department.isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
                                data-testid={`button-confirm-toggle-${department.id}`}
                              >
                                {department.isActive ? 'Devre Dışı Bırak' : 'Aktifleştir'}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Users className="h-4 w-4" />
                        <span>Risk değerlendirmesi için hazır</span>
                      </div>
                      
                      <Badge 
                        variant={department.isActive ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {department.isActive ? 'Aktif' : 'Pasif'}
                      </Badge>
                    </div>

                    {/* Department Stats */}
                    <DepartmentStatsCard departmentId={department.id} />

                    {/* Click hint */}
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Risk maddeleri için tıklayın</span>
                        <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
                          Bölüme Git →
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Bölüm Yönetimi Hakkında</h4>
              <p className="text-sm text-blue-700 mt-1">
                • Varsayılan bölümler sistemle birlikte gelir ve silinmez<br />
                • Her bölüm için risk değerlendirmeleri yapabilirsiniz<br />
                • Özel bölümler ekleyerek ihtiyaçlarınıza göre özelleştirebilirsiniz
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}