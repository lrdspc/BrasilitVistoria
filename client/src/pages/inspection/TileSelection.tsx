import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import { ProgressBar } from '@/components/ProgressBar';
import { useToast } from '@/hooks/use-toast';
import { TILE_THICKNESSES, TILE_LENGTHS, TILE_WIDTHS } from '@shared/schema';

interface TileConfig {
  id: number;
  thickness: string;
  length: string;
  width: string;
  quantity: number;
  grossArea: number;
  correctedArea: number;
}

interface TileSelectionProps {
  onBack: () => void;
  onNext: (data: any) => void;
  initialData?: any;
}

export function TileSelection({ onBack, onNext, initialData }: TileSelectionProps) {
  const [tiles, setTiles] = useState<TileConfig[]>(
    initialData?.tiles || [
      {
        id: 1,
        thickness: '6mm',
        length: '2.44m',
        width: '1.10m',
        quantity: 100,
        grossArea: 268.4,
        correctedArea: 236.19,
      },
    ]
  );

  const { toast } = useToast();

  const calculateArea = (length: string, width: string, quantity: number) => {
    const lengthValue = parseFloat(length.replace('m', ''));
    const widthValue = parseFloat(width.replace('m', ''));
    const grossArea = lengthValue * widthValue * quantity;
    const correctedArea = grossArea * 0.88; // 12% overlap correction
    
    return {
      grossArea: parseFloat(grossArea.toFixed(2)),
      correctedArea: parseFloat(correctedArea.toFixed(2)),
    };
  };

  const updateTile = (id: number, field: string, value: string | number) => {
    setTiles(prev => prev.map(tile => {
      if (tile.id === id) {
        const updatedTile = { ...tile, [field]: value };
        
        // Recalculate areas when relevant fields change
        if (['length', 'width', 'quantity'].includes(field)) {
          const areas = calculateArea(
            updatedTile.length,
            updatedTile.width,
            updatedTile.quantity
          );
          updatedTile.grossArea = areas.grossArea;
          updatedTile.correctedArea = areas.correctedArea;
        }
        
        return updatedTile;
      }
      return tile;
    }));
  };

  const addTile = () => {
    if (tiles.length >= 10) {
      toast({
        title: "Limite atingido",
        description: "Máximo de 10 tipos de telhas permitidos.",
        variant: "destructive",
      });
      return;
    }

    const newId = Math.max(...tiles.map(t => t.id), 0) + 1;
    const newTile: TileConfig = {
      id: newId,
      thickness: '6mm',
      length: '2.44m',
      width: '1.10m',
      quantity: 1,
      grossArea: 2.68,
      correctedArea: 2.36,
    };

    setTiles(prev => [...prev, newTile]);
    toast({
      title: "Telha adicionada",
      description: "Nova configuração de telha criada.",
    });
  };

  const removeTile = (id: number) => {
    if (tiles.length === 1) {
      toast({
        title: "Não é possível remover",
        description: "É necessário pelo menos uma configuração de telha.",
        variant: "destructive",
      });
      return;
    }

    setTiles(prev => prev.filter(tile => tile.id !== id));
  };

  const getAvailableLengths = (thickness: string) => {
    return TILE_LENGTHS[thickness as keyof typeof TILE_LENGTHS] || [];
  };

  const isWidthRestricted = (thickness: string, length: string) => {
    return thickness === '8mm' && length === '3.66m';
  };

  const getTotalArea = () => {
    return tiles.reduce((sum, tile) => sum + tile.correctedArea, 0).toFixed(2);
  };

  const getTotalQuantity = () => {
    return tiles.reduce((sum, tile) => sum + tile.quantity, 0);
  };

  const handleSaveDraft = () => {
    localStorage.setItem('vigitel-tiles-draft', JSON.stringify(tiles));
    toast({
      title: "Rascunho salvo",
      description: "Configurações de telhas salvas localmente.",
    });
  };

  const handleNext = () => {
    if (tiles.length === 0) {
      toast({
        title: "Configuração obrigatória",
        description: "Adicione pelo menos uma configuração de telha.",
        variant: "destructive",
      });
      return;
    }

    const invalidTiles = tiles.filter(tile => tile.quantity <= 0);
    if (invalidTiles.length > 0) {
      toast({
        title: "Quantidades inválidas",
        description: "Todas as quantidades devem ser maiores que zero.",
        variant: "destructive",
      });
      return;
    }

    onNext({ tiles, totalArea: getTotalArea() });
  };

  const stepLabels = ['Cliente', 'Informações Básicas', 'Telhas', 'Não Conformidades', 'Revisão'];

  return (
    <div className="min-h-screen bg-white">
      {/* Header with Progress */}
      <header className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center mb-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="mr-4">
            <ArrowLeft size={20} />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-gray-900">Seleção de Telhas</h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSaveDraft}
              className="text-sm text-brasilit-blue p-0 h-auto"
            >
              <Save size={14} className="mr-1" />
              Salvar Rascunho
            </Button>
          </div>
        </div>
        <ProgressBar currentStep={3} totalSteps={5} stepLabels={stepLabels} />
      </header>

      <div className="p-4 pb-32">
        {/* Total Area Display */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-700">{getTotalArea()}m²</div>
            <div className="text-sm text-green-600">Área Total Corrigida</div>
            <div className="text-xs text-green-500 mt-1">Incluindo 12% de sobreposição</div>
          </div>
        </div>

        {/* Tile Cards */}
        <div className="space-y-4">
          {tiles.map((tile, index) => (
            <Card key={tile.id} className="border border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="font-medium text-gray-900">Telha {index + 1}</h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeTile(tile.id)}
                    className="text-red-500 hover:text-red-700 h-8 w-8"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-2">Espessura</Label>
                    <Select
                      value={tile.thickness}
                      onValueChange={(value) => updateTile(tile.id, 'thickness', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TILE_THICKNESSES.map((thickness) => (
                          <SelectItem key={thickness} value={thickness}>
                            {thickness}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-2">Comprimento</Label>
                    <Select
                      value={tile.length}
                      onValueChange={(value) => updateTile(tile.id, 'length', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableLengths(tile.thickness).map((length) => (
                          <SelectItem key={length} value={length}>
                            {length}
                          </SelectItem>
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
                      onValueChange={(value) => updateTile(tile.id, 'width', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TILE_WIDTHS.map((width) => (
                          <SelectItem
                            key={width}
                            value={width}
                            disabled={isWidthRestricted(tile.thickness, tile.length) && width !== '1.10m'}
                          >
                            {width}
                          </SelectItem>
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
                      onChange={(e) => updateTile(tile.id, 'quantity', parseInt(e.target.value) || 1)}
                      className="py-2"
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
        <Button
          onClick={addTile}
          variant="outline"
          className="w-full py-4 mb-6 h-auto"
          disabled={tiles.length >= 10}
        >
          <Plus size={16} className="mr-2" />
          Adicionar Telha
        </Button>

        {/* Calculation Summary */}
        <div className="bg-brasilit-blue text-white p-4 rounded-lg">
          <h3 className="font-semibold text-lg mb-3">Resumo do Cálculo</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Total de telhas:</span>
              <span>{tiles.length} tipo{tiles.length > 1 ? 's' : ''}</span>
            </div>
            <div className="flex justify-between">
              <span>Quantidade total:</span>
              <span>{getTotalQuantity()} unidades</span>
            </div>
            <div className="flex justify-between">
              <span>Área bruta total:</span>
              <span>{tiles.reduce((sum, tile) => sum + tile.grossArea, 0).toFixed(2)}m²</span>
            </div>
            <div className="flex justify-between font-bold text-lg pt-2 border-t border-blue-400">
              <span>Área corrigida total:</span>
              <span>{getTotalArea()}m²</span>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 max-w-md mx-auto">
        <div className="flex space-x-4">
          <Button
            variant="outline"
            onClick={onBack}
            className="flex-1 py-4 h-auto"
          >
            Voltar
          </Button>
          <Button
            onClick={handleNext}
            className="flex-1 bg-brasilit-blue hover:bg-brasilit-dark py-4 h-auto"
          >
            Próximo
          </Button>
        </div>
      </div>
    </div>
  );
}
