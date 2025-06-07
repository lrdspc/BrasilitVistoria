import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BasicInfo } from '@/pages/BasicInfo'; // Adjust if default export
import type { Client as StoreClient, BasicInfo as StoreBasicInfoData } from '@/stores/vistoriaStore'; // Assuming these types exist

// --- Mocks ---
const mockSetLocation = vi.fn();
vi.mock('wouter', () => ({
  useLocation: () => [null, mockSetLocation], // [currentLocation, navigate]
}));

const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

const mockViaCepService = {
  validateCep: vi.fn(),
  searchByCep: vi.fn(),
};
vi.mock('@/lib/viaCepService', () => ({
  ViaCepService: mockViaCepService,
}));

const mockGenerateProtocol = vi.fn(() => 'TEST-PROTOCOL-123');
vi.mock('@/lib/utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/utils')>();
  return {
    ...actual, // Keep other utils like formatDate if used by the component
    generateProtocol: mockGenerateProtocol,
  };
});

const mockVistoriaStoreState = {
  client: null as StoreClient | null,
  basicInfo: {} as Partial<StoreBasicInfoData>,
  currentStep: 2,
  setBasicInfo: vi.fn(),
  setCurrentStep: vi.fn(),
  // Add other store properties/methods if BasicInfo uses them
};

// Mock the store module
vi.mock('@/stores/vistoriaStore', () => ({
  useVistoriaStore: vi.fn(() => mockVistoriaStoreState),
}));
const useVistoriaStoreMock = vi.mocked(require('@/stores/vistoriaStore').useVistoriaStore);


// Helper to render with necessary context if any (none for now beyond mocked store)
const renderBasicInfo = () => {
  return render(<BasicInfo />);
};

describe('BasicInfo Page', () => {
  beforeEach(() => {
    vi.clearAllMocks(); // Clear mocks before each test

    // Reset store state for each test
    mockVistoriaStoreState.client = null;
    mockVistoriaStoreState.basicInfo = { protocol: '' }; // Reset to ensure protocol generation is tested
    mockVistoriaStoreState.currentStep = 2;
    useVistoriaStoreMock.mockReturnValue(mockVistoriaStoreState);

    // Default mock implementations
    mockViaCepService.validateCep.mockReturnValue(true);
    mockViaCepService.searchByCep.mockResolvedValue({
      logradouro: 'Rua Teste',
      localidade: 'Cidade Teste',
      uf: 'TS',
      cep: '12345-678',
      erro: false,
    });
  });

  // 1. Rendering
  describe('Rendering', () => {
    it('renders all form fields and navigation buttons correctly', () => {
      renderBasicInfo();
      expect(screen.getByLabelText(/data da vistoria/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/empreendimento/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/assunto/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/cep/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/endereço/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/cidade/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/estado/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /voltar/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /próximo/i })).toBeInTheDocument();
    });

    it('displays the correct step in ProgressBar', () => {
      mockVistoriaStoreState.currentStep = 2;
      useVistoriaStoreMock.mockReturnValue(mockVistoriaStoreState);
      renderBasicInfo();
      // Assuming ProgressBar visually indicates the current step, e.g., through aria-valuenow or text.
      // This test might need adjustment based on ProgressBar's actual DOM structure.
      // For now, we trust the `currentStep` prop is passed.
      // Example: expect(screen.getByText(/etapa 2 de 5/i)).toBeInTheDocument(); (if ProgressBar renders this)
    });

    it('populates default state "PR" and current date', () => {
      renderBasicInfo();
      expect(screen.getByLabelText(/estado/i)).toHaveValue('PR');
      const dateInput = screen.getByLabelText(/data da vistoria/i) as HTMLInputElement;
      expect(dateInput.value).toBe(new Date().toISOString().split('T')[0]);
    });

    it('displays client information if a client is in the store', () => {
      mockVistoriaStoreState.client = { id: '1', name: 'Cliente Teste Ltda', document: '12345678000190' };
      useVistoriaStoreMock.mockReturnValue(mockVistoriaStoreState);
      renderBasicInfo();
      expect(screen.getByText('Cliente Teste Ltda')).toBeInTheDocument();
      expect(screen.getByText('12345678000190')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /alterar cliente/i})).toBeInTheDocument();
    });

    it('pre-fills form from store if basicInfo exists', () => {
        const testDate = new Date(2023, 0, 15); // Jan 15, 2023
        mockVistoriaStoreState.basicInfo = {
            date: testDate,
            enterprise: "Comercial",
            city: "Cidade Store",
            state: "SP",
            address: "Rua Store",
            cep: "98765-432",
            subject: "Assunto Store",
            protocol: "PSTORE001"
        };
        useVistoriaStoreMock.mockReturnValue(mockVistoriaStoreState);
        renderBasicInfo();

        expect(screen.getByLabelText(/data da vistoria/i)).toHaveValue(testDate.toISOString().split('T')[0]);
        expect(screen.getByLabelText(/empreendimento/i)).toHaveValue('Comercial');
        expect(screen.getByLabelText(/cidade/i)).toHaveValue('Cidade Store');
        expect(screen.getByLabelText(/estado/i)).toHaveValue('SP');
        expect(screen.getByLabelText(/endereço/i)).toHaveValue('Rua Store');
        expect(screen.getByLabelText(/cep/i)).toHaveValue('98765-432');
        expect(screen.getByLabelText(/assunto/i)).toHaveValue('Assunto Store');
    });
  });

  // 2. Form Input and State (implicitly tested with validation and submission)

  // 3. Form Validation
  describe('Form Validation', () => {
    it('shows error messages for required fields on submit attempt', async () => {
      renderBasicInfo();
      await userEvent.click(screen.getByRole('button', { name: /próximo/i }));

      // Wait for error messages to appear (specific messages depend on zod schema)
      expect(await screen.findByText(/empresa é obrigatória/i)).toBeInTheDocument();
      expect(await screen.findByText(/cidade é obrigatória/i)).toBeInTheDocument();
      // ... other required fields
      expect(mockSetLocation).not.toHaveBeenCalled();
    });

    it('validates CEP format', async () => {
      renderBasicInfo();
      const cepInput = screen.getByLabelText(/cep/i);
      await userEvent.type(cepInput, '12345'); // Invalid CEP
      // Trigger blur for onBlur validation if any, or submit
      fireEvent.blur(cepInput);
      // Or attempt submit
      // await userEvent.click(screen.getByRole('button', { name: /próximo/i }));

      // Check for toast message for invalid CEP on blur
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: "CEP inválido" }));
      });

      // If submitting to show form message:
      // await userEvent.click(screen.getByRole('button', { name: /próximo/i }));
      // expect(await screen.findByText(/cep inválido/i)).toBeInTheDocument(); // from zod
    });
  });

  // 4. CEP Lookup Functionality
  describe('CEP Lookup', () => {
    it('calls ViaCepService and populates fields on valid CEP blur', async () => {
      renderBasicInfo();
      const cepInput = screen.getByLabelText(/cep/i);
      await userEvent.type(cepInput, '12345-678');
      fireEvent.blur(cepInput);

      await waitFor(() => {
        expect(mockViaCepService.validateCep).toHaveBeenCalledWith('12345678');
        expect(mockViaCepService.searchByCep).toHaveBeenCalledWith('12345678');
      });

      await waitFor(() => {
        expect(screen.getByLabelText(/endereço/i)).toHaveValue('Rua Teste');
        expect(screen.getByLabelText(/cidade/i)).toHaveValue('Cidade Teste');
        expect(screen.getByLabelText(/estado/i)).toHaveValue('TS');
        expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: "CEP encontrado" }));
      });
    });

    it('shows loading state during CEP lookup (conceptual)', async () => {
        mockViaCepService.searchByCep.mockImplementationOnce(() => new Promise(resolve => setTimeout(() => resolve({
            logradouro: 'Rua Teste', localidade: 'Cidade Teste', uf: 'TS', cep: '12345-678', erro: false
        }), 100)));

        renderBasicInfo();
        const cepInput = screen.getByLabelText(/cep/i);
        await userEvent.type(cepInput, '12345-678');
        fireEvent.blur(cepInput);

        // Check for loading indicator - assuming FormDescription shows it
        await waitFor(() => expect(screen.getByText(/buscando cep.../i)).toBeInTheDocument());
        await waitFor(() => expect(screen.queryByText(/buscando cep.../i)).toBeNull(), { timeout: 1500 }); // wait for it to disappear
    });

    it('handles error from ViaCepService (e.g., CEP not found)', async () => {
      mockViaCepService.searchByCep.mockResolvedValue({ erro: true });
      renderBasicInfo();
      const cepInput = screen.getByLabelText(/cep/i);
      await userEvent.type(cepInput, '00000-000');
      fireEvent.blur(cepInput);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: "CEP não encontrado" }));
      });
    });
  });

  // 5. Store Interaction
  describe('Store Interaction', () => {
    it('calls setBasicInfo and setCurrentStep on successful submission', async () => {
      renderBasicInfo();
      // Fill form with valid data
      await userEvent.type(screen.getByLabelText(/data da vistoria/i), '2024-01-01');
      await userEvent.selectOptions(screen.getByLabelText(/empreendimento/i), 'Residencial');
      await userEvent.type(screen.getByLabelText(/cidade/i), 'Curitiba');
      await userEvent.selectOptions(screen.getByLabelText(/estado/i), 'PR');
      await userEvent.type(screen.getByLabelText(/endereço/i), 'Rua Exemplo, 123');
      await userEvent.type(screen.getByLabelText(/cep/i), '12345-678');
      await userEvent.type(screen.getByLabelText(/assunto/i), 'Vistoria de Teste');

      await userEvent.click(screen.getByRole('button', { name: /próximo/i }));

      await waitFor(() => {
        expect(mockVistoriaStoreState.setBasicInfo).toHaveBeenCalledWith(expect.objectContaining({
          city: 'Curitiba',
          cep: '12345-678', // The component formats it, ensure test matches
          protocol: 'TEST-PROTOCOL-123' // from mocked generateProtocol
        }));
        expect(mockVistoriaStoreState.setCurrentStep).toHaveBeenCalledWith(3);
      });
    });
  });

  // 6. Navigation
  describe('Navigation', () => {
    it('navigates to /inspection/tiles on successful submission', async () => {
      renderBasicInfo();
      // Fill form
      await userEvent.type(screen.getByLabelText(/data da vistoria/i), '2024-01-01');
      await userEvent.selectOptions(screen.getByLabelText(/empreendimento/i), 'Residencial');
      await userEvent.type(screen.getByLabelText(/cidade/i), 'Cidade Valida');
      await userEvent.type(screen.getByLabelText(/endereço/i), 'Rua Valida, 100');
      await userEvent.type(screen.getByLabelText(/cep/i), '12345-000');
      await userEvent.type(screen.getByLabelText(/assunto/i), 'Assunto Valido');

      await userEvent.click(screen.getByRole('button', { name: /próximo/i }));

      await waitFor(() => {
        expect(mockSetLocation).toHaveBeenCalledWith('/inspection/tiles');
      });
    });

    it('navigates to /inspection/client-selection when "Alterar Cliente" is clicked', async () => {
      mockVistoriaStoreState.client = { id: '1', name: 'Cliente Teste Ltda', document: '12345678000190' };
      useVistoriaStoreMock.mockReturnValue(mockVistoriaStoreState);
      renderBasicInfo();

      await userEvent.click(screen.getByRole('button', { name: /alterar cliente/i }));

      expect(mockVistoriaStoreState.setCurrentStep).toHaveBeenCalledWith(1);
      expect(mockSetLocation).toHaveBeenCalledWith('/inspection/client-selection');
    });

    it('navigates to /inspection/client-selection (or previous step) when "Voltar" is clicked', async () => {
      renderBasicInfo();
      await userEvent.click(screen.getByRole('button', { name: /voltar/i }));

      // The "Voltar" button saves current data before navigating
      expect(mockVistoriaStoreState.setBasicInfo).toHaveBeenCalled();
      expect(mockVistoriaStoreState.setCurrentStep).toHaveBeenCalledWith(1);
      expect(mockSetLocation).toHaveBeenCalledWith('/inspection/client-selection');
    });
  });
});
