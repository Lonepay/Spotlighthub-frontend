import api from './api';

export interface UserStats {
  total_tickets: number;
  total_spent: number;
  total_events_attended: number;
}

export interface UserDashboard {
  stats: UserStats;
  recent_tickets: any[];
  upcoming_events: any[];
  payment_history: any[];
  favorite_categories: any[];
}

export const user = {
  async getDashboard(): Promise<UserDashboard> {
    const { data } = await api.get('/user/dashboard');
    return data;
  },
};

