import { useState } from 'react';
import { Search, Plus, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Client } from '@shared/schema';

interface ClientSelectionProps {
  selectedClientId?: number;
  selectedClientName?: string;
  onClientSelect: (client: Client | null) => void;
  onSkip: () => void;
  onNext: () => void;
}

export function ClientSelection({ 
  selectedClientId, 
  selectedClientName,
  onClientSelect, 
  onSkip, 
  onNext 
}: ClientSelectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [newClientData, setNewClientData] = useState({
    name: '',
    document: '',
    contact: '',
    email: ''
  });
  const { toast } = useToast();

  const { data: searchResults = [] } = useQuery({
    queryKey: ['/api/clients/search', searchQuery],
    enabled: searchQuery.length > 2
  });

  const handleClientSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleClientSelect = (client: Client) => {
    onClientSelect(client);
    setSearchQuery(client.name);
  };

  const handleCreateClient = async () => {
    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClientData)
      });

      if (!response.ok) throw new Error('Failed to create client');

      const newClient = await response.json();
      onClientSelect(newClient);
      setShowNewClientForm(false);
      setNewClientData({ name: '', document: '', contact: '', email: '' });
      
      toast({
        title: "Cliente criado",
        description: "Novo cliente adicionado com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível criar o cliente.",
        variant: "destructive"
      });
    }
  };

  const isFormValid = () => {
    return selectedClientId || selectedClientName;
  };

  return (
    <div className="p-4">
      <div className="mb-6">
        <Label htmlFor="client-search" className="block text-sm font-medium text-gray-700 mb-2">
          Selecionar Cliente <span className="text-red-500">*</span>
        </Label>
        <div className="relative">
          <Input
            id="client-search"
            placeholder="Digite o nome do cliente"
            value={searchQuery}
            onChange={(e) => handleClientSearch(e.target.value)}
            className="pr-10"
          />
          <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
        </div>
        
        {/* Search Results Dropdown */}
        {searchQuery.length > 2 && searchResults.length > 0 && (
          <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1">
            {searchResults.map((client: Client) => (
              <div
                key={client.id}
                className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                onClick={() => handleClientSelect(client)}
              >
                <div className="font-medium">{client.name}</div>
                <div className="text-sm text-gray-500">{client.document}</div>
              </div>
            ))}
          </div>
        )}
        
        {searchQuery.length > 2 && searchResults.length === 0 && (
          <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 p-3 text-gray-500 text-sm">
            Nenhum cliente encontrado
          </div>
        )}
      </div>

      <div className="mb-6">
        <Dialog open={showNewClientForm} onOpenChange={setShowNewClientForm}>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Cliente</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="client-name">
                  Nome <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="client-name"
                  placeholder="Nome da empresa"
                  value={newClientData.name}
                  onChange={(e) => setNewClientData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="client-document">
                  CNPJ/CPF <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="client-document"
                  placeholder="XX.XXX.XXX/0001-XX"
                  value={newClientData.document}
                  onChange={(e) => setNewClientData(prev => ({ ...prev, document: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="client-contact">Contato</Label>
                <Input
                  id="client-contact"
                  placeholder="(XX) XXXXX-XXXX"
                  value={newClientData.contact}
                  onChange={(e) => setNewClientData(prev => ({ ...prev, contact: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="client-email">Email</Label>
                <Input
                  id="client-email"
                  type="email"
                  placeholder="contato@empresa.com"
                  value={newClientData.email}
                  onChange={(e) => setNewClientData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setShowNewClientForm(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  onClick={handleCreateClient}
                  disabled={!newClientData.name || !newClientData.document}
                >
                  Salvar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-8">
        <Button 
          variant="secondary"
          className="w-full"
          onClick={onSkip}
        >
          <ArrowRight className="w-4 h-4 mr-2" />
          Pular Seleção de Cliente
        </Button>
      </div>

      <div className="flex space-x-4">
        <Button 
          variant="outline" 
          className="flex-1"
          onClick={() => window.history.back()}
        >
          Voltar
        </Button>
        <Button 
          className="flex-1 bg-blue-600 hover:bg-blue-700"
          onClick={onNext}
          disabled={!isFormValid()}
        >
          Próximo
        </Button>
      </div>
    </div>
  );
}
