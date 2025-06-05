# VIGITEL - Guia de Implementação Detalhado

## 🚀 Como Continuar o Desenvolvimento

### 1. Completar Páginas do Fluxo Principal

#### A. BasicInfo Page (Prioridade: CRÍTICA)

**Arquivo**: `client/src/pages/BasicInfo.tsx`

```typescript
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

const basicInfoSchema = z.object({
  date: z.date(),
  enterprise: z.string().min(1, "Empresa é obrigatória"),
  city: z.string().min(1, "Cidade é obrigatória"),
  state: z.string().min(2, "Estado é obrigatório"),
  address: z.string().min(1, "Endereço é obrigatório"),
  cep: z.string().regex(/^\d{5}-?\d{3}$/, "CEP inválido"),
  subject: z.string().min(1, "Assunto é obrigatório"),
});

export default function BasicInfo() {
  const [, setLocation] = useLocation();
  const { setBasicInfo, setCurrentStep, client } = useVistoriaStore();
  const [isLoadingCep, setIsLoadingCep] = useState(false);

  const form = useForm<z.infer<typeof basicInfoSchema>>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: {
      date: new Date(),
      enterprise: "",
      city: "",
      state: "PR",
      address: "",
      cep: "",
      subject: "",
    },
  });

  const handleCepBlur = async (cep: string) => {
    if (ViaCepService.validateCep(cep)) {
      setIsLoadingCep(true);
      try {
        const address = await ViaCepService.searchByCep(cep);
        if (address) {
          form.setValue("address", address.street);
          form.setValue("city", address.city);
          form.setValue("state", address.state);
        }
      } catch (error) {
        console.error("Erro ao buscar CEP:", error);
      } finally {
        setIsLoadingCep(false);
      }
    }
  };

  const onSubmit = (data: z.infer<typeof basicInfoSchema>) => {
    const basicInfo = {
      ...data,
      protocol: generateProtocol(),
    };
    setBasicInfo(basicInfo);
    setCurrentStep(3);
    setLocation("/inspection/tiles");
  };

  return (
    <AppLayout title="Informações Básicas" showSidebar={false}>
      <div className="max-w-2xl mx-auto space-y-6">
        <ProgressBar 
          currentStep={2} 
          totalSteps={5} 
          stepLabels={["Cliente", "Informações", "Telhas", "Não Conformidades", "Revisão"]} 
        />
        
        {/* Form implementation here */}
        {/* Use Form components from shadcn/ui */}
        {/* Integrate CEP lookup */}
        {/* Add navigation buttons */}
      </div>
    </AppLayout>
  );
}
```

#### B. TileSelection Page

**Arquivo**: `client/src/pages/TileSelection.tsx`

```typescript
import { AppLayout } from "@/components/layouts/AppLayout";
import { TelhaSelector } from "@/components/forms/TelhaSelector";
import { useVistoriaStore } from "@/stores/vistoriaStore";
import { useLocation } from "wouter";

export default function TileSelection() {
  const [, setLocation] = useLocation();
  const { tiles, addTile, removeTile, updateTile, setCurrentStep, calculateTotalArea } = useVistoriaStore();

  const handleNext = () => {
    calculateTotalArea();
    setCurrentStep(4);
    setLocation("/inspection/non-conformities");
  };

  return (
    <AppLayout title="Seleção de Telhas" showSidebar={false}>
      <div className="max-w-4xl mx-auto space-y-6">
        <TelhaSelector
          tiles={tiles}
          onChange={(newTiles) => {
            // Update store with new tiles
          }}
        />
        
        {/* Navigation buttons */}
      </div>
    </AppLayout>
  );
}
```

### 2. Implementar IndexedDB com Dexie

**Instalar dependência**:
```bash
npm install dexie
```

**Arquivo**: `client/src/lib/database.ts`

```typescript
import Dexie, { Table } from 'dexie';

export interface OfflineInspection {
  id?: number;
  clientId?: number;
  data: any;
  timestamp: number;
  synced: boolean;
  lastModified: number;
}

export interface OfflineClient {
  id?: number;
  name: string;
  document: string;
  contact?: string;
  email?: string;
  timestamp: number;
  synced: boolean;
}

export interface SyncQueueItem {
  id?: number;
  type: 'create_inspection' | 'update_inspection' | 'create_client' | 'upload_photo';
  data: any;
  timestamp: number;
  retries: number;
  lastError?: string;
}

export class VigitelDB extends Dexie {
  inspections!: Table<OfflineInspection>;
  clients!: Table<OfflineClient>;
  syncQueue!: Table<SyncQueueItem>;
  photos!: Table<any>;

  constructor() {
    super('VigitelDB');
    
    this.version(1).stores({
      inspections: '++id, clientId, timestamp, synced, lastModified',
      clients: '++id, name, document, timestamp, synced',
      syncQueue: '++id, type, timestamp, retries',
      photos: '++id, inspectionId, timestamp, synced'
    });
  }

  // Helper methods
  async saveInspectionOffline(inspection: any): Promise<number> {
    const id = await this.inspections.add({
      data: inspection,
      timestamp: Date.now(),
      synced: false,
      lastModified: Date.now()
    });
    
    // Add to sync queue
    await this.addToSyncQueue('create_inspection', { ...inspection, id });
    return id;
  }

  async addToSyncQueue(type: SyncQueueItem['type'], data: any): Promise<void> {
    await this.syncQueue.add({
      type,
      data,
      timestamp: Date.now(),
      retries: 0
    });
  }

  async getPendingSyncItems(): Promise<SyncQueueItem[]> {
    return await this.syncQueue.where('retries').below(3).toArray();
  }

  async markAsSynced(type: string, localId: number): Promise<void> {
    if (type === 'create_inspection') {
      await this.inspections.update(localId, { synced: true });
    } else if (type === 'create_client') {
      await this.clients.update(localId, { synced: true });
    }
  }
}

export const db = new VigitelDB();
```

### 3. Configurar Supabase

**Instalar dependências**:
```bash
npm install @supabase/supabase-js
```

**Arquivo**: `client/src/lib/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Auth helpers
export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/dashboard`
    }
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
};
```

**Environment Variables** (`.env`):
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Implementar Worker para Geração de DOCX

**Arquivo**: `client/src/workers/docx-generator.worker.ts`

```typescript
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell } from 'docx';

self.onmessage = async function(e) {
  const { inspectionData, type } = e.data;
  
  try {
    if (type === 'generate_docx') {
      const doc = await generateInspectionReport(inspectionData);
      const buffer = await Packer.toBuffer(doc);
      
      self.postMessage({
        success: true,
        data: buffer,
        filename: `Vistoria_${inspectionData.protocol}.docx`
      });
    }
  } catch (error) {
    self.postMessage({
      success: false,
      error: error.message
    });
  }
};

async function generateInspectionReport(data: any): Promise<Document> {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        // Header
        new Paragraph({
          children: [
            new TextRun({
              text: "RELATÓRIO DE VISTORIA TÉCNICA",
              bold: true,
              size: 28,
            }),
          ],
          alignment: "center",
          spacing: { after: 400 },
        }),
        
        // Client info
        new Paragraph({
          children: [
            new TextRun({
              text: "DADOS DO CLIENTE",
              bold: true,
              size: 24,
            }),
          ],
          spacing: { before: 200, after: 200 },
        }),
        
        // Add more content based on inspection data
        // Include photos, tiles, non-conformities, etc.
      ],
    }],
  });
  
  return doc;
}
```

**Uso do Worker**:
```typescript
// client/src/lib/reportGenerator.ts
export class ReportGenerator {
  private worker: Worker;

  constructor() {
    this.worker = new Worker(
      new URL('../workers/docx-generator.worker.ts', import.meta.url),
      { type: 'module' }
    );
  }

  async generateReport(inspectionData: any): Promise<Blob> {
    return new Promise((resolve, reject) => {
      this.worker.onmessage = (e) => {
        const { success, data, error } = e.data;
        if (success) {
          resolve(new Blob([data], { 
            type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
          }));
        } else {
          reject(new Error(error));
        }
      };

      this.worker.postMessage({
        type: 'generate_docx',
        inspectionData
      });
    });
  }
}
```

### 5. Configurar Testes

**Instalar dependências de teste**:
```bash
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event vitest jsdom
```

**Arquivo**: `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
      '@shared': path.resolve(__dirname, './shared'),
    },
  },
});
```

**Exemplo de teste**:
```typescript
// client/src/components/__tests__/ClienteSelector.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClienteSelector } from '../forms/ClienteSelector';

const createTestQueryClient = () => new QueryClient({
  defaultOptions: { queries: { retry: false } }
});

describe('ClienteSelector', () => {
  it('should render search input', () => {
    const queryClient = createTestQueryClient();
    const mockOnChange = vi.fn();

    render(
      <QueryClientProvider client={queryClient}>
        <ClienteSelector value={null} onChange={mockOnChange} />
      </QueryClientProvider>
    );

    expect(screen.getByPlaceholderText(/selecionar cliente/i)).toBeInTheDocument();
  });

  it('should call onChange when client is selected', async () => {
    // Test implementation
  });
});
```

## 📋 Ordem de Implementação Recomendada

1. **Completar páginas do fluxo** (BasicInfo, TileSelection, NonConformities, Review)
2. **Implementar IndexedDB** para armazenamento robusto
3. **Configurar Supabase** e autenticação
4. **Implementar worker para DOCX**
5. **Adicionar testes unitários**
6. **Configurar PWA avançado** (Workbox)
7. **Implementar funcionalidades extras**

## 🔧 Scripts Úteis

Adicionar ao `package.json`:

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "build:analyze": "npm run build && npx vite-bundle-analyzer dist",
    "lighthouse": "lhci autorun",
    "type-check": "tsc --noEmit"
  }
}
```

Este guia fornece uma base sólida para continuar o desenvolvimento do VIGITEL. Cada seção pode ser implementada independentemente, permitindo progresso incremental.
