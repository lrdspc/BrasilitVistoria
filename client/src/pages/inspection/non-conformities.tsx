import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Save, ChevronDown } from "lucide-react";
import { ProgressBar } from "@/components/layout/progress-bar";
import { NonConformityItem } from "@/components/forms/non-conformity-item";
import { useToast } from "@/hooks/use-toast";

const NON_CONFORMITIES = [
  { id: 1, title: "Armazenagem Incorreta", description: "As telhas foram armazenadas de forma inadequada..." },
  { id: 2, title: "Carga Permanente", description: "Excesso de equipamentos permanentes sobre as telhas..." },
  { id: 3, title: "Corte das Telhas", description: "Cortes realizados sem ferramentas adequadas..." },
  { id: 4, title: "Esforços devido à vento", description: "Estrutura inadequada para resistir a ventos..." },
  { id: 5, title: "Fixação Inadequada", description: "Telhas fixadas incorretamente..." },
  { id: 6, title: "Inclinação Insuficiente", description: "Inclinação abaixo do recomendado..." },
  { id: 7, title: "Manuseio Inadequado", description: "Telhas manuseadas de forma incorreta..." },
  { id: 8, title: "Sobrecarga", description: "Peso excessivo sobre a estrutura..." },
  { id: 9, title: "Temperatura", description: "Exposição a temperaturas extremas..." },
  { id: 10, title: "Umidade", description: "Presença excessiva de umidade..." },
  { id: 11, title: "Vibração", description: "Estrutura sujeita a vibrações..." },
  { id: 12, title: "Instalação Incorreta", description: "Procedimento de instalação inadequado..." },
  { id: 13, title: "Material Defeituoso", description: "Defeitos de fabricação identificados..." },
  { id: 14, title: "Projeto Inadequado", description: "Projeto estrutural inadequado..." },
];

interface SelectedNonConformity {
  id: number;
  title: string;
  photos: string[];
  notes: string;
}

export default function NonConformities() {
  const [, setLocation] = useLocation();
  const [selectedItems, setSelectedItems] = useState<SelectedNonConformity[]>([]);
  const [showAll, setShowAll] = useState(false);
  const { toast } = useToast();

  // Load saved data on component mount
  useEffect(() => {
    const savedData = localStorage.getItem("nonConformitiesData");
    if (savedData) {
      setSelectedItems(JSON.parse(savedData));
    }
  }, []);

  // Auto-save on changes
  useEffect(() => {
    localStorage.setItem("nonConformitiesData", JSON.stringify(selectedItems));
  }, [selectedItems]);

  const handleToggleItem = (item: typeof NON_CONFORMITIES[0]) => {
    setSelectedItems(prev => {
      const exists = prev.find(selected => selected.id === item.id);
      if (exists) {
        return prev.filter(selected => selected.id !== item.id);
      } else {
        return [...prev, {
          id: item.id,
          title: item.title,
          photos: [],
          notes: "",
        }];
      }
    });
  };

  const handleUpdateItem = (id: number, updates: Partial<SelectedNonConformity>) => {
    setSelectedItems(prev =>
      prev.map(item => item.id === id ? { ...item, ...updates } : item)
    );
  };

  const handlePhotoAdd = (id: number, photoUrl: string) => {
    setSelectedItems(prev =>
      prev.map(item => 
        item.id === id 
          ? { ...item, photos: [...item.photos, photoUrl] }
          : item
      )
    );
  };

  const handlePhotoRemove = (id: number, photoIndex: number) => {
    setSelectedItems(prev =>
      prev.map(item =>
        item.id === id
          ? { ...item, photos: item.photos.filter((_, index) => index !== photoIndex) }
          : item
      )
    );
  };

  const isSelected = (id: number) => selectedItems.some(item => item.id === id);
  const getSelectedItem = (id: number) => selectedItems.find(item => item.id === id);

  const visibleItems = showAll ? NON_CONFORMITIES : NON_CONFORMITIES.slice(0, 6);
  const remainingCount = NON_CONFORMITIES.length - 6;

  const handleSaveDraft = () => {
    localStorage.setItem("nonConformitiesData", JSON.stringify(selectedItems));
    toast({
      title: "Rascunho salvo",
      description: "Suas não conformidades foram salvas localmente",
    });
  };

  const handleNext = () => {
    if (selectedItems.length === 0) {
      toast({
        title: "Erro de validação",
        description: "Selecione pelo menos uma não conformidade",
        variant: "destructive",
      });
      return;
    }

    // Validate that each selected item has at least one photo
    const itemsWithoutPhotos = selectedItems.filter(item => item.photos.length === 0);
    if (itemsWithoutPhotos.length > 0) {
      toast({
        title: "Fotos obrigatórias",
        description: "Adicione pelo menos uma foto para cada não conformidade selecionada",
        variant: "destructive",
      });
      return;
    }

    localStorage.setItem("nonConformitiesData", JSON.stringify(selectedItems));
    setLocation("/inspection/review");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Progress */}
      <header className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/inspection/tile-selection")}
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
              className="text-blue-600 p-0 h-auto"
            >
              <Save className="w-4 h-4 mr-1" />
              Salvar Rascunho
            </Button>
          </div>
        </div>
        
        <ProgressBar currentStep={4} totalSteps={5} stepLabel="Não Conformidades" />
      </header>

      <div className="p-4 pb-32">
        {/* Selection Counter */}
        <Card className="bg-blue-50 border-blue-200 mb-6">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-xl font-bold text-blue-700">
                {selectedItems.length} de {NON_CONFORMITIES.length}
              </div>
              <div className="text-sm text-blue-600">não conformidades selecionadas</div>
              <div className="text-xs text-blue-500 mt-1">Mínimo: 1 não conformidade</div>
            </div>
          </CardContent>
        </Card>

        {/* Non-Conformity List */}
        <div className="space-y-4">
          {visibleItems.map((item) => (
            <NonConformityItem
              key={item.id}
              item={item}
              isSelected={isSelected(item.id)}
              selectedData={getSelectedItem(item.id)}
              onToggle={() => handleToggleItem(item)}
              onUpdate={(updates) => handleUpdateItem(item.id, updates)}
              onPhotoAdd={(photoUrl) => handlePhotoAdd(item.id, photoUrl)}
              onPhotoRemove={(photoIndex) => handlePhotoRemove(item.id, photoIndex)}
            />
          ))}

          {/* Expand/Collapse Button */}
          {!showAll && remainingCount > 0 && (
            <Button
              onClick={() => setShowAll(true)}
              variant="outline"
              className="w-full py-3"
            >
              <ChevronDown className="w-4 h-4 mr-2" />
              Ver todas as não conformidades ({remainingCount} restantes)
            </Button>
          )}
          
          {showAll && (
            <Button
              onClick={() => setShowAll(false)}
              variant="outline"
              className="w-full py-3"
            >
              <ChevronDown className="w-4 h-4 mr-2 rotate-180" />
              Mostrar menos
            </Button>
          )}
        </div>
      </div>

      {/* Fixed Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 max-w-md mx-auto">
        <div className="flex space-x-4">
          <Button
            onClick={() => setLocation("/inspection/tile-selection")}
            variant="outline"
            className="flex-1 touch-button"
          >
            Voltar
          </Button>
          <Button
            onClick={handleNext}
            className="flex-1 touch-button bg-blue-600 hover:bg-blue-700"
          >
            Próximo
          </Button>
        </div>
      </div>
    </div>
  );
}
