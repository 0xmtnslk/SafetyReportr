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
import { Users, UserPlus, Edit, Trash2, Shield, MapPin, Key } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

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
  role: 'admin' | 'user';
  location: string;
  firstLogin: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Form schemas
const createUserSchema = z.object({
  username: z.string().min(3, "Kullanıcı adı en az 3 karakter olmalıdır"),
  fullName: z.string().min(2, "Ad soyad en az 2 karakter olmalıdır"),
  role: z.enum(['admin', 'user'], { required_error: "Rol seçiniz" }),
  location: z.string().min(1, "Lokasyon seçiniz"),
  password: z.string().optional()
});

const editUserSchema = z.object({
  username: z.string().min(3, "Kullanıcı adı en az 3 karakter olmalıdır"),
  fullName: z.string().min(2, "Ad soyad en az 2 karakter olmalıdır"),
  role: z.enum(['admin', 'user'], { required_error: "Rol seçiniz" }),
  location: z.string().min(1, "Lokasyon seçiniz"),
  isActive: z.boolean()
});

type CreateUserForm = z.infer<typeof createUserSchema>;
type EditUserForm = z.infer<typeof editUserSchema>;

export default function AdminPanel() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch users
  const { data: users, isLoading, error } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
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
                      {users?.filter(u => u.role === 'admin').length || 0}
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
                              <SelectItem value="user">Kullanıcı</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
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
                          <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                            {user.role === 'admin' ? 'Admin' : 'Kullanıcı'}
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
                            {user.location}
                          </span>
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
                        <SelectItem value="user">Kullanıcı</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
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