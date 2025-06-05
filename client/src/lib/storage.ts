// IndexedDB wrapper for offline storage
export interface OfflineInspection {
  id?: number;
  localId: string;
  clientId?: number;
  userId: number;
  date: Date;
  development: string;
  city: string;
  state: string;
  address: string;
  cep: string;
  protocol: string;
  subject: string;
  technician: string;
  department: string;
  unit: string;
  coordinator: string;
  manager: string;
  regional: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  syncedAt?: Date;
  tiles: OfflineTile[];
  nonConformities: OfflineNonConformity[];
}

export interface OfflineTile {
  id?: number;
  localId: string;
  inspectionLocalId: string;
  thickness: string;
  length: number;
  width: number;
  quantity: number;
  grossArea: number;
  correctedArea: number;
}

export interface OfflineNonConformity {
  id?: number;
  localId: string;
  inspectionLocalId: string;
  type: string;
  title: string;
  description?: string;
  notes?: string;
  photos: string[];
}

export interface OfflineClient {
  id?: number;
  localId: string;
  name: string;
  cnpjCpf?: string;
  contact?: string;
  email?: string;
  createdAt: Date;
}

class OfflineStorage {
  private dbName = 'vigitel-offline';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Inspections store
        if (!db.objectStoreNames.contains('inspections')) {
          const inspectionStore = db.createObjectStore('inspections', { keyPath: 'localId' });
          inspectionStore.createIndex('protocol', 'protocol', { unique: true });
          inspectionStore.createIndex('status', 'status');
          inspectionStore.createIndex('createdAt', 'createdAt');
          inspectionStore.createIndex('syncedAt', 'syncedAt');
        }

        // Clients store
        if (!db.objectStoreNames.contains('clients')) {
          const clientStore = db.createObjectStore('clients', { keyPath: 'localId' });
          clientStore.createIndex('name', 'name');
          clientStore.createIndex('cnpjCpf', 'cnpjCpf', { unique: false });
        }

        // Settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }

        // Photos store (for offline caching)
        if (!db.objectStoreNames.contains('photos')) {
          db.createObjectStore('photos', { keyPath: 'id' });
        }
      };
    });
  }

  private getStore(storeName: string, mode: IDBTransactionMode = 'readonly'): IDBObjectStore {
    if (!this.db) throw new Error('Database not initialized');
    const transaction = this.db.transaction([storeName], mode);
    return transaction.objectStore(storeName);
  }

  // Inspections
  async saveInspection(inspection: OfflineInspection): Promise<void> {
    const store = this.getStore('inspections', 'readwrite');
    await new Promise<void>((resolve, reject) => {
      const request = store.put(inspection);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getInspection(localId: string): Promise<OfflineInspection | undefined> {
    const store = this.getStore('inspections');
    return new Promise((resolve, reject) => {
      const request = store.get(localId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllInspections(): Promise<OfflineInspection[]> {
    const store = this.getStore('inspections');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async getUnsyncedInspections(): Promise<OfflineInspection[]> {
    const store = this.getStore('inspections');
    const index = store.index('syncedAt');
    return new Promise((resolve, reject) => {
      const request = index.getAll(IDBKeyRange.only(undefined));
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteInspection(localId: string): Promise<void> {
    const store = this.getStore('inspections', 'readwrite');
    await new Promise<void>((resolve, reject) => {
      const request = store.delete(localId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Clients
  async saveClient(client: OfflineClient): Promise<void> {
    const store = this.getStore('clients', 'readwrite');
    await new Promise<void>((resolve, reject) => {
      const request = store.put(client);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getClient(localId: string): Promise<OfflineClient | undefined> {
    const store = this.getStore('clients');
    return new Promise((resolve, reject) => {
      const request = store.get(localId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllClients(): Promise<OfflineClient[]> {
    const store = this.getStore('clients');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async searchClients(query: string): Promise<OfflineClient[]> {
    const allClients = await this.getAllClients();
    return allClients.filter(client =>
      client.name.toLowerCase().includes(query.toLowerCase()) ||
      (client.cnpjCpf && client.cnpjCpf.includes(query))
    );
  }

  // Settings
  async saveSetting(key: string, value: any): Promise<void> {
    const store = this.getStore('settings', 'readwrite');
    await new Promise<void>((resolve, reject) => {
      const request = store.put({ key, value });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getSetting(key: string): Promise<any> {
    const store = this.getStore('settings');
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result?.value);
      request.onerror = () => reject(request.error);
    });
  }

  // Photos
  async savePhoto(id: string, blob: Blob): Promise<void> {
    const store = this.getStore('photos', 'readwrite');
    await new Promise<void>((resolve, reject) => {
      const request = store.put({ id, blob });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getPhoto(id: string): Promise<Blob | undefined> {
    const store = this.getStore('photos');
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result?.blob);
      request.onerror = () => reject(request.error);
    });
  }

  // Utility methods
  async clear(): Promise<void> {
    if (!this.db) return;
    
    const storeNames = ['inspections', 'clients', 'settings', 'photos'];
    for (const storeName of storeNames) {
      const store = this.getStore(storeName, 'readwrite');
      await new Promise<void>((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
  }

  async getStorageUsage(): Promise<{ used: number; quota: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage || 0,
        quota: estimate.quota || 0,
      };
    }
    return { used: 0, quota: 0 };
  }
}

export const offlineStorage = new OfflineStorage();

// Utility functions
export const generateLocalId = (): string => {
  return `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const isOnline = (): boolean => {
  return navigator.onLine;
};

export const compressImage = async (file: File, maxSize: number = 2 * 1024 * 1024): Promise<Blob> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions
      const maxDimension = 1920;
      let { width, height } = img;
      
      if (width > height && width > maxDimension) {
        height = (height * maxDimension) / width;
        width = maxDimension;
      } else if (height > maxDimension) {
        width = (width * maxDimension) / height;
        height = maxDimension;
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      
      let quality = 0.9;
      const tryCompress = () => {
        canvas.toBlob((blob) => {
          if (blob && (blob.size <= maxSize || quality <= 0.1)) {
            resolve(blob);
          } else {
            quality -= 0.1;
            tryCompress();
          }
        }, 'image/jpeg', quality);
      };
      
      tryCompress();
    };

    img.src = URL.createObjectURL(file);
  });
};
