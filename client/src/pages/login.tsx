import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HardHat, LogIn } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle first login (password change required)
        if (response.status === 428 && data.requirePasswordChange) {
          toast({
            title: "Şifre Değiştirme Gerekli",
            description: data.message || "İlk giriş şifre değiştirme zorunludur",
            variant: "default",
          });
          return;
        }
        
        throw new Error(data.message || "Giriş başarısız");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      
      // Check if first login
      if (data.user.firstLogin) {
        toast({
          title: "Hoş Geldiniz",
          description: "İlk girişiniz, lütfen şifrenizi değiştirin",
          variant: "default",
        });
      }
      
      // Reload to trigger auth state update
      window.location.reload();
    } catch (error: any) {
      toast({
        title: "Giriş Hatası",
        description: error.message || "Kullanıcı adı veya şifre hatalı",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="bg-primary w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <HardHat className="text-2xl text-white" size={32} />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
            İSG Rapor Sistemi
          </CardTitle>
          <p className="text-gray-600">İş Sağlığı ve Güvenliği Rapor Yönetimi</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username">Kullanıcı Adı</Label>
              <Input
                id="username"
                type="text"
                placeholder="admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                data-testid="input-username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Şifre</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                data-testid="input-password"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              data-testid="button-login"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
              ) : (
                <LogIn className="mr-2" size={16} />
              )}
              Giriş Yap
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">Sistem v1.0 - Güvenli Giriş</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
