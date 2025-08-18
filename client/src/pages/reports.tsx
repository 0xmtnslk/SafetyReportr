import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Download, Plus, FileText, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";
import { downloadReportPDF } from "@/lib/pdfGenerator";

export default function Reports() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [filters, setFilters] = useState({
    status: "all",
    riskLevel: "all",
    startDate: "",
    endDate: "",
  });

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["/api/reports"],
  });

  const handleExportPDF = async (report: any) => {
    try {
      toast({
        title: "PDF Oluşturuluyor",
        description: "Rapor PDF olarak hazırlanıyor...",
      });

      // Fetch findings for the report
      const findingsResponse = await fetch(`/api/reports/${report.id}/findings`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const findings = await findingsResponse.json();

      // Transform report data for PDF generator
      const reportData = {
        id: report.id,
        reportNumber: report.reportNumber,
        reportDate: report.reportDate,
        projectLocation: report.projectLocation,
        reporter: report.reporter,
        managementSummary: report.managementSummary,
        generalEvaluation: report.generalEvaluation,
        findings: findings || []
      };

      downloadReportPDF(reportData);
      
      toast({
        title: "PDF İndirildi",
        description: "Rapor başarıyla PDF olarak indirildi.",
      });
    } catch (error) {
      console.error('PDF export error:', error);
      toast({
        title: "Hata",
        description: "PDF oluşturulurken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const filteredReports = Array.isArray(reports) ? reports.filter((report: any) => {
    if (filters.status !== "all" && report.status !== filters.status) return false;
    if (filters.startDate && new Date(report.reportDate) < new Date(filters.startDate)) return false;
    if (filters.endDate && new Date(report.reportDate) > new Date(filters.endDate)) return false;
    return true;
  }) : [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-success bg-opacity-10 text-success";
      case "in_progress":
        return "bg-warning bg-opacity-10 text-warning";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Tamamlandı";
      case "in_progress":
        return "Devam Ediyor";
      default:
        return "Taslak";
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 sm:mb-0">
          Tüm Raporlar
        </h2>
        <div className="flex space-x-3">
          <Button variant="outline" data-testid="button-export">
            <Download className="mr-2" size={16} />
            Dışa Aktar
          </Button>
          <Button onClick={() => setLocation("/create-report")} data-testid="button-new-report">
            <Plus className="mr-2" size={16} />
            Yeni Rapor
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Duruma Göre Filtrele</Label>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters({ ...filters, status: value })}
              >
                <SelectTrigger data-testid="filter-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  <SelectItem value="in_progress">Devam Ediyor</SelectItem>
                  <SelectItem value="completed">Tamamlandı</SelectItem>
                  <SelectItem value="draft">Taslak</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Risk Seviyesi</Label>
              <Select
                value={filters.riskLevel}
                onValueChange={(value) => setFilters({ ...filters, riskLevel: value })}
              >
                <SelectTrigger data-testid="filter-risk">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  <SelectItem value="high">Yüksek Risk</SelectItem>
                  <SelectItem value="medium">Orta Risk</SelectItem>
                  <SelectItem value="low">Düşük Risk</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">Başlangıç Tarihi</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                data-testid="filter-start-date"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">Bitiş Tarihi</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                data-testid="filter-end-date"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredReports.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <FileText className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Rapor Bulunamadı
            </h3>
            <p className="text-gray-500 mb-6">
              Seçili filtrelere uygun rapor bulunmuyor.
            </p>
            <Button onClick={() => setLocation("/create-report")}>
              <Plus className="mr-2" size={16} />
              İlk Raporunuzu Oluşturun
            </Button>
          </div>
        ) : (
          filteredReports.map((report: any) => (
            <Card
              key={report.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              data-testid={`report-card-${report.id}`}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-gray-500">
                    Rapor #{report.reportNumber}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                      report.status
                    )}`}
                  >
                    {getStatusText(report.status)}
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {report.projectLocation}
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  {new Date(report.reportDate).toLocaleDateString("tr-TR")} - {report.reporter}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-danger rounded-full mr-2"></div>
                      <span className="text-sm text-gray-600">{report.highRiskCount || 0} Yüksek</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-warning rounded-full mr-2"></div>
                      <span className="text-sm text-gray-600">{report.mediumRiskCount || 0} Orta</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-success rounded-full mr-2"></div>
                      <span className="text-sm text-gray-600">{report.lowRiskCount || 0} Düşük</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExportPDF(report);
                      }}
                      data-testid={`button-export-${report.id}`}
                    >
                      <Download size={14} />
                    </Button>
                    <ChevronRight className="text-gray-400" size={16} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
