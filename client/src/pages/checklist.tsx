import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckSquare, Calendar, Clock, AlertTriangle, CheckCircle, 
  Settings, MapPin, User, Eye, Play
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
      // Redirect to inspection form
      setLocation(`/checklist/inspections/${inspection.id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Denetim oluşturulurken bir hata oluştu.",
        variant: "destructive",
      });
    },
  });

  if (assignmentsLoading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Debug: Log user info and assignments
  console.log("🔍 DEBUG - User info:", userInfo);
  console.log("🔍 DEBUG - Is Admin:", isAdmin);
  console.log("🔍 DEBUG - Assignments:", assignments);

  // Calculate statistics
  const totalAssignments = assignments.length;
  const assignedCount = assignments.filter(a => a.status === 'assigned').length;
  const inProgressCount = assignments.filter(a => a.status === 'in_progress').length;
  const completedCount = assignments.filter(a => a.status === 'completed').length;
  const overdueCount = assignments.filter(a => 
    a.status !== 'completed' && new Date(a.dueDate) < new Date()
  ).length;

  const getHospitalName = (hospitalId: string) => {
    const hospital = hospitals.find(h => h.id === hospitalId);
    return hospital?.name || 'Bilinmeyen Hastane';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'assigned': return <Clock size={16} />;
      case 'in_progress': return <Play size={16} />;
      case 'completed': return <CheckCircle size={16} />;
      default: return <AlertTriangle size={16} />;
    }
  };

  const isOverdue = (assignment: any) => {
    return assignment.status !== 'completed' && new Date(assignment.dueDate) < new Date();
  };

  const handleStartAssignment = (assignmentId: string) => {
    createInspectionFromAssignment.mutate(assignmentId);
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {isAdmin ? 'Kontrol Listesi Görev Yönetimi' : 'Atanan Kontrol Listesi Görevlerim'}
        </h1>
        <p className="text-gray-600">
          {isAdmin 
            ? 'Hastanelere atanan tüm kontrol listesi görevlerini yönetin ve takip edin.' 
            : 'Size atanan İSG kontrol listesi denetim görevlerini görüntüleyin ve tamamlayın.'}
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700 mb-1">Toplam Görev</p>
                <p className="text-3xl font-bold text-blue-900">{totalAssignments}</p>
              </div>
              <CheckSquare className="h-12 w-12 text-blue-600 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-700 mb-1">Bekleyen</p>
                <p className="text-3xl font-bold text-yellow-900">{assignedCount}</p>
              </div>
              <Clock className="h-12 w-12 text-yellow-600 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700 mb-1">Devam Eden</p>
                <p className="text-3xl font-bold text-blue-900">{inProgressCount}</p>
              </div>
              <Play className="h-12 w-12 text-blue-600 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700 mb-1">Tamamlanan</p>
                <p className="text-3xl font-bold text-green-900">{completedCount}</p>
              </div>
              <CheckCircle className="h-12 w-12 text-green-600 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Assignments Alert */}
      {overdueCount > 0 && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="text-red-600" size={20} />
              <div>
                <p className="font-medium text-red-800">
                  Dikkat! {overdueCount} adet süresi geçmiş görev bulunuyor.
                </p>
                <p className="text-sm text-red-600">
                  Lütfen süresi geçmiş görevleri öncelikle tamamlayın.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assignments List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckSquare size={20} />
            {isAdmin ? 'Tüm Görevler' : 'Atanan Görevler'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <div className="text-center py-12">
              <CheckSquare className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {isAdmin ? 'Henüz görev atanmamış' : 'Size atanmış görev bulunmuyor'}
              </h3>
              <p className="text-gray-600 mb-4">
                {isAdmin 
                  ? 'Hastanelere kontrol listesi görevi atamak için yukarıdaki "Kontrol Listesi Görevi Ata" butonunu kullanın.'
                  : 'Yöneticiniz tarafından size kontrol listesi görevi atandığında burada görünecektir.'}
              </p>
              {isAdmin && (
                <Button
                  onClick={() => setLocation('/admin/create-assignment')}
                  className="bg-green-600 hover:bg-green-700"
                >
                  İlk Görevi Ata
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {assignments.map((assignment: any) => (
                <div
                  key={assignment.id}
                  className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                    isOverdue(assignment) ? 'border-red-200 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg text-gray-900">
                          {assignment.title}
                        </h3>
                        <Badge className={`${getStatusColor(assignment.status)} flex items-center gap-1`}>
                          {getStatusIcon(assignment.status)}
                          {assignment.status === 'assigned' ? 'Atandı' :
                           assignment.status === 'in_progress' ? 'Devam Ediyor' :
                           assignment.status === 'completed' ? 'Tamamlandı' : assignment.status}
                        </Badge>
                        <Badge className={`${getPriorityColor(assignment.priority)} border`}>
                          {assignment.priority === 'urgent' ? 'Acil' :
                           assignment.priority === 'high' ? 'Yüksek' :
                           assignment.priority === 'medium' ? 'Orta' :
                           assignment.priority === 'low' ? 'Düşük' : assignment.priority}
                        </Badge>
                        {isOverdue(assignment) && (
                          <Badge className="bg-red-100 text-red-800 border-red-200 flex items-center gap-1">
                            <AlertTriangle size={14} />
                            Süresi Geçti
                          </Badge>
                        )}
                      </div>

                      {assignment.description && (
                        <p className="text-gray-600 mb-3">{assignment.description}</p>
                      )}

                      <div className="flex items-center gap-6 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <MapPin size={14} />
                          {getHospitalName(assignment.assignedToHospital)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar size={14} />
                          Son Tarih: {new Date(assignment.dueDate).toLocaleDateString('tr-TR')}
                        </div>
                        {assignment.assignedToUser && (
                          <div className="flex items-center gap-1">
                            <User size={14} />
                            Özel Atama
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      {!isAdmin && assignment.status === 'assigned' && (
                        <Button
                          onClick={() => handleStartAssignment(assignment.id)}
                          disabled={createInspectionFromAssignment.isPending}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          {createInspectionFromAssignment.isPending ? "Başlatılıyor..." : "Başla"}
                        </Button>
                      )}
                      
                      {!isAdmin && assignment.status === 'in_progress' && (
                        <Button
                          onClick={() => {
                            // Try to get existing inspection or create new one
                            createInspectionFromAssignment.mutate(assignment.id);
                          }}
                          disabled={createInspectionFromAssignment.isPending}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {createInspectionFromAssignment.isPending ? "Yükleniyor..." : "Devam Et"}
                        </Button>
                      )}
                      
                      <Button
                        onClick={() => {
                          if (isAdmin) {
                            alert('Admin detay görünümü henüz hazır değil');
                          } else {
                            alert('Görev detayları henüz hazır değil');
                          }
                        }}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        <Eye size={14} />
                        Detay
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}