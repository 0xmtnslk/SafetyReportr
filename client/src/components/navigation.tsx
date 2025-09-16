import { useState } from "react";
import { Button } from "@/components/ui/button";
import { HardHat, Home, Plus, FileText, LogOut, Shield, Menu, X, CheckSquare, BarChart3, TrendingUp, User, ChevronDown, ChevronLeft, ChevronRight, Bell, Building2, AlertTriangle, Calendar, Siren, Package, Activity, Search, Settings, ClipboardList, Zap, Truck, BookOpen, Factory, FileBarChart } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import NotificationDropdown from "./NotificationDropdown";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

// Helper function to get role display names
const getRoleDisplayName = (role?: string) => {
  const roleNames: Record<string, string> = {
    'central_admin': 'Merkez Yönetim (ADMIN)',
    'safety_specialist': 'İş Güvenliği Uzmanı',
    'occupational_physician': 'İşyeri Hekimi',
    'responsible_manager': 'Sorumlu Müdür',
    'user': 'Normal Kullanıcı'
  };
  return roleNames[role || ''] || role || 'Normal Kullanıcı';
};

// Navigation hierarchy types
interface SubActivity {
  id: string;
  label: string;
  path: string;
  icon?: any;
}

interface Subsection {
  id: string;
  label: string;
  path?: string;
  icon: any;
  subActivities?: SubActivity[];
}

interface MainSection {
  id: string;
  label: string;
  icon: any;
  subsections: Subsection[];
}

interface FlatNavItem {
  path: string;
  label: string;
  icon: any;
}

interface NavigationProps {
  children: React.ReactNode;
}

export default function Navigation({ children }: NavigationProps) {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true); // Varsayılan olarak daraltılmış
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [expandedSubsections, setExpandedSubsections] = useState<Record<string, boolean>>({});

  // Hierarchical navigation structure for specialists
  const getHierarchicalNavigation = (): MainSection[] => {
    if (!['central_admin', 'safety_specialist', 'occupational_physician'].includes(user?.role || '')) {
      return [];
    }

    return [
      {
        id: 'safety-management',
        label: 'İş Güvenliği Yönetimi',
        icon: Shield,
        subsections: [
          {
            id: 'annual-plans',
            label: 'Yıllık Planlar',
            icon: Calendar,
            path: '/annual-plans',
            subActivities: [
              { id: 'training-plan', label: 'Yıllık Eğitim Planı', path: '/annual-plans/training' },
              { id: 'work-plan', label: 'Yıllık Çalışma Planı', path: '/annual-plans/work' }
            ]
          },
          {
            id: 'emergency-management',
            label: 'Acil Durum Yönetimi',
            icon: Siren,
            path: '/emergency-management',
            subActivities: [
              { id: 'hap-management', label: 'HAP Yönetimi', path: '/emergency-management/hap' },
              { id: 'emergency-teams', label: 'Acil Durum Ekipleri', path: '/emergency-management/teams' },
              { id: 'drills', label: 'Tatbikatlar', path: '/emergency-management/drills' }
            ]
          },
          {
            id: 'hazardous-materials',
            label: 'Tehlikeli Madde Yönetimi',
            icon: Package,
            path: '/hazardous-materials',
            subActivities: [
              { id: 'facility-inventory', label: 'Tesis Envanteri', path: '/hazardous-materials/inventory' },
              { id: 'safety-cards', label: 'Güvenlik Bilgi Kartları', path: '/hazardous-materials/safety-cards' },
              { id: 'inventory-amount', label: 'Envanter Miktarı', path: '/hazardous-materials/amounts' }
            ]
          },
          {
            id: 'risk-assessment',
            label: 'Risk Değerlendirmesi',
            icon: AlertTriangle,
            path: '/risk-assessment',
            subActivities: [
              { id: 'risk-dashboard', label: 'Dashboard', path: '/risk-assessment' },
              { id: 'risk-evaluations', label: 'Değerlendirmeler', path: '/risk-assessment/evaluations' },
              { id: 'risk-departments', label: 'Bölümler', path: '/risk-assessment/departments' },
              { id: 'risk-reports', label: 'Raporlar', path: '/risk-assessment/reports' }
            ]
          },
          {
            id: 'accident-management',
            label: 'İş Kazası ve Ramak Kala',
            icon: Activity,
            path: '/accident-management',
            subActivities: [
              { id: 'accident-dashboard', label: 'Dashboard', path: '/accident-management' },
              { id: 'accidents', label: 'İş Kazası', path: '/accident-management/accidents' },
              { id: 'near-miss', label: 'Ramak Kala', path: '/accident-management/near-miss' }
            ]
          },
          {
            id: 'incident-management',
            label: 'Olağandışı Olay Yönetimi',
            icon: Zap,
            path: '/incident-management'
          },
          {
            id: 'audit-management',
            label: 'Denetim Yönetimi',
            icon: Search,
            path: '/reports' // Consolidated reports page
          },
          {
            id: 'annual-evaluation',
            label: 'Yıllık Değerlendirme Raporu',
            icon: FileBarChart,
            path: '/annual-evaluation'
          },
          {
            id: 'detection-book',
            label: 'İSG Tespit ve Öneri Defteri',
            icon: BookOpen,
            path: '/detection-book'
          }
        ]
      },
      {
        id: 'occupational-health',
        label: 'İş Sağlığı Yönetimi',
        icon: Activity,
        subsections: [
          {
            id: 'medical-examinations',
            label: 'İşe Giriş ve Periyodik Muayene',
            icon: ClipboardList,
            path: '/medical-examinations'
          }
        ]
      },
      {
        id: 'environmental-management',
        label: 'Çevre Yönetimi',
        icon: Factory,
        subsections: [
          {
            id: 'env-reports',
            label: 'Raporlar',
            icon: FileText,
            path: '/environmental/reports'
          },
          {
            id: 'waste-management',
            label: 'Atık Yönetimi',
            icon: Truck,
            path: '/environmental/waste',
            subActivities: [
              { id: 'waste-declarations', label: 'Atık Beyanları', path: '/environmental/waste/declarations' },
              { id: 'waste-process', label: 'Atık Süreci', path: '/environmental/waste/process' }
            ]
          },
          {
            id: 'documentation',
            label: 'Dokümantasyon',
            icon: FileText,
            path: '/environmental/documentation'
          },
          {
            id: 'env-audit',
            label: 'Denetim Yönetimi',
            icon: Search,
            path: '/environmental/audit'
          }
        ]
      }
    ];
  };

  // Flat navigation items for basic users
  const getFlatNavItems = (): FlatNavItem[] => {
    const baseItems: FlatNavItem[] = [
      { path: "/dashboard", label: "Ana Sayfa", icon: Home },
    ];
    
    // All authenticated users can view reports
    baseItems.push({ path: "/reports", label: "Raporlar", icon: FileText });
    
    // Only admin users can access admin panel
    if (['central_admin', 'admin'].includes(user?.role || '')) {
      baseItems.push(
        { path: "/admin", label: "Yönetim Panel", icon: Shield }
      );
    }
    
    return baseItems;
  };

  const hierarchicalNav = getHierarchicalNavigation();
  const flatNavItems = getFlatNavItems();
  const isSpecialist = ['central_admin', 'safety_specialist', 'occupational_physician'].includes(user?.role || '');
  
  // Handle section expansion
  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };
  
  // Handle subsection expansion
  const toggleSubsection = (subsectionId: string) => {
    setExpandedSubsections(prev => ({
      ...prev,
      [subsectionId]: !prev[subsectionId]
    }));
  };
  
  // Get current path for active state checks
  const isPathActive = (path?: string) => {
    if (!path) return false;
    return (path === "/dashboard" && (location === "/" || location === "/dashboard")) || location === path;
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 shadow-sm z-30 flex items-center justify-between px-4">
        {/* Left side - Hamburger + Logo */}
        <div className="flex items-center">
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors mr-4"
            data-testid="button-toggle-sidebar"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center">
            <div className="bg-primary w-8 h-8 rounded-lg flex items-center justify-center mr-3">
              <HardHat className="text-white" size={16} />
            </div>
            <span className="text-lg font-bold text-gray-900">Sağlık, Eminyet Çevre Yönetim Sistemi</span>
          </div>
        </div>

        {/* Right side - Notifications, Profile */}
        <div className="flex items-center space-x-4">
          <NotificationDropdown />
          
          <DropdownMenu open={isProfileDropdownOpen} onOpenChange={setIsProfileDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <button
                className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
                data-testid="button-header-profile"
              >
                <span className="text-white text-sm font-bold">
                  {(user?.fullName || user?.username || 'U').charAt(0).toUpperCase()}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 p-2" align="end">
              <div className="flex items-center px-3 py-3 rounded-lg bg-gray-50">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white text-sm font-bold">
                    {(user?.fullName || user?.username || 'U').charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-gray-900">
                    {user?.fullName || user?.username}
                  </span>
                  <span className="text-sm text-primary font-medium">
                    Merhaba {(user?.fullName || user?.username || 'Kullanıcı').split(' ')[0]}! 👋
                  </span>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setLocation('/profile/edit');
                  setIsProfileDropdownOpen(false);
                }}
                className="flex items-center px-3 py-2 text-gray-700 hover:text-primary hover:bg-gray-50 rounded-lg cursor-pointer"
              >
                <User size={16} className="mr-3" />
                Profilimi Görüntüle
              </DropdownMenuItem>
              {['safety_specialist', 'occupational_physician'].includes(user?.role || '') && (
                <DropdownMenuItem
                  onClick={() => {
                    setLocation('/hospital-management');
                    setIsProfileDropdownOpen(false);
                  }}
                  className="flex items-center px-3 py-2 text-gray-700 hover:text-primary hover:bg-gray-50 rounded-lg cursor-pointer"
                >
                  <Building2 size={16} className="mr-3" />
                  Hastane Yönetimi
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  logout();
                  setIsProfileDropdownOpen(false);
                }}
                className="flex items-center px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg cursor-pointer"
              >
                <LogOut size={16} className="mr-3" />
                Çıkış Yap
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      {/* Left Sidebar */}
      <aside className={`hidden md:flex md:flex-col md:fixed md:inset-y-0 md:top-16 bg-white border-r border-gray-200 shadow-sm transition-all duration-300 z-20 ${
        isSidebarCollapsed ? 'md:w-16' : 'md:w-64'
      } md:h-[calc(100vh-4rem)]`}>
        <div className="flex flex-col h-full">

          {/* Navigation Items */}
          <nav className={`flex-1 py-4 space-y-1 ${isSidebarCollapsed ? 'px-2' : 'px-4'} overflow-y-auto`}>
            {/* Always show Home */}
            <button
              className={`w-full flex items-center rounded-lg text-left transition-all duration-200 ${
                isSidebarCollapsed ? 'px-3 py-3 justify-center' : 'px-4 py-3'
              } ${
                isPathActive('/dashboard')
                  ? "bg-primary text-white"
                  : "text-gray-600 hover:text-primary hover:bg-gray-50"
              }`}
              onClick={() => setLocation('/dashboard')}
              data-testid="nav-dashboard"
              title={isSidebarCollapsed ? 'Ana Sayfa' : undefined}
            >
              <Home size={20} className={isPathActive('/dashboard') ? "text-white" : "text-current"} />
              {!isSidebarCollapsed && (
                <span className="font-medium ml-3">Ana Sayfa</span>
              )}
            </button>

            {/* Hierarchical Navigation for Specialists */}
            {isSpecialist && !isSidebarCollapsed && hierarchicalNav.map((section) => (
              <Collapsible
                key={section.id}
                open={expandedSections[section.id]}
                onOpenChange={() => toggleSection(section.id)}
              >
                <CollapsibleTrigger asChild>
                  <button
                    className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-left transition-colors text-gray-700 hover:text-primary hover:bg-gray-50 font-medium"
                    data-testid={`nav-section-${section.id}`}
                  >
                    <div className="flex items-center">
                      <section.icon size={20} className="text-current" />
                      <span className="ml-3">{section.label}</span>
                    </div>
                    <ChevronDown 
                      size={16} 
                      className={`text-current transition-transform ${
                        expandedSections[section.id] ? 'rotate-180' : ''
                      }`} 
                    />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-1 mt-1">
                  {section.subsections.map((subsection) => (
                    <div key={subsection.id} className="ml-4">
                      <button
                        className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${
                          subsection.path && isPathActive(subsection.path)
                            ? "bg-primary text-white"
                            : "text-gray-600 hover:text-primary hover:bg-gray-50"
                        }`}
                        onClick={() => {
                          if (subsection.path) {
                            setLocation(subsection.path);
                          }
                        }}
                        data-testid={`nav-subsection-${subsection.id}`}
                      >
                        <subsection.icon size={18} className={subsection.path && isPathActive(subsection.path) ? "text-white" : "text-current"} />
                        <span className={`ml-3 text-sm ${subsection.path && isPathActive(subsection.path) ? "text-white" : ""}`}>{subsection.label}</span>
                      </button>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            ))}

            {/* Collapsed Sidebar - Show only main sections */}
            {isSpecialist && isSidebarCollapsed && (
              <>
                {/* Main Sections Only for Collapsed State */}
                {hierarchicalNav.map((section) => {
                  const SectionIcon = section.icon;
                  // Check if any subsection path is active to highlight main section
                  const isMainSectionActive = section.subsections.some(sub => sub.path && isPathActive(sub.path));
                  
                  return (
                    <button
                      key={section.id}
                      className={`w-full flex items-center justify-center px-3 py-3 rounded-lg transition-all duration-200 ${
                        isMainSectionActive
                          ? "bg-primary text-white"
                          : "text-gray-600 hover:text-primary hover:bg-gray-50"
                      }`}
                      onClick={() => setIsSidebarCollapsed(false)} // Expand on click
                      data-testid={`nav-collapsed-${section.id}`}
                      title={section.label}
                    >
                      <SectionIcon size={20} className={isMainSectionActive ? "text-white" : "text-current"} />
                    </button>
                  );
                })}
              </>
            )}
            
            {/* Flat Navigation for Other Users */}
            {!isSpecialist && flatNavItems.slice(1).map((item: FlatNavItem) => {
              const Icon = item.icon;
              const isActive = isPathActive(item.path);
              
              return (
                <button
                  key={item.path}
                  className={`w-full flex items-center rounded-lg text-left transition-all duration-200 ${
                    isSidebarCollapsed ? 'px-3 py-3 justify-center' : 'px-4 py-3'
                  } ${
                    isActive
                      ? "bg-primary text-white"
                      : "text-gray-600 hover:text-primary hover:bg-gray-50"
                  }`}
                  onClick={() => setLocation(item.path)}
                  data-testid={`nav-${item.path.slice(1) || "home"}`}
                  title={isSidebarCollapsed ? item.label : undefined}
                >
                  <Icon size={20} className={isActive ? "text-white" : "text-current"} />
                  {!isSidebarCollapsed && (
                    <span className="font-medium ml-3">{item.label}</span>
                  )}
                </button>
              );
            })}
            
            {/* Additional flat navigation for specialists when collapsed */}
            {isSpecialist && isSidebarCollapsed && hierarchicalNav.map((section) => 
              section.subsections.map((subsection) => {
                if (!subsection.path) return null;
                const Icon = subsection.icon;
                const isActive = isPathActive(subsection.path);
                
                return (
                  <button
                    key={subsection.path}
                    className={`w-full flex items-center rounded-lg text-left transition-all duration-200 px-3 py-3 justify-center ${
                      isActive
                        ? "bg-primary text-white"
                        : "text-gray-600 hover:text-primary hover:bg-gray-50"
                    }`}
                    onClick={() => subsection.path && setLocation(subsection.path)}
                    data-testid={`nav-collapsed-${subsection.id}`}
                    title={subsection.label}
                  >
                    <Icon size={20} className={isActive ? "text-white" : "text-current"} />
                  </button>
                );
              })
            )}
          </nav>

          {/* Bottom Section - Fixed at bottom */}
          <div className={`flex-shrink-0 border-t border-gray-200 ${isSidebarCollapsed ? 'px-2 py-2' : 'px-4 py-2'}`}>
            <button
              onClick={logout}
              className={`w-full flex items-center rounded-lg text-left transition-all duration-200 text-red-600 hover:text-red-700 hover:bg-red-50 ${
                isSidebarCollapsed ? 'px-3 py-3 justify-center' : 'px-4 py-3'
              }`}
              data-testid="sidebar-logout"
              title={isSidebarCollapsed ? 'Çıkış Yap' : undefined}
            >
              <LogOut size={20} />
              {!isSidebarCollapsed && (
                <span className="font-medium ml-3">Çıkış Yap</span>
              )}
            </button>
          </div>

          {/* Sidebar Toggle Arrow */}
          <div className={`flex-shrink-0 border-t border-gray-200 ${isSidebarCollapsed ? 'px-2 py-2' : 'px-4 py-2'}`}>
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className={`w-full flex items-center rounded-lg text-gray-600 hover:text-primary hover:bg-gray-50 transition-colors ${
                isSidebarCollapsed ? 'px-3 py-3 justify-center' : 'px-4 py-3'
              }`}
              data-testid="button-sidebar-toggle"
              title={isSidebarCollapsed ? 'Menüyü Genişlet' : 'Menüyü Daralt'}
            >
              {isSidebarCollapsed ? (
                <ChevronRight size={20} />
              ) : (
                <>
                  <ChevronLeft size={20} />
                  <span className="font-medium ml-3">Daralt</span>
                </>
              )}
            </button>
          </div>

        </div>
      </aside>


      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div 
            className="fixed inset-0 bg-black bg-opacity-50" 
            onClick={() => setIsMobileMenuOpen(false)}
            data-testid="mobile-overlay"
          />
          <div className="fixed inset-y-0 left-0 w-72 bg-white shadow-xl">
            <div className="flex flex-col h-full">
              {/* Mobile Sidebar Header */}
              <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
                <div className="flex items-center">
                  <div className="bg-primary w-8 h-8 rounded-lg flex items-center justify-center mr-3">
                    <HardHat className="text-white" size={16} />
                  </div>
                  <span className="font-bold text-gray-900">Sağlık, Eminyet Çevre Yönetim Sistemi</span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1 rounded-lg text-gray-600 hover:bg-gray-100"
                  data-testid="button-close-mobile-sidebar"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Mobile Navigation */}
              <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto max-h-full">
                {/* Always show Home */}
                <button
                  className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${
                    isPathActive('/dashboard')
                      ? "bg-primary text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  onClick={() => {
                    setLocation('/dashboard');
                    setIsMobileMenuOpen(false);
                  }}
                  data-testid="nav-mobile-dashboard"
                >
                  <Home size={18} className={isPathActive('/dashboard') ? "text-white" : "text-current"} />
                  <span className="ml-3 text-sm">Ana Sayfa</span>
                </button>

                {/* Mobile navigation based on user role */}
                {isSpecialist ? (
                  /* Hierarchical navigation for specialists on mobile */
                  hierarchicalNav.map((section) => (
                    <Collapsible
                      key={section.id}
                      open={expandedSections[section.id]}
                      onOpenChange={() => toggleSection(section.id)}
                    >
                      <CollapsibleTrigger asChild>
                        <button
                          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors text-gray-700 hover:text-primary hover:bg-gray-50 font-medium"
                          data-testid={`nav-mobile-section-${section.id}`}
                        >
                          <div className="flex items-center">
                            <section.icon size={18} className="text-current" />
                            <span className="ml-3 text-sm">{section.label}</span>
                          </div>
                          <ChevronDown 
                            size={14} 
                            className={`text-current transition-transform ${
                              expandedSections[section.id] ? 'rotate-180' : ''
                            }`} 
                          />
                        </button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-1 mt-1">
                        {section.subsections.map((subsection) => (
                          <div key={subsection.id} className="ml-4">
                            <button
                              className={`w-full flex items-center px-2 py-1.5 rounded-lg text-left transition-colors ${
                                subsection.path && isPathActive(subsection.path)
                                  ? "bg-primary text-white"
                                  : "text-gray-600 hover:text-primary hover:bg-gray-50"
                              }`}
                              onClick={() => {
                                if (subsection.path) {
                                  setLocation(subsection.path);
                                  setIsMobileMenuOpen(false);
                                }
                              }}
                              data-testid={`nav-mobile-subsection-${subsection.id}`}
                            >
                              <subsection.icon size={16} className={subsection.path && isPathActive(subsection.path) ? "text-white" : "text-current"} />
                              <span className={`ml-2 text-xs ${subsection.path && isPathActive(subsection.path) ? "text-white" : ""}`}>{subsection.label}</span>
                            </button>
                          </div>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  ))
                ) : (
                  /* Flat navigation for non-specialists on mobile */
                  flatNavItems.slice(1).map((item: FlatNavItem) => {
                    const Icon = item.icon;
                    const isActive = isPathActive(item.path);
                    
                    return (
                      <button
                        key={item.path}
                        className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${
                          isActive
                            ? "bg-primary text-white"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                        onClick={() => {
                          setLocation(item.path);
                          setIsMobileMenuOpen(false);
                        }}
                        data-testid={`nav-mobile-${item.path.slice(1) || "home"}`}
                      >
                        <Icon size={18} className={isActive ? "text-white" : "text-current"} />
                        <span className="ml-3 text-sm">{item.label}</span>
                      </button>
                    );
                  })
                )}
              </nav>

              {/* Mobile Bottom Section */}
              <div className="border-t border-gray-200 p-3 bg-gray-50">
                <button
                  onClick={() => {
                    setLocation('/profile/edit');
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center px-3 py-2 rounded-lg text-gray-700 hover:bg-white transition-colors mb-2"
                  data-testid="button-mobile-profile"
                >
                  <User size={16} />
                  <span className="ml-3 text-sm">Profil</span>
                </button>
                <button
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                  data-testid="button-mobile-logout"
                >
                  <LogOut size={16} />
                  <span className="ml-3 text-sm">Çıkış Yap</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile-first responsive header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 z-40">
        <div className="flex items-center justify-between px-4 h-full">
          <div className="flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              data-testid="button-mobile-menu"
            >
              <Menu size={18} />
            </button>
            <div className="flex items-center ml-2">
              <div className="bg-primary w-7 h-7 rounded flex items-center justify-center mr-2">
                <HardHat className="text-white" size={14} />
              </div>
              <span className="font-semibold text-gray-900 text-sm">Sağlık, Eminyet Çevre Yönetim Sistemi</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <NotificationDropdown />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
                  data-testid="button-mobile-profile-dropdown"
                >
                  <span className="text-white text-xs font-bold">
                    {(user?.fullName || user?.username || 'U').charAt(0).toUpperCase()}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 p-2" align="end">
                <div className="flex items-center px-3 py-2 rounded-lg bg-gray-50 mb-2">
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mr-3">
                    <span className="text-white text-xs font-bold">
                      {(user?.fullName || user?.username || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-gray-900">
                      {user?.fullName || user?.username}
                    </span>
                    <span className="text-xs text-primary">
                      {getRoleDisplayName(user?.role)}
                    </span>
                  </div>
                </div>
                <DropdownMenuItem
                  onClick={() => setLocation('/profile/edit')}
                  className="flex items-center px-3 py-2 text-gray-700 hover:text-primary hover:bg-gray-50 rounded-lg cursor-pointer"
                  data-testid="menu-mobile-profile-edit"
                >
                  <User size={14} className="mr-3" />
                  Profil
                </DropdownMenuItem>
                {['safety_specialist', 'occupational_physician'].includes(user?.role || '') && (
                  <DropdownMenuItem
                    onClick={() => setLocation('/hospital-management')}
                    className="flex items-center px-3 py-2 text-gray-700 hover:text-primary hover:bg-gray-50 rounded-lg cursor-pointer"
                    data-testid="menu-mobile-hospital-management"
                  >
                    <Building2 size={14} className="mr-3" />
                    Hastane Yönetimi
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={logout}
                  className="flex items-center px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg cursor-pointer"
                  data-testid="menu-mobile-logout"
                >
                  <LogOut size={14} className="mr-3" />
                  Çıkış
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 pt-16 md:pt-16 ${
        isSidebarCollapsed ? 'md:pl-16' : 'md:pl-64'
      }`}>
        <div className="h-full overflow-auto pt-14 md:pt-0">
          {children}
        </div>
      </main>
    </div>
  );
}
