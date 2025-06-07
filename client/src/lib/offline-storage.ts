import { db, OfflineInspection, OfflineClient, OfflinePhoto } from './database';
import type { InspectionFormData, Photo } from '@/types/inspection'; // Assuming Photo type is used for photo handling

// Helper to map data from VigitelDB.OfflineInspection to InspectionFormData for the app if needed
// For now, we assume InspectionFormData is stored directly in OfflineInspection.data
// const mapDbInspectionToApp = (dbInspection: OfflineInspection): InspectionFormData => {
//   return dbInspection.data as InspectionFormData; // Adjust if structure differs
// };

// Helper to map data from VigitelDB.OfflineClient to a Client type used in app if needed
// const mapDbClientToApp = (dbClient: OfflineClient): AppClientType => {
//   return dbClient as AppClientType; // Adjust if structure differs
// };

class OfflineStorageService {
  // No more init() needed as VigitelDB is initialized on import

  async saveInspection(inspectionData: InspectionFormData, clientId?: number): Promise<number> {
    // The `inspectionData` is expected to be the full object as defined by `vistoriaStore` or app's forms.
    // `db.saveInspectionOffline` stores this in the `data` field of `OfflineInspection`
    // and adds it to the sync queue.
    // The `offlineId` used previously is now the auto-incremented `id` from `OfflineInspection` table.
    const newInspectionLocalId = await db.saveInspectionOffline(inspectionData, clientId);
    return newInspectionLocalId;
  }

  async getInspection(id: number): Promise<InspectionFormData | null> {
    const dbInspection = await db.inspections.get(id);
    if (dbInspection && dbInspection.data) {
      // Assuming dbInspection.data is of type InspectionFormData
      // Add the local DB id to the returned data, similar to old offlineId
      return { ...dbInspection.data, offlineId: dbInspection.id } as InspectionFormData;
    }
    return null;
  }

  async getAllInspections(): Promise<InspectionFormData[]> {
    const dbInspections = await db.inspections.toArray();
    return dbInspections.map(dbInspection => ({
      ...dbInspection.data,
      offlineId: dbInspection.id, // Add local DB id
    } as InspectionFormData));
  }

  async updateInspection(id: number, updates: Partial<InspectionFormData>): Promise<void> {
    const inspection = await db.inspections.get(id);
    if (!inspection) {
      throw new Error(`Inspection with local ID ${id} not found for update.`);
    }
    const updatedData = { ...inspection.data, ...updates };
    await db.inspections.update(id, { data: updatedData, synced: false, lastModified: Date.now() });
    // Add to sync queue if it's an update for an existing, possibly synced item
    // Or if it's an update to an item not yet created on server.
    // The type of sync item might be 'update_inspection' or 'create_inspection' if not yet synced.
    const syncItem = await db.syncQueue.where({ localId: id, type: 'create_inspection' }).first();
    if (syncItem) {
      // If it's still pending creation, update its data
      await db.updateSyncQueueItem(syncItem.id!, { data: updatedData });
    } else {
      // If it was already created or no create task exists, queue an update
      await db.addToSyncQueue('update_inspection', { ...updatedData, localId: id }, id);
    }
  }

  async deleteInspection(id: number): Promise<void> {
    // Also need to handle queued sync items for this inspection
    await db.syncQueue.where({ localId: id }).delete();
    await db.photos.where({ inspectionId: id }).delete(); // Delete associated photos
    await db.inspections.delete(id);
  }

  // Client methods
  async saveClient(clientData: Omit<OfflineClient, 'id' | 'timestamp' | 'synced'>): Promise<number> {
    // `saveClientOffline` in VigitelDB handles adding to syncQueue
    return db.saveClientOffline(clientData);
  }

  async getClient(id: number): Promise<OfflineClient | null> {
    const client = await db.clients.get(id);
    return client || null;
  }

  async getClientByDocument(document: string): Promise<OfflineClient | null> {
    const client = await db.clients.where('document').equals(document).first();
    return client || null;
  }

  async getAllClients(): Promise<OfflineClient[]> {
    return db.clients.toArray();
  }

  async updateClient(id: number, updates: Partial<Omit<OfflineClient, 'id' | 'document'>>): Promise<void> {
    await db.clients.update(id, { ...updates, synced: false }); // Mark as not synced
    // Add to sync queue
    const clientData = await db.clients.get(id);
    if(clientData){
      await db.addToSyncQueue('update_client', { ...clientData, ...updates, localId: id }, id);
    }
  }

  // Photo methods
  async savePhoto(inspectionLocalId: number, nonConformityTitle: string, photoDataUrl: string): Promise<number> {
    const photoToSave: OfflinePhoto = {
      inspectionId: inspectionLocalId,
      nonConformityId: nonConformityTitle, // Using title as an identifier for NC within inspection
      photoDataUrl: photoDataUrl,
      timestamp: Date.now(),
      synced: false,
    };
    const photoLocalId = await db.photos.add(photoToSave);
    // Optionally add to sync queue if photos are synced individually
    // await db.addToSyncQueue('upload_photo', { localPhotoId: photoLocalId, inspectionLocalId, photoDataUrl }, photoLocalId);
    return photoLocalId;
  }

  async getPhotosForNonConformity(inspectionLocalId: number, nonConformityTitle: string): Promise<OfflinePhoto[]> {
    return db.photos
      .where({ inspectionId: inspectionLocalId, nonConformityId: nonConformityTitle })
      .toArray();
  }

  async getPhotosForInspection(inspectionLocalId: number): Promise<OfflinePhoto[]> {
    return db.photos.where({ inspectionId: inspectionLocalId }).toArray();
  }

  async deletePhoto(photoLocalId: number): Promise<void> {
    // Also handle sync queue if individual photos are synced
    // await db.syncQueue.where({ localId: photoLocalId, type: 'upload_photo' }).delete();
    await db.photos.delete(photoLocalId);
  }


  // This method might be complex if it means clearing only data that *has* been synced.
  // VigitelDB's markAsSynced removes items from syncQueue.
  // True "clearing" of already synced items from local DB might be a separate maintenance task.
  async clearSyncedData(): Promise<void> {
    // Example: Remove inspections and clients that are marked as synced and older than X days
    // This is more of a cleanup task and depends on specific requirements.
    // For now, this method might not be directly used by the sync process itself.
    console.log("clearSyncedData called - specific implementation depends on requirements for data retention of synced items.");
    // const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    // await db.inspections.where('synced').equals(true).and(i => i.timestamp < oneWeekAgo).delete();
    // await db.clients.where('synced').equals(true).and(c => c.timestamp < oneWeekAgo).delete();
    // await db.photos.where('synced').equals(true).and(p => p.timestamp < oneWeekAgo).delete();
  }
}

export const offlineStorageService = new OfflineStorageService();
