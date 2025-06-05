import type { Inspection, Tile, NonConformity, Client } from "@shared/schema";

// IndexedDB wrapper for offline storage
class OfflineStorage {
  private dbName = "vigitel_offline";
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

        // Create object stores
        if (!db.objectStoreNames.contains("inspections")) {
          const inspectionStore = db.createObjectStore("inspections", { keyPath: "id", autoIncrement: true });
          inspectionStore.createIndex("protocol", "protocol", { unique: true });
          inspectionStore.createIndex("status", "status");
        }

        if (!db.objectStoreNames.contains("clients")) {
          const clientStore = db.createObjectStore("clients", { keyPath: "id", autoIncrement: true });
          clientStore.createIndex("document", "document", { unique: true });
        }

        if (!db.objectStoreNames.contains("tiles")) {
          const tileStore = db.createObjectStore("tiles", { keyPath: "id", autoIncrement: true });
          tileStore.createIndex("inspectionId", "inspectionId");
        }

        if (!db.objectStoreNames.contains("nonConformities")) {
          const ncStore = db.createObjectStore("nonConformities", { keyPath: "id", autoIncrement: true });
          ncStore.createIndex("inspectionId", "inspectionId");
        }

        if (!db.objectStoreNames.contains("syncQueue")) {
          db.createObjectStore("syncQueue", { keyPath: "id", autoIncrement: true });
        }
      };
    });
  }

  async saveInspection(inspection: Partial<Inspection>): Promise<number> {
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["inspections"], "readwrite");
      const store = transaction.objectStore("inspections");
      const request = store.add({
        ...inspection,
        createdAt: new Date(),
        updatedAt: new Date(),
        offline: true,
      });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result as number);
    });
  }

  async updateInspection(id: number, updates: Partial<Inspection>): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["inspections"], "readwrite");
      const store = transaction.objectStore("inspections");
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const inspection = getRequest.result;
        if (!inspection) {
          reject(new Error("Inspection not found"));
          return;
        }

        const updatedInspection = {
          ...inspection,
          ...updates,
          updatedAt: new Date(),
        };

        const putRequest = store.put(updatedInspection);
        putRequest.onerror = () => reject(putRequest.error);
        putRequest.onsuccess = () => resolve();
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async getInspections(): Promise<Inspection[]> {
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["inspections"], "readonly");
      const store = transaction.objectStore("inspections");
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async saveTile(tile: Partial<Tile>): Promise<number> {
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["tiles"], "readwrite");
      const store = transaction.objectStore("tiles");
      const request = store.add({ ...tile, offline: true });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result as number);
    });
  }

  async getTilesByInspection(inspectionId: number): Promise<Tile[]> {
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["tiles"], "readonly");
      const store = transaction.objectStore("tiles");
      const index = store.index("inspectionId");
      const request = index.getAll(inspectionId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async saveNonConformity(nc: Partial<NonConformity>): Promise<number> {
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["nonConformities"], "readwrite");
      const store = transaction.objectStore("nonConformities");
      const request = store.add({ ...nc, offline: true });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result as number);
    });
  }

  async getNonConformitiesByInspection(inspectionId: number): Promise<NonConformity[]> {
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["nonConformities"], "readonly");
      const store = transaction.objectStore("nonConformities");
      const index = store.index("inspectionId");
      const request = index.getAll(inspectionId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async saveClient(client: Partial<Client>): Promise<number> {
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["clients"], "readwrite");
      const store = transaction.objectStore("clients");
      const request = store.add({
        ...client,
        createdAt: new Date(),
        offline: true,
      });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result as number);
    });
  }

  async getClients(): Promise<Client[]> {
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["clients"], "readonly");
      const store = transaction.objectStore("clients");
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async addToSyncQueue(operation: string, data: any): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["syncQueue"], "readwrite");
      const store = transaction.objectStore("syncQueue");
      const request = store.add({
        operation,
        data,
        timestamp: new Date(),
      });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getSyncQueue(): Promise<any[]> {
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["syncQueue"], "readonly");
      const store = transaction.objectStore("syncQueue");
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async clearSyncQueue(): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["syncQueue"], "readwrite");
      const store = transaction.objectStore("syncQueue");
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}

export const offlineStorage = new OfflineStorage();

// Connection status management
export class ConnectionManager {
  private listeners: ((status: boolean) => void)[] = [];
  private _isOnline: boolean = navigator.onLine;

  constructor() {
    window.addEventListener("online", this.handleOnline);
    window.addEventListener("offline", this.handleOffline);
  }

  private handleOnline = () => {
    this._isOnline = true;
    this.notifyListeners(true);
  };

  private handleOffline = () => {
    this._isOnline = false;
    this.notifyListeners(false);
  };

  get isOnline(): boolean {
    return this._isOnline;
  }

  addListener(callback: (status: boolean) => void): void {
    this.listeners.push(callback);
  }

  removeListener(callback: (status: boolean) => void): void {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  private notifyListeners(status: boolean): void {
    this.listeners.forEach(listener => listener(status));
  }
}

export const connectionManager = new ConnectionManager();
