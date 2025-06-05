import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { authApi, saveUserToLocal, getUserFromLocal, clearLocalAuth, signInWithGoogle, type User } from "@/lib/auth";
import { connectionManager } from "@/lib/offline";
import { useToast } from "@/hooks/use-toast";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Check for existing user on mount
  useEffect(() => {
    const existingUser = getUserFromLocal();
    if (existingUser) {
      setUser(existingUser);
    }
    setIsLoading(false);
  }, []);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password?: string }) => {
      // Demo login check
      if (email === "demo@brasilit.com" && password === "demo123") {
        const demoUser: User = {
          id: 1,
          email: "demo@brasilit.com",
          name: "Técnico Demo",
          department: "Assistência Técnica",
          unit: "PR",
          coordinator: "Marlon Weingartner",
          manager: "Elisabete Kudo",
          regional: "Sul",
        };
        return { user: demoUser };
      }

      if (connectionManager.isOnline) {
        return await authApi.login(email, password);
      } else {
        // Offline login - check local storage
        const localUser = getUserFromLocal();
        if (localUser && localUser.email === email) {
          return { user: localUser };
        }
        throw new Error("Usuário não encontrado offline");
      }
    },
    onSuccess: ({ user }) => {
      setUser(user);
      saveUserToLocal(user);
      toast({
        title: "Login realizado",
        description: `Bem-vindo, ${user.name}!`,
      });
    },
    onError: (error) => {
      toast({
        title: "Erro no login",
        description: error instanceof Error ? error.message : "Credenciais inválidas",
        variant: "destructive",
      });
    },
  });

  // Google login mutation
  const googleLoginMutation = useMutation({
    mutationFn: signInWithGoogle,
    onSuccess: ({ user }) => {
      setUser(user);
      saveUserToLocal(user);
      toast({
        title: "Login realizado",
        description: `Bem-vindo, ${user.name}!`,
      });
    },
    onError: (error) => {
      toast({
        title: "Erro no login com Google",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: ({ user }) => {
      setUser(user);
      saveUserToLocal(user);
      toast({
        title: "Conta criada",
        description: `Bem-vindo, ${user.name}!`,
      });
    },
    onError: (error) => {
      toast({
        title: "Erro no cadastro",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    },
  });

  const logout = async () => {
    try {
      await authApi.logout();
      setUser(null);
      clearLocalAuth();
      toast({
        title: "Logout realizado",
        description: "Até logo!",
      });
    } catch (error) {
      console.error("Logout error:", error);
      // Clear local data anyway
      setUser(null);
      clearLocalAuth();
    }
  };

  const login = async (email: string, password?: string) => {
    await loginMutation.mutateAsync({ email, password });
  };

  const loginWithGoogle = async () => {
    await googleLoginMutation.mutateAsync();
  };

  const register = async (userData: {
    email: string;
    name: string;
    department?: string;
    unit?: string;
    coordinator?: string;
    manager?: string;
    regional?: string;
  }) => {
    await registerMutation.mutateAsync(userData);
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    loginWithGoogle,
    register,
    logout,
    isLoggingIn: loginMutation.isPending || googleLoginMutation.isPending,
    isRegistering: registerMutation.isPending,
  };
}
