import { useLocation } from "wouter";
import { ArrowLeft, Forward } from "lucide-react"; // Keep Forward for Skip button
import { Button } from "@/components/ui/button";
// Card might still be useful for overall page structure if desired, but not for selected client display here
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppLayout } from "@/components/layouts/AppLayout";
import { ProgressBar } from "@/components/ProgressBar";
import { ClienteSelector } from "@/components/forms/ClienteSelector";
import { useVistoriaStore } from "@/stores/vistoriaStore";
import { useToast } from "@/hooks/use-toast"; // For validation messages
// ConnectionStatus can be kept if it's a global component used in AppLayout or here directly
import { ConnectionStatus } from "@/components/ConnectionStatus";

export default function ClientSelection() {
  const [, setLocation] = useLocation();
  const { client, setClient, setCurrentStep, currentStep } = useVistoriaStore();
  const { toast } = useToast();

  const handleNext = () => {
    if (!client) {
      toast({
        title: "Nenhum cliente selecionado",
        description: "Por favor, selecione um cliente ou pule esta etapa.",
        variant: "destructive",
      });
      return;
    }
    setCurrentStep(2);
    setLocation("/inspection/basic-info");
  };

  const handleSkipClient = () => {
    setClient(null); // Ensure client is explicitly null
    setCurrentStep(2);
    setLocation("/inspection/basic-info");
  };

  const handleBack = () => {
    setLocation("/dashboard");
  };

  return (
    // AppLayout should handle the general page structure including the header.
    // The custom header structure previously in this file will be simplified
    // by passing title to AppLayout.
    <AppLayout
      title="Nova Vistoria - Cliente"
      showSidebar={false} // Assuming PWA flow doesn't need main sidebar
    >
      <ConnectionStatus /> {/* Can be here or in AppLayout globally */}
      
      <div className="flex flex-col h-full">
        <div className="p-4 md:p-6">
          <ProgressBar
            currentStep={currentStep} // Should be 1 from store default or explicitly set
            totalSteps={5}
            stepLabels={["Cliente", "Informações", "Telhas", "Não Conformidades", "Revisão"]}
          />
          <p className="text-sm text-gray-600 text-center mt-2 mb-6">Etapa 1 de 5: Seleção do Cliente</p>

          <div className="max-w-xl mx-auto space-y-6">
            <ClienteSelector
              value={client}
              onChange={setClient}
            />

            {/* "Pular" button can be styled as a secondary action */}
            <Button
              onClick={handleSkipClient}
              variant="outline" // Changed to outline for less emphasis than primary "Next"
              className="w-full h-12"
            >
              <Forward className="w-4 h-4 mr-2" />
              Pular Seleção de Cliente (Vistoria Avulsa)
            </Button>
          </div>
        </div>

        {/* Fixed Bottom Actions - Common pattern for mobile-first forms */}
        <div className="mt-auto sticky bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
          <div className="max-w-xl mx-auto flex space-x-4">
            <Button
              variant="outline"
              onClick={handleBack}
              className="flex-1 h-12"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Cancelar Vistoria
            </Button>
            <Button
              onClick={handleNext}
              disabled={!client} // Disable if no client is selected
              className="flex-1 h-12 bg-blue-600 hover:bg-blue-700"
            >
              Próximo
              <ArrowLeft className="w-4 h-4 ml-2 transform rotate-180" /> {/* Simulates a "Next" arrow */}
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
