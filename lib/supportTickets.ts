import api from './api';

export interface SupportTicketMessage {
  id: number;
  support_ticket_id: number;
  user_id: number;
  message: string;
  created_at: string;
  user?: { id: number; name: string; role?: string };
}

export interface SupportTicket {
  id: number;
  user_id: number;
  subject: string;
  status: 'open' | 'pending' | 'resolved' | 'closed';
  assigned_to: number | null;
  created_at: string;
  updated_at: string;
  user?: { id: number; name: string; email: string; role?: string };
  assignee?: { id: number; name: string } | null;
  messages?: SupportTicketMessage[];
  messages_count?: number;
}

export const supportTickets = {
  async list(status?: string) {
    const { data } = await api.get('/support-tickets', { params: status ? { status } : undefined });
    return data;
  },

  async create(subject: string, message: string): Promise<SupportTicket> {
    const { data } = await api.post('/support-tickets', { subject, message });
    return data;
  },

  async get(id: number): Promise<SupportTicket> {
    const { data } = await api.get(`/support-tickets/${id}`);
    return data;
  },

  async reply(id: number, message: string): Promise<SupportTicketMessage> {
    const { data } = await api.post(`/support-tickets/${id}/messages`, { message });
    return data;
  },

  async updateStatus(id: number, status: SupportTicket['status']): Promise<SupportTicket> {
    const { data } = await api.put(`/support-tickets/${id}/status`, { status });
    return data;
  },
};
