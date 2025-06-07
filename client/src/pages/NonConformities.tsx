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

// Function to fetch non-conformity configurations
// Replace with your actual API fetching logic if it's more complex or uses a service
const fetchNonConformityConfigs = async (): Promise<AvailableNonConformity[]> => {
  // This is a placeholder. In a real app, you'd fetch from an API endpoint.
  // The existing page used useQuery with "/api/config/non-conformities"
  // For now, let's simulate a fetch or use a hardcoded list similar to NON_CONFORMITY_LIST for structure.
  // This should ideally return { id: string, title: string, defaultDescription?: string }
  const response = await fetch("/api/config/non-conformities");
  if (!response.ok) {
    throw new Error("Failed to fetch non-conformity configurations");
  }
  const data = await response.json();
  // Assuming the API returns string[] (titles) as per original page:
  if (Array.isArray(data) && data.every(item => typeof item === 'string')) {
    return data.map((title, index) => ({
      id: String(index + 1), // Create a simple ID
      title: title,
      defaultDescription: `Detalhes sobre ${title}.`, // Example default description
    }));
  }
  // If API returns a more structured object:
  // return data as AvailableNonConformity[];
  // For now, let's ensure it returns the correct type if previous was just string[]
  console.warn("API at /api/config/non-conformities might need to return a more structured AvailableNonConformity object if it only returns titles.");
  return []; // Fallback for safety
};


export default function NonConformitiesPage() {
  const [, setLocation] = useLocation();
  const {
    nonConformities: selectedNcsFromStore, // These are StoreNonConformity[]
    setNonConformities,
    setCurrentStep,
    currentStep: storeCurrentStep
  } = useVistoriaStore();
  const { toast } = useToast();

  // Fetch available non-conformity items from the API
  const { data: availableNcItems, isLoading: isLoadingConfig, error: configError } = useQuery<AvailableNonConformity[]>({
    queryKey: ["nonConformityConfigs"],
    queryFn: fetchNonConformityConfigs
  });

  // Adapt store data (StoreNonConformity[]) to what NaoConformidadesChecklist expects (SelectedNonConformity[])
  // StoreNonConformity includes id and inspectionId, SelectedNonConformity does not explicitly.
  // The checklist component primarily works with title, description, notes, photos.
  const checklistSelectedItems: SelectedNonConformity[] = selectedNcsFromStore.map(nc => ({
    title: nc.title,
    description: nc.description || "",
    notes: nc.notes || "",
    photos: nc.photos || [],
  }));

  const handleChecklistChange = (updatedChecklistItems: SelectedNonConformity[]) => {
    // Convert back to StoreNonConformity[] before saving to store
    // Need to preserve existing IDs if possible, or let store handle ID generation for new items.
    const storeReadyItems: StoreNonConformity[] = updatedChecklistItems.map(item => {
      const existingStoreItem = selectedNcsFromStore.find(sItem => sItem.title === item.title);
      return {
        id: existingStoreItem?.id || Date.now(), // Keep existing ID or generate a temporary one for new items
        inspectionId: existingStoreItem?.inspectionId || 0, // Keep existing or use default
        title: item.title,
        description: item.description,
        notes: item.notes,
        photos: item.photos,
        // other fields like 'area', 'severity' if they exist in StoreNonConformity and should be defaulted
      };
    });
    setNonConformities(storeReadyItems);
  };

  const handleNext = () => {
    if (selectedNcsFromStore.length === 0) {
      toast({
        title: "Nenhuma não conformidade selecionada",
        description: "Selecione ao menos uma não conformidade ou prossiga se não houver.",
        variant: "default", // Changed to default as it's not strictly an error to have no NCs
      });
      // Allow proceeding even if no NCs are selected, this might be valid.
      // If selection is mandatory, uncomment the return and change variant to "destructive"
      // return;
    }

    // Example validation: ensure all selected non-conformities have at least one photo
    const  missingPhotos = selectedNcsFromStore.filter(nc => nc.photos.length === 0);
    if (missingPhotos.length > 0) {
       toast({
         title: "Fotos obrigatórias",
         description: `Adicione pelo menos uma foto para cada não conformidade selecionada: ${missingPhotos.map(nc => nc.title).join(", ")}`,
         variant: "destructive",
       });
       return;
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
        <div className="text-red-600 p-4">Erro ao carregar configurações: {configError.message}</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Não Conformidades" showSidebar={false}>
      <div className="max-w-4xl mx-auto space-y-6 p-4 md:p-6">
        <ProgressBar 
          currentStep={storeCurrentStep || 4} // Default to 4
          totalSteps={5} 
          stepLabels={["Cliente", "Informações", "Telhas", "Não Conformidades", "Revisão"]} 
        />

        <NaoConformidadesChecklist
          availableItems={availableNcItems || []}
          selectedNonConformities={checklistSelectedItems}
          onChange={handleChecklistChange}
          className="mt-4"
        />

        <div className="flex justify-between mt-8">
          <Button variant="outline" onClick={handleBack} className="h-12 px-6">
            Voltar
          </Button>
          <Button onClick={handleNext} className="h-12 px-6 bg-blue-600 hover:bg-blue-700">
            Próximo
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
