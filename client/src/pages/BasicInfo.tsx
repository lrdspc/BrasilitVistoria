import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AppLayout } from "@/components/layouts/AppLayout";
import { ProgressBar } from "@/components/ProgressBar";
import { useVistoriaStore } from "@/stores/vistoriaStore";
import { ViaCepService } from "@/lib/viaCepService";
import { generateProtocol } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast"; // Added for toast notifications

const basicInfoSchema = z.object({
  date: z.date(),
  enterprise: z.string().min(1, "Empresa é obrigatória"),
  city: z.string().min(1, "Cidade é obrigatória"),
  state: z.string().min(2, "Estado é obrigatório"),
  address: z.string().min(1, "Endereço é obrigatório"),
  cep: z.string().regex(/^\d{5}-?\d{3}$/, "CEP inválido"),
  subject: z.string().min(1, "Assunto é obrigatório"),
});

type BasicInfoFormData = z.infer<typeof basicInfoSchema>;

export default function BasicInfo() {
  const [, setLocation] = useLocation();
  const { setBasicInfo, setCurrentStep, client, basicInfo: storeBasicInfo, currentStep: storeCurrentStep } = useVistoriaStore();
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const { toast } = useToast();

  const form = useForm<BasicInfoFormData>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: {
      date: storeBasicInfo.date || new Date(),
      enterprise: storeBasicInfo.enterprise || "",
      city: storeBasicInfo.city || "",
      state: storeBasicInfo.state || "PR",
      address: storeBasicInfo.address || "",
      cep: storeBasicInfo.cep || "",
      subject: storeBasicInfo.subject || "",
    },
  });

  const handleCepBlur = async (cep: string) => {
    const cleanedCep = cep.replace(/\D/g, "");
    if (ViaCepService.validateCep(cleanedCep)) {
      setIsLoadingCep(true);
      try {
        const addressInfo = await ViaCepService.searchByCep(cleanedCep);
        if (addressInfo && !addressInfo.erro) {
          form.setValue("address", addressInfo.logradouro || "");
          form.setValue("city", addressInfo.localidade || "");
          form.setValue("state", addressInfo.uf || "");
          toast({ title: "CEP encontrado", description: "Endereço preenchido automaticamente." });
        } else {
          toast({ title: "CEP não encontrado", variant: "destructive" });
        }
      } catch (error) {
        console.error("Erro ao buscar CEP:", error);
        toast({ title: "Erro ao buscar CEP", description: String(error), variant: "destructive" });
      } finally {
        setIsLoadingCep(false);
      }
    } else if (cep.length > 0) {
        toast({ title: "CEP inválido", description: "Por favor, insira um CEP válido.", variant: "destructive" });
    }
  };

  const onSubmit = (data: BasicInfoFormData) => {
    const completeBasicInfo = {
      ...data,
      protocol: storeBasicInfo.protocol || generateProtocol(), // Preserve existing protocol or generate new
    };
    setBasicInfo(completeBasicInfo);
    setCurrentStep(3); // As per guide, next step is Tiles (3)
    setLocation("/inspection/tiles");
  };

  const handleGoBack = () => {
    // Save current form data to store before going back
    const currentData = form.getValues();
    setBasicInfo({
        ...currentData,
        date: new Date(currentData.date), // ensure date is Date object
        protocol: storeBasicInfo.protocol || generateProtocol(), // keep protocol
    });
    setCurrentStep(1); // Previous step is Client Selection (1)
    setLocation("/inspection/client-selection");
  }

  const brazilianStates = [
    { value: "AC", label: "AC - Acre" }, { value: "AL", label: "AL - Alagoas" }, { value: "AP", label: "AP - Amapá" },
    { value: "AM", label: "AM - Amazonas" }, { value: "BA", label: "BA - Bahia" }, { value: "CE", label: "CE - Ceará" },
    { value: "DF", label: "DF - Distrito Federal" }, { value: "ES", label: "ES - Espírito Santo" }, { value: "GO", label: "GO - Goiás" },
    { value: "MA", label: "MA - Maranhão" }, { value: "MT", label: "MT - Mato Grosso" }, { value: "MS", label: "MS - Mato Grosso do Sul" },
    { value: "MG", label: "MG - Minas Gerais" }, { value: "PA", label: "PA - Pará" }, { value: "PB", label: "PB - Paraíba" },
    { value: "PR", label: "PR - Paraná" }, { value: "PE", label: "PE - Pernambuco" }, { value: "PI", label: "PI - Piauí" },
    { value: "RJ", label: "RJ - Rio de Janeiro" }, { value: "RN", label: "RN - Rio Grande do Norte" }, { value: "RS", label: "RS - Rio Grande do Sul" },
    { value: "RO", label: "RO - Rondônia" }, { value: "RR", label: "RR - Roraima" }, { value: "SC", label: "SC - Santa Catarina" },
    { value: "SP", label: "SP - São Paulo" }, { value: "SE", label: "SE - Sergipe" }, { value: "TO", label: "TO - Tocantins" }
  ];

  return (
    <AppLayout title="Informações Básicas" showSidebar={false}>
      <div className="max-w-2xl mx-auto space-y-6 p-4 md:p-6">
        <ProgressBar 
          currentStep={storeCurrentStep || 2}
          totalSteps={5} 
          stepLabels={["Cliente", "Informações", "Telhas", "Não Conformidades", "Revisão"]} 
        />

        {client && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-blue-800">{client.name}</div>
                  <div className="text-sm text-blue-600">{client.document}</div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setCurrentStep(1);
                    setLocation("/inspection/client-selection");
                  }}
                  className="text-blue-700 hover:text-blue-800"
                >
                  Alterar Cliente
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Detalhes da Vistoria</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data da Vistoria <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : field.value}
                          onChange={(e) => field.onChange(new Date(e.target.value))}
                          className="h-12"
                        />
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
                            <SelectValue placeholder="Selecione o tipo de empreendimento" />
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
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assunto <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Vistoria de rotina, Análise de infiltração" {...field} className="h-12" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Localização</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
                          onBlur={(e) => {
                            field.onBlur(); // RHF internal blur handler
                            handleCepBlur(e.target.value);
                          }}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, "");
                            let formatted = value;
                            if (value.length > 5) {
                                formatted = value.replace(/(\d{5})(\d{0,3})/, "$1-$2");
                            }
                            field.onChange(formatted);
                          }}
                          maxLength={9}
                          className="h-12"
                        />
                      </FormControl>
                      {isLoadingCep && <FormDescription>Buscando CEP...</FormDescription>}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Endereço <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Rua, Número, Bairro" {...field} className="h-12" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                              <SelectValue placeholder="Selecione o estado" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {brazilianStates.map((s) => (
                              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between mt-8">
              <Button type="button" variant="outline" onClick={handleGoBack} className="h-12 px-6">
                Voltar
              </Button>
              <Button type="submit" className="h-12 px-6 bg-blue-600 hover:bg-blue-700">
                Próximo
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </AppLayout>
  );
}
