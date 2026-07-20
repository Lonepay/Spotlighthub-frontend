import api from './api';

export interface VendorInquiry {
  id: number;
  business_name: string;
  contact_name: string;
  email: string;
  phone?: string | null;
  location?: string | null;
  message: string;
  status: 'new' | 'contacted' | 'closed';
  created_at: string;
}

export const vendorInquiries = {
  async submit(data: { business_name: string; contact_name: string; email: string; phone?: string; location?: string; message: string }) {
    const { data: res } = await api.post('/vendor-inquiries', data);
    return res;
  },

  async list(params?: { status?: string; page?: number }) {
    const { data } = await api.get('/admin/vendor-inquiries', { params });
    return data;
  },

  async updateStatus(id: number, status: 'new' | 'contacted' | 'closed') {
    const { data } = await api.put(`/admin/vendor-inquiries/${id}/status`, { status });
    return data;
  },
};
