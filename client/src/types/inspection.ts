export interface TileConfiguration {
  id?: number;
  thickness: string;
  length: string;
  width: string;
  quantity: number;
  grossArea: number;
  correctedArea: number;
}

export interface NonConformityItem {
  id?: number;
  title: string;
  notes?: string;
  photos: string[];
  selected: boolean;
}

export interface InspectionFormData {
  // Client Selection
  clientId?: number;
  clientName?: string;
  
  // Basic Information
  date: string;
  enterprise: string;
  city: string;
  state: string;
  address: string;
  cep: string;
  protocol: string;
  subject: string;
  technicianId?: number;
  technicianName: string;
  
  // Tiles
  tiles: TileConfiguration[];
  
  // Non-conformities
  nonConformities: NonConformityItem[];
  
  // Meta
  status: 'draft' | 'pending' | 'in_progress' | 'completed';
  offlineId?: string;
}

export const NON_CONFORMITY_OPTIONS = [
  "Armazenagem Incorreta",
  "Carga Permanente", 
  "Corte das Telhas",
  "Esforços devido à vento",
  "Fixação Inadequada",
  "Inclinação Insuficiente",
  "Instalação em desacordo com manual",
  "Montagem da estrutura",
  "Parafusos inadequados",
  "Perfuração incorreta",
  "Sobrecarga acidental",
  "Telhas danificadas",
  "Ventilação inadequada",
  "Vedação deficiente"
];

export const TILE_THICKNESS_OPTIONS = ["5mm", "6mm", "8mm"];

export const TILE_LENGTH_OPTIONS = {
  "5mm": ["1,22m", "1,53m", "1,83m", "2,13m", "2,44m"],
  "6mm": ["1,22m", "1,53m", "1,83m", "2,13m", "2,44m", "3,05m", "3,66m"],
  "8mm": ["1,22m", "1,53m", "1,83m", "2,13m", "2,44m", "3,05m", "3,66m"]
};

export const TILE_WIDTH_OPTIONS = ["0,92m", "1,10m"];

export const ENTERPRISE_OPTIONS = ["Residencial", "Comercial", "Industrial"];

export const BRAZILIAN_STATES = [
  { code: "AC", name: "Acre" },
  { code: "AL", name: "Alagoas" },
  { code: "AP", name: "Amapá" },
  { code: "AM", name: "Amazonas" },
  { code: "BA", name: "Bahia" },
  { code: "CE", name: "Ceará" },
  { code: "DF", name: "Distrito Federal" },
  { code: "ES", name: "Espírito Santo" },
  { code: "GO", name: "Goiás" },
  { code: "MA", name: "Maranhão" },
  { code: "MT", name: "Mato Grosso" },
  { code: "MS", name: "Mato Grosso do Sul" },
  { code: "MG", name: "Minas Gerais" },
  { code: "PA", name: "Pará" },
  { code: "PB", name: "Paraíba" },
  { code: "PR", name: "Paraná" },
  { code: "PE", name: "Pernambuco" },
  { code: "PI", name: "Piauí" },
  { code: "RJ", name: "Rio de Janeiro" },
  { code: "RN", name: "Rio Grande do Norte" },
  { code: "RS", name: "Rio Grande do Sul" },
  { code: "RO", name: "Rondônia" },
  { code: "RR", name: "Roraima" },
  { code: "SC", name: "Santa Catarina" },
  { code: "SP", name: "São Paulo" },
  { code: "SE", name: "Sergipe" },
  { code: "TO", name: "Tocantins" }
];
