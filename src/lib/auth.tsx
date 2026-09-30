import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api/client';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  isGoogleConnected?: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  connectGoogle: () => void;
  disconnectGoogle: () => void;
  updateProfile: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  connectGoogle: () => {},
  disconnectGoogle: () => {},
  updateProfile: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('sheetflow_user');
    return saved
      ? JSON.parse(saved)
      : {
          id: 'user_default',
          name: 'Soxibjon',
          email: 'soxibjon@sheetflow.io',
          isGoogleConnected: true,
        };
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('sheetflow_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('sheetflow_user');
    }
  }, [user]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.login(email, password);
      setUser({
        id: res.user.id,
        name: res.user.name,
        email: res.user.email,
        isGoogleConnected: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.register(name, email, password);
      setUser({
        id: res.user.id,
        name: res.user.name,
        email: res.user.email,
        isGoogleConnected: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  const connectGoogle = () => {
    if (user) {
      setUser({ ...user, isGoogleConnected: true });
    }
  };

  const disconnectGoogle = () => {
    if (user) {
      setUser({ ...user, isGoogleConnected: false });
    }
  };

  const updateProfile = (updates: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      localStorage.setItem('sheetflow_user', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        connectGoogle,
        disconnectGoogle,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
