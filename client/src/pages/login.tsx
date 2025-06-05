import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Home, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { signInWithEmail, signInWithGoogle } from "@/lib/supabase";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import { useOffline } from "@/hooks/use-offline";

export default function Login() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();
  const { isOnline } = useOffline();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!isOnline) {
        // Offline login logic - check stored credentials
        const storedEmail = localStorage.getItem('vigitel_user_email');
        const storedToken = localStorage.getItem('vigitel_auth_token');
        
        if (storedEmail === email && storedToken) {
          toast({
            title: "Login offline",
            description: "Conectado com credenciais armazenadas",
          });
          setLocation("/dashboard");
          return;
        } else {
          throw new Error("Credenciais offline não encontradas");
        }
      }

      const { data, error } = await signInWithEmail(email, password);
      
      if (error) {
        throw error;
      }

      if (data.user) {
        // Store credentials for offline use
        localStorage.setItem('vigitel_user_email', email);
        localStorage.setItem('vigitel_auth_token', data.session?.access_token || '');
        
        toast({
          title: "Login realizado",
          description: "Bem-vindo ao VIGITEL!",
        });
        
        setLocation("/dashboard");
      }
    } catch (error: any) {
      toast({
        title: "Erro no login",
        description: error.message || "Credenciais inválidas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!isOnline) {
      toast({
        title: "Login indisponível",
        description: "Login com Google requer conexão com internet",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await signInWithGoogle();
      
      if (error) {
        throw error;
      }
      
      // The redirect will handle the rest
    } catch (error: any) {
      toast({
        title: "Erro no login",
        description: error.message || "Erro ao fazer login com Google",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brasilit-blue to-brasilit-dark flex flex-col justify-center p-6">
      <ConnectionStatus />
      
      {/* Logo Section */}
      <div className="text-center mb-12">
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
          <Home className="w-12 h-12 text-brasilit-blue" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">VIGITEL</h1>
        <p className="text-blue-100 text-lg">Vistoria e Gestão Inteligente</p>
        <p className="text-blue-200 text-sm">de Telhas Brasilit</p>
      </div>

      {/* Login Form */}
      <Card className="w-full max-w-md mx-auto bg-white/95 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-center text-brasilit-dark">Entrar</CardTitle>
          <CardDescription className="text-center">
            Acesse sua conta para gerenciar vistorias
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tecnico@brasilit.com"
                required
                className="h-12"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="h-12 pr-12"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 bg-brasilit-blue hover:bg-brasilit-dark"
              disabled={loading}
            >
              {loading ? "Entrando..." : "Entrar com Email/Senha"}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full h-12"
              onClick={handleGoogleLogin}
              disabled={loading || !isOnline}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Entrar com Google
            </Button>

            <div className="text-center">
              <Button variant="link" className="text-brasilit-blue">
                Esqueci minha senha
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Offline Notice */}
      {!isOnline && (
        <div className="mt-6 bg-yellow-100 border border-yellow-300 rounded-lg p-4 max-w-md mx-auto">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <span className="text-yellow-800 text-sm">
              Offline. Use suas últimas credenciais.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
