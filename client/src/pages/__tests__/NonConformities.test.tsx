import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { NonConformitiesPage } from '@/pages/NonConformities'; // Adjust if default export
import type { NonConformity as StoreNonConformity } from '@/stores/vistoriaStore';
import type { AvailableNonConformity, SelectedNonConformity } from '@/components/forms/NaoConformidadesChecklist';

// --- Mocks ---
const mockSetLocation = vi.fn();
vi.mock('wouter', () => ({
  useLocation: () => [null, mockSetLocation],
}));

const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

// Mock NaoConformidadesChecklist
const mockChecklistOnChange = vi.fn();
vi.mock('@/components/forms/NaoConformidadesChecklist', () => ({
  NaoConformidadesChecklist: vi.fn(({ availableItems, selectedNonConformities, onChange, className }) => {
    mockChecklistOnChange.mockImplementation(onChange); // Capture onChange for simulation
    return (
      <div data-testid="mock-nao-conformidades-checklist" className={className}>
        <button data-testid="simulate-nc-change" onClick={() => mockChecklistOnChange([
          { title: 'NC Test 1', description: 'Desc 1', notes: 'Note 1', photos: ['photo1.jpg'] }
        ])}>
          Simulate NC Change
        </button>
        <pre data-testid="available-items-prop">{JSON.stringify(availableItems)}</pre>
        <pre data-testid="selected-items-prop">{JSON.stringify(selectedNonConformities)}</pre>
      </div>
    );
  }),
}));
const MockedNaoConformidadesChecklist = vi.mocked(require('@/components/forms/NaoConformidadesChecklist').NaoConformidadesChecklist);

// Mock @tanstack/react-query for useQuery
const mockUseQuery = vi.fn();
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...actual,
    useQuery: mockUseQuery,
  };
});

const mockApiNonConformityTitles: string[] = ["Telha Quebrada", "Sujeira Excessiva", "Estrutura Danificada"];
const mockAvailableNcItems: AvailableNonConformity[] = mockApiNonConformityTitles.map((title, index) => ({
  id: String(index + 1),
  title: title,
  defaultDescription: `Detalhes sobre ${title}.`,
}));

const initialMockSelectedNcsFromStore: StoreNonConformity[] = [
  { id: 101, inspectionId: 1, title: 'Telha Quebrada', description: 'Uma telha está quebrada.', notes: 'Perto da borda.', photos: ['photo1.jpg', 'photo2.jpg'] },
];
const initialMockChecklistSelectedItems: SelectedNonConformity[] = initialMockSelectedNcsFromStore.map(nc => ({
    title: nc.title, description: nc.description || "", notes: nc.notes || "", photos: nc.photos || []
}));


const mockVistoriaStoreState = {
  nonConformities: [] as StoreNonConformity[],
  currentStep: 4,
  setNonConformities: vi.fn(),
  setCurrentStep: vi.fn(),
};

vi.mock('@/stores/vistoriaStore', () => ({
  useVistoriaStore: vi.fn(() => mockVistoriaStoreState),
}));
const useVistoriaStoreMock = vi.mocked(require('@/stores/vistoriaStore').useVistoriaStore);

const queryClient = new QueryClient();
const renderNonConformitiesPage = () => {
  return render(
    <QueryClientProvider client={queryClient}>
      <NonConformitiesPage />
    </QueryClientProvider>
  );
};

describe('NonConformitiesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear(); // Clear query cache

    // Reset store state for each test
    mockVistoriaStoreState.nonConformities = [...initialMockSelectedNcsFromStore];
    mockVistoriaStoreState.currentStep = 4;
    useVistoriaStoreMock.mockReturnValue(mockVistoriaStoreState);

    // Default successful query mock
    mockUseQuery.mockReturnValue({
      data: mockAvailableNcItems, // Page transforms string[] to AvailableNonConformity[]
      isLoading: false,
      isError: false,
      error: null,
    });
    // Mock the fetchNonConformityConfigs internal fetch if it's not using useQuery directly
    // The page implementation uses useQuery with a queryFn, so mocking useQuery is enough.
  });

  // 1. Rendering
  describe('Rendering', () => {
    it('renders loading state initially when fetching configurations', () => {
      mockUseQuery.mockReturnValueOnce({ data: undefined, isLoading: true, isError: false, error: null });
      renderNonConformitiesPage();
      expect(screen.getByText(/carregando configurações.../i)).toBeInTheDocument();
    });

    it('renders error state if fetching configurations fails', () => {
      const errorMsg = 'Failed to load configs';
      mockUseQuery.mockReturnValueOnce({ data: undefined, isLoading: false, isError: true, error: new Error(errorMsg) });
      renderNonConformitiesPage();
      expect(screen.getByText(new RegExp(errorMsg, "i"))).toBeInTheDocument();
    });

    it('renders checklist and navigation buttons when data is loaded', async () => {
      renderNonConformitiesPage();
      await waitFor(() => expect(screen.getByTestId('mock-nao-conformidades-checklist')).toBeInTheDocument());
      expect(screen.getByRole('button', { name: /voltar/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /próximo/i })).toBeInTheDocument();
      // Check ProgressBar step (conceptual)
      expect(useVistoriaStoreMock().currentStep).toBe(4);
    });
  });

  // 2. Fetching Non-Conformity Configurations
  describe('Fetching Configurations', () => {
    it('calls useQuery for /api/config/non-conformities and passes transformed data to checklist', async () => {
      renderNonConformitiesPage();
      await waitFor(() => {
        expect(mockUseQuery).toHaveBeenCalledWith(expect.objectContaining({
          queryKey: ["nonConformityConfigs"],
        }));
        expect(MockedNaoConformidadesChecklist).toHaveBeenCalledWith(
          expect.objectContaining({ availableItems: mockAvailableNcItems }),
          expect.anything()
        );
        // Verify stringified prop in the mock component
        expect(screen.getByTestId('available-items-prop')).toHaveTextContent(JSON.stringify(mockAvailableNcItems));
        expect(screen.getByTestId('selected-items-prop')).toHaveTextContent(JSON.stringify(initialMockChecklistSelectedItems));
      });
    });
  });

  // 3. Interaction with NaoConformidadesChecklist
  describe('Interaction with NaoConformidadesChecklist', () => {
    it('calls setNonConformities in store when checklist onChange is triggered', async () => {
      renderNonConformitiesPage();
      await waitFor(() => expect(screen.getByTestId('mock-nao-conformidades-checklist')).toBeInTheDocument());

      const newSelectedNCsFromChecklist: SelectedNonConformity[] = [
        { title: 'Sujeira Excessiva', description: 'Muita sujeira', notes: 'Limpar', photos: ['sujeira.jpg'] }
      ];

      // Simulate change from checklist mock
      mockChecklistOnChange.mockImplementationOnce(() => {
        const actualOnChangeProp = MockedNaoConformidadesChecklist.mock.calls[0][0].onChange;
        actualOnChangeProp(newSelectedNCsFromChecklist);
      });
      await userEvent.click(screen.getByTestId('simulate-nc-change'));

      await waitFor(() => {
        // Expect store action to be called with data transformed to StoreNonConformity[]
        expect(mockVistoriaStoreState.setNonConformities).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              title: 'Sujeira Excessiva',
              description: 'Muita sujeira',
              notes: 'Limpar',
              photos: ['sujeira.jpg'],
              // id and inspectionId are generated/preserved by the page's transformation logic
            }),
          ])
        );
      });
    });
  });

  // 4. Store Interaction (Next/Back buttons)
  describe('Store Interaction & Validation', () => {
    it('calls setCurrentStep(5) on "Próximo" click if validation passes', async () => {
      // Ensure selected Ncs have photos
      mockVistoriaStoreState.nonConformities = [
        { id: 1, inspectionId: 1, title: 'NC 1', description: '', notes: '', photos: ['photo.jpg'] }
      ];
      useVistoriaStoreMock.mockReturnValue(mockVistoriaStoreState);
      renderNonConformitiesPage();
      await waitFor(() => expect(screen.getByTestId('mock-nao-conformidades-checklist')).toBeInTheDocument());

      await userEvent.click(screen.getByRole('button', { name: /próximo/i }));

      expect(mockVistoriaStoreState.setCurrentStep).toHaveBeenCalledWith(5);
      expect(mockToast).not.toHaveBeenCalled();
    });

    it('shows toast and prevents navigation if selected NCs are missing photos', async () => {
      mockVistoriaStoreState.nonConformities = [ // NC selected but missing photo
        { id: 1, inspectionId: 1, title: 'Telha Quebrada', description: 'Broken', notes: '', photos: [] }
      ];
      useVistoriaStoreMock.mockReturnValue(mockVistoriaStoreState);
      renderNonConformitiesPage();
      await waitFor(() => expect(screen.getByTestId('mock-nao-conformidades-checklist')).toBeInTheDocument());

      await userEvent.click(screen.getByRole('button', { name: /próximo/i }));

      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: "Fotos obrigatórias",
        description: expect.stringContaining('Telha Quebrada'),
        variant: "destructive",
      }));
      expect(mockVistoriaStoreState.setCurrentStep).not.toHaveBeenCalledWith(5);
      expect(mockSetLocation).not.toHaveBeenCalled();
    });

    it('allows proceeding to next step if no NCs are selected (toast default, no error)', async () => {
      mockVistoriaStoreState.nonConformities = []; // No NCs selected
      useVistoriaStoreMock.mockReturnValue(mockVistoriaStoreState);
      renderNonConformitiesPage();
      await waitFor(() => expect(screen.getByTestId('mock-nao-conformidades-checklist')).toBeInTheDocument());

      await userEvent.click(screen.getByRole('button', { name: /próximo/i }));

      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: "Nenhuma não conformidade selecionada",
        variant: "default",
      }));
      expect(mockVistoriaStoreState.setCurrentStep).toHaveBeenCalledWith(5); // Proceeds
      expect(mockSetLocation).toHaveBeenCalledWith('/inspection/review'); // Proceeds
    });


    it('calls setCurrentStep(3) on "Voltar" click', async () => {
      renderNonConformitiesPage();
      await waitFor(() => expect(screen.getByTestId('mock-nao-conformidades-checklist')).toBeInTheDocument());

      await userEvent.click(screen.getByRole('button', { name: /voltar/i }));

      expect(mockVistoriaStoreState.setCurrentStep).toHaveBeenCalledWith(3);
    });
  });

  // 5. Navigation
  describe('Navigation', () => {
    it('navigates to /inspection/review on "Próximo" click if validation passes', async () => {
      mockVistoriaStoreState.nonConformities = [ // Ensure validation passes
        { id: 1, inspectionId: 1, title: 'NC Valid', description: '', notes: '', photos: ['valid.jpg'] }
      ];
      useVistoriaStoreMock.mockReturnValue(mockVistoriaStoreState);
      renderNonConformitiesPage();
      await waitFor(() => expect(screen.getByTestId('mock-nao-conformidades-checklist')).toBeInTheDocument());

      await userEvent.click(screen.getByRole('button', { name: /próximo/i }));

      expect(mockSetLocation).toHaveBeenCalledWith('/inspection/review');
    });

    it('navigates to /inspection/tiles on "Voltar" click', async () => {
      renderNonConformitiesPage();
      await waitFor(() => expect(screen.getByTestId('mock-nao-conformidades-checklist')).toBeInTheDocument());

      await userEvent.click(screen.getByRole('button', { name: /voltar/i }));

      expect(mockSetLocation).toHaveBeenCalledWith('/inspection/tiles');
    });
  });
});
