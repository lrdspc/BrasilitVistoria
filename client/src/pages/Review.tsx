import { AppLayout } from "@/components/layouts/AppLayout";
import { ProgressBar } from "@/components/ProgressBar";
import { Button } from "@/components/ui/button";
import { useVistoriaStore } from "@/stores/vistoriaStore";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils"; // For formatting date
import { ScrollArea } from "@/components/ui/scroll-area"; // For potentially long lists

export default function ReviewPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const store = useVistoriaStore();
  const {
    client,
    date,
    enterprise,
    city,
    state: storeState,
    address,
    cep,
    protocol,
    subject,
    tiles,
    totalArea,
    nonConformities,
    currentStep,
    setCurrentStep,
    markComplete,
    // resetForm, // Decided against auto-resetting for now
  } = store;

  const handleBack = () => {
    setCurrentStep(4); // Previous step is Non-Conformities
    setLocation("/inspection/non-conformities");
  };

  const handleSubmit = async () => {
    // 1. Placeholder for saving to IndexedDB
    console.log("Submitting Vistoria. Data to be saved (placeholder for IndexedDB):", JSON.stringify(store));
    toast({
      title: "Submissão (Placeholder)",
      description: "Dados da vistoria registrados no console. Implementar salvamento offline.",
      duration: 3000,
    });

    // 2. Placeholder for DOCX generation
    console.log("Generating DOCX report (placeholder)...");
    toast({
      title: "Geração DOCX (Placeholder)",
      description: "Lógica de geração de relatório pendente.",
      duration: 3000,
    });

    // 3. Mark as complete in store
    markComplete(); // Sets isComplete = true

    // 4. Navigate to success page
    // The ReportSuccess.tsx page seems to expect an inspection ID.
    // We'll use the protocol as a stand-in if available.
    const inspectionIdForPath = protocol || "current_inspection";
    setLocation(`/inspection/${inspectionIdForPath}/report-success`);

    // Consider if vistoriaStore should be reset here or if ReportSuccess handles it.
    // For now, let ReportSuccess or a new flow handle reset if needed.
  };

  const getSafePhotoUrl = (url: string | undefined | null): string => {
    if (!url) return "/placeholder-image.png"; // Provide a path to a placeholder image in your public folder
    // Basic check, can be expanded (e.g. check for http/https, data:image)
    if (url.startsWith("data:image") || url.startsWith("http")) return url;
    // If it's a relative path or needs prefixing for display from blob/local storage
    // This part might need adjustment based on how photos are stored and retrieved
    return url;
  };


  return (
    <AppLayout title="Revisão da Vistoria" showSidebar={false}>
      <div className="max-w-3xl mx-auto space-y-6 p-4 md:p-6 pb-28"> {/* Increased bottom padding */}
        <ProgressBar 
          currentStep={currentStep || 5}
          totalSteps={5} 
          stepLabels={["Cliente", "Informações", "Telhas", "Não Conformidades", "Revisão"]} 
        />

        <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Revisão Final da Vistoria</h1>
            <p className="text-sm text-gray-600 mt-1">
              Confira todos os dados antes de finalizar. Após a submissão, a edição não será permitida por esta interface.
            </p>
        </div>

        <Accordion type="multiple" defaultValue={['client-info', 'basic-info', 'tiles-info', 'non-conformities']} className="w-full space-y-3">

          <AccordionItem value="client-info" className="border rounded-lg overflow-hidden">
            <AccordionTrigger className="font-medium text-md p-4 bg-gray-50 hover:bg-gray-100 rounded-t-lg data-[state=closed]:rounded-lg transition-all">
              Informações do Cliente
            </AccordionTrigger>
            <AccordionContent className="p-4 border-t bg-white">
              {client ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <p><strong>Nome:</strong> {client.name}</p>
                  <p><strong>Documento:</strong> {client.document}</p>
                  <p><strong>Contato:</strong> {client.contact || "N/A"}</p>
                  <p><strong>Email:</strong> {client.email || "N/A"}</p>
                </div>
              ) : <p className="text-sm text-gray-500">Nenhum cliente selecionado.</p>}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="basic-info" className="border rounded-lg overflow-hidden">
            <AccordionTrigger className="font-medium text-md p-4 bg-gray-50 hover:bg-gray-100 rounded-t-lg data-[state=closed]:rounded-lg transition-all">
              Informações Básicas da Vistoria
            </AccordionTrigger>
            <AccordionContent className="p-4 border-t bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <p><strong>Protocolo:</strong> {protocol || "N/A"}</p>
                <p><strong>Data:</strong> {date ? formatDate(new Date(date)) : "N/A"}</p>
                <p><strong>Empreendimento:</strong> {enterprise || "N/A"}</p>
                <p><strong>Assunto:</strong> {subject || "N/A"}</p>
                <p className="md:col-span-2"><strong>Endereço:</strong> {`${address || ""}, ${city || ""}, ${storeState || ""}`}</p>
                <p><strong>CEP:</strong> {cep || "N/A"}</p>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="tiles-info" className="border rounded-lg overflow-hidden">
            <AccordionTrigger className="font-medium text-md p-4 bg-gray-50 hover:bg-gray-100 rounded-t-lg data-[state=closed]:rounded-lg transition-all">
              Telhas e Área Total
            </AccordionTrigger>
            <AccordionContent className="p-4 border-t bg-white">
              {tiles && tiles.length > 0 ? (
                <>
                  <ScrollArea className="max-h-60"> {/* Scroll for many tile types */}
                    <ul className="space-y-3 mb-4 pr-3">
                      {tiles.map((tile, index) => (
                        <li key={index} className="p-3 border rounded bg-gray-50 text-sm">
                          <p><strong>Tipo/Espessura:</strong> Telha {tile.thickness}</p>
                          <p><strong>Dimensões:</strong> {tile.length}m x {tile.width}m</p>
                          <p><strong>Quantidade:</strong> {tile.quantity}</p>
                          <p><strong>Área Corrigida:</strong> {tile.correctedArea ? tile.correctedArea.toFixed(2) : 'N/A'} m²</p>
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                  <p className="font-semibold text-md mt-3 pt-3 border-t">
                    <strong>Área Total Corrigida:</strong> {totalArea ? totalArea.toFixed(2) : 'N/A'} m²
                  </p>
                </>
              ) : <p className="text-sm text-gray-500">Nenhuma telha selecionada.</p>}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="non-conformities" className="border rounded-lg overflow-hidden">
            <AccordionTrigger className="font-medium text-md p-4 bg-gray-50 hover:bg-gray-100 rounded-t-lg data-[state=closed]:rounded-lg transition-all">
              Não Conformidades ({nonConformities ? nonConformities.length : 0})
            </AccordionTrigger>
            <AccordionContent className="p-4 border-t bg-white">
              {nonConformities && nonConformities.length > 0 ? (
                <ScrollArea className="max-h-96"> {/* Scroll for many non-conformities */}
                  <ul className="space-y-4 pr-3">
                    {nonConformities.map((nc, index) => (
                      <li key={nc.id || index} className="p-3 border rounded bg-gray-50 text-sm">
                        <p className="font-semibold text-base mb-1">{nc.title}</p>
                        <p className="text-xs text-gray-600 mb-1"><strong>Descrição:</strong> {nc.description || "Nenhuma descrição."}</p>
                        <p className="text-xs text-gray-600 mb-2"><strong>Observações:</strong> {nc.notes || "Nenhuma observação."}</p>
                        {nc.photos && nc.photos.length > 0 && (
                          <div>
                            <p className="text-xs font-medium mb-1">Fotos:</p>
                            <div className="flex flex-wrap gap-2">
                              {nc.photos.map((photoUrl, photoIndex) => (
                                <img
                                  key={photoIndex}
                                  src={getSafePhotoUrl(photoUrl)}
                                  alt={`Foto ${photoIndex + 1} de ${nc.title}`}
                                  className="w-20 h-20 object-cover rounded border-2 border-white shadow-sm hover:scale-150 transition-transform cursor-pointer"
                                  onClick={() => window.open(getSafePhotoUrl(photoUrl), '_blank')}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              ) : <p className="text-sm text-gray-500">Nenhuma não conformidade registrada.</p>}
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Action Buttons Container */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-top-md md:sticky md:shadow-none md:p-0 md:mt-8">
          <div className="max-w-3xl mx-auto flex justify-between">
            <Button variant="outline" onClick={handleBack} className="h-11 px-5 text-base md:h-12 md:px-6 md:text-lg">
              Voltar
            </Button>
            <Button onClick={handleSubmit} className="h-11 px-5 bg-green-600 hover:bg-green-700 text-base md:h-12 md:px-8 md:text-lg">
              Submeter Vistoria
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
