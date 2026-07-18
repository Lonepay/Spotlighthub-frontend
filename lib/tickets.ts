import api from './api';

export interface Ticket {
  id: number;
  code: string;
  event_id: number;
  user_id: number;
  payment_id: number | null;
  status?: string;
  checked_in_at?: string | null;
  event?: {
    id: number;
    title: string;
    date: string;
    time: string;
    venue: string;
    image?: string;
  };
  created_at: string;
  updated_at: string;
}

export const tickets = {
  async purchase(eventId: number, quantity: number) {
    const { data } = await api.post(`/events/${eventId}/tickets`, { quantity });
    return data;
  },

  async getAll() {
    const { data } = await api.get('/tickets');
    return data;
  },

  async getOne(id: number) {
    const { data } = await api.get(`/tickets/${id}`);
    return data;
  },
};

