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
    
    // Safety specialists can see their inspection history
    if (['safety_specialist', 'occupational_physician'].includes(user?.role || '')) {
      baseItems.push(
        { path: "/inspection-history", label: "Denetim Geçmişim", icon: BarChart3 },
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
              <span className="text-white text-sm font-bold">Z</span>
            </div>
            <span className="text-lg font-bold text-gray-900">Zorlu</span>
          </div>
        </div>

        {/* Right side - Apps, Country, Notifications, Profile */}
        <div className="flex items-center space-x-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors">
                <span>Kurumsal Uygulamalar</span>
                <ChevronDown size={16} className="ml-1" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>İSG Rapor Sistemi</DropdownMenuItem>
              <DropdownMenuItem>Diğer Uygulamalar</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <div className="bg-red-500 px-2 py-1 rounded text-xs text-white font-medium">🇹🇷</div>
          
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
      <aside className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:top-16 bg-white border-r border-gray-200 shadow-sm transition-all duration-300 z-20 ${
        isSidebarCollapsed ? 'lg:w-16' : 'lg:w-64'
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

      {/* Mobile Header */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors mr-3"
              data-testid="button-mobile-menu"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center">
              <div className="bg-primary w-8 h-8 rounded-lg flex items-center justify-center mr-2">
                <span className="text-white text-sm font-bold">Z</span>
              </div>
              <span className="text-lg font-bold text-gray-900">Zorlu</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="bg-red-500 px-2 py-1 rounded text-xs text-white font-medium">🇹🇷</div>
            <NotificationDropdown />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
                  data-testid="button-mobile-user-profile"
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
                  onClick={() => setLocation('/profile/edit')}
                  className="flex items-center px-3 py-2 text-gray-700 hover:text-primary hover:bg-gray-50 rounded-lg cursor-pointer"
                >
                  <User size={16} className="mr-3" />
                  Profilimi Görüntüle
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={logout}
                  className="flex items-center px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg cursor-pointer"
                >
                  <LogOut size={16} className="mr-3" />
                  Çıkış Yap
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Modern Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-white shadow-2xl transform transition-transform duration-300">
            <div className="flex flex-col h-full">
              {/* Modern Mobile Header */}
              <div className="px-6 py-6 bg-gradient-to-r from-primary to-blue-600">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center mr-4 backdrop-blur-sm">
                    <HardHat className="text-white" size={20} />
                  </div>
                  <div className="flex flex-col text-white">
                    <h1 className="text-xl font-bold leading-tight">İSG Rapor Sistemi</h1>
                    <p className="text-xs text-blue-100">İş Sağlığı ve Güvenliği</p>
                  </div>
                </div>
              </div>

              {/* Mobile User Info */}
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <button
                  onClick={() => {
                    setLocation('/profile/edit');
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center w-full p-2 rounded-lg hover:bg-white transition-colors group"
                  data-testid="button-mobile-sidebar-profile"
                >
                  <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center mr-3 shadow-sm group-hover:bg-primary/90 transition-colors">
                    <span className="text-white text-sm font-bold">
                      {(user?.fullName || user?.username || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex flex-col text-left flex-1">
                    <span className="text-sm font-semibold text-gray-900 group-hover:text-primary transition-colors">
                      {user?.fullName || user?.username}
                    </span>
                    <span className="text-xs text-gray-500">
                      {getRoleDisplayName(user?.role)}
                    </span>
                  </div>
                  <User size={14} className="text-gray-400 group-hover:text-primary transition-colors" />
                </button>
              </div>

              {/* Mobile Navigation */}
              <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = (item.path === "/dashboard" && (location === "/" || location === "/dashboard")) || location === item.path;
                  
                  return (
                    <button
                      key={item.path}
                      className={`w-full flex items-center px-4 py-4 rounded-xl text-left transition-all duration-200 ${
                        isActive
                          ? "bg-primary text-white shadow-lg scale-[0.98]"
                          : "text-gray-700 hover:text-primary hover:bg-blue-50 hover:scale-[0.98]"
                      }`}
                      onClick={() => {
                        setLocation(item.path);
                        setIsMobileMenuOpen(false);
                      }}
                      data-testid={`nav-mobile-${item.path.slice(1) || "home"}`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${
                        isActive ? "bg-white bg-opacity-20" : "bg-gray-100"
                      }`}>
                        <Icon size={18} className={isActive ? "text-white" : "text-current"} />
                      </div>
                      <span className="font-medium text-base">{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              {/* Mobile Logout */}
              <div className="px-4 py-4 border-t border-gray-200 bg-gray-50">
                <Button
                  variant="ghost"
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full justify-start hover:bg-red-50 hover:text-red-600 transition-colors py-4 rounded-xl"
                  data-testid="button-mobile-logout"
                >
                  <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center mr-3">
                    <LogOut size={18} className="text-red-600" />
                  </div>
                  <span className="font-medium text-base">Çıkış Yap</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 pt-16 ${
        isSidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'
      }`}>
        <div className="h-full overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
