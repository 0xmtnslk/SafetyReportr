import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Users, Siren, FileText, Clock, PlusCircle, AlertTriangle, CheckCircle } from "lucide-react";

export default function EmergencyManagementPage() {
  const [activeTab, setActiveTab] = useState("hap");

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
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-lg">Koordinasyon Ekibi</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Üye Sayısı:</span>
                    <span className="text-sm">8 Kişi</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Durum:</span>
                    <Badge variant="outline" className="bg-green-50">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Aktif
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Son Eğitim:</span>
                    <span className="text-sm text-gray-600">10.08.2024</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Siren className="h-5 w-5 text-red-600" />
                    <CardTitle className="text-lg">Müdahale Ekibi</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Üye Sayısı:</span>
                    <span className="text-sm">12 Kişi</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Durum:</span>
                    <Badge variant="outline" className="bg-green-50">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Aktif
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Son Eğitim:</span>
                    <span className="text-sm text-gray-600">05.08.2024</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-orange-600" />
                    <CardTitle className="text-lg">Güvenlik Ekibi</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Üye Sayısı:</span>
                    <span className="text-sm">6 Kişi</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Durum:</span>
                    <Badge variant="outline" className="bg-yellow-50">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Eğitim Bekliyor
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Son Eğitim:</span>
                    <span className="text-sm text-gray-600">15.07.2024</span>
                  </div>
                </CardContent>
              </Card>
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