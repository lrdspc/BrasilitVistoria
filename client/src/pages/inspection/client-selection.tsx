import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Plus, Search, Forward } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ProgressBar } from "@/components/ProgressBar";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import { useInspectionForm } from "@/hooks/use-inspection-form";
import { insertClientSchema, type Client } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export default function ClientSelection() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [newClientData, setNewClientData] = useState({
    name: "",
    cnpjCpf: "",
    contact: "",
    email: "",
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { updateFormData, nextStep } = useInspectionForm();

  const { data: clients = [] } = useQuery({
    queryKey: ['/api/clients', { search: searchQuery }],
    enabled: searchQuery.length > 2,
  });

  const createClientMutation = useMutation({
    mutationFn: async (clientData: typeof newClientData) => {
      const response = await apiRequest('POST', '/api/clients', clientData);
      return response.json();
    },
    onSuccess: (newClient: Client) => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      updateFormData({ 
        clientId: newClient.id, 
        clientName: newClient.name 
      });
      setShowNewClientModal(false);
      setNewClientData({ name: "", cnpjCpf: "", contact: "", email: "" });
      toast({
        title: "Cliente criado",
        description: "Cliente adicionado com sucesso",
      });
      nextStep();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar cliente",
        variant: "destructive",
      });
    },
  });

  const handleClientSelect = (client: Client) => {
    updateFormData({ 
      clientId: client.id, 
      clientName: client.name 
    });
    nextStep();
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      insertClientSchema.parse(newClientData);
      createClientMutation.mutate(newClientData);
    } catch (error: any) {
      toast({
        title: "Dados inválidos",
        description: "Verifique os campos obrigatórios",
        variant: "destructive",
      });
    }
  };

  const handleSkipClient = () => {
    updateFormData({ clientId: undefined, clientName: undefined });
    nextStep();
  };

  const formatDocument = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    
    if (numbers.length <= 11) {
      // CPF format: XXX.XXX.XXX-XX
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else {
      // CNPJ format: XX.XXX.XXX/0001-XX
      return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
  };

  const stepLabels = ["Cliente", "Informações Básicas", "Telhas", "Não Conformidades", "Revisão"];

  return (
    <div className="min-h-screen bg-gray-50">
      <ConnectionStatus />
      
      {/* Header with Progress */}
      <header className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center mb-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setLocation("/dashboard")}
              className="mr-4"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-semibold text-gray-900">Nova Vistoria</h1>
          </div>
          <ProgressBar 
            currentStep={1} 
            totalSteps={5} 
            stepLabels={stepLabels}
          />
        </div>
      </header>

      <div className="max-w-md mx-auto p-4">
        <div className="space-y-6">
          {/* Client Search */}
          <div>
            <Label htmlFor="client-search" className="block text-sm font-medium text-gray-700 mb-2">
              Selecionar Cliente <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="client-search"
                placeholder="Digite o nome do cliente"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12 pr-10"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
            
            {/* Suggestions Dropdown */}
            {searchQuery.length > 2 && clients.length > 0 && (
              <Card className="mt-2 shadow-lg">
                <CardContent className="p-0">
                  {clients.slice(0, 5).map((client: Client) => (
                    <div
                      key={client.id}
                      onClick={() => handleClientSelect(client)}
                      className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                    >
                      <div className="font-medium">{client.name}</div>
                      <div className="text-sm text-gray-500">{client.cnpjCpf}</div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
            
            {searchQuery.length > 2 && clients.length === 0 && (
              <p className="text-sm text-gray-500 mt-2">
                Cliente não encontrado. Crie um novo ou pule.
              </p>
            )}
          </div>

          {/* Add New Client */}
          <Button
            onClick={() => setShowNewClientModal(true)}
            variant="outline"
            className="w-full h-12"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Novo Cliente
          </Button>

          {/* Skip Client Selection */}
          <Button
            onClick={handleSkipClient}
            variant="secondary"
            className="w-full h-12"
          >
            <Forward className="w-4 h-4 mr-2" />
            Pular Seleção de Cliente
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4 mt-8">
          <Button 
            variant="outline" 
            onClick={() => setLocation("/dashboard")}
            className="flex-1 h-12"
          >
            Voltar
          </Button>
          <Button 
            onClick={() => setLocation("/inspection/basic-info")}
            className="flex-1 h-12 bg-brasilit-blue hover:bg-brasilit-dark"
          >
            Próximo
          </Button>
        </div>
      </div>

      {/* New Client Modal */}
      <Dialog open={showNewClientModal} onOpenChange={setShowNewClientModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Novo Cliente</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateClient} className="space-y-4">
            <div>
              <Label htmlFor="name">Nome <span className="text-red-500">*</span></Label>
              <Input
                id="name"
                value={newClientData.name}
                onChange={(e) => setNewClientData({ ...newClientData, name: e.target.value })}
                placeholder="Nome da empresa"
                required
                className="h-12"
              />
            </div>
            
            <div>
              <Label htmlFor="cnpjCpf">CNPJ/CPF <span className="text-red-500">*</span></Label>
              <Input
                id="cnpjCpf"
                value={newClientData.cnpjCpf}
                onChange={(e) => setNewClientData({ 
                  ...newClientData, 
                  cnpjCpf: formatDocument(e.target.value) 
                })}
                placeholder="XX.XXX.XXX/0001-XX"
                required
                className="h-12"
              />
            </div>
            
            <div>
              <Label htmlFor="contact">Contato</Label>
              <Input
                id="contact"
                value={newClientData.contact}
                onChange={(e) => setNewClientData({ ...newClientData, contact: e.target.value })}
                placeholder="(XX) XXXXX-XXXX"
                className="h-12"
              />
            </div>
            
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newClientData.email}
                onChange={(e) => setNewClientData({ ...newClientData, email: e.target.value })}
                placeholder="contato@empresa.com"
                className="h-12"
              />
            </div>
            
            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowNewClientModal(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createClientMutation.isPending}
                className="flex-1 bg-brasilit-blue hover:bg-brasilit-dark"
              >
                {createClientMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
