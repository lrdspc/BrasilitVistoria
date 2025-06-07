import Dexie, { Table } from 'dexie';

// 1. Define Interfaces
export interface OfflineInspection {
  id?: number; // Auto-incremented primary key
  clientId?: number; // Foreign key to OfflineClient
  data: any; // Stores the full inspection object
  timestamp: number; // Timestamp of when it was saved offline
  synced: boolean; // Whether this inspection has been synced with the backend
  lastModified: number; // Timestamp of last modification, useful for conflict resolution
}

export interface OfflineClient {
  id?: number; // Auto-incremented primary key
  name: string;
  document: string; // CPF or CNPJ
  contact?: string;
  email?: string;
  timestamp: number; // Timestamp of creation/update
  synced: boolean;
}

export interface SyncQueueItem {
  id?: number; // Auto-incremented primary key
  type: 'create_inspection' | 'update_inspection' | 'create_client' | 'update_client' | 'upload_photo'; // Added update_client
  data: any; // Data to be synced (e.g., full inspection object, client object, photo details)
  localId?: number; // Local ID of the item being synced (e.g., OfflineInspection id)
  serverId?: string | number; // Server ID after successful sync (optional)
  timestamp: number; // Timestamp of when the sync task was added
  retries: number; // Number of sync attempts
  lastAttempt?: number; // Timestamp of the last sync attempt
  lastError?: string; // Error message from the last failed attempt
}

export interface OfflinePhoto {
  id?: number; // Auto-incremented primary key
  inspectionLocalId: number; // Foreign key to OfflineInspection local id
  nonConformityId: string | number; // Link to the NC (e.g., its local or server ID, or title if unique within inspection)
  photoBlob: Blob; // Store the File/Blob directly. Dexie handles Blobs.
  name?: string; // Original file name
  timestamp: number;
  synced: boolean;
  serverId?: string; // ID from server after sync
  syncAttempt?: number;
  syncError?: string;
}

// 2. Create VigitelDB Class
export class VigitelDB extends Dexie {
  inspections!: Table<OfflineInspection, number>; // Key type is number
  clients!: Table<OfflineClient, number>;
  syncQueue!: Table<SyncQueueItem, number>;
  photos!: Table<OfflinePhoto, number>; // For storing photos related to non-conformities

  constructor() {
    super('VigitelDB'); // Database name

    // 3. Define table schemas
    this.version(1).stores({
      inspections: '++id, clientId, timestamp, synced, lastModified',
      clients: '++id, &document, name, timestamp, synced',
      syncQueue: '++id, type, localId, timestamp, retries, lastAttempt',
      // No need to index photoBlob. inspectionLocalId and nonConformityId can be indexed if frequent lookups are needed.
      photos: '++id, inspectionLocalId, nonConformityId, timestamp, synced',
    });
    // Version 2: If we need to change schema, e.g. add new indexes or tables
    // this.version(2).stores({
    //   photos: '++id, inspectionLocalId, &nonConformityPhotoId, timestamp, synced', // Example: make a compound key unique
    // }).upgrade(tx => {
    //   // Migration logic if needed
    // });
    // Future versions and migrations would go here
    // this.version(2).stores({...}).upgrade(...)
  }

  // 4. Implement Helper Methods

  /**
   * Saves an inspection to the offline database and adds it to the sync queue.
   * @param inspectionData The full inspection data object.
   * @param localClientId Optional local ID of the client associated with this inspection.
   * @returns The local ID of the saved inspection.
   */
  async saveInspectionOffline(inspectionData: any, localClientId?: number): Promise<number> {
    const inspectionToSave: OfflineInspection = {
      data: inspectionData,
      clientId: localClientId,
      timestamp: Date.now(),
      synced: false,
      lastModified: Date.now(),
    };
    const localId = await this.inspections.add(inspectionToSave);

    await this.addToSyncQueue('create_inspection', { ...inspectionData, localId }, localId);
    return localId;
  }

  /**
   * Adds an item to the synchronization queue.
   * @param type The type of synchronization task.
   * @param data The data associated with the task.
   * @param localId Optional local ID of the entity being synced (e.g., inspection ID, client ID).
   */
  async addToSyncQueue(
    type: SyncQueueItem['type'],
    data: any,
    localId?: number
  ): Promise<void> {
    const syncItem: SyncQueueItem = {
      type,
      data,
      localId,
      timestamp: Date.now(),
      retries: 0,
    };
    await this.syncQueue.add(syncItem);
    console.log(`Item added to sync queue: ${type} for localId ${localId || 'N/A'}`);
    // Here you might trigger an actual sync attempt if online, or rely on a background worker.
  }

  /**
   * Retrieves pending items from the sync queue (e.g., items not yet synced or with retries < max_retries).
   * @param maxRetries Maximum number of retries to consider an item as still pending.
   * @returns An array of SyncQueueItems.
   */
  async getPendingSyncItems(maxRetries: number = 3): Promise<SyncQueueItem[]> {
    // Items that are not yet synced (no serverId) AND retries < maxRetries
    // Or, more simply, just items with retries < maxRetries if serverId isn't strictly managed in queue item itself for synced status
    return await this.syncQueue.where('retries').below(maxRetries).sortBy('timestamp');
  }

  /**
   * Marks an item as synced in its respective table (e.g., inspections, clients)
   * and removes it from or updates it in the sync queue.
   * @param type The type of the synced item (e.g., 'create_inspection', 'create_client').
   * @param localId The local ID of the item that was successfully synced.
   * @param serverId The ID assigned by the server after sync.
   * @param syncQueueItemId The ID of the syncQueue item to be removed/updated.
   */
  async markAsSynced(
    type: Extract<SyncQueueItem['type'], 'create_inspection' | 'update_inspection' | 'create_client' | 'update_client'>,
    localId: number,
    serverId: string | number,
    syncQueueItemId?: number // ID of the specific queue item if multiple exist for the same localId
  ): Promise<void> {
    const updateData = { synced: true, serverId: serverId, lastModified: Date.now() };

    if (type === 'create_inspection' || type === 'update_inspection') {
      await this.inspections.update(localId, updateData);
      console.log(`Inspection ${localId} marked as synced with server ID ${serverId}.`);
    } else if (type === 'create_client' || type === 'update_client') {
      await this.clients.update(localId, { synced: true, serverId: serverId }); // Assuming client also gets a serverId
      console.log(`Client ${localId} marked as synced with server ID ${serverId}.`);
    }
    // Add 'upload_photo' handling if photos table needs 'synced' status updated
    // else if (type === 'upload_photo') { ... }


    // Remove from sync queue or mark as completed
    // If syncQueueItemId is provided, use it for precise deletion.
    // Otherwise, find based on type and localId (could be problematic if multiple queue items for same localId)
    if (syncQueueItemId) {
        await this.syncQueue.delete(syncQueueItemId);
    } else {
        // Fallback: find and delete one matching item. This is less robust.
        const itemToDelete = await this.syncQueue
            .where({ type: type, localId: localId })
            .first();
        if (itemToDelete && itemToDelete.id) {
            await this.syncQueue.delete(itemToDelete.id);
        }
    }
    console.log(`Sync queue item for ${type} (localId: ${localId}) processed.`);
  }

  // Example of adding a client and queueing it for sync
  async saveClientOffline(clientData: Omit<OfflineClient, 'id' | 'timestamp' | 'synced'>): Promise<number> {
    const clientToSave: OfflineClient = {
      ...clientData,
      timestamp: Date.now(),
      synced: false,
    };
    const localId = await this.clients.add(clientToSave);
    await this.addToSyncQueue('create_client', { ...clientToSave, localId }, localId);
    return localId;
  }

  /**
   * Updates an existing item in the sync queue, typically for retries or error logging.
   * @param id The ID of the SyncQueueItem to update.
   * @param updates Partial data to update the SyncQueueItem.
   */
  async updateSyncQueueItem(id: number, updates: Partial<Omit<SyncQueueItem, 'id'>>): Promise<void> {
    await this.syncQueue.update(id, updates);
    console.log(`Sync queue item ${id} updated.`);
  }
}

// 5. Export an instance of VigitelDB
export const db = new VigitelDB();
