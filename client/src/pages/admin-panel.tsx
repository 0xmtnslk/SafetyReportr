import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Users, UserPlus, Edit, Trash2, Shield, MapPin, Key, Building2, Phone, Mail, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Helper function to get role display names
const getRoleDisplayName = (role: string) => {
  const roleNames: Record<string, string> = {
    'central_admin': 'Merkez Yönetim (ADMIN)',
    'safety_specialist': 'İş Güvenliği Uzmanı',
    'occupational_physician': 'İşyeri Hekimi',
    'responsible_manager': 'Sorumlu Müdür',
    'user': 'Normal Kullanıcı'
  };
  return roleNames[role] || role;
};

// Örnek lokasyonlar (placeholder için)
const LOCATION_EXAMPLES = [
  "Topkapı Liv Hastanesi",
  "GOP MedicalPark",
  "Merkez Hastane",
  "Anadolu Sağlık Merkezi"
];

// User type from shared schema
interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  profileImage?: string;
  role: 'central_admin' | 'safety_specialist' | 'occupational_physician' | 'responsible_manager' | 'user';
  position?: string;
  department?: string;
  location?: string;
  locationId?: string;
  firstLogin: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Location type from shared schema
interface Location {
  id: string;
  name: string;
  shortName?: string;
  logo?: string;
  type: 'hospital' | 'medical_center' | 'clinic' | 'office';
  phone: string;
  email: string;
  website?: string;
  address: string;
  district: string;
  city: string;
  postalCode?: string;
  country: string;
  taxNumber?: string;
  legalRepresentative?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Form schemas
const createUserSchema = z.object({
  username: z.string().min(3, "Kullanıcı adı en az 3 karakter olmalıdır"),
  fullName: z.string().min(2, "Ad soyad en az 2 karakter olmalıdır"),
  role: z.enum(['central_admin', 'safety_specialist', 'occupational_physician', 'responsible_manager', 'user'], 
    { required_error: "Rol seçiniz" }),
  position: z.string().optional(),
  location: z.string().optional(),
  locationId: z.string().optional(),
  password: z.string().optional()
});

const editUserSchema = z.object({
  username: z.string().min(3, "Kullanıcı adı en az 3 karakter olmalıdır"),
  fullName: z.string().min(2, "Ad soyad en az 2 karakter olmalıdır"),
  email: z.string().email("Geçerli bir e-posta adresi giriniz"),
  phone: z.string().min(10, "Telefon numarası en az 10 karakter olmalıdır"),
  role: z.enum(['central_admin', 'safety_specialist', 'occupational_physician', 'responsible_manager', 'user'], 
    { required_error: "Rol seçiniz" }),
  position: z.string().optional(),
  department: z.string().optional(),
  location: z.string().optional(),
  locationId: z.string().optional(),
  isActive: z.boolean()
});

// Hospital schemas
const createHospitalSchema = z.object({
  name: z.string().min(1, "Hastane adı gerekli"),
  shortName: z.string().optional(),
  address: z.string().min(1, "Adres gerekli"),
  phone: z.string().min(1, "Telefon gerekli"),
  email: z.string().email("Geçerli email gerekli"),
  website: z.string().url().optional().or(z.literal("")),
  district: z.string().min(1, "İlçe gerekli"),
  city: z.string().min(1, "Şehir gerekli"),
  postalCode: z.string().optional(),
  country: z.string().default("Türkiye"),
  taxNumber: z.string().optional(),
  legalRepresentative: z.string().optional(),
  type: z.enum(["hospital", "medical_center", "clinic", "office"]).default("hospital"),
  isActive: z.boolean().default(true)
});

const editHospitalSchema = createHospitalSchema.extend({
  isActive: z.boolean()
});

type CreateUserForm = z.infer<typeof createUserSchema>;
type EditUserForm = z.infer<typeof editUserSchema>;
type CreateHospitalForm = z.infer<typeof createHospitalSchema>;
type EditHospitalForm = z.infer<typeof editHospitalSchema>;

export default function AdminPanel() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  // Hospital state
  const [isCreateHospitalDialogOpen, setIsCreateHospitalDialogOpen] = useState(false);
  const [isEditHospitalDialogOpen, setIsEditHospitalDialogOpen] = useState(false);
  const [editingHospital, setEditingHospital] = useState<Location | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch users
  const { data: users, isLoading, error } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
  });

  // Fetch hospitals
  const { data: hospitals, isLoading: isHospitalsLoading, error: hospitalsError } = useQuery<Location[]>({
    queryKey: ['/api/admin/hospitals'],
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: (userData: CreateUserForm) => 
      apiRequest('POST', '/api/admin/users', userData),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setIsCreateDialogOpen(false);
      createForm.reset();
      toast({
        title: "Başarılı",
        description: data.message || "Kullanıcı başarıyla oluşturuldu",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Kullanıcı oluşturulurken hata oluştu",
        variant: "destructive",
      });
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: ({ id, userData }: { id: string; userData: EditUserForm }) => 
      apiRequest('PUT', `/api/admin/users/${id}`, userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setIsEditDialogOpen(false);
      setEditingUser(null);
      editForm.reset();
      toast({
        title: "Başarılı",
        description: "Kullanıcı başarıyla güncellendi",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Kullanıcı güncellenirken hata oluştu",
        variant: "destructive",
      });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => 
      apiRequest('DELETE', `/api/admin/users/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "Başarılı",
        description: "Kullanıcı başarıyla silindi",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Kullanıcı silinirken hata oluştu",
        variant: "destructive",
      });
    },
  });

  // Hospital Mutations
  // Create hospital mutation
  const createHospitalMutation = useMutation({
    mutationFn: (hospitalData: CreateHospitalForm) => 
      apiRequest('POST', '/api/admin/hospitals', hospitalData),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/hospitals'] });
      setIsCreateHospitalDialogOpen(false);
      createHospitalForm.reset();
      toast({
        title: "Başarılı",
        description: data.message || "Hastane başarıyla oluşturuldu",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Hastane oluşturulurken hata oluştu",
        variant: "destructive",
      });
    },
  });

  // Update hospital mutation
  const updateHospitalMutation = useMutation({
    mutationFn: ({ id, hospitalData }: { id: string; hospitalData: EditHospitalForm }) => 
      apiRequest('PUT', `/api/admin/hospitals/${id}`, hospitalData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/hospitals'] });
      setIsEditHospitalDialogOpen(false);
      setEditingHospital(null);
      editHospitalForm.reset();
      toast({
        title: "Başarılı",
        description: "Hastane başarıyla güncellendi",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Hastane güncellenirken hata oluştu",
        variant: "destructive",
      });
    },
  });

  // Delete hospital mutation
  const deleteHospitalMutation = useMutation({
    mutationFn: (hospitalId: string) => 
      apiRequest('DELETE', `/api/admin/hospitals/${hospitalId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/hospitals'] });
      toast({
        title: "Başarılı",
        description: "Hastane başarıyla silindi",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Hastane silinirken hata oluştu",
        variant: "destructive",
      });
    },
  });

  // Forms
  const createForm = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      username: "",
      fullName: "",
      role: "user",
      location: "",
      password: ""
    },
  });

  const editForm = useForm<EditUserForm>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      username: "",
      fullName: "",
      role: "user",
      location: "",
      isActive: true
    },
  });

  // Hospital Forms
  const createHospitalForm = useForm<CreateHospitalForm>({
    resolver: zodResolver(createHospitalSchema),
    defaultValues: {
      name: "",
      shortName: "",
      address: "",
      phone: "",
      email: "",
      website: "",
      district: "",
      city: "",
      postalCode: "",
      country: "Türkiye",
      taxNumber: "",
      legalRepresentative: "",
      type: "hospital",
      isActive: true
    },
  });

  const editHospitalForm = useForm<EditHospitalForm>({
    resolver: zodResolver(editHospitalSchema),
    defaultValues: {
      name: "",
      shortName: "",
      address: "",
      phone: "",
      email: "",
      website: "",
      district: "",
      city: "",
      postalCode: "",
      country: "Türkiye",
      taxNumber: "",
      legalRepresentative: "",
      type: "hospital",
      isActive: true
    },
  });

  // Handle create user
  const onCreateSubmit = (data: CreateUserForm) => {
    createUserMutation.mutate(data);
  };

  // Handle edit user
  const onEditSubmit = (data: EditUserForm) => {
    if (editingUser) {
      updateUserMutation.mutate({ id: editingUser.id, userData: data });
    }
  };

  // Generate random password
  const generatePassword = () => {
    const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  };

  // Handle create dialog open
  const handleCreateDialogOpen = () => {
    const autoPassword = generatePassword();
    createForm.setValue("password", autoPassword);
    setIsCreateDialogOpen(true);
  };

  // Handle edit dialog open
  const handleEditUser = (user: User) => {
    setEditingUser(user);
    editForm.setValue("username", user.username);
    editForm.setValue("fullName", user.fullName);
    editForm.setValue("role", user.role);
    editForm.setValue("location", user.location);
    editForm.setValue("isActive", user.isActive);
    setIsEditDialogOpen(true);
  };

  // Handle delete user
  const handleDeleteUser = (userId: string) => {
    deleteUserMutation.mutate(userId);
  };

  // Hospital Handlers
  // Handle create hospital
  const onCreateHospitalSubmit = (data: CreateHospitalForm) => {
    createHospitalMutation.mutate(data);
  };

  // Handle edit hospital
  const onEditHospitalSubmit = (data: EditHospitalForm) => {
    if (editingHospital) {
      updateHospitalMutation.mutate({ id: editingHospital.id, hospitalData: data });
    }
  };

  // Handle edit hospital dialog open
  const handleEditHospital = (hospital: Location) => {
    setEditingHospital(hospital);
    editHospitalForm.setValue("name", hospital.name);
    editHospitalForm.setValue("shortName", hospital.shortName || "");
    editHospitalForm.setValue("address", hospital.address || "");
    editHospitalForm.setValue("phone", hospital.phone || "");
    editHospitalForm.setValue("email", hospital.email || "");
    editHospitalForm.setValue("website", hospital.website || "");
    editHospitalForm.setValue("district", hospital.district || "");
    editHospitalForm.setValue("city", hospital.city || "");
    editHospitalForm.setValue("postalCode", hospital.postalCode || "");
    editHospitalForm.setValue("country", hospital.country || "Türkiye");
    editHospitalForm.setValue("taxNumber", hospital.taxNumber || "");
    editHospitalForm.setValue("legalRepresentative", hospital.legalRepresentative || "");
    editHospitalForm.setValue("type", hospital.type || "hospital");
    editHospitalForm.setValue("isActive", hospital.isActive);
    setIsEditHospitalDialogOpen(true);
  };

  // Handle delete hospital
  const handleDeleteHospital = (hospitalId: string) => {
    deleteHospitalMutation.mutate(hospitalId);
  };

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-red-600">
              Admin paneline erişilirken hata oluştu. Bu sayfaya erişim yetkiniz bulunmuyor olabilir.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold">Admin Paneli</h1>
            <p className="text-muted-foreground">Kullanıcı yönetimi ve sistem ayarları</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Kullanıcı Yönetimi
          </TabsTrigger>
          <TabsTrigger value="hospitals" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Hastane Yönetimi
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          {/* Users Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Toplam Kullanıcı</p>
                    <p className="text-2xl font-bold">{users?.length || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Admin Kullanıcı</p>
                    <p className="text-2xl font-bold">
                      {users?.filter(u => ['central_admin', 'location_manager'].includes(u.role)).length || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-amber-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">İlk Giriş Bekleyen</p>
                    <p className="text-2xl font-bold">
                      {users?.filter(u => u.firstLogin).length || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Add User Button */}
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Kullanıcılar</h2>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="flex items-center gap-2" 
                  onClick={handleCreateDialogOpen}
                  data-testid="button-add-user"
                >
                  <UserPlus className="h-4 w-4" />
                  Kullanıcı Ekle
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Yeni Kullanıcı Ekle</DialogTitle>
                  <DialogDescription>
                    Sisteme yeni kullanıcı ekleyin. Şifre belirtilmezse otomatik üretilir.
                  </DialogDescription>
                </DialogHeader>
                <Form {...createForm}>
                  <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                    <FormField
                      control={createForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Kullanıcı Adı</FormLabel>
                          <FormControl>
                            <Input placeholder="kullanici_adi" {...field} data-testid="input-username" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ad Soyad</FormLabel>
                          <FormControl>
                            <Input placeholder="Ad Soyad" {...field} data-testid="input-fullname" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rol</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-role">
                                <SelectValue placeholder="Rol seçiniz" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="user">Normal Kullanıcı</SelectItem>
                              <SelectItem value="responsible_manager">Sorumlu Müdür</SelectItem>
                              <SelectItem value="occupational_physician">İşyeri Hekimi</SelectItem>
                              <SelectItem value="safety_specialist">İş Güvenliği Uzmanı</SelectItem>
                              <SelectItem value="central_admin">Merkez Yönetim (ADMIN)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="position"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pozisyon</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Örn: İş Güvenliği Uzmanı, Teknik Müdür" 
                              data-testid="input-position"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={createForm.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lokasyon</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Örn: Topkapı Liv Hastanesi, GOP MedicalPark"
                              {...field} 
                              data-testid="input-location"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Şifre</FormLabel>
                          <div className="flex gap-2">
                            <FormControl>
                              <Input 
                                type="text" 
                                placeholder="Otomatik üretildi"
                                {...field} 
                                data-testid="input-password"
                              />
                            </FormControl>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                const newPassword = generatePassword();
                                createForm.setValue("password", newPassword);
                              }}
                              data-testid="button-generate-password"
                            >
                              Yenile
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Bu şifreyi kullanıcıya verin. İlk girişte değiştirmesi gerekecek.
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex gap-2 pt-4">
                      <Button 
                        type="submit" 
                        disabled={createUserMutation.isPending}
                        data-testid="button-submit-create"
                      >
                        {createUserMutation.isPending ? "Oluşturuluyor..." : "Kullanıcı Oluştur"}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsCreateDialogOpen(false)}
                        data-testid="button-cancel-create"
                      >
                        İptal
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Users Table */}
          <Card>
            <CardContent className="p-6">
              {isLoading ? (
                <div className="text-center py-8">
                  <p>Kullanıcılar yükleniyor...</p>
                </div>
              ) : users?.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Hiç kullanıcı bulunamadı.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {users?.map((user) => (
                    <div 
                      key={user.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                      data-testid={`user-card-${user.id}`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold" data-testid={`text-username-${user.id}`}>
                            {user.fullName}
                          </h3>
                          <Badge variant={['central_admin', 'location_manager', 'safety_specialist'].includes(user.role) ? 'default' : 'secondary'}>
                            {getRoleDisplayName(user.role)}
                          </Badge>
                          {user.firstLogin && (
                            <Badge variant="outline" className="text-amber-600">
                              İlk Giriş
                            </Badge>
                          )}
                          {!user.isActive && (
                            <Badge variant="destructive">
                              Pasif
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span data-testid={`text-login-${user.id}`}>@{user.username}</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {user.location || 'Lokasyon belirtilmemiş'}
                          </span>
                          {user.position && (
                            <span className="text-sm text-blue-600">
                              {user.position}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditUser(user)}
                          data-testid={`button-edit-${user.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              data-testid={`button-delete-${user.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Kullanıcı Sil</AlertDialogTitle>
                              <AlertDialogDescription>
                                {user.fullName} kullanıcısını sistemden silmek istediğinizden emin misiniz? 
                                Bu işlem geri alınamaz.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>İptal</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeleteUser(user.id)}
                                className="bg-red-600 hover:bg-red-700"
                                data-testid={`button-confirm-delete-${user.id}`}
                              >
                                Sil
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hospitals" className="space-y-6">
          {/* Hospitals Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Building2 className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Toplam Hastane</p>
                    <p className="text-2xl font-bold" data-testid="text-total-hospitals">
                      {hospitals?.length || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Building2 className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Aktif Hastane</p>
                    <p className="text-2xl font-bold" data-testid="text-active-hospitals">
                      {hospitals?.filter(h => h.isActive).length || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <MapPin className="h-8 w-8 text-orange-600" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Şehir Sayısı</p>
                    <p className="text-2xl font-bold" data-testid="text-city-count">
                      {hospitals ? new Set(hospitals.map(h => h.city)).size : 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Hospitals Actions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Hastane Yönetimi</CardTitle>
                  <CardDescription>
                    Sistem hastanelerini ve sağlık tesislerini yönetin
                  </CardDescription>
                </div>
                <Button 
                  onClick={() => setIsCreateHospitalDialogOpen(true)}
                  className="flex items-center gap-2"
                  data-testid="button-add-hospital"
                >
                  <Plus className="h-4 w-4" />
                  Yeni Hastane
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Hospitals Loading State */}
              {isHospitalsLoading && (
                <div className="text-center py-8">
                  <p>Hastaneler yükleniyor...</p>
                </div>
              )}

              {/* Hospitals Error State */}
              {hospitalsError && (
                <div className="text-center py-8 text-red-600">
                  <p>Hastaneler yüklenirken hata oluştu.</p>
                </div>
              )}

              {/* Hospitals Table */}
              {hospitals && hospitals.length > 0 && (
                <div className="rounded-md border">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="p-3 text-left font-medium">Hastane Adı</th>
                        <th className="p-3 text-left font-medium">Tür</th>
                        <th className="p-3 text-left font-medium">Şehir</th>
                        <th className="p-3 text-left font-medium">İletişim</th>
                        <th className="p-3 text-left font-medium">Durum</th>
                        <th className="p-3 text-center font-medium">İşlemler</th>
                      </tr>
                    </thead>
                    <tbody>
                      {hospitals.map((hospital) => (
                        <tr key={hospital.id} className="border-b">
                          <td className="p-3">
                            <div>
                              <p className="font-medium" data-testid={`text-hospital-name-${hospital.id}`}>
                                {hospital.name}
                              </p>
                              {hospital.shortName && (
                                <p className="text-sm text-muted-foreground">
                                  {hospital.shortName}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="p-3">
                            <Badge variant="secondary">
                              {hospital.type === 'hospital' ? 'Hastane' :
                               hospital.type === 'medical_center' ? 'Tıp Merkezi' :
                               hospital.type === 'clinic' ? 'Klinik' : 'Ofis'}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <div>
                              <p className="font-medium">{hospital.city}</p>
                              <p className="text-sm text-muted-foreground">{hospital.district}</p>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <Phone className="h-3 w-3" />
                                <span className="text-sm">{hospital.phone}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Mail className="h-3 w-3" />
                                <span className="text-sm">{hospital.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <Badge variant={hospital.isActive ? "default" : "secondary"}>
                              {hospital.isActive ? "Aktif" : "Pasif"}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center justify-center gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {/* TODO: handleEditHospital(hospital) */}}
                                data-testid={`button-edit-hospital-${hospital.id}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="text-red-600 hover:text-red-700"
                                    data-testid={`button-delete-hospital-${hospital.id}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Hastaneyi Sil</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      "{hospital.name}" hastanesini silmek istediğinizden emin misiniz?
                                      Bu işlem geri alınamaz ve bu hastaneye bağlı kullanıcılar etkilenebilir.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>İptal</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => {/* TODO: handleDeleteHospital(hospital.id) */}}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Sil
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* No Hospitals */}
              {hospitals && hospitals.length === 0 && (
                <div className="text-center py-8">
                  <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Henüz hastane eklenmemiş</p>
                  <Button 
                    onClick={() => setIsCreateHospitalDialogOpen(true)}
                    className="mt-4"
                  >
                    İlk Hastaneyi Ekle
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Hospital Create Dialog Placeholder */}
          {/* TODO: Add Hospital Create/Edit Forms */}
        </TabsContent>
      </Tabs>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kullanıcı Düzenle</DialogTitle>
            <DialogDescription>
              Kullanıcı bilgilerini güncelleyin.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kullanıcı Adı</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-edit-username" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ad Soyad</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-edit-fullname" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rol</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-edit-role">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="user">Normal Kullanıcı</SelectItem>
                        <SelectItem value="responsible_manager">Sorumlu Müdür</SelectItem>
                        <SelectItem value="occupational_physician">İşyeri Hekimi</SelectItem>
                        <SelectItem value="safety_specialist">İş Güvenliği Uzmanı</SelectItem>
                        <SelectItem value="central_admin">Merkez Yönetim (ADMIN)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lokasyon</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Örn: Topkapı Liv Hastanesi, GOP MedicalPark"
                        {...field} 
                        data-testid="input-edit-location"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-2 pt-4">
                <Button 
                  type="submit" 
                  disabled={updateUserMutation.isPending}
                  data-testid="button-submit-edit"
                >
                  {updateUserMutation.isPending ? "Güncelleniyor..." : "Güncelle"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                  data-testid="button-cancel-edit"
                >
                  İptal
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}