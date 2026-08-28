'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, auth, LoginResult, requiresTwoFactor } from '@/lib/auth';

// 20 minutes of no mouse/keyboard/touch/scroll activity locks the app and
// requires a fresh emailed OTP to keep going — the Sanctum token itself
// stays valid the whole time, this is a UI gate, not a real logout.
const IDLE_LIMIT_MS = 20 * 60 * 1000;
const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart'] as const;

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  completeTwoFactorLogin: (email: string, otp: string) => Promise<User>;
  register: (name: string, email: string, phone: string, password: string, passwordConfirmation: string, role?: 'attendee' | 'organizer' | 'admin') => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  locked: boolean;
  unlockSession: (otp: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false);
  const lastActivityRef = useRef(Date.now());
  const lockingRef = useRef(false);

  const refreshUser = async () => {
    const userData = await auth.getUser();
    setUser(userData);
  };

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, []);

  // Idle detection only runs for a logged-in, not-already-locked user —
  // once locked, further mouse/keyboard activity must NOT silently clear it
  // on its own; only a correct OTP (via unlockSession) may.
  useEffect(() => {
    if (!user || locked) return;

    const markActive = () => {
      lastActivityRef.current = Date.now();
    };
    ACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, markActive, { passive: true }));

    const interval = setInterval(async () => {
      if (Date.now() - lastActivityRef.current >= IDLE_LIMIT_MS && !lockingRef.current) {
        lockingRef.current = true;
        setLocked(true);
        try {
          await auth.lockSession();
        } catch {
          // Even if the email fails to send, the app stays locked — the
          // user can trigger a resend from the lock screen itself.
        } finally {
          lockingRef.current = false;
        }
      }
    }, 30_000);

    return () => {
      ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, markActive));
      clearInterval(interval);
    };
  }, [user, locked]);

  const unlockSession = async (otp: string) => {
    await auth.unlockSession(otp);
    lastActivityRef.current = Date.now();
    setLocked(false);
  };

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
    setLocked(false);
    router.push('/');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, completeTwoFactorLogin, register, logout, refreshUser, locked, unlockSession }}>
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

