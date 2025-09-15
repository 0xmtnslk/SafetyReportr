import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { CalendarIcon, FileText, AlertTriangle, Calendar as CalendarIconLucide, User } from "lucide-react";
import { format, isValid, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertMedicalExaminationSchema } from "@shared/schema";

type Employee = {
  id: string;
  tcKimlikNo: string;
  firstName: string;
  lastName: string;
  birthDate: Date;
  phoneNumber?: string;
  email?: string;
  address?: string;
  position: string;
  department: string;
  startDate: Date;
  dangerClass: "Çok Tehlikeli" | "Tehlikeli" | "Az Tehlikeli";
  isActive: boolean;
  locationId: string;
  createdAt?: Date;
  updatedAt?: Date;
};

type MedicalExamination = {
  id: string;
  employeeId: string;
  examinationType: "İşe Giriş" | "Periyodik" | "Özel Hal";
  examinationDate: Date;
  physicianName: string;
  physicianTitle?: string;
  hospitalName: string;
  findings?: string;
  recommendations?: string;
  restrictions?: string;
  fitness: "Uygun" | "Sınırlı Uygun" | "Uygun Değil";
  nextExaminationDate?: Date;
  chronicDiseases?: string;
  medications?: string;
  allergies?: string;
  surgicalHistory?: string;
  familyHistory?: string;
  smokingStatus?: "Hiç İçmemiş" | "İçiyor" | "Bırakmış";
  alcoholStatus?: "Hiç İçmemiş" | "İçiyor" | "Bırakmış";
  bloodPressure?: string;
  pulse?: string;
  weight?: number;
  height?: number;
  bmi?: number;
  visionLeft?: string;
  visionRight?: string;
  hearingLeft?: string;
  hearingRight?: string;
  laboratoryResults?: string;
  radiologyResults?: string;
  otherExaminations?: string;
  doctorNotes?: string;
  locationId: string;
  createdBy: string;
  createdAt?: Date;
  updatedAt?: Date;
};

type EmployeeWithExamInfo = Employee & {
  lastExamination?: MedicalExamination;
  nextExamDate?: Date;
  daysPastDue?: number;
};


const examinationFormSchema = insertMedicalExaminationSchema.extend({
  examinationDate: z.date({
    required_error: "Muayene tarihi gereklidir",
  }),
  nextExaminationDate: z.date().optional(),
});

export default function MedicalExaminations() {
  const { toast } = useToast();
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showExaminationDialog, setShowExaminationDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedExamination, setSelectedExamination] = useState<MedicalExamination | null>(null);

  // Queries for dashboard data
  const { data: initialExamEmployees = [], isLoading: loadingInitial } = useQuery({
    queryKey: ['/api/medical-examinations/dashboard/initial'],
  });

  const { data: periodicExamEmployees = [], isLoading: loadingPeriodic } = useQuery({
    queryKey: ['/api/medical-examinations/dashboard/periodic'],
  });

  const { data: overdueExamEmployees = [], isLoading: loadingOverdue } = useQuery({
    queryKey: ['/api/medical-examinations/dashboard/overdue'],
  });

  const { data: allEmployees = [] } = useQuery({
    queryKey: ['/api/employees'],
  });


  // Medical examination form
  const examinationForm = useForm<z.infer<typeof examinationFormSchema>>({
    resolver: zodResolver(examinationFormSchema),
    defaultValues: {
      examinationType: "İşe Giriş",
      physicianName: "",
      physicianTitle: "",
      hospitalName: "",
      findings: "",
      recommendations: "",
      restrictions: "",
      fitness: "Uygun",
      chronicDiseases: "",
      medications: "",
      allergies: "",
      surgicalHistory: "",
      familyHistory: "",
      smokingStatus: "Hiç İçmemiş",
      alcoholStatus: "Hiç İçmemiş",
      bloodPressure: "",
      pulse: "",
      visionLeft: "",
      visionRight: "",
      hearingLeft: "",
      hearingRight: "",
      laboratoryResults: "",
      radiologyResults: "",
      otherExaminations: "",
      doctorNotes: "",
    },
  });

  // Mutations

  const createExaminationMutation = useMutation({
    mutationFn: (data: z.infer<typeof examinationFormSchema>) => apiRequest('/api/medical-examinations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Tıbbi muayene başarıyla kaydedildi",
      });
      setShowExaminationDialog(false);
      examinationForm.reset();
      setSelectedEmployee(null);
      queryClient.invalidateQueries({ queryKey: ['/api/medical-examinations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/medical-examinations/dashboard/initial'] });
      queryClient.invalidateQueries({ queryKey: ['/api/medical-examinations/dashboard/periodic'] });
      queryClient.invalidateQueries({ queryKey: ['/api/medical-examinations/dashboard/overdue'] });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Tıbbi muayene kaydedilirken hata oluştu",
        variant: "destructive",
      });
    },
  });


  const handleCreateExamination = (data: z.infer<typeof examinationFormSchema>) => {
    if (!selectedEmployee) {
      toast({
        title: "Hata",
        description: "Lütfen önce bir çalışan seçin",
        variant: "destructive",
      });
      return;
    }

    createExaminationMutation.mutate({
      ...data,
      employeeId: selectedEmployee.id,
    });
  };

  const handleStartExamination = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowExaminationDialog(true);
    
    // Auto-fill some examination data based on employee
    examinationForm.setValue("examinationDate", new Date());
    if (employee.dangerClass === "Çok Tehlikeli") {
      const nextDate = new Date();
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      examinationForm.setValue("nextExaminationDate", nextDate);
    } else if (employee.dangerClass === "Tehlikeli") {
      const nextDate = new Date();
      nextDate.setFullYear(nextDate.getFullYear() + 3);
      examinationForm.setValue("nextExaminationDate", nextDate);
    } else {
      const nextDate = new Date();
      nextDate.setFullYear(nextDate.getFullYear() + 5);
      examinationForm.setValue("nextExaminationDate", nextDate);
    }
  };

  const formatDate = (value?: Date | string | number | null) => {
    if (!value) return "-";
    let d: Date;
    if (value instanceof Date) d = value;
    else if (typeof value === "string") d = parseISO(value);
    else d = new Date(value);
    return isValid(d) ? format(d, "dd.MM.yyyy", { locale: tr }) : "-";
  };

  const getDangerClassBadgeVariant = (dangerClass: string) => {
    switch (dangerClass) {
      case "Çok Tehlikeli":
        return "destructive";
      case "Tehlikeli":
        return "secondary";
      default:
        return "default";
    }
  };

  const getFitnessBadgeVariant = (fitness: string) => {
    switch (fitness) {
      case "Uygun":
        return "default";
      case "Sınırlı Uygun":
        return "secondary";
      case "Uygun Değil":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Tıbbi Muayeneler
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              İşe giriş ve periyodik muayene takip sistemi
            </p>
          </div>
          
          <div className="text-sm text-gray-600 dark:text-gray-300">
            Çalışan kayıtları sistem yöneticisi tarafından yönetilmektedir.
          </div>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* İlk Muayene Gereken Çalışanlar */}
          <Card className="h-fit">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-blue-500" />
                <div>
                  <CardTitle className="text-lg">İlk Muayene Gereken</CardTitle>
                  <CardDescription>Hiç muayene olmamış çalışanlar</CardDescription>
                </div>
              </div>
              <Badge variant="secondary" className="w-fit">
                {initialExamEmployees.length} kişi
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {loadingInitial ? (
                <div className="text-sm text-gray-500">Yükleniyor...</div>
              ) : initialExamEmployees.length === 0 ? (
                <div className="text-sm text-gray-500 py-4 text-center">
                  İlk muayene gereken çalışan yok
                </div>
              ) : (
                initialExamEmployees.map((employee: Employee) => (
                  <div 
                    key={employee.id} 
                    className="p-3 border rounded-lg bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {employee.firstName} {employee.lastName}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {employee.position} - {employee.department}
                        </p>
                      </div>
                      <Badge 
                        variant={getDangerClassBadgeVariant(employee.dangerClass)}
                        className="text-xs"
                      >
                        {employee.dangerClass}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">
                        İşe Başlama: {formatDate(employee.startDate)}
                      </span>
                      <Button
                        size="sm"
                        onClick={() => handleStartExamination(employee)}
                        data-testid={`button-start-initial-exam-${employee.id}`}
                      >
                        <FileText className="w-3 h-3 mr-1" />
                        Muayene Başlat
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Periyodik Muayene Gereken Çalışanlar */}
          <Card className="h-fit">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <CalendarIconLucide className="w-5 h-5 text-yellow-500" />
                <div>
                  <CardTitle className="text-lg">Periyodik Muayene</CardTitle>
                  <CardDescription>Muayene zamanı gelen çalışanlar</CardDescription>
                </div>
              </div>
              <Badge variant="secondary" className="w-fit">
                {periodicExamEmployees.length} kişi
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {loadingPeriodic ? (
                <div className="text-sm text-gray-500">Yükleniyor...</div>
              ) : periodicExamEmployees.length === 0 ? (
                <div className="text-sm text-gray-500 py-4 text-center">
                  Periyodik muayene gereken çalışan yok
                </div>
              ) : (
                periodicExamEmployees.map((employee: EmployeeWithExamInfo) => (
                  <div 
                    key={employee.id} 
                    className="p-3 border rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {employee.firstName} {employee.lastName}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {employee.position} - {employee.department}
                        </p>
                      </div>
                      <Badge 
                        variant={getDangerClassBadgeVariant(employee.dangerClass)}
                        className="text-xs"
                      >
                        {employee.dangerClass}
                      </Badge>
                    </div>
                    {employee.lastExamination && (
                      <div className="text-xs text-gray-500 mb-2">
                        Son Muayene: {formatDate(employee.lastExamination.examinationDate)}
                      </div>
                    )}
                    {employee.nextExamDate && (
                      <div className="text-xs text-yellow-600 dark:text-yellow-400 mb-2">
                        Hedef Tarih: {formatDate(employee.nextExamDate)}
                      </div>
                    )}
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        onClick={() => handleStartExamination(employee)}
                        data-testid={`button-start-periodic-exam-${employee.id}`}
                      >
                        <FileText className="w-3 h-3 mr-1" />
                        Muayene Başlat
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Süresi Geçmiş Muayeneli Çalışanlar */}
          <Card className="h-fit">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <div>
                  <CardTitle className="text-lg">Gecikmiş Muayeneler</CardTitle>
                  <CardDescription>Süresi geçmiş muayeneli çalışanlar</CardDescription>
                </div>
              </div>
              <Badge variant="destructive" className="w-fit">
                {overdueExamEmployees.length} kişi
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {loadingOverdue ? (
                <div className="text-sm text-gray-500">Yükleniyor...</div>
              ) : overdueExamEmployees.length === 0 ? (
                <div className="text-sm text-gray-500 py-4 text-center">
                  Gecikmiş muayene yok
                </div>
              ) : (
                overdueExamEmployees.map((employee: EmployeeWithExamInfo) => (
                  <div 
                    key={employee.id} 
                    className="p-3 border rounded-lg bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {employee.firstName} {employee.lastName}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {employee.position} - {employee.department}
                        </p>
                      </div>
                      <Badge 
                        variant={getDangerClassBadgeVariant(employee.dangerClass)}
                        className="text-xs"
                      >
                        {employee.dangerClass}
                      </Badge>
                    </div>
                    {employee.lastExamination && (
                      <div className="text-xs text-gray-500 mb-2">
                        Son Muayene: {formatDate(employee.lastExamination.examinationDate)}
                      </div>
                    )}
                    {employee.daysPastDue && (
                      <div className="text-xs text-red-600 dark:text-red-400 mb-2 font-medium">
                        {employee.daysPastDue} gün gecikmiş
                      </div>
                    )}
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleStartExamination(employee)}
                        data-testid={`button-start-overdue-exam-${employee.id}`}
                      >
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Acil Muayene
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Medical Examination Dialog */}
        <Dialog open={showExaminationDialog} onOpenChange={setShowExaminationDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Tıbbi Muayene Formu</DialogTitle>
              <DialogDescription>
                {selectedEmployee && (
                  <>
                    {selectedEmployee.firstName} {selectedEmployee.lastName} - {selectedEmployee.position}
                    <Badge variant={getDangerClassBadgeVariant(selectedEmployee.dangerClass)} className="ml-2">
                      {selectedEmployee.dangerClass}
                    </Badge>
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            <Form {...examinationForm}>
              <form onSubmit={examinationForm.handleSubmit(handleCreateExamination)} className="space-y-6">
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="basic">Temel Bilgiler</TabsTrigger>
                    <TabsTrigger value="physical">Fizik Muayene</TabsTrigger>
                    <TabsTrigger value="tests">Testler</TabsTrigger>
                    <TabsTrigger value="results">Sonuç</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="basic" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={examinationForm.control}
                        name="examinationType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Muayene Türü</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-examination-type">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="İşe Giriş">İşe Giriş</SelectItem>
                                <SelectItem value="Periyodik">Periyodik</SelectItem>
                                <SelectItem value="Özel Hal">Özel Hal</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={examinationForm.control}
                        name="examinationDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Muayene Tarihi</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    data-testid="button-examination-date"
                                    variant={"outline"}
                                    className={cn(
                                      "w-full pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "dd.MM.yyyy", { locale: tr })
                                    ) : (
                                      <span>Tarih seçin</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) => date > new Date()}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={examinationForm.control}
                        name="physicianName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Hekim Adı</FormLabel>
                            <FormControl>
                              <Input data-testid="input-physician-name" placeholder="Dr. Hekim Adı" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={examinationForm.control}
                        name="physicianTitle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Hekim Unvanı</FormLabel>
                            <FormControl>
                              <Input data-testid="input-physician-title" placeholder="İş Sağlığı Uzmanı" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={examinationForm.control}
                        name="hospitalName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Hastane/Sağlık Kuruluşu</FormLabel>
                            <FormControl>
                              <Input data-testid="input-hospital-name" placeholder="Hastane adı" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="physical" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={examinationForm.control}
                        name="bloodPressure"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Kan Basıncı</FormLabel>
                            <FormControl>
                              <Input data-testid="input-blood-pressure" placeholder="120/80 mmHg" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={examinationForm.control}
                        name="pulse"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nabız</FormLabel>
                            <FormControl>
                              <Input data-testid="input-pulse" placeholder="72/dk" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={examinationForm.control}
                        name="weight"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Kilo (kg)</FormLabel>
                            <FormControl>
                              <Input 
                                data-testid="input-weight"
                                type="number" 
                                placeholder="70" 
                                {...field}
                                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={examinationForm.control}
                        name="height"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Boy (cm)</FormLabel>
                            <FormControl>
                              <Input 
                                data-testid="input-height"
                                type="number" 
                                placeholder="175" 
                                {...field}
                                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={examinationForm.control}
                        name="visionLeft"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Görme (Sol)</FormLabel>
                            <FormControl>
                              <Input data-testid="input-vision-left" placeholder="10/10" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={examinationForm.control}
                        name="visionRight"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Görme (Sağ)</FormLabel>
                            <FormControl>
                              <Input data-testid="input-vision-right" placeholder="10/10" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="tests" className="space-y-4">
                    <div className="space-y-4">
                      <FormField
                        control={examinationForm.control}
                        name="laboratoryResults"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Laboratuvar Sonuçları</FormLabel>
                            <FormControl>
                              <Textarea 
                                data-testid="textarea-laboratory-results"
                                placeholder="Laboratuvar test sonuçları..." 
                                className="min-h-[100px]"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={examinationForm.control}
                        name="radiologyResults"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Radyoloji Sonuçları</FormLabel>
                            <FormControl>
                              <Textarea 
                                data-testid="textarea-radiology-results"
                                placeholder="X-ray, EKG vb. sonuçları..." 
                                className="min-h-[100px]"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={examinationForm.control}
                        name="otherExaminations"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Diğer Muayeneler</FormLabel>
                            <FormControl>
                              <Textarea 
                                data-testid="textarea-other-examinations"
                                placeholder="Diğer özel muayene sonuçları..." 
                                className="min-h-[100px]"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="results" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={examinationForm.control}
                        name="fitness"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Çalışmaya Uygunluk</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-fitness">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Uygun">Uygun</SelectItem>
                                <SelectItem value="Sınırlı Uygun">Sınırlı Uygun</SelectItem>
                                <SelectItem value="Uygun Değil">Uygun Değil</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={examinationForm.control}
                        name="nextExaminationDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Sonraki Muayene Tarihi</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    data-testid="button-next-examination-date"
                                    variant={"outline"}
                                    className={cn(
                                      "w-full pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "dd.MM.yyyy", { locale: tr })
                                    ) : (
                                      <span>Tarih seçin</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) => date < new Date()}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="space-y-4">
                      <FormField
                        control={examinationForm.control}
                        name="findings"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bulgular</FormLabel>
                            <FormControl>
                              <Textarea 
                                data-testid="textarea-findings"
                                placeholder="Muayene bulguları..." 
                                className="min-h-[100px]"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={examinationForm.control}
                        name="recommendations"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Öneriler</FormLabel>
                            <FormControl>
                              <Textarea 
                                data-testid="textarea-recommendations"
                                placeholder="Hekim önerileri..." 
                                className="min-h-[100px]"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={examinationForm.control}
                        name="restrictions"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Kısıtlamalar</FormLabel>
                            <FormControl>
                              <Textarea 
                                data-testid="textarea-restrictions"
                                placeholder="İş kısıtlamaları..." 
                                className="min-h-[100px]"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={examinationForm.control}
                        name="doctorNotes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Hekim Notları</FormLabel>
                            <FormControl>
                              <Textarea 
                                data-testid="textarea-doctor-notes"
                                placeholder="Hekim notları ve gözlemleri..." 
                                className="min-h-[100px]"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
                
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowExaminationDialog(false)}
                    data-testid="button-cancel-examination"
                  >
                    İptal
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createExaminationMutation.isPending}
                    data-testid="button-save-examination"
                  >
                    {createExaminationMutation.isPending ? "Kaydediliyor..." : "Kaydet"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}