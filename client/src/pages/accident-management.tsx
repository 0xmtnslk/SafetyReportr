import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { AlertTriangle, Activity, FileText, TrendingUp, Users, Clock, PlusCircle, Shield, Search } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { format, isSameMonth } from "date-fns";
import { tr } from "date-fns/locale";

export default function AccidentManagementPage() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch accident records
  const { data: accidentRecords = [], isLoading, isError } = useQuery({
    queryKey: ["/api/accident-records"],
    enabled: true
  });

  const handleNewAccidentReport = () => {
    setLocation("/accident-details");
  };

  const handleViewAccidentDetails = (recordId: string) => {
    setLocation(`/accident-details?id=${recordId}`);
  };

  // Safe date formatter
  const safeFormatDate = (dateStr: string | null | undefined): string => {
    if (!dateStr) return "---";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return "---";
      return format(date, "dd.MM.yyyy", { locale: tr });
    } catch {
      return "---";
    }
  };

  // Filter and separate records by type
  const filterRecords = (records: any[], eventType: string) => {
    return records
      .filter(record => record.eventType === eventType)
      .filter(record => {
        if (!searchTerm) return true;
        const searchLower = searchTerm.toLowerCase();
        return (
          String(record.employeeRegistrationNumber || "").toLowerCase().includes(searchLower) ||
          String(record.employeeName || "").toLowerCase().includes(searchLower) ||
          String(record.position || "").toLowerCase().includes(searchLower) ||
          String(record.accidentSeverity || "").toLowerCase().includes(searchLower)
        );
      });
  };

  // Calculate stats - independent of search
  const currentDate = new Date();
  const allWorkAccidents = accidentRecords.filter(record => record.eventType === "İş Kazası");
  const allNearMisses = accidentRecords.filter(record => record.eventType === "Ramak Kala");
  
  const thisMonthAccidents = allWorkAccidents.filter(record => {
    if (!record.eventDate) return false;
    try {
      return isSameMonth(new Date(record.eventDate), currentDate);
    } catch {
      return false;
    }
  }).length;
  
  const thisMonthNearMisses = allNearMisses.filter(record => {
    if (!record.eventDate) return false;
    try {
      return isSameMonth(new Date(record.eventDate), currentDate);
    } catch {
      return false;
    }
  }).length;
  
  const totalWorkDayLoss = allWorkAccidents.reduce((sum, record) => sum + Number(record.workDayLoss || 0), 0);

  // Apply search filters for display
  const workAccidents = filterRecords(accidentRecords, "İş Kazası");
  const nearMisses = filterRecords(accidentRecords, "Ramak Kala");

  return (
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              İş Kazası ve Ramak Kala
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              İş kazalarının ve ramak kala olaylarının yönetimi
            </p>
          </div>
          <Button onClick={handleNewAccidentReport} data-testid="button-new-report">
            <PlusCircle className="mr-2 h-4 w-4" />
            Yeni Olay Bildir
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Bu Ay Kaza</p>
                  <p className="text-2xl font-bold">{isLoading ? "-" : thisMonthAccidents}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Activity className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Bu Ay Ramak Kala</p>
                  <p className="text-2xl font-bold">{isLoading ? "-" : thisMonthNearMisses}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Toplam Gün Kaybı</p>
                  <p className="text-2xl font-bold">{isLoading ? "-" : totalWorkDayLoss}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Toplam Kayıt</p>
                  <p className="text-2xl font-bold">{isLoading ? "-" : accidentRecords.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="flex items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Sicil no, Ad-soyad, Görev ile ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-search"
            />
          </div>
          {searchTerm && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setSearchTerm("")} 
              data-testid="button-clear-search"
            >
              Temizle
            </Button>
          )}
        </div>

        <Tabs defaultValue="accidents">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="accidents">İş Kazaları</TabsTrigger>
            <TabsTrigger value="near-miss">Ramak Kala</TabsTrigger>
          </TabsList>

          <TabsContent value="accidents" className="space-y-4">
            <div className="space-y-4">
              {isLoading ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Kayıtlar yüklüyor...</p>
                </div>
              ) : isError ? (
                <div className="text-center py-8">
                  <AlertTriangle className="h-16 w-16 text-red-300 mx-auto mb-4" />
                  <p className="text-red-500">Kayıtlar yüklenirken hata oluştu. Lütfen sayfayı yenileyin.</p>
                </div>
              ) : workAccidents.length === 0 ? (
                <div className="text-center py-8">
                  <AlertTriangle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {searchTerm ? "Arama kriterlerine uygun iş kazası bulunamadı." : "Henüz iş kazası kaydı bulunmuyor."}
                  </p>
                </div>
              ) : (
                workAccidents.map((record) => (
                  <Card key={record.id} data-testid={`card-accident-${record.id}`}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="h-5 w-5 text-red-600" />
                          <CardTitle className="text-lg" data-testid={`text-accident-title-${record.id}`}>
                            {record.eventDescription || "İş Kazası"}
                          </CardTitle>
                        </div>
                        {record.accidentSeverity && (
                          <Badge 
                            variant="outline" 
                            className={
                              record.accidentSeverity === "Yüksek Ciddiyet" ? "bg-red-50 text-red-700" :
                              record.accidentSeverity === "Orta Ciddiyet" ? "bg-orange-50 text-orange-700" :
                              "bg-yellow-50 text-yellow-700"
                            }
                            data-testid={`badge-severity-${record.id}`}
                          >
                            {record.accidentSeverity}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid md:grid-cols-4 gap-4">
                        <div>
                          <span className="text-sm font-medium">Sicil No:</span>
                          <p className="text-sm text-gray-600" data-testid={`text-registration-${record.id}`}>
                            {record.employeeRegistrationNumber || "---"}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm font-medium">Ad-Soyad:</span>
                          <p className="text-sm text-gray-600" data-testid={`text-employee-name-${record.id}`}>
                            {record.employeeName || "---"}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm font-medium">Görev:</span>
                          <p className="text-sm text-gray-600" data-testid={`text-position-${record.id}`}>
                            {record.position || "---"}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm font-medium">Gün Kaybı:</span>
                          <p className="text-sm text-gray-600" data-testid={`text-work-loss-${record.id}`}>
                            {record.workDayLoss || 0} gün
                          </p>
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm font-medium">Tarih:</span>
                          <p className="text-sm text-gray-600" data-testid={`text-date-${record.id}`}>
                            {safeFormatDate(record.eventDate)}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm font-medium">Alan:</span>
                          <p className="text-sm text-gray-600" data-testid={`text-area-${record.id}`}>
                            {record.eventArea || "---"}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleViewAccidentDetails(record.id)}
                          data-testid={`button-view-${record.id}`}
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          Detayları Gör
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="near-miss" className="space-y-4">
            <div className="space-y-4">
              {isLoading ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Kayıtlar yüklüyor...</p>
                </div>
              ) : isError ? (
                <div className="text-center py-8">
                  <Activity className="h-16 w-16 text-red-300 mx-auto mb-4" />
                  <p className="text-red-500">Kayıtlar yüklenirken hata oluştu. Lütfen sayfayı yenileyin.</p>
                </div>
              ) : nearMisses.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {searchTerm ? "Arama kriterlerine uygun ramak kala olayı bulunamadı." : "Henüz ramak kala olayı kaydı bulunmuyor."}
                  </p>
                </div>
              ) : (
                nearMisses.map((record) => (
                  <Card key={record.id} data-testid={`card-nearmiss-${record.id}`}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Activity className="h-5 w-5 text-yellow-600" />
                          <CardTitle className="text-lg" data-testid={`text-nearmiss-title-${record.id}`}>
                            {record.eventDescription || "Ramak Kala Olayı"}
                          </CardTitle>
                        </div>
                        {record.accidentSeverity && (
                          <Badge 
                            variant="outline" 
                            className={
                              record.accidentSeverity === "Yüksek Ciddiyet" ? "bg-red-50 text-red-700" :
                              record.accidentSeverity === "Orta Ciddiyet" ? "bg-orange-50 text-orange-700" :
                              "bg-yellow-50 text-yellow-700"
                            }
                            data-testid={`badge-nearmiss-severity-${record.id}`}
                          >
                            {record.accidentSeverity}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid md:grid-cols-4 gap-4">
                        <div>
                          <span className="text-sm font-medium">Sicil No:</span>
                          <p className="text-sm text-gray-600" data-testid={`text-nearmiss-registration-${record.id}`}>
                            {record.employeeRegistrationNumber || "---"}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm font-medium">Ad-Soyad:</span>
                          <p className="text-sm text-gray-600" data-testid={`text-nearmiss-employee-name-${record.id}`}>
                            {record.employeeName || "---"}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm font-medium">Görev:</span>
                          <p className="text-sm text-gray-600" data-testid={`text-nearmiss-position-${record.id}`}>
                            {record.position || "---"}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm font-medium">Raporlayan:</span>
                          <p className="text-sm text-gray-600" data-testid={`text-nearmiss-reporter-${record.id}`}>
                            {record.reportedBy || "---"}
                          </p>
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm font-medium">Tarih:</span>
                          <p className="text-sm text-gray-600" data-testid={`text-nearmiss-date-${record.id}`}>
                            {safeFormatDate(record.eventDate)}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm font-medium">Alan:</span>
                          <p className="text-sm text-gray-600" data-testid={`text-nearmiss-area-${record.id}`}>
                            {record.eventArea || "---"}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleViewAccidentDetails(record.id)}
                          data-testid={`button-nearmiss-view-${record.id}`}
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          Detayları Gör
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

        </Tabs>
      </div>
  );
}