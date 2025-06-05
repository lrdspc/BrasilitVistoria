import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useOffline } from '@/hooks/use-offline';

export interface TileData {
  id: string;
  thickness: string;
  length: string;
  width: string;
  quantity: number;
  grossArea: number;
  correctedArea: number;
}

export interface NonConformityData {
  id: string;
  title: string;
  selected: boolean;
  photos: Array<{ id: string; url: string; blob?: Blob }>;
  notes: string;
}

export interface InspectionFormData {
  // Client info
  clientId?: number;
  clientName?: string;
  
  // Basic info
  date: string;
  enterpriseType: string;
  city: string;
  state: string;
  address: string;
  cep: string;
  protocol: string;
  subject: string;
  technician: string;
  
  // Tiles
  tiles: TileData[];
  totalArea: number;
  
  // Non-conformities
  nonConformities: NonConformityData[];
}

export function useInspectionForm() {
  const { toast } = useToast();
  const { saveDraft, savePhoto } = useOffline();
  
  const [formData, setFormData] = useState<InspectionFormData>({
    date: new Date().toISOString().split('T')[0],
    enterpriseType: 'Residencial',
    city: '',
    state: 'PR',
    address: '',
    cep: '',
    protocol: '',
    subject: '',
    technician: '',
    tiles: [],
    totalArea: 0,
    nonConformities: [],
  });

  const [currentStep, setCurrentStep] = useState(1);

  const updateFormData = useCallback((updates: Partial<InspectionFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  const calculateTileArea = (tile: Omit<TileData, 'grossArea' | 'correctedArea'>) => {
    const length = parseFloat(tile.length.replace('m', ''));
    const width = parseFloat(tile.width.replace('m', ''));
    const grossArea = length * width * tile.quantity; // m²
    const correctedArea = grossArea * 0.88; // 12% overlap correction
    
    return {
      grossArea: Math.round(grossArea * 10000), // Convert to cm² for precision
      correctedArea: Math.round(correctedArea * 10000),
    };
  };

  const addTile = useCallback((tileData: Omit<TileData, 'id' | 'grossArea' | 'correctedArea'>) => {
    const { grossArea, correctedArea } = calculateTileArea(tileData);
    
    const newTile: TileData = {
      ...tileData,
      id: `tile_${Date.now()}_${Math.random()}`,
      grossArea,
      correctedArea,
    };

    const updatedTiles = [...formData.tiles, newTile];
    const totalArea = updatedTiles.reduce((sum, tile) => sum + tile.correctedArea, 0);

    updateFormData({ tiles: updatedTiles, totalArea });
  }, [formData.tiles, updateFormData]);

  const updateTile = useCallback((tileId: string, updates: Partial<TileData>) => {
    const updatedTiles = formData.tiles.map(tile => {
      if (tile.id === tileId) {
        const updatedTile = { ...tile, ...updates };
        const { grossArea, correctedArea } = calculateTileArea(updatedTile);
        return { ...updatedTile, grossArea, correctedArea };
      }
      return tile;
    });

    const totalArea = updatedTiles.reduce((sum, tile) => sum + tile.correctedArea, 0);
    updateFormData({ tiles: updatedTiles, totalArea });
  }, [formData.tiles, updateFormData]);

  const removeTile = useCallback((tileId: string) => {
    const updatedTiles = formData.tiles.filter(tile => tile.id !== tileId);
    const totalArea = updatedTiles.reduce((sum, tile) => sum + tile.correctedArea, 0);
    updateFormData({ tiles: updatedTiles, totalArea });
  }, [formData.tiles, updateFormData]);

  const updateNonConformity = useCallback((nonConformityId: string, updates: Partial<NonConformityData>) => {
    const updatedNonConformities = formData.nonConformities.map(nc =>
      nc.id === nonConformityId ? { ...nc, ...updates } : nc
    );
    updateFormData({ nonConformities: updatedNonConformities });
  }, [formData.nonConformities, updateFormData]);

  const saveDraftData = useCallback(async () => {
    try {
      await saveDraft({
        ...formData,
        step: currentStep,
        lastSaved: new Date().toISOString(),
      });
      
      toast({
        title: "Rascunho salvo",
        description: "Dados salvos com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar rascunho",
        variant: "destructive",
      });
    }
  }, [formData, currentStep, saveDraft, toast]);

  const validateStep = useCallback((step: number): boolean => {
    switch (step) {
      case 1: // Client selection - optional
        return true;
      
      case 2: // Basic info
        return !!(formData.date && formData.city && formData.state && 
                 formData.address && formData.cep && formData.protocol && 
                 formData.subject && formData.technician);
      
      case 3: // Tiles
        return formData.tiles.length > 0;
      
      case 4: // Non-conformities
        const selectedNonConformities = formData.nonConformities.filter(nc => nc.selected);
        return selectedNonConformities.length > 0 && 
               selectedNonConformities.every(nc => nc.photos.length > 0);
      
      case 5: // Review
        return validateStep(2) && validateStep(3) && validateStep(4);
      
      default:
        return false;
    }
  }, [formData]);

  const nextStep = useCallback(() => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
      saveDraftData();
    } else {
      toast({
        title: "Dados incompletos",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
    }
  }, [currentStep, validateStep, saveDraftData, toast]);

  const prevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  }, []);

  const goToStep = useCallback((step: number) => {
    setCurrentStep(step);
  }, []);

  return {
    formData,
    currentStep,
    updateFormData,
    addTile,
    updateTile,
    removeTile,
    updateNonConformity,
    nextStep,
    prevStep,
    goToStep,
    validateStep,
    saveDraftData,
  };
}
