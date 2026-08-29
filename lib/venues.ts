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

export interface PublicVenuesResponse {
  data: Venue[];
  current_page: number;
  last_page: number;
}

export const venues = {
  // Organizer-scoped: only the caller's own venues (or all, for admin/staff
  // with the 'operations' permission). Lives at /organizer/venues, not
  // /venues — the public browse routes below occupy that path instead.
  async getAll(): Promise<Venue[]> {
    const { data } = await api.get('/organizer/venues');
    return data;
  },

  async getOne(id: number): Promise<Venue> {
    const { data } = await api.get(`/organizer/venues/${id}`);
    return data;
  },

  // Public browse — no auth required, closed venues (available_to in the past) excluded.
  async getPublicAll(params?: { city?: string; search?: string; page?: number }): Promise<PublicVenuesResponse> {
    const { data } = await api.get('/venues', { params });
    return data;
  },

  async getPublicOne(id: number): Promise<Venue> {
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
