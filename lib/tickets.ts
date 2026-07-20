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
    is_virtual?: boolean;
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

  async updateStatus(ticketId: number, status: 'valid' | 'checked_in' | 'invalid' | 'revoked', reason?: string) {
    const { data } = await api.put(`/tickets/${ticketId}/status`, { status, reason });
    return data;
  },

  async getForEvent(eventId: number, page = 1) {
    const { data } = await api.get(`/organizer/events/${eventId}/tickets`, { params: { page } });
    return data;
  },

  async deleteTicket(ticketId: number) {
    await api.delete(`/organizer/tickets/${ticketId}`);
  },
};

