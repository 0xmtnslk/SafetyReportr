interface OfflineStorageItem {
  id: string;
  type: "report" | "finding";
  data: any;
  action: "create" | "update" | "delete";
  timestamp: number;
  synced: boolean;
}

class OfflineStorageManager {
  private storageKey = "isg_offline_data";

  // Save data to local storage
  saveItem(item: Omit<OfflineStorageItem, "id" | "timestamp" | "synced">): string {
    const items = this.getItems();
    const newItem: OfflineStorageItem = {
      ...item,
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      synced: false,
    };

    items.push(newItem);
    localStorage.setItem(this.storageKey, JSON.stringify(items));
    return newItem.id;
  }

  // Get all items
  getItems(): OfflineStorageItem[] {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Error parsing offline storage data:", error);
      return [];
    }
  }

  // Get unsynced items
  getUnsyncedItems(): OfflineStorageItem[] {
    return this.getItems().filter(item => !item.synced);
  }

  // Mark item as synced
  markItemSynced(id: string): void {
    const items = this.getItems();
    const itemIndex = items.findIndex(item => item.id === id);
    
    if (itemIndex !== -1) {
      items[itemIndex].synced = true;
      localStorage.setItem(this.storageKey, JSON.stringify(items));
    }
  }

  // Remove item
  removeItem(id: string): void {
    const items = this.getItems().filter(item => item.id !== id);
    localStorage.setItem(this.storageKey, JSON.stringify(items));
  }

  // Clear all synced items
  clearSyncedItems(): void {
    const items = this.getItems().filter(item => !item.synced);
    localStorage.setItem(this.storageKey, JSON.stringify(items));
  }

  // Get storage size
  getStorageSize(): number {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? new Blob([data]).size : 0;
    } catch (error) {
      return 0;
    }
  }
}

export const offlineStorage = new OfflineStorageManager();
