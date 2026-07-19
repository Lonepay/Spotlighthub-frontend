import api from './api';

export interface Coupon {
  id: number;
  event_id: number;
  created_by: number;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CouponValidation {
  valid: boolean;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  discount_amount: number;
}

export const coupons = {
  async list(eventId: number): Promise<Coupon[]> {
    const { data } = await api.get(`/events/${eventId}/coupons`);
    return data.data || data;
  },

  async create(eventId: number, payload: {
    code: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    max_uses?: number | null;
    expires_at?: string | null;
    is_active?: boolean;
  }): Promise<Coupon> {
    const { data } = await api.post(`/events/${eventId}/coupons`, payload);
    return data.data || data;
  },

  async update(eventId: number, couponId: number, payload: Partial<{
    code: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    max_uses: number | null;
    expires_at: string | null;
    is_active: boolean;
  }>): Promise<Coupon> {
    const { data } = await api.put(`/events/${eventId}/coupons/${couponId}`, payload);
    return data.data || data;
  },

  async delete(eventId: number, couponId: number): Promise<void> {
    await api.delete(`/events/${eventId}/coupons/${couponId}`);
  },

  async validate(eventId: number, code: string, quantity: number, variationId?: number | null): Promise<CouponValidation> {
    const { data } = await api.post(`/events/${eventId}/coupons/validate`, {
      code,
      quantity,
      variation_id: variationId ?? undefined,
    });
    return data;
  },
};
