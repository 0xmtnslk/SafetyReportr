import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import { format, differenceInDays } from "date-fns";
import { tr } from "date-fns/locale";
import { Calendar, CalendarDays, Clock, Eye, Upload, CheckCircle2, X, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ObjectUploader } from "@/components/ObjectUploader";

import {
  WORK_SHIFTS,
  EVENT_TYPES,
  EVENT_AREAS,
  EVENT_PLACES,
  EMPLOYEE_STATUS,
  AFFILIATED_COMPANIES,
  PROFESSION_GROUPS,
  DEPARTMENTS,
  COMPLETE_POSITIONS,
  ACCIDENT_CAUSE_TYPES,
  ACCIDENT_SEVERITY,
  INJURED_BODY_PARTS,
  CAUSING_EQUIPMENT,
  DANGEROUS_SITUATIONS,
  DANGEROUS_ACTIONS,
  getEventPlacesByArea,
  getDangerousOptions
} from "@/constants/complete-accident-data";

// Safe date formatter to prevent runtime errors
const safeFormatDate = (dateString: string | null | undefined, formatStr: string = 'dd MMMM yyyy'): string => {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '—';
    return format(date, formatStr, { locale: tr });
  } catch {
    return '—';
  }
};

// Safe date input formatter for form fields (returns YYYY-MM-DD or empty string)
const safeDateForInput = (dateString: string | null | undefined): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0]; // Convert to YYYY-MM-DD format
  } catch {
    return '';
  }
};

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

// Authenticated document view helper - opens document in new tab with proper auth
const viewDocument = async (recordId: string, documentType: 'sgk-form' | 'analysis-form') => {
  try {
    const response = await fetch(`/api/accident-records/${recordId}/documents/${documentType}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}` || ''
      }
    });
    
    if (!response.ok) {
      throw new Error('Document fetch failed');
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    
    // Open in new tab for viewing
    const newWindow = window.open(url, '_blank');
    
    // Clean up blob URL after a delay to allow the new window to load
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
    }, 1000);
    
    if (!newWindow) {
      console.error('Popup blocked - please allow popups for this site');
    }
  } catch (error) {
    console.error('View document error:', error);
  }
};

// Form Schema
const accidentFormSchema = z.object({
  // Basic Event Information
  eventDate: z.string().min(1, "Tarih zorunludur"),
  eventTime: z.string().min(1, "Saat zorunludur").regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Saat formatı HH:MM olmalıdır (örn: 14:30)"),
  eventType: z.enum(["İş Kazası", "Ramak Kala"]),
  workShift: z.string(),
  eventArea: z.string(),
  eventPlace: z.string(),
  
  // SGK and Personnel Information
  sgkNotificationDate: z.string().optional(),
  personnelNumber: z.string().min(1, "Personel sicil no zorunludur"),
  fullName: z.string().min(1, "Ad-Soyad zorunludur"),
  startWorkDate: z.string().min(1, "İşe başlama tarihi zorunludur"),
  workingDays: z.number().optional(),
  
  // Employment Classification
  employeeStatus: z.string(),
  affiliatedCompany: z.string().optional(),
  professionGroup: z.string(),
  department: z.string(),
  position: z.string(),
  
  // Accident Details
  accidentSeverity: z.string().optional(),
  injuredBodyPart: z.string().optional(),
  causingEquipment: z.string().optional(),
  accidentCauseType: z.string().optional(),
  dangerousSelection: z.string().optional(),
  dangerousSelection2: z.string().optional(), // Second selection for combined type
  correctiveAction: z.string().optional(),
  workDayLoss: z.number().default(0),
  additionalTrainingDate: z.string().optional(),
  
  // Description
  eventDescription: z.string().min(10, "Olay açıklaması en az 10 karakter olmalıdır"),

  // Document URLs
  sgkNotificationFormUrl: z.string().optional(),
  accidentAnalysisFormUrl: z.string().optional()
});

type AccidentFormData = z.infer<typeof accidentFormSchema>;

export default function AccidentDetailsPage() {
  const [location, setLocation] = useLocation();
  const searchString = useSearch();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedArea, setSelectedArea] = useState<string>("");
  const [selectedCauseType, setSelectedCauseType] = useState<string>("");

  // Parse URL parameters
  const urlParams = new URLSearchParams(searchString);
  const recordId = urlParams.get('id');
  const mode = urlParams.get('mode') || 'create'; // create, edit, view
  const isEditMode = mode === 'edit';
  const isViewMode = mode === 'view';

  // Get current user information for hospital context
  const { data: currentUser } = useQuery({
    queryKey: ["/api/auth/me"],
    enabled: true
  }) as { data: any };
  
  // Reporter data is now included in existingRecord.creator via backend JOIN

  // Fetch existing accident record if in edit/view mode
  const { data: existingRecord, isLoading: isLoadingRecord } = useQuery({
    queryKey: ["/api/accident-records", recordId],
    enabled: !!recordId && (isEditMode || isViewMode)
  }) as { data: any, isLoading: boolean };

  // Document upload state
  const [sgkFormUploaded, setSgkFormUploaded] = useState<string>("");
  const [analysisFormUploaded, setAnalysisFormUploaded] = useState<string>("");

  // Function to get upload parameters for documents with file validation
  const getUploadParameters = async (file?: any): Promise<{ method: "PUT"; url: string; }> => {
    const requestBody: any = {};
    
    // Add file information for server-side validation if available
    if (file) {
      requestBody.contentType = file.type;
      requestBody.fileName = file.name;
    }
    
    const response = await fetch('/api/objects/upload/accident-docs', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Upload URL alınamadı');
    }
    
    const data = await response.json();
    return {
      method: "PUT",
      url: data.uploadURL || ""
    };
  };

  const form = useForm<AccidentFormData>({
    resolver: zodResolver(accidentFormSchema),
    defaultValues: {
      eventDate: "",
      eventTime: "",
      eventType: "İş Kazası",
      workShift: "",
      eventArea: "",
      eventPlace: "",
      personnelNumber: "",
      fullName: "",
      startWorkDate: "",
      employeeStatus: "",
      affiliatedCompany: "",
      professionGroup: "",
      department: "",
      position: "",
      accidentSeverity: "",
      injuredBodyPart: "",
      causingEquipment: "",
      accidentCauseType: "",
      dangerousSelection: "",
      dangerousSelection2: "",
      workDayLoss: 0,
      eventDescription: "",
      sgkNotificationFormUrl: "",
      accidentAnalysisFormUrl: ""
    }
  });

  // Populate form with existing record data
  useEffect(() => {
    if (existingRecord && (isEditMode || isViewMode)) {
      const record = existingRecord;
      
      form.reset({
        eventDate: safeDateForInput(record.eventDate),
        eventTime: record.eventTime || "",
        eventType: record.eventType || "İş Kazası",
        workShift: record.workShift || "",
        eventArea: record.eventArea || "",
        eventPlace: record.eventPlace || "",
        personnelNumber: record.employeeRegistrationNumber || "",
        fullName: record.employeeName || "",
        startWorkDate: safeDateForInput(record.employeeStartDate),
        employeeStatus: record.employeeStatus || "",
        affiliatedCompany: record.affiliatedCompany || "",
        professionGroup: record.professionGroup || "",
        department: record.department || "",
        position: record.position || "",
        accidentSeverity: record.accidentSeverity || "",
        injuredBodyPart: record.injuredBodyPart || "",
        causingEquipment: record.causingEquipment || "",
        accidentCauseType: record.accidentCauseType || "",
        dangerousSelection: record.dangerousSelection || "",
        dangerousSelection2: record.dangerousSelection2 || "",
        workDayLoss: record.workDayLoss || 0,
        additionalTrainingDate: safeDateForInput(record.additionalTrainingDate),
        eventDescription: record.eventDescription || "",
        sgkNotificationFormUrl: record.sgkNotificationFormUrl || "",
        accidentAnalysisFormUrl: record.accidentAnalysisFormUrl || ""
      });
      
      // Set document upload states
      setSgkFormUploaded(record.sgkNotificationFormUrl || "");
      setAnalysisFormUploaded(record.accidentAnalysisFormUrl || "");
      
      // Set dependent field states
      setSelectedArea(record.eventArea || "");
      setSelectedCauseType(record.accidentCauseType || "");
    }
  }, [existingRecord, isEditMode, isViewMode, form]);

  // Calculate working days when dates change
  const watchEventDate = form.watch("eventDate");
  const watchStartWorkDate = form.watch("startWorkDate");
  
  useEffect(() => {
    if (watchEventDate && watchStartWorkDate) {
      const eventDate = new Date(watchEventDate);
      const startDate = new Date(watchStartWorkDate);
      if (!isNaN(eventDate.getTime()) && !isNaN(startDate.getTime())) {
        const days = differenceInDays(eventDate, startDate);
        form.setValue("workingDays", Math.max(0, days));
      }
    }
  }, [watchEventDate, watchStartWorkDate, form]);

  // Handle area change to update place options
  const watchEventArea = form.watch("eventArea");
  useEffect(() => {
    if (watchEventArea !== selectedArea) {
      setSelectedArea(watchEventArea);
      form.setValue("eventPlace", ""); // Reset place when area changes
    }
  }, [watchEventArea, selectedArea, form]);

  // Handle accident cause type change
  const watchAccidentCauseType = form.watch("accidentCauseType");
  useEffect(() => {
    if (watchAccidentCauseType !== selectedCauseType) {
      setSelectedCauseType(watchAccidentCauseType || "");
      form.setValue("dangerousSelection", ""); // Reset dangerous selection when cause type changes
      form.setValue("dangerousSelection2", ""); // Reset second dangerous selection
    }
  }, [watchAccidentCauseType, selectedCauseType, form]);

  // Get available places based on selected area
  const availablePlaces = selectedArea ? getEventPlacesByArea(selectedArea) : [];
  
  // Get available dangerous options based on selected cause type
  const availableDangerousOptions = selectedCauseType ? getDangerousOptions(selectedCauseType) : [];

  // Submit mutation
  const createAccidentMutation = useMutation({
    mutationFn: async (data: AccidentFormData) => {
      const payload = {
        ...data,
        locationId: currentUser?.locationId, // Automatically set hospital from user session
        // Map frontend field names to backend expected names
        employeeRegistrationNumber: data.personnelNumber,
        employeeName: data.fullName,
        employeeStartDate: data.startWorkDate,
        // Remove frontend-only fields
        personnelNumber: undefined,
        fullName: undefined,
        startWorkDate: undefined,
        // Handle dates properly - only send non-empty dates
        eventDate: data.eventDate,
        sgkNotificationDate: data.sgkNotificationDate && data.sgkNotificationDate.trim() ? data.sgkNotificationDate : undefined,
        additionalTrainingDate: data.additionalTrainingDate && data.additionalTrainingDate.trim() ? data.additionalTrainingDate : undefined
      };
      
      return apiRequest("POST", "/api/accident-records", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accident-records"] });
      toast({
        title: "Başarılı",
        description: "Kaza/ramak kala kaydı başarıyla oluşturuldu."
      });
      setLocation("/accident-management");
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Kayıt oluşturulurken bir hata oluştu.",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: AccidentFormData) => {
    if (isEditMode) {
      // TODO: Implement update mutation
      toast({
        title: "Geliştirme Aşamasında",
        description: "Düzenleme özelliği yakında eklenecek.",
        variant: "destructive",
      });
    } else {
      createAccidentMutation.mutate(data);
    }
  };

  const watchEventType = form.watch("eventType");
  const isWorkAccident = watchEventType === "İş Kazası";

  // Date helper functions
  const formatDateForInput = (dateString: string) => {
    if (!dateString) return "";
    return dateString.split('T')[0]; // Convert to YYYY-MM-DD format
  };

  const handleDateChange = (fieldName: string, value: string) => {
    form.setValue(fieldName as any, value);
  };

  // Loading state for fetching existing record
  if (isLoadingRecord && recordId) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Kaza kaydı yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Get page title based on mode
  const getPageTitle = () => {
    if (isViewMode) return "Kaza / Ramak Kala Kaydı - Görüntüle";
    if (isEditMode) return "Kaza / Ramak Kala Kaydı - Düzenle";
    return "Yeni Kaza / Ramak Kala Kaydı";
  };

  // Render view mode as a professional report
  if (isViewMode && existingRecord) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-4xl mx-auto px-6">
          {/* Report Header */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg mb-6">
            <div className="border-b border-gray-200 dark:border-gray-700 px-8 py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {existingRecord.eventType} Sonuç Raporu
                  </h1>
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full font-medium">
                      Rapor ID: {existingRecord.id?.slice(0, 8).toUpperCase()}
                    </span>
                    <span>Oluşturulma: {safeFormatDate(existingRecord.createdAt, 'dd MMMM yyyy, HH:mm')}</span>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setLocation("/accident-management")}
                  data-testid="button-back-to-management"
                >
                  ← Listeye Dön
                </Button>
              </div>
            </div>
            
            {/* Report Content */}
            <div className="px-8 py-6">
              {/* Event Classification */}
              <div className={`mb-6 p-4 rounded-lg border-l-4 ${
                existingRecord.eventType === "İş Kazası" 
                  ? "bg-red-50 dark:bg-red-900/20 border-red-500" 
                  : "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500"
              }`}>
                <h3 className={`font-semibold text-lg mb-1 ${
                  existingRecord.eventType === "İş Kazası" ? "text-red-800 dark:text-red-200" : "text-yellow-800 dark:text-yellow-200"
                }`}>
                  {existingRecord.eventType}
                </h3>
                <p className={`text-sm ${
                  existingRecord.eventType === "İş Kazası" ? "text-red-600 dark:text-red-300" : "text-yellow-600 dark:text-yellow-300"
                }`}>
                  {existingRecord.eventType === "İş Kazası" 
                    ? "Gerçekleşmiş iş kazası raporu" 
                    : "Ramak kala olayı raporu"
                  }
                </p>
              </div>

              {/* Report Sections */}
              <div className="space-y-8">
                
                {/* 1. Olay Bilgileri */}
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
                    1. Olay Bilgileri
                  </h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Tarih:</span>
                        <p className="text-gray-900 dark:text-white font-medium">
                          {safeFormatDate(existingRecord.eventDate)}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Saat:</span>
                        <p className="text-gray-900 dark:text-white font-medium">{existingRecord.eventTime || '—'}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Vardiya:</span>
                        <p className="text-gray-900 dark:text-white font-medium">{existingRecord.workShift || '—'}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Olay Alanı:</span>
                        <p className="text-gray-900 dark:text-white font-medium">{existingRecord.eventArea || '—'}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Olay Yeri:</span>
                        <p className="text-gray-900 dark:text-white font-medium">{existingRecord.eventPlace || '—'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Çalışan Bilgileri */}
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
                    2. Çalışan Bilgileri
                  </h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Ad Soyad:</span>
                        <p className="text-gray-900 dark:text-white font-medium">{existingRecord.employeeName || '—'}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Sicil No:</span>
                        <p className="text-gray-900 dark:text-white font-medium">{existingRecord.employeeRegistrationNumber || '—'}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">İşe Başlama Tarihi:</span>
                        <p className="text-gray-900 dark:text-white font-medium">
                          {safeFormatDate(existingRecord.employeeStartDate)}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Çalışma Süresi:</span>
                        <p className="text-gray-900 dark:text-white font-medium">{existingRecord.workDurationDays ? `${existingRecord.workDurationDays} gün` : '—'}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Çalışan Durumu:</span>
                        <p className="text-gray-900 dark:text-white font-medium">{existingRecord.employeeStatus || '—'}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Bağlı Olduğu Firma:</span>
                        <p className="text-gray-900 dark:text-white font-medium">{existingRecord.affiliatedCompany || '—'}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Meslek Grubu:</span>
                        <p className="text-gray-900 dark:text-white font-medium">{existingRecord.professionGroup || '—'}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Departman:</span>
                        <p className="text-gray-900 dark:text-white font-medium">{existingRecord.department || '—'}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Pozisyon:</span>
                        <p className="text-gray-900 dark:text-white font-medium">{existingRecord.position || '—'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Kaza Detayları veya Ramak Kala Analizi */}
                {existingRecord.eventType === "İş Kazası" ? (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
                      3. Kaza Detayları
                    </h2>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div>
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Kaza Şiddeti:</span>
                          <p className="text-gray-900 dark:text-white font-medium">{existingRecord.accidentSeverity || '—'}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Yaralanan Vücut Bölgesi:</span>
                          <p className="text-gray-900 dark:text-white font-medium">{existingRecord.injuredBodyPart || '—'}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">İş Günü Kaybı:</span>
                          <p className="text-gray-900 dark:text-white font-medium">{existingRecord.workDayLoss ? `${existingRecord.workDayLoss} gün` : '—'}</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Kazaya Neden Olan Ekipman:</span>
                          <p className="text-gray-900 dark:text-white font-medium">{existingRecord.causingEquipment || '—'}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Kaza Nedeni Türü:</span>
                          <p className="text-gray-900 dark:text-white font-medium">{existingRecord.accidentCauseType || '—'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
                      3. Ramak Kala Analizi
                    </h2>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div>
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Tehlikeli Durum:</span>
                          <p className="text-gray-900 dark:text-white font-medium">{existingRecord.dangerousSelection || '—'}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">İkincil Tehlikeli Durum:</span>
                          <p className="text-gray-900 dark:text-white font-medium">{existingRecord.dangerousSelection2 || '—'}</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Olası Sonuçlar:</span>
                          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 border-l-4 border-yellow-500">
                            <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                              Bu ramak kala olayının gerçekleşmesi halinde yaralanma veya hasara neden olabilecek potansiyel durumlar analiz edilmiştir.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. Olay Açıklaması */}
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
                    4. Olay Açıklaması
                  </h2>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <p className="text-gray-900 dark:text-white leading-relaxed">
                      {existingRecord.eventDescription || 'Açıklama girilmemiş.'}
                    </p>
                  </div>
                </div>

                {/* 5. Düzeltici Faaliyetler */}
                {existingRecord.correctiveAction && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
                      5. Yapılan Düzeltici / Önleyici Faaliyetler
                    </h2>
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border-l-4 border-green-500">
                      <p className="text-gray-900 dark:text-white leading-relaxed">
                        {existingRecord.correctiveAction}
                      </p>
                    </div>
                  </div>
                )}

                {/* 6. Ekli Belgeler */}
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
                    6. Ekli Belgeler
                  </h2>
                  <div className="space-y-4">
                    {existingRecord.sgkNotificationFormUrl ? (
                      <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded">
                            <svg className="w-5 h-5 text-blue-600 dark:text-blue-300" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">SGK Bildirim Formu</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Sosyal Güvenlik Kurumu bildirim belgesi</p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => viewDocument(existingRecord.id!, 'sgk-form')}
                          data-testid="button-view-sgk-form"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Görüntüle
                        </Button>
                      </div>
                    ) : (
                      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                        <p className="text-gray-600 dark:text-gray-400">SGK Bildirim Formu eklenmemiş</p>
                      </div>
                    )}
                    
                    {existingRecord.accidentAnalysisFormUrl ? (
                      <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-100 dark:bg-purple-800 rounded">
                            <svg className="w-5 h-5 text-purple-600 dark:text-purple-300" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">Kaza Analiz Formu</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">İş kazası / ramak kala analiz belgesi</p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => viewDocument(existingRecord.id!, 'analysis-form')}
                          data-testid="button-view-analysis-form"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Görüntüle
                        </Button>
                      </div>
                    ) : (
                      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                        <p className="text-gray-600 dark:text-gray-400">Kaza Analiz Formu eklenmemiş</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 7. Rapor Bilgileri */}
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
                    7. Rapor Bilgileri
                  </h2>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 block">Raporu Hazırlayan:</span>
                          <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-600 rounded-lg border border-gray-200 dark:border-gray-500">
                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                              <svg className="w-6 h-6 text-blue-600 dark:text-blue-300" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
                              </svg>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{existingRecord?.creator?.fullName || existingRecord?.reportedBy || '—'}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {existingRecord?.creator?.safetySpecialistClass || (
                                  existingRecord?.creator?.role === 'central_admin' ? 'Merkez Yönetici' :
                                  existingRecord?.creator?.role === 'safety_specialist' ? 'İş Güvenliği Uzmanı' :
                                  existingRecord?.creator?.role === 'occupational_physician' ? 'İş Yeri Hekimi' :
                                  existingRecord?.creator?.role === 'responsible_manager' ? 'Sorumlu Müdür' :
                                  existingRecord?.creator?.role || 'Kullanıcı'
                                )}
                              </p>
                              {existingRecord?.creator?.certificateNumber && (
                                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Belge No: {existingRecord.creator.certificateNumber}</p>
                              )}
                              {currentUser?.hospital && (
                                <p className="text-xs text-gray-500 dark:text-gray-400">{currentUser.hospital}</p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Oluşturulma Tarihi:</span>
                          <p className="text-gray-900 dark:text-white font-medium">
                            {safeFormatDate(existingRecord.createdAt, 'dd MMMM yyyy, HH:mm')}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {existingRecord.sgkNotificationDate && (
                          <div>
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">SGK Bildirim Tarihi:</span>
                            <p className="text-gray-900 dark:text-white font-medium">
                              {safeFormatDate(existingRecord.sgkNotificationDate)}
                            </p>
                          </div>
                        )}
                        <div>
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Son Güncelleme:</span>
                          <p className="text-gray-900 dark:text-white font-medium">
                            {safeFormatDate(existingRecord.updatedAt, 'dd MMMM yyyy, HH:mm')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold" data-testid="title-accident-details">
          {getPageTitle()}
        </h1>
        {isEditMode && existingRecord && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <span className="bg-blue-100 dark:bg-blue-900 px-3 py-1 rounded-full">
              ID: {existingRecord.id?.slice(0, 8)}...
            </span>
          </div>
        )}
        <Button 
          variant="outline" 
          onClick={() => setLocation("/accident-management")}
          data-testid="button-back-to-management"
        >
          Geri Dön
        </Button>
      </div>

      <div className={`mb-4 p-4 rounded-lg ${
        watchEventType === "İş Kazası" 
          ? "bg-red-50 border border-red-200" 
          : "bg-yellow-50 border border-yellow-200"
      }`}>
        <h3 className={`font-semibold ${
          watchEventType === "İş Kazası" ? "text-red-800" : "text-yellow-800"
        }`}>
          {watchEventType} Formu
        </h3>
        <p className={`text-sm ${
          watchEventType === "İş Kazası" ? "text-red-600" : "text-yellow-600"
        }`}>
          {watchEventType === "İş Kazası" 
            ? "Gerçekleşmiş iş kazaları için kullanılır." 
            : "Neredeyse kaza olacak durumlar için kullanılır."
          }
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          
          {/* Basic Event Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Olay Bilgileri
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                {/* Event Date */}
                <FormField
                  control={form.control}
                  name="eventDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Olayın Gerçekleştiği Tarih</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            className="flex-1"
                            disabled={isViewMode}
                            data-testid="input-event-date"
                          />
                        </FormControl>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              data-testid="button-event-date-calendar"
                            >
                              <CalendarDays className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={field.value ? new Date(field.value) : undefined}
                              onSelect={(date) => {
                                if (date) {
                                  const formattedDate = format(date, "yyyy-MM-dd");
                                  field.onChange(formattedDate);
                                }
                              }}
                              disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Event Time */}
                <FormField
                  control={form.control}
                  name="eventTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Olayın Gerçekleştiği Saat</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input 
                            placeholder="Örn: 14:30" 
                            {...field} 
                            className="pl-10"
                            data-testid="input-event-time"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Event Type */}
                <FormField
                  control={form.control}
                  name="eventType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Olay Türü</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-event-type">
                            <SelectValue placeholder="Olay türü seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {EVENT_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Work Shift */}
                <FormField
                  control={form.control}
                  name="workShift"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mesai Dilimi</FormLabel>
                      <SearchableSelect
                        options={WORK_SHIFTS}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Mesai dilimi seçin"
                        data-testid="select-work-shift"
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Event Area */}
                <FormField
                  control={form.control}
                  name="eventArea"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Olayın Gerçekleştiği Alan</FormLabel>
                      <SearchableSelect
                        options={EVENT_AREAS}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Alan seçin veya arayın"
                        data-testid="select-event-area"
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Event Place (Dependent on Area) */}
                <FormField
                  control={form.control}
                  name="eventPlace"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Olayın Gerçekleştiği Yer</FormLabel>
                      <SearchableSelect
                        options={availablePlaces}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder={selectedArea ? "Yer seçin veya arayın" : "Önce alan seçin"}
                        disabled={!selectedArea}
                        data-testid="select-event-place"
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Personnel Information */}
          <Card>
            <CardHeader>
              <CardTitle>Personel Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* SGK Notification Date - only for work accidents */}
              {isWorkAccident && (
                <FormField
                  control={form.control}
                  name="sgkNotificationDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SGK'ya Bildirim Tarihi</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            className="flex-1"
                            data-testid="input-sgk-date"
                          />
                        </FormControl>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              data-testid="button-sgk-date-calendar"
                            >
                              <CalendarDays className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={field.value ? new Date(field.value) : undefined}
                              onSelect={(date) => {
                                if (date) {
                                  const formattedDate = format(date, "yyyy-MM-dd");
                                  field.onChange(formattedDate);
                                }
                              }}
                              disabled={(date) => date > new Date()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="grid md:grid-cols-2 gap-4">
                {/* Personnel Number */}
                <FormField
                  control={form.control}
                  name="personnelNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Personel Sicil No</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Sicil numarasını girin" 
                          {...field}
                          data-testid="input-personnel-number"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Full Name */}
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ad - Soyad</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ad ve soyadı girin" 
                          {...field}
                          data-testid="input-full-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                {/* Start Work Date */}
                <FormField
                  control={form.control}
                  name="startWorkDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>İşe Başlama Tarihi</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            className="flex-1"
                            data-testid="input-start-work-date"
                          />
                        </FormControl>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              data-testid="button-start-work-date-calendar"
                            >
                              <CalendarDays className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={field.value ? new Date(field.value) : undefined}
                              onSelect={(date) => {
                                if (date) {
                                  const formattedDate = format(date, "yyyy-MM-dd");
                                  field.onChange(formattedDate);
                                }
                              }}
                              disabled={(date) => date > new Date()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Working Days (Auto-calculated) */}
                <FormField
                  control={form.control}
                  name="workingDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Çalışma Süresi (Gün)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          value={field.value || 0}
                          readOnly 
                          className="bg-muted"
                          data-testid="input-working-days"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Employment Classification */}
          <Card>
            <CardHeader>
              <CardTitle>Personel Sınıflandırması</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                {/* Employee Status */}
                <FormField
                  control={form.control}
                  name="employeeStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Statüsü</FormLabel>
                      <SearchableSelect
                        options={EMPLOYEE_STATUS}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Statü seçin"
                        data-testid="select-employee-status"
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Affiliated Company */}
                <FormField
                  control={form.control}
                  name="affiliatedCompany"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bağlı Olduğu Firma</FormLabel>
                      <SearchableSelect
                        options={AFFILIATED_COMPANIES}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Firma seçin"
                        data-testid="select-affiliated-company"
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Profession Group */}
                <FormField
                  control={form.control}
                  name="professionGroup"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meslek Grubu</FormLabel>
                      <SearchableSelect
                        options={PROFESSION_GROUPS}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Meslek grubu seçin"
                        data-testid="select-profession-group"
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Department */}
                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Departmanı</FormLabel>
                      <SearchableSelect
                        options={DEPARTMENTS}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Departman seçin veya arayın"
                        data-testid="select-department"
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Position */}
                <FormField
                  control={form.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Görevi / Unvanı</FormLabel>
                      <SearchableSelect
                        options={COMPLETE_POSITIONS}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Görev/unvan seçin veya arayın"
                        data-testid="select-position"
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Accident Details */}
          <Card data-testid="card-accident-details">
            <CardHeader>
              <CardTitle>Kaza Detayları</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Accident Severity */}
                <FormField
                  control={form.control}
                  name="accidentSeverity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kaza Ciddiyeti</FormLabel>
                      <SearchableSelect
                        options={ACCIDENT_SEVERITY}
                        value={field.value || ""}
                        onValueChange={field.onChange}
                        placeholder="Kaza ciddiyeti seçin"
                        data-testid="select-accident-severity"
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Injured Body Part */}
                <FormField
                  control={form.control}
                  name="injuredBodyPart"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kazalanan Vücut Bölgesi</FormLabel>
                      <SearchableSelect
                        options={INJURED_BODY_PARTS}
                        value={field.value || ""}
                        onValueChange={field.onChange}
                        placeholder="Vücut bölgesi seçin"
                        data-testid="select-injured-body-part"
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Causing Equipment */}
              <FormField
                control={form.control}
                name="causingEquipment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Yaralanmaya Neden Olan Unsur / Ekipman</FormLabel>
                    <SearchableSelect
                      options={CAUSING_EQUIPMENT}
                      value={field.value || ""}
                      onValueChange={field.onChange}
                      placeholder="Neden olan unsur seçin"
                      data-testid="select-causing-equipment"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Accident Cause Type */}
              <FormField
                control={form.control}
                name="accidentCauseType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kaza Nedeni</FormLabel>
                    <SearchableSelect
                      options={ACCIDENT_CAUSE_TYPES}
                      value={field.value || ""}
                      onValueChange={field.onChange}
                      placeholder="Kaza nedeni seçin"
                      data-testid="select-accident-cause-type"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Dangerous Selection - conditional based on cause type */}
              {selectedCauseType === "Tehlikeli Durum" && (
                <FormField
                  control={form.control}
                  name="dangerousSelection"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tehlikeli Durum Açıklaması</FormLabel>
                      <SearchableSelect
                        options={DANGEROUS_SITUATIONS}
                        value={field.value || ""}
                        onValueChange={field.onChange}
                        placeholder="Tehlikeli durum seçin"
                        data-testid="select-dangerous-situation"
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {selectedCauseType === "Tehlikeli Hareket" && (
                <FormField
                  control={form.control}
                  name="dangerousSelection"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tehlikeli Hareket Açıklaması</FormLabel>
                      <SearchableSelect
                        options={DANGEROUS_ACTIONS}
                        value={field.value || ""}
                        onValueChange={field.onChange}
                        placeholder="Tehlikeli hareket seçin"
                        data-testid="select-dangerous-action"
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Combined selection - both situation and action */}
              {selectedCauseType === "Tehlikeli Durum ve Tehlikeli Hareket" && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="dangerousSelection"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tehlikeli Durum Açıklaması</FormLabel>
                        <SearchableSelect
                          options={DANGEROUS_SITUATIONS}
                          value={field.value || ""}
                          onValueChange={field.onChange}
                          placeholder="Tehlikeli durum seçin"
                          data-testid="select-dangerous-situation-combined"
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="dangerousSelection2"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tehlikeli Hareket Açıklaması</FormLabel>
                        <SearchableSelect
                          options={DANGEROUS_ACTIONS}
                          value={field.value || ""}
                          onValueChange={field.onChange}
                          placeholder="Tehlikeli hareket seçin"
                          data-testid="select-dangerous-action-combined"
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

                <div className="grid md:grid-cols-2 gap-4">
                  {/* Work Day Loss */}
                  <FormField
                    control={form.control}
                    name="workDayLoss"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Çalışan İş Günü Kaybı</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            placeholder="0" 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            data-testid="input-work-day-loss"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Additional Training Date - only for work accidents */}
                  {isWorkAccident && (
                    <FormField
                      control={form.control}
                      name="additionalTrainingDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>İş Kazası Sonrası İlave Eğitim Tarihi</FormLabel>
                          <div className="flex gap-2">
                            <FormControl>
                              <Input
                                type="date"
                                {...field}
                                className="flex-1"
                                data-testid="input-training-date"
                              />
                            </FormControl>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  data-testid="button-training-date-calendar"
                                >
                                  <CalendarDays className="h-4 w-4" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <CalendarComponent
                                  mode="single"
                                  selected={field.value ? new Date(field.value) : undefined}
                                  onSelect={(date) => {
                                    if (date) {
                                      const formattedDate = format(date, "yyyy-MM-dd");
                                      field.onChange(formattedDate);
                                    }
                                  }}
                                  disabled={(date) => date < new Date()}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

              {/* Corrective Action */}
              <FormField
                control={form.control}
                name="correctiveAction"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Yapılan Düzeltici / Önleyici Faaliyet</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Uzman tarafından yapılan işlemlerle ilgili açıklama..." 
                        className="min-h-[100px]"
                        {...field}
                        data-testid="textarea-corrective-action"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Document Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle>Gerekli Belgeler</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* SGK Notification Form */}
              <div className="space-y-2">
                <FormLabel>SGK Bildirim Formu (PDF, JPEG, PNG)</FormLabel>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
                  {sgkFormUploaded ? (
                    <div className="space-y-3">
                      <div className="text-green-600 dark:text-green-400">
                        <CheckCircle2 className="h-12 w-12 mx-auto" />
                      </div>
                      <p className="text-sm font-medium text-green-700 dark:text-green-300">SGK Bildirim Formu yüklendi</p>
                      <div className="flex justify-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSgkFormUploaded("");
                            form.setValue('sgkNotificationFormUrl', '');
                          }}
                          data-testid="button-remove-sgk-form"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Kaldır
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <ObjectUploader
                      maxNumberOfFiles={1}
                      maxFileSize={10485760}
                      allowedFileTypes={['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', '.pdf', '.jpeg', '.jpg', '.png']}
                      onGetUploadParameters={getUploadParameters}
                      onComplete={(result) => {
                        if (result.successful && result.successful.length > 0) {
                          const uploadedFile = result.successful[0];
                          const fileUrl = uploadedFile.uploadURL || "";
                          setSgkFormUploaded(fileUrl);
                          form.setValue('sgkNotificationFormUrl', fileUrl);
                          toast({
                            description: "SGK Bildirim Formu başarıyla yüklendi"
                          });
                        }
                      }}
                      buttonClassName="w-full p-0 border-0 bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
                    >
                      <div className="space-y-3">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <div>
                          <p className="text-base font-medium text-gray-700 dark:text-gray-300">SGK Bildirim Formunu Yükleyin</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">PDF, JPEG, PNG formatında, maksimum 10MB</p>
                        </div>
                        <Button variant="outline" size="sm" data-testid="button-upload-sgk-form">
                          <FileText className="h-4 w-4 mr-2" />
                          Dosya Seç
                        </Button>
                      </div>
                    </ObjectUploader>
                  )}
                </div>
              </div>

              {/* Accident Analysis Form */}
              <div className="space-y-2">
                <FormLabel>İş Kazası / Ramak Kala Analiz Formu (PDF, JPEG, PNG)</FormLabel>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
                  {analysisFormUploaded ? (
                    <div className="space-y-3">
                      <div className="text-green-600 dark:text-green-400">
                        <CheckCircle2 className="h-12 w-12 mx-auto" />
                      </div>
                      <p className="text-sm font-medium text-green-700 dark:text-green-300">Analiz Formu yüklendi</p>
                      <div className="flex justify-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setAnalysisFormUploaded("");
                            form.setValue('accidentAnalysisFormUrl', '');
                          }}
                          data-testid="button-remove-analysis-form"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Kaldır
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <ObjectUploader
                      maxNumberOfFiles={1}
                      maxFileSize={10485760}
                      allowedFileTypes={['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', '.pdf', '.jpeg', '.jpg', '.png']}
                      onGetUploadParameters={getUploadParameters}
                      onComplete={(result) => {
                        if (result.successful && result.successful.length > 0) {
                          const uploadedFile = result.successful[0];
                          const fileUrl = uploadedFile.uploadURL || "";
                          setAnalysisFormUploaded(fileUrl);
                          form.setValue('accidentAnalysisFormUrl', fileUrl);
                          toast({
                            description: "Analiz Formu başarıyla yüklendi"
                          });
                        }
                      }}
                      buttonClassName="w-full p-0 border-0 bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
                    >
                      <div className="space-y-3">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <div>
                          <p className="text-base font-medium text-gray-700 dark:text-gray-300">Analiz Formunu Yükleyin</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">PDF, JPEG, PNG formatında, maksimum 10MB</p>
                        </div>
                        <Button variant="outline" size="sm" data-testid="button-upload-analysis-form">
                          <FileText className="h-4 w-4 mr-2" />
                          Dosya Seç
                        </Button>
                      </div>
                    </ObjectUploader>
                  )}
                </div>
              </div>

              <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded">
                <strong>Bilgi:</strong> Bu belgeler sisteme kaydedilecektir. Lütfen dosyalarınızı PDF, JPEG veya PNG formatında ve maksimum 10MB boyutunda olduğundan emin olun.
              </div>
            </CardContent>
          </Card>

          {/* Event Description */}
          <Card>
            <CardHeader>
              <CardTitle>Olay Açıklaması</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="eventDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Detaylı Açıklama</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Olayın detaylı açıklamasını girin..." 
                        className="min-h-[150px]"
                        {...field}
                        data-testid="textarea-event-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-end">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setLocation("/accident-management")}
              data-testid="button-cancel"
            >
              {isViewMode ? "Geri Dön" : "İptal"}
            </Button>
            {!isViewMode && (
              <Button 
                type="submit" 
                disabled={createAccidentMutation.isPending}
                data-testid="button-submit-accident"
              >
                {createAccidentMutation.isPending 
                  ? "Kaydediliyor..." 
                  : isEditMode 
                    ? "Güncelle" 
                    : "Kaydet"
                }
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}