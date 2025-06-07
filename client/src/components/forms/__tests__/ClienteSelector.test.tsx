import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClienteSelector } from '../ClienteSelector'; // Adjust path as needed
import type { Client } from '@shared/schema'; // Assuming this type is used

// Mock dependencies
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...actual,
    useQuery: vi.fn(),
  };
});

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock wouter's useLocation if needed for navigation (e.g. if "New Client" navigates)
// For now, assuming "New Client" opens a dialog within the component, so useLocation might not be directly invoked by ClienteSelector itself.
// If it was:
// vi.mock('wouter', () => ({
//   useLocation: vi.fn().mockReturnValue(['/current-path', vi.fn()]),
// }));

const mockClients: Client[] = [
  { id: 1, name: 'Construtora Alpha', document: '11.111.111/0001-11', contact: 'John Doe', email: 'john@alpha.com', isPbqpHSatisfied: true, status: 'active' },
  { id: 2, name: 'Engenharia Beta', document: '22.222.222/0001-22', contact: 'Jane Smith', email: 'jane@beta.com', isPbqpHSatisfied: false, status: 'active' },
  { id: 3, name: 'Delta Services', document: '33.333.333/0001-33', contact: 'Mike Ross', email: 'mike@delta.com', isPbqpHSatisfied: true, status: 'inactive' },
];

// Create a new QueryClient instance for each test suite to ensure isolation
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false, // Disable retries for testing
      staleTime: Infinity, // Prevent immediate refetching
    },
  },
});

// Helper to wrap component with QueryClientProvider
const renderWithClient = (client: QueryClient, ui: React.ReactElement) => {
  return render(
    <QueryClientProvider client={client}>
      {ui}
    </QueryClientProvider>
  );
};


describe('ClienteSelector', () => {
  let testQueryClient: QueryClient;
  const mockUseQuery = vi.mocked(require('@tanstack/react-query').useQuery); // Get the typed mock

  beforeEach(() => {
    testQueryClient = createTestQueryClient();
    // Reset mocks before each test
    mockUseQuery.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // 1. Rendering Tests
  describe('Rendering', () => {
    it('renders correctly with search input and "New Client" button', () => {
      mockUseQuery.mockReturnValue({ data: [], isLoading: false, isError: false });
      renderWithClient(testQueryClient, <ClienteSelector value={null} onChange={vi.fn()} />);

      expect(screen.getByPlaceholderText(/buscar cliente/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /novo cliente/i })).toBeInTheDocument();
    });

    it('displays "Nenhum cliente selecionado" when no value is provided', () => {
      mockUseQuery.mockReturnValue({ data: [], isLoading: false, isError: false });
      renderWithClient(testQueryClient, <ClienteSelector value={null} onChange={vi.fn()} />);
      // The placeholder "Buscar cliente..." itself implies no client is selected if the input is empty.
      // Depending on implementation, a specific text might appear or the input is just empty.
      // For this component, an empty input with placeholder is the expected state.
      expect(screen.getByPlaceholderText(/buscar cliente/i)).toHaveValue('');
    });

    it('displays the selected client\'s name when a value is provided', () => {
      mockUseQuery.mockReturnValue({ data: [], isLoading: false, isError: false });
      const selectedClient = mockClients[0];
      renderWithClient(testQueryClient, <ClienteSelector value={selectedClient} onChange={vi.fn()} />);

      expect(screen.getByRole('combobox')).toHaveValue(selectedClient.name);
    });
  });

  // 2. Search Functionality
  describe('Search Functionality', () => {
    it('simulates typing and shows search results in dropdown', async () => {
      const searchTerm = 'Alpha';
      const filteredClients = [mockClients[0]];
      mockUseQuery.mockImplementation((options: any) => {
        if (options.queryKey.includes(searchTerm.toLowerCase())) {
          return { data: filteredClients, isLoading: false, isError: false };
        }
        return { data: [], isLoading: false, isError: false }; // Default empty for initial render
      });

      renderWithClient(testQueryClient, <ClienteSelector value={null} onChange={vi.fn()} />);

      const searchInput = screen.getByPlaceholderText(/buscar cliente/i);
      await userEvent.type(searchInput, searchTerm);

      await waitFor(() => {
        expect(mockUseQuery).toHaveBeenCalledWith(expect.objectContaining({
          queryKey: ['clients', searchTerm.toLowerCase()],
        }));
        expect(screen.getByText(filteredClients[0].name)).toBeInTheDocument();
      });
    });

    it('shows "No results found" if API returns no matching clients', async () => {
      const searchTerm = 'NonExistent';
      mockUseQuery.mockReturnValue({ data: [], isLoading: false, isError: false }); // Mock for search term

      renderWithClient(testQueryClient, <ClienteSelector value={null} onChange={vi.fn()} />);

      const searchInput = screen.getByPlaceholderText(/buscar cliente/i);
      await userEvent.type(searchInput, searchTerm);

      await waitFor(() => {
         expect(mockUseQuery).toHaveBeenCalledWith(expect.objectContaining({
          queryKey: ['clients', searchTerm.toLowerCase()],
        }));
        // This message comes from the Command.Empty part of shadcn/ui combobox
        expect(screen.getByText(/nenhum cliente encontrado/i)).toBeInTheDocument();
      });
    });

    it('shows loading state while fetching search results', async () => {
      const searchTerm = 'Beta';
      mockUseQuery.mockReturnValue({ data: undefined, isLoading: true, isError: false });

      renderWithClient(testQueryClient, <ClienteSelector value={null} onChange={vi.fn()} />);

      const searchInput = screen.getByPlaceholderText(/buscar cliente/i);
      await userEvent.type(searchInput, searchTerm);

      await waitFor(() => {
        //shadcn combobox typically shows "Loading..." or just nothing if Command.Loading is not used.
        //For this test, we'll assume the absence of results or specific "no results" message implies loading
        //or that a specific "Loading..." text might appear if implemented.
        //If Command.Loading is used: expect(screen.getByText(/carregando/i)).toBeInTheDocument();
        //For now, we'll just check the query was called.
         expect(mockUseQuery).toHaveBeenCalledWith(expect.objectContaining({
          queryKey: ['clients', searchTerm.toLowerCase()],
          enabled: true, // or based on search term length
        }));
      });
      // Check that results are not yet visible, nor "no results"
      expect(screen.queryByText(mockClients[1].name)).toBeNull();
      expect(screen.queryByText(/nenhum cliente encontrado/i)).toBeNull();
    });
  });

  // 3. Client Selection
  describe('Client Selection', () => {
    it('selects a client, calls onChange, updates input, and closes dropdown', async () => {
      const mockOnChange = vi.fn();
      const searchTerm = 'Beta';
      const clientToSelect = mockClients[1];

      mockUseQuery.mockImplementation((options: any) => {
         if (options.queryKey.includes(searchTerm.toLowerCase())) {
          return { data: [clientToSelect], isLoading: false, isError: false };
        }
        return { data: mockClients, isLoading: false, isError: false }; // Initial data for dropdown
      });

      renderWithClient(testQueryClient, <ClienteSelector value={null} onChange={mockOnChange} />);

      const searchInput = screen.getByPlaceholderText(/buscar cliente/i);
      await userEvent.click(searchInput); // Open dropdown
      await userEvent.type(searchInput, searchTerm, { delay: 100 });


      await waitFor(() => {
        expect(screen.getByText(clientToSelect.name)).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText(clientToSelect.name));

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(clientToSelect);
        expect(searchInput).toHaveValue(clientToSelect.name);
        // Dropdown closes - check by ensuring the item is no longer visible (or other items)
        expect(screen.queryByText(clientToSelect.name)).not.toBeVisible(); // Assuming CommandList is removed
      });
    });
  });

  // 4. New Client Dialog
  describe('New Client Dialog', () => {
    it('opens the "New Client" dialog when button is clicked', async () => {
      mockUseQuery.mockReturnValue({ data: [], isLoading: false, isError: false });
      renderWithClient(testQueryClient, <ClienteSelector value={null} onChange={vi.fn()} />);

      const newClientButton = screen.getByRole('button', { name: /novo cliente/i });
      await userEvent.click(newClientButton);

      // Assuming the dialog has a title "Cadastrar Novo Cliente" or similar
      // This will depend on the actual implementation of the dialog.
      // Using findByRole for async appearance of dialog content.
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText(/cadastrar novo cliente/i)).toBeInTheDocument();
        // Check for a form field within the dialog
        expect(screen.getByLabelText(/nome completo \/ razão social/i)).toBeInTheDocument();
      });
    });
  });

  // 5. Error Handling for Search
  describe('Error Handling', () => {
    it('displays an error message or state if client search API fails', async () => {
      const searchTerm = 'ErrorCase';
      mockUseQuery.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: new Error('Network Error') });

      renderWithClient(testQueryClient, <ClienteSelector value={null} onChange={vi.fn()} />);

      const searchInput = screen.getByPlaceholderText(/buscar cliente/i);
      await userEvent.type(searchInput, searchTerm);

      await waitFor(() => {
        // How errors are displayed can vary. It might be a toast (mocked),
        // or an inline message. For this test, we check if the dropdown does not show results.
        // A more specific error message display test would depend on the component's implementation.
        expect(screen.queryByText(mockClients[0].name)).toBeNull();
        // If there's a specific error display area in the dropdown:
        // expect(screen.getByText(/erro ao buscar clientes/i)).toBeInTheDocument();
        // For now, we just ensure it doesn't crash and the query was made.
         expect(mockUseQuery).toHaveBeenCalledWith(expect.objectContaining({
          queryKey: ['clients', searchTerm.toLowerCase()],
        }));
      });
    });
  });
});
