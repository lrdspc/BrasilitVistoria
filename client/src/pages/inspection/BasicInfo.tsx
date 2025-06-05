import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save } from 'lucide-react';
import { ProgressBar } from '@/components/ProgressBar';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface BasicInfoProps {
  onBack: () => void;
  onNext: (data: any) => void;
  initialData?: any;
  user: any;
}

export function BasicInfo({ onBack, onNext, initialData, user }: BasicInfoProps) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    empreendimento: 'Residencial',
    city: 'Curitiba',
    state: 'PR',
    address: '',
    cep: '',
    protocol: '',
    subject: '',
    technician: user?.name || 'João Silva',
    department: 'Assistência Técnica',
    unit: 'PR',
    coordinator: 'Marlon Weingartner',
    manager: 'Elisabete Kudo',
    regional: 'Sul',
    ...initialData,
  });

  const { toast } = useToast();

  const { data: protocolData } = useQuery({
    queryKey: ['/api/generate-protocol'],
    queryFn: async () => {
      const response = await fetch('/api/generate-protocol');
      if (!response.ok) throw new Error('Failed to generate protocol');
      return response.json();
    },
    enabled: !formData.protocol,
  });

  useEffect(() => {
    if (protocolData?.protocol && !formData.protocol) {
      setFormData(prev => ({ ...prev, protocol: protocolData.protocol }));
    }
  }, [protocolData, formData.protocol]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveDraft = () => {
    // Save to local storage for offline capability
    localStorage.setItem('vigitel-inspection-draft', JSON.stringify(formData));
    toast({
      title: "Rascunho salvo",
      description: "Suas informações foram salvas localmente.",
    });
  };

  const handleNext = () => {
    // Validate required fields
    const requiredFields = ['date', 'empreendimento', 'city', 'state', 'address', 'cep', 'protocol', 'subject'];
    const missingFields = requiredFields.filter(field => !formData[field]);

    if (missingFields.length > 0) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos marcados com *",
        variant: "destructive",
      });
      return;
    }

    // Validate date is not in the future
    if (new Date(formData.date) > new Date()) {
      toast({
        title: "Data inválida",
        description: "A data da vistoria não pode ser futura.",
        variant: "destructive",
      });
      return;
    }

    onNext(formData);
  };

  const stepLabels = ['Cliente', 'Informações Básicas', 'Telhas', 'Não Conformidades', 'Revisão'];

  const brazilianStates = [
    { code: 'AC', name: 'AC - Acre' },
    { code: 'AL', name: 'AL - Alagoas' },
    { code: 'AP', name: 'AP - Amapá' },
    { code: 'AM', name: 'AM - Amazonas' },
    { code: 'BA', name: 'BA - Bahia' },
    { code: 'CE', name: 'CE - Ceará' },
    { code: 'DF', name: 'DF - Distrito Federal' },
    { code: 'ES', name: 'ES - Espírito Santo' },
    { code: 'GO', name: 'GO - Goiás' },
    { code: 'MA', name: 'MA - Maranhão' },
    { code: 'MT', name: 'MT - Mato Grosso' },
    { code: 'MS', name: 'MS - Mato Grosso do Sul' },
    { code: 'MG', name: 'MG - Minas Gerais' },
    { code: 'PA', name: 'PA - Pará' },
    { code: 'PB', name: 'PB - Paraíba' },
    { code: 'PR', name: 'PR - Paraná' },
    { code: 'PE', name: 'PE - Pernambuco' },
    { code: 'PI', name: 'PI - Piauí' },
    { code: 'RJ', name: 'RJ - Rio de Janeiro' },
    { code: 'RN', name: 'RN - Rio Grande do Norte' },
    { code: 'RS', name: 'RS - Rio Grande do Sul' },
    { code: 'RO', name: 'RO - Rondônia' },
    { code: 'RR', name: 'RR - Roraima' },
    { code: 'SC', name: 'SC - Santa Catarina' },
    { code: 'SP', name: 'SP - São Paulo' },
    { code: 'SE', name: 'SE - Sergipe' },
    { code: 'TO', name: 'TO - Tocantins' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header with Progress */}
      <header className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center mb-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="mr-4">
            <ArrowLeft size={20} />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-gray-900">Informações Básicas</h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSaveDraft}
              className="text-sm text-brasilit-blue p-0 h-auto"
            >
              <Save size={14} className="mr-1" />
              Salvar Rascunho
            </Button>
          </div>
        </div>
        <ProgressBar currentStep={2} totalSteps={5} stepLabels={stepLabels} />
      </header>

      <div className="p-4 pb-20 space-y-4">
        {/* Date and Location */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-2">
              Data da Vistoria <span className="text-red-500">*</span>
            </Label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              className="py-3 h-auto"
            />
          </div>
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-2">
              Empreendimento <span className="text-red-500">*</span>
            </Label>
            <Select value={formData.empreendimento} onValueChange={(value) => handleInputChange('empreendimento', value)}>
              <SelectTrigger className="py-3 h-auto">
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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-2">
              Cidade <span className="text-red-500">*</span>
            </Label>
            <Input
              type="text"
              value={formData.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
              placeholder="Curitiba"
              className="py-3 h-auto"
            />
          </div>
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-2">
              Estado <span className="text-red-500">*</span>
            </Label>
            <Select value={formData.state} onValueChange={(value) => handleInputChange('state', value)}>
              <SelectTrigger className="py-3 h-auto">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {brazilianStates.map((state) => (
                  <SelectItem key={state.code} value={state.code}>
                    {state.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label className="block text-sm font-medium text-gray-700 mb-2">
            Endereço <span className="text-red-500">*</span>
          </Label>
          <Textarea
            value={formData.address}
            onChange={(e) => handleInputChange('address', e.target.value)}
            placeholder="Rua, número, bairro..."
            rows={3}
            className="py-3 resize-none"
          />
        </div>

        <div>
          <Label className="block text-sm font-medium text-gray-700 mb-2">
            CEP <span className="text-red-500">*</span>
          </Label>
          <Input
            type="text"
            value={formData.cep}
            onChange={(e) => handleInputChange('cep', e.target.value)}
            placeholder="XXXXX-XXX"
            className="py-3 h-auto"
          />
        </div>

        {/* Protocol and Subject */}
        <div>
          <Label className="block text-sm font-medium text-gray-700 mb-2">
            Protocolo FAR <span className="text-red-500">*</span>
          </Label>
          <Input
            type="text"
            value={formData.protocol}
            onChange={(e) => handleInputChange('protocol', e.target.value)}
            className="py-3 h-auto"
          />
        </div>

        <div>
          <Label className="block text-sm font-medium text-gray-700 mb-2">
            Assunto <span className="text-red-500">*</span>
          </Label>
          <Input
            type="text"
            value={formData.subject}
            onChange={(e) => handleInputChange('subject', e.target.value)}
            placeholder="Infiltrações no telhado"
            className="py-3 h-auto"
          />
        </div>

        {/* Team Information */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-3">Equipe Responsável</h3>
          <div className="space-y-3">
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-1">Técnico Responsável</Label>
              <Input
                type="text"
                value={formData.technician}
                onChange={(e) => handleInputChange('technician', e.target.value)}
                className="py-2 bg-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <Label className="block font-medium text-gray-700 mb-1">Departamento</Label>
                <Input
                  type="text"
                  value={formData.department}
                  readOnly
                  className="py-2 bg-gray-100"
                />
              </div>
              <div>
                <Label className="block font-medium text-gray-700 mb-1">Unidade</Label>
                <Input
                  type="text"
                  value={formData.unit}
                  readOnly
                  className="py-2 bg-gray-100"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <Label className="block font-medium text-gray-700 mb-1">Coordenador</Label>
                <Input
                  type="text"
                  value={formData.coordinator}
                  readOnly
                  className="py-2 bg-gray-100"
                />
              </div>
              <div>
                <Label className="block font-medium text-gray-700 mb-1">Gerente</Label>
                <Input
                  type="text"
                  value={formData.manager}
                  readOnly
                  className="py-2 bg-gray-100"
                />
              </div>
            </div>
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-1">Regional</Label>
              <Input
                type="text"
                value={formData.regional}
                readOnly
                className="py-2 bg-gray-100"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 max-w-md mx-auto">
        <div className="flex space-x-4">
          <Button
            variant="outline"
            onClick={onBack}
            className="flex-1 py-4 h-auto"
          >
            Voltar
          </Button>
          <Button
            onClick={handleNext}
            className="flex-1 bg-brasilit-blue hover:bg-brasilit-dark py-4 h-auto"
          >
            Próximo
          </Button>
        </div>
      </div>
    </div>
  );
}
