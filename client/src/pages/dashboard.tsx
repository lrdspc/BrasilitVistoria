import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Search, FolderSync, User, FileText, TriangleAlert } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("7days");
  const { toast } = useToast();

  // Mock data for demonstration
  const { data: inspections = [], isLoading } = useQuery({
    queryKey: ["/api/inspections", { userId: 1 }],
    queryFn: () => [
      {
        id: 1,
        client: "Construtora XYZ",
        protocol: "FAR123456",
        date: "2025-02-18",
        status: "pending",
        deadline: "2025-02-19",
      },
      {
        id: 2,
        client: "Incorporadora ABC",
        protocol: "FAR654321",
        date: "2025-02-17",
        status: "in_progress",
        deadline: "2025-02-20",
      },
      {
        id: 3,
        client: "Construtora DEF",
        protocol: "FAR789012",
        date: "2025-02-15",
        status: "completed",
        deadline: "2025-02-18",
      },
    ],
  });

  const pendingCount = inspections.filter(i => i.status === "pending").length;

  const handleSync = () => {
    toast({
      title: "Sincronizando dados...",
      description: "Aguarde enquanto os dados são sincronizados",
    });
    
    setTimeout(() => {
      toast({
        title: "Sincronização concluída",
        description: `${inspections.length} vistorias sincronizadas!`,
      });
    }, 1500);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="destructive">Pendente</Badge>;
      case "in_progress":
        return <Badge className="bg-yellow-500">Em Andamento</Badge>;
      case "completed":
        return <Badge className="bg-green-500">Concluído</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getDeadlineText = (deadline: string, status: string) => {
    if (status === "completed") return "Finalizado";
    
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (deadlineDate.toDateString() === tomorrow.toDateString()) {
      return "Vence amanhã";
    }
    
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return "Vencido";
    if (diffDays === 0) return "Vence hoje";
    return `${diffDays} dias restantes`;
  };

  const filteredInspections = inspections.filter(inspection => {
    const matchesSearch = inspection.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         inspection.protocol.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || inspection.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">VIGITEL</h1>
            <p className="text-blue-100 text-sm">Suas Vistorias</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              onClick={handleSync}
              size="sm"
              className="bg-green-500 hover:bg-green-600"
            >
              <FolderSync className="w-4 h-4 mr-1" />
              Sincronizar
            </Button>
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="w-10 h-10 bg-white bg-opacity-20 rounded-full"
              >
                <User className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Search and Filters */}
      <div className="p-4 bg-white shadow-sm">
        <div className="relative mb-4">
          <Input
            placeholder="Buscar por cliente ou protocolo"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
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
      {pendingCount > 0 && (
        <Alert className="bg-red-50 border-l-4 border-red-400 mx-4 mb-4">
          <TriangleAlert className="h-4 w-4" />
          <AlertDescription className="text-red-800 font-medium">
            Você tem {pendingCount} vistoria{pendingCount > 1 ? 's' : ''} pendente{pendingCount > 1 ? 's' : ''}
          </AlertDescription>
        </Alert>
      )}

      {/* Inspections List */}
      <div className="px-4 pb-24">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredInspections.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma vistoria encontrada</h3>
              <p className="text-gray-500 mb-4">
                {searchQuery ? "Tente ajustar sua busca ou filtros" : "Comece criando uma nova vistoria"}
              </p>
              <Button onClick={() => setLocation("/inspection/client-selection")}>
                <Plus className="w-4 h-4 mr-2" />
                Nova Vistoria
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {filteredInspections.map((inspection) => (
              <Card key={inspection.id} className="mb-4 cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-lg">{inspection.client}</h3>
                      <p className="text-gray-600 text-sm">{inspection.protocol}</p>
                    </div>
                    {getStatusBadge(inspection.status)}
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{new Date(inspection.date).toLocaleDateString('pt-BR')}</span>
                    <span className={inspection.status === "pending" && inspection.deadline === "2025-02-19" ? "text-red-600 font-medium" : "text-gray-600"}>
                      {getDeadlineText(inspection.deadline, inspection.status)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}

            <Button variant="outline" className="w-full py-3">
              Carregar mais vistorias
            </Button>
          </>
        )}
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6">
        <Button
          onClick={() => setLocation("/inspection/client-selection")}
          size="icon"
          className="w-16 h-16 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-6 h-6" />
        </Button>
      </div>

      {/* Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 max-w-md mx-auto">
        <div className="flex space-x-2">
          <Button
            onClick={() => setLocation("/inspection/client-selection")}
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
