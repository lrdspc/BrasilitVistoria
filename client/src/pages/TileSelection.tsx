import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import { ProgressBar } from '@/components/ProgressBar';
import { ConnectionStatus } from '@/components/ConnectionStatus';

interface Tile {
  id: string;
  thickness: string;
  length: string;
  width: string;
  quantity: number;
  grossArea: number;
  correctedArea: number;
}

// Tile configuration data
const TILE_CONFIGS = {
  '5mm': ['1.22', '1.53', '1.83', '2.13', '2.44'],
  '6mm': ['1.22', '1.53', '1.83', '2.13', '2.44', '3.05', '3.66'],
  '8mm': ['1.22', '1.53', '1.83', '2.13', '2.44', '3.05', '3.66'],
};

const WIDTH_CONFIGS = {
  standard: ['0.92', '1.10'],
  restricted: ['1.10'], // For 8mm with 3.66m length
};

export default function TileSelection() {
  const [, setLocation] = useLocation();
  const [tiles, setTiles] = useState<Tile[]>([
    {
      id: '1',
      thickness: '6mm',
      length: '2.44',
      width: '1.10',
      quantity: 100,
      grossArea: 268.4,
      correctedArea: 236.19,
    },
  ]);

  const calculateArea = (length: string, width: string, quantity: number) => {
    const lengthNum = parseFloat(length);
    const widthNum = parseFloat(width);
    const grossArea = lengthNum * widthNum * quantity;
    const correctedArea = grossArea * 0.88; // 12% reduction for overlap
    return { grossArea, correctedArea };
  };

  const updateTile = (id: string, field: keyof Tile, value: any) => {
    setTiles(tiles.map(tile => {
      if (tile.id === id) {
        const updatedTile = { ...tile, [field]: value };
        
        // Recalculate areas when relevant fields change
        if (['length', 'width', 'quantity'].includes(field)) {
          const { grossArea, correctedArea } = calculateArea(
            updatedTile.length,
            updatedTile.width,
            updatedTile.quantity
          );
          updatedTile.grossArea = grossArea;
          updatedTile.correctedArea = correctedArea;
        }
        
        return updatedTile;
      }
      return tile;
    }));
  };

  const addTile = () => {
    const newTile: Tile = {
      id: Date.now().toString(),
      thickness: '6mm',
      length: '2.44',
      width: '1.10',
      quantity: 1,
      grossArea: 2.684,
      correctedArea: 2.36,
    };
    setTiles([...tiles, newTile]);
  };

  const removeTile = (id: string) => {
    setTiles(tiles.filter(tile => tile.id !== id));
  };

  const getTotalArea = () => {
    return tiles.reduce((total, tile) => total + tile.correctedArea, 0);
  };

  const getAvailableWidths = (thickness: string, length: string) => {
    // Special case: 8mm with 3.66m only allows 1.10m width
    if (thickness === '8mm' && length === '3.66') {
      return WIDTH_CONFIGS.restricted;
    }
    return WIDTH_CONFIGS.standard;
  };

  const handleContinue = () => {
    // Save tiles to session storage
    sessionStorage.setItem('tiles', JSON.stringify(tiles));
    setLocation('/inspection/non-conformities');
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
              onClick={() => setLocation('/inspection/basic-info')}
              className="mr-4"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-semibold text-gray-900">Seleção de Telhas</h1>
              <Button
                variant="ghost"
                size="sm"
                className="text-brasilit-blue text-sm p-0 h-auto mt-1"
              >
                <Save className="w-3 h-3 mr-1" />
                Salvar Rascunho
              </Button>
            </div>
          </div>
          
          <ProgressBar
            currentStep={3}
            totalSteps={5}
            stepLabels={['Cliente', 'Informações', 'Telhas', 'Não Conformidades', 'Revisão']}
          />
        </div>
      </header>

      <div className="p-4 max-w-md mx-auto pb-32">
        {/* Total Area Display */}
        <Card className="mb-6 bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-700">
                {getTotalArea().toFixed(2)}m²
              </div>
              <div className="text-sm text-green-600">Área Total Corrigida</div>
              <div className="text-xs text-green-500 mt-1">Incluindo 12% de sobreposição</div>
            </div>
          </CardContent>
        </Card>

        {/* Tile Cards */}
        <div className="space-y-4 mb-6">
          {tiles.map((tile, index) => (
            <Card key={tile.id} className="border border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="font-medium text-gray-900">Telha {index + 1}</h3>
                  {tiles.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTile(tile.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <Label>Espessura</Label>
                    <Select 
                      value={tile.thickness} 
                      onValueChange={(value) => updateTile(tile.id, 'thickness', value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5mm">5mm</SelectItem>
                        <SelectItem value="6mm">6mm</SelectItem>
                        <SelectItem value="8mm">8mm</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Comprimento</Label>
                    <Select 
                      value={tile.length} 
                      onValueChange={(value) => updateTile(tile.id, 'length', value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TILE_CONFIGS[tile.thickness as keyof typeof TILE_CONFIGS].map(length => (
                          <SelectItem key={length} value={length}>
                            {length}m
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <Label>Largura</Label>
                    <Select 
                      value={tile.width} 
                      onValueChange={(value) => updateTile(tile.id, 'width', value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableWidths(tile.thickness, tile.length).map(width => (
                          <SelectItem key={width} value={width}>
                            {width}m
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Quantidade</Label>
                    <Input
                      type="number"
                      value={tile.quantity}
                      onChange={(e) => updateTile(tile.id, 'quantity', parseInt(e.target.value) || 1)}
                      min="1"
                      max="10000"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Área bruta:</span>
                    <span className="font-medium">{tile.grossArea.toFixed(2)}m²</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Área corrigida:</span>
                    <span className="font-bold text-brasilit-blue">{tile.correctedArea.toFixed(2)}m²</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Add Tile Button */}
        {tiles.length < 10 && (
          <Button
            onClick={addTile}
            variant="outline"
            className="w-full h-12 border-gray-300 mb-6"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Telha
          </Button>
        )}

        {/* Calculation Summary */}
        <Card className="bg-brasilit-blue text-white">
          <CardContent className="p-4">
            <h3 className="font-semibold text-lg mb-3">Resumo do Cálculo</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Total de telhas:</span>
                <span>{tiles.length} {tiles.length === 1 ? 'tipo' : 'tipos'}</span>
              </div>
              <div className="flex justify-between">
                <span>Quantidade total:</span>
                <span>{tiles.reduce((sum, tile) => sum + tile.quantity, 0)} unidades</span>
              </div>
              <div className="flex justify-between">
                <span>Área bruta total:</span>
                <span>{tiles.reduce((sum, tile) => sum + tile.grossArea, 0).toFixed(2)}m²</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t border-blue-400">
                <span>Área corrigida total:</span>
                <span>{getTotalArea().toFixed(2)}m²</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fixed Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 max-w-md mx-auto">
        <div className="flex space-x-4">
          <Button
            onClick={() => setLocation('/inspection/basic-info')}
            variant="secondary"
            className="flex-1 h-12"
          >
            Voltar
          </Button>
          <Button
            onClick={handleContinue}
            disabled={tiles.length === 0}
            className="flex-1 bg-brasilit-blue hover:bg-brasilit-dark text-white h-12"
          >
            Próximo
          </Button>
        </div>
      </div>
    </div>
  );
}
