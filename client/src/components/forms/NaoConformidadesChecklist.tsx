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
import type { PhotoRepresentation } from '@/stores/vistoriaStore'; // Import the new Photo type
import type { PhotoItem as PhotoUploadItem } from '@/components/PhotoUpload'; // Type from PhotoUpload

export interface SelectedNonConformity {
  id: string | number; // Added id to match store's NonConformity more closely
  title: string;
  description: string;
  notes: string;
  photos: PhotoRepresentation[]; // Use the new PhotoRepresentation
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
      const newNCId = `local-nc-checklist-${Date.now()}`; // Create a temporary ID for selection context
      updated = [
        ...selectedNonConformities,
        {
          id: newNCId,
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

  const handleUpdateField = (ncId: string | number, field: keyof Omit<SelectedNonConformity, 'id'>, value: any) => {
    const updated = selectedNonConformities.map(nc => {
      if (nc.id === ncId) {
        if (field === 'photos') { // Special handling for photos if they come from PhotoUpload
          const newPhotos = (value as PhotoUploadItem[]).map(puItem => ({
            id: puItem.id || `local-photo-${Date.now()}-${Math.random()}`,
            file: puItem.file,
            previewUrl: puItem.previewUrl,
            name: puItem.name,
            // serverUrl, localDbId, isUploaded, error will be set later
          } as PhotoRepresentation));
          return { ...nc, photos: newPhotos };
        }
        return { ...nc, [field]: value };
      }
      return nc;
    });
    onChange(updated);
  };

  const toggleExpanded = (itemTitleOrId: string | number) => { // Can use title or ID
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(String(itemTitleOrId))) {
        newSet.delete(String(itemTitleOrId));
      } else {
        newSet.add(String(itemTitleOrId));
      }
      return newSet;
    });
  };

  const selectedCount = selectedNonConformities.length;
  const totalPhotos = selectedNonConformities.reduce((sum, nc) => sum + (nc.photos?.length || 0), 0);

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
          {availableItems.map((availableNcItem) => {
            const currentSelectedItem = selectedNonConformities.find(nc => nc.title === availableNcItem.title);
            const isSelected = !!currentSelectedItem;
            const ncIdToUse = currentSelectedItem?.id || availableNcItem.id; // Use selected item's ID if available

            return (
              <Card
                key={availableNcItem.id}
                className={cn(
                  "transition-all duration-200",
                  isSelected && "border-red-200 bg-red-50"
                )}
              >
                <Collapsible
                  open={expandedItems.has(String(ncIdToUse))}
                  onOpenChange={() => toggleExpanded(ncIdToUse)}
                >
                  <div className="p-4">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleToggleSelected(availableNcItem.title, availableNcItem.defaultDescription)}
                        className="mt-1"
                        id={`nc-check-${availableNcItem.id}`}
                      />
                      <div className="flex-1">
                        <CollapsibleTrigger asChild>
                          <Button
                            variant="ghost"
                            className="w-full justify-start p-0 h-auto font-medium text-left"
                            aria-controls={`content-${availableNcItem.id}`}
                          >
                            <Label htmlFor={`nc-check-${availableNcItem.id}`} className="cursor-pointer w-full text-left">
                              {availableNcItem.title}
                            </Label>
                          </Button>
                        </CollapsibleTrigger>

                        {isSelected && currentSelectedItem && (
                          <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
                            {(currentSelectedItem.photos?.length || 0) > 0 && (
                              <div className="flex items-center space-x-1">
                                <Camera className="w-4 h-4" />
                                <span>{currentSelectedItem.photos.length} foto{currentSelectedItem.photos.length !== 1 ? 's' : ''}</span>
                              </div>
                            )}
                            {currentSelectedItem.notes && currentSelectedItem.notes.trim() !== '' && (
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
                    <CollapsibleContent id={`content-${availableNcItem.id}`}>
                      <div className="px-4 pb-4 space-y-4 border-t border-red-200">
                        {/* Description */}
                        <div>
                          <Label className="text-sm font-medium">Descrição</Label>
                          <Textarea
                            placeholder="Descreva detalhadamente a não conformidade identificada..."
                            value={currentSelectedItem.description}
                            onChange={(e) => handleUpdateField(currentSelectedItem.id, 'description', e.target.value)}
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
                            photos={currentSelectedItem.photos as PhotoUploadItem[]} // Cast needed as PhotoRepresentation is wider
                            onChange={(newPhotosFromUpload) => handleUpdateField(currentSelectedItem.id, 'photos', newPhotosFromUpload)}
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
                                handleUpdateField(currentSelectedItem.id, 'notes', newNotes);
                              }}
                            />
                            <Textarea
                              placeholder="Digite observações adicionais ou use o microfone acima..."
                              value={currentSelectedItem.notes}
                              onChange={(e) => handleUpdateField(currentSelectedItem.id, 'notes', e.target.value)}
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
