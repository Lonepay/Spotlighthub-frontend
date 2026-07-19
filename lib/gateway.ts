import api from './api';

export interface GatewayStatus {
  flutterwave_enabled: boolean;
  paystack_enabled: boolean;
}

export const gateway = {
  async status(): Promise<GatewayStatus> {
    const { data } = await api.get('/gateway-status');
    return data;
  },
};
