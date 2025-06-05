import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, RefreshCw, FileText, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import { useAuth } from "@/hooks/useAuth";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import type { Inspection } from "@shared/schema";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const { forcSync, isSyncing, pendingCount } = useOfflineSync();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("7days");

  // Fetch inspections
  const { data: inspections = [], isLoading, refetch } = useQuery<Inspection[]>({
    queryKey: ["/api/inspections", { userId: user?.id, status: statusFilter !== "all" ? statusFilter : undefined }],
    enabled: !!user,
  });

  // Filter inspections based on search and filters
  const filteredInspections = inspections.filter((inspection) => {
    const matchesSearch = 
      !searchQuery ||
      inspection.protocol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inspection.subject.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDate = true; // TODO: Implement date filtering

    return matchesSearch && matchesDate;
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "destructive",
      in_progress: "default",
      completed: "secondary",
    } as const;

    const labels = {
      pending: "Pendente",
      in_progress: "Em Andamento", 
      completed: "Concluído",
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || "outline"}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("pt-BR");
  };

  const getDaysUntilDeadline = (date: Date | string) => {
    const inspectionDate = new Date(date);
    const today = new Date();
    const diffTime = inspectionDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return "Vencida";
    if (diffDays === 0) return "Vence hoje";
    if (diffDays === 1) return "Vence amanhã";
    return `${diffDays} dias restantes`;
  };

  const getDeadlineColor = (date: Date | string) => {
    const inspectionDate = new Date(date);
    const today = new Date();
    const diffTime = inspectionDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return "text-red-600";
    if (diffDays <= 1) return "text-red-600";
    if (diffDays <= 3) return "text-yellow-600";
    return "text-gray-600";
  };

  const pendingInspections = inspections.filter(i => i.status === "pending").length;

  if (!user) {
    setLocation("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ConnectionStatus />
      
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">VIGITEL</h1>
            <p className="text-blue-100 text-sm">Suas Vistorias</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              onClick={forcSync}
              disabled={isSyncing}
              size="sm"
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? "Sincronizando..." : "Sincronizar"}
            </Button>
            <div className="relative">
              <Button variant="ghost" size="sm" className="text-white hover:bg-blue-700">
                <User className="w-5 h-5" />
              </Button>
              {/* TODO: Add dropdown menu for profile/logout */}
            </div>
          </div>
        </div>
      </header>

      {/* Search and Filters */}
      <div className="p-4 bg-white shadow-sm">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Buscar por cliente ou protocolo"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12"
          />
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
              <SelectItem value="7days">Últimos 7 dias</SelectItem>
              <SelectItem value="30days">Últimos 30 dias</SelectItem>
              <SelectItem value="custom">Personalizado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Notifications Banner */}
      {pendingInspections > 0 && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mx-4 rounded-r-lg mb-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-red-800 text-sm font-medium">
              Você tem {pendingInspections} vistoria{pendingInspections !== 1 ? 's' : ''} pendente{pendingInspections !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      )}

      {/* Pending Sync Notice */}
      {pendingCount > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mx-4 rounded-r-lg mb-4">
          <div className="flex items-center">
            <RefreshCw className="w-5 h-5 text-yellow-400 mr-2" />
            <span className="text-yellow-800 text-sm font-medium">
              {pendingCount} item{pendingCount !== 1 ? 's' : ''} pendente{pendingCount !== 1 ? 's' : ''} de sincronização
            </span>
          </div>
        </div>
      )}

      {/* Inspections List */}
      <div className="px-4 pb-20">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="flex justify-between">
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredInspections.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma vistoria encontrada
              </h3>
              <p className="text-gray-600 mb-4">
                {searchQuery ? "Tente buscar por outros termos" : "Comece criando sua primeira vistoria"}
              </p>
              <Button onClick={() => setLocation("/inspection/client")}>
                <Plus className="w-4 h-4 mr-2" />
                Nova Vistoria
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {filteredInspections.map((inspection) => (
              <Card 
                key={inspection.id} 
                className="mb-4 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setLocation(`/inspection/${inspection.id}/review`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {inspection.subject}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {inspection.protocol}
                      </p>
                    </div>
                    {getStatusBadge(inspection.status)}
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{formatDate(inspection.date)}</span>
                    <span className={getDeadlineColor(inspection.date)}>
                      {getDaysUntilDeadline(inspection.date)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Load More Button */}
            {filteredInspections.length >= 10 && (
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => refetch()}
              >
                Carregar mais vistorias
              </Button>
            )}
          </>
        )}
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6">
        <Button
          size="lg"
          onClick={() => setLocation("/inspection/client")}
          className="w-16 h-16 bg-blue-600 hover:bg-blue-700 rounded-full shadow-lg"
        >
          <Plus className="w-6 h-6" />
        </Button>
      </div>

      {/* Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 max-w-md mx-auto">
        <div className="flex space-x-2">
          <Button 
            onClick={() => setLocation("/inspection/client")}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Vistoria
          </Button>
          <Button 
            onClick={() => setLocation("/inspection/basic-info")}
            variant="secondary"
            className="flex-1"
          >
            <FileText className="w-4 h-4 mr-2" />
            Relatório Rápido
          </Button>
        </div>
      </div>
    </div>
  );
}
