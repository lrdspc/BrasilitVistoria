import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ProgressBar";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import { TileCalculator } from "@/components/TileCalculator";
import { useToast } from "@/hooks/use-toast";
import { useInspection } from "@/hooks/useInspection";
import type { Tile } from "@shared/schema";

export default function TileSelection() {
  const [, setLocation] = useLocation();
  const { id } = useParams();
  const inspectionId = id ? parseInt(id) : undefined;
  const { data, calculateTotalArea, setCurrentData } = useInspection(inspectionId);
  const { toast } = useToast();
  
  const [tiles, setTiles] = useState<Tile[]>([]);

  // Load tiles from current data
  useEffect(() => {
    if (data.tiles.length > 0) {
      setTiles(data.tiles);
    }
  }, [data.tiles]);

  const handleSaveDraft = async () => {
    try {
      // Update current data with tiles
      setCurrentData(prev => ({ ...prev, tiles }));
      
      toast({
        title: "Rascunho salvo",
        description: "Configuração de telhas salva",
      });
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  const handleNext = () => {
    if (tiles.length === 0) {
      toast({
        title: "Adicione pelo menos uma telha",
        description: "É necessário configurar ao menos um tipo de telha",
        variant: "destructive",
      });
      return;
    }

    // Validate tiles
    const hasInvalidTile = tiles.some(tile => 
      tile.quantity <= 0 || 
      tile.length <= 0 || 
      tile.width <= 0
    );

    if (hasInvalidTile) {
      toast({
        title: "Configuração inválida",
        description: "Verifique as dimensões e quantidades das telhas",
        variant: "destructive",
      });
      return;
    }

    // Update current data with tiles and total area
    const totalArea = tiles.reduce((sum, tile) => sum + tile.correctedArea, 0);
    setCurrentData(prev => ({ 
      ...prev, 
      tiles,
      inspection: prev.inspection ? { ...prev.inspection, totalArea } : undefined
    }));

    // Navigate to next step
    if (inspectionId) {
      setLocation(`/inspection/${inspectionId}/non-conformities`);
    } else {
      setLocation("/inspection/non-conformities");
    }
  };

  const handleTilesChange = (newTiles: Tile[]) => {
    setTiles(newTiles);
    
    // Update current data
    const totalArea = newTiles.reduce((sum, tile) => sum + tile.correctedArea, 0);
    setCurrentData(prev => ({ 
      ...prev, 
      tiles: newTiles,
      inspection: prev.inspection ? { ...prev.inspection, totalArea } : undefined
    }));
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
            onClick={() => {
              if (inspectionId) {
                setLocation(`/inspection/${inspectionId}/basic-info`);
              } else {
                setLocation("/inspection/basic-info");
              }
            }}
            className="mr-4"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-gray-900">Seleção de Telhas</h1>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSaveDraft}
              className="text-blue-600 font-medium mt-1 p-0 h-auto"
            >
              <Save className="w-4 h-4 mr-1" />
              Salvar Rascunho
            </Button>
          </div>
        </div>
        
        <ProgressBar 
          currentStep={3} 
          totalSteps={5} 
          stepLabels={["Cliente", "Informações", "Telhas", "Não Conformidades", "Revisão"]} 
        />
        <p className="text-sm text-gray-600 text-center mt-2">Etapa 3 de 5: Telhas</p>
      </header>

      <div className="p-4 pb-24">
        <TileCalculator tiles={tiles} onTilesChange={handleTilesChange} />
      </div>

      {/* Fixed Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 max-w-md mx-auto">
        <div className="flex space-x-4">
          <Button 
            variant="outline" 
            onClick={() => {
              if (inspectionId) {
                setLocation(`/inspection/${inspectionId}/basic-info`);
              } else {
                setLocation("/inspection/basic-info");
              }
            }}
            className="flex-1 h-12"
          >
            Voltar
          </Button>
          <Button 
            onClick={handleNext}
            className="flex-1 h-12 bg-blue-600 hover:bg-blue-700"
            disabled={tiles.length === 0}
          >
            Próximo
          </Button>
        </div>
      </div>
    </div>
  );
}
