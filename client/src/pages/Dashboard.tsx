import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, FolderSync, User, FileText, Home } from 'lucide-react';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('7');
  const { syncData, isSyncing, unsyncedCount } = useOfflineSync();
  const { toast } = useToast();

  const { data: inspections = [], isLoading } = useQuery({
    queryKey: ['/api/inspections'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleSync = async () => {
    try {
      await syncData();
      toast({
        title: "Sincronização concluída",
        description: "Dados sincronizados com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro na sincronização",
        description: "Verifique sua conexão e tente novamente",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      pending: { label: 'Pendente', color: 'bg-red-100 text-red-800' },
      in_progress: { label: 'Em Andamento', color: 'bg-yellow-100 text-yellow-800' },
      completed: { label: 'Concluído', color: 'bg-green-100 text-green-800' },
    };
    return configs[status as keyof typeof configs] || configs.pending;
  };

  const filteredInspections = inspections.filter((inspection: any) => {
    const matchesSearch = searchQuery === '' || 
      inspection.client?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inspection.protocol.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || inspection.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-surface">
      <ConnectionStatus />
      
      {/* Header */}
      <header className="bg-brasilit-blue text-white p-4 shadow-md">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div>
            <h1 className="text-xl font-bold">VIGITEL</h1>
            <p className="text-blue-100 text-sm">Suas Vistorias</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              onClick={handleSync}
              disabled={isSyncing}
              size="sm"
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              <FolderSync className={`w-4 h-4 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-10 h-10 bg-white/20 rounded-full p-0"
            >
              <User className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Search and Filters */}
      <div className="p-4 bg-white shadow-sm max-w-md mx-auto">
        <div className="relative mb-4">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por cliente ou protocolo"
            className="pl-10 h-12"
          />
          <Search className="absolute left-3 top-3 w-6 h-6 text-gray-400" />
        </div>
        
        <div className="flex space-x-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="in_progress">Em Andamento</SelectItem>
              <SelectItem value="completed">Concluídos</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="custom">Personalizado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Notifications */}
      {unsyncedCount > 0 && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mx-4 max-w-md">
          <div className="flex items-center">
            <span className="text-red-800 text-sm font-medium">
              Você tem {unsyncedCount} {unsyncedCount === 1 ? 'vistoria pendente' : 'vistorias pendentes'} de sincronização
            </span>
          </div>
        </div>
      )}

      {/* Inspections List */}
      <div className="px-4 pb-32 max-w-md mx-auto">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="animate-pulse">
                  <div className="h-6 bg-gray-300 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredInspections.map((inspection: any) => {
              const statusConfig = getStatusBadge(inspection.status);
              return (
                <Card 
                  key={inspection.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setLocation(`/inspection/${inspection.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-lg">
                          {inspection.client?.name || 'Sem Cliente'}
                        </h3>
                        <p className="text-gray-600 text-sm">{inspection.protocol}</p>
                      </div>
                      <Badge className={statusConfig.color}>
                        {statusConfig.label}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{new Date(inspection.inspectionDate).toLocaleDateString('pt-BR')}</span>
                      {inspection.status === 'pending' && (
                        <span className="text-red-600 font-medium">Vence amanhã</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            
            {filteredInspections.length === 0 && (
              <div className="text-center py-12">
                <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Nenhuma vistoria encontrada</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-24 right-6 max-w-md mx-auto">
        <Button
          onClick={() => setLocation('/inspection/new')}
          size="lg"
          className="w-16 h-16 bg-brasilit-blue hover:bg-brasilit-dark text-white rounded-full shadow-lg"
        >
          <Plus className="w-8 h-8" />
        </Button>
      </div>

      {/* Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 max-w-md mx-auto">
        <div className="flex space-x-2">
          <Button
            onClick={() => setLocation('/inspection/new')}
            className="flex-1 bg-brasilit-blue hover:bg-brasilit-dark text-white h-12"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Vistoria
          </Button>
          <Button
            onClick={() => setLocation('/inspection/new?skipClient=true')}
            variant="secondary"
            className="flex-1 h-12"
          >
            <FileText className="w-4 h-4 mr-2" />
            Relatório Rápido
          </Button>
        </div>
      </div>
    </div>
  );
}
