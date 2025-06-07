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
// import { NON_CONFORMITY_LIST } from '@shared/schema'; // Will be provided by parent
import { cn } from '@/lib/utils';

// This type represents a non-conformity item that *can* be selected
export interface AvailableNonConformity {
  id: string; // Or number, a unique identifier for the type of non-conformity
  title: string;
  defaultDescription?: string; // A default description if provided by API
}

// This type represents a non-conformity that *has been* selected and possibly modified
export interface SelectedNonConformity {
  title: string; // Should match title from AvailableNonConformity
  description: string;
  notes: string;
  photos: string[];
  // 'selected' is implicit by being in the selectedNonConformities array
  // 'id' or 'uniqueKey' might be needed if titles are not unique, or to link to AvailableNonConformity's id
}

interface NaoConformidadesChecklistProps {
  availableItems: AvailableNonConformity[]; // List of all possible non-conformities from API
  selectedNonConformities: SelectedNonConformity[]; // Current non-conformities from vistoriaStore
  onChange: (updatedSelectedNonConformities: SelectedNonConformity[]) => void; // Callback to update store
  className?: string;
}

export function NaoConformidadesChecklist({
  availableItems,
  selectedNonConformities,
  onChange,
  className,
}: NaoConformidadesChecklistProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set()); // Use item title or ID for keys

  const handleToggleSelected = (itemTitle: string, currentDescription?: string) => {
    const isCurrentlySelected = selectedNonConformities.some(nc => nc.title === itemTitle);
    let updated: SelectedNonConformity[];

    if (isCurrentlySelected) {
      updated = selectedNonConformities.filter(nc => nc.title !== itemTitle);
      // Collapse if deselected
      setExpandedItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemTitle);
        return newSet;
      });
    } else {
      const availableItem = availableItems.find(item => item.title === itemTitle);
      updated = [
        ...selectedNonConformities,
        {
          title: itemTitle,
          description: currentDescription || availableItem?.defaultDescription || '',
          notes: '',
          photos: [],
        },
      ];
      // Expand if selected
      setExpandedItems(prev => new Set(prev).add(itemTitle));
    }
    onChange(updated);
  };

  const handleUpdateField = (itemTitle: string, field: keyof SelectedNonConformity, value: any) => {
    const updated = selectedNonConformities.map(nc => {
      if (nc.title === itemTitle) {
        return { ...nc, [field]: value };
      }
      return nc;
    });
    onChange(updated);
  };

  const toggleExpanded = (itemTitle: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemTitle)) {
        newSet.delete(itemTitle);
      } else {
        newSet.add(itemTitle);
      }
      return newSet;
    });
  };

  const selectedCount = selectedNonConformities.length;
  const totalPhotos = selectedNonConformities.reduce((sum, nc) => sum + nc.photos.length, 0);

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
                  {selectedCount}/{availableItems.length} selecionadas
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
          {availableItems.map((item) => {
            const currentSelectedItem = selectedNonConformities.find(nc => nc.title === item.title);
            const isSelected = !!currentSelectedItem;

            return (
              <Card
                key={item.id || item.title} // Use item.id if available and unique
                className={cn(
                  "transition-all duration-200",
                  isSelected && "border-red-200 bg-red-50"
                )}
              >
                <Collapsible
                  open={expandedItems.has(item.title)}
                  onOpenChange={() => toggleExpanded(item.title)}
                >
                  <div className="p-4">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleToggleSelected(item.title, item.defaultDescription)}
                        className="mt-1"
                        id={`nc-${item.id || item.title}`}
                      />
                      <div className="flex-1">
                        <CollapsibleTrigger asChild>
                          <Button
                            variant="ghost"
                            className="w-full justify-start p-0 h-auto font-medium text-left"
                            aria-controls={`content-${item.id || item.title}`}
                          >
                            <Label htmlFor={`nc-${item.id || item.title}`} className="cursor-pointer w-full text-left">
                              {item.title}
                            </Label>
                          </Button>
                        </CollapsibleTrigger>

                        {isSelected && currentSelectedItem && (
                          <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
                            {currentSelectedItem.photos.length > 0 && (
                              <div className="flex items-center space-x-1">
                                <Camera className="w-4 h-4" />
                                <span>{currentSelectedItem.photos.length} foto{currentSelectedItem.photos.length !== 1 ? 's' : ''}</span>
                              </div>
                            )}
                            {currentSelectedItem.notes && (
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

                  {isSelected && currentSelectedItem && (
                    <CollapsibleContent id={`content-${item.id || item.title}`}>
                      <div className="px-4 pb-4 space-y-4 border-t border-red-200">
                        {/* Description */}
                        <div>
                          <Label className="text-sm font-medium">Descrição</Label>
                          <Textarea
                            placeholder="Descreva detalhadamente a não conformidade identificada..."
                            value={currentSelectedItem.description}
                            onChange={(e) => handleUpdateField(item.title, 'description', e.target.value)}
                            className="mt-1"
                            rows={3}
                          />
                        </div>

                        {/* Photos */}
                        <div>
                          <Label className="text-sm font-medium mb-2 block">
                            Fotos da Não Conformidade (Máx. 3)
                          </Label>
                          <PhotoUpload
                            photos={currentSelectedItem.photos}
                            onChange={(photos) => handleUpdateField(item.title, 'photos', photos)}
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
                                const newNotes = currentSelectedItem.notes ? `${currentSelectedItem.notes}\n${text}` : text;
                                handleUpdateField(item.title, 'notes', newNotes);
                              }}
                            />
                            <Textarea
                              placeholder="Digite observações adicionais ou use o microfone acima..."
                              value={currentSelectedItem.notes}
                              onChange={(e) => handleUpdateField(item.title, 'notes', e.target.value)}
                              rows={3}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                )}
              </Collapsible>
            </Card>
            );
          })}
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
                Certifique-se de adicionar fotos e descrições detalhadas para cada item.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
