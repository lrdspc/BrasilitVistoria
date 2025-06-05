import { useState, useEffect } from 'react';
import { offlineStorage } from '@/lib/offline-storage';
import { InspectionFormData } from '@/types/inspection';
import { useToast } from '@/hooks/use-toast';

export function useOffline() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "Conexão restaurada",
        description: "Sincronizando dados...",
      });
      syncPendingData();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "Modo offline ativado",
        description: "Dados serão sincronizados quando a conexão for restaurada.",
        variant: "destructive"
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check for pending sync data on mount
    checkPendingSyncData();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const checkPendingSyncData = async () => {
    try {
      const pendingInspections = await offlineStorage.getPendingSyncInspections();
      setPendingSyncCount(pendingInspections.length);
    } catch (error) {
      console.error('Failed to check pending sync data:', error);
    }
  };

  const syncPendingData = async () => {
    try {
      const pendingInspections = await offlineStorage.getPendingSyncInspections();
      
      for (const inspection of pendingInspections) {
        await syncInspection(inspection);
      }

      if (pendingInspections.length > 0) {
        toast({
          title: "Sincronização concluída",
          description: `${pendingInspections.length} vistorias sincronizadas com sucesso.`,
        });
        setPendingSyncCount(0);
      }
    } catch (error) {
      console.error('Sync failed:', error);
      toast({
        title: "Erro na sincronização",
        description: "Algumas vistorias não puderam ser sincronizadas. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const syncInspection = async (inspection: InspectionFormData) => {
    try {
      // Create inspection on server
      const response = await fetch('/api/inspections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          protocol: inspection.protocol,
          clientName: inspection.clientName,
          date: new Date(inspection.date),
          enterprise: inspection.enterprise,
          city: inspection.city,
          state: inspection.state,
          address: inspection.address,
          cep: inspection.cep,
          subject: inspection.subject,
          technicianName: inspection.technicianName,
          status: inspection.status
        })
      });

      if (!response.ok) throw new Error('Failed to sync inspection');

      const createdInspection = await response.json();

      // Sync tiles
      for (const tile of inspection.tiles) {
        await fetch(`/api/inspections/${createdInspection.id}/tiles`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(tile)
        });
      }

      // Sync non-conformities
      for (const nc of inspection.nonConformities.filter(nc => nc.selected)) {
        await fetch(`/api/inspections/${createdInspection.id}/non-conformities`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: nc.title,
            notes: nc.notes,
            photos: nc.photos
          })
        });
      }

      // Remove from offline storage after successful sync
      if (inspection.offlineId) {
        await offlineStorage.deleteInspection(inspection.offlineId);
      }
    } catch (error) {
      console.error('Failed to sync inspection:', inspection.protocol, error);
      throw error;
    }
  };

  const saveOffline = async (inspection: InspectionFormData) => {
    try {
      await offlineStorage.saveInspection(inspection);
      toast({
        title: "Dados salvos offline",
        description: "A vistoria será sincronizada quando houver conexão.",
      });
    } catch (error) {
      console.error('Failed to save offline:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar os dados offline.",
        variant: "destructive"
      });
    }
  };

  return {
    isOnline,
    pendingSyncCount,
    syncPendingData,
    saveOffline,
    checkPendingSyncData
  };
}
