import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Activity, FileText, TrendingUp, Users, Clock, PlusCircle, Shield } from "lucide-react";
import { useLocation } from "wouter";

export default function AccidentManagementPage() {
  const [, setLocation] = useLocation();

  const handleNewAccidentReport = () => {
    setLocation("/accident-details");
  };

  return (
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              İş Kazası ve Ramak Kala
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              İş kazalarının ve ramak kala olaylarının yönetimi
            </p>
          </div>
          <Button onClick={handleNewAccidentReport} data-testid="button-new-report">
            <PlusCircle className="mr-2 h-4 w-4" />
            Yeni Olay Bildir
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Bu Ay Kaza</p>
                  <p className="text-2xl font-bold">3</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Activity className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Ramak Kala</p>
                  <p className="text-2xl font-bold">12</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">İyileşme %</p>
                  <p className="text-2xl font-bold">85</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Kazasız Gün</p>
                  <p className="text-2xl font-bold">47</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="accidents">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="accidents">İş Kazaları</TabsTrigger>
            <TabsTrigger value="near-miss">Ramak Kala</TabsTrigger>
            <TabsTrigger value="analytics">Analitik</TabsTrigger>
          </TabsList>

          <TabsContent value="accidents" className="space-y-4">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      <CardTitle className="text-lg">Kesik Yaralanma</CardTitle>
                    </div>
                    <Badge variant="outline" className="bg-red-50">
                      Yüksek Şiddet
                    </Badge>
                  </div>
                  <CardDescription>
                    Laboratuvar personeli cam malzeme ile yaralanma
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid md:grid-cols-4 gap-4">
                    <div>
                      <span className="text-sm font-medium">Tarih:</span>
                      <p className="text-sm text-gray-600">28.08.2024</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Lokasyon:</span>
                      <p className="text-sm text-gray-600">Laboratuvar</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Etkilenen:</span>
                      <p className="text-sm text-gray-600">Lab. Teknisyeni</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Durum:</span>
                      <Badge variant="outline" className="bg-yellow-50">
                        İnceleniyor
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <FileText className="mr-2 h-4 w-4" />
                      Raporu Görüntüle
                    </Button>
                    <Button variant="outline" size="sm">
                      <Users className="mr-2 h-4 w-4" />
                      Eylem Planı
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-5 w-5 text-orange-600" />
                      <CardTitle className="text-lg">Düşme Olayı</CardTitle>
                    </div>
                    <Badge variant="outline" className="bg-orange-50">
                      Orta Şiddet
                    </Badge>
                  </div>
                  <CardDescription>
                    Hemşire personel ıslak zeminde düşme
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid md:grid-cols-4 gap-4">
                    <div>
                      <span className="text-sm font-medium">Tarih:</span>
                      <p className="text-sm text-gray-600">25.08.2024</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Lokasyon:</span>
                      <p className="text-sm text-gray-600">Hasta Koridoru</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Etkilenen:</span>
                      <p className="text-sm text-gray-600">Hemşire</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Durum:</span>
                      <Badge variant="outline" className="bg-green-50">
                        Tamamlandı
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="near-miss" className="space-y-4">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Activity className="h-5 w-5 text-yellow-600" />
                      <CardTitle className="text-lg">İlaç Karışıklığı</CardTitle>
                    </div>
                    <Badge variant="outline" className="bg-yellow-50">
                      Önlenmiş
                    </Badge>
                  </div>
                  <CardDescription>
                    Benzer isimli ilaçların karıştırılma riski
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid md:grid-cols-4 gap-4">
                    <div>
                      <span className="text-sm font-medium">Tarih:</span>
                      <p className="text-sm text-gray-600">30.08.2024</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Lokasyon:</span>
                      <p className="text-sm text-gray-600">Eczane</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Raporlayan:</span>
                      <p className="text-sm text-gray-600">Eczacı</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Risk Seviyesi:</span>
                      <Badge variant="outline" className="bg-red-50">
                        Yüksek
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Activity className="h-5 w-5 text-blue-600" />
                      <CardTitle className="text-lg">Ekipman Arızası</CardTitle>
                    </div>
                    <Badge variant="outline" className="bg-green-50">
                      Çözüldü
                    </Badge>
                  </div>
                  <CardDescription>
                    Hasta monitörü alarm sistemi gecikmesi
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid md:grid-cols-4 gap-4">
                    <div>
                      <span className="text-sm font-medium">Tarih:</span>
                      <p className="text-sm text-gray-600">29.08.2024</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Lokasyon:</span>
                      <p className="text-sm text-gray-600">Yoğun Bakım</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Raporlayan:</span>
                      <p className="text-sm text-gray-600">Yb. Hemşiresi</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Risk Seviyesi:</span>
                      <Badge variant="outline" className="bg-orange-50">
                        Orta
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Aylık Kaza Trendi</CardTitle>
                  <CardDescription>Son 6 ay kaza istatistikleri</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <TrendingUp className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Grafik burada görüntülenecek</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Kaza Tipleri Dağılımı</CardTitle>
                  <CardDescription>Kaza türlerine göre dağılım</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Kesik/Yaralanma</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 h-2 bg-gray-200 rounded">
                          <div className="w-12 h-2 bg-red-500 rounded"></div>
                        </div>
                        <span className="text-sm">60%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Düşme</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 h-2 bg-gray-200 rounded">
                          <div className="w-8 h-2 bg-orange-500 rounded"></div>
                        </div>
                        <span className="text-sm">40%</span>
                      </div>
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