import { useState, useEffect } from 'react';
import { offlineManager } from '@/lib/offline';

export interface SyncStatus {
  status: 'online' | 'offline' | 'syncing';
  pendingCount: number;
  lastSyncAt?: Date;
  isInitialized: boolean;
}

export const useOfflineSync = () => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    status: 'offline',
    pendingCount: 0,
    isInitialized: false,
  });

  const [syncProgress, setSyncProgress] = useState<{
    current: number;
    total: number;
    currentItem?: string;
  }>({ current: 0, total: 0 });

  useEffect(() => {
    let mounted = true;

    const initializeSync = async () => {
      try {
        await offlineManager.initialize();
        if (mounted) {
          setSyncStatus(prev => ({ ...prev, isInitialized: true }));
          await updateSyncStatus();
        }
      } catch (error) {
        console.error('Failed to initialize offline manager:', error);
      }
    };

    const updateSyncStatus = async () => {
      if (!mounted) return;
      
      try {
        const [status, pendingCount] = await Promise.all([
          offlineManager.getConnectionStatus(),
          offlineManager.getPendingSyncCount(),
        ]);

        setSyncStatus(prev => ({
          ...prev,
          status,
          pendingCount,
        }));
      } catch (error) {
        console.error('Failed to update sync status:', error);
      }
    };

    // Initialize
    initializeSync();

    // Set up periodic status updates
    const statusInterval = setInterval(updateSyncStatus, 5000);

    // Listen for connection changes
    const handleOnline = () => updateSyncStatus();
    const handleOffline = () => updateSyncStatus();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      mounted = false;
      clearInterval(statusInterval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const forcSync = async (): Promise<{ success: number; failed: number }> => {
    if (syncStatus.status === 'syncing') {
      return { success: 0, failed: 0 };
    }

    try {
      setSyncStatus(prev => ({ ...prev, status: 'syncing' }));
      
      const result = await offlineManager.syncPendingInspections();
      
      // Update status after sync
      const [newStatus, pendingCount] = await Promise.all([
        offlineManager.getConnectionStatus(),
        offlineManager.getPendingSyncCount(),
      ]);

      setSyncStatus(prev => ({
        ...prev,
        status: newStatus,
        pendingCount,
        lastSyncAt: new Date(),
      }));

      return result;
    } catch (error) {
      console.error('Force sync failed:', error);
      setSyncStatus(prev => ({ ...prev, status: 'offline' }));
      return { success: 0, failed: 1 };
    }
  };

  const getStorageInfo = async () => {
    try {
      return await offlineManager.getStorageInfo();
    } catch (error) {
      console.error('Failed to get storage info:', error);
      return { used: 0, quota: 0, inspections: 0 };
    }
  };

  const isOnline = syncStatus.status === 'online';
  const isOffline = syncStatus.status === 'offline';
  const isSyncing = syncStatus.status === 'syncing';
  const hasPendingSync = syncStatus.pendingCount > 0;

  return {
    syncStatus,
    syncProgress,
    isOnline,
    isOffline,
    isSyncing,
    hasPendingSync,
    forcSync,
    getStorageInfo,
  };
};
