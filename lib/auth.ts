import api from './api';

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role?: 'attendee' | 'organizer' | 'admin' | 'super-admin' | 'developer';
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

/** True for admin, super-admin, and developer — anyone who belongs in /admin. */
export function isAdminLevelRole(role?: string | null): boolean {
  return role === 'admin' || role === 'super-admin' || role === 'developer';
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

