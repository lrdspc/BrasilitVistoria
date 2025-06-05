import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Save, Camera, Mic, X, ChevronDown } from 'lucide-react';
import { ProgressBar } from '@/components/ProgressBar';
import { useToast } from '@/hooks/use-toast';
import { NON_CONFORMITIES } from '@shared/schema';

interface NonConformity {
  title: string;
  selected: boolean;
  photos: string[];
  notes: string;
}

interface NonConformitiesProps {
  onBack: () => void;
  onNext: (data: any) => void;
  initialData?: any;
}

export function NonConformities({ onBack, onNext, initialData }: NonConformitiesProps) {
  const [nonConformities, setNonConformities] = useState<NonConformity[]>(
    NON_CONFORMITIES.map(title => ({
      title,
      selected: false,
      photos: [],
      notes: '',
      ...((initialData?.nonConformities || []).find((nc: any) => nc.title === title) || {}),
    }))
  );
  
  const [showAll, setShowAll] = useState(false);
  const [isListening, setIsListening] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  
  const { toast } = useToast();

  const selectedCount = nonConformities.filter(nc => nc.selected).length;
  const displayedItems = showAll ? nonConformities : nonConformities.slice(0, 6);

  const updateNonConformity = (index: number, field: keyof NonConformity, value: any) => {
    setNonConformities(prev => prev.map((nc, i) => 
      i === index ? { ...nc, [field]: value } : nc
    ));
  };

  const handlePhotoUpload = async (index: number, files: FileList | null) => {
    if (!files) return;

    const nc = nonConformities[index];
    if (nc.photos.length >= 5) {
      toast({
        title: "Limite de fotos",
        description: "Máximo 5 fotos por não conformidade.",
        variant: "destructive",
      });
      return;
    }

    const file = files[0];
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "Máximo 2MB por foto.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Convert to base64 for storage
      const reader = new FileReader();
      reader.onload = (e) => {
        const photoUrl = e.target?.result as string;
        updateNonConformity(index, 'photos', [...nc.photos, photoUrl]);
      };
      reader.readAsDataURL(file);

      toast({
        title: "Foto adicionada",
        description: "Foto salva com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro no upload",
        description: "Não foi possível salvar a foto.",
        variant: "destructive",
      });
    }
  };

  const removePhoto = (ncIndex: number, photoIndex: number) => {
    const nc = nonConformities[ncIndex];
    const updatedPhotos = nc.photos.filter((_, i) => i !== photoIndex);
    updateNonConformity(ncIndex, 'photos', updatedPhotos);
  };

  const startVoiceInput = (index: number) => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast({
        title: "Não suportado",
        description: "Seu navegador não suporta entrada por voz.",
        variant: "destructive",
      });
      return;
    }

    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = 'pt-BR';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(nonConformities[index].title);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      const currentNotes = nonConformities[index].notes;
      const newNotes = currentNotes ? `${currentNotes} ${transcript}` : transcript;
      updateNonConformity(index, 'notes', newNotes);
    };

    recognition.onerror = (event) => {
      toast({
        title: "Erro na gravação",
        description: "Não foi possível capturar o áudio.",
        variant: "destructive",
      });
    };

    recognition.onend = () => {
      setIsListening(null);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopVoiceInput = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(null);
  };

  const handleCheckboxChange = (index: number, checked: boolean) => {
    updateNonConformity(index, 'selected', checked);
    
    if (!checked) {
      // Clear photos and notes when unchecking
      updateNonConformity(index, 'photos', []);
      updateNonConformity(index, 'notes', '');
    }
  };

  const handleSaveDraft = () => {
    localStorage.setItem('vigitel-nonconformities-draft', JSON.stringify(nonConformities));
    toast({
      title: "Rascunho salvo",
      description: "Não conformidades salvas localmente.",
    });
  };

  const handleNext = () => {
    if (selectedCount === 0) {
      toast({
        title: "Seleção obrigatória",
        description: "Selecione pelo menos uma não conformidade.",
        variant: "destructive",
      });
      return;
    }

    const selectedNCs = nonConformities.filter(nc => nc.selected);
    const invalidNCs = selectedNCs.filter(nc => nc.photos.length === 0);
    
    if (invalidNCs.length > 0) {
      toast({
        title: "Fotos obrigatórias",
        description: "Adicione pelo menos uma foto para cada não conformidade selecionada.",
        variant: "destructive",
      });
      return;
    }

    onNext({ nonConformities: selectedNCs });
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
            <h1 className="text-xl font-semibold text-gray-900">Não Conformidades</h1>
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
        <ProgressBar currentStep={4} totalSteps={5} stepLabels={stepLabels} />
      </header>

      <div className="p-4 pb-32">
        {/* Selection Counter */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="text-center">
            <div className="text-xl font-bold text-blue-700">{selectedCount} de {NON_CONFORMITIES.length}</div>
            <div className="text-sm text-blue-600">não conformidades selecionadas</div>
            <div className="text-xs text-blue-500 mt-1">Mínimo: 1 não conformidade</div>
          </div>
        </div>

        {/* Non-Conformity List */}
        <div className="space-y-4">
          {displayedItems.map((nc, index) => (
            <Card 
              key={nc.title} 
              className={`${nc.selected ? 'border-2 border-red-200' : 'border border-gray-200'}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    checked={nc.selected}
                    onCheckedChange={(checked) => handleCheckboxChange(index, checked as boolean)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 mb-2">
                      {index + 1}. {nc.title}
                    </h3>
                    
                    {nc.selected && (
                      <>
                        {/* Photo Upload */}
                        <div className="mb-4">
                          <Label className="block text-sm font-medium text-gray-700 mb-2">
                            Fotos <span className="text-red-500">*</span> (mín. 1, máx. 5)
                          </Label>
                          <div className="grid grid-cols-3 gap-2 mb-3">
                            {nc.photos.map((photo, photoIndex) => (
                              <div key={photoIndex} className="relative w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
                                <img 
                                  src={photo} 
                                  alt={`${nc.title} - Foto ${photoIndex + 1}`}
                                  className="w-full h-full object-cover"
                                />
                                <Button
                                  variant="destructive"
                                  size="icon"
                                  onClick={() => removePhoto(index, photoIndex)}
                                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full"
                                >
                                  <X size={12} />
                                </Button>
                              </div>
                            ))}
                            {nc.photos.length < 5 && (
                              <div>
                                <input
                                  type="file"
                                  accept="image/*"
                                  capture="environment"
                                  ref={fileInputRef}
                                  onChange={(e) => handlePhotoUpload(index, e.target.files)}
                                  className="hidden"
                                />
                                <Button
                                  variant="outline"
                                  onClick={() => fileInputRef.current?.click()}
                                  className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 hover:border-brasilit-blue hover:text-brasilit-blue"
                                >
                                  <Camera size={20} />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Notes with Voice Input */}
                        <div>
                          <Label className="block text-sm font-medium text-gray-700 mb-2">
                            Notas (máx. 500 caracteres)
                          </Label>
                          <div className="relative">
                            <Textarea
                              value={nc.notes}
                              onChange={(e) => updateNonConformity(index, 'notes', e.target.value)}
                              placeholder="Adicione observações sobre esta não conformidade..."
                              rows={3}
                              maxLength={500}
                              className="pr-12 resize-none"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => 
                                isListening === nc.title 
                                  ? stopVoiceInput() 
                                  : startVoiceInput(index)
                              }
                              className={`absolute bottom-3 right-3 ${
                                isListening === nc.title 
                                  ? 'text-red-500 animate-pulse' 
                                  : 'text-brasilit-blue hover:text-brasilit-dark'
                              }`}
                            >
                              <Mic size={16} />
                            </Button>
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
          {NON_CONFORMITIES.length > 6 && (
            <Button
              variant="outline"
              onClick={() => setShowAll(!showAll)}
              className="w-full py-3 h-auto"
            >
              <ChevronDown size={16} className={`mr-2 transition-transform ${showAll ? 'rotate-180' : ''}`} />
              {showAll 
                ? 'Ocultar algumas não conformidades' 
                : `Ver todas as não conformidades (${NON_CONFORMITIES.length - 6} restantes)`
              }
            </Button>
          )}
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
