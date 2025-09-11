import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Calendar, Users, FileText, CheckSquare, Clock, PlusCircle, Shield } from "lucide-react";

export default function AuditManagementPage() {
  return (
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Denetim Yönetimi
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Hastane denetimlerinin planlanması ve takibi
            </p>
          </div>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Yeni Denetim Planla
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Planlanmış</p>
                  <p className="text-2xl font-bold">8</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Search className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Devam Eden</p>
                  <p className="text-2xl font-bold">3</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <CheckSquare className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Tamamlanan</p>
                  <p className="text-2xl font-bold">15</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Uyumluluk</p>
                  <p className="text-2xl font-bold">92%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="planned">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="planned">Planlanmış</TabsTrigger>
            <TabsTrigger value="active">Devam Eden</TabsTrigger>
            <TabsTrigger value="completed">Tamamlanan</TabsTrigger>
            <TabsTrigger value="reports">Raporlar</TabsTrigger>
          </TabsList>

          <TabsContent value="planned" className="space-y-4">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-5 w-5 text-blue-600" />
                      <CardTitle className="text-lg">İSG Yıllık Denetimi</CardTitle>
                    </div>
                    <Badge variant="outline" className="bg-blue-50">
                      Planlandı
                    </Badge>
                  </div>
                  <CardDescription>
                    İş sağlığı ve güvenliği yıllık kapsamlı denetimi
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid md:grid-cols-4 gap-4">
                    <div>
                      <span className="text-sm font-medium">Tarih:</span>
                      <p className="text-sm text-gray-600">15-17 Ekim 2024</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Tip:</span>
                      <p className="text-sm text-gray-600">İç Denetim</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Kapsam:</span>
                      <p className="text-sm text-gray-600">Tüm Bölümler</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Denetmen:</span>
                      <p className="text-sm text-gray-600">İSG Ekibi</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <FileText className="mr-2 h-4 w-4" />
                      Plan Detayları
                    </Button>
                    <Button variant="outline" size="sm">
                      <Users className="mr-2 h-4 w-4" />
                      Ekip Ata
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Shield className="h-5 w-5 text-green-600" />
                      <CardTitle className="text-lg">Kalite Denetimi</CardTitle>
                    </div>
                    <Badge variant="outline" className="bg-green-50">
                      Planlandı
                    </Badge>
                  </div>
                  <CardDescription>
                    Hasta güvenliği ve kalite standartları denetimi
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid md:grid-cols-4 gap-4">
                    <div>
                      <span className="text-sm font-medium">Tarih:</span>
                      <p className="text-sm text-gray-600">22-23 Ekim 2024</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Tip:</span>
                      <p className="text-sm text-gray-600">Kalite Denetimi</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Kapsam:</span>
                      <p className="text-sm text-gray-600">Poliklinik + Servisler</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Denetmen:</span>
                      <p className="text-sm text-gray-600">Kalite Ekibi</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="active" className="space-y-4">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Search className="h-5 w-5 text-orange-600" />
                      <CardTitle className="text-lg">Enfeksiyon Kontrol Denetimi</CardTitle>
                    </div>
                    <Badge variant="outline" className="bg-orange-50">
                      Devam Ediyor
                    </Badge>
                  </div>
                  <CardDescription>
                    Hastane enfeksiyon kontrol protokolleri inceleniyor
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid md:grid-cols-4 gap-4">
                    <div>
                      <span className="text-sm font-medium">Başlangıç:</span>
                      <p className="text-sm text-gray-600">28.08.2024</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium">İlerleme:</span>
                      <div className="w-20 h-2 bg-gray-200 rounded mt-1">
                        <div className="w-12 h-2 bg-orange-500 rounded"></div>
                      </div>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Kalan Süre:</span>
                      <p className="text-sm text-gray-600">3 gün</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Durum:</span>
                      <Badge variant="outline" className="bg-yellow-50">
                        %60 Tamamlandı
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckSquare className="h-5 w-5 text-green-600" />
                      <CardTitle className="text-lg">Yangın Güvenliği Denetimi</CardTitle>
                    </div>
                    <Badge variant="outline" className="bg-green-50">
                      Tamamlandı
                    </Badge>
                  </div>
                  <CardDescription>
                    Yangın güvenlik sistemleri ve prosedürleri denetimi
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid md:grid-cols-4 gap-4">
                    <div>
                      <span className="text-sm font-medium">Tamamlanma:</span>
                      <p className="text-sm text-gray-600">20.08.2024</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Uyumluluk:</span>
                      <p className="text-sm text-green-600 font-medium">%95</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Bulgular:</span>
                      <p className="text-sm text-gray-600">3 Minör</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Durum:</span>
                      <Badge variant="outline" className="bg-green-50">
                        Başarılı
                      </Badge>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <FileText className="mr-2 h-4 w-4" />
                    Raporu Görüntüle
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckSquare className="h-5 w-5 text-blue-600" />
                      <CardTitle className="text-lg">Radyoloji Güvenlik Denetimi</CardTitle>
                    </div>
                    <Badge variant="outline" className="bg-blue-50">
                      Tamamlandı
                    </Badge>
                  </div>
                  <CardDescription>
                    Radyasyon güvenliği ve ekipman denetimi
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid md:grid-cols-4 gap-4">
                    <div>
                      <span className="text-sm font-medium">Tamamlanma:</span>
                      <p className="text-sm text-gray-600">15.08.2024</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Uyumluluk:</span>
                      <p className="text-sm text-blue-600 font-medium">%88</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Bulgular:</span>
                      <p className="text-sm text-gray-600">1 Majör, 2 Minör</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Durum:</span>
                      <Badge variant="outline" className="bg-yellow-50">
                        İyileştirme Gerekli
                      </Badge>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <FileText className="mr-2 h-4 w-4" />
                    Raporu Görüntüle
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Denetim Uyumluluk Trendi</CardTitle>
                  <CardDescription>Son 6 ay uyumluluk oranları</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Grafik burada görüntülenecek</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Bölüm Performansı</CardTitle>
                  <CardDescription>Bölümlere göre denetim sonuçları</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Ameliyathane</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 h-2 bg-gray-200 rounded">
                          <div className="w-18 h-2 bg-green-500 rounded"></div>
                        </div>
                        <span className="text-sm">95%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Yoğun Bakım</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 h-2 bg-gray-200 rounded">
                          <div className="w-17 h-2 bg-green-500 rounded"></div>
                        </div>
                        <span className="text-sm">92%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Radyoloji</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 h-2 bg-gray-200 rounded">
                          <div className="w-16 h-2 bg-yellow-500 rounded"></div>
                        </div>
                        <span className="text-sm">88%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Laboratuvar</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 h-2 bg-gray-200 rounded">
                          <div className="w-19 h-2 bg-green-500 rounded"></div>
                        </div>
                        <span className="text-sm">97%</span>
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