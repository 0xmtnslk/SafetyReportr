import { useState } from "react";
import { Button } from "@/components/ui/button";
import { HardHat, Home, Plus, FileText, LogOut, Shield, Menu, X, CheckSquare, BarChart3, TrendingUp } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import NotificationDropdown from "./NotificationDropdown";

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
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r border-gray-200 shadow-sm">
        <div className="flex flex-col flex-1">
          {/* Logo/Header */}
          <div className="flex items-center px-6 py-6 border-b border-gray-200">
            <div className="bg-gradient-to-r from-primary to-blue-600 w-10 h-10 rounded-xl flex items-center justify-center mr-3 shadow-md">
              <HardHat className="text-white" size={18} />
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg font-bold text-gray-900 leading-tight">
                İSG Rapor Sistemi
              </h1>
              <p className="text-xs text-gray-500">İş Sağlığı ve Güvenliği</p>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = (item.path === "/dashboard" && (location === "/" || location === "/dashboard")) || location === item.path;
              
              return (
                <button
                  key={item.path}
                  className={`w-full flex items-center px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                    isActive
                      ? "bg-primary text-white shadow-sm"
                      : "text-gray-600 hover:text-primary hover:bg-gray-50"
                  }`}
                  onClick={() => setLocation(item.path)}
                  data-testid={`nav-${item.path.slice(1) || "home"}`}
                >
                  <Icon size={20} className={`mr-3 ${isActive ? "text-white" : "text-current"}`} />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* User Info & Logout */}
          <div className="px-4 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center mr-3">
                  <span className="text-white text-sm font-bold">
                    {(user?.fullName || user?.username || 'U').charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-700" data-testid="user-name">
                    {user?.fullName || user?.username}
                  </span>
                  <span className="text-xs text-gray-500" data-testid="user-role">
                    {getRoleDisplayName(user?.role)}
                  </span>
                </div>
              </div>
              <NotificationDropdown />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="w-full justify-start hover:bg-red-50 hover:text-red-600 transition-colors"
              data-testid="button-logout"
            >
              <LogOut size={16} className="mr-2" />
              Çıkış Yap
            </Button>
          </div>
        </div>
      </aside>

      {/* Modern Mobile Header */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between px-4 py-4 bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
          <div className="flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
              data-testid="button-mobile-menu"
            >
              <div className="w-5 h-5 flex flex-col justify-center space-y-1">
                <div className={`w-full h-0.5 bg-current transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`}></div>
                <div className={`w-full h-0.5 bg-current transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0' : ''}`}></div>
                <div className={`w-full h-0.5 bg-current transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></div>
              </div>
            </button>
            <div className="bg-gradient-to-r from-primary to-blue-600 w-9 h-9 rounded-xl flex items-center justify-center ml-3 mr-3 shadow-sm">
              <HardHat className="text-white" size={18} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">İSG Rapor</h1>
              <p className="text-xs text-gray-500 -mt-1">İş Sağlığı ve Güvenliği</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <NotificationDropdown />
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-sm">
              <span className="text-white text-sm font-bold">
                {(user?.fullName || user?.username || 'U').charAt(0).toUpperCase()}
              </span>
            </div>
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
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center mr-3 shadow-sm">
                    <span className="text-white text-sm font-bold">
                      {(user?.fullName || user?.username || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-gray-900">
                      {user?.fullName || user?.username}
                    </span>
                    <span className="text-xs text-gray-500">
                      {getRoleDisplayName(user?.role)}
                    </span>
                  </div>
                </div>
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
      <main className="flex-1 lg:pl-64">
        <div className="h-full overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
