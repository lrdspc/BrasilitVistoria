import { apiRequest } from "./queryClient";

export interface User {
  id: number;
  email: string;
  name: string;
  department: string;
  unit: string;
  coordinator: string;
  manager: string;
  regional: string;
}

export interface AuthResponse {
  user: User;
}

export const authApi = {
  login: async (email: string, password?: string): Promise<AuthResponse> => {
    const response = await apiRequest("POST", "/api/auth/login", { email, password });
    return response.json();
  },

  register: async (userData: {
    email: string;
    name: string;
    department?: string;
    unit?: string;
    coordinator?: string;
    manager?: string;
    regional?: string;
  }): Promise<AuthResponse> => {
    const response = await apiRequest("POST", "/api/auth/register", userData);
    return response.json();
  },

  logout: async (): Promise<void> => {
    // Clear local storage
    localStorage.removeItem("vigitel_user");
    localStorage.removeItem("vigitel_token");
  },
};

// Local storage helpers
export const saveUserToLocal = (user: User): void => {
  localStorage.setItem("vigitel_user", JSON.stringify(user));
  localStorage.setItem("vigitel_token", "local_token_" + user.id);
};

export const getUserFromLocal = (): User | null => {
  const userStr = localStorage.getItem("vigitel_user");
  if (!userStr) return null;
  
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

export const clearLocalAuth = (): void => {
  localStorage.removeItem("vigitel_user");
  localStorage.removeItem("vigitel_token");
};

// Google OAuth (placeholder for future implementation)
export const signInWithGoogle = async (): Promise<AuthResponse> => {
  // This would integrate with Google OAuth in production
  // For now, return a mock user for demonstration
  const mockUser: User = {
    id: 1,
    email: "demo@brasilit.com",
    name: "João Silva",
    department: "Assistência Técnica",
    unit: "PR",
    coordinator: "Marlon Weingartner",
    manager: "Elisabete Kudo",
    regional: "Sul",
  };
  
  saveUserToLocal(mockUser);
  return { user: mockUser };
};
