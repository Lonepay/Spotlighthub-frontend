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

  // "Find My Ticket" is a 3-step, OTP-gated flow — see TicketController for why.
  async requestLookupCode(email: string): Promise<{ message: string }> {
    const { data } = await api.post('/tickets/lookup/request-code', { email });
    return data;
  },

  async verifyLookupCode(email: string, otp: string): Promise<{ tickets: FoundTicket[] }> {
    const { data } = await api.post('/tickets/lookup/verify', { email, otp });
    return data;
  },

  async resendSelected(email: string, otp: string, ticketIds: number[]): Promise<{ message: string }> {
    const { data } = await api.post('/tickets/lookup/resend-selected', { email, otp, ticket_ids: ticketIds });
    return data;
  },
};

export interface FoundTicket {
  id: number;
  status: string;
  event: {
    title: string;
    date: string;
    time: string;
    venue: string;
    is_virtual: boolean;
  } | null;
  variation: { name: string } | null;
}

