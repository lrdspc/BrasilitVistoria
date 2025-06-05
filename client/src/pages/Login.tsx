import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Eye, EyeOff, Home } from 'lucide-react';
import { FaGoogle } from 'react-icons/fa';
import { useToast } from '@/hooks/use-toast';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import { signInWithEmail, signInWithGoogle } from '@/lib/supabase';
import { saveUserOffline, getOfflineUser } from '@/lib/indexedDB';

export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (navigator.onLine) {
        // Online login
        const { user } = await signInWithEmail(email, password);
        if (user) {
          await saveUserOffline({
            id: user.id,
            email: user.email || email,
            name: user.user_metadata?.name || 'Usuário',
          });
          setLocation('/dashboard');
        }
      } else {
        // Offline login - check stored credentials
        const offlineUser = await getOfflineUser();
        if (offlineUser && offlineUser.email === email) {
          setLocation('/dashboard');
        } else {
          toast({
            title: "Erro",
            description: "Credenciais não encontradas para uso offline",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Credenciais inválidas",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao fazer login com Google",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brasilit-blue to-brasilit-dark flex flex-col justify-center p-6 relative">
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
      <Card className="bg-white/10 backdrop-blur border-white/20">
        <CardContent className="p-6">
          <form onSubmit={handleEmailLogin} className="space-y-6">
            <div>
              <Label htmlFor="email" className="text-white">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tecnico@brasilit.com"
                className="mt-2 bg-white border-gray-300 h-14 text-base"
                required
              />
            </div>
            
            <div className="relative">
              <Label htmlFor="password" className="text-white">Senha</Label>
              <div className="relative mt-2">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-white border-gray-300 h-14 text-base pr-12"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </Button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-white text-brasilit-blue h-14 text-lg font-semibold hover:bg-gray-50"
            >
              {isLoading ? 'Entrando...' : 'Entrar com Email/Senha'}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleLogin}
              className="w-full bg-transparent border-2 border-white text-white h-14 text-lg font-semibold hover:bg-white hover:text-brasilit-blue"
            >
              <FaGoogle className="mr-3" />
              Entrar com Google
            </Button>

            <div className="text-center">
              <button
                type="button"
                className="text-blue-200 underline text-sm hover:text-white"
              >
                Esqueci minha senha
              </button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Offline Notice */}
      {!navigator.onLine && (
        <Card className="mt-6 bg-yellow-100 border-yellow-300">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <span className="text-yellow-800 text-sm">
                Offline. Use suas últimas credenciais.
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
