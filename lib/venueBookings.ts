import api from './api';

export type BookingStatus = 'available' | 'held_by_you' | 'held_by_other' | 'sold';

export interface BookingDateEntry {
  date: string;
  status: BookingStatus;
}

export const venueBookings = {
  async status(venueId: number, from?: string, to?: string, sessionToken?: string): Promise<BookingDateEntry[]> {
    const { data } = await api.get(`/venues/${venueId}/bookings`, {
      params: { from, to, session_token: sessionToken },
    });
    return data.dates || [];
  },

  async hold(venueId: number, bookingDate: string, sessionToken: string): Promise<{ expires_at: string }> {
    const { data } = await api.post(`/venues/${venueId}/bookings/hold`, {
      booking_date: bookingDate,
      session_token: sessionToken,
    });
    return data;
  },

  async release(venueId: number, bookingDate: string, sessionToken: string): Promise<void> {
    await api.post(`/venues/${venueId}/bookings/release`, {
      booking_date: bookingDate,
      session_token: sessionToken,
    });
  },
};
