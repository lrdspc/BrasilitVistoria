import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Search, FolderSync, User, Settings, LogOut, Filter } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import { useOffline } from "@/hooks/use-offline";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { Inspection } from "@shared/schema";

interface DashboardInspection extends Inspection {
  clientName?: string;
  daysRemaining?: number;
  isOverdue?: boolean;
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("last7");
  const { toast } = useToast();
  const { isOnline, pendingSync, sync } = useOffline();

  // Mock user ID - in real app, get from auth context
  const userId = 1;

  const { data: inspections = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/inspections', { userId }],
    enabled: isOnline, // Only fetch when online
  });

  const handleSync = async () => {
    if (!isOnline) {
      toast({
        title: "Offline",
        description: "Conecte-se à internet para sincronizar",
        variant: "destructive",
      });
      return;
    }

    try {
      await sync();
      await refetch();
      toast({
        title: "Sincronização completa",
        description: "Dados sincronizados com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro na sincronização",
        description: "Tente novamente",
        variant: "destructive",
      });
    }
  };

  const filteredInspections = inspections.filter((inspection: DashboardInspection) => {
    const matchesSearch = 
      inspection.protocol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inspection.clientName && inspection.clientName.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || inspection.status === statusFilter;
    
    // Date filter logic would go here
    const matchesDate = true;
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: "Pendente", variant: "destructive" as const },
      in_progress: { label: "Em Andamento", variant: "default" as const },
      completed: { label: "Concluído", variant: "secondary" as const },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleLogout = () => {
    localStorage.removeItem('vigitel_user_email');
    localStorage.removeItem('vigitel_auth_token');
    setLocation("/login");
    toast({
      title: "Logout realizado",
      description: "Até logo!",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ConnectionStatus />
      
      {/* Header */}
      <header className="bg-brasilit-blue text-white p-4 shadow-md">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">VIGITEL</h1>
            <p className="text-blue-100 text-sm">Suas Vistorias</p>
          </div>
          <div className="flex items-center space-x-3">
            {pendingSync && (
              <Button
                onClick={handleSync}
                size="sm"
                className="bg-green-500 hover:bg-green-600"
                disabled={!isOnline}
              >
                <FolderSync className="w-4 h-4 mr-1" />
                Sincronizar
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                  <User className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Settings className="w-4 h-4 mr-2" />
                  Configurações
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto">
        {/* Search and Filters */}
        <div className="p-4 bg-white shadow-sm">
          <div className="relative mb-4">
            <Input
              placeholder="Buscar por cliente ou protocolo"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
          
          <div className="flex space-x-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="draft">Pendentes</SelectItem>
                <SelectItem value="in_progress">Em Andamento</SelectItem>
                <SelectItem value="completed">Concluídos</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last7">Últimos 7 dias</SelectItem>
                <SelectItem value="last30">Últimos 30 dias</SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Notifications Banner */}
        {filteredInspections.filter(i => i.status === 'draft').length > 0 && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mx-4 rounded-r-lg mb-4">
            <div className="flex items-center">
              <Filter className="w-5 h-5 text-red-400 mr-2" />
              <span className="text-red-800 text-sm font-medium">
                Você tem {filteredInspections.filter(i => i.status === 'draft').length} vistorias pendentes
              </span>
            </div>
          </div>
        )}

        {/* Inspections List */}
        <div className="px-4 pb-20">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
              ))}
            </div>
          ) : filteredInspections.length === 0 ? (
            <Card className="p-8 text-center">
              <CardContent>
                <p className="text-gray-500">Nenhuma vistoria encontrada</p>
                <Button 
                  onClick={() => setLocation("/inspection/client-selection")}
                  className="mt-4"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Criar primeira vistoria
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredInspections.map((inspection: DashboardInspection) => (
                <Card 
                  key={inspection.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setLocation(`/inspection/review?id=${inspection.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-lg">
                          {inspection.clientName || "Cliente não informado"}
                        </h3>
                        <p className="text-gray-600 text-sm">{inspection.protocol}</p>
                      </div>
                      {getStatusBadge(inspection.status)}
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{new Date(inspection.date).toLocaleDateString('pt-BR')}</span>
                      {inspection.status === 'draft' && (
                        <span className="text-red-600 font-medium">
                          {inspection.isOverdue ? 'Atrasado' : `${inspection.daysRemaining} dias restantes`}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {filteredInspections.length >= 10 && (
                <Button variant="outline" className="w-full">
                  Carregar mais vistorias
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Floating Action Button */}
        <div className="fixed bottom-6 right-6 max-w-md mx-auto">
          <Button
            onClick={() => setLocation("/inspection/client-selection")}
            size="lg"
            className="w-16 h-16 rounded-full bg-brasilit-blue hover:bg-brasilit-dark shadow-lg"
          >
            <Plus className="w-6 h-6" />
          </Button>
        </div>

        {/* Bottom Actions */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 max-w-md mx-auto">
          <div className="flex space-x-2">
            <Button 
              onClick={() => setLocation("/inspection/client-selection")} 
              className="flex-1 bg-brasilit-blue hover:bg-brasilit-dark"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Vistoria
            </Button>
            <Button 
              onClick={() => setLocation("/inspection/basic-info")} 
              variant="secondary"
              className="flex-1"
            >
              <Search className="w-4 h-4 mr-2" />
              Relatório Rápido
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
