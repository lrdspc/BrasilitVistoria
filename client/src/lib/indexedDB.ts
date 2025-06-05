import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface VigiloDB extends DBSchema {
  inspections: {
    key: string;
    value: {
      id: string;
      data: any;
      photos: { id: string; blob: Blob; filename: string }[];
      lastModified: number;
      synced: boolean;
    };
  };
  photos: {
    key: string;
    value: {
      id: string;
      blob: Blob;
      filename: string;
      inspectionId: string;
      uploaded: boolean;
    };
  };
  user: {
    key: 'current';
    value: {
      id: string;
      email: string;
      name: string;
      token?: string;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<VigiloDB>>;

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<VigiloDB>('vigitel-db', 1, {
      upgrade(db) {
        // Create object stores
        if (!db.objectStoreNames.contains('inspections')) {
          db.createObjectStore('inspections', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('photos')) {
          db.createObjectStore('photos', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('user')) {
          db.createObjectStore('user');
        }
      },
    });
  }
  return dbPromise;
}

export async function saveInspectionOffline(id: string, data: any, photos: { id: string; blob: Blob; filename: string }[] = []) {
  const db = await getDB();
  await db.put('inspections', {
    id,
    data,
    photos,
    lastModified: Date.now(),
    synced: false,
  });
}

export async function getOfflineInspection(id: string) {
  const db = await getDB();
  return db.get('inspections', id);
}

export async function getAllOfflineInspections() {
  const db = await getDB();
  return db.getAll('inspections');
}

export async function deleteOfflineInspection(id: string) {
  const db = await getDB();
  await db.delete('inspections', id);
}

export async function savePhotoOffline(id: string, blob: Blob, filename: string, inspectionId: string) {
  const db = await getDB();
  await db.put('photos', {
    id,
    blob,
    filename,
    inspectionId,
    uploaded: false,
  });
}

export async function getOfflinePhoto(id: string) {
  const db = await getDB();
  return db.get('photos', id);
}

export async function getOfflinePhotosByInspection(inspectionId: string) {
  const db = await getDB();
  const photos = await db.getAll('photos');
  return photos.filter(photo => photo.inspectionId === inspectionId);
}

export async function markPhotoUploaded(id: string) {
  const db = await getDB();
  const photo = await db.get('photos', id);
  if (photo) {
    photo.uploaded = true;
    await db.put('photos', photo);
  }
}

export async function saveUserOffline(user: { id: string; email: string; name: string; token?: string }) {
  const db = await getDB();
  await db.put('user', user, 'current');
}

export async function getOfflineUser() {
  const db = await getDB();
  return db.get('user', 'current');
}

export async function clearOfflineUser() {
  const db = await getDB();
  await db.delete('user', 'current');
}

export async function getUnsyncedInspections() {
  const db = await getDB();
  const inspections = await db.getAll('inspections');
  return inspections.filter(inspection => !inspection.synced);
}

export async function markInspectionSynced(id: string) {
  const db = await getDB();
  const inspection = await db.get('inspections', id);
  if (inspection) {
    inspection.synced = true;
    await db.put('inspections', inspection);
  }
}
