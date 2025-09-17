import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Shield, Users, Siren, FileText, PlusCircle, AlertTriangle, CheckCircle, Flame, ShieldCheck, Heart, Search, UserPlus, Trash2 } from "lucide-react";
// Types handled by any[] for API flexibility

// TypeScript types for emergency team management
// Team type handled by API response

export default function EmergencyManagementPage() {
  const [activeTab, setActiveTab] = useState("hap");
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch emergency teams from API
  const { data: emergencyTeams = [], isLoading: teamsLoading } = useQuery<any[]>({
    queryKey: ["/api/emergency-teams"],
    enabled: !!user,
  });

  // Fetch team requirements for current location
  const { data: teamRequirements } = useQuery<any>({
    queryKey: ["/api/emergency-teams/requirements", user?.locationId],
    enabled: !!user?.locationId,
  });

  // Fetch employees for team assignment
  const { data: employees = [] } = useQuery<any[]>({
    queryKey: ["/api/employees"],
    enabled: !!user,
  });

  // Get danger class and employee count from requirements data
  const dangerClass = teamRequirements?.dangerClass || "Çok Tehlikeli";
  const totalEmployees = teamRequirements?.totalEmployees || 0;

  // Add team member mutation
  const addMemberMutation = useMutation({
    mutationFn: async ({ teamId, employeeId, role }: { teamId: string; employeeId: string; role: string }) => {
      const response = await apiRequest('POST', `/api/emergency-teams/${teamId}/members`, {
        employeeId,
        role,
        trained: false,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Ekip üyesi başarıyla eklendi",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/emergency-teams"] });
      if (selectedTeamId) {
        queryClient.invalidateQueries({ queryKey: ["/api/emergency-teams", selectedTeamId, "members"] });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Ekip üyesi eklenirken hata oluştu",
        variant: "destructive"
      });
    }
  });

  // Remove team member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const response = await apiRequest('DELETE', `/api/emergency-team-members/${memberId}`, undefined);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Ekip üyesi başarıyla kaldırıldı",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/emergency-teams"] });
      if (selectedTeamId) {
        queryClient.invalidateQueries({ queryKey: ["/api/emergency-teams", selectedTeamId, "members"] });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Ekip üyesi kaldırılırken hata oluştu",
        variant: "destructive"
      });
    }
  });

  // Team metadata mapping
  const teamMetadata: Record<string, { title: string; description: string; lastTraining: string }> = {
    coordination: { title: "Koordinasyon Ekibi", description: "Acil durum koordinasyonu ve yönetimi", lastTraining: "10.08.2024" },
    firefighting: { title: "Söndürme Ekibi", description: "Yangın söndürme ve müdahale", lastTraining: "15.07.2024" },
    rescue: { title: "Kurtarma Ekibi", description: "Acil kurtarma ve tahliye", lastTraining: "22.07.2024" },
    protection: { title: "Koruma Ekibi", description: "Güvenlik ve koruma", lastTraining: "05.08.2024" },
    firstAid: { title: "İlk Yardım Ekibi", description: "İlk yardım ve tıbbi müdahale", lastTraining: "28.07.2024" }
  };

  // Transform API team data to display format
  const displayTeams = emergencyTeams.map((team: any) => {
    // Get required count from requirements API or calculate
    const required = team.type === 'coordination' 
      ? null 
      : teamRequirements?.requirements?.find((r: any) => r.teamType === team.type)?.required || 0;
    
    const deficit = required ? Math.max(0, required - team.memberCount) : 0;
    const isDeficit = deficit > 0;
    
    // Icon mapping
    const iconMap: Record<string, any> = {
      coordination: Users,
      firefighting: Flame, 
      rescue: Shield,
      protection: ShieldCheck,
      firstAid: Heart
    };
    
    const colorMap: Record<string, string> = {
      coordination: "text-blue-600",
      firefighting: "text-red-600",
      rescue: "text-orange-600", 
      protection: "text-green-600",
      firstAid: "text-pink-600"
    };
    
    const metadata = teamMetadata[team.type] || { title: team.type, description: "", lastTraining: "" };
    
    return {
      ...team,
      ...metadata,
      icon: iconMap[team.type],
      iconColor: colorMap[team.type],
      required,
      actual: team.memberCount,
      deficit,
      isDeficit,
      status: isDeficit ? "deficit" : "active"
    };
  });

  // Get team members for selected team
  const { data: selectedTeamMembers = [] } = useQuery<any[]>({
    queryKey: ["/api/emergency-teams", selectedTeamId, "members"],
    enabled: !!selectedTeamId,
  });

  // Mutation handlers
  const handleAddMember = (teamId: string, employeeId: string, role: string) => {
    addMemberMutation.mutate({ teamId, employeeId, role });
  };

  const handleRemoveMember = (memberId: string) => {
    removeMemberMutation.mutate(memberId);
  };

  // Filter available employees (not already in the selected team)
  const getAvailableEmployees = (): any[] => {
    const currentTeamMemberIds = selectedTeamMembers.map(member => member.employeeId);
    return employees.filter((emp: any) => !currentTeamMemberIds.includes(emp.id));
  };

  // Filter employees by search term
  const getFilteredEmployees = (employees: any[]): any[] => {
    if (!searchTerm) return employees;
    return employees.filter((emp: any) => 
      emp.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.position?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  if (teamsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

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
            {/* Summary Header */}
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <Card className="bg-blue-50 dark:bg-blue-950">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Tehlike Sınıfı</p>
                      <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{dangerClass}</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-green-50 dark:bg-green-950">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-800 dark:text-green-200">Toplam Çalışan</p>
                      <p className="text-2xl font-bold text-green-900 dark:text-green-100">{totalEmployees}</p>
                    </div>
                    <Users className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-orange-50 dark:bg-orange-950">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-orange-800 dark:text-orange-200">Toplam Ekip Sayısı</p>
                      <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">{displayTeams.length}</p>
                    </div>
                    <Shield className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Emergency Teams */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayTeams.map((team) => {
                const IconComponent = team.icon;
                const deficit = team.deficit || 0;
                const isDeficit = team.isDeficit;
                
                return (
                  <Card key={team.type} className="cursor-pointer hover:shadow-md transition-shadow" data-testid={`card-team-${team.type}`}>
                    <CardHeader>
                      <div className="flex items-center space-x-2">
                        <IconComponent className={`h-5 w-5 ${team.iconColor}`} />
                        <CardTitle className="text-lg">{team.title}</CardTitle>
                      </div>
                      <CardDescription className="text-sm">{team.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Minimum Gerekli:</span>
                        <span className="text-sm font-semibold" data-testid={`text-required-${team.type}`}>
                          {team.required ? `${team.required} Kişi` : "Sınırlama Yok"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Mevcut Üye:</span>
                        <span className="text-sm font-semibold" data-testid={`text-actual-${team.type}`}>
                          {team.actual} Kişi
                        </span>
                      </div>
                      {team.required && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Eksik:</span>
                          <span className={`text-sm font-semibold ${isDeficit ? 'text-red-600' : 'text-green-600'}`} data-testid={`text-deficit-${team.type}`}>
                            {isDeficit ? `${deficit} Kişi` : "Tamam"}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Durum:</span>
                        <Badge 
                          variant="outline" 
                          className={isDeficit ? "bg-red-50 text-red-800" : "bg-green-50 text-green-800"}
                          data-testid={`badge-status-${team.type}`}
                        >
                          {isDeficit ? (
                            <>
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Eksik Üye
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Yeterli
                            </>
                          )}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Son Eğitim:</span>
                        <span className="text-sm text-gray-600" data-testid={`text-training-${team.type}`}>
                          {team.lastTraining}
                        </span>
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full mt-3"
                            onClick={() => {
                              setSelectedTeamId(team.id);
                            }}
                            data-testid={`button-manage-${team.type}`}
                          >
                            Ekip Yönetimi
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>{team.title} - Ekip Yönetimi</DialogTitle>
                            <DialogDescription>
                              Ekip üyelerini yönetin, rol ve eğitim durumlarını güncelleyin
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Current Team Members */}
                            <div className="space-y-4">
                              <h3 className="font-semibold text-lg">Mevcut Ekip Üyeleri</h3>
                              {selectedTeamMembers.length > 0 ? (
                                <div className="space-y-2">
                                  {selectedTeamMembers.map((member) => (
                                    <div key={member.id} className="border rounded-lg p-3 space-y-2">
                                      <div className="flex justify-between items-start">
                                        <div>
                                          <p className="font-medium" data-testid={`text-member-name-${member.id}`}>
                                            {member.employee?.fullName || "Unknown"}
                                          </p>
                                          <p className="text-sm text-gray-600">
                                            {member.employee?.department || ""} - {member.employee?.position || ""}
                                          </p>
                                          <p className="text-sm text-gray-500">{member.employee?.phone || ""}</p>
                                        </div>
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
                                      
                                      <div className="flex gap-2 items-center">
                                        <Badge variant="outline" className="bg-blue-50 text-blue-800">
                                          {member.role === 'leader' ? 'Lider' : 'Üye'}
                                        </Badge>
                                        
                                        <Badge 
                                          variant="outline" 
                                          className={member.trained ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}
                                          data-testid={`badge-training-${member.id}`}
                                        >
                                          {member.trained ? "Eğitimli" : "Eğitimsiz"}
                                        </Badge>
                                        
                                        {/* TODO: Add role/training update mutations */}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-gray-500 italic">Bu ekipte henüz üye bulunmuyor</p>
                              )}
                            </div>

                            {/* Available Employees */}
                            <div className="space-y-4">
                              <h3 className="font-semibold text-lg">Yeni Üye Ekle</h3>
                              
                              {/* Search */}
                              <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <Input
                                  placeholder="Çalışan ara..."
                                  value={searchTerm}
                                  onChange={(e) => setSearchTerm(e.target.value)}
                                  className="pl-10"
                                  data-testid="input-search-employee"
                                />
                              </div>

                              {/* Available employees list */}
                              {selectedTeamId && (
                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                  {getFilteredEmployees(getAvailableEmployees()).map((employee: any) => (
                                    <div key={employee.id} className="border rounded-lg p-3 hover:bg-gray-50">
                                      <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                          <p className="font-medium" data-testid={`text-available-name-${employee.id}`}>
                                            {employee.fullName}
                                          </p>
                                          <p className="text-sm text-gray-600">{employee.department} - {employee.position}</p>
                                          <p className="text-sm text-gray-500">{employee.phone}</p>
                                        </div>
                                        <div className="flex gap-2">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleAddMember(selectedTeamId!, employee.id, "member")}
                                            data-testid={`button-add-member-${employee.id}`}
                                            disabled={addMemberMutation.isPending}
                                          >
                                            <UserPlus className="h-4 w-4 mr-1" />
                                            Üye Ekle
                                          </Button>
                                          <Button
                                            variant="default"
                                            size="sm"
                                            onClick={() => handleAddMember(selectedTeamId!, employee.id, "leader")}
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
                                  
                                  {getFilteredEmployees(getAvailableEmployees()).length === 0 && (
                                    <p className="text-gray-500 italic text-center py-4">
                                      {searchTerm ? "Arama kriterlerine uygun çalışan bulunamadı" : "Eklenebilecek çalışan bulunmuyor"}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </CardContent>
                  </Card>
                );
              })}
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