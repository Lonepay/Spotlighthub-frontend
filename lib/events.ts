import api from './api';

export interface Event {
  id: number;
  title: string;
  description: string;
  category: string;
  venue: string;
  location?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  is_virtual?: boolean;
  date: string;
  time: string;
  price: number;
  total_tickets: number;
  image?: string;
  user_id: number;
  user?: {
    id: number;
    name: string;
    email: string;
    is_verified?: boolean;
  };
  available_tickets?: number;
  fee_payer?: 'organizer' | 'attendee';
  created_at: string;
  updated_at: string;
}

export interface EventFilters {
  search?: string;
  category?: string;
  page?: number;
  when?: 'past';
  sort?: 'trending';
}

export interface TicketVariation {
  id: number;
  event_id: number;
  name: string;
  description?: string | null;
  price: number;
  quantity: number;
  available_quantity: number;
}

export interface CategoryCount {
  category: string;
  event_count: number;
}

export const events = {
  async getCategories(): Promise<CategoryCount[]> {
    const { data } = await api.get('/events/categories');
    return data;
  },

  async getAll(filters?: EventFilters) {
    const params: any = {};

    if (filters) {
      if (filters.page) params.page = filters.page;
      if (filters.search && filters.search.trim()) params.search = filters.search.trim();
      if (filters.category) params.category = filters.category;
      if (filters.when) params.when = filters.when;
      if (filters.sort) params.sort = filters.sort;
    }

    const { data } = await api.get('/events', { params });
    return data;
  },

  async getOne(id: number) {
    const { data } = await api.get(`/events/${id}`);
    return data;
  },

  async create(eventData: FormData) {
    const { data } = await api.post('/events', eventData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },

  async update(id: number, eventData: FormData) {
    eventData.append('_method', 'PUT');
    const { data } = await api.post(`/events/${id}`, eventData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },

  async delete(id: number) {
    await api.delete(`/events/${id}`);
  },

  async getVariations(id: number): Promise<TicketVariation[]> {
    const { data } = await api.get(`/events/${id}/variations`);
    return data.data || data;
  },

  async createVariation(eventId: number, payload: { name: string; description?: string; price: number; quantity: number }): Promise<TicketVariation> {
    const { data } = await api.post(`/events/${eventId}/variations`, payload);
    return data.data || data;
  },

  async updateVariation(eventId: number, variationId: number, payload: Partial<{ name: string; description: string; price: number; quantity: number }>): Promise<TicketVariation> {
    const { data } = await api.put(`/events/${eventId}/variations/${variationId}`, payload);
    return data.data || data;
  },

  async deleteVariation(eventId: number, variationId: number): Promise<void> {
    await api.delete(`/events/${eventId}/variations/${variationId}`);
  },

  async reorderVariations(eventId: number, orderedIds: number[]): Promise<TicketVariation[]> {
    const { data } = await api.put(`/events/${eventId}/variations/reorder`, { order: orderedIds });
    return data.data || data;
  },
};

