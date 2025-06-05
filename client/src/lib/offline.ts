import { offlineStorage, type OfflineInspection, isOnline, generateLocalId } from './storage';
import { apiRequest } from './queryClient';

export class OfflineManager {
  private syncInProgress = false;
  private syncQueue: Set<string> = new Set();

  async initialize(): Promise<void> {
    await offlineStorage.init();
    this.setupEventListeners();
    
    // Initial sync if online
    if (isOnline()) {
      this.schedulePendingSync();
    }
  }

  private setupEventListeners(): void {
    // Online/offline events
    window.addEventListener('online', () => {
      this.onOnline();
    });

    window.addEventListener('offline', () => {
      this.onOffline();
    });

    // Periodic sync when online
    setInterval(() => {
      if (isOnline() && !this.syncInProgress) {
        this.schedulePendingSync();
      }
    }, 30000); // Every 30 seconds
  }

  private onOnline(): void {
    console.log('🌐 Connection restored - starting sync');
    this.schedulePendingSync();
  }

  private onOffline(): void {
    console.log('📱 Gone offline - queuing operations');
  }

  private async schedulePendingSync(): Promise<void> {
    if (this.syncInProgress) return;

    try {
      const unsyncedInspections = await offlineStorage.getUnsyncedInspections();
      if (unsyncedInspections.length > 0) {
        await this.syncPendingInspections();
      }
    } catch (error) {
      console.error('Failed to schedule sync:', error);
    }
  }

  async syncPendingInspections(): Promise<{ success: number; failed: number }> {
    if (this.syncInProgress || !isOnline()) {
      return { success: 0, failed: 0 };
    }

    this.syncInProgress = true;
    let success = 0;
    let failed = 0;

    try {
      const unsyncedInspections = await offlineStorage.getUnsyncedInspections();
      
      for (const inspection of unsyncedInspections) {
        if (this.syncQueue.has(inspection.localId)) continue;
        
        this.syncQueue.add(inspection.localId);
        
        try {
          await this.syncSingleInspection(inspection);
          success++;
        } catch (error) {
          console.error(`Failed to sync inspection ${inspection.localId}:`, error);
          failed++;
        } finally {
          this.syncQueue.delete(inspection.localId);
        }
      }
    } catch (error) {
      console.error('Sync process failed:', error);
    } finally {
      this.syncInProgress = false;
    }

    return { success, failed };
  }

  private async syncSingleInspection(inspection: OfflineInspection): Promise<void> {
    try {
      // 1. Sync client if needed
      let clientId = inspection.clientId;
      if (!clientId && inspection.clientId) {
        // If we have a local client reference, try to sync it first
        const clients = await offlineStorage.getAllClients();
        const localClient = clients.find(c => c.localId === inspection.clientId?.toString());
        if (localClient && !localClient.id) {
          const syncedClient = await this.syncClient(localClient);
          clientId = syncedClient.id;
        }
      }

      // 2. Create inspection on server
      const inspectionData = {
        clientId,
        userId: inspection.userId,
        date: inspection.date,
        development: inspection.development,
        city: inspection.city,
        state: inspection.state,
        address: inspection.address,
        cep: inspection.cep,
        protocol: inspection.protocol,
        subject: inspection.subject,
        technician: inspection.technician,
        department: inspection.department,
        unit: inspection.unit,
        coordinator: inspection.coordinator,
        manager: inspection.manager,
        regional: inspection.regional,
        status: inspection.status,
        localId: inspection.localId,
      };

      const response = await apiRequest('POST', '/api/inspections', inspectionData);
      const syncedInspection = await response.json();

      // 3. Sync tiles
      for (const tile of inspection.tiles) {
        await apiRequest('POST', `/api/inspections/${syncedInspection.id}/tiles`, {
          thickness: tile.thickness,
          length: tile.length,
          width: tile.width,
          quantity: tile.quantity,
          grossArea: tile.grossArea,
          correctedArea: tile.correctedArea,
        });
      }

      // 4. Sync non-conformities
      for (const nc of inspection.nonConformities) {
        // Upload photos first
        const photoUrls: string[] = [];
        for (const photoId of nc.photos) {
          try {
            const photoBlob = await offlineStorage.getPhoto(photoId);
            if (photoBlob) {
              const photoUrl = await this.uploadPhoto(photoBlob, photoId);
              photoUrls.push(photoUrl);
            }
          } catch (error) {
            console.warn(`Failed to upload photo ${photoId}:`, error);
          }
        }

        await apiRequest('POST', `/api/inspections/${syncedInspection.id}/non-conformities`, {
          type: nc.type,
          title: nc.title,
          description: nc.description,
          notes: nc.notes,
          photos: photoUrls,
        });
      }

      // 5. Mark as synced locally
      inspection.syncedAt = new Date();
      inspection.id = syncedInspection.id;
      await offlineStorage.saveInspection(inspection);

      console.log(`✅ Synced inspection: ${inspection.protocol}`);
    } catch (error) {
      console.error(`❌ Failed to sync inspection ${inspection.protocol}:`, error);
      throw error;
    }
  }

  private async syncClient(client: any): Promise<any> {
    const response = await apiRequest('POST', '/api/clients', {
      name: client.name,
      cnpjCpf: client.cnpjCpf,
      contact: client.contact,
      email: client.email,
    });
    
    const syncedClient = await response.json();
    
    // Update local client with server ID
    client.id = syncedClient.id;
    await offlineStorage.saveClient(client);
    
    return syncedClient;
  }

  private async uploadPhoto(blob: Blob, photoId: string): Promise<string> {
    const formData = new FormData();
    const file = new File([blob], `${photoId}.jpg`, { type: 'image/jpeg' });
    formData.append('photo', file);

    const response = await fetch('/api/upload/photo', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to upload photo: ${response.statusText}`);
    }

    const result = await response.json();
    return result.url;
  }

  async saveInspectionOffline(inspection: Partial<OfflineInspection>): Promise<string> {
    const localId = inspection.localId || generateLocalId();
    const now = new Date();

    const offlineInspection: OfflineInspection = {
      localId,
      userId: inspection.userId || 1,
      clientId: inspection.clientId,
      date: inspection.date || now,
      development: inspection.development || '',
      city: inspection.city || '',
      state: inspection.state || '',
      address: inspection.address || '',
      cep: inspection.cep || '',
      protocol: inspection.protocol || '',
      subject: inspection.subject || '',
      technician: inspection.technician || '',
      department: inspection.department || 'Assistência Técnica',
      unit: inspection.unit || 'PR',
      coordinator: inspection.coordinator || 'Marlon Weingartner',
      manager: inspection.manager || 'Elisabete Kudo',
      regional: inspection.regional || 'Sul',
      status: inspection.status || 'pending',
      createdAt: inspection.createdAt || now,
      updatedAt: now,
      tiles: inspection.tiles || [],
      nonConformities: inspection.nonConformities || [],
      ...inspection,
    };

    await offlineStorage.saveInspection(offlineInspection);
    
    // Schedule sync if online
    if (isOnline()) {
      setTimeout(() => this.schedulePendingSync(), 1000);
    }

    return localId;
  }

  async getOfflineInspections(): Promise<OfflineInspection[]> {
    return await offlineStorage.getAllInspections();
  }

  async getOfflineInspection(localId: string): Promise<OfflineInspection | undefined> {
    return await offlineStorage.getInspection(localId);
  }

  async deleteOfflineInspection(localId: string): Promise<void> {
    await offlineStorage.deleteInspection(localId);
  }

  getConnectionStatus(): 'online' | 'offline' | 'syncing' {
    if (this.syncInProgress) return 'syncing';
    return isOnline() ? 'online' : 'offline';
  }

  async getPendingSyncCount(): Promise<number> {
    const unsynced = await offlineStorage.getUnsyncedInspections();
    return unsynced.length;
  }

  async getStorageInfo(): Promise<{ used: number; quota: number; inspections: number }> {
    const [storage, inspections] = await Promise.all([
      offlineStorage.getStorageUsage(),
      offlineStorage.getAllInspections(),
    ]);

    return {
      ...storage,
      inspections: inspections.length,
    };
  }
}

export const offlineManager = new OfflineManager();
