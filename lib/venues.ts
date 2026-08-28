import api from './api';

export interface VenuePricingTier {
  id: number;
  venue_id: number;
  name: string;
  description?: string | null;
  price: number;
  display_order?: number | null;
}

export interface Venue {
  id: number;
  user_id: number;
  name: string;
  tagline?: string | null;
  description?: string | null;
  location?: string | null;
  city: string;
  cover_image?: string | null;
  cover_image_url?: string | null;
  available_from?: string | null;
  available_to?: string | null;
  daily_open_time?: string | null;
  daily_close_time?: string | null;
  pricing_tiers?: VenuePricingTier[];
  created_at: string;
  updated_at: string;
}

export const venues = {
  async getAll(): Promise<Venue[]> {
    const { data } = await api.get('/venues');
    return data;
  },

  async getOne(id: number): Promise<Venue> {
    const { data } = await api.get(`/venues/${id}`);
    return data;
  },

  async create(venueData: FormData): Promise<Venue> {
    const { data } = await api.post('/venues', venueData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async update(id: number, venueData: FormData): Promise<Venue> {
    venueData.append('_method', 'PUT');
    const { data } = await api.post(`/venues/${id}`, venueData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/venues/${id}`);
  },

  async getTiers(venueId: number): Promise<VenuePricingTier[]> {
    const { data } = await api.get(`/venues/${venueId}/tiers`);
    return data.data || data;
  },

  async createTier(venueId: number, payload: { name: string; description?: string; price: number }): Promise<VenuePricingTier> {
    const { data } = await api.post(`/venues/${venueId}/tiers`, payload);
    return data.data || data;
  },

  async updateTier(venueId: number, tierId: number, payload: Partial<{ name: string; description: string; price: number }>): Promise<VenuePricingTier> {
    const { data } = await api.put(`/venues/${venueId}/tiers/${tierId}`, payload);
    return data.data || data;
  },

  async deleteTier(venueId: number, tierId: number): Promise<void> {
    await api.delete(`/venues/${venueId}/tiers/${tierId}`);
  },
};
