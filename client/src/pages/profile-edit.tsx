import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { User, editUserProfileSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Camera, Save, User as UserIcon } from "lucide-react";

// Form schema based on the editUserProfileSchema
const profileFormSchema = editUserProfileSchema;

type ProfileFormData = z.infer<typeof profileFormSchema>;

export default function ProfileEdit() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current user info
  const { data: currentUser } = useQuery<User>({
    queryKey: ["/api/user/me"],
  });

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      position: "",
      department: "",
      language: "Türkçe",
      certificateNumber: "",
      safetySpecialistClass: undefined,
      phone2: "",
      mobilPhone1: "",
      mobilPhone2: "",
      fax: "",
      website: "",
      province: "",
      district: "",
      postalCode: "",
      address: "",
      userType: "",
    },
  });

  // Load user data when available
  useEffect(() => {
    if (currentUser) {
      form.reset({
        fullName: currentUser.fullName || "",
        email: currentUser.email || "",
        phone: currentUser.phone || "",
        position: currentUser.position || "",
        department: currentUser.department || "",
        language: currentUser.language || "Türkçe",
        certificateNumber: currentUser.certificateNumber || "",
        safetySpecialistClass: currentUser.safetySpecialistClass as "A" | "B" | "C" | undefined,
        phone2: currentUser.phone2 || "",
        mobilPhone1: currentUser.mobilPhone1 || "",
        mobilPhone2: currentUser.mobilPhone2 || "",
        fax: currentUser.fax || "",
        website: currentUser.website || "",
        province: currentUser.province || "",
        district: currentUser.district || "",
        postalCode: currentUser.postalCode || "",
        address: currentUser.address || "",
        userType: currentUser.userType || "",
      });
    }
  }, [currentUser, form]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Profile update failed");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Profiliniz başarıyla güncellendi.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/me"] });
      setLocation("/dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Profil güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/dashboard")}
              data-testid="button-back"
            >
              <ArrowLeft size={16} className="mr-2" />
              Geri
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <UserIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Profil Düzenle</h1>
                <p className="text-sm text-gray-600">Kişisel bilgilerinizi güncelleyin</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Personal Information Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Kişisel Bilgiler</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Profile Image */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                      {currentUser.profileImage ? (
                        <img
                          src={currentUser.profileImage}
                          alt="Profile"
                          className="w-20 h-20 rounded-full object-cover"
                        />
                      ) : (
                        <UserIcon className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full p-0"
                      data-testid="button-change-photo"
                    >
                      <Camera size={14} />
                    </Button>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Profil Fotoğrafı</p>
                    <p className="text-xs text-gray-500">Fotoğrafınızı değiştirmek için kameraya tıklayın</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kullanıcı Adı</FormLabel>
                        <FormControl>
                          <Input placeholder="Adınızı ve soyadınızı giriniz" {...field} data-testid="input-fullname" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Kullanıcı Kodu</label>
                    <Input
                      value={currentUser.username}
                      disabled
                      className="bg-gray-50"
                      data-testid="input-username-readonly"
                    />
                    <p className="text-xs text-gray-500">Kullanıcı kodu değiştirilemez</p>
                  </div>

                  <FormField
                    control={form.control}
                    name="position"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Adi</FormLabel>
                        <FormControl>
                          <Input placeholder="Pozisyon" {...field} value={field.value || ""} data-testid="input-position" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="language"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Soyadi</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-language">
                              <SelectValue placeholder="Dil seçiniz" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Türkçe">Türkçe</SelectItem>
                            <SelectItem value="English">English</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kullanıcı Dili</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-department">
                              <SelectValue placeholder="Departman seçiniz" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Türkçe">Türkçe</SelectItem>
                            <SelectItem value="English">English</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="safetySpecialistClass"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kullanıcı Sapi Gilimi</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-specialist-class">
                              <SelectValue placeholder="Sınıf seçiniz" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="A">A Sınıfı</SelectItem>
                            <SelectItem value="B">B Sınıfı</SelectItem>
                            <SelectItem value="C">C Sınıfı</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Kayit Tarihi</label>
                    <Input
                      value={currentUser.createdAt ? new Date(currentUser.createdAt).toLocaleDateString('tr-TR') : ''}
                      disabled
                      className="bg-gray-50"
                      data-testid="input-registration-date"
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="certificateNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sicil No</FormLabel>
                        <FormControl>
                          <Input placeholder="Sicil numarası" {...field} value={field.value || ""} data-testid="input-certificate-number" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="userType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>İdari Yönetici</FormLabel>
                        <FormControl>
                          <Input placeholder="İdari pozisyon" {...field} value={field.value || ""} data-testid="input-user-type" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Contact Information Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">İletişim Bilgileri</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="province"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>İl</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-province">
                              <SelectValue placeholder="İl seçiniz" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="İstanbul">İstanbul</SelectItem>
                            <SelectItem value="Ankara">Ankara</SelectItem>
                            <SelectItem value="İzmir">İzmir</SelectItem>
                            <SelectItem value="Bursa">Bursa</SelectItem>
                            <SelectItem value="Antalya">Antalya</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="district"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>İlçesi</FormLabel>
                        <FormControl>
                          <Input placeholder="İlçe" {...field} data-testid="input-district" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="postalCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Posta Kodu</FormLabel>
                        <FormControl>
                          <Input placeholder="Posta kodu" {...field} data-testid="input-postal-code" />
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
                        <FormLabel>Elektronik Posta</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="email@example.com" {...field} data-testid="input-email" />
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
                          placeholder="Tam adresinizi giriniz"
                          className="min-h-[80px]"
                          {...field}
                          data-testid="textarea-address"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Phone Numbers Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefon (1)</FormLabel>
                        <FormControl>
                          <Input placeholder="+90" {...field} data-testid="input-phone1" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone2"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefon (2)</FormLabel>
                        <FormControl>
                          <Input placeholder="+90" {...field} data-testid="input-phone2" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="mobilPhone1"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cep Telefonu (1)</FormLabel>
                        <FormControl>
                          <Input placeholder="+90 543 726 28 19" {...field} data-testid="input-mobile1" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="mobilPhone2"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cep Telefonu (2)</FormLabel>
                        <FormControl>
                          <Input placeholder="+90" {...field} data-testid="input-mobile2" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fax"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Faks</FormLabel>
                        <FormControl>
                          <Input placeholder="Faks numarası" {...field} data-testid="input-fax" />
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
                          <Input placeholder="https://example.com" {...field} data-testid="input-website" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* User Properties Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Kullanıcı Özellikleri</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Kullanıcı Türü</label>
                    <Select value={currentUser.role} disabled>
                      <SelectTrigger className="bg-gray-50" data-testid="select-user-role">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="central_admin">Merkez Yöneticisi</SelectItem>
                        <SelectItem value="safety_specialist">İş Güvenliği Uzmanı</SelectItem>
                        <SelectItem value="occupational_physician">İşyeri Hekimi</SelectItem>
                        <SelectItem value="responsible_manager">Sorumlu Müdür</SelectItem>
                        <SelectItem value="user">Kullanıcı</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">Kullanıcı türü değiştirilemez</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation("/dashboard")}
                data-testid="button-cancel"
              >
                İptal
              </Button>
              <Button
                type="submit"
                disabled={updateProfileMutation.isPending}
                data-testid="button-save"
              >
                {updateProfileMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Kaydediliyor...
                  </>
                ) : (
                  <>
                    <Save size={16} className="mr-2" />
                    Kaydet
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}