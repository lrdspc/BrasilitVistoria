import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowLeft, Save } from "lucide-react";
import { ProgressBar } from "@/components/layout/progress-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const basicInfoSchema = z.object({
  date: z.string().min(1, "Data é obrigatória"),
  projectType: z.string().min(1, "Tipo de empreendimento é obrigatório"),
  city: z.string().min(1, "Cidade é obrigatória"),
  state: z.string().min(1, "Estado é obrigatório"),
  address: z.string().min(1, "Endereço é obrigatório"),
  zipCode: z.string().min(8, "CEP é obrigatório"),
  protocol: z.string().min(1, "Protocolo FAR é obrigatório"),
  subject: z.string().min(1, "Assunto é obrigatório"),
  technician: z.string().min(1, "Técnico responsável é obrigatório"),
});

type BasicInfoData = z.infer<typeof basicInfoSchema>;

export default function BasicInfo() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const form = useForm<BasicInfoData>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      projectType: "",
      city: "",
      state: "PR",
      address: "",
      zipCode: "",
      protocol: `FAR${Date.now().toString().slice(-6)}`,
      subject: "",
      technician: "João Silva",
    },
  });

  // Load saved data on component mount
  useEffect(() => {
    const savedData = localStorage.getItem("basicInfoData");
    if (savedData) {
      const parsed = JSON.parse(savedData);
      Object.keys(parsed).forEach(key => {
        form.setValue(key as keyof BasicInfoData, parsed[key]);
      });
    }
  }, [form]);

  // Auto-save on form changes
  useEffect(() => {
    const subscription = form.watch((data) => {
      localStorage.setItem("basicInfoData", JSON.stringify(data));
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const handleSaveDraft = () => {
    const formData = form.getValues();
    localStorage.setItem("basicInfoData", JSON.stringify(formData));
    toast({
      title: "Rascunho salvo",
      description: "Suas informações foram salvas localmente",
    });
  };

  const handleNext = (data: BasicInfoData) => {
    localStorage.setItem("basicInfoData", JSON.stringify(data));
    setLocation("/inspection/tile-selection");
  };

  const handleZipCodeLookup = async (zipCode: string) => {
    if (zipCode.length === 8) {
      try {
        // In a real implementation, this would call ViaCEP API
        form.setValue("city", "Curitiba");
        form.setValue("state", "PR");
        form.setValue("address", "Rua Example, 123 - Centro");
        toast({
          title: "Endereço encontrado",
          description: "Endereço preenchido automaticamente",
        });
      } catch (error) {
        toast({
          title: "CEP não encontrado",
          description: "Verifique o CEP informado",
          variant: "destructive",
        });
      }
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
            onClick={() => setLocation("/inspection/client-selection")}
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
              className="text-blue-600 p-0 h-auto"
            >
              <Save className="w-4 h-4 mr-1" />
              Salvar Rascunho
            </Button>
          </div>
        </div>
        
        <ProgressBar currentStep={2} totalSteps={5} stepLabel="Informações Básicas" />
      </header>

      <div className="p-4 pb-24">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleNext)} className="space-y-4">
            {/* Date and Project Type */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Data da Vistoria <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input type="date" {...field} className="form-input" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="projectType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Empreendimento <span className="text-red-500">*</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="residential">Residencial</SelectItem>
                        <SelectItem value="commercial">Comercial</SelectItem>
                        <SelectItem value="industrial">Industrial</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* City and State */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Cidade <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Curitiba" {...field} className="form-input" />
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
                    <FormLabel>
                      Estado <span className="text-red-500">*</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="PR">PR - Paraná</SelectItem>
                        <SelectItem value="SP">SP - São Paulo</SelectItem>
                        <SelectItem value="RJ">RJ - Rio de Janeiro</SelectItem>
                        <SelectItem value="MG">MG - Minas Gerais</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Address */}
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Endereço <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Rua, número, bairro..."
                      rows={3}
                      {...field}
                      className="form-input resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ZIP Code */}
            <FormField
              control={form.control}
              name="zipCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    CEP <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="XXXXX-XXX"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        const zipCode = e.target.value.replace(/\D/g, '');
                        if (zipCode.length === 8) {
                          handleZipCodeLookup(zipCode);
                        }
                      }}
                      className="form-input"
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
                  <FormLabel>
                    Protocolo FAR <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input {...field} className="form-input" />
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
                  <FormLabel>
                    Assunto <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Infiltrações no telhado"
                      {...field}
                      className="form-input"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Team Information */}
            <Card className="bg-gray-50">
              <CardHeader>
                <CardTitle className="text-base">Equipe Responsável</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <FormField
                  control={form.control}
                  name="technician"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Técnico Responsável</FormLabel>
                      <FormControl>
                        <Input {...field} className="bg-white" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <FormLabel>Departamento</FormLabel>
                    <Input value="Assistência Técnica" readOnly className="bg-gray-100" />
                  </div>
                  <div>
                    <FormLabel>Unidade</FormLabel>
                    <Input value="PR" readOnly className="bg-gray-100" />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <FormLabel>Coordenador</FormLabel>
                    <Input value="Marlon Weingartner" readOnly className="bg-gray-100" />
                  </div>
                  <div>
                    <FormLabel>Gerente</FormLabel>
                    <Input value="Elisabete Kudo" readOnly className="bg-gray-100" />
                  </div>
                </div>
                
                <div>
                  <FormLabel>Regional</FormLabel>
                  <Input value="Sul" readOnly className="bg-gray-100" />
                </div>
              </CardContent>
            </Card>
          </form>
        </Form>
      </div>

      {/* Fixed Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 max-w-md mx-auto">
        <div className="flex space-x-4">
          <Button
            onClick={() => setLocation("/inspection/client-selection")}
            variant="outline"
            className="flex-1 touch-button"
          >
            Voltar
          </Button>
          <Button
            onClick={form.handleSubmit(handleNext)}
            className="flex-1 touch-button bg-blue-600 hover:bg-blue-700"
          >
            Próximo
          </Button>
        </div>
      </div>
    </div>
  );
}
