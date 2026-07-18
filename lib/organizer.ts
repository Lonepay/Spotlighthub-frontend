import api from './api';

export interface OrganizerStats {
  total_earnings: number;
  total_tickets_sold: number;
  total_events: number;
}

export interface OrganizerDashboard {
  events: any[];
  stats: OrganizerStats;
  recent_payments: any[];
  earnings_by_event: any[];
}

export const organizer = {
  async getDashboard(): Promise<OrganizerDashboard> {
    const { data } = await api.get('/organizer/dashboard');
    return data;
  },

  async getEventStats(eventId: number) {
    const { data } = await api.get(`/organizer/events/${eventId}/stats`);
    return data;
  },
};

