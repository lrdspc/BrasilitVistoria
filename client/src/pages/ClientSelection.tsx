import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Forward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppLayout } from "@/components/layouts/AppLayout";
import { ProgressBar } from "@/components/ProgressBar";
import { ClienteSelector } from "@/components/forms/ClienteSelector";
import { useVistoriaStore } from "@/stores/vistoriaStore";
import type { Client } from "@shared/schema";

export default function ClientSelection() {
  const [, setLocation] = useLocation();
  const { client, setClient, setCurrentStep } = useVistoriaStore();

  const handleNext = () => {
    setCurrentStep(2);
    setLocation("/inspection/basic-info");
  };

  const handleSkipClient = () => {
    setClient(null);
    setCurrentStep(2);
    setLocation("/inspection/basic-info");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ConnectionStatus />
      
      {/* Header with Progress */}
      <header className="bg-white border-b border-gray-200 p-4">
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
          stepLabels={["Cliente", "Informações", "Telhas", "Não Conformidades", "Revisão"]} 
        />
        <p className="text-sm text-gray-600 text-center mt-2">Etapa 1 de 5: Cliente</p>
      </header>

      <div className="p-4 space-y-6">
        {/* Client Search */}
        <div>
          <Label htmlFor="client-search" className="text-sm font-medium text-gray-700 mb-2">
            Selecionar Cliente <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <Input
              id="client-search"
              placeholder="Digite o nome do cliente"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12"
            />
          </div>
          
          {/* Search Results */}
          {searchQuery.length > 2 && (
            <div className="mt-2 space-y-2">
              {isLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              ) : clients.length > 0 ? (
                clients.slice(0, 5).map((client) => (
                  <Card 
                    key={client.id} 
                    className={`cursor-pointer hover:shadow-md transition-shadow ${
                      selectedClient?.id === client.id ? 'ring-2 ring-blue-600' : ''
                    }`}
                    onClick={() => handleClientSelect(client)}
                  >
                    <CardContent className="p-3">
                      <div className="font-medium">{client.name}</div>
                      <div className="text-sm text-gray-500">{formatDocument(client.document)}</div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">
                  Cliente não encontrado. Crie um novo ou pule.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Selected Client Display */}
        {selectedClient && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-green-800">{selectedClient.name}</div>
                  <div className="text-sm text-green-600">{formatDocument(selectedClient.document)}</div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedClient(null)}
                  className="text-green-700 hover:text-green-800"
                >
                  Alterar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={() => setShowNewClientDialog(true)}
            variant="outline"
            className="w-full h-12"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Novo Cliente
          </Button>

          <Button
            onClick={handleSkipClient}
            variant="secondary"
            className="w-full h-12"
          >
            <Forward className="w-4 h-4 mr-2" />
            Pular Seleção de Cliente
          </Button>
        </div>

        {/* Navigation Buttons */}
        <div className="flex space-x-4 pt-8">
          <Button 
            variant="outline" 
            onClick={() => setLocation("/dashboard")}
            className="flex-1 h-12"
          >
            Voltar
          </Button>
          <Button 
            onClick={handleNext}
            className="flex-1 h-12 bg-blue-600 hover:bg-blue-700"
          >
            Próximo
          </Button>
        </div>
      </div>

      {/* New Client Dialog */}
      <Dialog open={showNewClientDialog} onOpenChange={setShowNewClientDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Cliente</DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="Nome da empresa" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="document"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CNPJ/CPF <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="XX.XXX.XXX/0001-XX"
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "");
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="contact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contato</FormLabel>
                    <FormControl>
                      <Input placeholder="(XX) XXXXX-XXXX" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="contato@empresa.com" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex space-x-3 pt-4">
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => setShowNewClientDialog(false)}
                  className="flex-1"
                  disabled={createClientMutation.isPending}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  disabled={createClientMutation.isPending}
                >
                  {createClientMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
