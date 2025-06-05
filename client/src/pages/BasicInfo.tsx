import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { ProgressBar } from "@/components/ProgressBar";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useInspection } from "@/hooks/useInspection";
import { insertInspectionSchema, type Client } from "@shared/schema";
import { z } from "zod";

const basicInfoSchema = insertInspectionSchema.omit({ userId: true, totalArea: true }).extend({
  date: z.string().min(1, "Data é obrigatória"),
});

export default function BasicInfo() {
  const [, setLocation] = useLocation();
  const { id } = useParams();
  const inspectionId = id ? parseInt(id) : undefined;
  const { user } = useAuth();
  const { data, saveDraft, isCreating, isUpdating, setCurrentData } = useInspection(inspectionId);
  const { toast } = useToast();
  
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Load selected client from session storage
  useEffect(() => {
    const clientData = sessionStorage.getItem("vigitel_selected_client");
    if (clientData) {
      try {
        setSelectedClient(JSON.parse(clientData));
      } catch (error) {
        console.error("Error parsing client data:", error);
      }
    }
  }, []);

  const form = useForm<z.infer<typeof basicInfoSchema>>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: {
      clientId: selectedClient?.id || null,
      protocol: "",
      date: new Date().toISOString().split('T')[0],
      enterprise: "Residencial",
      city: "",
      state: "PR",
      address: "",
      cep: "",
      subject: "",
      status: "pending",
    },
  });

  // Update form when inspection data loads
  useEffect(() => {
    if (data.inspection) {
      const inspection = data.inspection;
      form.reset({
        clientId: inspection.clientId,
        protocol: inspection.protocol,
        date: new Date(inspection.date).toISOString().split('T')[0],
        enterprise: inspection.enterprise,
        city: inspection.city,
        state: inspection.state,
        address: inspection.address,
        cep: inspection.cep,
        subject: inspection.subject,
        status: inspection.status,
      });
    }
  }, [data.inspection, form]);

  const generateProtocol = () => {
    const prefix = "FAR";
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    return `${prefix}${timestamp}${random}`;
  };

  // Generate protocol on mount if empty
  useEffect(() => {
    if (!form.getValues("protocol")) {
      form.setValue("protocol", generateProtocol());
    }
  }, [form]);

  const handleSaveDraft = async () => {
    const formData = form.getValues();
    const inspectionData = {
      ...formData,
      userId: user!.id,
      clientId: selectedClient?.id || null,
      date: new Date(formData.date),
      totalArea: 0,
    };

    try {
      await saveDraft({ inspection: inspectionData });
      toast({
        title: "Rascunho salvo",
        description: "Dados salvos com sucesso",
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
    const formData = form.getValues();
    
    // Validate required fields
    const errors = form.formState.errors;
    if (Object.keys(errors).length > 0) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    // Store data in current inspection context
    const inspectionData = {
      ...formData,
      userId: user!.id,
      clientId: selectedClient?.id || null,
      date: new Date(formData.date),
      totalArea: 0,
    };

    setCurrentData(prev => ({ ...prev, inspection: inspectionData as any, client: selectedClient || undefined }));

    // Navigate to next step
    if (inspectionId) {
      setLocation(`/inspection/${inspectionId}/tiles`);
    } else {
      setLocation("/inspection/tiles");
    }
  };

  const brazilianStates = [
    { value: "AC", label: "AC - Acre" },
    { value: "AL", label: "AL - Alagoas" },
    { value: "AP", label: "AP - Amapá" },
    { value: "AM", label: "AM - Amazonas" },
    { value: "BA", label: "BA - Bahia" },
    { value: "CE", label: "CE - Ceará" },
    { value: "DF", label: "DF - Distrito Federal" },
    { value: "ES", label: "ES - Espírito Santo" },
    { value: "GO", label: "GO - Goiás" },
    { value: "MA", label: "MA - Maranhão" },
    { value: "MT", label: "MT - Mato Grosso" },
    { value: "MS", label: "MS - Mato Grosso do Sul" },
    { value: "MG", label: "MG - Minas Gerais" },
    { value: "PA", label: "PA - Pará" },
    { value: "PB", label: "PB - Paraíba" },
    { value: "PR", label: "PR - Paraná" },
    { value: "PE", label: "PE - Pernambuco" },
    { value: "PI", label: "PI - Piauí" },
    { value: "RJ", label: "RJ - Rio de Janeiro" },
    { value: "RN", label: "RN - Rio Grande do Norte" },
    { value: "RS", label: "RS - Rio Grande do Sul" },
    { value: "RO", label: "RO - Rondônia" },
    { value: "RR", label: "RR - Roraima" },
    { value: "SC", label: "SC - Santa Catarina" },
    { value: "SP", label: "SP - São Paulo" },
    { value: "SE", label: "SE - Sergipe" },
    { value: "TO", label: "TO - Tocantins" },
  ];

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
            onClick={() => setLocation("/inspection/client")}
            className="mr-4"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-gray-900">Informações Básicas</h1>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSaveDraft}
              disabled={isCreating || isUpdating}
              className="text-blue-600 font-medium mt-1 p-0 h-auto"
            >
              <Save className="w-4 h-4 mr-1" />
              {isCreating || isUpdating ? "Salvando..." : "Salvar Rascunho"}
            </Button>
          </div>
        </div>
        
        <ProgressBar 
          currentStep={2} 
          totalSteps={5} 
          stepLabels={["Cliente", "Informações", "Telhas", "Não Conformidades", "Revisão"]} 
        />
        <p className="text-sm text-gray-600 text-center mt-2">Etapa 2 de 5: Informações Básicas</p>
      </header>

      <div className="p-4 pb-24 space-y-6">
        <Form {...form}>
          {/* Selected Client Display */}
          {selectedClient && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-blue-800">{selectedClient.name}</div>
                    <div className="text-sm text-blue-600">{selectedClient.document}</div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setLocation("/inspection/client")}
                    className="text-blue-700 hover:text-blue-800"
                  >
                    Alterar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Date and Location */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data da Vistoria <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input type="date" {...field} className="h-12" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="enterprise"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Empreendimento <span className="text-red-500">*</span></FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-12">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Residencial">Residencial</SelectItem>
                      <SelectItem value="Comercial">Comercial</SelectItem>
                      <SelectItem value="Industrial">Industrial</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cidade <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="Curitiba" {...field} className="h-12" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado <span className="text-red-500">*</span></FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-12">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {brazilianStates.map((state) => (
                        <SelectItem key={state.value} value={state.value}>
                          {state.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Endereço <span className="text-red-500">*</span></FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Rua, número, bairro..." 
                    rows={3} 
                    {...field}
                    className="resize-none"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="cep"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CEP <span className="text-red-500">*</span></FormLabel>
                <FormControl>
                  <Input 
                    placeholder="XXXXX-XXX" 
                    {...field}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "");
                      const formatted = value.replace(/(\d{5})(\d{3})/, "$1-$2");
                      field.onChange(formatted);
                    }}
                    className="h-12"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Protocol and Subject */}
          <FormField
            control={form.control}
            name="protocol"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Protocolo FAR <span className="text-red-500">*</span></FormLabel>
                <FormControl>
                  <Input {...field} className="h-12" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="subject"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Assunto <span className="text-red-500">*</span></FormLabel>
                <FormControl>
                  <Input placeholder="Infiltrações no telhado" {...field} className="h-12" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Team Information */}
          <Card className="bg-gray-50">
            <CardContent className="p-4">
              <h3 className="font-medium text-gray-900 mb-3">Equipe Responsável</h3>
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-1">Técnico Responsável</Label>
                  <Input value={user.name} readOnly className="bg-white" />
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <Label className="font-medium text-gray-700 mb-1">Departamento</Label>
                    <Input value={user.department} readOnly className="bg-gray-100" />
                  </div>
                  <div>
                    <Label className="font-medium text-gray-700 mb-1">Unidade</Label>
                    <Input value={user.unit} readOnly className="bg-gray-100" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <Label className="font-medium text-gray-700 mb-1">Coordenador</Label>
                    <Input value={user.coordinator} readOnly className="bg-gray-100" />
                  </div>
                  <div>
                    <Label className="font-medium text-gray-700 mb-1">Gerente</Label>
                    <Input value={user.manager} readOnly className="bg-gray-100" />
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-1">Regional</Label>
                  <Input value={user.regional} readOnly className="bg-gray-100" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Form>
      </div>

      {/* Fixed Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 max-w-md mx-auto">
        <div className="flex space-x-4">
          <Button 
            variant="outline" 
            onClick={() => setLocation("/inspection/client")}
            className="flex-1 h-12"
          >
            Voltar
          </Button>
          <Button 
            onClick={handleNext}
            className="flex-1 h-12 bg-blue-600 hover:bg-blue-700"
          >
            Próximo
          </Button>
        </div>
      </div>
    </div>
  );
}
