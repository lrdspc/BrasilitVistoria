import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Client, Tile, NonConformity } from '@shared/schema';

interface VistoriaFormData {
  // Step 1: Client
  client: Client | null;
  
  // Step 2: Basic Info
  date: Date;
  enterprise: string;
  city: string;
  state: string;
  address: string;
  cep: string;
  protocol: string;
  subject: string;
  
  // Step 3: Team (auto-filled from user)
  technician: string;
  department: string;
  unit: string;
  coordinator: string;
  manager: string;
  regional: string;
  
  // Step 4: Tiles
  tiles: Tile[];
  totalArea: number;
  
  // Step 5: Non-conformities
  nonConformities: NonConformity[];
  
  // Form state
  currentStep: number;
  isComplete: boolean;
  isDraft: boolean;
}

interface VistoriaState extends VistoriaFormData {
  // Actions
  setClient: (client: Client | null) => void;
  setBasicInfo: (info: Partial<VistoriaFormData>) => void;
  setTeamInfo: (info: Partial<VistoriaFormData>) => void;
  addTile: (tile: Omit<Tile, 'id' | 'inspectionId'>) => void;
  removeTile: (index: number) => void;
  updateTile: (index: number, tile: Partial<Tile>) => void;
  setTiles: (tiles: Tile[]) => void;
  addNonConformity: (nc: Omit<NonConformity, 'id' | 'inspectionId'>) => void;
  removeNonConformity: (index: number) => void;
  updateNonConformity: (index: number, nc: Partial<NonConformity>) => void;
  setNonConformities: (nonConformities: NonConformity[]) => void; // Added setNonConformities action
  setCurrentStep: (step: number) => void;
  calculateTotalArea: () => void;
  resetForm: () => void;
  saveDraft: () => void;
  markComplete: () => void;
}

const initialState: VistoriaFormData = {
  client: null,
  date: new Date(),
  enterprise: '',
  city: '',
  state: 'PR',
  address: '',
  cep: '',
  protocol: '',
  subject: '',
  technician: '',
  department: 'Assistência Técnica',
  unit: 'PR',
  coordinator: 'Marlon Weingartner',
  manager: 'Elisabete Kudo',
  regional: 'Sul',
  tiles: [],
  totalArea: 0,
  nonConformities: [],
  currentStep: 1,
  isComplete: false,
  isDraft: false,
};

export const useVistoriaStore = create<VistoriaState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setClient: (client) => set({ client }),

      setBasicInfo: (info) => set((state) => ({ ...state, ...info })),

      setTeamInfo: (info) => set((state) => ({ ...state, ...info })),

      addTile: (tile) => set((state) => {
        const newTiles = [...state.tiles, { ...tile, id: Date.now(), inspectionId: 0 } as Tile];
        return { tiles: newTiles };
      }),

      removeTile: (index) => set((state) => ({
        tiles: state.tiles.filter((_, i) => i !== index)
      })),

      updateTile: (index, tile) => set((state) => ({
        tiles: state.tiles.map((t, i) => i === index ? { ...t, ...tile } : t)
      })),

      setTiles: (tiles) => set({ tiles }), // Implementation for setTiles

      addNonConformity: (nc) => set((state) => {
        const newNCs = [...state.nonConformities, { ...nc, id: Date.now(), inspectionId: 0 } as NonConformity];
        return { nonConformities: newNCs };
      }),

      removeNonConformity: (index) => set((state) => ({
        nonConformities: state.nonConformities.filter((_, i) => i !== index)
      })),

      updateNonConformity: (index, nc) => set((state) => ({
        nonConformities: state.nonConformities.map((n, i) => i === index ? { ...n, ...nc } : n)
      })),

      setNonConformities: (nonConformities) => set({ nonConformities }), // Implementation for setNonConformities

      setCurrentStep: (currentStep) => set({ currentStep }),

      calculateTotalArea: () => set((state) => {
        const totalArea = state.tiles.reduce((sum, tile) => {
          return sum + tile.correctedArea;
        }, 0);
        return { totalArea };
      }),

      resetForm: () => set(initialState),

      saveDraft: () => set({ isDraft: true }),

      markComplete: () => set({ isComplete: true, isDraft: false }),
    }),
    {
      name: 'vigitel-vistoria',
      partialize: (state) => ({
        client: state.client,
        date: state.date,
        enterprise: state.enterprise,
        city: state.city,
        state: state.state,
        address: state.address,
        cep: state.cep,
        protocol: state.protocol,
        subject: state.subject,
        tiles: state.tiles,
        totalArea: state.totalArea,
        nonConformities: state.nonConformities,
        currentStep: state.currentStep,
        isDraft: state.isDraft,
      }),
    }
  )
);
