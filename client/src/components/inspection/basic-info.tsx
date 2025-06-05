import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { InspectionFormData, ENTERPRISE_OPTIONS, BRAZILIAN_STATES } from '@/types/inspection';
import { useToast } from '@/hooks/use-toast';

interface BasicInfoProps {
  formData: InspectionFormData;
  onUpdate: (field: keyof InspectionFormData, value: any) => void;
  onSaveDraft: () => void;
  onNext: () => void;
  onBack: () => void;
}

export function BasicInfo({ formData, onUpdate, onSaveDraft, onNext, onBack }: BasicInfoProps) {
  const [protocolChecking, setProtocolChecking] = useState(false);
  const [protocolValid, setProtocolValid] = useState(true);
  const { toast } = useToast();

  // Auto-generate protocol if empty
  useEffect(() => {
    if (!formData.protocol) {
      const prefix = 'FAR';
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
      onUpdate('protocol', `${prefix}${timestamp}${random}`);
    }
  }, [formData.protocol, onUpdate]);

  const validateProtocol = async (protocol: string) => {
    if (!protocol) return;
    
    setProtocolChecking(true);
    try {
      const response = await fetch(`/api/protocols/validate/${protocol}`);
      const result = await response.json();
      setProtocolValid(result.available);
      
      if (!result.available) {
        toast({
          title: "Protocolo já existe",
          description: "Este protocolo já está em uso. Por favor, use outro.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Protocol validation failed:', error);
    } finally {
      setProtocolChecking(false);
    }
  };

  const handleCepChange = async (cep: string) => {
    onUpdate('cep', cep);
    
    // Auto-fill address from CEP if valid format
    const cepRegex = /^\d{5}-?\d{3}$/;
    if (cepRegex.test(cep)) {
      try {
        const cleanCep = cep.replace('-', '');
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await response.json();
        
        if (!data.erro) {
          onUpdate('address', `${data.logradouro}, ${data.bairro}`);
          onUpdate('city', data.localidade);
          onUpdate('state', data.uf);
        }
      } catch (error) {
        console.error('CEP lookup failed:', error);
      }
    }
  };

  const isFormValid = () => {
    return formData.date && 
           formData.enterprise && 
           formData.city && 
           formData.state && 
           formData.address && 
           formData.cep && 
           formData.protocol && 
           protocolValid &&
           formData.subject && 
           formData.technicianName;
  };

  return (
    <div className="p-4 pb-20 space-y-4">
      {/* Date and Location */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
            Data da Vistoria <span className="text-red-500">*</span>
          </Label>
          <Input
            id="date"
            type="date"
            value={formData.date}
            onChange={(e) => onUpdate('date', e.target.value)}
            max={new Date().toISOString().split('T')[0]}
          />
        </div>
        <div>
          <Label htmlFor="enterprise" className="block text-sm font-medium text-gray-700 mb-2">
            Empreendimento <span className="text-red-500">*</span>
          </Label>
          <Select value={formData.enterprise} onValueChange={(value) => onUpdate('enterprise', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ENTERPRISE_OPTIONS.map(option => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
            Cidade <span className="text-red-500">*</span>
          </Label>
          <Input
            id="city"
            placeholder="Curitiba"
            value={formData.city}
            onChange={(e) => onUpdate('city', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
            Estado <span className="text-red-500">*</span>
          </Label>
          <Select value={formData.state} onValueChange={(value) => onUpdate('state', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BRAZILIAN_STATES.map(state => (
                <SelectItem key={state.code} value={state.code}>
                  {state.code} - {state.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
          Endereço <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="address"
          placeholder="Rua, número, bairro..."
          rows={3}
          value={formData.address}
          onChange={(e) => onUpdate('address', e.target.value)}
          className="resize-none"
        />
      </div>

      <div>
        <Label htmlFor="cep" className="block text-sm font-medium text-gray-700 mb-2">
          CEP <span className="text-red-500">*</span>
        </Label>
        <Input
          id="cep"
          placeholder="XXXXX-XXX"
          value={formData.cep}
          onChange={(e) => handleCepChange(e.target.value)}
        />
      </div>

      {/* Protocol and Subject */}
      <div>
        <Label htmlFor="protocol" className="block text-sm font-medium text-gray-700 mb-2">
          Protocolo FAR <span className="text-red-500">*</span>
        </Label>
        <div className="relative">
          <Input
            id="protocol"
            value={formData.protocol}
            onChange={(e) => onUpdate('protocol', e.target.value)}
            onBlur={(e) => validateProtocol(e.target.value)}
            className={!protocolValid ? 'border-red-500' : ''}
          />
          {protocolChecking && (
            <div className="absolute right-3 top-3">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
            </div>
          )}
        </div>
        {!protocolValid && (
          <p className="text-red-500 text-sm mt-1">Este protocolo já está em uso</p>
        )}
      </div>

      <div>
        <Label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
          Assunto <span className="text-red-500">*</span>
        </Label>
        <Input
          id="subject"
          placeholder="Infiltrações no telhado"
          value={formData.subject}
          onChange={(e) => onUpdate('subject', e.target.value)}
          maxLength={100}
        />
      </div>

      {/* Team Information */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-3">Equipe Responsável</h3>
        <div className="space-y-3">
          <div>
            <Label htmlFor="technician" className="block text-sm font-medium text-gray-700 mb-1">
              Técnico Responsável
            </Label>
            <Input
              id="technician"
              value={formData.technicianName}
              onChange={(e) => onUpdate('technicianName', e.target.value)}
              placeholder="Nome do técnico"
            />
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <Label className="block font-medium text-gray-700 mb-1">Departamento</Label>
              <Input value="Assistência Técnica" readOnly className="bg-gray-100" />
            </div>
            <div>
              <Label className="block font-medium text-gray-700 mb-1">Unidade</Label>
              <Input value="PR" readOnly className="bg-gray-100" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <Label className="block font-medium text-gray-700 mb-1">Coordenador</Label>
              <Input value="Marlon Weingartner" readOnly className="bg-gray-100" />
            </div>
            <div>
              <Label className="block font-medium text-gray-700 mb-1">Gerente</Label>
              <Input value="Elisabete Kudo" readOnly className="bg-gray-100" />
            </div>
          </div>
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-1">Regional</Label>
            <Input value="Sul" readOnly className="bg-gray-100" />
          </div>
        </div>
      </div>

      {/* Fixed Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 max-w-md mx-auto">
        <div className="flex items-center justify-between mb-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onSaveDraft}
            className="text-blue-600"
          >
            <Save className="w-4 h-4 mr-1" />
            Salvar Rascunho
          </Button>
        </div>
        <div className="flex space-x-4">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={onBack}
          >
            Voltar
          </Button>
          <Button 
            className="flex-1 bg-blue-600 hover:bg-blue-700"
            onClick={onNext}
            disabled={!isFormValid()}
          >
            Próximo
          </Button>
        </div>
      </div>
    </div>
  );
}
