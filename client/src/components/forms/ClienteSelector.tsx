import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { connectionManager, offlineStorage } from '@/lib/offline';
import { insertClientSchema, type Client } from '@shared/schema';
import { formatDocument, debounce } from '@/lib/utils';
import { z } from 'zod';
import { cn } from '@/lib/utils';

interface ClienteSelectorProps {
  value?: Client | null;
  onChange: (client: Client | null) => void;
  className?: string;
}

const clientFormSchema = insertClientSchema.extend({
  document: z.string().min(11, "Documento deve ter pelo menos 11 caracteres"),
});

export function ClienteSelector({ value, onChange, className }: ClienteSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewClientDialog, setShowNewClientDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Debounced search
  const [debouncedQuery, setDebouncedQuery] = useState("");
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Search clients
  const { data: clients = [], isLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients", { search: debouncedQuery }],
    enabled: debouncedQuery.length > 2 && connectionManager.isOnline,
  });

  // New client form
  const form = useForm<z.infer<typeof clientFormSchema>>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      name: "",
      document: "",
      contact: "",
      email: "",
    },
  });

  // Create client mutation
  const createClientMutation = useMutation({
    mutationFn: async (data: z.infer<typeof clientFormSchema>) => {
      if (connectionManager.isOnline) {
        const response = await apiRequest("POST", "/api/clients", data);
        return response.json();
      } else {
        // Save offline
        const id = await offlineStorage.saveClient(data);
        await offlineStorage.addToSyncQueue("create_client", { ...data, id });
        return { ...data, id };
      }
    },
    onSuccess: (newClient) => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      onChange(newClient);
      setShowNewClientDialog(false);
      setOpen(false);
      form.reset();
      toast({
        title: "Cliente criado",
        description: connectionManager.isOnline ? "Cliente salvo com sucesso" : "Cliente salvo offline",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar cliente",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof clientFormSchema>) => {
    createClientMutation.mutate(data);
  };

  return (
    <div className={className}>
      <Label className="text-sm font-medium text-gray-700 mb-2">
        Cliente
      </Label>
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-12"
          >
            {value ? (
              <div className="flex flex-col items-start">
                <span className="font-medium">{value.name}</span>
                <span className="text-xs text-gray-500">{formatDocument(value.document)}</span>
              </div>
            ) : (
              <span className="text-gray-500">Selecionar cliente...</span>
            )}
            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput 
              placeholder="Buscar cliente..." 
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              <CommandEmpty>
                <div className="text-center py-4">
                  {searchQuery.length < 3 ? (
                    "Digite pelo menos 3 caracteres para buscar"
                  ) : isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      <span className="ml-2">Buscando...</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p>Nenhum cliente encontrado</p>
                      <Button
                        size="sm"
                        onClick={() => {
                          setShowNewClientDialog(true);
                          setOpen(false);
                        }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Criar novo cliente
                      </Button>
                    </div>
                  )}
                </div>
              </CommandEmpty>
              <CommandGroup>
                {clients.map((client) => (
                  <CommandItem
                    key={client.id}
                    value={client.name}
                    onSelect={() => {
                      onChange(client);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value?.id === client.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col">
                      <span className="font-medium">{client.name}</span>
                      <span className="text-xs text-gray-500">{formatDocument(client.document)}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
          
          <div className="border-t p-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowNewClientDialog(true);
                setOpen(false);
              }}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar novo cliente
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Selected Client Display */}
      {value && (
        <Card className="mt-3 border-green-200 bg-green-50">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-green-800">{value.name}</div>
                <div className="text-sm text-green-600">{formatDocument(value.document)}</div>
                {value.contact && (
                  <div className="text-xs text-green-600">{value.contact}</div>
                )}
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onChange(null)}
                className="text-green-700 hover:text-green-800"
              >
                Alterar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* New Client Dialog */}
      <Dialog open={showNewClientDialog} onOpenChange={setShowNewClientDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Cliente</DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="Nome da empresa" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="document"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CNPJ/CPF <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="XX.XXX.XXX/0001-XX"
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "");
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="contact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contato</FormLabel>
                    <FormControl>
                      <Input placeholder="(XX) XXXXX-XXXX" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="contato@empresa.com" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex space-x-3 pt-4">
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => setShowNewClientDialog(false)}
                  className="flex-1"
                  disabled={createClientMutation.isPending}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={createClientMutation.isPending}
                >
                  {createClientMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
