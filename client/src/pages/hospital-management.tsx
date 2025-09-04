import React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useLocation } from "wouter";
import { useAuth } from "../hooks/useAuth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Building2, Save, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Hospital management schema (specialist can edit these fields)
const hospitalManagementSchema = z.object({
  name: z.string().min(1, "Hastane adı gereklidir"),
  shortName: z.string().optional(),
  phone: z.string().min(10, "Telefon numarası en az 10 karakter olmalıdır"),
  email: z.string().email("Geçerli bir e-posta adresi giriniz"),
  website: z.string().optional(),
  address: z.string().min(1, "Adres gereklidir"),
  naceCode: z.string().optional(),
  dangerClass: z.enum(["Çok Tehlikeli", "Tehlikeli", "Az Tehlikeli"]).optional(),
  sgkRegistrationNumber: z.string().optional(),
  taxNumber: z.string().optional(),
  legalRepresentative: z.string().optional(),
});

type HospitalManagementForm = z.infer<typeof hospitalManagementSchema>;

export default function HospitalManagement() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  // Get user's hospital
  const userHospital = user?.hospital;
  
  // Check if user is admin (can access admin endpoints)
  const isAdmin = user?.role === 'central_admin' || user?.role === 'admin';
  
  // Use admin endpoint only if user is admin, otherwise use hospital data from user object
  const { data: hospital, isLoading: hospitalLoading } = useQuery({
    queryKey: ["/api/admin/hospitals", userHospital?.id],
    enabled: !!userHospital?.id && isAdmin,
  });

  // Hospital data from user object or from API (admin users get fresh data)
  const hospitalData = isAdmin ? (hospital || userHospital) : userHospital;

  const form = useForm<HospitalManagementForm>({
    resolver: zodResolver(hospitalManagementSchema),
    defaultValues: {
      name: hospital?.name || "",
      shortName: hospital?.shortName || "",
      phone: hospital?.phone || "",
      email: hospital?.email || "",
      website: hospital?.website || "",
      address: hospital?.address || "",
      naceCode: hospital?.naceCode || "",
      dangerClass: hospital?.dangerClass || undefined,
      sgkRegistrationNumber: hospital?.sgkRegistrationNumber || "",
      taxNumber: hospital?.taxNumber || "",
      legalRepresentative: hospital?.legalRepresentative || "",
    },
  });

  // Update form when hospital data loads
  React.useEffect(() => {
    if (hospitalData) {
      form.reset({
        name: hospitalData.name || "",
        shortName: hospitalData.shortName || "",
        phone: hospitalData.phone || "",
        email: hospitalData.email || "",
        website: hospitalData.website || "",
        address: hospitalData.address || "",
        naceCode: hospitalData.naceCode || "",
        dangerClass: hospitalData.dangerClass || undefined,
        sgkRegistrationNumber: hospitalData.sgkRegistrationNumber || "",
        taxNumber: hospitalData.taxNumber || "",
        legalRepresentative: hospitalData.legalRepresentative || "",
      });
    }
  }, [hospitalData, form]);

  const updateHospitalMutation = useMutation({
    mutationFn: (data: HospitalManagementForm) =>
      isAdmin 
        ? apiRequest('PUT', `/api/admin/hospitals/${userHospital?.id}`, data)
        : apiRequest('PUT', `/api/specialist/hospital`, data),
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Hastane bilgileri güncellendi",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/hospitals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/me"] });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Hastane bilgileri güncellenirken hata oluştu",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: HospitalManagementForm) => {
    updateHospitalMutation.mutate(data);
  };

  if (!userHospital) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Hastane Ataması Bulunamadı
            </h2>
            <p className="text-gray-600">
              Hastane bilgilerini düzenlemek için bir hastaneye atanmış olmanız gerekir.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (hospitalLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => setLocation('/dashboard')}
            data-testid="button-back-dashboard"
          >
            <ArrowLeft size={16} className="mr-2" />
            Ana Sayfa
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Hastane Yönetimi</h1>
            <p className="text-gray-600 mt-1">
              Hastane bilgilerini güncelleyin
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Building2 className="w-6 h-6 text-primary" />
          <span className="text-lg font-semibold text-gray-900">
            {hospitalData?.name}
          </span>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Temel Bilgiler</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hastane Adı</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Hastane adını giriniz" 
                          {...field} 
                          data-testid="input-hospital-name" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="shortName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kısa Ad</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Kısa ad (opsiyonel)" 
                          {...field} 
                          value={field.value || ""}
                          data-testid="input-hospital-short-name" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* İSG Specific Fields */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">İSG Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="naceCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>NACE Kodu</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="NACE kodunu giriniz" 
                          {...field} 
                          value={field.value || ""}
                          data-testid="input-nace-code" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dangerClass"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tehlike Sınıfı</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger data-testid="select-danger-class">
                            <SelectValue placeholder="Tehlike sınıfı seçiniz" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Çok Tehlikeli">Çok Tehlikeli</SelectItem>
                          <SelectItem value="Tehlikeli">Tehlikeli</SelectItem>
                          <SelectItem value="Az Tehlikeli">Az Tehlikeli</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sgkRegistrationNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SGK Sicil Numarası</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="SGK sicil numarasını giriniz" 
                          {...field} 
                          value={field.value || ""}
                          data-testid="input-sgk-registration" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">İletişim Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefon</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Telefon numarası" 
                          {...field} 
                          data-testid="input-hospital-phone" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-posta</FormLabel>
                      <FormControl>
                        <Input 
                          type="email"
                          placeholder="E-posta adresi" 
                          {...field} 
                          data-testid="input-hospital-email" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Web Adresi</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Web adresi (opsiyonel)" 
                          {...field} 
                          value={field.value || ""}
                          data-testid="input-hospital-website" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Legal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Yasal Bilgiler</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="taxNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vergi Numarası</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Vergi numarası (opsiyonel)" 
                          {...field} 
                          value={field.value || ""}
                          data-testid="input-tax-number" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="legalRepresentative"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Yasal Temsilci</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Yasal temsilci (opsiyonel)" 
                          {...field} 
                          value={field.value || ""}
                          data-testid="input-legal-representative" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adres</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Hastane adresini giriniz"
                        {...field} 
                        data-testid="textarea-hospital-address"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button 
              type="submit"
              disabled={updateHospitalMutation.isPending}
              data-testid="button-save-hospital"
            >
              <Save size={16} className="mr-2" />
              {updateHospitalMutation.isPending ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}