import { useState } from "react";
import { Button } from "@/components/ui/button";
import { HardHat, Home, Plus, FileText, LogOut, Shield, Menu, X } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";

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
    
    // All authenticated users can view reports
    baseItems.push({ path: "/reports", label: "Raporlar", icon: FileText });
    
    // Admin, safety specialists and occupational physicians can access admin panel
    if (['central_admin', 'safety_specialist', 'occupational_physician'].includes(user?.role || '')) {
      baseItems.push({ path: "/admin", label: "Yönetim Panel", icon: Shield });
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

      {/* Mobile Header */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
              data-testid="button-mobile-menu"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="bg-gradient-to-r from-primary to-blue-600 w-8 h-8 rounded-lg flex items-center justify-center ml-3 mr-2">
              <HardHat className="text-white" size={16} />
            </div>
            <h1 className="text-lg font-bold text-gray-900">İSG Rapor</h1>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">
                {(user?.fullName || user?.username || 'U').charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl">
            <div className="flex flex-col h-full">
              {/* Mobile Logo */}
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

              {/* Mobile Navigation */}
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
                      onClick={() => {
                        setLocation(item.path);
                        setIsMobileMenuOpen(false);
                      }}
                      data-testid={`nav-mobile-${item.path.slice(1) || "home"}`}
                    >
                      <Icon size={20} className={`mr-3 ${isActive ? "text-white" : "text-current"}`} />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              {/* Mobile User Info & Logout */}
              <div className="px-4 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center mr-3">
                      <span className="text-white text-sm font-bold">
                        {(user?.fullName || user?.username || 'U').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-700">
                        {user?.fullName || user?.username}
                      </span>
                      <span className="text-xs text-gray-500">
                        {getRoleDisplayName(user?.role)}
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full justify-start hover:bg-red-50 hover:text-red-600 transition-colors"
                  data-testid="button-mobile-logout"
                >
                  <LogOut size={16} className="mr-2" />
                  Çıkış Yap
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
