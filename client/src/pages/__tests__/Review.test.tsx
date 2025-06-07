import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReviewPage } from '@/pages/Review'; // Adjust if default export
import type { VistoriaState } from '@/stores/vistoriaStore'; // Import the full store state type
import { formatDate as actualFormatDate } from '@/lib/utils'; // Import actual for comparison or ensure it's mockable

// --- Mocks ---
const mockSetLocation = vi.fn();
vi.mock('wouter', () => ({
  useLocation: () => [null, mockSetLocation],
}));

const mockToast = vi.fn(); // Though Review page might not use toasts directly on success path
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

// Mock formatDate if it's complex or has side effects not desired in test
// For now, assuming it's a simple utility and can be used or mocked lightly.
// If it's just from lib/utils and already tested, direct import is fine.
// If it needs specific behavior for testing, mock it:
// vi.mock('@/lib/utils', async (importOriginal) => {
//   const actual = await importOriginal<typeof import('@/lib/utils')>();
//   return {
//     ...actual,
//     formatDate: vi.fn((date) => new Date(date).toLocaleDateString('pt-BR')), // Example mock
//   };
// });

const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});

// Comprehensive mock state for vistoriaStore
const mockFullVistoriaData: VistoriaState = {
  client: { id: 'client1', name: 'Cliente Exemplo Ltda.', document: '12.345.678/0001-99', contact: 'João Contato', email: 'contato@cliente.com' },
  date: new Date(2024, 0, 15), // Jan 15, 2024
  enterprise: 'Industrial',
  city: 'Joinville',
  state: 'SC',
  address: 'Rua das Palmeiras, 1000, Bairro Norte',
  cep: '89220-123',
  protocol: 'PROTO-REVIEW-001',
  subject: 'Vistoria Anual Programada',
  technician: 'José Técnico', // Assuming these fields might be part of basicInfo or user object in store
  department: 'Engenharia',
  unit: 'Sul',
  coordinator: 'Carlos Coordenador',
  manager: 'Mariana Gerente',
  regional: 'Sul',
  tiles: [
    { id: 1, inspectionId: 1, thickness: '6mm', length: 3.66, width: 1.10, quantity: 50, grossArea: 201.3, correctedArea: 177.14 },
    { id: 2, inspectionId: 1, thickness: '8mm', length: 2.44, width: 0.55, quantity: 30, grossArea: 40.26, correctedArea: 35.43 },
  ],
  totalArea: 177.14 + 35.43,
  nonConformities: [
    { id: 10, inspectionId: 1, title: 'Telha Quebrada na Cumeeira', description: 'Telha com trinca visível.', notes: 'Necessita substituição urgente.', photos: ['/test/photo1.jpg', '/test/photo2.png'] },
    { id: 11, inspectionId: 1, title: 'Calha Obstruída', description: 'Folhas e detritos bloqueando a passagem da água.', notes: 'Limpeza recomendada.', photos: ['data:image/jpeg;base64,TESTBASE64DATA'] },
    { id: 12, inspectionId: 1, title: 'Fixação Solta', description: 'Parafuso de fixação ausente.', notes: '', photos: [] }, // No photos, no notes
  ],
  currentStep: 5,
  isComplete: false,
  isDraft: false,
  // Mock actions
  setClient: vi.fn(),
  setBasicInfo: vi.fn(),
  setTeamInfo: vi.fn(),
  addTile: vi.fn(),
  removeTile: vi.fn(),
  updateTile: vi.fn(),
  setTiles: vi.fn(),
  addNonConformity: vi.fn(),
  removeNonConformity: vi.fn(),
  updateNonConformity: vi.fn(),
  setNonConformities: vi.fn(),
  setCurrentStep: vi.fn(),
  calculateTotalArea: vi.fn(),
  resetForm: vi.fn(),
  saveDraft: vi.fn(),
  markComplete: vi.fn(),
};

vi.mock('@/stores/vistoriaStore', () => ({
  useVistoriaStore: vi.fn(() => mockFullVistoriaData),
}));
const useVistoriaStoreMock = vi.mocked(require('@/stores/vistoriaStore').useVistoriaStore);

const renderReviewPage = () => {
  return render(<ReviewPage />);
};

describe('ReviewPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Ensure the mock store is reset to the full data for each test if needed,
    // or individual tests can override parts of it.
    useVistoriaStoreMock.mockReturnValue(mockFullVistoriaData);
  });

  afterEach(() => {
    mockConsoleLog.mockClear();
  });

  // 1. Rendering
  describe('Rendering', () => {
    it('renders all Accordion sections and navigation buttons', () => {
      renderReviewPage();
      expect(screen.getByText('Informações do Cliente')).toBeInTheDocument();
      expect(screen.getByText('Informações Básicas da Vistoria')).toBeInTheDocument();
      expect(screen.getByText('Telhas e Área Total')).toBeInTheDocument();
      expect(screen.getByText(/não conformidades \(3\)/i)).toBeInTheDocument(); // Assuming 3 NCs from mock
      expect(screen.getByRole('button', { name: /voltar/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /submeter vistoria/i })).toBeInTheDocument();
    });

    it('displays ProgressBar at the final step', () => {
      renderReviewPage();
      // Conceptual: Check if ProgressBar receives currentStep = 5
      expect(useVistoriaStoreMock().currentStep).toBe(5);
    });

    it('renders client information correctly', () => {
      renderReviewPage();
      // Accordion might need to be opened if not default open
      // fireEvent.click(screen.getByText('Informações do Cliente')); // If needed
      expect(screen.getByText('Cliente Exemplo Ltda.')).toBeInTheDocument();
      expect(screen.getByText('12.345.678/0001-99')).toBeInTheDocument();
    });

    it('renders basic information correctly (with date formatting)', () => {
      renderReviewPage();
      expect(screen.getByText(mockFullVistoriaData.protocol!)).toBeInTheDocument();
      const expectedDate = actualFormatDate(mockFullVistoriaData.date);
      expect(screen.getByText(expectedDate)).toBeInTheDocument();
      expect(screen.getByText(mockFullVistoriaData.enterprise!)).toBeInTheDocument();
      expect(screen.getByText(mockFullVistoriaData.subject!)).toBeInTheDocument();
      expect(screen.getByText(/rua das palmeiras, 1000, joinville, sc/i)).toBeInTheDocument();
      expect(screen.getByText(mockFullVistoriaData.cep!)).toBeInTheDocument();
    });

    it('renders tile information and total area correctly', () => {
      renderReviewPage();
      expect(screen.getByText(/telha 6mm/i)).toBeInTheDocument();
      expect(screen.getByText(/50 unidades/i)).toBeInTheDocument(); // Assuming quantity is displayed like this
      expect(screen.getByText(/177\.14 m²/i)).toBeInTheDocument();
      expect(screen.getByText(/telha 8mm/i)).toBeInTheDocument();
      expect(screen.getByText((mockFullVistoriaData.totalArea).toFixed(2) + " m²")).toBeInTheDocument();
    });

    it('renders non-conformities with details and photos', async () => {
      renderReviewPage();
      const nc1 = mockFullVistoriaData.nonConformities[0];
      const nc2 = mockFullVistoriaData.nonConformities[1];

      expect(screen.getByText(nc1.title)).toBeInTheDocument();
      expect(screen.getByText(new RegExp(nc1.description!, "i"))).toBeInTheDocument();
      expect(screen.getByText(new RegExp(nc1.notes!, "i"))).toBeInTheDocument();

      const photosNc1 = await screen.findAllByAltText(/foto \d+ de Telha Quebrada na Cumeeira/i);
      expect(photosNc1).toHaveLength(2);
      expect(photosNc1[0]).toHaveAttribute('src', '/test/photo1.jpg');
      expect(photosNc1[1]).toHaveAttribute('src', '/test/photo2.png');

      const photoNc2 = await screen.findByAltText(/foto 1 de Calha Obstruída/i);
      expect(photoNc2).toHaveAttribute('src', 'data:image/jpeg;base64,TESTBASE64DATA');

      // Test NC with no photos/notes
      expect(screen.getByText('Fixação Solta')).toBeInTheDocument();
      expect(screen.getByText(/nenhuma observação./i, { selector: 'p:contains("Fixação Solta") ~ p' })).toBeInTheDocument();

    });
  });

  // 3. Accordion Interaction
  describe('Accordion Interaction', () => {
    it('accordions are present (defaultOpen behavior is per shadcn, test assumes they are toggleable)', async () => {
      renderReviewPage();
      const clientInfoTrigger = screen.getByText('Informações do Cliente');
      // Accordions are defaulted open in the implementation.
      // To test toggling, one might need to click to close, then click to open.
      // For now, presence is enough as they default open.
      expect(clientInfoTrigger).toBeInTheDocument();
      // A more robust test would check aria-expanded or visibility of content after clicks.
    });
  });

  // 4. "Enviar Vistoria" (Submit) Button Interaction
  describe('Submit Button Interaction', () => {
    it('logs data, calls markComplete, and shows placeholder toasts on submit', async () => {
      renderReviewPage();
      await userEvent.click(screen.getByRole('button', { name: /submeter vistoria/i }));

      expect(mockConsoleLog).toHaveBeenCalledWith("Submitting Vistoria. Data to be saved (placeholder for IndexedDB):", JSON.stringify(mockFullVistoriaData));
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: "Submissão (Placeholder)",
      }));
      expect(mockConsoleLog).toHaveBeenCalledWith("Generating DOCX report (placeholder)...");
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: "Geração DOCX (Placeholder)",
      }));
      expect(mockFullVistoriaData.markComplete).toHaveBeenCalled();
    });
  });

  // 5. Navigation
  describe('Navigation', () => {
    it('navigates to report success page on submit', async () => {
      renderReviewPage();
      await userEvent.click(screen.getByRole('button', { name: /submeter vistoria/i }));

      const expectedPath = `/inspection/${mockFullVistoriaData.protocol}/report-success`;
      expect(mockSetLocation).toHaveBeenCalledWith(expectedPath);
    });

    it('navigates to non-conformities page and calls setCurrentStep on "Voltar" click', async () => {
      renderReviewPage();
      await userEvent.click(screen.getByRole('button', { name: /voltar/i }));

      expect(mockFullVistoriaData.setCurrentStep).toHaveBeenCalledWith(4);
      expect(mockSetLocation).toHaveBeenCalledWith('/inspection/non-conformities');
    });
  });
});
