import api from './api';

export interface StaffRole {
  id: number;
  name: string;
  duties: string | null;
  permissions: string[];
}

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role?: 'attendee' | 'organizer' | 'admin' | 'super-admin' | 'developer' | 'staff' | 'vendor';
  staff_role_id?: number | null;
  staff_role?: StaffRole | null;
  bio?: string;
  avatar_url?: string | null;
  two_factor_enabled?: boolean;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface TwoFactorChallenge {
  requires_2fa: true;
  email: string;
  message: string;
}

export type LoginResult = AuthResponse | TwoFactorChallenge;

export function requiresTwoFactor(result: LoginResult): result is TwoFactorChallenge {
  return (result as TwoFactorChallenge).requires_2fa === true;
}

/**
 * True for admin, super-admin, and developer only — full admin dashboard
 * capabilities (events, payments, withdrawals, KYC, partnership codes,
 * etc). Deliberately excludes 'staff' — use isStaffRole() for the
 * narrower "can reach /admin at all" check, and hasPermission() for what
 * a specific staff account can actually do there.
 */
export function isAdminLevelRole(role?: string | null): boolean {
  return role === 'admin' || role === 'super-admin' || role === 'developer';
}

/** True for admin-level roles plus staff — a staff account's actual capabilities depend on their assigned StaffRole's permissions. */
export function isStaffRole(role?: string | null): boolean {
  return isAdminLevelRole(role) || role === 'staff';
}

/** True if `user` can do `permission` — admin-level users always can; a staff account only if their assigned StaffRole grants it. */
export function hasPermission(user: User | null | undefined, permission: string): boolean {
  if (!user) return false;
  if (isAdminLevelRole(user.role)) return true;
  if (user.role !== 'staff') return false;
  return !!user.staff_role?.permissions?.includes(permission);
}

export const auth = {
  async register(name: string, email: string, phone: string, password: string, passwordConfirmation: string, role: 'attendee' | 'organizer' | 'admin' = 'attendee'): Promise<AuthResponse> {
    const { data } = await api.post('/register', {
      name,
      email,
      phone,
      password,
      password_confirmation: passwordConfirmation,
      role,
    });
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    return data;
  },

  async login(email: string, password: string): Promise<LoginResult> {
    try {
      const { data } = await api.post('/login', { email, password });
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      return data;
    } catch (error: any) {
      // Re-throw with better error message
      const message = error.response?.data?.message || error.message || 'Invalid credentials';
      throw new Error(message);
    }
  },

  async verifyLoginOtp(email: string, otp: string): Promise<AuthResponse> {
    const { data } = await api.post('/login/verify-2fa', { email, otp });
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    return data;
  },

  async toggleTwoFactor(enabled: boolean, password: string): Promise<User> {
    const { data } = await api.put('/user/2fa', { enabled, password });
    return data.user;
  },

  // Idle-timeout re-verification — the Sanctum token itself is untouched by
  // either call, so there's no token to store/replace here (unlike login).
  async lockSession(): Promise<void> {
    await api.post('/session/lock');
  },

  async unlockSession(otp: string): Promise<void> {
    await api.post('/session/unlock', { otp });
  },

  async logout(): Promise<void> {
    try {
      await api.post('/logout');
    } finally {
      localStorage.removeItem('token');
    }
  },

  async getUser(): Promise<User | null> {
    try {
      const { data } = await api.get('/user');
      return data;
    } catch {
      return null;
    }
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  },

  async uploadAvatar(file: File): Promise<User> {
    const formData = new FormData();
    formData.append('avatar', file);
    const { data } = await api.post('/user/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.user;
  },

  async deleteAvatar(): Promise<User> {
    const { data } = await api.delete('/user/avatar');
    return data.user;
  },
};

