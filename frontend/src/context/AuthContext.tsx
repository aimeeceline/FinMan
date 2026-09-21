import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '../types';
import { api } from '../services/api';

export interface GoogleAuthData {
  idToken?: string;
  email?: string;
  fullName?: string;
  avatarUrl?: string;
}

export interface AuthResult {
  success: boolean;
  message?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (email: string, fullName: string, password: string) => Promise<AuthResult>;
  loginWithGoogle: (data: GoogleAuthData) => Promise<AuthResult>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('finman_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('finman_token') || null;
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = async (email: string, password: string): Promise<AuthResult> => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      const authData = res.data?.data || res.data;
      const receivedToken = authData?.token;
      const userObj = authData?.user;

      if (receivedToken) {
        const receivedUser: User = {
          id: userObj?.id || 1,
          email: userObj?.email || email,
          fullName: userObj?.fullName || 'Người dùng FinMan',
          avatarUrl: userObj?.avatarUrl || '',
        };
        localStorage.setItem('finman_token', receivedToken);
        localStorage.setItem('finman_user', JSON.stringify(receivedUser));
        setToken(receivedToken);
        setUser(receivedUser);
        setIsLoading(false);
        return { success: true, message: res.data?.message || 'Đăng nhập thành công' };
      }
      setIsLoading(false);
      return { success: false, message: 'Không thể xử lý dữ liệu đăng nhập từ máy chủ.' };
    } catch (err: any) {
      setIsLoading(false);
      let msg = 'Đăng nhập không thành công. Vui lòng thử lại.';
      if (err.response?.data?.message) {
        msg = err.response.data.message;
      } else if (err.response?.data?.error?.details) {
        const details = err.response.data.error.details;
        msg = Object.values(details).join(', ');
      }
      return { success: false, message: msg };
    }
  };

  const register = async (email: string, fullName: string, password: string): Promise<AuthResult> => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/register', { email, fullName, password });
      const authData = res.data?.data || res.data;
      const receivedToken = authData?.token;
      const userObj = authData?.user;

      if (receivedToken) {
        const receivedUser: User = {
          id: userObj?.id || 1,
          email: userObj?.email || email,
          fullName: userObj?.fullName || fullName,
          avatarUrl: userObj?.avatarUrl || '',
        };
        localStorage.setItem('finman_token', receivedToken);
        localStorage.setItem('finman_user', JSON.stringify(receivedUser));
        setToken(receivedToken);
        setUser(receivedUser);
        setIsLoading(false);
        return { success: true, message: res.data?.message || 'Đăng ký tài khoản thành công' };
      }
      setIsLoading(false);
      return { success: false, message: 'Không thể xử lý dữ liệu đăng ký từ máy chủ.' };
    } catch (err: any) {
      setIsLoading(false);
      let msg = 'Đăng ký không thành công. Vui lòng kiểm tra lại thông tin.';
      if (err.response?.data?.message) {
        msg = err.response.data.message;
      } else if (err.response?.data?.error?.details) {
        const details = err.response.data.error.details;
        msg = Object.values(details).join(', ');
      }
      return { success: false, message: msg };
    }
  };

  const loginWithGoogle = async (data: GoogleAuthData): Promise<AuthResult> => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/google', data);
      const authData = res.data?.data || res.data;
      const receivedToken = authData?.token;
      const userObj = authData?.user;

      if (receivedToken) {
        const receivedUser: User = {
          id: userObj?.id || Date.now(),
          email: userObj?.email || data.email || '',
          fullName: userObj?.fullName || data.fullName || 'Người dùng Google',
          avatarUrl: userObj?.avatarUrl || data.avatarUrl || '',
        };
        localStorage.setItem('finman_token', receivedToken);
        localStorage.setItem('finman_user', JSON.stringify(receivedUser));
        setToken(receivedToken);
        setUser(receivedUser);
        setIsLoading(false);
        return { success: true, message: res.data?.message || 'Đăng nhập Google thành công' };
      }
      setIsLoading(false);
      return { success: false, message: 'Không nhận được mã xác thực từ máy chủ.' };
    } catch (err: any) {
      setIsLoading(false);
      let msg = 'Đăng nhập Google không thành công.';
      if (err.response?.data?.message) {
        msg = err.response.data.message;
      }
      return { success: false, message: msg };
    }
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
        loginWithGoogle,
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
