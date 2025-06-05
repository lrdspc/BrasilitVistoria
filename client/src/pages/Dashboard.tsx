import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, RefreshCw, FileText, User, BarChart3, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppLayout } from "@/components/layouts/AppLayout";
import { VistoriaStats } from "@/components/charts/VistoriaStats";
import { useAuthStore } from "@/stores/authStore";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import type { Inspection } from "@shared/schema";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user } = useAuthStore();
  const { forceSync, isSyncing, pendingCount } = useOfflineSync();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("7days");

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      setLocation("/login");
    }
  }, [user, setLocation]);

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
    return null;
  }

  const stats = {
    total: inspections.length,
    completed: inspections.filter(i => i.status === 'completed').length,
    pending: inspections.filter(i => i.status === 'pending').length,
    inProgress: inspections.filter(i => i.status === 'in_progress').length,
  };

  return (
    <AppLayout title="Dashboard">
      <div className="space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Concluídas</p>
                  <p className="text-2xl font-bold">{stats.completed}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="text-sm text-gray-600">Em Andamento</p>
                  <p className="text-2xl font-bold">{stats.inProgress}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <div>
                  <p className="text-sm text-gray-600">Pendentes</p>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notifications */}
        {stats.pending > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <span className="text-red-800 font-medium">
                  Você tem {stats.pending} vistoria{stats.pending !== 1 ? 's' : ''} pendente{stats.pending !== 1 ? 's' : ''}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {pendingCount > 0 && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <RefreshCw className="w-5 h-5 text-yellow-600" />
                  <span className="text-yellow-800 font-medium">
                    {pendingCount} item{pendingCount !== 1 ? 's' : ''} aguardando sincronização
                  </span>
                </div>
                <Button
                  size="sm"
                  onClick={forceSync}
                  disabled={isSyncing}
                  className="bg-yellow-600 hover:bg-yellow-700"
                >
                  {isSyncing ? "Sincronizando..." : "Sincronizar"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="vistorias" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="vistorias" className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>Vistorias</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Relatórios</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="vistorias" className="space-y-4">
            {/* Search and Filters */}
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <Input
                    placeholder="Buscar por cliente ou protocolo"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="flex space-x-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Status</SelectItem>
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
              </CardContent>
            </Card>

            {/* Inspections List */}
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
              <div className="space-y-4">
                {filteredInspections.map((inspection) => (
                  <Card
                    key={inspection.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setLocation(`/inspection/${inspection.id}/review`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">
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
              </div>
            )}
          </TabsContent>

          <TabsContent value="analytics">
            <VistoriaStats inspections={inspections} />
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={() => setLocation("/inspection/client")}
                className="h-16 flex flex-col items-center justify-center space-y-2"
              >
                <Plus className="w-6 h-6" />
                <span>Nova Vistoria</span>
              </Button>
              <Button
                onClick={() => setLocation("/configuracoes")}
                variant="outline"
                className="h-16 flex flex-col items-center justify-center space-y-2"
              >
                <User className="w-6 h-6" />
                <span>Configurações</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
