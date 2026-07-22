import api from './api';

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
