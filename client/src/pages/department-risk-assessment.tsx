import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useRoute } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Plus, 
  ArrowLeft, 
  Search, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface HospitalDepartment {
  id: string;
  name: string;
  description?: string;
}

interface RiskAssessment {
  id: string;
  assessmentNumber: string;
  hazard: string;
  risk: string;
  currentRiskScore: number;
  currentRiskLevel: string;
  currentRiskColor: string;
  status: 'open' | 'in_progress' | 'completed';
  createdAt: string;
  updatedAt: string;
  categoryName?: string;
  subCategoryName?: string;
}

const StatusBadge = ({ status }: { status: string }) => {
  const configs = {
    open: { label: 'Açık', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    in_progress: { label: 'Devam Eden', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    completed: { label: 'Tamamlandı', color: 'bg-green-100 text-green-800 border-green-200' }
  };
  
  const config = configs[status as keyof typeof configs] || configs.open;
  
  return (
    <Badge variant="outline" className={config.color}>
      {config.label}
    </Badge>
  );
};

const RiskLevelBadge = ({ level, color, score }: { level: string, color: string, score: number }) => {
  return (
    <div className="flex items-center gap-2">
      <Badge 
        style={{ backgroundColor: color, color: 'white' }}
        className="text-xs font-medium"
      >
        {score}
      </Badge>
      <span className="text-sm text-gray-600">{level}</span>
    </div>
  );
};

export default function DepartmentRiskAssessmentPage() {
  const [, params] = useRoute('/risk-assessment/department/:id');
  const departmentId = params?.id;
  const [searchTerm, setSearchTerm] = useState('');

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

  // Fetch risk assessments for this department
  const { data: assessments, isLoading } = useQuery<RiskAssessment[]>({
    queryKey: ['/api/risk/assessments/department', departmentId],
    queryFn: async () => {
      const response = await fetch(`/api/risk/assessments?departmentId=${departmentId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch assessments');
      return response.json();
    },
    enabled: !!departmentId,
  });

  // Filter and sort assessments by risk score (highest first)
  const filteredAssessments = assessments
    ?.filter((assessment) => {
      if (!searchTerm) return true;
      return assessment.hazard.toLowerCase().includes(searchTerm.toLowerCase()) ||
             assessment.risk.toLowerCase().includes(searchTerm.toLowerCase());
    })
    .sort((a, b) => b.currentRiskScore - a.currentRiskScore);

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
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/risk-assessment">
                <Button variant="ghost" size="sm" data-testid="button-back">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Risk Değerlendirme
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  {department?.name || 'Bölüm'}
                </h1>
                <p className="text-gray-600 mt-2">
                  Risk değerlendirmesi maddeleri - En yüksek riskten en düşük riske sıralı
                </p>
              </div>
            </div>
            <Link href={`/risk-assessment/create/${departmentId}`}>
              <Button 
                className="bg-red-600 hover:bg-red-700 text-white"
                data-testid="button-add-assessment"
              >
                <Plus className="h-4 w-4 mr-2" />
                Yeni Risk Maddesi
              </Button>
            </Link>
          </div>
        </div>

        {/* Search and Stats */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Tehlike veya risk tanımında ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>
            {filteredAssessments && (
              <div className="flex gap-4 text-sm text-gray-600">
                <span><strong>{filteredAssessments.length}</strong> toplam madde</span>
                <span><strong>{filteredAssessments.filter(a => a.currentRiskScore >= 200).length}</strong> yüksek risk</span>
                <span><strong>{filteredAssessments.filter(a => a.status === 'completed').length}</strong> tamamlandı</span>
              </div>
            )}
          </div>
        </div>

        {/* Risk Assessments List */}
        <Card className="bg-white shadow-sm border border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Risk Değerlendirme Maddeleri
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-16 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : !filteredAssessments || filteredAssessments.length === 0 ? (
              <div className="text-center py-12">
                <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm ? 'Arama sonucu bulunamadı' : 'Henüz risk değerlendirmesi yok'}
                </h3>
                <p className="text-gray-500 mb-6">
                  {searchTerm ? 
                    'Farklı arama terimi deneyebilirsiniz.' :
                    'İlk risk değerlendirme maddesini oluşturmak için başlayın.'
                  }
                </p>
                {!searchTerm && (
                  <Link href={`/risk-assessment/create/${departmentId}`}>
                    <Button className="bg-red-600 hover:bg-red-700 text-white">
                      <Plus className="h-4 w-4 mr-2" />
                      İlk Risk Maddesi
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20">Sıra</TableHead>
                      <TableHead>Tehlike</TableHead>
                      <TableHead>Risk</TableHead>
                      <TableHead>Risk Kategorisi</TableHead>
                      <TableHead>Alt Risk Kategorisi</TableHead>
                      <TableHead>Risk Seviyesi</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead>Tarih</TableHead>
                      <TableHead className="text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAssessments.map((assessment, index) => (
                      <TableRow key={assessment.id} data-testid={`assessment-row-${assessment.id}`}>
                        <TableCell className="font-medium">
                          <Badge variant="outline" className="bg-gray-50">
                            {index + 1}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs">
                            <p className="text-sm font-medium text-gray-900 line-clamp-2">
                              {assessment.hazard}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs">
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {assessment.risk}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs">
                            <p className="text-sm text-gray-700">
                              {assessment.categoryName || '-'}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs">
                            <p className="text-sm text-gray-700">
                              {assessment.subCategoryName || '-'}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <RiskLevelBadge 
                            level={assessment.currentRiskLevel}
                            color={assessment.currentRiskColor}
                            score={assessment.currentRiskScore}
                          />
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={assessment.status} />
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-600">
                            {format(new Date(assessment.createdAt), 'dd MMM yyyy', { locale: tr })}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              data-testid={`button-view-${assessment.id}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              data-testid={`button-edit-${assessment.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              data-testid={`button-delete-${assessment.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}