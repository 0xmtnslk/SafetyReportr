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

interface HospitalDepartment {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  orderIndex?: number;
}

export default function HospitalSectionsManagement() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Fetch hospital departments
  const { data: departments, isLoading: departmentsLoading } = useQuery<HospitalDepartment[]>({
    queryKey: ['/api/risk/hospital-departments'],
  });

  // Toggle department mutation
  const toggleDepartmentMutation = useMutation({
    mutationFn: (data: { departmentId: string; isActive: boolean }) =>
      apiRequest('PUT', `/api/risk/hospital-departments/${data.departmentId}/toggle`, { isActive: data.isActive }),
    onSuccess: () => {
      toast({
        title: "Başarılı", 
        description: "Bölüm durumu güncellendi",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/risk/hospital-departments'] });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Bölüm durumu güncellenirken hata oluştu",
        variant: "destructive",
      });
    },
  });

  const handleToggleDepartment = (departmentId: string, isActive: boolean) => {
    toggleDepartmentMutation.mutate({ departmentId, isActive });
  };

  if (departmentsLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2">Yükleniyor...</span>
        </div>
      </div>
    );
  }

  const totalDepartments = departments?.length || 0;
  const activeDepartments = departments?.filter(dept => dept.isActive).length || 0;

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
            {activeDepartments}/{totalDepartments} Aktif
          </Badge>
        </div>
      </div>

      {/* Departments list */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span className="text-lg font-semibold">Hastane Bölümleri</span>
              <Badge variant="secondary">
                {activeDepartments}/{totalDepartments} Aktif
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {departments?.map((department) => (
                <div
                  key={department.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{department.name}</h3>
                      {department.description && (
                        <p className="text-sm text-gray-600">{department.description}</p>
                      )}
                    </div>
                    {department.isActive && (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">
                      {department.isActive ? 'Aktif' : 'Pasif'}
                    </span>
                    <Switch
                      checked={department.isActive}
                      onCheckedChange={(checked) => 
                        handleToggleDepartment(department.id, checked)
                      }
                      disabled={toggleDepartmentMutation.isPending}
                      data-testid={`switch-${department.id}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}