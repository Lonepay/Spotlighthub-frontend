import api from './api';

export interface Vendor {
  id: number;
  name: string;
  category: string;
  description?: string | null;
  city: string;
  cover_image?: string | null;
  contact_email: string;
  contact_phone?: string | null;
  website?: string | null;
  instagram?: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface VendorCategoryCount {
  category: string;
  vendor_count: number;
}

export interface PaginatedVendors {
  data: Vendor[];
  current_page: number;
  last_page: number;
}

export const vendors = {
  // Public directory — no auth required, only published listings.
  async getPublicAll(params?: { search?: string; category?: string; city?: string; page?: number }): Promise<PaginatedVendors> {
    const { data } = await api.get('/vendors', { params });
    return data;
  },

  async getPublicOne(id: number): Promise<Vendor> {
    const { data } = await api.get(`/vendors/${id}`);
    return data;
  },

  async getCategories(): Promise<VendorCategoryCount[]> {
    const { data } = await api.get('/vendors/categories');
    return data;
  },

  // Admin-managed directory CRUD.
  async adminGetAll(params?: { search?: string; page?: number }): Promise<PaginatedVendors> {
    const { data } = await api.get('/admin/vendors', { params });
    return data;
  },

  async create(vendorData: FormData): Promise<Vendor> {
    const { data } = await api.post('/admin/vendors', vendorData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async update(id: number, vendorData: FormData): Promise<Vendor> {
    vendorData.append('_method', 'PUT');
    const { data } = await api.post(`/admin/vendors/${id}`, vendorData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/admin/vendors/${id}`);
  },
};
