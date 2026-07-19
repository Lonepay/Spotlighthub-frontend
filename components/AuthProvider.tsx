'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, auth, LoginResult, requiresTwoFactor } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  completeTwoFactorLogin: (email: string, otp: string) => Promise<User>;
  register: (name: string, email: string, phone: string, password: string, passwordConfirmation: string, role?: 'attendee' | 'organizer' | 'admin') => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    const userData = await auth.getUser();
    setUser(userData);
  };

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await auth.login(email, password);
      if (!requiresTwoFactor(response)) {
        setUser(response.user);
      }
      return response;
    } catch (error: any) {
      // Re-throw the error so the login page can handle it
      throw error;
    }
  };

  const completeTwoFactorLogin = async (email: string, otp: string) => {
    const response = await auth.verifyLoginOtp(email, otp);
    setUser(response.user);
    return response.user;
  };

  const register = async (name: string, email: string, phone: string, password: string, passwordConfirmation: string, role: 'attendee' | 'organizer' | 'admin' = 'attendee') => {
    const response = await auth.register(name, email, phone, password, passwordConfirmation, role);
    setUser(response.user);
  };

  const logout = async () => {
    await auth.logout();
    setUser(null);
    router.push('/');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, completeTwoFactorLogin, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

