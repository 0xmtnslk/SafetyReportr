import { useParams, useLocation } from "wouter";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Search,
  UserPlus,
  Shield,
  Trash2,
  Edit,
  Users,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Filter,
  ArrowLeft,
  GraduationCap,
  UserCheck,
  Building,
  MapPin
} from "lucide-react";

// Types handled by any[] for API flexibility
type TeamMember = any;
type Employee = any;
type EmergencyTeam = any;

interface TeamDetailPageProps {
  teamId?: string;
}

const TEAM_TYPE_METADATA = {
  coordination: { title: "Koordinasyon Ekibi", icon: Users, color: "blue" },
  firefighting: { title: "Yangın Ekibi", icon: Shield, color: "red" },  
  rescue: { title: "Kurtarma Ekibi", icon: UserCheck, color: "green" },
  protection: { title: "Koruma Ekibi", icon: Shield, color: "yellow" },
  firstAid: { title: "İlk Yardım Ekibi", icon: UserPlus, color: "purple" }
};

const ROLE_OPTIONS = [
  { value: "leader", label: "Lider" },
  { value: "member", label: "Üye" }
];

export default function TeamDetailPage({ teamId: propTeamId }: TeamDetailPageProps) {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get team ID from props or URL params
  const teamId = propTeamId || params.teamId;

  // State management
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("");
  const [positionFilter, setPositionFilter] = useState<string>("");
  const [trainingFilter, setTrainingFilter] = useState<string>("");
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);

  // API Queries
  const { data: team, isLoading: teamLoading } = useQuery<EmergencyTeam>({
    queryKey: ["/api/emergency-teams", teamId],
    enabled: !!teamId && !!user,
  });

  const { data: teamMembers = [], isLoading: membersLoading } = useQuery<TeamMember[]>({
    queryKey: ["/api/emergency-teams", teamId, "members"],
    enabled: !!teamId && !!user,
  });

  const { data: employees = [], isLoading: employeesLoading } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
    enabled: !!user,
  });

  const { data: teamRequirements } = useQuery<any>({
    queryKey: ["/api/emergency-teams/requirements", user?.locationId],
    enabled: !!user?.locationId,
  });

  // Get available employees (not in any team)
  const availableEmployees = useMemo(() => {
    if (!employees.length || !teamMembers) return [];
    
    const memberEmployeeIds = new Set(teamMembers.map(m => m.employeeId));
    return employees.filter(emp => !memberEmployeeIds.has(emp.id));
  }, [employees, teamMembers]);

  // Enhanced filtering logic
  const filteredEmployees = useMemo(() => {
    return availableEmployees.filter(employee => {
      const matchesSearch = !searchTerm || 
        employee.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.tcKimlikNo?.includes(searchTerm) ||
        employee.phone?.includes(searchTerm);
      
      const matchesDepartment = !departmentFilter || employee.department === departmentFilter;
      const matchesPosition = !positionFilter || employee.position === positionFilter;
      
      // Training filter logic (if available in employee data)
      const matchesTraining = !trainingFilter || 
        (trainingFilter === "trained" && employee.hasEmergencyTraining) ||
        (trainingFilter === "untrained" && !employee.hasEmergencyTraining);
      
      return matchesSearch && matchesDepartment && matchesPosition && matchesTraining;
    });
  }, [availableEmployees, searchTerm, departmentFilter, positionFilter, trainingFilter]);

  // Get unique filter options
  const departmentOptions = useMemo(() => {
    const deps = Array.from(new Set(employees.map(e => e.department).filter(Boolean)));
    return deps.map(dep => ({ value: dep, label: dep }));
  }, [employees]);

  const positionOptions = useMemo(() => {
    const positions = Array.from(new Set(employees.map(e => e.position).filter(Boolean)));
    return positions.map(pos => ({ value: pos, label: pos }));
  }, [employees]);

  // Mutations
  const addMemberMutation = useMutation({
    mutationFn: async ({ teamId, employeeId, role }: { teamId: string; employeeId: string; role: string }) => {
      return await apiRequest('POST', `/api/emergency-teams/${teamId}/members`, { employeeId, role, trained: false });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/emergency-teams", teamId, "members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({ title: "Başarılı", description: "Ekip üyesi başarıyla eklendi" });
    },
    onError: () => {
      toast({ title: "Hata", description: "Ekip üyesi eklenirken hata oluştu", variant: "destructive" });
    }
  });

  const updateMemberMutation = useMutation({
    mutationFn: async ({ memberId, updates }: { memberId: string; updates: Partial<TeamMember> }) => {
      return await apiRequest('PUT', `/api/emergency-team-members/${memberId}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/emergency-teams", teamId, "members"] });
      setEditingMember(null);
      toast({ title: "Başarılı", description: "Üye bilgileri güncellendi" });
    },
    onError: () => {
      toast({ title: "Hata", description: "Üye güncellenirken hata oluştu", variant: "destructive" });
    }
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      return await apiRequest('DELETE', `/api/emergency-team-members/${memberId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/emergency-teams", teamId, "members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({ title: "Başarılı", description: "Ekip üyesi kaldırıldı" });
    },
    onError: () => {
      toast({ title: "Hata", description: "Üye kaldırılırken hata oluştu", variant: "destructive" });
    }
  });

  // Event handlers
  const handleAddMember = (employeeId: string, role: string) => {
    if (!teamId) return;
    addMemberMutation.mutate({ teamId, employeeId, role });
  };

  const handleUpdateMember = (updates: Partial<TeamMember>) => {
    if (!editingMember?.id) return;
    updateMemberMutation.mutate({ memberId: editingMember.id, updates });
  };

  const handleRemoveMember = (memberId: string) => {
    removeMemberMutation.mutate(memberId);
  };

  const clearAllFilters = () => {
    setSearchTerm("");
    setDepartmentFilter("");
    setPositionFilter("");
    setTrainingFilter("");
  };

  // Get team metadata
  const teamMetadata = team?.type && team.type in TEAM_TYPE_METADATA ? TEAM_TYPE_METADATA[team.type as keyof typeof TEAM_TYPE_METADATA] : null;
  const TeamIcon = teamMetadata?.icon || Users;

  // Get requirements for this team type
  const teamRequirement = teamRequirements?.requirements?.find((req: any) => req.teamType === team?.type);

  if (teamLoading || !team) {
    return (
      <div className="container mx-auto py-6" data-testid="page-loading">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6" data-testid="page-team-detail">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          onClick={() => setLocation('/emergency-management')}
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Geri Dön
        </Button>
        <div className="flex items-center gap-3">
          <TeamIcon className={`h-8 w-8 text-${teamMetadata?.color}-600`} />
          <div>
            <h1 className="text-3xl font-bold" data-testid="title-team-name">
              {teamMetadata?.title || team.name}
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Building className="h-4 w-4" />
                {team.location?.name || "Bilinmeyen Lokasyon"}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                Tehlike Sınıfı: {team.location?.dangerClass || "Belirtilmemiş"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Team Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold" data-testid="stat-current-members">
                  {teamMembers.length}
                </p>
                <p className="text-sm text-gray-600">Mevcut Üye</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold" data-testid="stat-required-members">
                  {teamRequirement?.required || 0}
                </p>
                <p className="text-sm text-gray-600">Gerekli Üye</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold" data-testid="stat-trained-members">
                  {teamMembers.filter(m => m.trained).length}
                </p>
                <p className="text-sm text-gray-600">Eğitimli Üye</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold" data-testid="stat-leaders">
                  {teamMembers.filter(m => m.role === 'leader').length}
                </p>
                <p className="text-sm text-gray-600">Lider</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="members" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="members" data-testid="tab-members">
            Ekip Üyeleri ({teamMembers.length})
          </TabsTrigger>
          <TabsTrigger value="assign" data-testid="tab-assign">
            Yeni Üye Ata ({filteredEmployees.length} Uygun)
          </TabsTrigger>
        </TabsList>

        {/* Current Team Members Tab */}
        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mevcut Ekip Üyeleri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {teamMembers.length > 0 ? (
                <div className="grid gap-4">
                  {teamMembers.map((member: TeamMember) => (
                    <div key={member.id} className="border rounded-lg p-4 space-y-3" data-testid={`member-card-${member.id}`}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg" data-testid={`member-name-${member.id}`}>
                            {member.employee?.fullName || "Unknown"}
                          </h3>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p>{member.employee?.department || ""} - {member.employee?.position || ""}</p>
                            <p>{member.employee?.phone || ""}</p>
                            <p>TC: {member.employee?.tcKimlikNo || ""}</p>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingMember(member)}
                            data-testid={`button-edit-${member.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveMember(member.id)}
                            data-testid={`button-remove-${member.id}`}
                            disabled={removeMemberMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 items-center">
                        <Badge 
                          variant="outline" 
                          className={member.role === 'leader' ? "bg-blue-50 text-blue-800" : "bg-gray-50 text-gray-800"}
                          data-testid={`badge-role-${member.id}`}
                        >
                          {member.role === 'leader' ? 'Lider' : 'Üye'}
                        </Badge>
                        
                        <Badge 
                          variant="outline" 
                          className={member.trained ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}
                          data-testid={`badge-training-${member.id}`}
                        >
                          {member.trained ? "Eğitimli" : "Eğitimsiz"}
                        </Badge>
                        
                        {member.employee?.hasEmergencyTraining && (
                          <Badge variant="outline" className="bg-purple-50 text-purple-800">
                            Acil Durum Eğitimi
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Bu ekipte henüz üye bulunmuyor</p>
                  <p className="text-sm">Yeni üye atamak için "Yeni Üye Ata" sekmesini kullanın</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Employee Assignment Tab */}
        <TabsContent value="assign" className="space-y-4">
          {/* Advanced Search & Filters */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Gelişmiş Arama ve Filtreleme
                </CardTitle>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={clearAllFilters}
                  data-testid="button-clear-filters"
                >
                  Filtreleri Temizle
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Ad, TC, telefon ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-employee"
                  />
                </div>

                {/* Department Filter */}
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger data-testid="select-department">
                    <SelectValue placeholder="Departman filtrele" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tüm Departmanlar</SelectItem>
                    {departmentOptions.map(dept => (
                      <SelectItem key={dept.value} value={dept.value}>
                        {dept.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Position Filter */}
                <Select value={positionFilter} onValueChange={setPositionFilter}>
                  <SelectTrigger data-testid="select-position">
                    <SelectValue placeholder="Pozisyon filtrele" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tüm Pozisyonlar</SelectItem>
                    {positionOptions.map(pos => (
                      <SelectItem key={pos.value} value={pos.value}>
                        {pos.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Training Filter */}
                <Select value={trainingFilter} onValueChange={setTrainingFilter}>
                  <SelectTrigger data-testid="select-training">
                    <SelectValue placeholder="Eğitim durumu" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tüm Durumlar</SelectItem>
                    <SelectItem value="trained">Eğitimli</SelectItem>
                    <SelectItem value="untrained">Eğitimsiz</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Active Filters Display */}
              {(searchTerm || departmentFilter || positionFilter || trainingFilter) && (
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm text-gray-600">Aktif filtreler:</span>
                  {searchTerm && (
                    <Badge variant="secondary">
                      Arama: {searchTerm}
                      <XCircle 
                        className="h-3 w-3 ml-1 cursor-pointer" 
                        onClick={() => setSearchTerm("")}
                      />
                    </Badge>
                  )}
                  {departmentFilter && (
                    <Badge variant="secondary">
                      Departman: {departmentFilter}
                      <XCircle 
                        className="h-3 w-3 ml-1 cursor-pointer" 
                        onClick={() => setDepartmentFilter("")}
                      />
                    </Badge>
                  )}
                  {positionFilter && (
                    <Badge variant="secondary">
                      Pozisyon: {positionFilter}
                      <XCircle 
                        className="h-3 w-3 ml-1 cursor-pointer" 
                        onClick={() => setPositionFilter("")}
                      />
                    </Badge>
                  )}
                  {trainingFilter && (
                    <Badge variant="secondary">
                      Eğitim: {trainingFilter === 'trained' ? 'Eğitimli' : 'Eğitimsiz'}
                      <XCircle 
                        className="h-3 w-3 ml-1 cursor-pointer" 
                        onClick={() => setTrainingFilter("")}
                      />
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Available Employees List */}
          <Card>
            <CardHeader>
              <CardTitle>
                Uygun Çalışanlar ({filteredEmployees.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {employeesLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
                </div>
              ) : filteredEmployees.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredEmployees.map((employee: Employee) => (
                    <div 
                      key={employee.id} 
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                      data-testid={`employee-card-${employee.id}`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium" data-testid={`employee-name-${employee.id}`}>
                            {employee.fullName}
                          </h4>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p>{employee.department} - {employee.position}</p>
                            <p>{employee.phone}</p>
                            <p>TC: {employee.tcKimlikNo}</p>
                          </div>
                          
                          {/* Employee badges */}
                          <div className="flex gap-2 mt-2">
                            {employee.hasEmergencyTraining && (
                              <Badge variant="outline" className="bg-green-50 text-green-800">
                                <GraduationCap className="h-3 w-3 mr-1" />
                                Acil Durum Eğitimi
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddMember(employee.id, "member")}
                            data-testid={`button-add-member-${employee.id}`}
                            disabled={addMemberMutation.isPending}
                          >
                            <UserPlus className="h-4 w-4 mr-1" />
                            Üye Ekle
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleAddMember(employee.id, "leader")}
                            data-testid={`button-add-leader-${employee.id}`}
                            disabled={addMemberMutation.isPending}
                          >
                            <Shield className="h-4 w-4 mr-1" />
                            Lider Ekle
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">
                    {searchTerm || departmentFilter || positionFilter || trainingFilter
                      ? "Filtrelere uygun çalışan bulunamadı"
                      : "Eklenebilecek çalışan bulunmuyor"}
                  </p>
                  <p className="text-sm">
                    {searchTerm || departmentFilter || positionFilter || trainingFilter
                      ? "Filtreleri değiştirerek daha fazla sonuç bulabilirsiniz"
                      : "Tüm uygun çalışanlar zaten ekiplerde görevli"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Member Dialog */}
      <Dialog open={!!editingMember} onOpenChange={(open) => !open && setEditingMember(null)}>
        <DialogContent data-testid="dialog-edit-member">
          <DialogHeader>
            <DialogTitle>
              Üye Düzenle: {editingMember?.employee?.fullName}
            </DialogTitle>
            <DialogDescription>
              Ekip üyesinin rolünü ve eğitim durumunu güncelleyin
            </DialogDescription>
          </DialogHeader>
          
          {editingMember && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Rol</label>
                <Select
                  value={editingMember.role}
                  onValueChange={(value) => setEditingMember({ ...editingMember, role: value })}
                >
                  <SelectTrigger data-testid="select-edit-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map(role => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="trained"
                  checked={editingMember.trained}
                  onChange={(e) => setEditingMember({ ...editingMember, trained: e.target.checked })}
                  data-testid="checkbox-edit-trained"
                />
                <label htmlFor="trained" className="text-sm font-medium">
                  Eğitim durumu (Eğitimli)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setEditingMember(null)}
                  data-testid="button-cancel-edit"
                >
                  İptal
                </Button>
                <Button
                  onClick={() => handleUpdateMember({
                    role: editingMember.role,
                    trained: editingMember.trained
                  })}
                  disabled={updateMemberMutation.isPending}
                  data-testid="button-save-edit"
                >
                  {updateMemberMutation.isPending ? "Güncelleniyor..." : "Güncelle"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}