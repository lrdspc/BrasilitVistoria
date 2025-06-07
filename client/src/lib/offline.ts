import { db, SyncQueueItem } from './database';
import { offlineStorageService } from './offline-storage'; // Import the refactored service
import type { Inspection, Client as AppClient } from "@shared/schema"; // Assuming these are the types for API interaction

// Re-export the offlineStorageService as offlineStorage for consistent public API
export const offlineStorage = offlineStorageService;

// --- SYNC LOGIC ---

// Placeholder for actual API calls
const simulateApiCall = async (item: SyncQueueItem): Promise<{ success: boolean, serverId?: string | number, error?: string }> => {
  console.log(`Simulating API call for ${item.type} - Local ID: ${item.localId}`, item.data);
  await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay

  // Simulate success for create/update operations, and provide a mock serverId
  if (item.type.startsWith('create_') || item.type.startsWith('update_')) {
    // Simulate some failures for testing retries
    if (item.localId && item.localId % 5 === 0 && item.retries < 2) { // Fail for items with localId divisible by 5, for first 2 retries
        console.warn(`Simulated API failure for ${item.type} - Local ID: ${item.localId}`);
        return { success: false, error: "Simulated network error" };
    }
    return { success: true, serverId: `${item.type.split('_')[1]}_server_${item.localId || Date.now()}` };
  }
  // Add more specific simulation for other types like 'upload_photo' if needed
  return { success: true };
};

export async function syncPendingItems(): Promise<void> {
  console.log("Checking for pending items to sync...");
  const pendingItems = await db.getPendingSyncItems(5); // Get items with less than 5 retries

  if (pendingItems.length === 0) {
    console.log("No items pending sync.");
    return;
  }

  console.log(`Found ${pendingItems.length} items to sync.`);

  for (const item of pendingItems) {
    if (!item.id || item.localId === undefined) { // Ensure item.id and item.localId are defined
        console.error("SyncQueueItem missing id or localId, skipping:", item);
        continue;
    }
    try {
      // TODO: Here you would map item.data to the expected API payload if necessary
      // e.g. if item.type is 'create_inspection', item.data is the full inspection object.
      // For 'update_inspection', it's also the full object.
      // For 'create_client', item.data is the client object.

      const result = await simulateApiCall(item);

      if (result.success) {
        console.log(`Successfully synced ${item.type} for local ID ${item.localId}. Server ID: ${result.serverId}`);
        if (item.type !== 'upload_photo') { // upload_photo might have a different markAsSynced logic
          await db.markAsSynced(
            item.type as Extract<SyncQueueItem['type'], 'create_inspection' | 'update_inspection' | 'create_client' | 'update_client'>,
            item.localId, // localId should be defined for these types
            result.serverId || item.localId, // Use serverId or fallback for items not returning it
            item.id // Pass syncQueueItem.id to ensure correct deletion
          );
        } else {
          // Handle photo sync success (e.g., update photo status in db.photos and remove from queue)
          // await db.photos.update(item.localId, { synced: true });
          // await db.syncQueue.delete(item.id);
           console.log(`Photo with local ID ${item.localId} synced (placeholder logic).`);
           await db.syncQueue.delete(item.id); // Basic: just delete from queue
        }
      } else {
        console.warn(`Failed to sync ${item.type} for local ID ${item.localId}. Error: ${result.error}`);
        await db.updateSyncQueueItem(item.id, {
          retries: (item.retries || 0) + 1,
          lastError: result.error || "Unknown error",
          lastAttempt: Date.now(),
        });
      }
    } catch (error: any) {
      console.error(`Error during sync for item ${item.id} (${item.type}):`, error);
      await db.updateSyncQueueItem(item.id, {
        retries: (item.retries || 0) + 1,
        lastError: error?.message || "Unhandled exception during sync",
        lastAttempt: Date.now(),
      });
    }
  }
  console.log("Sync attempt finished.");
}

// --- CONNECTION MANAGER --- (remains the same)
export class ConnectionManager {
  private listeners: ((status: boolean) => void)[] = [];
  private _isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener("online", this.handleOnline);
      window.addEventListener("offline", this.handleOffline);
    }
  }

  private handleOnline = () => {
    this._isOnline = true;
    this.notifyListeners(true);
    // Optionally trigger sync when connection is restored
    console.log("Connection restored. Attempting to sync pending items.");
    syncPendingItems().catch(err => console.error("Error during auto-sync on connection restore:", err));
  };

  private handleOffline = () => {
    this._isOnline = false;
    this.notifyListeners(false);
    console.log("Connection lost.");
  };

  get isOnline(): boolean {
    return this._isOnline;
  }

  addListener(callback: (status: boolean) => void): void {
    this.listeners.push(callback);
    // Notify immediately with current status
    // callback(this._isOnline);
  }

  removeListener(callback: (status: boolean) => void): void {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  private notifyListeners(status: boolean): void {
    this.listeners.forEach(listener => listener(status));
  }

  // Method to manually trigger a sync check
  public forceSync = () => {
    if (this.isOnline) {
        console.log("Manual sync triggered.");
        syncPendingItems().catch(err => console.error("Error during manual sync:", err));
    } else {
        console.warn("Cannot sync, application is offline.");
    }
  }
}

export const connectionManager = new ConnectionManager();

// Example: Periodically try to sync or listen to app events
// This is illustrative. Actual triggers for sync might be more complex (e.g., background sync API, service worker).
// if (typeof window !== 'undefined') {
//   setInterval(() => {
//     if (connectionManager.isOnline) {
//       syncPendingItems().catch(err => console.error("Error during periodic sync:", err));
//     }
//   }, 5 * 60 * 1000); // Sync every 5 minutes if online
// }
