import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, AlertTriangle, CheckCircle, Clock, TrendingUp, Users, Building2, FileText, Calculator, Shield } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import CreateRiskAssessmentDialog from '@/components/risk-assessment/create-risk-assessment-dialog';
import RiskStatisticsDashboard from '@/components/risk-assessment/risk-statistics-dashboard';
import HospitalDepartmentsManager from '@/components/risk-assessment/hospital-departments-manager';

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

export default function RiskAssessmentPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Fetch risk assessment statistics
  const { data: stats, isLoading: statsLoading } = useQuery<RiskAssessmentStats>({
    queryKey: ['/api/risk/stats'],
    enabled: !!user?.locationId,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Shield className="h-8 w-8 text-red-600" />
                Risk Değerlendirme
              </h1>
              <p className="text-gray-600 mt-2">
                Fine-Kinney metodolojisi ile kapsamlı risk değerlendirmesi ve yönetimi
              </p>
            </div>
            <Button 
              onClick={() => setShowCreateDialog(true)}
              className="bg-red-600 hover:bg-red-700 text-white"
              data-testid="button-create-assessment"
            >
              <Plus className="h-4 w-4 mr-2" />
              Yeni Risk Değerlendirmesi
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        {!statsLoading && stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white shadow-sm border border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Toplam Değerlendirme</CardTitle>
                <FileText className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900" data-testid="stat-total-assessments">
                  {stats.totalAssessments}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm border border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Ortalama Risk Skoru</CardTitle>
                <Calculator className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900" data-testid="stat-avg-risk-score">
                  {stats.avgRiskScore.toFixed(1)}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm border border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Yüksek Risk</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600" data-testid="stat-high-risk">
                  {stats.highRiskAssessments}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm border border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Tamamlanan</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600" data-testid="stat-completed">
                  {stats.completedAssessments}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-white border border-gray-200 rounded-lg p-1">
            <TabsTrigger 
              value="dashboard" 
              className="flex items-center gap-2 data-[state=active]:bg-red-50 data-[state=active]:text-red-600"
              data-testid="tab-dashboard"
            >
              <TrendingUp className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger 
              value="assessments" 
              className="flex items-center gap-2 data-[state=active]:bg-red-50 data-[state=active]:text-red-600"
              data-testid="tab-assessments"
            >
              <FileText className="h-4 w-4" />
              Değerlendirmeler
            </TabsTrigger>
            <TabsTrigger 
              value="departments" 
              className="flex items-center gap-2 data-[state=active]:bg-red-50 data-[state=active]:text-red-600"
              data-testid="tab-departments"
            >
              <Building2 className="h-4 w-4" />
              Bölümler
            </TabsTrigger>
            <TabsTrigger 
              value="reports" 
              className="flex items-center gap-2 data-[state=active]:bg-red-50 data-[state=active]:text-red-600"
              data-testid="tab-reports"
            >
              <Users className="h-4 w-4" />
              Raporlar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-6">
            <RiskStatisticsDashboard />
          </TabsContent>

          <TabsContent value="assessments" className="mt-6">
            <div className="space-y-6">
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Risk Değerlendirme Listesi
                </h3>
                <p className="text-gray-500">
                  Bu bölümde risk değerlendirmeleri listelenecek.
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="departments" className="mt-6">
            <HospitalDepartmentsManager />
          </TabsContent>

          <TabsContent value="reports" className="mt-6">
            <Card className="bg-white shadow-sm border border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-red-600" />
                  Risk Değerlendirme Raporları
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Raporlar Yakında Gelecek
                  </h3>
                  <p className="text-gray-500">
                    Risk değerlendirme raporları ve analizleri bu bölümde yer alacak.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Create Risk Assessment Dialog */}
        <CreateRiskAssessmentDialog 
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
        />
      </div>
    </div>
  );
}