import React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Settings, RefreshCw, CheckCircle } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";

interface RiskCategory {
  id: string;
  name: string;
  orderIndex: number;
  isActive: boolean;
}

interface RiskSubCategory {
  id: string;
  categoryId: string;
  name: string;
  orderIndex: number;
  isActive: boolean;
}

interface HospitalSection {
  categoryId: string;
  subCategoryId: string;
  isActive: boolean;
}

export default function HospitalSectionsManagement() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Fetch categories, subcategories and hospital sections
  const { data: categories, isLoading: categoriesLoading } = useQuery<RiskCategory[]>({
    queryKey: ['/api/risk/categories'],
  });

  const { data: subCategories, isLoading: subCategoriesLoading } = useQuery<RiskSubCategory[]>({
    queryKey: ['/api/risk/sub-categories'],
  });

  const { data: hospitalSections, isLoading: sectionsLoading } = useQuery<HospitalSection[]>({
    queryKey: ['/api/risk/hospital-sections'],
  });

  // Initialize default sections mutation
  const initializeSectionsMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/risk/hospital-sections/initialize'),
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Standart bölümler başarıyla eklendi",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/risk/hospital-sections'] });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Standart bölümler eklenirken hata oluştu",
        variant: "destructive",
      });
    },
  });

  // Toggle section mutation
  const toggleSectionMutation = useMutation({
    mutationFn: (data: { categoryId: string; subCategoryId: string; isActive: boolean }) =>
      apiRequest('PUT', '/api/risk/hospital-sections/toggle', data),
    onSuccess: () => {
      toast({
        title: "Başarılı", 
        description: "Bölüm durumu güncellendi",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/risk/hospital-sections'] });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Bölüm durumu güncellenirken hata oluştu",
        variant: "destructive",
      });
    },
  });

  const handleToggleSection = (categoryId: string, subCategoryId: string, isActive: boolean) => {
    toggleSectionMutation.mutate({ categoryId, subCategoryId, isActive });
  };

  const handleInitialize = () => {
    initializeSectionsMutation.mutate();
  };

  if (categoriesLoading || subCategoriesLoading || sectionsLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2">Yükleniyor...</span>
        </div>
      </div>
    );
  }

  // Create a map for faster lookups
  const hospitalSectionsMap = new Map<string, boolean>();
  hospitalSections?.forEach(section => {
    const key = `${section.categoryId}-${section.subCategoryId}`;
    hospitalSectionsMap.set(key, section.isActive);
  });

  const categoriesWithSubCategories = categories?.map(category => ({
    ...category,
    subCategories: subCategories?.filter(sub => sub.categoryId === category.id) || []
  })) || [];

  const totalSections = subCategories?.length || 0;
  const activeSections = Array.from(hospitalSectionsMap.values()).filter(Boolean).length;
  const hasAnySections = hospitalSections && hospitalSections.length > 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation('/risk-assessment')}
            className="flex items-center space-x-2"
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Risk Değerlendirmesi</span>
          </Button>
          <div className="h-6 w-px bg-gray-300"></div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Hastane Bölüm Yönetimi</h1>
            <p className="text-sm text-gray-600">
              Risk değerlendirmesi için kullanılacak bölümleri yönetin
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Badge variant="outline" className="text-sm">
            {activeSections}/{totalSections} Aktif
          </Badge>
          {!hasAnySections && (
            <Button 
              onClick={handleInitialize}
              disabled={initializeSectionsMutation.isPending}
              className="flex items-center space-x-2"
              data-testid="button-initialize"
            >
              <Settings className="h-4 w-4" />
              {initializeSectionsMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Ekleniyor...</span>
                </>
              ) : (
                <span>Standart Bölümleri Ekle</span>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* No sections message */}
      {!hasAnySections ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Henüz Bölüm Tanımlanmamış
            </h2>
            <p className="text-gray-600 mb-4">
              Risk değerlendirmesi yapabilmek için önce standart bölümleri eklemeniz gerekir.
            </p>
            <Button onClick={handleInitialize} disabled={initializeSectionsMutation.isPending}>
              {initializeSectionsMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  Ekleniyor...
                </>
              ) : (
                'Standart Bölümleri Ekle'
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* Sections list */
        <div className="space-y-6">
          {categoriesWithSubCategories.map((category) => (
            <Card key={category.id}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span className="text-lg font-semibold">{category.name}</span>
                  <Badge variant="secondary">
                    {category.subCategories.filter(sub => {
                      const key = `${category.id}-${sub.id}`;
                      return hospitalSectionsMap.get(key) === true;
                    }).length}/{category.subCategories.length} Aktif
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {category.subCategories.map((subCategory) => {
                    const key = `${category.id}-${subCategory.id}`;
                    const isActive = hospitalSectionsMap.get(key) ?? false;
                    
                    return (
                      <div
                        key={subCategory.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{subCategory.name}</h3>
                          </div>
                          {isActive && (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">
                            {isActive ? 'Aktif' : 'Pasif'}
                          </span>
                          <Switch
                            checked={isActive}
                            onCheckedChange={(checked) => 
                              handleToggleSection(category.id, subCategory.id, checked)
                            }
                            disabled={toggleSectionMutation.isPending}
                            data-testid={`switch-${subCategory.id}`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}