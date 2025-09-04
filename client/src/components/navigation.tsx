import { useState } from "react";
import { Button } from "@/components/ui/button";
import { HardHat, Home, Plus, FileText, LogOut, Shield, Menu, X, CheckSquare, BarChart3, TrendingUp, User, ChevronDown, ChevronLeft, ChevronRight, Bell } from "lucide-react";
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

interface NavigationProps {
  children: React.ReactNode;
}

export default function Navigation({ children }: NavigationProps) {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true); // Varsayılan olarak daraltılmış

  // Role-based navigation items
  const getNavItems = () => {
    const baseItems = [
      { path: "/dashboard", label: "Ana Sayfa", icon: Home },
    ];
    
    // Safety specialists, occupational physicians and admin can create reports
    if (['central_admin', 'safety_specialist', 'occupational_physician'].includes(user?.role || '')) {
      baseItems.push(
        { path: "/create-report", label: "Yeni Rapor", icon: Plus },
      );
    }
    
    // Safety specialists can see their inspection history and manage hospital
    if (['safety_specialist', 'occupational_physician'].includes(user?.role || '')) {
      baseItems.push(
        { path: "/inspection-history", label: "Denetim Geçmişim", icon: BarChart3 },
        { path: "/hospital-management", label: "Hastane Yönetimi", icon: Building2 },
      );
    }
    
    // All authenticated users can view reports
    baseItems.push({ path: "/reports", label: "Raporlar", icon: FileText });
    
    // Checklist system for admin only
    if (['central_admin', 'admin'].includes(user?.role || '')) {
      baseItems.push({ path: "/checklist", label: "Kontrol Listeleri Yönetimi", icon: CheckSquare });
    }
    
    // Only admin users can access admin panel
    if (['central_admin', 'admin'].includes(user?.role || '')) {
      baseItems.push(
        { path: "/admin", label: "Yönetim Panel", icon: Shield },
        { path: "/inspection-results-admin", label: "Denetim Sonuçları", icon: TrendingUp }
      );
    }
    
    return baseItems;
  };

  const navItems = getNavItems();

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
            <span className="text-lg font-bold text-gray-900">İSG Rapor Sistemi</span>
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
      }`}>
        <div className="flex flex-col flex-1">

          {/* Navigation Items */}
          <nav className={`flex-1 py-4 space-y-1 ${isSidebarCollapsed ? 'px-2' : 'px-4'}`}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = (item.path === "/dashboard" && (location === "/" || location === "/dashboard")) || location === item.path;
              
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
          </nav>

          {/* Logout Button */}
          <div className={`border-t border-gray-200 ${isSidebarCollapsed ? 'px-2 py-2' : 'px-4 py-2'}`}>
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
          <div className={`border-t border-gray-200 ${isSidebarCollapsed ? 'px-2 py-2' : 'px-4 py-4'}`}>
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
                  <span className="font-bold text-gray-900">İSG Rapor</span>
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
              <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = (item.path === "/dashboard" && (location === "/" || location === "/dashboard")) || location === item.path;
                  
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
                })}
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
              <span className="font-semibold text-gray-900 text-sm">İSG Rapor</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <NotificationDropdown />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
                  data-testid="button-mobile-profile"
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
                  </div>
                </div>
                <DropdownMenuItem
                  onClick={() => setLocation('/profile/edit')}
                  className="flex items-center px-3 py-2 text-gray-700 hover:text-primary hover:bg-gray-50 rounded-lg cursor-pointer"
                >
                  <User size={14} className="mr-3" />
                  Profil
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={logout}
                  className="flex items-center px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg cursor-pointer"
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
