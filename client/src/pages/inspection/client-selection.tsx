import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Plus, Search, Forward } from "lucide-react";
import { ProgressBar } from "@/components/layout/progress-bar";
import { ClientForm } from "@/components/forms/client-form";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function ClientSelection() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [showClientForm, setShowClientForm] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const { toast } = useToast();

  const { data: searchResults = [], isLoading } = useQuery({
    queryKey: ["/api/clients/search", searchQuery],
    enabled: searchQuery.length > 2,
    queryFn: () => [
      {
        id: 1,
        name: "Construtora XYZ",
        document: "12.345.678/0001-90",
      },
      {
        id: 2,
        name: "Incorporadora ABC",
        document: "98.765.432/0001-10",
      },
    ],
  });

  const handleClientSelect = (client: any) => {
    setSelectedClient(client);
    toast({
      title: "Cliente selecionado",
      description: `${client.name} foi selecionado para a vistoria`,
    });
  };

  const handleNext = () => {
    if (selectedClient) {
      // Store selected client in localStorage for persistence
      localStorage.setItem("selectedClient", JSON.stringify(selectedClient));
    }
    setLocation("/inspection/basic-info");
  };

  const handleSkip = () => {
    localStorage.removeItem("selectedClient");
    setLocation("/inspection/basic-info");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Progress */}
      <header className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/dashboard")}
            className="mr-4"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-semibold text-gray-900">Nova Vistoria</h1>
        </div>
        
        <ProgressBar currentStep={1} totalSteps={5} stepLabel="Cliente" />
      </header>

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
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input pr-10"
            />
            <Search className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
          </div>
          
          {/* Search Results */}
          {searchQuery.length > 2 && searchResults.length > 0 && (
            <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-w-sm">
              {searchResults.map((client) => (
                <div
                  key={client.id}
                  onClick={() => handleClientSelect(client)}
                  className={`p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 ${
                    selectedClient?.id === client.id ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="font-medium">{client.name}</div>
                  <div className="text-sm text-gray-500">{client.document}</div>
                </div>
              ))}
            </div>
          )}
          
          {searchQuery.length > 2 && searchResults.length === 0 && !isLoading && (
            <div className="mt-2 text-sm text-gray-500">
              Cliente não encontrado. Crie um novo ou pule esta etapa.
            </div>
          )}
        </div>

        {selectedClient && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-1">Cliente Selecionado</h3>
            <p className="text-blue-800">{selectedClient.name}</p>
            <p className="text-sm text-blue-600">{selectedClient.document}</p>
          </div>
        )}

        <div className="mb-6">
          <Button
            onClick={() => setShowClientForm(true)}
            variant="outline"
            className="w-full touch-button"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Novo Cliente
          </Button>
        </div>

        <div className="mb-8">
          <Button
            onClick={handleSkip}
            variant="secondary"
            className="w-full touch-button"
          >
            <Forward className="w-4 h-4 mr-2" />
            Pular Seleção de Cliente
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <Button
            onClick={() => setLocation("/dashboard")}
            variant="outline"
            className="flex-1 touch-button"
          >
            Voltar
          </Button>
          <Button
            onClick={handleNext}
            className="flex-1 touch-button bg-blue-600 hover:bg-blue-700"
          >
            Próximo
          </Button>
        </div>
      </div>

      {/* Client Form Modal */}
      <ClientForm
        open={showClientForm}
        onClose={() => setShowClientForm(false)}
        onClientCreated={(client) => {
          handleClientSelect(client);
          setShowClientForm(false);
        }}
      />
    </div>
  );
}
