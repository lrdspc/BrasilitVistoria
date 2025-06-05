import { InspectionFormData } from '@/types/inspection';

const DB_NAME = 'VigitelDB';
const DB_VERSION = 1;
const INSPECTIONS_STORE = 'inspections';
const PHOTOS_STORE = 'photos';

class OfflineStorage {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create inspections store
        if (!db.objectStoreNames.contains(INSPECTIONS_STORE)) {
          const inspectionsStore = db.createObjectStore(INSPECTIONS_STORE, { keyPath: 'offlineId' });
          inspectionsStore.createIndex('status', 'status', { unique: false });
          inspectionsStore.createIndex('protocol', 'protocol', { unique: true });
        }

        // Create photos store
        if (!db.objectStoreNames.contains(PHOTOS_STORE)) {
          const photosStore = db.createObjectStore(PHOTOS_STORE, { keyPath: 'id', autoIncrement: true });
          photosStore.createIndex('inspectionId', 'inspectionId', { unique: false });
        }
      };
    });
  }

  async saveInspection(inspection: InspectionFormData): Promise<void> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction([INSPECTIONS_STORE], 'readwrite');
    const store = transaction.objectStore(INSPECTIONS_STORE);
    
    // Generate offline ID if not exists
    if (!inspection.offlineId) {
      inspection.offlineId = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    await store.put(inspection);
  }

  async getInspection(offlineId: string): Promise<InspectionFormData | null> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction([INSPECTIONS_STORE], 'readonly');
    const store = transaction.objectStore(INSPECTIONS_STORE);
    
    return new Promise((resolve, reject) => {
      const request = store.get(offlineId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllInspections(): Promise<InspectionFormData[]> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction([INSPECTIONS_STORE], 'readonly');
    const store = transaction.objectStore(INSPECTIONS_STORE);
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async getPendingSyncInspections(): Promise<InspectionFormData[]> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction([INSPECTIONS_STORE], 'readonly');
    const store = transaction.objectStore(INSPECTIONS_STORE);
    const index = store.index('status');
    
    return new Promise((resolve, reject) => {
      const request = index.getAll(IDBKeyRange.only('completed'));
      request.onsuccess = () => {
        const completedInspections = request.result.filter(inspection => 
          inspection.offlineId && inspection.offlineId.startsWith('offline_')
        );
        resolve(completedInspections);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deleteInspection(offlineId: string): Promise<void> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction([INSPECTIONS_STORE], 'readwrite');
    const store = transaction.objectStore(INSPECTIONS_STORE);
    
    await store.delete(offlineId);
  }

  async savePhoto(blob: Blob, inspectionId: string): Promise<string> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction([PHOTOS_STORE], 'readwrite');
    const store = transaction.objectStore(PHOTOS_STORE);
    
    const photoData = {
      blob,
      inspectionId,
      timestamp: Date.now()
    };
    
    return new Promise((resolve, reject) => {
      const request = store.add(photoData);
      request.onsuccess = () => resolve(`photo_${request.result}`);
      request.onerror = () => reject(request.error);
    });
  }

  async getPhoto(photoId: string): Promise<Blob | null> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction([PHOTOS_STORE], 'readonly');
    const store = transaction.objectStore(PHOTOS_STORE);
    
    return new Promise((resolve, reject) => {
      const id = parseInt(photoId.replace('photo_', ''));
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result?.blob || null);
      request.onerror = () => reject(request.error);
    });
  }

  async clearSyncedData(): Promise<void> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction([INSPECTIONS_STORE, PHOTOS_STORE], 'readwrite');
    
    // Clear synced inspections
    const inspectionsStore = transaction.objectStore(INSPECTIONS_STORE);
    const inspectionRequest = inspectionsStore.openCursor();
    
    inspectionRequest.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        const inspection = cursor.value;
        if (inspection.status === 'completed' && !inspection.offlineId?.startsWith('offline_')) {
          cursor.delete();
        }
        cursor.continue();
      }
    };
  }
}

export const offlineStorage = new OfflineStorage();
