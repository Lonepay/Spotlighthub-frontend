import api from './api';

export type SeatStatus = 'available' | 'held_by_you' | 'held_by_other' | 'sold';

export interface SeatStatusEntry {
  seat_id: string;
  tier_label: string | null;
  status: SeatStatus;
  expires_at: string | null;
}

export const seatHolds = {
  async status(movieId: number, showtimeId: number, sessionToken?: string): Promise<SeatStatusEntry[]> {
    const { data } = await api.get(`/movies/${movieId}/showtimes/${showtimeId}/seats`, {
      params: sessionToken ? { session_token: sessionToken } : {},
    });
    return data.seats || [];
  },

  async hold(movieId: number, showtimeId: number, seatIds: string[], sessionToken: string): Promise<{ expires_at: string }> {
    const { data } = await api.post(`/movies/${movieId}/showtimes/${showtimeId}/seats/hold`, {
      seat_ids: seatIds,
      session_token: sessionToken,
    });
    return data;
  },

  async release(movieId: number, showtimeId: number, seatIds: string[], sessionToken: string): Promise<void> {
    await api.post(`/movies/${movieId}/showtimes/${showtimeId}/seats/release`, {
      seat_ids: seatIds,
      session_token: sessionToken,
    });
  },
};
