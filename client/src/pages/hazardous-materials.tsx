import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Package, Shield, FileText, Users, Clock, PlusCircle } from "lucide-react";

export default function HazardousMaterialsPage() {
  return (
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Tehlikeli Madde Yönetimi
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Hastane içi tehlikeli maddelerin güvenli yönetimi
            </p>
          </div>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Yeni Madde Ekle
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Package className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Toplam Madde</p>
                  <p className="text-2xl font-bold">47</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Yüksek Risk</p>
                  <p className="text-2xl font-bold">8</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Güvenli Depolanan</p>
                  <p className="text-2xl font-bold">39</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Eğitimli Personel</p>
                  <p className="text-2xl font-bold">124</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Material Categories */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <CardTitle>Kimyasal Maddeler</CardTitle>
              </div>
              <CardDescription>
                Laboratuvar ve temizlik kimyasalları
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Toplam Madde:</span>
                <Badge variant="outline">18</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Risk Durumu:</span>
                <Badge variant="outline" className="bg-yellow-50">
                  Orta Risk
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Son Kontrol:</span>
                <span className="text-sm text-gray-600">12.08.2024</span>
              </div>
              <Button variant="outline" className="w-full">
                <FileText className="mr-2 h-4 w-4" />
                Detayları Gör
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Package className="h-5 w-5 text-orange-600" />
                <CardTitle>Radyoaktif Maddeler</CardTitle>
              </div>
              <CardDescription>
                Tıbbi görüntüleme radyoaktif materyalleri
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Toplam Madde:</span>
                <Badge variant="outline">6</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Risk Durumu:</span>
                <Badge variant="outline" className="bg-red-50">
                  Yüksek Risk
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Son Kontrol:</span>
                <span className="text-sm text-gray-600">10.08.2024</span>
              </div>
              <Button variant="outline" className="w-full">
                <Shield className="mr-2 h-4 w-4" />
                Güvenlik Protokolü
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-blue-600" />
                <CardTitle>Anestezi Gazları</CardTitle>
              </div>
              <CardDescription>
                Ameliyathane anestezi gazları
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Toplam Madde:</span>
                <Badge variant="outline">12</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Risk Durumu:</span>
                <Badge variant="outline" className="bg-yellow-50">
                  Orta Risk
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Son Kontrol:</span>
                <span className="text-sm text-gray-600">08.08.2024</span>
              </div>
              <Button variant="outline" className="w-full">
                <Clock className="mr-2 h-4 w-4" />
                Monitoring Sistemi
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle>Son Aktiviteler</CardTitle>
            <CardDescription>Tehlikeli madde yönetimi son işlemleri</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4 p-3 border rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Laborituvar Kimyasal Kontrolü</p>
                  <p className="text-xs text-gray-500">15 dakika önce</p>
                </div>
                <Badge variant="outline" className="bg-green-50">Tamamlandı</Badge>
              </div>
              
              <div className="flex items-center space-x-4 p-3 border rounded-lg">
                <Package className="h-5 w-5 text-blue-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Yeni Radyoaktif Materyal Kayıt</p>
                  <p className="text-xs text-gray-500">2 saat önce</p>
                </div>
                <Badge variant="outline" className="bg-blue-50">Kaydedildi</Badge>
              </div>
              
              <div className="flex items-center space-x-4 p-3 border rounded-lg">
                <Users className="h-5 w-5 text-purple-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Personel Güvenlik Eğitimi</p>
                  <p className="text-xs text-gray-500">1 gün önce</p>
                </div>
                <Badge variant="outline" className="bg-purple-50">Tamamlandı</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
  );
}