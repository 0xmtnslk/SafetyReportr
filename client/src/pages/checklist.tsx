import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckSquare, Calendar, Clock, AlertTriangle, CheckCircle, 
  Settings, MapPin, User, Eye, Play, Plus
} from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

export default function ChecklistDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Get current user info
  const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = ['central_admin', 'location_manager'].includes(userInfo?.role);

  // Fetch assignments based on user role
  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery<any[]>({
    queryKey: isAdmin 
      ? ["/api/checklist/assignments"] 
      : ["/api/checklist/assignments/hospital", userInfo?.locationId],
    enabled: !!userInfo?.locationId || isAdmin,
  });

  // Fetch hospital information
  const { data: hospitals = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/hospitals"],
  });

  // Create inspection from assignment mutation
  const createInspectionFromAssignment = useMutation({
    mutationFn: async (assignmentId: string) => {
      const response = await fetch(`/api/checklist/assignments/${assignmentId}/create-inspection`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Denetim oluşturulamadı");
      }
      
      return response.json();
    },
    onSuccess: (inspection) => {
      queryClient.invalidateQueries({ 
        queryKey: isAdmin 
          ? ["/api/checklist/assignments"] 
          : ["/api/checklist/assignments/hospital", userInfo?.locationId]
      });
      toast({
        title: "Denetim Oluşturuldu",
        description: "Kontrol listesi formuna yönlendiriliyorsunuz...",
      });
      setLocation(`/checklist/inspections/${inspection.id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'assigned': { color: 'bg-blue-100 text-blue-800', text: 'Atanmış' },
      'in_progress': { color: 'bg-yellow-100 text-yellow-800', text: 'Devam Ediyor' },
      'completed': { color: 'bg-green-100 text-green-800', text: 'Tamamlandı' },
      'overdue': { color: 'bg-red-100 text-red-800', text: 'Süresi Geçmiş' }
    };
    
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.assigned;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      'low': { color: 'bg-gray-100 text-gray-800', text: 'Düşük' },
      'medium': { color: 'bg-blue-100 text-blue-800', text: 'Orta' },
      'high': { color: 'bg-red-100 text-red-800', text: 'Yüksek' }
    };
    
    return priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium;
  };

  const getHospitalName = (hospitalId: string) => {
    const hospital = hospitals.find(h => h.id === hospitalId);
    return hospital?.name || 'Bilinmiyor';
  };

  if (assignmentsLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isAdmin ? 'Kontrol Listesi Yönetimi' : 'Atanmış Kontrol Listeleri'}
          </h1>
          <p className="text-gray-600 mt-2">
            {isAdmin 
              ? 'Hastanelere atanan kontrol listelerini görüntüleyin ve yönetin' 
              : 'Size atanan kontrol listelerini tamamlayın'
            }
          </p>
        </div>
        
        {isAdmin && (
          <Button 
            onClick={() => setLocation('/admin/create-assignment')}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus size={20} className="mr-2" />
            Yeni Atama Oluştur
          </Button>
        )}
      </div>

      {/* Assignments Grid */}
      {assignments.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <CheckSquare size={64} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {isAdmin ? 'Henüz Atama Yok' : 'Size Atanmış Kontrol Listesi Yok'}
            </h3>
            <p className="text-gray-600 mb-6">
              {isAdmin 
                ? 'Hastanelere kontrol listesi atamak için yeni atama oluşturun.' 
                : 'Şu anda size atanmış bir kontrol listesi bulunmuyor.'
              }
            </p>
            {isAdmin && (
              <Button onClick={() => setLocation('/admin/create-assignment')}>
                <Plus size={20} className="mr-2" />
                İlk Atamayı Oluştur
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {assignments.map((assignment) => {
            const status = getStatusBadge(assignment.status);
            const priority = getPriorityBadge(assignment.priority);
            const isOverdue = new Date(assignment.due_date) < new Date() && assignment.status !== 'completed';
            
            return (
              <Card key={assignment.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2 mb-2">
                        <CheckSquare size={20} />
                        {assignment.title}
                      </CardTitle>
                      {assignment.description && (
                        <p className="text-gray-600 text-sm">{assignment.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Badge className={priority.color}>{priority.text}</Badge>
                      <Badge className={isOverdue ? 'bg-red-100 text-red-800' : status.color}>
                        {isOverdue ? 'Süresi Geçmiş' : status.text}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin size={16} />
                      <span>{getHospitalName(assignment.assigned_to_hospital)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar size={16} />
                      <span>Son Tarih: {new Date(assignment.due_date).toLocaleDateString('tr-TR')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock size={16} />
                      <span>
                        Oluşturulma: {new Date(assignment.created_at).toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                  </div>
                  
                  {assignment.notes && (
                    <div className="bg-gray-50 p-3 rounded-lg mb-4">
                      <p className="text-sm text-gray-700">{assignment.notes}</p>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    {assignment.status === 'assigned' && !isAdmin && (
                      <Button
                        onClick={() => createInspectionFromAssignment.mutate(assignment.id)}
                        disabled={createInspectionFromAssignment.isPending}
                        className="bg-primary hover:bg-primary/90"
                      >
                        <Play size={16} className="mr-2" />
                        {createInspectionFromAssignment.isPending ? 'Başlatılıyor...' : 'Denetimi Başlat'}
                      </Button>
                    )}
                    
                    {isAdmin && (
                      <Button
                        variant="outline"
                        onClick={() => setLocation(`/checklist/assignments/${assignment.id}`)}
                      >
                        <Eye size={16} className="mr-2" />
                        Detayları Görüntüle
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}