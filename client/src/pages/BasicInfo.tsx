import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save } from 'lucide-react';
import { ProgressBar } from '@/components/ProgressBar';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { saveInspectionOffline } from '@/lib/indexedDB';

const basicInfoSchema = z.object({
  inspectionDate: z.string().min(1, 'Data é obrigatória'),
  projectType: z.string().min(1, 'Tipo de empreendimento é obrigatório'),
  city: z.string().min(1, 'Cidade é obrigatória'),
  state: z.string().min(1, 'Estado é obrigatório'),
  address: z.string().min(1, 'Endereço é obrigatório'),
  zipCode: z.string().min(1, 'CEP é obrigatório'),
  protocol: z.string().min(1, 'Protocolo é obrigatório'),
  subject: z.string().min(1, 'Assunto é obrigatório'),
  technician: z.string().min(1, 'Técnico é obrigatório'),
});

type BasicInfoForm = z.infer<typeof basicInfoSchema>;

const BRAZILIAN_STATES = [
  { value: 'AC', label: 'AC - Acre' },
  { value: 'AL', label: 'AL - Alagoas' },
  { value: 'AP', label: 'AP - Amapá' },
  { value: 'AM', label: 'AM - Amazonas' },
  { value: 'BA', label: 'BA - Bahia' },
  { value: 'CE', label: 'CE - Ceará' },
  { value: 'DF', label: 'DF - Distrito Federal' },
  { value: 'ES', label: 'ES - Espírito Santo' },
  { value: 'GO', label: 'GO - Goiás' },
  { value: 'MA', label: 'MA - Maranhão' },
  { value: 'MT', label: 'MT - Mato Grosso' },
  { value: 'MS', label: 'MS - Mato Grosso do Sul' },
  { value: 'MG', label: 'MG - Minas Gerais' },
  { value: 'PA', label: 'PA - Pará' },
  { value: 'PB', label: 'PB - Paraíba' },
  { value: 'PR', label: 'PR - Paraná' },
  { value: 'PE', label: 'PE - Pernambuco' },
  { value: 'PI', label: 'PI - Piauí' },
  { value: 'RJ', label: 'RJ - Rio de Janeiro' },
  { value: 'RN', label: 'RN - Rio Grande do Norte' },
  { value: 'RS', label: 'RS - Rio Grande do Sul' },
  { value: 'RO', label: 'RO - Rondônia' },
  { value: 'RR', label: 'RR - Roraima' },
  { value: 'SC', label: 'SC - Santa Catarina' },
  { value: 'SP', label: 'SP - São Paulo' },
  { value: 'SE', label: 'SE - Sergipe' },
  { value: 'TO', label: 'TO - Tocantins' },
];

export default function BasicInfo() {
  const [, setLocation] = useLocation();
  const [selectedClient, setSelectedClient] = useState<any>(null);

  const form = useForm<BasicInfoForm>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: {
      inspectionDate: new Date().toISOString().split('T')[0],
      projectType: 'Residencial',
      city: '',
      state: 'PR',
      address: '',
      zipCode: '',
      protocol: `FAR${Date.now().toString().slice(-6)}`,
      subject: '',
      technician: 'João Silva',
    },
  });

  useEffect(() => {
    // Load selected client from session storage
    const clientData = sessionStorage.getItem('selectedClient');
    if (clientData) {
      setSelectedClient(JSON.parse(clientData));
    }
  }, []);

  const handleSaveDraft = async () => {
    const formData = form.getValues();
    const draftId = `draft-${Date.now()}`;
    
    await saveInspectionOffline(draftId, {
      step: 'basic-info',
      client: selectedClient,
      basicInfo: formData,
    });
    
    // Show toast notification
  };

  const handleContinue = async (data: BasicInfoForm) => {
    // Save to session storage for next step
    sessionStorage.setItem('basicInfo', JSON.stringify(data));
    
    // Save as draft
    await handleSaveDraft();
    
    setLocation('/inspection/tiles');
  };

  return (
    <div className="min-h-screen bg-surface">
      <ConnectionStatus />
      
      {/* Header */}
      <header className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/inspection/new')}
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
                className="text-brasilit-blue text-sm p-0 h-auto mt-1"
              >
                <Save className="w-3 h-3 mr-1" />
                Salvar Rascunho
              </Button>
            </div>
          </div>
          
          <ProgressBar
            currentStep={2}
            totalSteps={5}
            stepLabels={['Cliente', 'Informações', 'Telhas', 'Não Conformidades', 'Revisão']}
          />
        </div>
      </header>

      <form onSubmit={form.handleSubmit(handleContinue)} className="p-4 max-w-md mx-auto pb-32 space-y-4">
        {/* Date and Project Type */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="inspectionDate">
              Data da Vistoria <span className="text-red-500">*</span>
            </Label>
            <Input
              {...form.register('inspectionDate')}
              type="date"
              className="mt-1"
            />
            {form.formState.errors.inspectionDate && (
              <p className="text-red-500 text-xs mt-1">{form.formState.errors.inspectionDate.message}</p>
            )}
          </div>
          
          <div>
            <Label htmlFor="projectType">
              Empreendimento <span className="text-red-500">*</span>
            </Label>
            <Select value={form.watch('projectType')} onValueChange={(value) => form.setValue('projectType', value)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Residencial">Residencial</SelectItem>
                <SelectItem value="Comercial">Comercial</SelectItem>
                <SelectItem value="Industrial">Industrial</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* City and State */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="city">
              Cidade <span className="text-red-500">*</span>
            </Label>
            <Input
              {...form.register('city')}
              placeholder="Curitiba"
              className="mt-1"
            />
            {form.formState.errors.city && (
              <p className="text-red-500 text-xs mt-1">{form.formState.errors.city.message}</p>
            )}
          </div>
          
          <div>
            <Label htmlFor="state">
              Estado <span className="text-red-500">*</span>
            </Label>
            <Select value={form.watch('state')} onValueChange={(value) => form.setValue('state', value)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BRAZILIAN_STATES.map(state => (
                  <SelectItem key={state.value} value={state.value}>
                    {state.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Address */}
        <div>
          <Label htmlFor="address">
            Endereço <span className="text-red-500">*</span>
          </Label>
          <Textarea
            {...form.register('address')}
            placeholder="Rua, número, bairro..."
            rows={3}
            className="mt-1 resize-none"
          />
          {form.formState.errors.address && (
            <p className="text-red-500 text-xs mt-1">{form.formState.errors.address.message}</p>
          )}
        </div>

        {/* ZIP Code */}
        <div>
          <Label htmlFor="zipCode">
            CEP <span className="text-red-500">*</span>
          </Label>
          <Input
            {...form.register('zipCode')}
            placeholder="XXXXX-XXX"
            className="mt-1"
          />
          {form.formState.errors.zipCode && (
            <p className="text-red-500 text-xs mt-1">{form.formState.errors.zipCode.message}</p>
          )}
        </div>

        {/* Protocol and Subject */}
        <div>
          <Label htmlFor="protocol">
            Protocolo FAR <span className="text-red-500">*</span>
          </Label>
          <Input
            {...form.register('protocol')}
            className="mt-1"
          />
          {form.formState.errors.protocol && (
            <p className="text-red-500 text-xs mt-1">{form.formState.errors.protocol.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="subject">
            Assunto <span className="text-red-500">*</span>
          </Label>
          <Input
            {...form.register('subject')}
            placeholder="Infiltrações no telhado"
            className="mt-1"
          />
          {form.formState.errors.subject && (
            <p className="text-red-500 text-xs mt-1">{form.formState.errors.subject.message}</p>
          )}
        </div>

        {/* Team Information */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-3">Equipe Responsável</h3>
          <div className="space-y-3">
            <div>
              <Label htmlFor="technician">Técnico Responsável</Label>
              <Input
                {...form.register('technician')}
                className="mt-1 bg-white"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <Label>Departamento</Label>
                <Input value="Assistência Técnica" readOnly className="mt-1 bg-gray-100" />
              </div>
              <div>
                <Label>Unidade</Label>
                <Input value="PR" readOnly className="mt-1 bg-gray-100" />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <Label>Coordenador</Label>
                <Input value="Marlon Weingartner" readOnly className="mt-1 bg-gray-100" />
              </div>
              <div>
                <Label>Gerente</Label>
                <Input value="Elisabete Kudo" readOnly className="mt-1 bg-gray-100" />
              </div>
            </div>
            
            <div>
              <Label>Regional</Label>
              <Input value="Sul" readOnly className="mt-1 bg-gray-100" />
            </div>
          </div>
        </div>
      </form>

      {/* Fixed Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 max-w-md mx-auto">
        <div className="flex space-x-4">
          <Button
            type="button"
            onClick={() => setLocation('/inspection/new')}
            variant="secondary"
            className="flex-1 h-12"
          >
            Voltar
          </Button>
          <Button
            onClick={form.handleSubmit(handleContinue)}
            className="flex-1 bg-brasilit-blue hover:bg-brasilit-dark text-white h-12"
          >
            Próximo
          </Button>
        </div>
      </div>
    </div>
  );
}
