import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Save, FileText, CheckCircle, ChevronDown, TriangleAlert } from "lucide-react";
import { ProgressBar } from "@/components/layout/progress-bar";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function Review() {
  const [, setLocation] = useLocation();
  const [basicInfo, setBasicInfo] = useState<any>({});
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [tiles, setTiles] = useState<any[]>([]);
  const [nonConformities, setNonConformities] = useState<any[]>([]);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    basicInfo: true,
    team: false,
    tiles: false,
    nonConformities: false,
  });
  const { toast } = useToast();

  // Load all saved data on component mount
  useEffect(() => {
    const savedBasicInfo = localStorage.getItem("basicInfoData");
    const savedClient = localStorage.getItem("selectedClient");
    const savedTiles = localStorage.getItem("tilesData");
    const savedNonConformities = localStorage.getItem("nonConformitiesData");

    if (savedBasicInfo) setBasicInfo(JSON.parse(savedBasicInfo));
    if (savedClient) setSelectedClient(JSON.parse(savedClient));
    if (savedTiles) setTiles(JSON.parse(savedTiles));
    if (savedNonConformities) setNonConformities(JSON.parse(savedNonConformities));
  }, []);

  const generateReportMutation = useMutation({
    mutationFn: async () => {
      // In a real implementation, this would call the API to generate the report
      const response = await apiRequest("POST", "/api/inspections/1/generate-report", {
        basicInfo,
        client: selectedClient,
        tiles,
        nonConformities,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Relatório gerado com sucesso!",
        description: "Redirecionando para a tela de sucesso...",
      });
      setLocation("/report-success");
    },
    onError: (error) => {
      toast({
        title: "Erro ao gerar relatório",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    },
  });

  const totalArea = tiles.reduce((sum, tile) => sum + tile.correctedArea, 0);

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleSaveDraft = () => {
    toast({
      title: "Rascunho salvo",
      description: "Todas as informações foram salvas localmente",
    });
  };

  const handleGenerateReport = () => {
    // Validate required data
    if (!basicInfo.date || !basicInfo.protocol) {
      toast({
        title: "Dados incompletos",
        description: "Informações básicas são obrigatórias",
        variant: "destructive",
      });
      return;
    }

    if (tiles.length === 0) {
      toast({
        title: "Dados incompletos",
        description: "Adicione pelo menos uma telha",
        variant: "destructive",
      });
      return;
    }

    if (nonConformities.length === 0) {
      toast({
        title: "Dados incompletos",
        description: "Selecione pelo menos uma não conformidade",
        variant: "destructive",
      });
      return;
    }

    generateReportMutation.mutate();
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getProjectTypeLabel = (type: string) => {
    switch (type) {
      case "residential": return "Residencial";
      case "commercial": return "Comercial";
      case "industrial": return "Industrial";
      default: return type;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Progress */}
      <header className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/inspection/non-conformities")}
            className="mr-4"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-gray-900">Revisão Final</h1>
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
        
        <ProgressBar currentStep={5} totalSteps={5} stepLabel="Revisão" />
      </header>

      <div className="p-4 pb-32">
        {/* Summary Sections */}
        <div className="space-y-4">
          {/* Basic Information */}
          <Collapsible
            open={openSections.basicInfo}
            onOpenChange={() => toggleSection("basicInfo")}
          >
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <CardTitle className="text-base">Informações Básicas</CardTitle>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLocation("/inspection/basic-info");
                        }}
                        className="text-blue-600"
                      >
                        Editar
                      </Button>
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${openSections.basicInfo ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="border-t border-gray-100">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500">Data:</span>
                      <span className="ml-2 font-medium">{formatDate(basicInfo.date)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Cliente:</span>
                      <span className="ml-2 font-medium">{selectedClient?.name || "Sem cliente"}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Protocolo:</span>
                      <span className="ml-2 font-medium">{basicInfo.protocol}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Tipo:</span>
                      <span className="ml-2 font-medium">{getProjectTypeLabel(basicInfo.projectType)}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-500">Cidade:</span>
                      <span className="ml-2 font-medium">{basicInfo.city}/{basicInfo.state}</span>
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Team */}
          <Collapsible
            open={openSections.team}
            onOpenChange={() => toggleSection("team")}
          >
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <CardTitle className="text-base">Equipe</CardTitle>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLocation("/inspection/basic-info");
                        }}
                        className="text-blue-600"
                      >
                        Editar
                      </Button>
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${openSections.team ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="border-t border-gray-100">
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-500">Técnico:</span>
                      <span className="ml-2 font-medium">{basicInfo.technician}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Coordenador:</span>
                      <span className="ml-2 font-medium">Marlon Weingartner</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Gerente:</span>
                      <span className="ml-2 font-medium">Elisabete Kudo</span>
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Tiles */}
          <Collapsible
            open={openSections.tiles}
            onOpenChange={() => toggleSection("tiles")}
          >
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <CardTitle className="text-base">Telhas</CardTitle>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLocation("/inspection/tile-selection");
                        }}
                        className="text-blue-600"
                      >
                        Editar
                      </Button>
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${openSections.tiles ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="border-t border-gray-100">
                  <div className="space-y-3">
                    {tiles.map((tile, index) => (
                      <div key={tile.id} className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-sm">
                          <div className="font-medium mb-1">
                            {tile.quantity}x Telha Ondulada {tile.thickness} CRFS
                          </div>
                          <div className="text-gray-600">
                            Dimensão: {tile.length}m x {tile.width}m
                          </div>
                          <div className="text-gray-600">
                            Área: {tile.correctedArea.toFixed(2)}m²
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-gray-200">
                      <div className="flex justify-between items-center font-bold text-blue-600">
                        <span>Área Total Coberta:</span>
                        <span>{totalArea.toFixed(2)}m²</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Non-Conformities */}
          <Collapsible
            open={openSections.nonConformities}
            onOpenChange={() => toggleSection("nonConformities")}
          >
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <CardTitle className="text-base">Não Conformidades</CardTitle>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLocation("/inspection/non-conformities");
                        }}
                        className="text-blue-600"
                      >
                        Editar
                      </Button>
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${openSections.nonConformities ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="border-t border-gray-100">
                  <div className="space-y-3">
                    {nonConformities.map((item, index) => (
                      <div key={item.id} className="flex items-start space-x-3">
                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium mt-1">
                          {index + 1}
                        </span>
                        <div className="flex-1">
                          <div className="font-medium text-sm">{item.title}</div>
                          <div className="text-xs text-gray-600 mt-1">
                            {item.photos.length} foto{item.photos.length !== 1 ? 's' : ''}
                            {item.notes && " • Notas incluídas"}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-gray-200">
                      <div className="text-sm font-medium text-red-700">
                        Total: {nonConformities.length} não conformidade{nonConformities.length !== 1 ? 's' : ''} identificada{nonConformities.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </div>

        {/* Final Actions */}
        <div className="mt-8 space-y-4">
          <Alert className="bg-yellow-50 border-yellow-200">
            <TriangleAlert className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium text-yellow-800 mb-1">Revisão Final</div>
              <div className="text-yellow-700">
                Verifique todas as informações antes de gerar o relatório. 
                Após a geração, os dados não poderão ser editados.
              </div>
            </AlertDescription>
          </Alert>

          <Button
            onClick={handleGenerateReport}
            disabled={generateReportMutation.isPending}
            className="w-full touch-button bg-green-600 hover:bg-green-700 text-lg shadow-lg"
          >
            <FileText className="w-5 h-5 mr-2" />
            {generateReportMutation.isPending ? "Gerando..." : "Gerar Relatório Final"}
          </Button>
        </div>
      </div>

      {/* Fixed Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 max-w-md mx-auto">
        <div className="flex space-x-4">
          <Button
            onClick={() => setLocation("/inspection/non-conformities")}
            variant="outline"
            className="flex-1 touch-button"
          >
            Voltar
          </Button>
          <Button
            onClick={handleGenerateReport}
            disabled={generateReportMutation.isPending}
            className="flex-1 touch-button bg-green-600 hover:bg-green-700"
          >
            <FileText className="w-4 h-4 mr-1" />
            {generateReportMutation.isPending ? "Gerando..." : "Gerar Relatório"}
          </Button>
        </div>
      </div>
    </div>
  );
}
