import api from './api';

export interface KycInfo {
  id: number;
  name: string;
  email: string;
  kyc_status: 'none' | 'pending' | 'approved' | 'rejected';
  kyc_business_name: string | null;
  kyc_id_type: string | null;
  kyc_id_number?: string | null;
  kyc_document_path?: string | null;
  kyc_submitted_at: string | null;
  kyc_reviewed_at: string | null;
  kyc_rejection_reason: string | null;
  is_verified: boolean;
}

export const kyc = {
  async getMine(): Promise<KycInfo> {
    const { data } = await api.get('/organizer/kyc');
    return data;
  },

  async submit(payload: { kyc_business_name: string; kyc_id_type: string; kyc_id_number: string; document: File }) {
    const formData = new FormData();
    formData.append('kyc_business_name', payload.kyc_business_name);
    formData.append('kyc_id_type', payload.kyc_id_type);
    formData.append('kyc_id_number', payload.kyc_id_number);
    formData.append('document', payload.document);
    const { data } = await api.post('/organizer/kyc', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data as KycInfo;
  },

  async adminList(status?: string) {
    const { data } = await api.get('/admin/kyc', { params: { status } });
    return data;
  },

  async approve(userId: number) {
    const { data } = await api.post(`/admin/kyc/${userId}/approve`);
    return data;
  },

  async reject(userId: number, reason: string) {
    const { data } = await api.post(`/admin/kyc/${userId}/reject`, { reason });
    return data;
  },
};
