import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, Activity, FileText, TrendingUp, Users, Clock, PlusCircle, Shield, Search, Eye, Edit, Download } from "lucide-react";
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
    setLocation(`/accident-details?id=${recordId}&mode=view`);
  };

  const handleEditAccidentDetails = (recordId: string) => {
    setLocation(`/accident-details?id=${recordId}&mode=edit`);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "Yüksek Ciddiyet":
        return "bg-red-100 text-red-800 border-red-200";
      case "Orta Ciddiyet":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "Düşük Ciddiyet":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
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
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      İş Kazaları
                    </CardTitle>
                    <CardDescription>
                      {workAccidents.length} kaza kaydı listeleniyor
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
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
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tarih</TableHead>
                          <TableHead>Sicil No</TableHead>
                          <TableHead>Ad-Soyad</TableHead>
                          <TableHead>Görev</TableHead>
                          <TableHead>Ciddiyet</TableHead>
                          <TableHead>Gün Kaybı</TableHead>
                          <TableHead>Alan</TableHead>
                          <TableHead className="text-right">Eylemler</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {workAccidents.map((record) => (
                          <TableRow key={record.id} data-testid={`row-accident-${record.id}`} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                            <TableCell data-testid={`cell-date-${record.id}`}>
                              {safeFormatDate(record.eventDate)}
                            </TableCell>
                            <TableCell data-testid={`cell-registration-${record.id}`} className="font-medium">
                              {record.employeeRegistrationNumber || "---"}
                            </TableCell>
                            <TableCell data-testid={`cell-employee-name-${record.id}`}>
                              {record.employeeName || "---"}
                            </TableCell>
                            <TableCell data-testid={`cell-position-${record.id}`}>
                              {record.position || "---"}
                            </TableCell>
                            <TableCell data-testid={`cell-severity-${record.id}`}>
                              {record.accidentSeverity ? (
                                <Badge className={getSeverityColor(record.accidentSeverity)}>
                                  {record.accidentSeverity.replace(" Ciddiyet", "")}
                                </Badge>
                              ) : (
                                "---"
                              )}
                            </TableCell>
                            <TableCell data-testid={`cell-work-loss-${record.id}`}>
                              <span className={`font-medium ${
                                Number(record.workDayLoss) > 0 ? 'text-red-600' : 'text-green-600'
                              }`}>
                                {record.workDayLoss || 0} gün
                              </span>
                            </TableCell>
                            <TableCell data-testid={`cell-area-${record.id}`}>
                              {record.eventArea || "---"}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-1 justify-end">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleViewAccidentDetails(record.id)}
                                  data-testid={`button-view-${record.id}`}
                                  className="h-8 w-8 p-0"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleEditAccidentDetails(record.id)}
                                  data-testid={`button-edit-${record.id}`}
                                  className="h-8 w-8 p-0"
                                >
                                  <Edit className="h-4 w-4" />
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
          </TabsContent>

          <TabsContent value="near-miss" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-yellow-600" />
                      Ramak Kala Olayları
                    </CardTitle>
                    <CardDescription>
                      {nearMisses.length} ramak kala olayı listeleniyor
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
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
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tarih</TableHead>
                          <TableHead>Sicil No</TableHead>
                          <TableHead>Ad-Soyad</TableHead>
                          <TableHead>Görev</TableHead>
                          <TableHead>Ciddiyet</TableHead>
                          <TableHead>Raporlayan</TableHead>
                          <TableHead>Alan</TableHead>
                          <TableHead className="text-right">Eylemler</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {nearMisses.map((record) => (
                          <TableRow key={record.id} data-testid={`row-nearmiss-${record.id}`} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                            <TableCell data-testid={`cell-nearmiss-date-${record.id}`}>
                              {safeFormatDate(record.eventDate)}
                            </TableCell>
                            <TableCell data-testid={`cell-nearmiss-registration-${record.id}`} className="font-medium">
                              {record.employeeRegistrationNumber || "---"}
                            </TableCell>
                            <TableCell data-testid={`cell-nearmiss-employee-name-${record.id}`}>
                              {record.employeeName || "---"}
                            </TableCell>
                            <TableCell data-testid={`cell-nearmiss-position-${record.id}`}>
                              {record.position || "---"}
                            </TableCell>
                            <TableCell data-testid={`cell-nearmiss-severity-${record.id}`}>
                              {record.accidentSeverity ? (
                                <Badge className={getSeverityColor(record.accidentSeverity)}>
                                  {record.accidentSeverity.replace(" Ciddiyet", "")}
                                </Badge>
                              ) : (
                                "---"
                              )}
                            </TableCell>
                            <TableCell data-testid={`cell-nearmiss-reporter-${record.id}`}>
                              {record.reportedBy || "---"}
                            </TableCell>
                            <TableCell data-testid={`cell-nearmiss-area-${record.id}`}>
                              {record.eventArea || "---"}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-1 justify-end">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleViewAccidentDetails(record.id)}
                                  data-testid={`button-nearmiss-view-${record.id}`}
                                  className="h-8 w-8 p-0"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleEditAccidentDetails(record.id)}
                                  data-testid={`button-nearmiss-edit-${record.id}`}
                                  className="h-8 w-8 p-0"
                                >
                                  <Edit className="h-4 w-4" />
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
          </TabsContent>

        </Tabs>
      </div>
  );
}