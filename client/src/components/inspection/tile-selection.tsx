import { useState } from 'react';
import { Plus, Trash2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { 
  TileConfiguration, 
  TILE_THICKNESS_OPTIONS, 
  TILE_LENGTH_OPTIONS, 
  TILE_WIDTH_OPTIONS 
} from '@/types/inspection';
import { calculateTileTotals, formatArea, validateTileConfiguration } from '@/lib/calculations';
import { useToast } from '@/hooks/use-toast';

interface TileSelectionProps {
  tiles: TileConfiguration[];
  onAddTile: () => void;
  onUpdateTile: (index: number, updates: Partial<TileConfiguration>) => void;
  onRemoveTile: (index: number) => void;
  onSaveDraft: () => void;
  onNext: () => void;
  onBack: () => void;
}

export function TileSelection({ 
  tiles, 
  onAddTile, 
  onUpdateTile, 
  onRemoveTile, 
  onSaveDraft,
  onNext, 
  onBack 
}: TileSelectionProps) {
  const { toast } = useToast();
  const totals = calculateTileTotals(tiles);

  const handleTileUpdate = (index: number, field: keyof TileConfiguration, value: any) => {
    const currentTile = tiles[index];
    const updates = { [field]: value };

    // Validate configuration
    if (field === 'thickness' || field === 'length' || field === 'width') {
      const newThickness = field === 'thickness' ? value : currentTile.thickness;
      const newLength = field === 'length' ? value : currentTile.length;
      const newWidth = field === 'width' ? value : currentTile.width;
      
      const error = validateTileConfiguration(newThickness, newLength, newWidth);
      if (error) {
        toast({
          title: "Configuração inválida",
          description: error,
          variant: "destructive"
        });
        return;
      }
    }

    // Warn about unusual quantities
    if (field === 'quantity' && value > 1000) {
      toast({
        title: "Quantidade elevada",
        description: "Verifique se a quantidade está correta.",
      });
    }

    onUpdateTile(index, updates);
  };

  const getAvailableLengths = (thickness: string) => {
    return TILE_LENGTH_OPTIONS[thickness as keyof typeof TILE_LENGTH_OPTIONS] || [];
  };

  const isFormValid = () => {
    return tiles.length > 0 && tiles.every(tile => 
      tile.thickness && tile.length && tile.width && tile.quantity > 0
    );
  };

  return (
    <div className="p-4 pb-32">
      {/* Total Area Display */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-700">
            {formatArea(totals.totalCorrectedArea * 10000)}
          </div>
          <div className="text-sm text-green-600">Área Total Corrigida</div>
          <div className="text-xs text-green-500 mt-1">Incluindo 12% de sobreposição</div>
        </div>
      </div>

      {/* Tile Cards */}
      <div className="space-y-4 mb-6">
        {tiles.map((tile, index) => (
          <Card key={index} className="border border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-medium text-gray-900">Telha {index + 1}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveTile(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-2">Espessura</Label>
                  <Select 
                    value={tile.thickness} 
                    onValueChange={(value) => handleTileUpdate(index, 'thickness', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TILE_THICKNESS_OPTIONS.map(thickness => (
                        <SelectItem key={thickness} value={thickness}>{thickness}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-2">Comprimento</Label>
                  <Select 
                    value={tile.length} 
                    onValueChange={(value) => handleTileUpdate(index, 'length', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableLengths(tile.thickness).map(length => (
                        <SelectItem key={length} value={length}>{length}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-2">Largura</Label>
                  <Select 
                    value={tile.width} 
                    onValueChange={(value) => handleTileUpdate(index, 'width', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TILE_WIDTH_OPTIONS.map(width => (
                        <SelectItem key={width} value={width}>{width}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-2">Quantidade</Label>
                  <Input
                    type="number"
                    min="1"
                    max="10000"
                    value={tile.quantity}
                    onChange={(e) => handleTileUpdate(index, 'quantity', parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Área bruta:</span>
                  <span className="font-medium">{formatArea(tile.grossArea)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Área corrigida:</span>
                  <span className="font-bold text-blue-600">{formatArea(tile.correctedArea)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Tile Button */}
      {tiles.length < 10 && (
        <Button 
          variant="outline"
          className="w-full mb-6"
          onClick={onAddTile}
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Telha
        </Button>
      )}

      {/* Calculation Summary */}
      {tiles.length > 0 && (
        <Card className="bg-blue-600 text-white mb-6">
          <CardContent className="p-4">
            <h3 className="font-semibold text-lg mb-3">Resumo do Cálculo</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Total de telhas:</span>
                <span>{totals.totalTypes} tipo{totals.totalTypes !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex justify-between">
                <span>Quantidade total:</span>
                <span>{totals.totalQuantity} unidades</span>
              </div>
              <div className="flex justify-between">
                <span>Área bruta total:</span>
                <span>{formatArea(totals.totalGrossArea * 10000)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t border-blue-400">
                <span>Área corrigida total:</span>
                <span>{formatArea(totals.totalCorrectedArea * 10000)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fixed Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 max-w-md mx-auto">
        <div className="flex items-center justify-between mb-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onSaveDraft}
            className="text-blue-600"
          >
            <Save className="w-4 h-4 mr-1" />
            Salvar Rascunho
          </Button>
        </div>
        <div className="flex space-x-4">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={onBack}
          >
            Voltar
          </Button>
          <Button 
            className="flex-1 bg-blue-600 hover:bg-blue-700"
            onClick={onNext}
            disabled={!isFormValid()}
          >
            Próximo
          </Button>
        </div>
      </div>
    </div>
  );
}
