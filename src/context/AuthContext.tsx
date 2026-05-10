'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axiosClient from '@/lib/axiosClient';

interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: 'admin' | 'customer';
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, rememberMe: boolean) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check if user is already authenticated on mount (runs before rendering)
  useEffect(() => {
    // Run immediately to prevent UI flash
    const checkAuthImmediately = async () => {
      try {
        const token = localStorage.getItem('mmm_auth_token');
        if (!token) {
          setIsLoading(false);
          return;
        }

        const response = await axiosClient.get<{ user: User }>('/api/auth/me');
        setUser(response.data.user);
      } catch (error) {
        localStorage.removeItem('mmm_auth_token');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthImmediately();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('mmm_auth_token');
      if (!token) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      const response = await axiosClient.get<{ user: User }>('/api/auth/me');
      setUser(response.data.user);
    } catch (error) {
      // Token expired or invalid, clear it
      localStorage.removeItem('mmm_auth_token');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string, rememberMe: boolean) => {
    setIsLoading(true);
    try {
      const response = await axiosClient.post('/api/auth/login', {
        email,
        password,
        rememberMe,
      });

      const token = response.data.token;
      const userData = response.data.user;

      // Store token in localStorage for PWA persistence
      localStorage.setItem('mmm_auth_token', token);
      setUser(userData);

      return;
    } catch (error) {
      // Clear auth on login failure
      localStorage.removeItem('mmm_auth_token');
      setUser(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      // Clear local storage
      localStorage.removeItem('mmm_auth_token');
      sessionStorage.clear();

      // Clear all caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
      }

      setUser(null);
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
