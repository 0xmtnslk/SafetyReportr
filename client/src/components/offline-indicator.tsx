import { useState, useEffect } from "react";
import { WifiOff } from "lucide-react";

export default function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed top-20 right-6 z-50" data-testid="offline-indicator">
      <div className="bg-warning text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
        <WifiOff size={16} />
        <span className="text-sm font-medium">
          Çevrimdışı - Veriler yerel olarak kaydediliyor
        </span>
      </div>
    </div>
  );
}
