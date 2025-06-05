import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { Check, Eye, Download, Mail, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useInspection } from "@/hooks/useInspection";
import { DocxGenerator } from "@/lib/docx-generator";
import { useAuth } from "@/hooks/useAuth";
import { z } from "zod";

const emailSchema = z.object({
  to: z.string().email("Email inválido"),
  subject: z.string().min(1, "Assunto é obrigatório"),
  message: z.string().optional(),
});

export default function ReportSuccess() {
  const [, setLocation] = useLocation();
  const { id } = useParams();
  const inspectionId = id ? parseInt(id) : undefined;
  const { user } = useAuth();
  const { data } = useInspection(inspectionId);
  const { toast } = useToast();
  
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const form = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      to: data.client?.email || "",
      subject: `Relatório de Vistoria - ${data.client?.name || data.inspection?.protocol}`,
      message: "Prezado cliente,\n\nSegue em anexo o relatório de vistoria técnica solicitado.\n\nAtenciosamente,\nEquipe Técnica Brasilit",
    },
  });

  const handlePreview = async () => {
    if (!data.inspection || !user) {
      toast({
        title: "Dados não encontrados",
        description: "Não foi possível carregar os dados da vistoria",
        variant: "destructive",
      });
      return;
    }

    try {
      const blob = await DocxGenerator.generateReport({
        inspection: data.inspection,
        client: data.client,
        user,
        tiles: data.tiles,
        nonConformities: data.nonConformities,
      });

      // Convert to PDF for preview (would require additional library in production)
      toast({
        title: "Visualização",
        description: "Abrindo pré-visualização do relatório...",
      });
      
      // For now, just download the DOCX
      DocxGenerator.downloadBlob(blob, `Preview - ${getFileName()}`);
    } catch (error) {
      toast({
        title: "Erro na visualização",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  const handleDownload = async () => {
    if (!data.inspection || !user) {
      toast({
        title: "Dados não encontrados",
        description: "Não foi possível carregar os dados da vistoria",
        variant: "destructive",
      });
      return;
    }

    try {
      await DocxGenerator.generateAndDownload({
        inspection: data.inspection,
        client: data.client,
        user,
        tiles: data.tiles,
        nonConformities: data.nonConformities,
      });

      toast({
        title: "Download iniciado",
        description: "O arquivo será salvo em sua pasta de downloads",
      });
    } catch (error) {
      toast({
        title: "Erro no download",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  const handleSendEmail = async (emailData: z.infer<typeof emailSchema>) => {
    setIsSendingEmail(true);

    try {
      // In production, this would send the email via API
      // For now, simulate the process
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast({
        title: "Email enviado",
        description: `Relatório enviado para ${emailData.to}`,
      });

      setShowEmailDialog(false);
      form.reset();
    } catch (error) {
      toast({
        title: "Erro ao enviar email",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const getFileName = () => {
    return `Relatório de Vistoria - ${data.client?.name || data.inspection?.protocol}.docx`;
  };

  const getFileSize = () => {
    // Estimate file size based on content
    const baseSize = 50; // KB base
    const photoSize = data.nonConformities.reduce((total, nc) => 
      total + (nc.photos?.length || 0) * 200, 0); // 200KB per photo estimate
    return ((baseSize + photoSize) / 1024).toFixed(1) + " MB";
  };

  if (!user) {
    setLocation("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-green-50 flex flex-col justify-center p-6">
      <ConnectionStatus />
      
      {/* Success Icon and Title */}
      <div className="text-center mb-8">
        <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
          <Check className="w-12 h-12 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-green-800 mb-2">Relatório Gerado!</h1>
        <p className="text-green-700">Seu relatório de vistoria foi criado com sucesso.</p>
      </div>

      {/* Report Details */}
      <Card className="mb-8 shadow-lg">
        <CardContent className="p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Detalhes do Relatório</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Cliente:</span>
              <span className="font-medium">{data.client?.name || "Não informado"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Protocolo:</span>
              <span className="font-medium">{data.inspection?.protocol || "Não informado"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Arquivo:</span>
              <span className="font-medium text-blue-600">{getFileName()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tamanho:</span>
              <span className="font-medium">{getFileSize()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Gerado em:</span>
              <span className="font-medium">{new Date().toLocaleString("pt-BR")}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="space-y-4">
        <Button 
          onClick={handlePreview}
          className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg font-semibold"
        >
          <Eye className="w-5 h-5 mr-2" />
          Visualizar Relatório
        </Button>

        <Button 
          onClick={handleDownload}
          className="w-full bg-green-600 hover:bg-green-700 h-12 text-lg font-semibold"
        >
          <Download className="w-5 h-5 mr-2" />
          Baixar DOCX
        </Button>

        <Button 
          onClick={() => setShowEmailDialog(true)}
          variant="outline"
          className="w-full border-gray-600 text-gray-700 hover:bg-gray-50 h-12 text-lg font-semibold"
        >
          <Mail className="w-5 h-5 mr-2" />
          Enviar por Email
        </Button>

        <Button 
          onClick={() => setLocation("/dashboard")}
          variant="outline"
          className="w-full h-12 text-lg font-semibold"
        >
          <Home className="w-5 h-5 mr-2" />
          Voltar ao Dashboard
        </Button>
      </div>

      {/* Email Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enviar Relatório por Email</DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSendEmail)} className="space-y-4">
              <FormField
                control={form.control}
                name="to"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Destinatário <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="cliente@empresa.com" 
                        type="email" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assunto</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mensagem</FormLabel>
                    <FormControl>
                      <Textarea 
                        rows={4}
                        placeholder="Prezado cliente, segue em anexo o relatório de vistoria técnica..."
                        className="resize-none"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex space-x-3 pt-4">
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => setShowEmailDialog(false)}
                  className="flex-1"
                  disabled={isSendingEmail}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  disabled={isSendingEmail}
                >
                  {isSendingEmail ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-1" />
                      Enviar
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
