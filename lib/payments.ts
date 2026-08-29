import api from './api';
import { CartEntry } from './cart';

export interface Payment {
  id: number;
  reference: string;
  amount: number;
  quantity: number;
  status: 'pending' | 'success' | 'failed';
  event_id: number;
  user_id: number;
  authorization_url?: string;
  access_code?: string;
  created_at: string;
  updated_at: string;
  booking_date?: string;
  booking_time?: string;
}

export interface PaymentItem {
  variationId?: number | null;
  quantity: number;
}

export const payments = {
  async initialize(
    eventId: number,
    items: PaymentItem[],
    email: string,
    attendeeName: string,
    attendeePhone: string,
    gateway: 'flutterwave' | 'paystack' = 'flutterwave',
    bookingDate?: string,
    bookingTime?: string,
    couponCode?: string | null
  ) {
    const { data } = await api.post(`/events/${eventId}/payments/initialize`, {
      items: items.map((i) => ({ variation_id: i.variationId ?? undefined, quantity: i.quantity })),
      email,
      attendee_name: attendeeName,
      attendee_phone: attendeePhone,
      gateway,
      booking_date: bookingDate,
      booking_time: bookingTime,
      coupon_code: couponCode ?? undefined,
    });
    return data;
  },

  // Unified multi-item cart checkout — an Event, a Movie, and a Venue can
  // all be in the same payment. Serializes each CartEntry into the shape
  // PaymentController::initializeMulti expects; price/tier resolution for
  // movie seats happens server-side (each seat carries its own tier from
  // the seat map), so the buyer never has to pick a tier separately.
  async initializeMulti(
    entries: CartEntry[],
    email: string,
    attendeeName: string,
    attendeePhone: string,
    gateway: 'flutterwave' | 'paystack' = 'flutterwave',
    couponCode?: string | null
  ) {
    // An Event cart entry can carry several ticket-tier lines (e.g. 2x
    // Regular + 1x VIP) — the backend's per-entry loop expects one "event"
    // item per line, so expand those out; Movie/Venue entries map 1:1.
    const expanded: Record<string, unknown>[] = entries.flatMap((entry): Record<string, unknown>[] => {
      if (entry.type === 'event') {
        return entry.items.map((line) => ({
          type: 'event',
          event_id: entry.event.id,
          variation_id: line.variation?.id,
          quantity: line.quantity,
          booking_date: entry.selectedDate,
          booking_time: entry.selectedTime,
        }));
      }
      if (entry.type === 'movie') {
        return [{
          type: 'movie',
          showtime_id: entry.showtime.id,
          seat_ids: entry.seatIds,
          addons: entry.addons.map((a) => ({ addon_id: a.addonId, quantity: a.quantity })),
          session_token: entry.sessionToken,
        }];
      }
      return [{
        type: 'venue',
        venue_id: entry.venue.id,
        tier_id: entry.tier.id,
        booking_date: entry.bookingDate,
        session_token: entry.sessionToken,
      }];
    });

    const { data } = await api.post('/payments/initialize', {
      entries: expanded,
      email,
      attendee_name: attendeeName,
      attendee_phone: attendeePhone,
      gateway,
      coupon_code: couponCode ?? undefined,
    });
    return data;
  },

  async verify(transactionId: string) {
    const { data } = await api.post('/payments/verify', { transaction_id: transactionId });
    return data;
  },

  async downloadReceipt(paymentId: number, filename?: string, guestEmail?: string) {
    const response = await api.get(`/payments/${paymentId}/receipt`, {
      responseType: 'blob',
      params: guestEmail ? { email: guestEmail } : undefined,
    });
    const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename || `receipt-${paymentId}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(blobUrl);
  },
};
