import { AppLayout } from "@/components/layouts/AppLayout";
import { TelhaSelector } from "@/components/forms/TelhaSelector";
import { useVistoriaStore } from "@/stores/vistoriaStore";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ProgressBar"; // Already in guide, ensure path is correct
import type { Tile } from "@shared/schema"; // To match TelhaSelector's TileData structure closely
import { useToast } from "@/hooks/use-toast"; // For user feedback

export default function TileSelection() {
  const [, setLocation] = useLocation();
  const {
    tiles,
    setTiles, // Using the new action
    setCurrentStep,
    calculateTotalArea,
    currentStep: storeCurrentStep
  } = useVistoriaStore();
  const { toast } = useToast();

  // The TelhaSelector's TileData is compatible with the store's Tile type if we treat id and inspectionId as optional.
  // The store's Tile type requires id and inspectionId, but for newly added tiles not yet saved to a DB, these might not exist.
  // TelhaSelector's TileData matches the structure needed before DB interaction.
  const handleTilesChange = (newTilesFromSelector: any[]) => { // TelhaSelector uses TileData, which is compatible
    // Ensure newTilesFromSelector conform to what vistoriaStore expects for Tile[]
    // For now, TelhaSelector's TileData is structurally compatible enough.
    // If ids are needed strictly by setTiles, this might need adjustment.
    // Based on vistoriaStore, addTile creates an id, so setTiles should probably handle tiles that might not have ids yet.
    // For simplicity, we assume TelhaSelector's output is fine or `setTiles` is robust.
    setTiles(newTilesFromSelector as Tile[]);
  };

  const handleNext = () => {
    if (tiles.length === 0) {
      toast({
        title: "Nenhuma telha selecionada",
        description: "Adicione pelo menos uma configuração de telha para prosseguir.",
        variant: "destructive",
      });
      return;
    }
    calculateTotalArea(); // Calculates and updates totalArea in the store
    setCurrentStep(4); // Next step is Non-conformities
    setLocation("/inspection/non-conformities");
  };

  const handleBack = () => {
    // Optionally, save current tiles to store if TelhaSelector doesn't do it on every change via onChange
    // Since handleTilesChange calls setTiles, data should be up-to-date in the store.
    setCurrentStep(2); // Previous step is Basic Info
    setLocation("/inspection/basic-info");
  };

  return (
    <AppLayout title="Seleção de Telhas" showSidebar={false}>
      <div className="max-w-4xl mx-auto space-y-6 p-4 md:p-6">
        <ProgressBar 
          currentStep={storeCurrentStep || 3} // Default to 3 if not set
          totalSteps={5} 
          stepLabels={["Cliente", "Informações", "Telhas", "Não Conformidades", "Revisão"]} 
        />

        <TelhaSelector
          tiles={tiles} // Pass tiles from the store
          onChange={handleTilesChange} // Update store with new tiles
          className="mt-4"
        />

        <div className="flex justify-between mt-8">
          <Button variant="outline" onClick={handleBack} className="h-12 px-6">
            Voltar
          </Button>
          <Button onClick={handleNext} className="h-12 px-6 bg-blue-600 hover:bg-blue-700">
            Próximo
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
