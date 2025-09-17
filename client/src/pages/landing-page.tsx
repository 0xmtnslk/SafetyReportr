import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ShieldCheck, 
  FileText, 
  Users, 
  TrendingUp, 
  CheckCircle, 
  Clock, 
  BarChart3,
  ArrowRight,
  Star
} from "lucide-react";

export default function LandingPage() {
  const [, setLocation] = useLocation();

  const features = [
    {
      icon: <ShieldCheck className="h-8 w-8 text-blue-600" />,
      title: "İş Güvenliği Yönetimi",
      description: "Kapsamlı iş sağlığı ve güvenliği raporlama sistemi ile riskleri minimize edin."
    },
    {
      icon: <FileText className="h-8 w-8 text-green-600" />,
      title: "Dijital Rapor Sistemi",
      description: "PDF export, fotoğraf ekleme ve detaylı bulgu takibi ile profesyonel raporlar."
    },
    {
      icon: <Users className="h-8 w-8 text-purple-600" />,
      title: "Takım İşbirliği",
      description: "Uzmanlar arası koordinasyon ve süreç takibi ile verimli çalışma."
    },
    {
      icon: <TrendingUp className="h-8 w-8 text-orange-600" />,
      title: "Analitik Dashboard",
      description: "Risk seviyelerine göre filtreleme ve istatistiksel raporlama."
    }
  ];

  const stats = [
    { label: "Aktif Raporlar", value: "500+", icon: <FileText className="h-6 w-6" /> },
    { label: "Çözülen Bulgular", value: "1200+", icon: <CheckCircle className="h-6 w-6" /> },
    { label: "Süreç Takibi", value: "7/24", icon: <Clock className="h-6 w-6" /> },
    { label: "Risk Azaltma", value: "85%", icon: <BarChart3 className="h-6 w-6" /> }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">
                medical<span className="text-blue-600">isg</span>.com
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => setLocation('/dashboard')}
                className="hidden sm:inline-flex"
              >
                Sisteme Giriş
              </Button>
              <Button
                onClick={() => setLocation('/dashboard')}
                className="bg-blue-600 hover:bg-blue-700"
                data-testid="button-app-login"
              >
                App Giriş
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge className="mb-4 bg-blue-100 text-blue-800 hover:bg-blue-100">
              <Star className="h-3 w-3 mr-1" />
              Türkiye'nin En Gelişmiş İSG Platformu
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Sağlık, Emniyet Çevre
              <span className="block text-blue-600">
                Yönetimi
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto">
              Profesyonel İSG uzmanları için geliştirilmiş kapsamlı rapor yönetim sistemi. 
              Bulgularınızı dijitalleştirin, süreçlerinizi takip edin, güvenliği artırın.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => setLocation('/dashboard')}
                className="bg-blue-600 hover:bg-blue-700 px-8 py-4 text-lg"
                data-testid="button-start-now"
              >
                Hemen Başlayın
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="px-8 py-4 text-lg border-2"
                data-testid="button-demo"
              >
                Demo İzle
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-3">
                  <div className="p-3 bg-blue-100 rounded-full text-blue-600">
                    {stat.icon}
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {stat.value}
                </div>
                <div className="text-gray-600">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Neden MedicalİSG?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              İş sağlığı ve güvenliği süreçlerinizi dijitalleştirin, 
              verimliliğinizi artırın.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            İSG Süreçlerinizi Dijitalleştirmeye Hazır mısınız?
          </h2>
          <p className="text-xl text-blue-100 mb-10">
            Hemen ücretsiz hesabınızı oluşturun ve profesyonel raporlamaya başlayın.
          </p>
          <Button
            size="lg"
            onClick={() => setLocation('/dashboard')}
            className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold"
            data-testid="button-start-free"
          >
            Ücretsiz Başlayın
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <ShieldCheck className="h-8 w-8 text-blue-400" />
                <span className="text-2xl font-bold">
                  medical<span className="text-blue-400">isg</span>.com
                </span>
              </div>
              <p className="text-gray-400 max-w-md">
                Türkiye'nin en kapsamlı iş sağlığı ve güvenliği raporlama platformu. 
                Profesyonel uzmanlar için tasarlandı.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Platform</h3>
              <ul className="space-y-2 text-gray-400">
                <li><button onClick={() => setLocation('/dashboard')}>Sisteme Giriş</button></li>
                <li>Özellikler</li>
                <li>Güvenlik</li>
                <li>API</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Destek</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Yardım Merkezi</li>
                <li>İletişim</li>
                <li>Gizlilik</li>
                <li>Koşullar</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 MedicalİSG.com - Tüm hakları saklıdır.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}