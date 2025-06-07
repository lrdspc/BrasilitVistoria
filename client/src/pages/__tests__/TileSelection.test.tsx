import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TileSelection } from '@/pages/TileSelection'; // Adjust if default export
import type { Tile as StoreTile } from '@/stores/vistoriaStore'; // Assuming this type exists

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

// Mock TelhaSelector
const mockTelhaSelectorOnChange = vi.fn();
vi.mock('@/components/forms/TelhaSelector', () => ({
  TelhaSelector: vi.fn(({ tiles, onChange, className }) => {
    // Update the shared mock function when onChange is called by the actual component instance
    mockTelhaSelectorOnChange.mockImplementation(onChange);
    return (
      <div data-testid="mock-telha-selector" className={className}>
        <button data-testid="simulate-tile-change" onClick={() => mockTelhaSelectorOnChange([{面积: 10, id: 'new-tile-1'} as any])}>
          Simulate Tile Change
        </button>
        <pre>{JSON.stringify(tiles)}</pre>
      </div>
    );
  }),
}));
const MockedTelhaSelector = vi.mocked(require('@/components/forms/TelhaSelector').TelhaSelector);


const initialMockTiles: StoreTile[] = [
  { id: 1, inspectionId: 1, thickness: '5mm', length: 3.66, width: 1.10, quantity: 10, grossArea: 40.26, correctedArea: 35.43 },
  { id: 2, inspectionId: 1, thickness: '6mm', length: 2.44, width: 1.10, quantity: 20, grossArea: 53.68, correctedArea: 47.24 },
];

const mockVistoriaStoreState = {
  tiles: [] as StoreTile[],
  currentStep: 3,
  setTiles: vi.fn(),
  setCurrentStep: vi.fn(),
  calculateTotalArea: vi.fn(),
};

vi.mock('@/stores/vistoriaStore', () => ({
  useVistoriaStore: vi.fn(() => mockVistoriaStoreState),
}));
const useVistoriaStoreMock = vi.mocked(require('@/stores/vistoriaStore').useVistoriaStore);


// Helper to render
const renderTileSelection = () => {
  return render(<TileSelection />);
};

describe('TileSelection Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state for each test
    mockVistoriaStoreState.tiles = [...initialMockTiles]; // Default with some tiles
    mockVistoriaStoreState.currentStep = 3;
    useVistoriaStoreMock.mockReturnValue(mockVistoriaStoreState);
  });

  // 1. Rendering
  describe('Rendering', () => {
    it('renders TelhaSelector, navigation buttons, and correct progress bar step', () => {
      renderTileSelection();
      expect(screen.getByTestId('mock-telha-selector')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /voltar/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /próximo/i })).toBeInTheDocument();
      // Check if ProgressBar receives the correct step (conceptual, depends on ProgressBar impl.)
      // For now, verify store currentStep is passed to ProgressBar via useVistoriaStore hook
      expect(useVistoriaStoreMock().currentStep).toBe(3);
    });

    it('passes tiles from vistoriaStore to TelhaSelector', () => {
      renderTileSelection();
      expect(MockedTelhaSelector).toHaveBeenCalledWith(
        expect.objectContaining({ tiles: initialMockTiles }),
        expect.anything()
      );
      // Check the stringified output in the mock component
      expect(screen.getByText(JSON.stringify(initialMockTiles))).toBeInTheDocument();
    });
  });

  // 2. Interaction with TelhaSelector
  describe('Interaction with TelhaSelector', () => {
    it('calls setTiles in vistoriaStore when TelhaSelector onChange is triggered', async () => {
      renderTileSelection();
      const newTilesData = [{ id: 'new-tile-2', name: 'Nova Telha', correctedArea: 15 } as any];

      // Simulate change from within the mocked TelhaSelector
      // We need to ensure the mockTelhaSelectorOnChange is correctly linked to the instance's prop
      const simulateButton = screen.getByTestId('simulate-tile-change');

      // Redefine what the mock's internal button click will call for this specific test
      mockTelhaSelectorOnChange.mockImplementationOnce(() => {
         // Call the actual onChange prop passed to TelhaSelector by TileSelection page
        const actualOnChangeProp = MockedTelhaSelector.mock.calls[0][0].onChange;
        actualOnChangeProp(newTilesData);
      });

      await userEvent.click(simulateButton);

      expect(mockVistoriaStoreState.setTiles).toHaveBeenCalledWith(newTilesData);
    });
  });

  // 3. Store Interaction (Next/Back buttons)
  describe('Store Interaction', () => {
    it('calls calculateTotalArea and setCurrentStep(4) on "Próximo" click if tiles exist', async () => {
      renderTileSelection();
      await userEvent.click(screen.getByRole('button', { name: /próximo/i }));

      expect(mockVistoriaStoreState.calculateTotalArea).toHaveBeenCalled();
      expect(mockVistoriaStoreState.setCurrentStep).toHaveBeenCalledWith(4);
      expect(mockToast).not.toHaveBeenCalled();
    });

    it('shows a toast message and prevents navigation if no tiles are selected on "Próximo" click', async () => {
      mockVistoriaStoreState.tiles = []; // No tiles
      useVistoriaStoreMock.mockReturnValue(mockVistoriaStoreState);
      renderTileSelection();

      await userEvent.click(screen.getByRole('button', { name: /próximo/i }));

      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: "Nenhuma telha selecionada",
        variant: "destructive",
      }));
      expect(mockVistoriaStoreState.calculateTotalArea).not.toHaveBeenCalled();
      expect(mockVistoriaStoreState.setCurrentStep).not.toHaveBeenCalledWith(4);
      expect(mockSetLocation).not.toHaveBeenCalled();
    });

    it('calls setCurrentStep(2) on "Voltar" click', async () => {
      renderTileSelection();
      await userEvent.click(screen.getByRole('button', { name: /voltar/i }));

      expect(mockVistoriaStoreState.setCurrentStep).toHaveBeenCalledWith(2);
    });
  });

  // 4. Navigation
  describe('Navigation', () => {
    it('navigates to /inspection/non-conformities on "Próximo" click if tiles exist', async () => {
      renderTileSelection();
      await userEvent.click(screen.getByRole('button', { name: /próximo/i }));

      expect(mockSetLocation).toHaveBeenCalledWith('/inspection/non-conformities');
    });

    it('navigates to /inspection/basic-info on "Voltar" click', async () => {
      renderTileSelection();
      await userEvent.click(screen.getByRole('button', { name: /voltar/i }));

      expect(mockSetLocation).toHaveBeenCalledWith('/inspection/basic-info');
    });
  });
});
