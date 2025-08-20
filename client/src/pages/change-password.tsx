import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { HardHat, Lock, Eye, EyeOff, CheckCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

// Form schema
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Mevcut şifre gereklidir"),
  newPassword: z.string().min(6, "Yeni şifre en az 6 karakter olmalıdır"),
  confirmPassword: z.string().min(1, "Şifre onayı gereklidir")
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Şifreler eşleşmiyor",
  path: ["confirmPassword"],
});

type ChangePasswordForm = z.infer<typeof changePasswordSchema>;

export default function ChangePassword() {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    },
  });

  const onSubmit = async (data: ChangePasswordForm) => {
    setIsLoading(true);
    setIsSuccess(false);
    
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Şifre değiştirme başarısız');
      }

      const result = await response.json();
      
      setIsSuccess(true);
      form.reset();
      
      toast({
        title: "Başarılı",
        description: result.message || "Şifre başarıyla değiştirildi",
      });

      // İlk giriş ise ana sayfaya yönlendir
      if (user?.firstLogin) {
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      }
      
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Şifre değiştirilirken hata oluştu",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isFirstLogin = user?.firstLogin;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="bg-primary w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="text-2xl text-white" size={32} />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
            {isFirstLogin ? "İlk Giriş - Şifre Değiştir" : "Şifre Değiştir"}
          </CardTitle>
          <p className="text-gray-600">
            {isFirstLogin 
              ? "Güvenliğiniz için lütfen şifrenizi değiştirin" 
              : "Hesap güvenliğiniz için şifrenizi güncelleyin"
            }
          </p>
        </CardHeader>
        <CardContent>
          {isFirstLogin && (
            <Alert className="mb-6 border-amber-200 bg-amber-50">
              <Lock className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                Bu ilk girişiniz. Devam edebilmek için lütfen şifrenizi değiştirin.
              </AlertDescription>
            </Alert>
          )}

          {isSuccess && (
            <Alert className="mb-6 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Şifre başarıyla değiştirildi! {isFirstLogin && "Ana sayfaya yönlendiriliyorsunuz..."}
              </AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mevcut Şifre</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          type={showCurrentPassword ? "text" : "password"}
                          placeholder="Mevcut şifrenizi girin"
                          {...field}
                          data-testid="input-current-password"
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        data-testid="button-toggle-current-password"
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Yeni Şifre</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          type={showNewPassword ? "text" : "password"}
                          placeholder="En az 6 karakter"
                          {...field}
                          data-testid="input-new-password"
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        data-testid="button-toggle-new-password"
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Yeni Şifre (Tekrar)</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Yeni şifrenizi tekrar girin"
                          {...field}
                          data-testid="input-confirm-password"
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        data-testid="button-toggle-confirm-password"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || isSuccess}
                data-testid="button-change-password"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                    Şifre Değiştiriliyor...
                  </>
                ) : isSuccess ? (
                  <>
                    <CheckCircle className="mr-2" size={16} />
                    Tamamlandı
                  </>
                ) : (
                  <>
                    <Lock className="mr-2" size={16} />
                    Şifremi Değiştir
                  </>
                )}
              </Button>
            </form>
          </Form>

          {!isFirstLogin && (
            <div className="mt-6 text-center">
              <Button 
                variant="link" 
                onClick={() => window.history.back()}
                data-testid="button-back"
              >
                Geri Dön
              </Button>
            </div>
          )}

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">
              Güvenli şifre: En az 6 karakter, rakam ve harf içermelidir
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}