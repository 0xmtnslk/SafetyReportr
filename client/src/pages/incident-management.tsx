import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Clock, Users, FileText, TrendingUp, PlusCircle, Shield } from "lucide-react";

export default function IncidentManagementPage() {
  return (
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Olağandışı Olay Yönetimi
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Hastane içi olağandışı olayların takibi ve yönetimi
            </p>
          </div>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Yeni Olay Bildir
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <AlertCircle className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Aktif Olaylar</p>
                  <p className="text-2xl font-bold">7</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Bekleyen</p>
                  <p className="text-2xl font-bold">3</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Çözülmüş</p>
                  <p className="text-2xl font-bold">42</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Bu Ay</p>
                  <p className="text-2xl font-bold">12</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Incidents */}
        <Card>
          <CardHeader>
            <CardTitle>Son Olağandışı Olaylar</CardTitle>
            <CardDescription>Yakın zamanda bildirilen olaylar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center space-x-4 p-4 border rounded-lg">
                <AlertCircle className="h-6 w-6 text-red-600" />
                <div className="flex-1">
                  <h4 className="font-medium">Elektrik Kesintisi</h4>
                  <p className="text-sm text-gray-600">
                    Ameliyathane bölümünde 15 dakikalık elektrik kesintisi yaşandı
                  </p>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className="text-xs text-gray-500">30.08.2024 - 14:30</span>
                    <span className="text-xs text-gray-500">Bildiren: Teknik Personel</span>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="bg-red-50">
                    Kritik
                  </Badge>
                  <p className="text-xs text-gray-500 mt-1">Durumu: İnceleniyor</p>
                </div>
              </div>

              <div className="flex items-center space-x-4 p-4 border rounded-lg">
                <AlertCircle className="h-6 w-6 text-orange-600" />
                <div className="flex-1">
                  <h4 className="font-medium">Su Sistemi Arızası</h4>
                  <p className="text-sm text-gray-600">
                    3. kat hasta odalarında su akış problemi tespit edildi
                  </p>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className="text-xs text-gray-500">29.08.2024 - 09:15</span>
                    <span className="text-xs text-gray-500">Bildiren: Kat Hemşiresi</span>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="bg-orange-50">
                    Yüksek
                  </Badge>
                  <p className="text-xs text-gray-500 mt-1">Durumu: Müdahale Ediliyor</p>
                </div>
              </div>

              <div className="flex items-center space-x-4 p-4 border rounded-lg">
                <AlertCircle className="h-6 w-6 text-yellow-600" />
                <div className="flex-1">
                  <h4 className="font-medium">Klima Sistemi Sorunu</h4>
                  <p className="text-sm text-gray-600">
                    Poliklinik bölümünde klima sistemi yetersizliği
                  </p>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className="text-xs text-gray-500">28.08.2024 - 11:45</span>
                    <span className="text-xs text-gray-500">Bildiren: Hasta</span>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="bg-yellow-50">
                    Orta
                  </Badge>
                  <p className="text-xs text-gray-500 mt-1">Durumu: Planlandı</p>
                </div>
              </div>

              <div className="flex items-center space-x-4 p-4 border rounded-lg">
                <AlertCircle className="h-6 w-6 text-green-600" />
                <div className="flex-1">
                  <h4 className="font-medium">Güvenlik Kamerası Arızası</h4>
                  <p className="text-sm text-gray-600">
                    Ana giriş güvenlik kamerası görüntü kalitesi sorunu
                  </p>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className="text-xs text-gray-500">27.08.2024 - 16:20</span>
                    <span className="text-xs text-gray-500">Bildiren: Güvenlik</span>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="bg-green-50">
                    Çözüldü
                  </Badge>
                  <p className="text-xs text-gray-500 mt-1">Durumu: Tamamlandı</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Required */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-yellow-600" />
                <span>Bekleyen Eylemler</span>
              </CardTitle>
              <CardDescription>Acil müdahale gerektiren olaylar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center p-2 bg-red-50 rounded">
                <span className="text-sm font-medium">Elektrik Kesintisi - Kök Neden Analizi</span>
                <Badge variant="outline" className="bg-red-100 text-red-800">2 gün</Badge>
              </div>
              <div className="flex justify-between items-center p-2 bg-orange-50 rounded">
                <span className="text-sm font-medium">Su Sistemi - Teknik Rapor</span>
                <Badge variant="outline" className="bg-orange-100 text-orange-800">5 gün</Badge>
              </div>
              <div className="flex justify-between items-center p-2 bg-yellow-50 rounded">
                <span className="text-sm font-medium">Klima - Bakım Planlaması</span>
                <Badge variant="outline" className="bg-yellow-100 text-yellow-800">7 gün</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span>Sorumlu Takımlar</span>
              </CardTitle>
              <CardDescription>Olay yönetim ekipleri</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Teknik Ekip</span>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">5 Aktif Olay</Badge>
                  <Button size="sm" variant="outline">
                    <FileText className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Güvenlik Ekibi</span>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">2 Aktif Olay</Badge>
                  <Button size="sm" variant="outline">
                    <FileText className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">İdari Ekip</span>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">1 Aktif Olay</Badge>
                  <Button size="sm" variant="outline">
                    <FileText className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
  );
}