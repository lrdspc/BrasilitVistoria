import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import { Eye, EyeOff, Home } from 'lucide-react';
import { FaGoogle } from 'react-icons/fa';

export default function LoginPage() {
  const { signIn, signInWithGoogle, loading, isOfflineMode } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { error: signInError } = await signIn(email, password);
      if (signInError) {
        setError(signInError.message || 'Credenciais inválidas');
      }
    } catch (err) {
      setError('Erro ao fazer login. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError('');

    try {
      const { error: signInError } = await signInWithGoogle();
      if (signInError) {
        setError(signInError.message || 'Erro ao fazer login com Google');
      }
    } catch (err) {
      setError('Erro ao fazer login com Google. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-800">
        <div className="text-white text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center bg-gradient-to-br from-blue-600 to-blue-800 p-6">
      <ConnectionStatus />
      
      {/* Logo and Title */}
      <div className="text-center mb-12">
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
          <Home className="text-4xl text-blue-600" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">VIGITEL</h1>
        <p className="text-blue-100 text-lg">Vistoria e Gestão Inteligente</p>
        <p className="text-blue-200 text-sm">de Telhas Brasilit</p>
      </div>

      {/* Login Form */}
      <Card className="w-full max-w-sm mx-auto">
        <CardContent className="p-6">
          <form onSubmit={handleEmailSignIn} className="space-y-6">
            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Offline Notice */}
            {isOfflineMode && (
              <Alert>
                <AlertDescription className="flex items-center">
                  <div className="w-4 h-4 bg-yellow-500 rounded-full mr-2"></div>
                  Offline. Use suas últimas credenciais.
                </AlertDescription>
              </Alert>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="tecnico@brasilit.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="h-12 text-base"
                autoComplete="email"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Senha
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="h-12 text-base pr-12"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Sign In Button */}
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 text-lg font-semibold shadow-lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Entrando...
                </div>
              ) : (
                'Entrar com Email/Senha'
              )}
            </Button>

            {/* Google Sign In */}
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleSignIn}
              disabled={isLoading || isOfflineMode}
              className="w-full py-4 text-lg font-semibold flex items-center justify-center space-x-3"
            >
              <FaGoogle className="text-lg" />
              <span>Entrar com Google</span>
            </Button>

            {/* Forgot Password */}
            <div className="text-center">
              <button
                type="button"
                className="text-blue-600 underline text-sm hover:text-blue-800"
                disabled={isLoading || isOfflineMode}
              >
                Esqueci minha senha
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
