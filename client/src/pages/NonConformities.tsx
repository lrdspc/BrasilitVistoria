import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layouts/AppLayout";
import { ProgressBar } from "@/components/ProgressBar";
import { Button } from "@/components/ui/button";
import { useVistoriaStore } from "@/stores/vistoriaStore";
import { NaoConformidadesChecklist, type AvailableNonConformity, type SelectedNonConformity } from "@/components/forms/NaoConformidadesChecklist";
import { useToast } from "@/hooks/use-toast";
import type { NonConformity as StoreNonConformity } from "@shared/schema"; // Actual store type

import type { NonConformity as StoreNonConformity, PhotoRepresentation } from "@/stores/vistoriaStore"; // Actual store type

// Function to fetch non-conformity configurations
const fetchNonConformityConfigs = async (): Promise<AvailableNonConformity[]> => {
  // Defaulting to previous implementation detail where API might just return titles.
  // In a real scenario, this API would ideally return { id: string, title: string, defaultDescription?: string }
  const response = await fetch("/api/config/non-conformities");
  if (!response.ok) {
    throw new Error("Falha ao buscar configurações de não conformidades");
  }
  const data = await response.json();

  if (Array.isArray(data) && data.every(item => typeof item === 'string')) {
    return data.map((title, index) => ({
      id: `api-nc-${index + 1}`, // Ensure a unique ID for items coming from API
      title: title,
      defaultDescription: `Descrição padrão para ${title}.`, // Example default description
    }));
  } else if (Array.isArray(data) && data.every(item => typeof item === 'object' && item.title && item.id)) {
    // If API returns a more structured object that matches AvailableNonConformity
    return data as AvailableNonConformity[];
  }
  console.warn("API /api/config/non-conformities retornou formato inesperado. Defaulting to empty array.");
  return [];
};


export default function NonConformitiesPage() {
  const [, setLocation] = useLocation();
  const store = useVistoriaStore(state => ({
    selectedNcsFromStore: state.nonConformities,
    setNonConformities: state.setNonConformities,
    setCurrentStep: state.setCurrentStep,
    currentStep: state.currentStep,
    // Get specific photo actions if needed, though setNonConformities might be enough
    // addPhotoToNonConformity: state.addPhotoToNonConformity,
    // removePhotoFromNonConformity: state.removePhotoFromNonConformity,
  }));
  const { selectedNcsFromStore, setNonConformities, setCurrentStep, currentStep: storeCurrentStep } = store;
  const { toast } = useToast();

  // Fetch available non-conformity items from the API
  const { data: availableNcItems = [], isLoading: isLoadingConfig, error: configError } = useQuery<AvailableNonConformity[]>({
    queryKey: ["nonConformityConfigs"],
    queryFn: fetchNonConformityConfigs,
  });

  // NaoConformidadesChecklist's `SelectedNonConformity` is compatible enough with store's `NonConformity` (with new PhotoRepresentation)
  // The checklist component now expects `id` in its `SelectedNonConformity` items.
  // The store's `NonConformity` already has `id`, `title`, `description`, `notes`, `photos: PhotoRepresentation[]`.
  // So, selectedNcsFromStore can be passed directly if its structure matches what checklist expects.
  const handleChecklistChange = (updatedChecklistItems: SelectedNonConformity[]) => {
    // The items from checklist are of type `SelectedNonConformity[]`
    // which includes `id`, `title`, `description`, `notes`, and `photos: PhotoRepresentation[]`.
    // This structure should be directly compatible with the store's `NonConformity[]` type.
    // Any new NCs selected in the checklist will have a temporary local ID like `local-nc-checklist-${timestamp}`.
    // Any new photos added will have a temporary local ID like `local-photo-${timestamp}`.
    // These IDs are fine for the store until proper DB IDs are assigned.
    setNonConformities(updatedChecklistItems as StoreNonConformity[]);
  };

  const handleNext = () => {
    // Validation: ensure all selected non-conformities have at least one photo
    const ncsWithMissingPhotos = selectedNcsFromStore.filter(
      nc => nc.photos.length === 0
    );

    if (ncsWithMissingPhotos.length > 0) {
      toast({
        title: "Fotos obrigatórias",
        description: `Adicione pelo menos uma foto para: ${ncsWithMissingPhotos.map(nc => nc.title).join(", ")}`,
        variant: "destructive",
      });
      return;
    }

    // Allow proceeding if no NCs are selected, but toast a reminder.
    if (selectedNcsFromStore.length === 0) {
      toast({
        title: "Nenhuma não conformidade",
        description: "Nenhuma não conformidade foi selecionada. Prosseguindo para revisão.",
        variant: "default",
      });
    }

    setCurrentStep(5); // Next step is Review
    setLocation("/inspection/review");
  };

  const handleBack = () => {
    setCurrentStep(3); // Previous step is Tiles
    setLocation("/inspection/tiles");
  };

  if (isLoadingConfig) {
    return (
      <AppLayout title="Não Conformidades" showSidebar={false}>
        <div className="flex justify-center items-center h-64">Carregando configurações...</div>
      </AppLayout>
    );
  }

  if (configError) {
    return (
      <AppLayout title="Não Conformidades" showSidebar={false}>
        <div className="text-red-600 p-4">Erro ao carregar configurações de não conformidades: {(configError as Error).message}</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Não Conformidades" showSidebar={false}>
      <div className="max-w-4xl mx-auto space-y-6 p-4 md:p-6 pb-28"> {/* Added pb-28 for bottom padding */}
        <ProgressBar
          currentStep={storeCurrentStep || 4}
          totalSteps={5}
          stepLabels={["Cliente", "Informações", "Telhas", "Não Conformidades", "Revisão"]}
        />

        <NaoConformidadesChecklist
          availableItems={availableNcItems}
          selectedNonConformities={selectedNcsFromStore as SelectedNonConformity[]} // Pass selected NCs from store
          onChange={handleChecklistChange}
          className="mt-4"
        />

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-top-md md:sticky md:shadow-none md:p-0 md:mt-8">
            <div className="max-w-4xl mx-auto flex justify-between">
                <Button variant="outline" onClick={handleBack} className="h-11 px-5 text-base md:h-12 md:px-6 md:text-lg">
                    Voltar
                </Button>
                <Button onClick={handleNext} className="h-11 px-5 bg-blue-600 hover:bg-blue-700 text-base md:h-12 md:px-8 md:text-lg">
                    Próximo
                </Button>
            </div>
        </div>
      </div>
    </AppLayout>
  );
}
