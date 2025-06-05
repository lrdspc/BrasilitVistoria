import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Save, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { ProgressBar } from "@/components/ProgressBar";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import { PhotoUpload } from "@/components/PhotoUpload";
import { VoiceInput } from "@/components/VoiceInput";
import { useToast } from "@/hooks/use-toast";
import { useInspection } from "@/hooks/useInspection";
import type { NonConformity } from "@shared/schema";

interface NonConformityForm {
  id?: number;
  title: string;
  description?: string;
  notes: string;
  photos: string[];
  selected: boolean;
}

export default function NonConformities() {
  const [, setLocation] = useLocation();
  const { id } = useParams();
  const inspectionId = id ? parseInt(id) : undefined;
  const { data, setCurrentData } = useInspection(inspectionId);
  const { toast } = useToast();
  
  const [nonConformities, setNonConformities] = useState<NonConformityForm[]>([]);
  const [showAll, setShowAll] = useState(false);

  // Fetch non-conformity list
  const { data: ncList = [] } = useQuery<string[]>({
    queryKey: ["/api/config/non-conformities"],
  });

  // Initialize non-conformities list
  useEffect(() => {
    if (ncList.length > 0 && nonConformities.length === 0) {
      const initialNCs = ncList.map((title, index) => ({
        title,
        description: `Não conformidade identificada: ${title.toLowerCase()}`,
        notes: "",
        photos: [],
        selected: false,
      }));
      setNonConformities(initialNCs);
    }
  }, [ncList, nonConformities.length]);

  // Load existing non-conformities from current data
  useEffect(() => {
    if (data.nonConformities.length > 0 && ncList.length > 0) {
      const updatedNCs = ncList.map((title) => {
        const existing = data.nonConformities.find(nc => nc.title === title);
        return {
          id: existing?.id,
          title,
          description: existing?.description || `Não conformidade identificada: ${title.toLowerCase()}`,
          notes: existing?.notes || "",
          photos: existing?.photos || [],
          selected: !!existing,
        };
      });
      setNonConformities(updatedNCs);
    }
  }, [data.nonConformities, ncList]);

  const handleSaveDraft = async () => {
    try {
      const selectedNCs = nonConformities
        .filter(nc => nc.selected)
        .map(nc => ({
          id: nc.id,
          inspectionId: inspectionId || 0,
          title: nc.title,
          description: nc.description,
          notes: nc.notes,
          photos: nc.photos,
        }));

      setCurrentData(prev => ({ 
        ...prev, 
        nonConformities: selectedNCs as NonConformity[]
      }));
      
      toast({
        title: "Rascunho salvo",
        description: "Não conformidades salvas",
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
    const selectedNCs = nonConformities.filter(nc => nc.selected);
    
    if (selectedNCs.length === 0) {
      toast({
        title: "Selecione pelo menos uma não conformidade",
        description: "É necessário identificar ao menos uma não conformidade",
        variant: "destructive",
      });
      return;
    }

    // Validate photos for selected non-conformities
    const missingPhotos = selectedNCs.filter(nc => nc.photos.length === 0);
    if (missingPhotos.length > 0) {
      toast({
        title: "Fotos obrigatórias",
        description: `Adicione pelo menos uma foto para: ${missingPhotos.map(nc => nc.title).join(", ")}`,
        variant: "destructive",
      });
      return;
    }

    // Update current data
    const formattedNCs = selectedNCs.map(nc => ({
      id: nc.id,
      inspectionId: inspectionId || 0,
      title: nc.title,
      description: nc.description,
      notes: nc.notes,
      photos: nc.photos,
    }));

    setCurrentData(prev => ({ 
      ...prev, 
      nonConformities: formattedNCs as NonConformity[]
    }));

    // Navigate to next step
    if (inspectionId) {
      setLocation(`/inspection/${inspectionId}/review`);
    } else {
      setLocation("/inspection/review");
    }
  };

  const updateNonConformity = (index: number, field: keyof NonConformityForm, value: any) => {
    const updated = [...nonConformities];
    updated[index] = { ...updated[index], [field]: value };
    setNonConformities(updated);
  };

  const handleVoiceTranscript = (index: number, transcript: string) => {
    const updated = [...nonConformities];
    const currentNotes = updated[index].notes;
    updated[index].notes = currentNotes + (currentNotes ? " " : "") + transcript;
    setNonConformities(updated);
  };

  const selectedCount = nonConformities.filter(nc => nc.selected).length;
  const visibleCount = showAll ? nonConformities.length : 3;

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
                setLocation(`/inspection/${inspectionId}/tiles`);
              } else {
                setLocation("/inspection/tiles");
              }
            }}
            className="mr-4"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-gray-900">Não Conformidades</h1>
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
          currentStep={4} 
          totalSteps={5} 
          stepLabels={["Cliente", "Informações", "Telhas", "Não Conformidades", "Revisão"]} 
        />
        <p className="text-sm text-gray-600 text-center mt-2">Etapa 4 de 5: Não Conformidades</p>
      </header>

      <div className="p-4 pb-24 space-y-4">
        {/* Selection Counter */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-center">
            <div className="text-xl font-bold text-blue-700">
              {selectedCount} de {nonConformities.length}
            </div>
            <div className="text-sm text-blue-600">não conformidades selecionadas</div>
            <div className="text-xs text-blue-500 mt-1">Mínimo: 1 não conformidade</div>
          </div>
        </div>

        {/* Non-Conformity List */}
        <div className="space-y-4">
          {nonConformities.slice(0, visibleCount).map((nc, index) => (
            <Card 
              key={index} 
              className={`${nc.selected ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    checked={nc.selected}
                    onCheckedChange={(checked) => 
                      updateNonConformity(index, "selected", checked)
                    }
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 mb-2">{nc.title}</h3>
                    
                    {nc.selected && (
                      <>
                        {/* Photo Upload */}
                        <div className="mb-4">
                          <PhotoUpload
                            photos={nc.photos}
                            onPhotosChange={(photos) => 
                              updateNonConformity(index, "photos", photos)
                            }
                            maxPhotos={5}
                            required
                          />
                        </div>

                        {/* Notes with Voice Input */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Notas (máx. 500 caracteres)
                          </label>
                          <div className="relative">
                            <Textarea
                              placeholder="Adicione observações sobre esta não conformidade..."
                              rows={3}
                              maxLength={500}
                              value={nc.notes}
                              onChange={(e) => 
                                updateNonConformity(index, "notes", e.target.value)
                              }
                              className="resize-none pr-16"
                            />
                            <div className="absolute bottom-3 right-3">
                              <VoiceInput
                                onTranscript={(transcript) => 
                                  handleVoiceTranscript(index, transcript)
                                }
                              />
                            </div>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {nc.notes.length}/500 caracteres
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Expand/Collapse Button */}
          {nonConformities.length > 3 && (
            <Button
              variant="outline"
              onClick={() => setShowAll(!showAll)}
              className="w-full"
            >
              {showAll ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-2" />
                  Mostrar menos
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-2" />
                  Ver todas as não conformidades ({nonConformities.length - 3} restantes)
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Fixed Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 max-w-md mx-auto">
        <div className="flex space-x-4">
          <Button 
            variant="outline" 
            onClick={() => {
              if (inspectionId) {
                setLocation(`/inspection/${inspectionId}/tiles`);
              } else {
                setLocation("/inspection/tiles");
              }
            }}
            className="flex-1 h-12"
          >
            Voltar
          </Button>
          <Button 
            onClick={handleNext}
            className="flex-1 h-12 bg-blue-600 hover:bg-blue-700"
            disabled={selectedCount === 0}
          >
            Próximo
          </Button>
        </div>
      </div>
    </div>
  );
}
