import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { format, differenceInDays } from "date-fns";
import { tr } from "date-fns/locale";
import { Calendar, CalendarDays, Clock } from "lucide-react";

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

import {
  WORK_SHIFTS,
  EVENT_TYPES,
  EVENT_AREAS,
  EVENT_PLACES,
  EMPLOYEE_STATUS,
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
  eventDescription: z.string().min(10, "Olay açıklaması en az 10 karakter olmalıdır")
});

type AccidentFormData = z.infer<typeof accidentFormSchema>;

export default function AccidentDetailsPage() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedArea, setSelectedArea] = useState<string>("");
  const [selectedCauseType, setSelectedCauseType] = useState<string>("");

  // Get current user information for hospital context
  const { data: currentUser } = useQuery({
    queryKey: ["/api/auth/me"],
    enabled: true
  });

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
      eventDescription: ""
    }
  });

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
    createAccidentMutation.mutate(data);
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

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold" data-testid="title-accident-details">
          Olay Bildir - {watchEventType} Formu
        </h1>
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
              İptal
            </Button>
            <Button 
              type="submit" 
              disabled={createAccidentMutation.isPending}
              data-testid="button-submit-accident"
            >
              {createAccidentMutation.isPending ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}