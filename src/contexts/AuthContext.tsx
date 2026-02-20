import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserPreferences, getAuthToken, setAuthToken, removeAuthToken, isTokenExpired } from '@/lib/auth';
import api from '@/lib/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<{ emailSent: boolean }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateProfile: (data: { name?: string; preferences?: UserPreferences }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Vérifier l'authentification au chargement
  useEffect(() => {
    const checkAuth = async () => {
      const token = getAuthToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      // Vérifier si le token est expiré
      if (isTokenExpired(token)) {
        removeAuthToken();
        setIsLoading(false);
        return;
      }

      // Récupérer les informations de l'utilisateur
      try {
        const data = await api.get<{ user: User }>('/auth/me');
        setUser(data.user);
      } catch (error) {
        // Token invalide, supprimer
        removeAuthToken();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const data = await api.post<{ token: string; user: User }>('/auth/login', { email, password });
    setAuthToken(data.token);
    setUser(data.user);
  };

  const register = async (email: string, password: string, name: string) => {
    const data = await api.post<{ token: string; user: User; emailSent?: boolean }>('/auth/register', { email, password, name });
    setAuthToken(data.token);
    setUser(data.user);
    return { emailSent: data.emailSent || false };
  };

  const logout = () => {
    removeAuthToken();
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const data = await api.get<{ user: User }>('/auth/me');
      setUser(data.user);
    } catch (error) {
      logout();
    }
  };

  const updateProfile = async (data: { name?: string; preferences?: UserPreferences }) => {
    const response = await api.put<{ user: User }>('/auth/profile', data);
    setUser(response.user);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: user !== null,
        login,
        register,
        logout,
        refreshUser,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
}

