import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export function useOfflineSync() {
  const { toast } = useToast();

  useEffect(() => {
    const syncOfflineData = async () => {
      try {
        const pendingItems = JSON.parse(localStorage.getItem("offline_queue") || "[]");
        
        if (pendingItems.length === 0) return;

        for (const item of pendingItems) {
          try {
            await apiRequest(item.method, item.url, item.data);
          } catch (error) {
            console.error("Failed to sync item:", item, error);
          }
        }

        localStorage.removeItem("offline_queue");
        
        if (pendingItems.length > 0) {
          toast({
            title: "Senkronizasyon Tamamlandı",
            description: `${pendingItems.length} adet veri başarıyla senkronize edildi`,
          });
        }
      } catch (error) {
        console.error("Sync error:", error);
      }
    };

    const handleOnline = () => {
      syncOfflineData();
    };

    window.addEventListener("online", handleOnline);

    // Initial sync check if already online
    if (navigator.onLine) {
      syncOfflineData();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, [toast]);

  // Function to queue data for offline sync
  const queueForOfflineSync = (method: string, url: string, data: any) => {
    const offlineQueue = JSON.parse(localStorage.getItem("offline_queue") || "[]");
    const newItem = {
      id: Date.now().toString(),
      method,
      url,
      data,
      timestamp: new Date().toISOString(),
    };
    
    offlineQueue.push(newItem);
    localStorage.setItem("offline_queue", JSON.stringify(offlineQueue));
  };

  return { queueForOfflineSync };
}
