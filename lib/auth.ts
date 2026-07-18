import api from './api';

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role?: 'attendee' | 'organizer' | 'admin';
  bio?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
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

  async login(email: string, password: string): Promise<AuthResponse> {
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
};

