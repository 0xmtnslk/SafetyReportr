import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Users, Siren, FileText, Clock, PlusCircle, AlertTriangle, CheckCircle, Flame, ShieldCheck, Heart } from "lucide-react";

export default function EmergencyManagementPage() {
  const [activeTab, setActiveTab] = useState("hap");

  // Mock data - Türk mevzuatına uygun ekip hesaplamaları
  const dangerClass = "Çok Tehlikeli"; // From location settings
  const totalEmployees = 120; // Total hospital employees
  
  // Turkish regulation emergency teams with requirements
  const emergencyTeams = [
    {
      type: "coordination",
      title: "Koordinasyon Ekibi",
      icon: Users,
      iconColor: "text-blue-600",
      required: null, // No minimum requirement
      actual: 8,
      description: "Acil durum koordinasyonu ve yönetimi",
      lastTraining: "10.08.2024",
      status: "active"
    },
    {
      type: "firefighting", 
      title: "Söndürme Ekibi",
      icon: Flame,
      iconColor: "text-red-600",
      required: Math.ceil(totalEmployees / (dangerClass === "Çok Tehlikeli" ? 30 : dangerClass === "Tehlikeli" ? 30 : 50)),
      actual: 5,
      description: "Yangın söndürme ve müdahale",
      lastTraining: "15.07.2024",
      status: "deficit"
    },
    {
      type: "rescue",
      title: "Kurtarma Ekibi", 
      icon: Shield,
      iconColor: "text-orange-600",
      required: Math.ceil(totalEmployees / (dangerClass === "Çok Tehlikeli" ? 30 : dangerClass === "Tehlikeli" ? 30 : 50)),
      actual: 4,
      description: "Acil kurtarma ve tahliye",
      lastTraining: "22.07.2024", 
      status: "deficit"
    },
    {
      type: "protection",
      title: "Koruma Ekibi",
      icon: ShieldCheck, 
      iconColor: "text-green-600",
      required: Math.ceil(totalEmployees / (dangerClass === "Çok Tehlikeli" ? 30 : dangerClass === "Tehlikeli" ? 30 : 50)),
      actual: 6,
      description: "Güvenlik ve koruma",
      lastTraining: "05.08.2024",
      status: "active"
    },
    {
      type: "firstAid",
      title: "İlk Yardım Ekibi",
      icon: Heart,
      iconColor: "text-pink-600", 
      required: Math.ceil(totalEmployees / (dangerClass === "Çok Tehlikeli" ? 10 : dangerClass === "Tehlikeli" ? 15 : 20)),
      actual: 15,
      description: "İlk yardım ve tıbbi müdahale",
      lastTraining: "28.07.2024",
      status: "active"
    }
  ];

  return (
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Acil Durum Yönetimi
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Hastane afet ve acil durum yönetim sistemleri
            </p>
          </div>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Yeni Ekle
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="hap">HAP Yönetimi</TabsTrigger>
            <TabsTrigger value="teams">Acil Durum Ekipleri</TabsTrigger>
            <TabsTrigger value="drills">Tatbikatlar</TabsTrigger>
          </TabsList>

          <TabsContent value="hap" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-red-600" />
                  <CardTitle>Hastane Afet ve Acil Durum Yönetimi (HAP)</CardTitle>
                </div>
                <CardDescription>
                  Afet ve acil durum durumlarında uygulanacak prosedürler
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Plan Durumu:</span>
                      <Badge variant="outline" className="bg-green-50">
                        Güncel
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Son Güncelleme:</span>
                      <span className="text-sm text-gray-600">15.08.2024</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Sorumlu Ekip:</span>
                      <span className="text-sm text-gray-600">HAP Koordinasyon Ekibi</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Risk Seviyesi:</span>
                      <Badge variant="outline" className="bg-yellow-50">
                        Orta
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Son Tatbikat:</span>
                      <span className="text-sm text-gray-600">28.07.2024</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Hazırlık Durumu:</span>
                      <Badge variant="outline" className="bg-green-50">
                        Hazır
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline">
                    <FileText className="mr-2 h-4 w-4" />
                    HAP Planını Görüntüle
                  </Button>
                  <Button variant="outline">
                    <Shield className="mr-2 h-4 w-4" />
                    Risk Analizi
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="teams" className="space-y-6">
            {/* Summary Header */}
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <Card className="bg-blue-50 dark:bg-blue-950">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Tehlike Sınıfı</p>
                      <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{dangerClass}</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-green-50 dark:bg-green-950">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-800 dark:text-green-200">Toplam Çalışan</p>
                      <p className="text-2xl font-bold text-green-900 dark:text-green-100">{totalEmployees}</p>
                    </div>
                    <Users className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-orange-50 dark:bg-orange-950">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-orange-800 dark:text-orange-200">Toplam Ekip Sayısı</p>
                      <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">5</p>
                    </div>
                    <Shield className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Emergency Teams */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {emergencyTeams.map((team) => {
                const IconComponent = team.icon;
                const deficit = team.required ? Math.max(0, team.required - team.actual) : 0;
                const isDeficit = deficit > 0;
                
                return (
                  <Card key={team.type} className="cursor-pointer hover:shadow-md transition-shadow" data-testid={`card-team-${team.type}`}>
                    <CardHeader>
                      <div className="flex items-center space-x-2">
                        <IconComponent className={`h-5 w-5 ${team.iconColor}`} />
                        <CardTitle className="text-lg">{team.title}</CardTitle>
                      </div>
                      <CardDescription className="text-sm">{team.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Minimum Gerekli:</span>
                        <span className="text-sm font-semibold" data-testid={`text-required-${team.type}`}>
                          {team.required ? `${team.required} Kişi` : "Sınırlama Yok"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Mevcut Üye:</span>
                        <span className="text-sm font-semibold" data-testid={`text-actual-${team.type}`}>
                          {team.actual} Kişi
                        </span>
                      </div>
                      {team.required && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Eksik:</span>
                          <span className={`text-sm font-semibold ${isDeficit ? 'text-red-600' : 'text-green-600'}`} data-testid={`text-deficit-${team.type}`}>
                            {isDeficit ? `${deficit} Kişi` : "Tamam"}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Durum:</span>
                        <Badge 
                          variant="outline" 
                          className={isDeficit ? "bg-red-50 text-red-800" : "bg-green-50 text-green-800"}
                          data-testid={`badge-status-${team.type}`}
                        >
                          {isDeficit ? (
                            <>
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Eksik Üye
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Yeterli
                            </>
                          )}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Son Eğitim:</span>
                        <span className="text-sm text-gray-600" data-testid={`text-training-${team.type}`}>
                          {team.lastTraining}
                        </span>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full mt-3"
                        data-testid={`button-manage-${team.type}`}
                      >
                        Ekip Yönetimi
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="drills" className="space-y-6">
            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Siren className="h-5 w-5 text-green-600" />
                      <CardTitle>Yangın Tatbikatı</CardTitle>
                    </div>
                    <Badge variant="outline" className="bg-green-50">
                      Tamamlandı
                    </Badge>
                  </div>
                  <CardDescription>Hastane geneli yangın evacuasyon tatbikatı</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <span className="text-sm font-medium">Tarih:</span>
                      <p className="text-sm text-gray-600">28.07.2024</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Süre:</span>
                      <p className="text-sm text-gray-600">45 dakika</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Katılım:</span>
                      <p className="text-sm text-gray-600">147 Personel</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-5 w-5 text-orange-600" />
                      <CardTitle>Deprem Tatbikatı</CardTitle>
                    </div>
                    <Badge variant="outline" className="bg-blue-50">
                      Planlandı
                    </Badge>
                  </div>
                  <CardDescription>Deprem senaryosu tatbikatı</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <span className="text-sm font-medium">Tarih:</span>
                      <p className="text-sm text-gray-600">15.09.2024</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Hedef Süre:</span>
                      <p className="text-sm text-gray-600">60 dakika</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Hedef Katılım:</span>
                      <p className="text-sm text-gray-600">200 Personel</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
  );
}