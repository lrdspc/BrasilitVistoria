import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Search, Plus, Forward } from 'lucide-react';
import { ProgressBar } from '@/components/ProgressBar';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import type { Client } from '@shared/schema';

interface ClientSelectionProps {
  onBack: () => void;
  onNext: (clientId?: number) => void;
  onSkip: () => void;
}

export function ClientSelection({ onBack, onNext, onSkip }: ClientSelectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [newClient, setNewClient] = useState({
    name: '',
    document: '',
    contact: '',
    email: '',
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: clients = [] } = useQuery({
    queryKey: ['/api/clients/search', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      const response = await fetch(`/api/clients/search?q=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) throw new Error('Failed to search clients');
      return response.json();
    },
    enabled: searchQuery.length > 0,
  });

  const createClientMutation = useMutation({
    mutationFn: async (clientData: typeof newClient) => {
      const response = await apiRequest('POST', '/api/clients', clientData);
      return response.json();
    },
    onSuccess: (client) => {
      toast({
        title: "Cliente criado",
        description: "Cliente adicionado com sucesso!",
      });
      setSelectedClient(client);
      setShowNewClientForm(false);
      setNewClient({ name: '', document: '', contact: '', email: '' });
      queryClient.invalidateQueries({ queryKey: ['/api/clients/search'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar cliente",
        description: error.message || "Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleSelectClient = (client: Client) => {
    setSelectedClient(client);
    setSearchQuery(client.name);
  };

  const handleCreateClient = () => {
    if (!newClient.name || !newClient.document) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome e CNPJ/CPF são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    createClientMutation.mutate(newClient);
  };

  const handleNext = () => {
    onNext(selectedClient?.id);
  };

  const stepLabels = ['Cliente', 'Informações Básicas', 'Telhas', 'Não Conformidades', 'Revisão'];

  return (
    <div className="min-h-screen bg-white">
      {/* Header with Progress */}
      <header className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center mb-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="mr-4">
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-xl font-semibold text-gray-900">Nova Vistoria</h1>
        </div>
        <ProgressBar currentStep={1} totalSteps={5} stepLabels={stepLabels} />
      </header>

      <div className="p-4">
        <div className="mb-6">
          <Label htmlFor="client-search" className="block text-sm font-medium text-gray-700 mb-2">
            Selecionar Cliente <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              type="text"
              id="client-search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Digite o nome do cliente"
              className="pl-10 py-4 text-base h-auto"
            />
          </div>
          
          {/* Suggestions Dropdown */}
          {clients.length > 0 && (
            <Card className="mt-1 shadow-lg">
              <CardContent className="p-0">
                {clients.slice(0, 5).map((client: Client) => (
                  <div
                    key={client.id}
                    onClick={() => handleSelectClient(client)}
                    className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                  >
                    <div className="font-medium">{client.name}</div>
                    <div className="text-sm text-gray-500">{client.document}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="mb-6">
          <Dialog open={showNewClientForm} onOpenChange={setShowNewClientForm}>
            <DialogTrigger asChild>
              <Button 
                variant="outline"
                className="w-full py-4 h-auto"
              >
                <Plus size={16} className="mr-2" />
                Adicionar Novo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Novo Cliente</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    value={newClient.name}
                    onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                    placeholder="Nome da empresa"
                    className="py-3 h-auto"
                  />
                </div>
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-2">
                    CNPJ/CPF <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    value={newClient.document}
                    onChange={(e) => setNewClient({ ...newClient, document: e.target.value })}
                    placeholder="XX.XXX.XXX/0001-XX"
                    className="py-3 h-auto"
                  />
                </div>
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-2">Contato</Label>
                  <Input
                    type="tel"
                    value={newClient.contact}
                    onChange={(e) => setNewClient({ ...newClient, contact: e.target.value })}
                    placeholder="(XX) XXXXX-XXXX"
                    className="py-3 h-auto"
                  />
                </div>
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-2">Email</Label>
                  <Input
                    type="email"
                    value={newClient.email}
                    onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                    placeholder="contato@empresa.com"
                    className="py-3 h-auto"
                  />
                </div>
                <div className="flex space-x-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowNewClientForm(false)}
                    className="flex-1 py-3 h-auto"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleCreateClient}
                    disabled={createClientMutation.isPending}
                    className="flex-1 bg-brasilit-blue hover:bg-brasilit-dark py-3 h-auto"
                  >
                    {createClientMutation.isPending ? "Salvando..." : "Salvar"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mb-8">
          <Button
            onClick={onSkip}
            variant="secondary"
            className="w-full py-4 h-auto"
          >
            <Forward size={16} className="mr-2" />
            Pular Seleção de Cliente
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4 mt-8">
          <Button
            variant="outline"
            onClick={onBack}
            className="flex-1 py-4 h-auto"
          >
            Voltar
          </Button>
          <Button
            onClick={handleNext}
            className="flex-1 bg-brasilit-blue hover:bg-brasilit-dark py-4 h-auto"
          >
            Próximo
          </Button>
        </div>
      </div>
    </div>
  );
}
