import { useState } from 'react';
import { Camera, Mic, MicOff, FileText, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { PhotoUpload } from '@/components/PhotoUpload';
import { VoiceInput } from '@/components/VoiceInput';
import { NON_CONFORMITY_LIST } from '@shared/schema';
import { cn } from '@/lib/utils';

interface NonConformityData {
  title: string;
  description?: string;
  notes?: string;
  photos: string[];
  selected: boolean;
}

interface NaoConformidadesChecklistProps {
  nonConformities: NonConformityData[];
  onChange: (nonConformities: NonConformityData[]) => void;
  className?: string;
}

export function NaoConformidadesChecklist({ 
  nonConformities, 
  onChange, 
  className 
}: NaoConformidadesChecklistProps) {
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  // Initialize non-conformities if empty
  const initializeNonConformities = () => {
    if (nonConformities.length === 0) {
      const initialNCs = NON_CONFORMITY_LIST.map(title => ({
        title,
        description: '',
        notes: '',
        photos: [],
        selected: false,
      }));
      onChange(initialNCs);
      return initialNCs;
    }
    return nonConformities;
  };

  const currentNCs = initializeNonConformities();

  const toggleNonConformity = (index: number) => {
    const updated = currentNCs.map((nc, i) => {
      if (i === index) {
        const newSelected = !nc.selected;
        // If selecting, expand the item
        if (newSelected) {
          setExpandedItems(prev => new Set(prev).add(index));
        } else {
          // If deselecting, collapse and clear data
          setExpandedItems(prev => {
            const newSet = new Set(prev);
            newSet.delete(index);
            return newSet;
          });
          return {
            ...nc,
            selected: false,
            description: '',
            notes: '',
            photos: [],
          };
        }
        return { ...nc, selected: newSelected };
      }
      return nc;
    });
    onChange(updated);
  };

  const updateNonConformity = (index: number, field: keyof NonConformityData, value: any) => {
    const updated = currentNCs.map((nc, i) => {
      if (i === index) {
        return { ...nc, [field]: value };
      }
      return nc;
    });
    onChange(updated);
  };

  const toggleExpanded = (index: number) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const selectedCount = currentNCs.filter(nc => nc.selected).length;
  const totalPhotos = currentNCs.reduce((sum, nc) => sum + nc.photos.length, 0);

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-warning" />
                <span>Não Conformidades</span>
              </div>
              <div className="flex space-x-2">
                <Badge variant={selectedCount > 0 ? "destructive" : "secondary"}>
                  {selectedCount}/{NON_CONFORMITY_LIST.length} selecionadas
                </Badge>
                <Badge variant="outline">
                  {totalPhotos} fotos
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Selecione as não conformidades identificadas durante a vistoria. 
              Para cada item selecionado, adicione fotos e observações detalhadas.
            </p>
            {selectedCount === 0 && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  ⚠️ Selecione pelo menos uma não conformidade para continuar
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Non-Conformities List */}
        <div className="space-y-3">
          {currentNCs.map((nc, index) => (
            <Card 
              key={index}
              className={cn(
                "transition-all duration-200",
                nc.selected && "border-red-200 bg-red-50"
              )}
            >
              <Collapsible 
                open={expandedItems.has(index)} 
                onOpenChange={() => toggleExpanded(index)}
              >
                <div className="p-4">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      checked={nc.selected}
                      onCheckedChange={() => toggleNonConformity(index)}
                      className="mt-1"
                    />
                    
                    <div className="flex-1">
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          className="w-full justify-start p-0 h-auto font-medium text-left"
                        >
                          {nc.title}
                        </Button>
                      </CollapsibleTrigger>
                      
                      {nc.selected && (
                        <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
                          {nc.photos.length > 0 && (
                            <div className="flex items-center space-x-1">
                              <Camera className="w-4 h-4" />
                              <span>{nc.photos.length} foto{nc.photos.length !== 1 ? 's' : ''}</span>
                            </div>
                          )}
                          {nc.notes && (
                            <div className="flex items-center space-x-1">
                              <FileText className="w-4 h-4" />
                              <span>Com observações</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {nc.selected && (
                  <CollapsibleContent>
                    <div className="px-4 pb-4 space-y-4 border-t border-red-200">
                      {/* Description */}
                      <div>
                        <Label className="text-sm font-medium">Descrição</Label>
                        <Textarea
                          placeholder="Descreva detalhadamente a não conformidade identificada..."
                          value={nc.description || ''}
                          onChange={(e) => updateNonConformity(index, 'description', e.target.value)}
                          className="mt-1"
                          rows={3}
                        />
                      </div>

                      {/* Photos */}
                      <div>
                        <Label className="text-sm font-medium mb-2 block">
                          Fotos da Não Conformidade
                        </Label>
                        <PhotoUpload
                          photos={nc.photos}
                          onChange={(photos) => updateNonConformity(index, 'photos', photos)}
                          maxPhotos={3}
                          className="mt-1"
                        />
                      </div>

                      {/* Voice Notes */}
                      <div>
                        <Label className="text-sm font-medium mb-2 block">
                          Observações Adicionais
                        </Label>
                        <div className="space-y-2">
                          <VoiceInput
                            onTranscript={(text) => {
                              const currentNotes = nc.notes || '';
                              const newNotes = currentNotes ? `${currentNotes}\n${text}` : text;
                              updateNonConformity(index, 'notes', newNotes);
                            }}
                          />
                          <Textarea
                            placeholder="Digite observações adicionais ou use o microfone acima..."
                            value={nc.notes || ''}
                            onChange={(e) => updateNonConformity(index, 'notes', e.target.value)}
                            rows={3}
                          />
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                )}
              </Collapsible>
            </Card>
          ))}
        </div>

        {/* Validation Summary */}
        {selectedCount > 0 && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-800">
                  {selectedCount} não conformidade{selectedCount !== 1 ? 's' : ''} selecionada{selectedCount !== 1 ? 's' : ''}
                </span>
              </div>
              <p className="text-xs text-green-600 mt-1">
                Certifique-se de adicionar fotos e descrições detalhadas para cada item
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
