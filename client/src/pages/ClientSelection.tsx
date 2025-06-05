import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Plus, Search, User, Forward } from 'lucide-react';
import { ProgressBar } from '@/components/ProgressBar';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const clientSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  cnpjCpf: z.string().optional(),
  contact: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
});

type ClientForm = z.infer<typeof clientSchema>;

export default function ClientSelection() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewClientDialog, setShowNewClientDialog] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['/api/clients', { search: searchQuery }],
    enabled: searchQuery.length > 0,
  });

  const form = useForm<ClientForm>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: '',
      cnpjCpf: '',
      contact: '',
      email: '',
    },
  });

  const createClientMutation = useMutation({
    mutationFn: (data: ClientForm) => apiRequest('POST', '/api/clients', data),
    onSuccess: (newClient) => {
      setSelectedClient(newClient);
      setShowNewClientDialog(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      toast({
        title: "Cliente criado",
        description: "Cliente adicionado com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar cliente",
        variant: "destructive",
      });
    },
  });

  const handleClientSelect = (client: any) => {
    setSelectedClient(client);
  };

  const handleContinue = () => {
    // Store selected client in session/localStorage for the inspection flow
    if (selectedClient) {
      sessionStorage.setItem('selectedClient', JSON.stringify(selectedClient));
    }
    setLocation('/inspection/basic-info');
  };

  const handleSkipClient = () => {
    sessionStorage.removeItem('selectedClient');
    setLocation('/inspection/basic-info');
  };

  return (
    <div className="min-h-screen bg-surface">
      <ConnectionStatus />
      
      {/* Header */}
      <header className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/dashboard')}
              className="mr-4"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-semibold text-gray-900">Nova Vistoria</h1>
          </div>
          
          <ProgressBar
            currentStep={1}
            totalSteps={5}
            stepLabels={['Cliente', 'Informações', 'Telhas', 'Não Conformidades', 'Revisão']}
          />
        </div>
      </header>

      <div className="p-4 max-w-md mx-auto pb-32">
        {/* Client Search */}
        <div className="mb-6">
          <Label htmlFor="client-search" className="block text-sm font-medium text-gray-700 mb-2">
            Selecionar Cliente <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Input
              id="client-search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Digite o nome do cliente"
              className="pl-10 h-12"
            />
            <Search className="absolute left-3 top-3 w-6 h-6 text-gray-400" />
          </div>
          
          {/* Search Results */}
          {searchQuery && (
            <div className="mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
              {isLoading ? (
                <div className="p-3 text-center text-gray-500">Buscando...</div>
              ) : clients.length > 0 ? (
                clients.map((client: any) => (
                  <div
                    key={client.id}
                    onClick={() => handleClientSelect(client)}
                    className={`p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                      selectedClient?.id === client.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="font-medium">{client.name}</div>
                    {client.cnpjCpf && (
                      <div className="text-sm text-gray-500">{client.cnpjCpf}</div>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-3 text-center text-gray-500">
                  Nenhum cliente encontrado
                </div>
              )}
            </div>
          )}
        </div>

        {/* Selected Client */}
        {selectedClient && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <User className="w-8 h-8 text-green-600" />
                <div>
                  <h3 className="font-medium text-green-900">{selectedClient.name}</h3>
                  {selectedClient.cnpjCpf && (
                    <p className="text-sm text-green-700">{selectedClient.cnpjCpf}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Add New Client */}
        <div className="mb-6">
          <Button
            onClick={() => setShowNewClientDialog(true)}
            variant="outline"
            className="w-full h-12 border-gray-300"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Novo Cliente
          </Button>
        </div>

        {/* Skip Client */}
        <div className="mb-8">
          <Button
            onClick={handleSkipClient}
            variant="secondary"
            className="w-full h-12"
          >
            <Forward className="w-4 h-4 mr-2" />
            Pular Seleção de Cliente
          </Button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 max-w-md mx-auto">
        <div className="flex space-x-4">
          <Button
            onClick={() => setLocation('/dashboard')}
            variant="secondary"
            className="flex-1 h-12"
          >
            Voltar
          </Button>
          <Button
            onClick={handleContinue}
            className="flex-1 bg-brasilit-blue hover:bg-brasilit-dark text-white h-12"
          >
            Próximo
          </Button>
        </div>
      </div>

      {/* New Client Dialog */}
      <Dialog open={showNewClientDialog} onOpenChange={setShowNewClientDialog}>
        <DialogContent className="max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle>Novo Cliente</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={form.handleSubmit((data) => createClientMutation.mutate(data))} className="space-y-4">
            <div>
              <Label htmlFor="name">Nome <span className="text-red-500">*</span></Label>
              <Input
                {...form.register('name')}
                placeholder="Nome da empresa"
                className="mt-1"
              />
              {form.formState.errors.name && (
                <p className="text-red-500 text-xs mt-1">{form.formState.errors.name.message}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="cnpjCpf">CNPJ/CPF</Label>
              <Input
                {...form.register('cnpjCpf')}
                placeholder="XX.XXX.XXX/0001-XX"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="contact">Contato</Label>
              <Input
                {...form.register('contact')}
                placeholder="(XX) XXXXX-XXXX"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                {...form.register('email')}
                type="email"
                placeholder="contato@empresa.com"
                className="mt-1"
              />
              {form.formState.errors.email && (
                <p className="text-red-500 text-xs mt-1">{form.formState.errors.email.message}</p>
              )}
            </div>
            
            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                onClick={() => setShowNewClientDialog(false)}
                variant="secondary"
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createClientMutation.isPending}
                className="flex-1 bg-brasilit-blue hover:bg-brasilit-dark text-white"
              >
                {createClientMutation.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
