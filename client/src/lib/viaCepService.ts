interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
  erro?: boolean;
}

interface AddressData {
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  cep: string;
}

export class ViaCepService {
  private static readonly BASE_URL = 'https://viacep.com.br/ws';

  static async searchByCep(cep: string): Promise<AddressData | null> {
    try {
      // Clean CEP (remove non-numeric characters)
      const cleanCep = cep.replace(/\D/g, '');
      
      // Validate CEP format
      if (cleanCep.length !== 8) {
        throw new Error('CEP deve ter 8 dígitos');
      }

      const response = await fetch(`${this.BASE_URL}/${cleanCep}/json/`);
      
      if (!response.ok) {
        throw new Error('Erro ao consultar CEP');
      }

      const data: ViaCepResponse = await response.json();

      if (data.erro) {
        throw new Error('CEP não encontrado');
      }

      return {
        street: data.logradouro,
        neighborhood: data.bairro,
        city: data.localidade,
        state: data.uf,
        cep: data.cep,
      };
    } catch (error) {
      console.error('ViaCEP error:', error);
      throw error;
    }
  }

  static async searchByAddress(
    state: string,
    city: string,
    street: string
  ): Promise<AddressData[]> {
    try {
      if (!state || !city || !street) {
        throw new Error('Estado, cidade e logradouro são obrigatórios');
      }

      if (street.length < 3) {
        throw new Error('Logradouro deve ter pelo menos 3 caracteres');
      }

      const response = await fetch(
        `${this.BASE_URL}/${encodeURIComponent(state)}/${encodeURIComponent(city)}/${encodeURIComponent(street)}/json/`
      );

      if (!response.ok) {
        throw new Error('Erro ao consultar endereço');
      }

      const data: ViaCepResponse[] = await response.json();

      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('Endereço não encontrado');
      }

      return data.map(item => ({
        street: item.logradouro,
        neighborhood: item.bairro,
        city: item.localidade,
        state: item.uf,
        cep: item.cep,
      }));
    } catch (error) {
      console.error('ViaCEP address search error:', error);
      throw error;
    }
  }

  static formatCep(cep: string): string {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      return cleanCep.replace(/(\d{5})(\d{3})/, '$1-$2');
    }
    return cep;
  }

  static validateCep(cep: string): boolean {
    const cleanCep = cep.replace(/\D/g, '');
    return cleanCep.length === 8 && /^\d{8}$/.test(cleanCep);
  }
}
