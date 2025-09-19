import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, Activity, FileText, TrendingUp, Users, Clock, PlusCircle, Shield, Search, Eye, Edit, Download, Trash2, Calendar } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format, isSameMonth, startOfMonth, compareDesc } from "date-fns";
import { tr } from "date-fns/locale";

// Check if record can be edited/deleted (within 7 days of creation)
const canManageRecord = (userRole: string, createdAt: string | null | undefined): boolean => {
  // Central admin can always manage records
  if (userRole === 'central_admin') return true;
  
  if (!createdAt) return false;
  try {
    const recordDate = new Date(createdAt);
    const now = new Date();
    const daysDifference = Math.floor((now.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysDifference <= 7;
  } catch {
    return false;
  }
};

export default function AccidentManagementPage() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Delete confirmation dialog state
  const [deleteDialog, setDeleteDialog] = useState<{isOpen: boolean; recordId: string; recordTitle: string}>({
    isOpen: false,
    recordId: "",
    recordTitle: ""
  });
  
  // Get current user for role-based permissions
  const { data: currentUser } = useQuery({
    queryKey: ["/api/user/me"],
  });

  // Fetch accident records
  const { data: accidentRecords = [], isLoading, isError } = useQuery({
    queryKey: ["/api/accident-records"],
    enabled: true
  }) as { data: any[], isLoading: boolean, isError: boolean };

  const handleNewAccidentReport = () => {
    setLocation("/accident-details");
  };

  const handleViewAccidentDetails = (recordId: string) => {
    setLocation(`/accident-details?id=${recordId}&mode=view`);
  };

  const handleEditAccidentDetails = (recordId: string) => {
    setLocation(`/accident-details?id=${recordId}&mode=edit`);
  };

  // Delete mutation
  const deleteAccidentMutation = useMutation({
    mutationFn: (recordId: string) => {
      return apiRequest("DELETE", `/api/accident-records/${recordId}`);
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Kaza kaydı başarıyla silindi.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/accident-records"] });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Kayıt silinirken hata oluştu.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteAccident = (recordId: string, recordTitle: string) => {
    setDeleteDialog({
      isOpen: true,
      recordId,
      recordTitle
    });
  };

  const confirmDelete = () => {
    deleteAccidentMutation.mutate(deleteDialog.recordId);
    setDeleteDialog({isOpen: false, recordId: "", recordTitle: ""});
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

  // Get available years from records for filter dropdown
  const getAvailableYears = (records: any[]): number[] => {
    const years = new Set<number>();
    records.forEach(record => {
      if (record.eventDate) {
        try {
          const year = new Date(record.eventDate).getFullYear();
          if (!isNaN(year)) {
            years.add(year);
          }
        } catch {
          // Skip invalid dates
        }
      }
    });
    return Array.from(years).sort((a, b) => b - a); // Most recent first
  };

  // Filter and separate records by type with date sorting and year filtering
  const filterRecords = (records: any[], eventType: string): any[] => {
    return records
      .filter(record => record.eventType === eventType)
      .filter(record => {
        // Year filter
        if (selectedYear !== "all") {
          if (!record.eventDate) return false;
          try {
            const recordYear = new Date(record.eventDate).getFullYear();
            if (recordYear !== parseInt(selectedYear)) return false;
          } catch {
            return false;
          }
        }
        return true;
      })
      .filter(record => {
        // Search filter
        if (!searchTerm) return true;
        const searchLower = searchTerm.toLowerCase();
        return (
          String(record.employeeRegistrationNumber || "").toLowerCase().includes(searchLower) ||
          String(record.employeeName || "").toLowerCase().includes(searchLower) ||
          String(record.position || "").toLowerCase().includes(searchLower) ||
          String(record.accidentSeverity || "").toLowerCase().includes(searchLower)
        );
      })
      .sort((a, b) => {
        // Sort by eventDate (newest first)
        if (!a.eventDate && !b.eventDate) return 0;
        if (!a.eventDate) return 1; // Records without date go to end
        if (!b.eventDate) return -1;
        
        const dateA = new Date(a.eventDate);
        const dateB = new Date(b.eventDate);
        
        // Handle invalid dates - push them to the end
        const isValidA = !isNaN(dateA.getTime());
        const isValidB = !isNaN(dateB.getTime());
        
        if (!isValidA && !isValidB) return 0;
        if (!isValidA) return 1; // Invalid dates go to end
        if (!isValidB) return -1;
        
        return dateB.getTime() - dateA.getTime(); // Newest first
      });
  };

  // Calculate stats - independent of search
  const currentDate = new Date();
  const allWorkAccidents = (accidentRecords as any[]).filter((record: any) => record.eventType === "İş Kazası");
  const allNearMisses = (accidentRecords as any[]).filter((record: any) => record.eventType === "Ramak Kala");
  
  const thisMonthAccidents = allWorkAccidents.filter((record: any) => {
    if (!record.eventDate) return false;
    try {
      return isSameMonth(new Date(record.eventDate), currentDate);
    } catch {
      return false;
    }
  }).length;
  
  const thisMonthNearMisses = allNearMisses.filter((record: any) => {
    if (!record.eventDate) return false;
    try {
      return isSameMonth(new Date(record.eventDate), currentDate);
    } catch {
      return false;
    }
  }).length;
  
  const totalWorkDayLoss = allWorkAccidents.reduce((sum: number, record: any) => sum + Number(record.workDayLoss || 0), 0);

  // Group records by month
  const groupRecordsByMonth = (records: any[]): { [key: string]: any[] } => {
    const grouped: { [key: string]: any[] } = {};
    
    records.forEach(record => {
      if (!record.eventDate) {
        // Group records without date under a special category
        if (!grouped['no-date']) grouped['no-date'] = [];
        grouped['no-date'].push(record);
        return;
      }
      
      try {
        const date = new Date(record.eventDate);
        if (isNaN(date.getTime())) {
          // Invalid dates go to no-date group
          if (!grouped['no-date']) grouped['no-date'] = [];
          grouped['no-date'].push(record);
          return;
        }
        
        const monthKey = format(startOfMonth(date), 'yyyy-MM', { locale: tr });
        const monthDisplay = format(date, 'MMMM yyyy', { locale: tr });
        
        if (!grouped[monthKey]) grouped[monthKey] = [];
        grouped[monthKey].push(record);
        grouped[monthKey].monthDisplay = monthDisplay;
        
      } catch {
        // Error parsing date - put in no-date group
        if (!grouped['no-date']) grouped['no-date'] = [];
        grouped['no-date'].push(record);
      }
    });
    
    return grouped;
  };

  // Format month header with count
  const formatMonthHeader = (monthKey: string, records: any[]): string => {
    if (monthKey === 'no-date') {
      return `Tarih Belirtilmemiş (${records.length})`;
    }
    return `${records.monthDisplay} (${records.length})`;
  };

  // Get available years for dropdown
  const availableYears = getAvailableYears(accidentRecords);

  // Apply search filters for display
  const workAccidents = filterRecords(accidentRecords, "İş Kazası");
  const nearMisses = filterRecords(accidentRecords, "Ramak Kala");

  // Group filtered results by month
  const workAccidentsGrouped = groupRecordsByMonth(workAccidents);
  const nearMissesGrouped = groupRecordsByMonth(nearMisses);

  // Get month keys sorted by most recent first
  const getSortedMonthKeys = (grouped: { [key: string]: any[] }): string[] => {
    return Object.keys(grouped).sort((a, b) => {
      if (a === 'no-date') return 1; // Put no-date at the end
      if (b === 'no-date') return -1;
      return b.localeCompare(a); // Descending order (2024-12, 2024-11, etc.)
    });
  };

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

        {/* Search and Filters */}
        <div className="flex items-center space-x-4 flex-wrap gap-2">
          <div className="relative flex-1 min-w-[300px] max-w-sm">
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
          
          {/* Year Filter */}
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <Select value={selectedYear} onValueChange={setSelectedYear} data-testid="select-year">
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Yıl" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                {availableYears.map(year => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Clear Filters */}
          {(searchTerm || selectedYear !== "all") && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                setSearchTerm("");
                setSelectedYear("all");
              }}
              data-testid="button-clear-filters"
            >
              Filtreleri Temizle
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
                  <div className="space-y-6">
                    {getSortedMonthKeys(workAccidentsGrouped).map((monthKey) => {
                      const monthRecords = workAccidentsGrouped[monthKey];
                      return (
                        <div key={monthKey} className="space-y-2">
                          {/* Month Header */}
                          <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 rounded-lg">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                              <Calendar className="h-5 w-5" />
                              {formatMonthHeader(monthKey, monthRecords)}
                            </h3>
                          </div>
                          
                          {/* Month Records Table */}
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
                                {monthRecords.map((record) => (
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
                                        {canManageRecord(currentUser?.role, record.createdAt) ? (
                                          <>
                                            <Button 
                                              variant="ghost" 
                                              size="sm" 
                                              onClick={() => handleEditAccidentDetails(record.id)}
                                              data-testid={`button-edit-${record.id}`}
                                              className="h-8 w-8 p-0"
                                            >
                                              <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button 
                                              variant="ghost" 
                                              size="sm" 
                                              onClick={() => handleDeleteAccident(record.id, `${record.employeeName} - ${record.eventType}`)}
                                              data-testid={`button-delete-${record.id}`}
                                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                              disabled={deleteAccidentMutation.isPending}
                                            >
                                              <Trash2 className="h-4 w-4" />
                                            </Button>
                                          </>
                                        ) : (
                                          <div className="h-8 w-8 p-0 flex items-center justify-center" data-testid={`locked-state-${record.id}`}>
                                            <span className="text-xs text-gray-400" title="7 günlük düzenleme süresi dolmuş. Sadece görüntüleme mümkün.">🔒</span>
                                          </div>
                                        )}
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      );
                    })}
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
                  <div className="space-y-6">
                    {getSortedMonthKeys(nearMissesGrouped).map((monthKey) => {
                      const monthRecords = nearMissesGrouped[monthKey];
                      return (
                        <div key={monthKey} className="space-y-2">
                          {/* Month Header */}
                          <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 rounded-lg">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                              <Calendar className="h-5 w-5" />
                              {formatMonthHeader(monthKey, monthRecords)}
                            </h3>
                          </div>
                          
                          {/* Month Records Table */}
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
                                {monthRecords.map((record) => (
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
                                      {record.creator?.fullName || record.reportedBy || "---"}
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
                                        {canManageRecord(currentUser?.role, record.createdAt) ? (
                                          <>
                                            <Button 
                                              variant="ghost" 
                                              size="sm" 
                                              onClick={() => handleEditAccidentDetails(record.id)}
                                              data-testid={`button-nearmiss-edit-${record.id}`}
                                              className="h-8 w-8 p-0"
                                            >
                                              <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button 
                                              variant="ghost" 
                                              size="sm" 
                                              onClick={() => handleDeleteAccident(record.id, `${record.employeeName} - ${record.eventType}`)}
                                              data-testid={`button-nearmiss-delete-${record.id}`}
                                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                              disabled={deleteAccidentMutation.isPending}
                                            >
                                              <Trash2 className="h-4 w-4" />
                                            </Button>
                                          </>
                                        ) : (
                                          <div className="h-8 w-8 p-0 flex items-center justify-center" data-testid={`locked-state-${record.id}`}>
                                            <span className="text-xs text-gray-400" title="7 günlük düzenleme süresi dolmuş. Sadece görüntüleme mümkün.">🔒</span>
                                          </div>
                                        )}
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialog.isOpen} onOpenChange={(open) => setDeleteDialog({...deleteDialog, isOpen: open})}>
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                <Trash2 className="h-5 w-5" />
                Kaza Kaydını Sil
              </AlertDialogTitle>
              <AlertDialogDescription className="text-gray-600">
                <strong>"{deleteDialog.recordTitle}"</strong> kaydını silmek istediğinizden emin misiniz?
                <br />
                <br />
                <span className="text-red-600 font-medium">⚠️ Bu işlem geri alınamaz.</span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-gray-300" data-testid="button-cancel-delete">İptal</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={deleteAccidentMutation.isPending}
                data-testid="button-confirm-delete"
              >
                {deleteAccidentMutation.isPending ? "Siliniyor..." : "Sil"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }