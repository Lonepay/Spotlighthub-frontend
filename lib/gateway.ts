import api from './api';

export type PaymentGateway = 'flutterwave' | 'paystack' | 'stripe';

export interface GatewayStatus {
  flutterwave_enabled: boolean;
  paystack_enabled: boolean;
  stripe_enabled: boolean;
  usd_exchange_rate?: number | null;
  platform_fee_percentage?: number;
  platform_flat_fee?: number;
  // Stripe (USD cards) has its own fee: percentage of the order + flat USD
  stripe_fee_percentage?: number;
  stripe_fee_flat_usd?: number;
  stripe_platform_share_percentage?: number; // Spotlight's part of the Stripe fee
}

/**
 * Estimated ticket fee in NGN for a subtotal on a gateway - mirrors
 * Setting::calculateFee() on the backend (which decides the real charge).
 */
export function estimateFee(subtotal: number, gw: PaymentGateway, info: GatewayStatus): number {
  if (subtotal <= 0) return 0;
  const fee = gw === 'stripe'
    ? subtotal * (info.stripe_fee_percentage ?? 0) / 100 + (info.stripe_fee_flat_usd ?? 0) * (info.usd_exchange_rate ?? 0)
    : subtotal * (info.platform_fee_percentage ?? 0) / 100 + (info.platform_flat_fee ?? 0);
  return Math.round(fee * 100) / 100;
}

export const gateway = {
  async status(): Promise<GatewayStatus> {
    const { data } = await api.get('/gateway-status');
    return data;
  },
};
