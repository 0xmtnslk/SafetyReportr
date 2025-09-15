import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Users, Siren, FileText, Clock, PlusCircle, AlertTriangle, CheckCircle, Flame, ShieldCheck, Heart, X, Plus, Search, UserPlus, Trash2 } from "lucide-react";

// TypeScript types for emergency team management
type TeamType = 'coordination' | 'firefighting' | 'rescue' | 'protection' | 'firstAid';
type Role = 'leader' | 'member';

interface Employee {
  id: string;
  fullName: string;
  department: string;
  position: string;
  phone: string;
}

type TeamMember = Employee & {
  role: Role;
  trained: boolean;
  trainingDate: string | null;
};

type TeamMembersState = Record<TeamType, TeamMember[]>;

export default function EmergencyManagementPage() {
  const [activeTab, setActiveTab] = useState("hap");
  const [selectedTeam, setSelectedTeam] = useState<TeamType | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Mock data - Türk mevzuatına uygun ekip hesaplamaları  
  const dangerClass = "Çok Tehlikeli"; // From location settings
  const totalEmployees = 120; // Total hospital employees

  // Mock employees data
  const allEmployees = [
    { id: "1", fullName: "Dr. Mehmet Yılmaz", department: "Acil Tıp", position: "Acil Tıp Uzmanı", phone: "0532-123-4567" },
    { id: "2", fullName: "Hemşire Ayşe Kaya", department: "Acil Servis", position: "Başhemşire", phone: "0533-234-5678" },
    { id: "3", fullName: "Teknisyen Ahmet Özkan", department: "Teknik", position: "Elektrik Teknisyeni", phone: "0534-345-6789" },
    { id: "4", fullName: "Güvenlik Müdürü Can Demir", department: "Güvenlik", position: "Güvenlik Müdürü", phone: "0535-456-7890" },
    { id: "5", fullName: "İtfaiyeci Murat Şen", department: "Teknik", position: "İtfaiye Teknisyeni", phone: "0536-567-8901" },
    { id: "6", fullName: "Dr. Fatma Arslan", department: "Anestezi", position: "Anestezi Uzmanı", phone: "0537-678-9012" },
    { id: "7", fullName: "Hemşire Emre Kılıç", department: "Yoğun Bakım", position: "Yoğun Bakım Hemşiresi", phone: "0538-789-0123" },
    { id: "8", fullName: "Güvenlik Görevlisi Ali Yurt", department: "Güvenlik", position: "Güvenlik Görevlisi", phone: "0539-890-1234" },
    { id: "9", fullName: "Dr. Zeynep Çelik", department: "Acil Tıp", position: "Acil Tıp Uzmanı", phone: "0540-901-2345" },
    { id: "10", fullName: "Teknisyen Burcu Ay", department: "Teknik", position: "Biomedical Teknisyen", phone: "0541-012-3456" },
    { id: "11", fullName: "İdari Personel Oğuz Tan", department: "İdari", position: "İnsan Kaynakları Uzmanı", phone: "0542-123-4567" },
    { id: "12", fullName: "Dr. Kemal Balcı", department: "Kardiyoloji", position: "Kardiyoloji Uzmanı", phone: "0543-234-5678" },
    { id: "13", fullName: "Hemşire Deniz Acar", department: "Ameliyathane", position: "Ameliyathane Hemşiresi", phone: "0544-345-6789" },
    { id: "14", fullName: "Güvenlik Görevlisi Serkan Polat", department: "Güvenlik", position: "Güvenlik Görevlisi", phone: "0545-456-7890" },
    { id: "15", fullName: "Dr. Elif Korkmaz", department: "İç Hastalıkları", position: "İç Hastalıkları Uzmanı", phone: "0546-567-8901" }
  ];

  // Mock initial team members (properly typed)
  const initialTeamMembers: TeamMembersState = {
    coordination: [
      { ...allEmployees[0], role: "leader", trained: true, trainingDate: "2024-07-15" },
      { ...allEmployees[1], role: "member", trained: true, trainingDate: "2024-07-20" },
      { ...allEmployees[10], role: "member", trained: false, trainingDate: null }
    ],
    firefighting: [
      { ...allEmployees[4], role: "leader", trained: true, trainingDate: "2024-06-10" },
      { ...allEmployees[2], role: "member", trained: true, trainingDate: "2024-06-15" },
      { ...allEmployees[9], role: "member", trained: false, trainingDate: null }
    ],
    rescue: [
      { ...allEmployees[3], role: "leader", trained: true, trainingDate: "2024-07-01" },
      { ...allEmployees[7], role: "member", trained: true, trainingDate: "2024-07-05" }
    ],
    protection: [
      { ...allEmployees[3], role: "leader", trained: true, trainingDate: "2024-07-01" },
      { ...allEmployees[7], role: "member", trained: true, trainingDate: "2024-07-05" },
      { ...allEmployees[13], role: "member", trained: true, trainingDate: "2024-07-10" }
    ],
    firstAid: [
      { ...allEmployees[5], role: "leader", trained: true, trainingDate: "2024-08-01" },
      { ...allEmployees[6], role: "member", trained: true, trainingDate: "2024-08-01" },
      { ...allEmployees[8], role: "member", trained: true, trainingDate: "2024-08-01" },
      { ...allEmployees[11], role: "member", trained: false, trainingDate: null },
      { ...allEmployees[12], role: "member", trained: true, trainingDate: "2024-08-01" },
      { ...allEmployees[14], role: "member", trained: false, trainingDate: null }
    ]
  };

  // Initialize team members state (properly typed)
  const [teamMembers, setTeamMembers] = useState<TeamMembersState>(initialTeamMembers);

  // Helper functions for team management (properly typed)
  const addTeamMember = (teamType: TeamType, employee: Employee, role: Role = "member"): void => {
    setTeamMembers(prev => ({
      ...prev,
      [teamType]: [...prev[teamType], { ...employee, role, trained: false, trainingDate: null }]
    }));
  };

  const removeTeamMember = (teamType: TeamType, employeeId: string): void => {
    setTeamMembers(prev => ({
      ...prev,
      [teamType]: prev[teamType].filter(member => member.id !== employeeId)
    }));
  };

  const updateMemberRole = (teamType: TeamType, employeeId: string, newRole: Role): void => {
    setTeamMembers(prev => ({
      ...prev,
      [teamType]: prev[teamType].map(member => 
        member.id === employeeId ? { ...member, role: newRole } : member
      )
    }));
  };

  const updateMemberTraining = (teamType: TeamType, employeeId: string, trained: boolean, trainingDate: string | null = null): void => {
    setTeamMembers(prev => ({
      ...prev,
      [teamType]: prev[teamType].map(member => 
        member.id === employeeId ? { ...member, trained, trainingDate } : member
      )
    }));
  };

  // Turkish regulation emergency teams with DYNAMIC actual counts
  const emergencyTeams = [
    {
      type: "coordination",
      title: "Koordinasyon Ekibi",
      icon: Users,
      iconColor: "text-blue-600",
      required: null, // No minimum requirement
      actual: (teamMembers.coordination || []).length,
      description: "Acil durum koordinasyonu ve yönetimi",
      lastTraining: "10.08.2024",
      status: "active"
    },
    {
      type: "firefighting", 
      title: "Söndürme Ekibi",
      icon: Flame,
      iconColor: "text-red-600",
      required: Math.ceil(totalEmployees / (dangerClass === "Çok Tehlikeli" ? 30 : dangerClass === "Tehlikeli" ? 30 : 50)),
      actual: (teamMembers.firefighting || []).length,
      description: "Yangın söndürme ve müdahale",
      lastTraining: "15.07.2024",
      status: "deficit"
    },
    {
      type: "rescue",
      title: "Kurtarma Ekibi", 
      icon: Shield,
      iconColor: "text-orange-600",
      required: Math.ceil(totalEmployees / (dangerClass === "Çok Tehlikeli" ? 30 : dangerClass === "Tehlikeli" ? 30 : 50)),
      actual: (teamMembers.rescue || []).length,
      description: "Acil kurtarma ve tahliye",
      lastTraining: "22.07.2024", 
      status: "deficit"
    },
    {
      type: "protection",
      title: "Koruma Ekibi",
      icon: ShieldCheck, 
      iconColor: "text-green-600",
      required: Math.ceil(totalEmployees / (dangerClass === "Çok Tehlikeli" ? 30 : dangerClass === "Tehlikeli" ? 30 : 50)),
      actual: (teamMembers.protection || []).length,
      description: "Güvenlik ve koruma",
      lastTraining: "05.08.2024",
      status: "active"
    },
    {
      type: "firstAid",
      title: "İlk Yardım Ekibi",
      icon: Heart,
      iconColor: "text-pink-600", 
      required: Math.ceil(totalEmployees / (dangerClass === "Çok Tehlikeli" ? 10 : dangerClass === "Tehlikeli" ? 15 : 20)),
      actual: (teamMembers.firstAid || []).length,
      description: "İlk yardım ve tıbbi müdahale",
      lastTraining: "28.07.2024",
      status: "active"
    }
  ];

  // Filter available employees (not already in the selected team)
  const getAvailableEmployees = (teamType: TeamType): Employee[] => {
    const currentTeamMemberIds = teamMembers[teamType].map(member => member.id);
    return allEmployees.filter(emp => !currentTeamMemberIds.includes(emp.id));
  };

  // Filter employees by search term
  const getFilteredEmployees = (employees: Employee[]): Employee[] => {
    if (!searchTerm) return employees;
    return employees.filter(emp => 
      emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.position.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

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
                      <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">5</p>
                    </div>
                    <Shield className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Emergency Teams */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {emergencyTeams.map((team) => {
                const IconComponent = team.icon;
                const deficit = team.required ? Math.max(0, team.required - team.actual) : 0;
                const isDeficit = deficit > 0;
                
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
                            onClick={() => setSelectedTeam(team.type as TeamType)}
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
                              {selectedTeam && teamMembers[selectedTeam]?.length > 0 ? (
                                <div className="space-y-2">
                                  {teamMembers[selectedTeam].map((member) => (
                                    <div key={member.id} className="border rounded-lg p-3 space-y-2">
                                      <div className="flex justify-between items-start">
                                        <div>
                                          <p className="font-medium" data-testid={`text-member-name-${member.id}`}>
                                            {member.fullName}
                                          </p>
                                          <p className="text-sm text-gray-600">{member.department} - {member.position}</p>
                                          <p className="text-sm text-gray-500">{member.phone}</p>
                                        </div>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => removeTeamMember(selectedTeam, member.id)}
                                          data-testid={`button-remove-${member.id}`}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                      
                                      <div className="flex gap-2 items-center">
                                        <Select
                                          value={member.role}
                                          onValueChange={(value: Role) => updateMemberRole(selectedTeam, member.id, value)}
                                        >
                                          <SelectTrigger className="w-32" data-testid={`select-role-${member.id}`}>
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="leader">Lider</SelectItem>
                                            <SelectItem value="member">Üye</SelectItem>
                                          </SelectContent>
                                        </Select>
                                        
                                        <Badge 
                                          variant="outline" 
                                          className={member.trained ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}
                                          data-testid={`badge-training-${member.id}`}
                                        >
                                          {member.trained ? "Eğitimli" : "Eğitimsiz"}
                                        </Badge>
                                        
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => updateMemberTraining(selectedTeam, member.id, !member.trained, member.trained ? null : new Date().toISOString().split('T')[0])}
                                          data-testid={`button-training-${member.id}`}
                                        >
                                          {member.trained ? "Eğitimi Kaldır" : "Eğitimi Tamamla"}
                                        </Button>
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
                              {selectedTeam && (
                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                  {getFilteredEmployees(getAvailableEmployees(selectedTeam)).map((employee) => (
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
                                            onClick={() => addTeamMember(selectedTeam, employee, "member")}
                                            data-testid={`button-add-member-${employee.id}`}
                                          >
                                            <UserPlus className="h-4 w-4 mr-1" />
                                            Üye Ekle
                                          </Button>
                                          <Button
                                            variant="default"
                                            size="sm"
                                            onClick={() => addTeamMember(selectedTeam, employee, "leader")}
                                            data-testid={`button-add-leader-${employee.id}`}
                                          >
                                            <Shield className="h-4 w-4 mr-1" />
                                            Lider Ekle
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                  
                                  {getFilteredEmployees(getAvailableEmployees(selectedTeam)).length === 0 && (
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