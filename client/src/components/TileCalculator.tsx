import { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import type { Tile } from "@shared/schema";
import { TILE_CONFIG } from "@shared/schema";

interface TileCalculatorProps {
  tiles: Tile[];
  onTilesChange: (tiles: Tile[]) => void;
}

interface TileForm {
  id?: number;
  thickness: string;
  length: number;
  width: number;
  quantity: number;
  grossArea: number;
  correctedArea: number;
}

export function TileCalculator({ tiles, onTilesChange }: TileCalculatorProps) {
  const [tileForms, setTileForms] = useState<TileForm[]>([]);

  useEffect(() => {
    if (tiles.length > 0) {
      setTileForms(tiles.map(tile => ({
        id: tile.id,
        thickness: tile.thickness,
        length: tile.length,
        width: tile.width,
        quantity: tile.quantity,
        grossArea: tile.grossArea,
        correctedArea: tile.correctedArea,
      })));
    } else {
      // Start with one empty tile
      addTile();
    }
  }, []);

  const calculateAreas = (length: number, width: number, quantity: number) => {
    const grossArea = length * width * quantity;
    const correctedArea = grossArea * 0.88; // 12% overlap correction
    return { grossArea, correctedArea };
  };

  const updateTile = (index: number, field: keyof TileForm, value: any) => {
    const newTileForms = [...tileForms];
    newTileForms[index] = { ...newTileForms[index], [field]: value };

    // Recalculate areas when dimensions or quantity change
    if (field === 'length' || field === 'width' || field === 'quantity') {
      const { grossArea, correctedArea } = calculateAreas(
        newTileForms[index].length,
        newTileForms[index].width,
        newTileForms[index].quantity
      );
      newTileForms[index].grossArea = grossArea;
      newTileForms[index].correctedArea = correctedArea;
    }

    setTileForms(newTileForms);
    updateParent(newTileForms);
  };

  const addTile = () => {
    const newTile: TileForm = {
      thickness: "6mm",
      length: 2.44,
      width: 1.10,
      quantity: 1,
      grossArea: 0,
      correctedArea: 0,
    };

    const { grossArea, correctedArea } = calculateAreas(newTile.length, newTile.width, newTile.quantity);
    newTile.grossArea = grossArea;
    newTile.correctedArea = correctedArea;

    const newTileForms = [...tileForms, newTile];
    setTileForms(newTileForms);
    updateParent(newTileForms);
  };

  const removeTile = (index: number) => {
    const newTileForms = tileForms.filter((_, i) => i !== index);
    setTileForms(newTileForms);
    updateParent(newTileForms);
  };

  const updateParent = (forms: TileForm[]) => {
    const newTiles: Tile[] = forms.map((form, index) => ({
      id: form.id || -(index + 1), // Use negative IDs for new tiles
      inspectionId: 0, // Will be set when saving
      thickness: form.thickness,
      length: form.length,
      width: form.width,
      quantity: form.quantity,
      grossArea: form.grossArea,
      correctedArea: form.correctedArea,
    }));
    onTilesChange(newTiles);
  };

  const getTotalAreas = () => {
    return tileForms.reduce(
      (totals, tile) => ({
        grossArea: totals.grossArea + tile.grossArea,
        correctedArea: totals.correctedArea + tile.correctedArea,
      }),
      { grossArea: 0, correctedArea: 0 }
    );
  };

  const getAvailableLengths = (thickness: string) => {
    return TILE_CONFIG[thickness as keyof typeof TILE_CONFIG]?.lengths || [];
  };

  const getAvailableWidths = (thickness: string, length: number) => {
    const config = TILE_CONFIG[thickness as keyof typeof TILE_CONFIG];
    if (!config) return [];

    // Check for restrictions
    if (thickness === "8mm" && length === 3.66) {
      return [1.10]; // Only 1.10m width for 3.66m length
    }

    return config.widths;
  };

  const totals = getTotalAreas();

  return (
    <div className="space-y-4">
      {/* Total Area Display */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-700">
            {totals.correctedArea.toFixed(2)}m²
          </div>
          <div className="text-sm text-green-600">Área Total Corrigida</div>
          <div className="text-xs text-green-500 mt-1">Incluindo 12% de sobreposição</div>
        </div>
      </div>

      {/* Tile Cards */}
      {tileForms.map((tile, index) => (
        <Card key={index} className="border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-4">
              <h3 className="font-medium text-gray-900">Telha {index + 1}</h3>
              {tileForms.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeTile(index)}
                  className="text-red-500 hover:text-red-700 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Espessura</label>
                <Select
                  value={tile.thickness}
                  onValueChange={(value) => updateTile(index, "thickness", value)}
                >
                  <SelectTrigger>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Comprimento</label>
                <Select
                  value={tile.length.toString()}
                  onValueChange={(value) => updateTile(index, "length", parseFloat(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableLengths(tile.thickness).map((length) => (
                      <SelectItem key={length} value={length.toString()}>
                        {length.toFixed(2)}m
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Largura</label>
                <Select
                  value={tile.width.toString()}
                  onValueChange={(value) => updateTile(index, "width", parseFloat(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableWidths(tile.thickness, tile.length).map((width) => (
                      <SelectItem key={width} value={width.toString()}>
                        {width.toFixed(2)}m
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quantidade</label>
                <Input
                  type="number"
                  min="1"
                  max="10000"
                  value={tile.quantity}
                  onChange={(e) => updateTile(index, "quantity", parseInt(e.target.value) || 0)}
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
                <span className="font-bold text-blue-600">{tile.correctedArea.toFixed(2)}m²</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Add Tile Button */}
      {tileForms.length < 10 && (
        <Button
          type="button"
          variant="outline"
          onClick={addTile}
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Telha
        </Button>
      )}

      {/* Calculation Summary */}
      <div className="bg-blue-600 text-white p-4 rounded-lg">
        <h3 className="font-semibold text-lg mb-3">Resumo do Cálculo</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Total de telhas:</span>
            <span>{tileForms.length} tipos</span>
          </div>
          <div className="flex justify-between">
            <span>Quantidade total:</span>
            <span>{tileForms.reduce((sum, tile) => sum + tile.quantity, 0)} unidades</span>
          </div>
          <div className="flex justify-between">
            <span>Área bruta total:</span>
            <span>{totals.grossArea.toFixed(2)}m²</span>
          </div>
          <div className="flex justify-between font-bold text-lg pt-2 border-t border-blue-400">
            <span>Área corrigida total:</span>
            <span>{totals.correctedArea.toFixed(2)}m²</span>
          </div>
        </div>
      </div>
    </div>
  );
}
