import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, AlertTriangle, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: stats = {}, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stats"],
  });

  const { data: recentReports = [], isLoading: reportsLoading } = useQuery({
    queryKey: ["/api/reports"],
  });

  if (statsLoading || reportsLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const recentReportsData = Array.isArray(recentReports) ? recentReports.slice(0, 5) : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Hoş Geldiniz{user?.fullName ? `, ${user.fullName}` : ""}
        </h2>
        <p className="text-gray-600">
          İş sağlığı ve güvenliği raporlarınızı burada yönetebilirsiniz.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="bg-primary bg-opacity-10 p-3 rounded-xl">
                <FileText className="text-primary text-xl" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Toplam Rapor</p>
                <p className="text-2xl font-bold text-gray-900" data-testid="stat-total-reports">
                  {(stats as any)?.totalReports || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="bg-danger bg-opacity-10 p-3 rounded-xl">
                <AlertTriangle className="text-danger text-xl" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Yüksek Risk</p>
                <p className="text-2xl font-bold text-gray-900" data-testid="stat-high-risk">
                  {(stats as any)?.highRiskFindings || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="bg-success bg-opacity-10 p-3 rounded-xl">
                <CheckCircle className="text-success text-xl" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tamamlanan</p>
                <p className="text-2xl font-bold text-gray-900" data-testid="stat-completed">
                  {(stats as any)?.completedReports || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Son Raporlar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentReportsData.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                Henüz rapor bulunmuyor. İlk raporunuzu oluşturun.
              </p>
            ) : (
              recentReportsData.map((report: any) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer"
                  data-testid={`report-item-${report.id}`}
                  onClick={() => setLocation(`/edit-report/${report.id}`)}
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-primary bg-opacity-10 rounded-xl flex items-center justify-center mr-3">
                      <FileText className="text-primary" size={20} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        Rapor #{report.reportNumber}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(report.reportDate).toLocaleDateString("tr-TR")} - {report.reporter}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        report.status === "completed"
                          ? "bg-success bg-opacity-10 text-success"
                          : report.status === "in_progress"
                          ? "bg-warning bg-opacity-10 text-warning"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {report.status === "completed"
                        ? "Tamamlandı"
                        : report.status === "in_progress"
                        ? "Devam Ediyor"
                        : "Taslak"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
