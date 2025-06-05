import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Save, Plus } from "lucide-react";
import { ProgressBar } from "@/components/layout/progress-bar";
import { TileCard } from "@/components/forms/tile-card";
import { useToast } from "@/hooks/use-toast";

interface Tile {
  id: string;
  thickness: string;
  length: number;
  width: number;
  quantity: number;
  grossArea: number;
  correctedArea: number;
}

export default function TileSelection() {
  const [, setLocation] = useLocation();
  const [tiles, setTiles] = useState<Tile[]>([]);
  const { toast } = useToast();

  // Load saved data on component mount
  useEffect(() => {
    const savedTiles = localStorage.getItem("tilesData");
    if (savedTiles) {
      setTiles(JSON.parse(savedTiles));
    } else {
      // Add default tile
      addTile();
    }
  }, []);

  // Auto-save on tiles changes
  useEffect(() => {
    if (tiles.length > 0) {
      localStorage.setItem("tilesData", JSON.stringify(tiles));
    }
  }, [tiles]);

  const calculateAreas = (length: number, width: number, quantity: number) => {
    const grossArea = length * width * quantity;
    const correctedArea = grossArea * 0.88; // 12% overlap correction
    return { grossArea, correctedArea };
  };

  const addTile = () => {
    const newTile: Tile = {
      id: `tile-${Date.now()}`,
      thickness: "6mm",
      length: 2.44,
      width: 1.10,
      quantity: 100,
      grossArea: 0,
      correctedArea: 0,
    };
    
    const areas = calculateAreas(newTile.length, newTile.width, newTile.quantity);
    newTile.grossArea = areas.grossArea;
    newTile.correctedArea = areas.correctedArea;
    
    setTiles(prev => [...prev, newTile]);
    toast({
      title: "Telha adicionada",
      description: "Nova telha foi adicionada à lista",
    });
  };

  const updateTile = (id: string, updates: Partial<Tile>) => {
    setTiles(prev => prev.map(tile => {
      if (tile.id === id) {
        const updated = { ...tile, ...updates };
        if ('length' in updates || 'width' in updates || 'quantity' in updates) {
          const areas = calculateAreas(updated.length, updated.width, updated.quantity);
          updated.grossArea = areas.grossArea;
          updated.correctedArea = areas.correctedArea;
        }
        return updated;
      }
      return tile;
    }));
  };

  const removeTile = (id: string) => {
    setTiles(prev => prev.filter(tile => tile.id !== id));
    toast({
      title: "Telha removida",
      description: "Telha foi removida da lista",
    });
  };

  const totalCorrectedArea = tiles.reduce((sum, tile) => sum + tile.correctedArea, 0);
  const totalGrossArea = tiles.reduce((sum, tile) => sum + tile.grossArea, 0);
  const totalQuantity = tiles.reduce((sum, tile) => sum + tile.quantity, 0);

  const handleSaveDraft = () => {
    localStorage.setItem("tilesData", JSON.stringify(tiles));
    toast({
      title: "Rascunho salvo",
      description: "Suas telhas foram salvas localmente",
    });
  };

  const handleNext = () => {
    if (tiles.length === 0) {
      toast({
        title: "Erro de validação",
        description: "Adicione pelo menos uma telha",
        variant: "destructive",
      });
      return;
    }
    
    localStorage.setItem("tilesData", JSON.stringify(tiles));
    setLocation("/inspection/non-conformities");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Progress */}
      <header className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/inspection/basic-info")}
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
              className="text-blue-600 p-0 h-auto"
            >
              <Save className="w-4 h-4 mr-1" />
              Salvar Rascunho
            </Button>
          </div>
        </div>
        
        <ProgressBar currentStep={3} totalSteps={5} stepLabel="Telhas" />
      </header>

      <div className="p-4 pb-32">
        {/* Total Area Display */}
        <Card className="bg-green-50 border-green-200 mb-6">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-700">
                {totalCorrectedArea.toFixed(2)}m²
              </div>
              <div className="text-sm text-green-600">Área Total Corrigida</div>
              <div className="text-xs text-green-500 mt-1">
                Incluindo 12% de sobreposição
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tile Cards */}
        <div className="space-y-4">
          {tiles.map((tile, index) => (
            <TileCard
              key={tile.id}
              tile={tile}
              index={index}
              onUpdate={(updates) => updateTile(tile.id, updates)}
              onRemove={() => removeTile(tile.id)}
            />
          ))}
        </div>

        {/* Add Tile Button */}
        <Button
          onClick={addTile}
          variant="outline"
          className="w-full touch-button mb-6"
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Telha
        </Button>

        {/* Calculation Summary */}
        <Card className="bg-blue-600 text-white">
          <CardContent className="p-4">
            <h3 className="font-semibold text-lg mb-3">Resumo do Cálculo</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Total de telhas:</span>
                <span>{tiles.length} tipo{tiles.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex justify-between">
                <span>Quantidade total:</span>
                <span>{totalQuantity} unidades</span>
              </div>
              <div className="flex justify-between">
                <span>Área bruta total:</span>
                <span>{totalGrossArea.toFixed(2)}m²</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t border-blue-400">
                <span>Área corrigida total:</span>
                <span>{totalCorrectedArea.toFixed(2)}m²</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fixed Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 max-w-md mx-auto">
        <div className="flex space-x-4">
          <Button
            onClick={() => setLocation("/inspection/basic-info")}
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
    </div>
  );
}
