import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '../types';
import { api } from '../services/api';
import { mockUser } from '../services/mockData';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, fullName: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('finman_user');
    return saved ? JSON.parse(saved) : mockUser; // default to mockUser for immediate demo experience
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('finman_token') || 'demo_token_authenticated');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      setToken(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Try connecting to real backend first
      const res = await api.post('/auth/login', { email, password });
      if (res.data && res.data.token) {
        const receivedToken = res.data.token;
        const receivedUser: User = {
          id: res.data.userId || 1,
          email: res.data.email || email,
          fullName: res.data.fullName || 'Nguyễn Minh Khang',
          avatarUrl: mockUser.avatarUrl,
        };
        localStorage.setItem('finman_token', receivedToken);
        localStorage.setItem('finman_user', JSON.stringify(receivedUser));
        setToken(receivedToken);
        setUser(receivedUser);
        setIsLoading(false);
        return true;
      }
    } catch {
      // Fallback to local authenticated mock if backend is not running
      console.warn('Backend unavailable, proceeding in demo authenticated mode.');
      const demoUser: User = {
        ...mockUser,
        email: email || mockUser.email,
      };
      const demoToken = 'mock_jwt_token_' + Date.now();
      localStorage.setItem('finman_token', demoToken);
      localStorage.setItem('finman_user', JSON.stringify(demoUser));
      setToken(demoToken);
      setUser(demoUser);
      setIsLoading(false);
      return true;
    }
    setIsLoading(false);
    return false;
  };

  const register = async (email: string, fullName: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/register', { email, fullName, password });
      if (res.data && res.data.token) {
        const receivedToken = res.data.token;
        const receivedUser: User = {
          id: res.data.userId || 1,
          email: res.data.email || email,
          fullName: res.data.fullName || fullName,
          avatarUrl: mockUser.avatarUrl,
        };
        localStorage.setItem('finman_token', receivedToken);
        localStorage.setItem('finman_user', JSON.stringify(receivedUser));
        setToken(receivedToken);
        setUser(receivedUser);
        setIsLoading(false);
        return true;
      }
    } catch {
      console.warn('Backend unavailable, registering in demo authenticated mode.');
      const demoUser: User = {
        id: Date.now(),
        email,
        fullName,
        avatarUrl: mockUser.avatarUrl,
      };
      const demoToken = 'mock_jwt_token_' + Date.now();
      localStorage.setItem('finman_token', demoToken);
      localStorage.setItem('finman_user', JSON.stringify(demoUser));
      setToken(demoToken);
      setUser(demoUser);
      setIsLoading(false);
      return true;
    }
    setIsLoading(false);
    return false;
  };

  const logout = () => {
    localStorage.removeItem('finman_token');
    localStorage.removeItem('finman_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
