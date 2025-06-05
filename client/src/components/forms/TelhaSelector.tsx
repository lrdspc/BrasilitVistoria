import { useState } from 'react';
import { Plus, Trash2, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { TILE_CONFIG } from '@shared/schema';
import { calculateTileArea } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface TileData {
  thickness: string;
  length: number;
  width: number;
  quantity: number;
  grossArea: number;
  correctedArea: number;
}

interface TelhaSelectorProps {
  tiles: TileData[];
  onChange: (tiles: TileData[]) => void;
  className?: string;
}

export function TelhaSelector({ tiles, onChange, className }: TelhaSelectorProps) {
  const { toast } = useToast();
  const [newTile, setNewTile] = useState<Partial<TileData>>({
    thickness: '',
    length: 0,
    width: 0,
    quantity: 1,
  });

  const getAvailableLengths = (thickness: string) => {
    return TILE_CONFIG[thickness as keyof typeof TILE_CONFIG]?.lengths || [];
  };

  const getAvailableWidths = (thickness: string, length?: number) => {
    const config = TILE_CONFIG[thickness as keyof typeof TILE_CONFIG];
    if (!config) return [];

    // Check for restrictions
    if (config.restrictions && length) {
      const restrictions = config.restrictions[length.toString() as keyof typeof config.restrictions];
      if (restrictions) {
        return restrictions;
      }
    }

    return config.widths;
  };

  const validateTileCombination = (thickness: string, length: number, width: number): boolean => {
    const config = TILE_CONFIG[thickness as keyof typeof TILE_CONFIG];
    if (!config) return false;

    const validLengths = config.lengths;
    const validWidths = getAvailableWidths(thickness, length);

    return validLengths.includes(length) && validWidths.includes(width);
  };

  const calculateAreas = (length: number, width: number, quantity: number) => {
    const grossArea = length * width * quantity;
    const correctedArea = grossArea * 0.88; // 12% overlap correction
    return { grossArea, correctedArea };
  };

  const addTile = () => {
    if (!newTile.thickness || !newTile.length || !newTile.width || !newTile.quantity) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos da telha",
        variant: "destructive",
      });
      return;
    }

    if (!validateTileCombination(newTile.thickness, newTile.length, newTile.width)) {
      toast({
        title: "Combinação inválida",
        description: "Esta combinação de espessura, comprimento e largura não é válida",
        variant: "destructive",
      });
      return;
    }

    const { grossArea, correctedArea } = calculateAreas(
      newTile.length!,
      newTile.width!,
      newTile.quantity!
    );

    const tile: TileData = {
      thickness: newTile.thickness!,
      length: newTile.length!,
      width: newTile.width!,
      quantity: newTile.quantity!,
      grossArea,
      correctedArea,
    };

    onChange([...tiles, tile]);
    setNewTile({
      thickness: '',
      length: 0,
      width: 0,
      quantity: 1,
    });

    toast({
      title: "Telha adicionada",
      description: `${tile.quantity}x Telha ${tile.thickness} - ${tile.length}m x ${tile.width}m`,
    });
  };

  const removeTile = (index: number) => {
    const newTiles = tiles.filter((_, i) => i !== index);
    onChange(newTiles);
    toast({
      title: "Telha removida",
      description: "Telha removida da lista",
    });
  };

  const updateTileQuantity = (index: number, quantity: number) => {
    if (quantity < 1) return;

    const newTiles = tiles.map((tile, i) => {
      if (i === index) {
        const { grossArea, correctedArea } = calculateAreas(tile.length, tile.width, quantity);
        return { ...tile, quantity, grossArea, correctedArea };
      }
      return tile;
    });
    onChange(newTiles);
  };

  const totalArea = tiles.reduce((sum, tile) => sum + tile.correctedArea, 0);

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Add New Tile Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plus className="w-5 h-5" />
              <span>Adicionar Telha</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Thickness */}
              <div>
                <Label>Espessura</Label>
                <Select
                  value={newTile.thickness}
                  onValueChange={(value) => setNewTile({ ...newTile, thickness: value, length: 0, width: 0 })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5mm">5mm</SelectItem>
                    <SelectItem value="6mm">6mm</SelectItem>
                    <SelectItem value="8mm">8mm</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Length */}
              <div>
                <Label>Comprimento (m)</Label>
                <Select
                  value={newTile.length?.toString() || ''}
                  onValueChange={(value) => setNewTile({ ...newTile, length: parseFloat(value), width: 0 })}
                  disabled={!newTile.thickness}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableLengths(newTile.thickness || '').map((length) => (
                      <SelectItem key={length} value={length.toString()}>
                        {length}m
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Width */}
              <div>
                <Label>Largura (m)</Label>
                <Select
                  value={newTile.width?.toString() || ''}
                  onValueChange={(value) => setNewTile({ ...newTile, width: parseFloat(value) })}
                  disabled={!newTile.thickness || !newTile.length}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableWidths(newTile.thickness || '', newTile.length).map((width) => (
                      <SelectItem key={width} value={width.toString()}>
                        {width}m
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Quantity */}
              <div>
                <Label>Quantidade</Label>
                <Input
                  type="number"
                  min="1"
                  max="1000"
                  value={newTile.quantity || ''}
                  onChange={(e) => setNewTile({ ...newTile, quantity: parseInt(e.target.value) || 1 })}
                  placeholder="1"
                />
              </div>
            </div>

            <Button 
              onClick={addTile}
              disabled={!newTile.thickness || !newTile.length || !newTile.width || !newTile.quantity}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Telha
            </Button>
          </CardContent>
        </Card>

        {/* Tiles List */}
        {tiles.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Telhas Selecionadas</span>
                <Badge variant="secondary" className="text-lg px-3 py-1">
                  <Calculator className="w-4 h-4 mr-2" />
                  {totalArea.toFixed(2)}m²
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tiles.map((tile, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border rounded-lg bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="font-medium">
                        Telha Ondulada {tile.thickness} CRFS
                      </div>
                      <div className="text-sm text-gray-600">
                        {tile.length}m x {tile.width}m
                      </div>
                      <div className="text-xs text-gray-500">
                        Área: {tile.correctedArea.toFixed(2)}m² (com correção de 12%)
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <Label className="text-sm">Qtd:</Label>
                        <Input
                          type="number"
                          min="1"
                          max="1000"
                          value={tile.quantity}
                          onChange={(e) => updateTileQuantity(index, parseInt(e.target.value) || 1)}
                          className="w-20 h-8"
                        />
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTile(index)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Area Summary */}
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-green-800">Área Total Coberta:</span>
                  <span className="text-xl font-bold text-green-600">
                    {totalArea.toFixed(2)}m²
                  </span>
                </div>
                <p className="text-sm text-green-600 mt-1">
                  * Área calculada com correção de 12% para sobreposição
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {tiles.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <Calculator className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma telha adicionada
              </h3>
              <p className="text-gray-600">
                Adicione telhas para calcular a área total coberta
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
