import { useState, useEffect } from "react";
import { connectionManager, offlineStorage } from "@/lib/offline";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function useOfflineSync() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    const handleOnline = async () => {
      await syncPendingData();
    };

    connectionManager.addListener(handleOnline);
    updatePendingCount();

    return () => {
      connectionManager.removeListener(handleOnline);
    };
  }, []);

  const updatePendingCount = async () => {
    try {
      const queue = await offlineStorage.getSyncQueue();
      setPendingCount(queue.length);
    } catch (error) {
      console.error("Error updating pending count:", error);
    }
  };

  const syncPendingData = async () => {
    if (!connectionManager.isOnline || isSyncing) return;

    setIsSyncing(true);

    try {
      const queue = await offlineStorage.getSyncQueue();
      
      if (queue.length === 0) {
        setIsSyncing(false);
        return;
      }

      toast({
        title: "Sincronizando dados...",
        description: `${queue.length} itens pendentes`,
      });

      let syncedCount = 0;

      for (const item of queue) {
        try {
          await syncItem(item);
          syncedCount++;
        } catch (error) {
          console.error("Error syncing item:", error);
          // Continue with other items
        }
      }

      await offlineStorage.clearSyncQueue();
      setPendingCount(0);

      if (syncedCount > 0) {
        toast({
          title: "Sincronização concluída",
          description: `${syncedCount} itens sincronizados`,
        });
      }
    } catch (error) {
      console.error("Error syncing data:", error);
      toast({
        title: "Erro na sincronização",
        description: "Alguns dados podem não ter sido sincronizados",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const syncItem = async (item: any) => {
    const { operation, data } = item;

    switch (operation) {
      case "create_client":
        await apiRequest("POST", "/api/clients", data);
        break;
      case "create_inspection":
        await apiRequest("POST", "/api/inspections", data);
        break;
      case "update_inspection":
        await apiRequest("PUT", `/api/inspections/${data.id}`, data);
        break;
      case "create_tile":
        await apiRequest("POST", `/api/inspections/${data.inspectionId}/tiles`, data);
        break;
      case "create_non_conformity":
        await apiRequest("POST", `/api/inspections/${data.inspectionId}/non-conformities`, data);
        break;
      default:
        console.warn("Unknown sync operation:", operation);
    }
  };

  const forcSync = async () => {
    if (connectionManager.isOnline) {
      await syncPendingData();
    } else {
      toast({
        title: "Sem conexão",
        description: "Não é possível sincronizar offline",
        variant: "destructive",
      });
    }
  };

  return {
    isSyncing,
    pendingCount,
    syncPendingData,
    forcSync,
  };
}
