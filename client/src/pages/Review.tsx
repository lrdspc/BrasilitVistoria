import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { ArrowLeft, Save, Edit, FileText, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ProgressBar";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useInspection } from "@/hooks/useInspection";
import { DocxGenerator } from "@/lib/docx-generator";

export default function Review() {
  const [, setLocation] = useLocation();
  const { id } = useParams();
  const inspectionId = id ? parseInt(id) : undefined;
  const { user } = useAuth();
  const { data, createInspection, updateInspection } = useInspection(inspectionId);
  const { toast } = useToast();
  
  const [expandedSections, setExpandedSections] = useState({
    basicInfo: true,
    team: true,
    tiles: true,
    nonConformities: true,
  });

  const [isGenerating, setIsGenerating] = useState(false);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleSaveDraft = async () => {
    if (!data.inspection || !user) return;

    try {
      if (inspectionId) {
        await updateInspection({ id: inspectionId, data: data.inspection });
      } else {
        await createInspection(data.inspection);
      }
      
      toast({
        title: "Rascunho salvo",
        description: "Vistoria salva com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  const handleGenerateReport = async () => {
    if (!data.inspection || !user) {
      toast({
        title: "Dados incompletos",
        description: "Verifique se todos os dados estão preenchidos",
        variant: "destructive",
      });
      return;
    }

    if (data.tiles.length === 0) {
      toast({
        title: "Telhas não configuradas",
        description: "Adicione pelo menos uma configuração de telha",
        variant: "destructive",
      });
      return;
    }

    if (data.nonConformities.length === 0) {
      toast({
        title: "Não conformidades não selecionadas",
        description: "Selecione pelo menos uma não conformidade",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Generate DOCX report
      await DocxGenerator.generateAndDownload({
        inspection: data.inspection,
        client: data.client,
        user,
        tiles: data.tiles,
        nonConformities: data.nonConformities,
      });

      // Navigate to success page
      if (inspectionId) {
        setLocation(`/inspection/${inspectionId}/report-success`);
      } else {
        // If no ID, create the inspection first then navigate
        const newInspection = await createInspection(data.inspection);
        setLocation(`/inspection/${newInspection.id}/report-success`);
      }
    } catch (error) {
      toast({
        title: "Erro ao gerar relatório",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("pt-BR");
  };

  const getTotalQuantity = () => {
    return data.tiles.reduce((sum, tile) => sum + tile.quantity, 0);
  };

  const formatArea = (area: number) => {
    return area.toFixed(2) + "m²";
  };

  if (!user) {
    setLocation("/login");
    return null;
  }

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
                setLocation(`/inspection/${inspectionId}/non-conformities`);
              } else {
                setLocation("/inspection/non-conformities");
              }
            }}
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
              className="text-blue-600 font-medium mt-1 p-0 h-auto"
            >
              <Save className="w-4 h-4 mr-1" />
              Salvar Rascunho
            </Button>
          </div>
        </div>
        
        <ProgressBar 
          currentStep={5} 
          totalSteps={5} 
          stepLabels={["Cliente", "Informações", "Telhas", "Não Conformidades", "Revisão"]} 
        />
        <p className="text-sm text-gray-600 text-center mt-2">Etapa 5 de 5: Revisão</p>
      </header>

      <div className="p-4 pb-32 space-y-4">
        {/* Summary Sections */}
        
        {/* Basic Information */}
        <Card>
          <Collapsible 
            open={expandedSections.basicInfo} 
            onOpenChange={() => toggleSection('basicInfo')}
          >
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <h3 className="font-medium text-gray-900">Informações Básicas</h3>
                </div>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (inspectionId) {
                        setLocation(`/inspection/${inspectionId}/basic-info`);
                      } else {
                        setLocation("/inspection/basic-info");
                      }
                    }}
                    className="text-blue-600"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                </div>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-4 pb-4 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-3 text-sm pt-3">
                  <div>
                    <span className="text-gray-500">Data:</span>
                    <span className="ml-2 font-medium">
                      {data.inspection ? formatDate(data.inspection.date) : "Não informado"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Cliente:</span>
                    <span className="ml-2 font-medium">
                      {data.client?.name || "Não informado"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Protocolo:</span>
                    <span className="ml-2 font-medium">
                      {data.inspection?.protocol || "Não informado"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Cidade:</span>
                    <span className="ml-2 font-medium">
                      {data.inspection ? `${data.inspection.city}/${data.inspection.state}` : "Não informado"}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500">Assunto:</span>
                    <span className="ml-2 font-medium">
                      {data.inspection?.subject || "Não informado"}
                    </span>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* Team */}
        <Card>
          <Collapsible 
            open={expandedSections.team} 
            onOpenChange={() => toggleSection('team')}
          >
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <h3 className="font-medium text-gray-900">Equipe</h3>
                </div>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (inspectionId) {
                        setLocation(`/inspection/${inspectionId}/basic-info`);
                      } else {
                        setLocation("/inspection/basic-info");
                      }
                    }}
                    className="text-blue-600"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                </div>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-4 pb-4 border-t border-gray-100">
                <div className="space-y-2 text-sm pt-3">
                  <div>
                    <span className="text-gray-500">Técnico:</span>
                    <span className="ml-2 font-medium">{user.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Coordenador:</span>
                    <span className="ml-2 font-medium">{user.coordinator}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Gerente:</span>
                    <span className="ml-2 font-medium">{user.manager}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Regional:</span>
                    <span className="ml-2 font-medium">{user.regional}</span>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* Tiles */}
        <Card>
          <Collapsible 
            open={expandedSections.tiles} 
            onOpenChange={() => toggleSection('tiles')}
          >
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${data.tiles.length > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <h3 className="font-medium text-gray-900">Telhas</h3>
                </div>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (inspectionId) {
                        setLocation(`/inspection/${inspectionId}/tiles`);
                      } else {
                        setLocation("/inspection/tiles");
                      }
                    }}
                    className="text-blue-600"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                </div>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-4 pb-4 border-t border-gray-100">
                {data.tiles.length > 0 ? (
                  <div className="space-y-3 pt-3">
                    {data.tiles.map((tile, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-sm">
                          <div className="font-medium mb-1">
                            {tile.quantity}x Telha Ondulada {tile.thickness} CRFS
                          </div>
                          <div className="text-gray-600">
                            Dimensão: {tile.length}m x {tile.width}m
                          </div>
                          <div className="text-gray-600">
                            Área: {formatArea(tile.correctedArea)}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-gray-200">
                      <div className="flex justify-between items-center font-bold text-blue-600">
                        <span>Área Total Coberta:</span>
                        <span>{formatArea(data.tiles.reduce((sum, tile) => sum + tile.correctedArea, 0))}</span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        Total de {getTotalQuantity()} telhas em {data.tiles.length} configurações
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="pt-3">
                    <p className="text-red-600 text-sm">Nenhuma telha configurada</p>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* Non-Conformities */}
        <Card>
          <Collapsible 
            open={expandedSections.nonConformities} 
            onOpenChange={() => toggleSection('nonConformities')}
          >
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${data.nonConformities.length > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <h3 className="font-medium text-gray-900">Não Conformidades</h3>
                </div>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (inspectionId) {
                        setLocation(`/inspection/${inspectionId}/non-conformities`);
                      } else {
                        setLocation("/inspection/non-conformities");
                      }
                    }}
                    className="text-blue-600"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                </div>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-4 pb-4 border-t border-gray-100">
                {data.nonConformities.length > 0 ? (
                  <div className="space-y-3 pt-3">
                    {data.nonConformities.map((nc, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <Badge variant="destructive" className="mt-1">
                          {index + 1}
                        </Badge>
                        <div className="flex-1">
                          <div className="font-medium text-sm">{nc.title}</div>
                          <div className="text-xs text-gray-600 mt-1">
                            {nc.photos?.length || 0} fotos
                            {nc.notes && " • Notas incluídas"}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-gray-200">
                      <div className="text-sm font-medium text-red-700">
                        Total: {data.nonConformities.length} não conformidade{data.nonConformities.length !== 1 ? 's' : ''} identificada{data.nonConformities.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="pt-3">
                    <p className="text-red-600 text-sm">Nenhuma não conformidade selecionada</p>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* Final Actions */}
        <div className="space-y-4 pt-4">
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div className="text-sm">
                  <div className="font-medium text-yellow-800 mb-1">Revisão Final</div>
                  <div className="text-yellow-700">
                    Verifique todas as informações antes de gerar o relatório. 
                    Após a geração, os dados não poderão ser editados.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button 
            onClick={handleGenerateReport}
            disabled={isGenerating || data.tiles.length === 0 || data.nonConformities.length === 0}
            className="w-full bg-green-600 hover:bg-green-700 h-12 text-lg font-semibold shadow-lg"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Gerando Relatório...
              </>
            ) : (
              <>
                <FileText className="w-5 h-5 mr-2" />
                Gerar Relatório Final
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Fixed Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 max-w-md mx-auto">
        <div className="flex space-x-4">
          <Button 
            variant="outline" 
            onClick={() => {
              if (inspectionId) {
                setLocation(`/inspection/${inspectionId}/non-conformities`);
              } else {
                setLocation("/inspection/non-conformities");
              }
            }}
            className="flex-1 h-12"
          >
            Voltar
          </Button>
          <Button 
            onClick={handleGenerateReport}
            disabled={isGenerating || data.tiles.length === 0 || data.nonConformities.length === 0}
            className="flex-1 h-12 bg-green-600 hover:bg-green-700"
          >
            {isGenerating ? (
              "Gerando..."
            ) : (
              <>
                <FileText className="w-4 h-4 mr-1" />
                Gerar Relatório
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
