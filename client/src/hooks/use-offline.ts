import { useState, useEffect } from 'react';
import { offlineManager } from '@/lib/offline';

export function useOffline() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncQueue, setSyncQueue] = useState<any[]>([]);

  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Initialize offline manager
    offlineManager.init();

    // Load sync queue
    loadSyncQueue();

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  const loadSyncQueue = async () => {
    try {
      const queue = await offlineManager.getSyncQueue();
      setSyncQueue(queue);
    } catch (error) {
      console.error('Failed to load sync queue:', error);
    }
  };

  const saveDraft = async (draft: any) => {
    try {
      await offlineManager.saveDraft(draft);
      if (!isOnline) {
        await offlineManager.addToSyncQueue({
          type: 'inspection',
          action: 'create',
          data: draft,
        });
        await loadSyncQueue();
      }
    } catch (error) {
      console.error('Failed to save draft:', error);
      throw error;
    }
  };

  const savePhoto = async (photo: Blob, metadata: any) => {
    try {
      const photoId = await offlineManager.savePhoto(photo, metadata);
      if (!isOnline) {
        await offlineManager.addToSyncQueue({
          type: 'photo',
          action: 'upload',
          data: { photoId, metadata },
        });
        await loadSyncQueue();
      }
      return photoId;
    } catch (error) {
      console.error('Failed to save photo:', error);
      throw error;
    }
  };

  const sync = async () => {
    if (!isOnline) {
      throw new Error('Cannot sync while offline');
    }

    try {
      const queue = await offlineManager.getSyncQueue();
      
      for (const item of queue) {
        try {
          if (item.type === 'inspection') {
            // Sync inspection data
            const response = await fetch('/api/inspections', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(item.data),
            });
            
            if (!response.ok) {
              throw new Error(`Sync failed: ${response.statusText}`);
            }
          } else if (item.type === 'photo') {
            // Sync photo data
            const photoBlob = await offlineManager.getPhoto(item.data.photoId);
            if (photoBlob) {
              const formData = new FormData();
              formData.append('photo', photoBlob);
              formData.append('inspectionId', item.data.metadata.inspectionId);
              formData.append('nonConformityId', item.data.metadata.nonConformityId);

              const response = await fetch('/api/photos', {
                method: 'POST',
                body: formData,
              });

              if (!response.ok) {
                throw new Error(`Photo sync failed: ${response.statusText}`);
              }
            }
          }
        } catch (error) {
          console.error(`Failed to sync item ${item.id}:`, error);
          // Continue with other items
        }
      }

      // Clear sync queue after successful sync
      await offlineManager.clearSyncQueue();
      setSyncQueue([]);
      
      return true;
    } catch (error) {
      console.error('Sync failed:', error);
      throw error;
    }
  };

  return {
    isOnline,
    syncQueue,
    pendingSync: syncQueue.length > 0,
    saveDraft,
    savePhoto,
    sync,
    loadSyncQueue,
  };
}
