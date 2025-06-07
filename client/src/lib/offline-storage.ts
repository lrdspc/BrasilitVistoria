import { db, OfflineInspection, OfflineClient, OfflinePhoto } from './database';
import type { InspectionFormData } from '@/types/inspection'; // Assuming this is the structure used in vistoriaStore.data
import type { NonConformity as StoreNonConformity, PhotoRepresentation } from '@/stores/vistoriaStore';

// Helper to map data from VigitelDB.OfflineInspection to InspectionFormData for the app
const mapDbInspectionToApp = async (dbInspection: OfflineInspection): Promise<InspectionFormData> => {
  const inspectionData = dbInspection.data as InspectionFormData; // Base data
  inspectionData.offlineId = dbInspection.id; // Use Dexie's auto-incremented ID as offlineId

  // If inspectionData has nonConformities, process their photos
  if (inspectionData.nonConformities && Array.isArray(inspectionData.nonConformities)) {
    for (const nc of inspectionData.nonConformities as StoreNonConformity[]) { // Cast to store type
      if (nc.photos && Array.isArray(nc.photos)) {
        for (const photo of nc.photos as PhotoRepresentation[]) {
          if (photo.localDbId) {
            const offlinePhoto = await db.photos.get(photo.localDbId);
            if (offlinePhoto && offlinePhoto.photoBlob) {
              photo.file = offlinePhoto.photoBlob as File; // Attach the Blob/File object
              photo.previewUrl = URL.createObjectURL(offlinePhoto.photoBlob); // Create new preview URL
              photo.name = offlinePhoto.name || (offlinePhoto.photoBlob as File).name;
            } else {
              // Photo metadata exists in inspection, but not in db.photos table (should not happen ideally)
              photo.previewUrl = '/placeholder-image-error.png'; // Fallback
              console.warn(`OfflinePhoto not found for localDbId: ${photo.localDbId}`);
            }
          } else if (photo.serverUrl) {
            photo.previewUrl = photo.serverUrl; // Use server URL if available (already synced)
          }
          // If only a base64 previewUrl was stored before, it would be used directly here.
          // But new model aims to move away from storing base64 in inspection data.
        }
      }
    }
  }
  return inspectionData;
};


class OfflineStorageService {

  // --- Inspection Methods ---
  async saveInspection(inspectionData: InspectionFormData, clientId?: number): Promise<number> {
    const inspectionDataToStore = JSON.parse(JSON.stringify(inspectionData)) as InspectionFormData; // Deep clone to modify

    // Process photos: save blobs to db.photos, update references in inspectionDataToStore
    if (inspectionDataToStore.nonConformities && Array.isArray(inspectionDataToStore.nonConformities)) {
      for (const nc of inspectionDataToStore.nonConformities as StoreNonConformity[]) {
        if (nc.photos && Array.isArray(nc.photos)) {
          for (let i = 0; i < nc.photos.length; i++) {
            const photoRep = nc.photos[i] as PhotoRepresentation; // Work with the PhotoRepresentation type
            if (photoRep.file) { // New photo with a File object
              const photoToSave: OfflinePhoto = {
                inspectionLocalId: 0, // Placeholder, will be known after main inspection is saved if it's new
                nonConformityId: nc.id, // Use the NC's id (local or server)
                photoBlob: photoRep.file,
                name: photoRep.name || photoRep.file.name,
                timestamp: Date.now(),
                synced: false,
              };
              // Save the photo blob to db.photos
              // Note: if inspectionData is for a *new* inspection, we don't have its local ID yet.
              // This implies photos might need to be saved *after* the inspection gets an ID,
              // or inspectionLocalId in OfflinePhoto refers to a temporary ID until inspection is saved.
              // For simplicity now, let's assume we'll update inspectionLocalId later if needed, or save photos in a second step.
              // OR: a better approach is to save photos to db.photos first, get their IDs, then embed those IDs.
              // However, saveInspectionOffline in VigitelDB is one-shot.
              // Let's assume for now that the `data` field in OfflineInspection will temporarily hold file objects
              // and a background process or more complex save logic will extract them.
              // OR, the current approach: PhotoUpload provides File, store keeps File,
              // then saveInspectionOffline receives inspectionData with Files.
              // VigitelDB.saveInspectionOffline needs to handle this.

              // For now, the structure of saveInspectionOffline in database.ts is:
              // it takes `inspectionData: any`. This `inspectionData` (which is `OfflineInspection.data`)
              // will contain the File objects directly if we don't process them here.
              // This means `OfflineInspection.data` will be large if it holds File objects.
              // This is acceptable for Dexie, but not for JSON stringification if it were to happen before saving to Dexie.
              // Dexie handles storing Blobs within indexed records correctly.
              // So, we can let `inspectionData` (which is `OfflineInspection.data`) contain the File objects.
              // The `localDbId` on `PhotoRepresentation` will be for the *OfflinePhoto record itself* if we decide to make a separate table.
              // The current `VigitelDB` schema has a `photos` table. We SHOULD use it.

              // Revised strategy for this method:
              // 1. If photo.file exists, it's a new photo. We need to save it to db.photos.
              // 2. Then link its db.photos ID back to the photo object in inspectionData.nonConformities.
              // 3. Remove the .file from photo object in inspectionData.nonConformities.

              // This means `db.saveInspectionOffline` in `database.ts` should NOT be called until photos are processed.
              // Or, `saveInspectionOffline` itself needs to be more intelligent.
              // Let's make this service method more intelligent.

              // This method will now be more complex:
              // It can't directly call db.saveInspectionOffline if it needs to save photos first to get their IDs.
              // Option A: `db.saveInspectionOffline` is enhanced to handle photo extraction. (Chosen for now in database.ts)
              // Option B: This service does a multi-step save: save photos, update inspectionData, save inspection.

              // Assuming `db.saveInspectionOffline` in `database.ts` will be enhanced or already handles this by storing
              // the `data` field (which includes File objects) correctly, and a separate sync step for photos
              // will use `upload_photo` with the `OfflinePhoto.id`.
              // For now, we pass `inspectionDataToStore` which might contain File objects.
              // The `PhotoRepresentation` in store should be the single source of truth.
            }
          }
        }
      }
    }
    // `saveInspectionOffline` in `database.ts` will store `inspectionDataToStore` into `OfflineInspection.data`
    // It also adds to syncQueue. The `data` in syncQueue will also contain File objects.
    // The actual photo upload sync logic will need to extract these files.
    // This is the version of inspectionData that will be stored in OfflineInspection.data
    // It should not contain actual File objects for photos, only their metadata (like localDbId).
    const inspectionDataForMainRecord = JSON.parse(JSON.stringify(inspectionData)) as InspectionFormData;

    // Temporarily remove photo File objects from the main record to get its ID
    // Store PhotoRepresentations with localDbId and previewUrl (which will be invalid on next load until regenerated)
    if (inspectionDataForMainRecord.nonConformities && Array.isArray(inspectionDataForMainRecord.nonConformities)) {
      for (const nc of inspectionDataForMainRecord.nonConformities as StoreNonConformity[]) {
        if (nc.photos && Array.isArray(nc.photos)) {
          nc.photos = nc.photos.map(p => ({ ...p, file: undefined })); // Ensure file is not in main JSON
        }
      }
    }

    // 1. Add the main inspection data (without photo blobs) to get its local ID
    const inspectionToSave: OfflineInspection = {
      clientId,
      data: inspectionDataForMainRecord, // This data now has photoRep objects without .file
      timestamp: Date.now(),
      synced: false,
      lastModified: Date.now(),
    };
    const localInspectionId = await db.inspections.add(inspectionToSave);

    // 2. Now, iterate original inspectionData to save photo files and update main record's photo metadata
    let mainInspectionDataWasModifiedByPhotoProcessing = false;
    if (inspectionData.nonConformities && Array.isArray(inspectionData.nonConformities)) {
      for (let ncIndex = 0; ncIndex < inspectionData.nonConformities.length; ncIndex++) {
        const originalNc = inspectionData.nonConformities[ncIndex] as StoreNonConformity;
        const ncForMainRecord = inspectionDataForMainRecord.nonConformities![ncIndex] as StoreNonConformity;

        if (originalNc.photos && Array.isArray(originalNc.photos)) {
          for (let photoIndex = 0; photoIndex < originalNc.photos.length; photoIndex++) {
            const photoRep = originalNc.photos[photoIndex] as PhotoRepresentation;
            if (photoRep.file) { // If there's a File object, it's a new photo to be saved
              const photoDbId = await this.savePhotoToDb(localInspectionId, originalNc.id, photoRep.file, photoRep.name);

              // Update the corresponding photo representation in inspectionDataForMainRecord
              if (ncForMainRecord.photos && ncForMainRecord.photos[photoIndex]) {
                (ncForMainRecord.photos[photoIndex] as PhotoRepresentation).localDbId = photoDbId;
                // previewUrl is kept as is (it's a blob URL from PhotoUpload), will be invalid on reload
                // but mapDbInspectionToApp will regenerate it.
                // Ensure 'file' property is not present in ncForMainRecord.photos[photoIndex]
                delete (ncForMainRecord.photos[photoIndex] as PhotoRepresentation).file;
                mainInspectionDataWasModifiedByPhotoProcessing = true;
              }
            }
          }
        }
      }
    }

    // 3. If photo processing modified inspectionDataForMainRecord (by adding localDbIds), update it in the DB.
    if (mainInspectionDataWasModifiedByPhotoProcessing) {
      await db.inspections.update(localInspectionId, { data: inspectionDataForMainRecord, lastModified: Date.now() });
    }

    // 4. Add the main inspection to the sync queue
    // The data payload for sync should be the cleaned one (without File objects)
    await db.addToSyncQueue('create_inspection', { ...inspectionDataForMainRecord, localId: localInspectionId }, localInspectionId);

    return localInspectionId;
  }

  async getInspection(id: number): Promise<InspectionFormData | null> {
    const dbInspection = await db.inspections.get(id);
    if (dbInspection) {
      return mapDbInspectionToApp(dbInspection); // mapDbInspectionToApp handles regenerating previewUrls
    }
    return null;
  }

  async getAllInspections(): Promise<InspectionFormData[]> {
    const dbInspections = await db.inspections.toArray();
    // mapDbInspectionToApp is async, so Promise.all is needed
    return Promise.all(dbInspections.map(dbInspection => mapDbInspectionToApp(dbInspection)));
  }

  async updateInspection(localInspectionId: number, updates: Partial<InspectionFormData>): Promise<void> {
    const inspectionRecord = await db.inspections.get(localInspectionId);
    if (!inspectionRecord) {
      throw new Error(`Inspection with local ID ${localInspectionId} not found for update.`);
    }

    // Create a new version of the inspection data by merging existing with updates
    // Ensure deep cloning if updates can be nested structures.
    let updatedInspectionData = JSON.parse(JSON.stringify(inspectionRecord.data)) as InspectionFormData;
    updatedInspectionData = { ...updatedInspectionData, ...updates }; // Apply top-level updates

    // More careful merge for nonConformities if updates include them
    if (updates.nonConformities) {
        // This simple override is fine if `updates.nonConformities` is the full new array.
        // If it's partial updates to existing NCs, a more complex merge is needed.
        // Assuming `updates.nonConformities` (if provided) is the complete new array of NCs.
        updatedInspectionData.nonConformities = updates.nonConformities;
    }

    // Process photos: save new files to db.photos, update localDbId, remove File object for main record
    if (updatedInspectionData.nonConformities && Array.isArray(updatedInspectionData.nonConformities)) {
      for (const nc of updatedInspectionData.nonConformities as StoreNonConformity[]) {
        if (nc.photos && Array.isArray(nc.photos)) {
          for (const photoRep of nc.photos as PhotoRepresentation[]) {
            if (photoRep.file && !photoRep.localDbId) { // New photo (has File, no localDbId yet)
              const photoDbId = await this.savePhotoToDb(localInspectionId, nc.id, photoRep.file, photoRep.name);
              photoRep.localDbId = photoDbId;
              delete photoRep.file; // Remove File object after saving its blob to db.photos
            } else if (photoRep.file && photoRep.localDbId) {
              // This case (File object + existing localDbId) implies re-upload or replacement of an existing photo.
              // Delete old blob? Update existing db.photos record? For now, assume new save is simpler if ID changes.
              // Or, more likely, if localDbId exists, file should have been cleared.
              // This state (file + localDbId) should ideally be avoided by clearing .file after initial savePhotoToDb.
              console.warn("Photo has both File and localDbId. Treating as new if file changed, but this state is ambiguous.", photoRep);
              // Re-save and update localDbId if necessary, or ensure file is cleared after initial save.
              // For simplicity, if .file is present, we assume it's new or supersedes the old one.
              // This might orphan old photo blobs if not handled carefully (e.g. by deleting old photo from db.photos first).
              const photoDbId = await this.savePhotoToDb(localInspectionId, nc.id, photoRep.file, photoRep.name);
              // If it was meant to replace, the old photo with previous localDbId should be deleted from db.photos.
              // For now, this will create a new entry in db.photos and a new localDbId.
              photoRep.localDbId = photoDbId;
              delete photoRep.file;
            }
          }
        }
      }
    }

    await db.inspections.update(localInspectionId, {
      data: updatedInspectionData,
      synced: false,
      lastModified: Date.now()
    });

    // Update or add to syncQueue for the main inspection
    const createSyncItem = await db.syncQueue.where({ localId: localInspectionId, type: 'create_inspection' }).first();
    if (createSyncItem && createSyncItem.id) {
      // If it's still pending creation, update its data payload
      await db.updateSyncQueueItem(createSyncItem.id, { data: updatedInspectionData, lastAttempt: undefined, retries: 0, lastError: undefined });
    } else {
      // If it was already created (no 'create_inspection' pending) or it's an update to a synced item.
      const updateSyncItem = await db.syncQueue.where({ localId: localInspectionId, type: 'update_inspection' }).first();
      if (updateSyncItem && updateSyncItem.id) {
        await db.updateSyncQueueItem(updateSyncItem.id, { data: updatedInspectionData, lastAttempt: undefined, retries: 0, lastError: undefined });
      } else {
        await db.addToSyncQueue('update_inspection', { ...updatedInspectionData, localId: localInspectionId }, localInspectionId);
      }
    }
  }

  async deleteInspection(id: number): Promise<void> {
    // Remove any sync tasks for this inspection (create or update)
    await db.syncQueue.where({ localId: id }).and(item => item.type === 'create_inspection' || item.type === 'update_inspection').delete();

    // Get all photo localDbIds associated with this inspection to remove their individual sync tasks
    const photosToDelete = await db.photos.where({ inspectionLocalId: id }).toArray();
    for (const photo of photosToDelete) {
      if (photo.id) {
        await db.syncQueue.where({ localId: photo.id, type: 'upload_photo' }).delete();
      }
    }
    await db.photos.where({ inspectionLocalId: id }).delete(); // Delete associated photos from db.photos
    await db.inspections.delete(id); // Delete the main inspection record
  }

  // --- Client Methods ---
  async saveClient(clientData: Omit<OfflineClient, 'id' | 'timestamp' | 'synced' | 'serverId'>): Promise<number> {
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

  async updateClient(id: number, updates: Partial<Omit<OfflineClient, 'id' | 'document' | 'synced' | 'serverId'>>): Promise<void> {
    await db.clients.update(id, { ...updates, synced: false, timestamp: Date.now() });
    const clientData = await db.clients.get(id);
    if(clientData){ // Ensure clientData is not null
      const syncData = { ...clientData, ...updates, localId: id }; // Use the full updated data for sync
      // Check if an update_client task already exists, update it, otherwise add new.
      const existingSyncItem = await db.syncQueue().where({localId: id, type: 'update_client'}).first();
      if (existingSyncItem && existingSyncItem.id) {
        await db.updateSyncQueueItem(existingSyncItem.id, {data: syncData, retries: 0, lastAttempt: undefined});
      } else {
         await db.addToSyncQueue('update_client', syncData, id);
      }
    }
  }

  // --- Photo Methods (Directly for db.photos table, used by inspection methods) ---
  // This method is now more internal, called by saveInspection/updateInspection
  async savePhotoToDb(inspectionLocalId: number, ncId: string | number, photoFile: File, photoName?: string): Promise<number> {
    const photoToSave: OfflinePhoto = {
      inspectionLocalId,
      nonConformityId: ncId,
      photoBlob: photoFile,
      name: photoName || photoFile.name,
      timestamp: Date.now(),
      synced: false,
    };
    const localDbId = await db.photos.add(photoToSave);
    // Add to sync queue for this specific photo
    await db.addToSyncQueue('upload_photo', { photoLocalId: localDbId, inspectionLocalId, ncId, name: photoToSave.name }, localDbId);
    return localDbId;
  }

  // This might be used if NaoConformidadesChecklist wants to save photos immediately upon selection,
  // rather than waiting for full inspection save. For now, photos are part of inspection data.
  // async addPhotoToNcViaService(inspectionLocalId: number, ncId: string | number, photoItem: PhotoRepresentation): Promise<PhotoRepresentation> {
  //   if (!photoItem.file) throw new Error("File object is missing");
  //   const localDbId = await this.savePhotoToDb(inspectionLocalId, ncId, photoItem.file, photoItem.name);
  //   return { ...photoItem, localDbId, file: undefined }; // Return representation without file, but with localDbId
  // }


  async getPhotosForInspection(inspectionLocalId: number): Promise<OfflinePhoto[]> {
    return db.photos.where({ inspectionLocalId: inspectionLocalId }).toArray();
  }

  async deletePhotoFromDb(photoLocalDbId: number): Promise<void> {
    await db.syncQueue.where({ localId: photoLocalDbId, type: 'upload_photo' }).delete();
    await db.photos.delete(photoLocalDbId);
  }

  async clearSyncedData(): Promise<void> {
    console.log("clearSyncedData called - specific implementation depends on requirements.");
    // Example:
    // const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    // await db.inspections.where('synced').equals(true).and(i => i.timestamp < oneWeekAgo).delete();
    // await db.clients.where('synced').equals(true).and(c => c.timestamp < oneWeekAgo).delete();
    // await db.photos.where('synced').equals(true).and(p => p.timestamp < oneWeekAgo).delete();
  }
}

export const offlineStorageService = new OfflineStorageService();
