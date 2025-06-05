import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { offlineStorage, connectionManager } from "@/lib/offline";
import { useToast } from "@/hooks/use-toast";
import type { Inspection, Client, Tile, NonConformity } from "@shared/schema";

interface InspectionData {
  inspection?: Inspection;
  client?: Client;
  tiles: Tile[];
  nonConformities: NonConformity[];
}

export function useInspection(inspectionId?: number) {
  const [currentData, setCurrentData] = useState<InspectionData>({
    tiles: [],
    nonConformities: [],
  });
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Load inspection data
  const { data: inspection, isLoading } = useQuery({
    queryKey: ["/api/inspections", inspectionId],
    enabled: !!inspectionId && connectionManager.isOnline,
  });

  const { data: tiles = [] } = useQuery({
    queryKey: ["/api/inspections", inspectionId, "tiles"],
    enabled: !!inspectionId && connectionManager.isOnline,
  });

  const { data: nonConformities = [] } = useQuery({
    queryKey: ["/api/inspections", inspectionId, "non-conformities"],
    enabled: !!inspectionId && connectionManager.isOnline,
  });

  // Create inspection mutation
  const createInspectionMutation = useMutation({
    mutationFn: async (data: any) => {
      if (connectionManager.isOnline) {
        const response = await apiRequest("POST", "/api/inspections", data);
        return response.json();
      } else {
        // Save offline
        const id = await offlineStorage.saveInspection(data);
        await offlineStorage.addToSyncQueue("create_inspection", { ...data, id });
        return { ...data, id };
      }
    },
    onSuccess: (newInspection) => {
      setCurrentData(prev => ({ ...prev, inspection: newInspection }));
      queryClient.invalidateQueries({ queryKey: ["/api/inspections"] });
      toast({
        title: "Vistoria criada",
        description: connectionManager.isOnline ? "Dados salvos no servidor" : "Dados salvos offline",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar vistoria",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    },
  });

  // Update inspection mutation
  const updateInspectionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      if (connectionManager.isOnline) {
        const response = await apiRequest("PUT", `/api/inspections/${id}`, data);
        return response.json();
      } else {
        // Save offline
        await offlineStorage.updateInspection(id, data);
        await offlineStorage.addToSyncQueue("update_inspection", { ...data, id });
        return { ...data, id };
      }
    },
    onSuccess: (updatedInspection) => {
      setCurrentData(prev => ({ ...prev, inspection: updatedInspection }));
      queryClient.invalidateQueries({ queryKey: ["/api/inspections", inspectionId] });
    },
  });

  // Add tile mutation
  const addTileMutation = useMutation({
    mutationFn: async (tileData: any) => {
      if (connectionManager.isOnline && inspectionId) {
        const response = await apiRequest("POST", `/api/inspections/${inspectionId}/tiles`, tileData);
        return response.json();
      } else {
        // Save offline
        const id = await offlineStorage.saveTile({ ...tileData, inspectionId: inspectionId || -1 });
        await offlineStorage.addToSyncQueue("create_tile", { ...tileData, id, inspectionId });
        return { ...tileData, id };
      }
    },
    onSuccess: (newTile) => {
      setCurrentData(prev => ({
        ...prev,
        tiles: [...prev.tiles, newTile],
      }));
      queryClient.invalidateQueries({ queryKey: ["/api/inspections", inspectionId, "tiles"] });
    },
  });

  // Add non-conformity mutation
  const addNonConformityMutation = useMutation({
    mutationFn: async (ncData: any) => {
      if (connectionManager.isOnline && inspectionId) {
        const response = await apiRequest("POST", `/api/inspections/${inspectionId}/non-conformities`, ncData);
        return response.json();
      } else {
        // Save offline
        const id = await offlineStorage.saveNonConformity({ ...ncData, inspectionId: inspectionId || -1 });
        await offlineStorage.addToSyncQueue("create_non_conformity", { ...ncData, id, inspectionId });
        return { ...ncData, id };
      }
    },
    onSuccess: (newNC) => {
      setCurrentData(prev => ({
        ...prev,
        nonConformities: [...prev.nonConformities, newNC],
      }));
      queryClient.invalidateQueries({ queryKey: ["/api/inspections", inspectionId, "non-conformities"] });
    },
  });

  // Update current data when queries change
  useEffect(() => {
    if (inspection || tiles.length > 0 || nonConformities.length > 0) {
      setCurrentData({
        inspection,
        tiles,
        nonConformities,
      });
    }
  }, [inspection, tiles, nonConformities]);

  // Load offline data if no connection
  useEffect(() => {
    const loadOfflineData = async () => {
      if (!connectionManager.isOnline && inspectionId) {
        try {
          const offlineTiles = await offlineStorage.getTilesByInspection(inspectionId);
          const offlineNCs = await offlineStorage.getNonConformitiesByInspection(inspectionId);
          
          setCurrentData(prev => ({
            ...prev,
            tiles: offlineTiles,
            nonConformities: offlineNCs,
          }));
        } catch (error) {
          console.error("Error loading offline data:", error);
        }
      }
    };

    loadOfflineData();
  }, [inspectionId, connectionManager.isOnline]);

  const saveDraft = async (data: Partial<InspectionData>) => {
    if (inspectionId) {
      await updateInspectionMutation.mutateAsync({ id: inspectionId, data: data.inspection });
    } else {
      const newInspection = await createInspectionMutation.mutateAsync(data.inspection);
      // Update inspection ID for future operations
      setCurrentData(prev => ({ ...prev, inspection: newInspection }));
    }
  };

  const calculateTotalArea = () => {
    return currentData.tiles.reduce((total, tile) => total + tile.correctedArea, 0);
  };

  return {
    data: currentData,
    isLoading,
    saveDraft,
    createInspection: createInspectionMutation.mutateAsync,
    updateInspection: updateInspectionMutation.mutateAsync,
    addTile: addTileMutation.mutateAsync,
    addNonConformity: addNonConformityMutation.mutateAsync,
    calculateTotalArea,
    isCreating: createInspectionMutation.isPending,
    isUpdating: updateInspectionMutation.isPending,
    setCurrentData,
  };
}
