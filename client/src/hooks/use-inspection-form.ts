import { useState, useCallback } from 'react';
import { InspectionFormData, TileConfiguration, NonConformityItem, NON_CONFORMITY_OPTIONS } from '@/types/inspection';
import { updateTileAreas } from '@/lib/calculations';
import { useOffline } from './use-offline';

const initialFormData: InspectionFormData = {
  date: new Date().toISOString().split('T')[0],
  enterprise: 'Residencial',
  city: '',
  state: 'PR',
  address: '',
  cep: '',
  protocol: '',
  subject: '',
  technicianName: '',
  tiles: [],
  nonConformities: NON_CONFORMITY_OPTIONS.map(title => ({
    title,
    notes: '',
    photos: [],
    selected: false
  })),
  status: 'draft'
};

export function useInspectionForm() {
  const [formData, setFormData] = useState<InspectionFormData>(initialFormData);
  const [currentStep, setCurrentStep] = useState(0);
  const { saveOffline, isOnline } = useOffline();

  const updateField = useCallback((field: keyof InspectionFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const addTile = useCallback(() => {
    const newTile: TileConfiguration = {
      thickness: '6mm',
      length: '2,44m',
      width: '1,10m',
      quantity: 1,
      grossArea: 0,
      correctedArea: 0
    };
    
    const updatedTile = updateTileAreas(newTile);
    setFormData(prev => ({
      ...prev,
      tiles: [...prev.tiles, updatedTile]
    }));
  }, []);

  const updateTile = useCallback((index: number, updates: Partial<TileConfiguration>) => {
    setFormData(prev => ({
      ...prev,
      tiles: prev.tiles.map((tile, i) => 
        i === index ? updateTileAreas({ ...tile, ...updates }) : tile
      )
    }));
  }, []);

  const removeTile = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      tiles: prev.tiles.filter((_, i) => i !== index)
    }));
  }, []);

  const updateNonConformity = useCallback((index: number, updates: Partial<NonConformityItem>) => {
    setFormData(prev => ({
      ...prev,
      nonConformities: prev.nonConformities.map((nc, i) =>
        i === index ? { ...nc, ...updates } : nc
      )
    }));
  }, []);

  const generateProtocol = useCallback(() => {
    const prefix = 'FAR';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    return `${prefix}${timestamp}${random}`;
  }, []);

  const saveDraft = useCallback(async () => {
    const draftData = { ...formData, status: 'draft' as const };
    
    if (isOnline) {
      // Save to server
      try {
        // API call would go here
        console.log('Saving draft to server:', draftData);
      } catch (error) {
        // Fall back to offline storage
        await saveOffline(draftData);
      }
    } else {
      // Save offline
      await saveOffline(draftData);
    }
  }, [formData, isOnline, saveOffline]);

  const submitForm = useCallback(async () => {
    const completedData = { ...formData, status: 'completed' as const };
    
    if (isOnline) {
      // Submit to server
      try {
        const response = await fetch('/api/inspections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(completedData)
        });
        
        if (!response.ok) throw new Error('Submission failed');
        
        return await response.json();
      } catch (error) {
        // Fall back to offline storage
        await saveOffline(completedData);
        throw error;
      }
    } else {
      // Save offline for later sync
      await saveOffline(completedData);
      return { offline: true, data: completedData };
    }
  }, [formData, isOnline, saveOffline]);

  const resetForm = useCallback(() => {
    setFormData(initialFormData);
    setCurrentStep(0);
  }, []);

  return {
    formData,
    currentStep,
    setCurrentStep,
    updateField,
    addTile,
    updateTile,
    removeTile,
    updateNonConformity,
    generateProtocol,
    saveDraft,
    submitForm,
    resetForm
  };
}
