import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, ArrowLeft, FileText } from "lucide-react";
import { format, isValid, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertMedicalExaminationSchema, type Employee } from "@shared/schema";

// Separate UI Form Schema - only UI fields
const UIFormSchema = z.object({
  examinationType: z.string().min(1, "Muayene türü gereklidir"),
  examinationDate: z.coerce.date({
    required_error: "Muayene tarihi gereklidir",
  }),
  nextExaminationDate: z.coerce.date().optional(),
  physicianName: z.string().optional(),
  physicianTitle: z.string().optional(),
  hospitalName: z.string().optional(),
  
  // Medical History fields
  chronicDiseases: z.string().optional(),
  medications: z.string().optional(),
  allergies: z.string().optional(),
  surgicalHistory: z.string().optional(),
  familyHistory: z.string().optional(),
  smokingStatus: z.enum(["Hiç İçmemiş", "İçiyor", "Bırakmış"]).optional(),
  alcoholStatus: z.enum(["Hiç İçmemiş", "İçiyor", "Bırakmış"]).optional(),
  
  // Physical Examination fields
  bloodPressure: z.string().optional(),
  pulse: z.string().optional(),
  visionLeft: z.string().optional(),
  visionRight: z.string().optional(),
  hearingLeft: z.string().optional(),
  hearingRight: z.string().optional(),
  
  // Laboratory fields
  laboratoryResults: z.string().optional(),
  radiologyResults: z.string().optional(),
  otherExaminations: z.string().optional(),
  
  // Missing form fields that are rendered
  findings: z.string().optional(),
  recommendations: z.string().optional(),
  fitness: z.enum(["Uygun", "Sınırlı Uygun", "Uygun Değil"]).default("Uygun"),
  
  // Conclusion
  conclusion: z.string().min(1, "Sonuç gereklidir"),
});

export default function NewMedicalExamination() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [employeeId, setEmployeeId] = useState<string | null>(null);

  // Parse employeeId from URL query params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('employeeId');
    setEmployeeId(id);
  }, []);

  // Fetch employee data
  const { data: employee, isLoading: employeeLoading } = useQuery<Employee>({
    queryKey: ['/api/employees', employeeId],
    enabled: !!employeeId,
  });

  // Medical examination form with UI schema
  const examinationForm = useForm<z.infer<typeof UIFormSchema>>({
    resolver: zodResolver(UIFormSchema),
    defaultValues: {
      examinationType: "İşe Giriş",
      physicianName: "",
      physicianTitle: "",
      hospitalName: "",
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
      conclusion: "",
    },
  });

  // Auto-fill dates when employee data loads
  useEffect(() => {
    if (employee) {
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
    }
  }, [employee, examinationForm]);

  // Create examination mutation
  const createExaminationMutation = useMutation({
    mutationFn: (data: z.infer<typeof insertMedicalExaminationSchema>) => apiRequest('/api/medical-examinations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Tıbbi muayene başarıyla kaydedildi",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/medical-examinations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/medical-examinations/dashboard/initial'] });
      queryClient.invalidateQueries({ queryKey: ['/api/medical-examinations/dashboard/periodic'] });
      queryClient.invalidateQueries({ queryKey: ['/api/medical-examinations/dashboard/overdue'] });
      setLocation('/medical-examinations');
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Tıbbi muayene kaydedilirken hata oluştu",
        variant: "destructive",
      });
    },
  });

  const handleCreateExamination = (data: z.infer<typeof UIFormSchema>) => {
    if (!employeeId || !employee) {
      toast({
        title: "Hata",
        description: "Çalışan bilgisi bulunamadı",
        variant: "destructive",
      });
      return;
    }

    // Validate locationId before proceeding
    if (!employee.locationId || employee.locationId.trim() === '') {
      toast({
        title: "Hata",
        description: "Çalışanın lokasyon bilgisi eksik. Lütfen çalışan bilgilerini güncelleyiniz.",
        variant: "destructive",
      });
      return;
    }

    // Map UI data to insertMedicalExaminationSchema payload
    const payload = {
      employeeId,
      locationId: employee.locationId, // Validated above - safe to use
      examinationType: data.examinationType,
      examinationDate: data.examinationDate,
      nextExaminationDate: data.nextExaminationDate || null,
      physicianName: data.physicianName || null,
      physicianTitle: data.physicianTitle || null,
      hospitalName: data.hospitalName || null,
      conclusion: data.conclusion,
      
      // Map UI fields to JSON objects per schema
      medicalHistory: {
        chronicDiseases: data.chronicDiseases || "",
        medications: data.medications || "",
        allergies: data.allergies || "",
        surgicalHistory: data.surgicalHistory || "",
        familyHistory: data.familyHistory || "",
        smokingStatus: data.smokingStatus || "Hiç İçmemiş",
        alcoholStatus: data.alcoholStatus || "Hiç İçmemiş",
      },
      physicalExamination: {
        bloodPressure: data.bloodPressure || "",
        pulse: data.pulse || "",
        visionLeft: data.visionLeft || "",
        visionRight: data.visionRight || "",
        hearingLeft: data.hearingLeft || "",
        hearingRight: data.hearingRight || "",
      },
      laboratoryFindings: {
        laboratoryResults: data.laboratoryResults || "",
        radiologyResults: data.radiologyResults || "",
        otherExaminations: data.otherExaminations || "",
      },
      
      // Additional fields for compatibility
      findings: data.findings || "",
      recommendations: data.recommendations || "",
      fitness: data.fitness || "Uygun",
    };

    createExaminationMutation.mutate(payload);
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

  const formatDate = (value?: Date | string | number | null) => {
    if (!value) return "-";
    let d: Date;
    if (value instanceof Date) d = value;
    else if (typeof value === "string") d = parseISO(value);
    else d = new Date(value);
    return isValid(d) ? format(d, "dd.MM.yyyy", { locale: tr }) : "-";
  };

  if (employeeLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Çalışan Bulunamadı</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Belirtilen çalışan bulunamadı veya erişim izniniz yok.</p>
              <Button 
                onClick={() => setLocation('/medical-examinations')} 
                className="mt-4"
                data-testid="button-back-to-dashboard"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Panele Dön
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => setLocation('/medical-examinations')}
            data-testid="button-back-to-dashboard"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Panele Dön
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Yeni Tıbbi Muayene
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              {employee.fullName} için tıbbi muayene formu
            </p>
          </div>
        </div>

        {/* Employee Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Çalışan Bilgileri
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Ad Soyad</p>
                <p className="font-medium" data-testid="text-employee-name">{employee.fullName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pozisyon</p>
                <p className="font-medium" data-testid="text-employee-profession">{employee.profession}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Departman</p>
                <p className="font-medium" data-testid="text-employee-department">{employee.workDepartment}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">İşe Giriş Tarihi</p>
                <p className="font-medium" data-testid="text-employee-hire-date">{formatDate(employee.hireDate)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Tehlike Sınıfı</p>
                <Badge 
                  variant={getDangerClassBadgeVariant(employee.dangerClass)} 
                  data-testid="badge-employee-danger-class"
                >
                  {employee.dangerClass}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Examination Form */}
        <Card>
          <CardHeader>
            <CardTitle>Tıbbi Muayene Formu</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...examinationForm}>
              <form onSubmit={examinationForm.handleSubmit(handleCreateExamination)} className="space-y-6">
                {/* Basic Information */}
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
                                variant="outline"
                                className={cn(
                                  "pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                                data-testid="button-examination-date"
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
                              disabled={(date) =>
                                date > new Date() || date < new Date("1900-01-01")
                              }
                              initialFocus
                              locale={tr}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Physician Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={examinationForm.control}
                    name="physicianName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hekim Adı</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-physician-name" />
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
                          <Input {...field} data-testid="input-physician-title" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={examinationForm.control}
                  name="hospitalName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hastane/Sağlık Kuruluşu</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-hospital-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Examination Results */}
                <div className="space-y-4">
                  <FormField
                    control={examinationForm.control}
                    name="findings"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bulgular</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            rows={3}
                            data-testid="textarea-findings"
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
                            {...field} 
                            rows={3}
                            data-testid="textarea-recommendations"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={examinationForm.control}
                    name="fitness"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Çalışma Uygunluğu</FormLabel>
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
                </div>

                {/* Form Actions */}
                <div className="flex justify-end gap-4 pt-6 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLocation('/medical-examinations')}
                    data-testid="button-cancel-examination"
                  >
                    İptal
                  </Button>
                  <Button
                    type="submit"
                    disabled={createExaminationMutation.isPending}
                    data-testid="button-save-examination"
                  >
                    {createExaminationMutation.isPending ? "Kaydediliyor..." : "Muayene Kaydet"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}