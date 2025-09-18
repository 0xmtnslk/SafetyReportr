"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { HybridDateInput } from "@/components/ui/hybrid-date-input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { cn } from "@/lib/utils";

// Import our data constants
import {
  EVENT_TYPES,
  WORK_SHIFTS,
  EVENT_AREAS,
  EVENT_PLACES,
  getEventPlacesByArea,
  EMPLOYEE_STATUS,
  PROFESSION_GROUPS,
  DEPARTMENTS,
  POSITIONS,
} from "@/constants/accident-management-data";

// Form validation schema
const accidentReportSchema = z.object({
  // Basic Event Information
  eventDate: z.date({
    required_error: "Olayın gerçekleştiği tarih zorunludur",
  }),
  eventTime: z.string().min(1, "Olayın gerçekleştiği saat zorunludur"),
  eventType: z.string().min(1, "Olay türü zorunludur"),
  workShift: z.string().min(1, "Mesai dilimi zorunludur"),
  
  // Location Information
  eventArea: z.string().min(1, "Olayın gerçekleştiği alan zorunludur"),
  eventPlace: z.string().min(1, "Olayın gerçekleştiği yer zorunludur"),
  
  // Official Information
  sgkNotificationDate: z.date().optional(),
  
  // Employee Information
  employeeRegistrationNumber: z.string().min(1, "Personel sicil numarası zorunludur"),
  employeeName: z.string().min(1, "Ad-Soyad zorunludur"),
  employeeStartDate: z.date({
    required_error: "İşe başlama tarihi zorunludur",
  }),
  
  // Employee Classification
  employeeStatus: z.string().min(1, "Personel statüsü zorunludur"),
  professionGroup: z.string().min(1, "Meslek grubu zorunludur"),
  department: z.string().min(1, "Departman zorunludur"),
  position: z.string().min(1, "Görev/Unvan zorunludur"),
});

type AccidentReportFormValues = z.infer<typeof accidentReportSchema>;

interface AccidentReportDialogProps {
  children: React.ReactNode;
  onSubmit?: (data: AccidentReportFormValues & { workDurationDays: number }) => void;
}

export function AccidentReportDialog({ children, onSubmit }: AccidentReportDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  
  // React Query mutation for creating accident record
  const createAccidentRecordMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/accident-records", data),
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Kaza kaydı başarıyla oluşturuldu.",
      });
      // Invalidate accident records query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/accident-records"] });
      setOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Kaza kaydı oluşturulurken bir hata oluştu.",
        variant: "destructive",
      });
    },
  });
  
  const form = useForm<AccidentReportFormValues>({
    resolver: zodResolver(accidentReportSchema),
    defaultValues: {
      eventTime: "",
      eventType: "",
      workShift: "",
      eventArea: "",
      eventPlace: "",
      employeeRegistrationNumber: "",
      employeeName: "",
      employeeStatus: "",
      professionGroup: "",
      department: "",
      position: "",
    },
  });

  // Watch for changes in event area to update event places
  const selectedEventArea = form.watch("eventArea");
  const availablePlaces = getEventPlacesByArea(selectedEventArea);

  // Calculate work duration in days
  const eventDate = form.watch("eventDate");
  const employeeStartDate = form.watch("employeeStartDate");
  
  const calculateWorkDuration = () => {
    if (eventDate && employeeStartDate) {
      const diffTime = eventDate.getTime() - employeeStartDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(0, diffDays);
    }
    return 0;
  };

  // Reset event place when event area changes
  const handleEventAreaChange = (value: string) => {
    form.setValue("eventArea", value);
    form.setValue("eventPlace", ""); // Reset place when area changes
  };

  const handleSubmit = (data: AccidentReportFormValues) => {
    const workDurationDays = calculateWorkDuration();
    
    // Prepare data for the API - locationId will be enforced by backend based on user's location
    const submitData: any = {
      ...data,
      workDurationDays,
      // Backend will set locationId from user context for security
      // Convert date objects to ISO strings for the API (schema handles both formats)
      eventDate: data.eventDate.toISOString(),
      employeeStartDate: data.employeeStartDate.toISOString(),
    };
    
    // Only include sgkNotificationDate if it has a value (send undefined, not null)
    if (data.sgkNotificationDate) {
      submitData.sgkNotificationDate = data.sgkNotificationDate.toISOString();
    }
    
    createAccidentRecordMutation.mutate(submitData);
    
    // Also call the onSubmit prop if provided (for backward compatibility)
    if (onSubmit) {
      onSubmit({ ...data, workDurationDays });
    }
  };

  const workDurationDays = calculateWorkDuration();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Yeni Olay Bildir</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            
            {/* Basic Event Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Olay Bilgileri</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Event Date */}
                <FormField
                  control={form.control}
                  name="eventDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Olayın Gerçekleştiği Tarih*</FormLabel>
                      <FormControl>
                        <HybridDateInput
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="GG/AA/YYYY - Olay tarihini giriniz"
                          maxDate={new Date()}
                          minDate={new Date("1900-01-01")}
                          required
                          data-testid="input-event-date"
                        />
                      </FormControl>
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
                      <FormLabel>Olayın Gerçekleştiği Saat*</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="time"
                          data-testid="input-event-time"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Event Type */}
                <FormField
                  control={form.control}
                  name="eventType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Olay Türü*</FormLabel>
                      <FormControl>
                        <SearchableSelect
                          options={EVENT_TYPES}
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Olay türünü seçiniz"
                          searchPlaceholder="Olay türü ara..."
                          data-testid="select-event-type"
                        />
                      </FormControl>
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
                      <FormLabel>Olayın Gerçekleştiği Mesai Dilimi*</FormLabel>
                      <FormControl>
                        <SearchableSelect
                          options={WORK_SHIFTS}
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Mesai dilimini seçiniz"
                          searchPlaceholder="Mesai dilimi ara..."
                          data-testid="select-work-shift"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Location Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Lokasyon Bilgileri</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Event Area */}
                <FormField
                  control={form.control}
                  name="eventArea"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Olayın Gerçekleştiği Alan*</FormLabel>
                      <FormControl>
                        <SearchableSelect
                          options={EVENT_AREAS}
                          value={field.value}
                          onValueChange={handleEventAreaChange}
                          placeholder="Alanı seçiniz"
                          searchPlaceholder="Alan ara..."
                          data-testid="select-event-area"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Event Place */}
                <FormField
                  control={form.control}
                  name="eventPlace"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Olayın Gerçekleştiği Yer*</FormLabel>
                      <FormControl>
                        <SearchableSelect
                          options={availablePlaces}
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder={selectedEventArea ? "Yeri seçiniz" : "Önce alan seçiniz"}
                          searchPlaceholder="Yer ara..."
                          disabled={!selectedEventArea}
                          data-testid="select-event-place"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Official Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Resmi Bilgiler</h3>
              
              {/* SGK Notification Date */}
              <FormField
                control={form.control}
                name="sgkNotificationDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SGK'ya Bildirim Tarihi</FormLabel>
                    <FormControl>
                      <HybridDateInput
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="GG/AA/YYYY - SGK bildirim tarihi (opsiyonel)"
                        maxDate={new Date()}
                        minDate={new Date("1900-01-01")}
                        data-testid="input-sgk-date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Employee Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Personel Bilgileri</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Employee Registration Number */}
                <FormField
                  control={form.control}
                  name="employeeRegistrationNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Personel Sicil No*</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Sicil numarasını giriniz"
                          data-testid="input-employee-id"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Employee Name */}
                <FormField
                  control={form.control}
                  name="employeeName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ad - Soyad*</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Ad ve soyadını giriniz"
                          data-testid="input-employee-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Employee Start Date */}
                <FormField
                  control={form.control}
                  name="employeeStartDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>İşe Başlama Tarihi*</FormLabel>
                      <FormControl>
                        <HybridDateInput
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="GG/AA/YYYY - İşe başlama tarihini giriniz"
                          maxDate={new Date()}
                          minDate={new Date("1950-01-01")}
                          required
                          data-testid="input-employee-start-date"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Work Duration (Auto-calculated) */}
                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Çalışma Süresi (Gün)
                  </label>
                  <div className="px-3 py-2 border border-input bg-muted rounded-md">
                    <span className="text-sm text-muted-foreground" data-testid="text-work-duration">
                      {workDurationDays} gün
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Employee Classification Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Personel Sınıflandırması</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Employee Status */}
                <FormField
                  control={form.control}
                  name="employeeStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Statüsü*</FormLabel>
                      <FormControl>
                        <SearchableSelect
                          options={EMPLOYEE_STATUS}
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Statüyü seçiniz"
                          searchPlaceholder="Statü ara..."
                          data-testid="select-employee-status"
                        />
                      </FormControl>
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
                      <FormLabel>Meslek Grubu*</FormLabel>
                      <FormControl>
                        <SearchableSelect
                          options={PROFESSION_GROUPS}
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Meslek grubunu seçiniz"
                          searchPlaceholder="Meslek grubu ara..."
                          data-testid="select-profession-group"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Department */}
                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Departmanı*</FormLabel>
                      <FormControl>
                        <SearchableSelect
                          options={DEPARTMENTS}
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Departmanı seçiniz"
                          searchPlaceholder="Departman ara..."
                          data-testid="select-department"
                        />
                      </FormControl>
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
                      <FormLabel>Görevi / Unvanı*</FormLabel>
                      <FormControl>
                        <SearchableSelect
                          options={POSITIONS}
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Görevi/unvanı seçiniz"
                          searchPlaceholder="Görev/unvan ara..."
                          data-testid="select-position"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-2 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                data-testid="button-cancel"
              >
                İptal
              </Button>
              <Button 
                type="submit" 
                disabled={createAccidentRecordMutation.isPending}
                data-testid="button-submit"
              >
                {createAccidentRecordMutation.isPending ? "Kaydediliyor..." : "Olay Bildir"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}