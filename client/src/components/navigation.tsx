import { useState } from "react";
import { Button } from "@/components/ui/button";
import { HardHat, Home, Plus, FileText, LogOut, Shield } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";

// Helper function to get role display names
const getRoleDisplayName = (role?: string) => {
  const roleNames: Record<string, string> = {
    'central_admin': 'Merkez Yönetim',
    'location_manager': 'Lokasyon Yöneticisi',
    'safety_specialist': 'İş Güvenliği Uzmanı',
    'occupational_physician': 'İşyeri Hekimi',
    'technical_manager': 'Teknik Müdür',
    'user': 'Kullanıcı'
  };
  return roleNames[role || ''] || role || 'Kullanıcı';
};

export default function Navigation() {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();

  // Role-based navigation items
  const getNavItems = () => {
    const baseItems = [
      { path: "/dashboard", label: "Ana Sayfa", icon: Home },
    ];
    
    // Safety specialists and above can create reports
    if (['central_admin', 'location_manager', 'safety_specialist'].includes(user?.role || '')) {
      baseItems.push(
        { path: "/create-report", label: "Yeni Rapor", icon: Plus },
      );
    }
    
    // All authenticated users can view reports
    baseItems.push({ path: "/reports", label: "Raporlar", icon: FileText });
    
    // Central management and location managers can access admin panel
    if (['central_admin', 'location_manager', 'safety_specialist'].includes(user?.role || '')) {
      baseItems.push({ path: "/admin", label: "Yönetim Panel", icon: Shield });
    }
    
    return baseItems;
  };

  const navItems = getNavItems();

  return (
    <>
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="bg-gradient-to-r from-primary to-blue-600 w-10 h-10 rounded-xl flex items-center justify-center mr-3 shadow-md">
                <HardHat className="text-white" size={18} />
              </div>
              <div className="flex flex-col">
                <h1 className="text-lg font-bold text-gray-900 leading-tight">
                  İSG Rapor Sistemi
                </h1>
                <p className="text-xs text-gray-500 hidden sm:block">İş Sağlığı ve Güvenliği</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="hidden md:flex items-center bg-gray-50 px-3 py-2 rounded-lg">
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center mr-2">
                  <span className="text-white text-xs font-bold">
                    {(user?.fullName || user?.username || 'U').charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-sm font-medium text-gray-700" data-testid="user-name">
                    {user?.fullName || user?.username}
                  </span>
                  <span className="text-xs text-gray-500" data-testid="user-role">
                    {getRoleDisplayName(user?.role)}
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="hover:bg-red-50 hover:text-red-600 transition-colors"
                data-testid="button-logout"
              >
                <LogOut size={16} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 overflow-x-auto scrollbar-hide">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = (item.path === "/dashboard" && (location === "/" || location === "/dashboard")) || location === item.path;
              
              return (
                <button
                  key={item.path}
                  className={`relative px-4 py-3 rounded-lg font-medium text-sm whitespace-nowrap transition-all duration-200 flex items-center space-x-2 ${
                    isActive
                      ? "bg-primary text-white shadow-md transform scale-105"
                      : "text-gray-600 hover:text-primary hover:bg-gray-50"
                  }`}
                  onClick={() => setLocation(item.path)}
                  data-testid={`nav-${item.path.slice(1) || "home"}`}
                >
                  <Icon size={16} className={isActive ? "text-white" : "text-current"} />
                  <span className="hidden sm:inline">{item.label}</span>
                  <span className="sm:hidden text-xs">{item.label.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}
