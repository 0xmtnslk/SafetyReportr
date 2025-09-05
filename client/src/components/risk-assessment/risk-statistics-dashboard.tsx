import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  FileText,
  Building2,
  Users,
  Calculator
} from 'lucide-react';

interface RiskAssessmentStats {
  totalAssessments: number;
  openAssessments: number;
  inProgressAssessments: number;
  completedAssessments: number;
  highRiskAssessments: number;
  mediumRiskAssessments: number;
  lowRiskAssessments: number;
  avgRiskScore: number;
}

interface HospitalDepartment {
  id: string;
  name: string;
}

interface DepartmentRiskStats {
  totalAssessments: number;
  avgRiskScore: number;
  riskDistribution: { level: string; count: number }[];
}

export default function RiskStatisticsDashboard() {
  // Fetch risk assessment statistics
  const { data: stats, isLoading: statsLoading } = useQuery<RiskAssessmentStats>({
    queryKey: ['/api/risk/stats'],
  });

  // Fetch hospital departments
  const { data: departments } = useQuery<HospitalDepartment[]>({
    queryKey: ['/api/risk/hospital-departments'],
  });

  // Prepare chart data
  const statusData = stats ? [
    { name: 'Açık', value: stats.openAssessments, color: '#eab308' },
    { name: 'Devam Eden', value: stats.inProgressAssessments, color: '#3b82f6' },
    { name: 'Tamamlandı', value: stats.completedAssessments, color: '#10b981' },
  ].filter(item => item.value > 0) : [];

  const riskLevelData = stats ? [
    { name: 'Düşük Risk', value: stats.lowRiskAssessments, color: '#10b981' },
    { name: 'Orta Risk', value: stats.mediumRiskAssessments, color: '#f59e0b' },
    { name: 'Yüksek Risk', value: stats.highRiskAssessments, color: '#ef4444' },
  ].filter(item => item.value > 0) : [];

  if (statsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-white shadow-sm border border-gray-200">
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardContent className="p-6">
          <div className="text-center py-12">
            <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              İstatistik Verisi Bulunamadı
            </h3>
            <p className="text-gray-500">
              Risk değerlendirme istatistikleri yüklenemedi.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-blue-100">Toplam Değerlendirme</CardTitle>
            <FileText className="h-4 w-4 text-blue-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAssessments}</div>
            <p className="text-xs text-blue-200">
              Risk değerlendirme sayısı
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-red-100">Yüksek Risk</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.highRiskAssessments}</div>
            <p className="text-xs text-red-200">
              Acil müdahale gerektiren
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-green-100">Tamamlandı</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedAssessments}</div>
            <p className="text-xs text-green-200">
              Çözümlenmiş riskler
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-purple-100">Ortalama Skor</CardTitle>
            <Calculator className="h-4 w-4 text-purple-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgRiskScore.toFixed(1)}</div>
            <p className="text-xs text-purple-200">
              Fine-Kinney skoru
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Indicators */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white shadow-sm border border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Risk Yönetimi İlerleme Durumu
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Tamamlanma Oranı</span>
                <span>{stats.totalAssessments > 0 ? Math.round((stats.completedAssessments / stats.totalAssessments) * 100) : 0}%</span>
              </div>
              <Progress 
                value={stats.totalAssessments > 0 ? (stats.completedAssessments / stats.totalAssessments) * 100 : 0} 
                className="h-2"
              />
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Yüksek Risk Oranı</span>
                <span className="text-red-600">
                  {stats.totalAssessments > 0 ? Math.round((stats.highRiskAssessments / stats.totalAssessments) * 100) : 0}%
                </span>
              </div>
              <Progress 
                value={stats.totalAssessments > 0 ? (stats.highRiskAssessments / stats.totalAssessments) * 100 : 0} 
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-green-600" />
              Sistem Durumu
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium">Aktif Bölümler</span>
              </div>
              <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
                {departments?.length || 0}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium">API Bağlantısı</span>
              </div>
              <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200">
                Aktif
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      {stats.totalAssessments > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status Distribution Chart */}
          {statusData.length > 0 && (
            <Card className="bg-white shadow-sm border border-gray-200">
              <CardHeader>
                <CardTitle>Durum Dağılımı</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Risk Level Distribution */}
          {riskLevelData.length > 0 && (
            <Card className="bg-white shadow-sm border border-gray-200">
              <CardHeader>
                <CardTitle>Risk Seviyesi Dağılımı</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={riskLevelData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8">
                      {riskLevelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* No Data State */}
      {stats.totalAssessments === 0 && (
        <Card className="bg-white shadow-sm border border-gray-200">
          <CardContent className="p-12">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Henüz Risk Değerlendirmesi Yok
              </h3>
              <p className="text-gray-500 mb-6">
                İlk risk değerlendirmenizi oluşturduğunuzda burada istatistikler görünecek.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}