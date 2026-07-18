import api from './api';

export interface WalletSummary {
  balance: number;
  total_earned: number;
  total_withdrawn: number;
  pending_withdrawals: number;
}

export interface Withdrawal {
  id: number;
  amount: number;
  fee_amount: number;
  payable_amount: number;
  bank_name: string | null;
  account_number: string | null;
  account_name: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  admin_notes: string | null;
  created_at: string;
  user?: { id: number; name: string; email: string };
}

export const wallet = {
  async summary(): Promise<WalletSummary> {
    const { data } = await api.get('/organizer/wallet');
    return data;
  },

  async earnings(page = 1) {
    const { data } = await api.get('/organizer/wallet/earnings', { params: { page } });
    return data;
  },

  async withdrawals(page = 1) {
    const { data } = await api.get('/organizer/wallet/withdrawals', { params: { page } });
    return data;
  },

  async requestWithdrawal(payload: { amount: number; bank_name: string; account_number: string; account_name: string }) {
    const { data } = await api.post('/organizer/wallet/withdrawals', payload);
    return data as Withdrawal;
  },

  async adminList(status?: string) {
    const { data } = await api.get('/admin/withdrawals', { params: { status } });
    return data;
  },

  async adminApprove(id: number) {
    const { data } = await api.post(`/admin/withdrawals/${id}/approve`);
    return data;
  },

  async adminMarkPaid(id: number) {
    const { data } = await api.post(`/admin/withdrawals/${id}/paid`);
    return data;
  },

  async adminReject(id: number, reason: string) {
    const { data } = await api.post(`/admin/withdrawals/${id}/reject`, { reason });
    return data;
  },
};
