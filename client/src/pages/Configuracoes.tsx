import { useState } from 'react';
import { useLocation } from 'wouter';
import { 
  Settings, 
  User, 
  Bell, 
  Palette, 
  Download, 
  Trash2, 
  HelpCircle,
  Shield,
  Database,
  Wifi,
  Moon,
  Sun,
  Monitor
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { AppLayout } from '@/components/layouts/AppLayout';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/use-toast';
import { useOfflineSync } from '@/hooks/useOfflineSync';

export default function Configuracoes() {
  const [, setLocation] = useLocation();
  const { user } = useAuthStore();
  const { toast } = useToast();
  const { clearOfflineData, pendingCount } = useOfflineSync();
  
  // Settings state
  const [settings, setSettings] = useState({
    notifications: true,
    autoSync: true,
    offlineMode: true,
    theme: 'light', // light, dark, system
    language: 'pt-BR',
    autoSave: true,
    highContrast: false,
    voiceInput: true,
    compressionQuality: 'medium', // low, medium, high
  });

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    toast({
      title: "Configuração atualizada",
      description: "Suas preferências foram salvas",
    });
  };

  const clearCache = async () => {
    try {
      await clearOfflineData();
      toast({
        title: "Cache limpo",
        description: "Todos os dados offline foram removidos",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao limpar cache",
        variant: "destructive",
      });
    }
  };

  const exportData = () => {
    // TODO: Implement data export
    toast({
      title: "Exportação iniciada",
      description: "Seus dados serão baixados em breve",
    });
  };

  return (
    <AppLayout title="Configurações">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* User Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>Perfil do Usuário</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                <span className="text-white text-xl font-bold">
                  {user?.name?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold">{user?.name}</h3>
                <p className="text-gray-600">{user?.email}</p>
                <p className="text-sm text-gray-500">
                  {user?.department} - {user?.unit}
                </p>
              </div>
              <Button variant="outline" onClick={() => setLocation('/perfil')}>
                Editar Perfil
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Palette className="w-5 h-5" />
              <span>Aparência</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Tema</label>
                <p className="text-xs text-gray-500">Escolha o tema da interface</p>
              </div>
              <Select 
                value={settings.theme} 
                onValueChange={(value) => updateSetting('theme', value)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">
                    <div className="flex items-center space-x-2">
                      <Sun className="w-4 h-4" />
                      <span>Claro</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="dark">
                    <div className="flex items-center space-x-2">
                      <Moon className="w-4 h-4" />
                      <span>Escuro</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="system">
                    <div className="flex items-center space-x-2">
                      <Monitor className="w-4 h-4" />
                      <span>Sistema</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Alto Contraste</label>
                <p className="text-xs text-gray-500">Melhora a legibilidade</p>
              </div>
              <Switch
                checked={settings.highContrast}
                onCheckedChange={(checked) => updateSetting('highContrast', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="w-5 h-5" />
              <span>Notificações</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Notificações Push</label>
                <p className="text-xs text-gray-500">Receber notificações do sistema</p>
              </div>
              <Switch
                checked={settings.notifications}
                onCheckedChange={(checked) => updateSetting('notifications', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Sync & Offline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Wifi className="w-5 h-5" />
              <span>Sincronização e Offline</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Sincronização Automática</label>
                <p className="text-xs text-gray-500">Sincronizar dados automaticamente</p>
              </div>
              <Switch
                checked={settings.autoSync}
                onCheckedChange={(checked) => updateSetting('autoSync', checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Modo Offline</label>
                <p className="text-xs text-gray-500">Permitir trabalho offline</p>
              </div>
              <Switch
                checked={settings.offlineMode}
                onCheckedChange={(checked) => updateSetting('offlineMode', checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Salvamento Automático</label>
                <p className="text-xs text-gray-500">Salvar rascunhos automaticamente</p>
              </div>
              <Switch
                checked={settings.autoSave}
                onCheckedChange={(checked) => updateSetting('autoSave', checked)}
              />
            </div>

            {pendingCount > 0 && (
              <>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Dados Pendentes</label>
                    <p className="text-xs text-gray-500">
                      {pendingCount} item(s) aguardando sincronização
                    </p>
                  </div>
                  <Badge variant="destructive">{pendingCount}</Badge>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Media & Voice */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="w-5 h-5" />
              <span>Mídia e Voz</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Entrada por Voz</label>
                <p className="text-xs text-gray-500">Habilitar reconhecimento de voz</p>
              </div>
              <Switch
                checked={settings.voiceInput}
                onCheckedChange={(checked) => updateSetting('voiceInput', checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Qualidade de Compressão</label>
                <p className="text-xs text-gray-500">Qualidade das fotos comprimidas</p>
              </div>
              <Select 
                value={settings.compressionQuality} 
                onValueChange={(value) => updateSetting('compressionQuality', value)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="w-5 h-5" />
              <span>Gerenciamento de Dados</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Exportar Dados</label>
                <p className="text-xs text-gray-500">Baixar todos os seus dados</p>
              </div>
              <Button variant="outline" onClick={exportData}>
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Limpar Cache</label>
                <p className="text-xs text-gray-500">Remover dados armazenados localmente</p>
              </div>
              <Button variant="outline" onClick={clearCache}>
                <Trash2 className="w-4 h-4 mr-2" />
                Limpar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Help & Support */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <HelpCircle className="w-5 h-5" />
              <span>Ajuda e Suporte</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full justify-start">
              <HelpCircle className="w-4 h-4 mr-2" />
              Central de Ajuda
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Shield className="w-4 h-4 mr-2" />
              Política de Privacidade
            </Button>
          </CardContent>
        </Card>

        {/* App Info */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-sm text-gray-500">
              <p>VIGITEL v1.0.0</p>
              <p>© 2025 Brasilit - Saint-Gobain</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
