import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Home, Wifi, WifiOff } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isOnline] = useState(navigator.onLine);
  const { toast } = useToast();

  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const response = await apiRequest("POST", "/api/auth/login", credentials);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Login realizado com sucesso",
        description: "Redirecionando para o dashboard...",
      });
      setLocation("/dashboard");
    },
    onError: (error) => {
      toast({
        title: "Erro no login",
        description: error.message || "Credenciais inválidas",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha email e senha",
        variant: "destructive",
      });
      return;
    }
    loginMutation.mutate({ email, password });
  };

  const handleGoogleLogin = () => {
    // In a real implementation, this would integrate with Supabase Auth
    toast({
      title: "Login com Google",
      description: "Funcionalidade não implementada nesta demonstração",
    });
  };

  return (
    <div className="flex flex-col justify-center min-h-screen p-6 brasilit-gradient">
      {/* Logo Section */}
      <div className="text-center mb-12">
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
          <Home className="text-4xl text-blue-600" size={48} />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">VIGITEL</h1>
        <p className="text-blue-100 text-lg">Vistoria e Gestão Inteligente</p>
        <p className="text-blue-200 text-sm">de Telhas Brasilit</p>
      </div>

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="email" className="block text-sm font-medium text-white mb-2">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="tecnico@brasilit.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="form-input bg-white"
            required
          />
        </div>

        <div className="relative">
          <Label htmlFor="password" className="block text-sm font-medium text-white mb-2">
            Senha
          </Label>
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="form-input bg-white pr-12"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-12 text-gray-500"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        <Button
          type="submit"
          className="touch-button w-full bg-white text-blue-600 hover:bg-gray-50"
          disabled={loginMutation.isPending}
        >
          {loginMutation.isPending ? "Entrando..." : "Entrar com Email/Senha"}
        </Button>

        <Button
          type="button"
          onClick={handleGoogleLogin}
          variant="outline"
          className="touch-button w-full bg-transparent border-2 border-white text-white hover:bg-white hover:text-blue-600"
        >
          <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Entrar com Google
        </Button>

        <div className="text-center">
          <a href="#" className="text-blue-200 underline text-sm">
            Esqueci minha senha
          </a>
        </div>
      </form>

      {/* Offline Notice */}
      {!isOnline && (
        <Alert className="mt-8 bg-yellow-100 border border-yellow-300">
          <WifiOff className="h-4 w-4" />
          <AlertDescription className="text-yellow-800">
            Offline. Use suas últimas credenciais.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
