import api from './api';

export interface Seat {
  seat_id: string;
  number: number;
  enabled: boolean;
  tier_label: string | null;
}

export interface SeatRow {
  row_id: string;
  label: string;
  tier_label: string | null;
  seats: Seat[];
}

export interface SeatMapValue {
  screen_label?: string;
  rows: SeatRow[];
}

export interface MovieShowtime {
  id: number;
  movie_id: number;
  date: string;
  time: string;
  hall_name: string;
  capacity: number;
  seat_map: SeatMapValue | null;
  seat_count?: number;
}

export interface MovieTicketTier {
  id: number;
  movie_id: number;
  name: string;
  description?: string | null;
  price: number;
  quantity: number;
  available_quantity: number;
  display_order?: number | null;
}

export interface MovieAddon {
  id: number;
  movie_id: number;
  name: string;
  type: 'snack' | 'drink';
  price: number;
  description?: string | null;
  is_available: boolean;
  display_order?: number | null;
}

export interface Movie {
  id: number;
  user_id: number;
  title: string;
  tagline?: string | null;
  description?: string | null;
  city: string;
  poster?: string | null;
  poster_url?: string | null;
  showtimes?: MovieShowtime[];
  ticket_tiers?: MovieTicketTier[];
  addons?: MovieAddon[];
  created_at: string;
  updated_at: string;
}

export interface PublicMoviesResponse {
  data: Movie[];
  current_page: number;
  last_page: number;
}

export const movies = {
  // Organizer-scoped: only the caller's own movies (or all, for admin/staff
  // with the 'operations' permission). Lives at /organizer/movies, not
  // /movies — the public browse routes below occupy that path instead.
  async getAll(): Promise<Movie[]> {
    const { data } = await api.get('/organizer/movies');
    return data;
  },

  async getOne(id: number): Promise<Movie> {
    const { data } = await api.get(`/organizer/movies/${id}`);
    return data;
  },

  // Public browse — no auth required, only movies with an upcoming showtime.
  async getPublicAll(params?: { city?: string; search?: string; page?: number }): Promise<PublicMoviesResponse> {
    const { data } = await api.get('/movies', { params });
    return data;
  },

  async getPublicOne(id: number): Promise<Movie> {
    const { data } = await api.get(`/movies/${id}`);
    return data;
  },

  async create(movieData: FormData): Promise<Movie> {
    const { data } = await api.post('/movies', movieData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async update(id: number, movieData: FormData): Promise<Movie> {
    movieData.append('_method', 'PUT');
    const { data } = await api.post(`/movies/${id}`, movieData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/movies/${id}`);
  },

  async getShowtimes(movieId: number): Promise<MovieShowtime[]> {
    const { data } = await api.get(`/movies/${movieId}/showtimes`);
    return data.data || data;
  },

  async createShowtime(movieId: number, payload: { date: string; time: string; hall_name: string; capacity: number; seat_map?: SeatMapValue | null }): Promise<MovieShowtime> {
    const { data } = await api.post(`/movies/${movieId}/showtimes`, payload);
    return data.data || data;
  },

  async updateShowtime(movieId: number, showtimeId: number, payload: Partial<{ date: string; time: string; hall_name: string; capacity: number; seat_map: SeatMapValue | null }>): Promise<MovieShowtime> {
    const { data } = await api.put(`/movies/${movieId}/showtimes/${showtimeId}`, payload);
    return data.data || data;
  },

  async deleteShowtime(movieId: number, showtimeId: number): Promise<void> {
    await api.delete(`/movies/${movieId}/showtimes/${showtimeId}`);
  },

  async getTiers(movieId: number): Promise<MovieTicketTier[]> {
    const { data } = await api.get(`/movies/${movieId}/tiers`);
    return data.data || data;
  },

  async createTier(movieId: number, payload: { name: string; description?: string; price: number; quantity: number }): Promise<MovieTicketTier> {
    const { data } = await api.post(`/movies/${movieId}/tiers`, payload);
    return data.data || data;
  },

  async updateTier(movieId: number, tierId: number, payload: Partial<{ name: string; description: string; price: number; quantity: number }>): Promise<MovieTicketTier> {
    const { data } = await api.put(`/movies/${movieId}/tiers/${tierId}`, payload);
    return data.data || data;
  },

  async deleteTier(movieId: number, tierId: number): Promise<void> {
    await api.delete(`/movies/${movieId}/tiers/${tierId}`);
  },

  async reorderTiers(movieId: number, orderedIds: number[]): Promise<MovieTicketTier[]> {
    const { data } = await api.put(`/movies/${movieId}/tiers/reorder`, { order: orderedIds });
    return data.data || data;
  },

  async getAddons(movieId: number): Promise<MovieAddon[]> {
    const { data } = await api.get(`/movies/${movieId}/addons`);
    return data.data || data;
  },

  async createAddon(movieId: number, payload: { name: string; type: 'snack' | 'drink'; price: number; description?: string }): Promise<MovieAddon> {
    const { data } = await api.post(`/movies/${movieId}/addons`, payload);
    return data.data || data;
  },

  async updateAddon(movieId: number, addonId: number, payload: Partial<{ name: string; type: 'snack' | 'drink'; price: number; description: string; is_available: boolean }>): Promise<MovieAddon> {
    const { data } = await api.put(`/movies/${movieId}/addons/${addonId}`, payload);
    return data.data || data;
  },

  async deleteAddon(movieId: number, addonId: number): Promise<void> {
    await api.delete(`/movies/${movieId}/addons/${addonId}`);
  },
};
