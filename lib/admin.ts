import api from './api';

export interface AdminStats {
  total_users: number;
  total_organizers: number;
  total_attendees: number;
  total_events: number;
  total_tickets: number;
  total_revenue: number;
  total_transactions: number;
  platform_fee_percentage: number;
  platform_fee_total: number;
  organizer_payout_total: number;
}

export interface AdminSettings {
  platform_fee_percentage: number | null;
  platform_flat_fee: number | null;
  fee_payer: 'organizer' | 'attendee';
  site_title: string | null;
  site_description: string | null;
  site_keywords: string | null;
  og_image_url: string | null;
  has_flutterwave_webhook_secret: boolean;
  flutterwave_webhook_url: string;
  has_paystack_secret_key: boolean;
  paystack_webhook_url: string;
  low_balance_threshold: number | null;
  auto_withdrawal_minimum: number | null;
  auto_withdrawals_enabled: boolean;
  flutterwave_enabled: boolean;
  paystack_enabled: boolean;
}

export interface AdminDashboard {
  stats: AdminStats;
  recent_users: any[];
  recent_events: any[];
  recent_payments: any[];
  events_by_category: any[];
  revenue_trends: any[];
  top_organizers: any[];
  top_events: any[];
}

export const admin = {
  async getDashboard(): Promise<AdminDashboard> {
    const { data } = await api.get('/admin/dashboard');
    return data;
  },

  async getUsers(filters?: { role?: string; search?: string; page?: number; sort_by?: string; sort_dir?: 'asc'|'desc' }) {
    const { data } = await api.get('/admin/users', { params: filters });
    return data;
  },

  async getEvents(filters?: { search?: string; category?: string; page?: number; sort_by?: string; sort_dir?: 'asc'|'desc' }) {
    const { data } = await api.get('/admin/events', { params: filters });
    return data;
  },

  async getPayments(filters?: { status?: string; search?: string; page?: number; sort_by?: string; sort_dir?: 'asc'|'desc' }) {
    const { data } = await api.get('/admin/payments', { params: filters });
    return data;
  },

  async updateUserRole(userId: number, role: 'attendee' | 'organizer' | 'admin' | 'super-admin' | 'developer') {
    const { data } = await api.put(`/admin/users/${userId}/role`, { role });
    return data;
  },

  async createUser(payload: { name: string; email: string; role: 'attendee'|'organizer'|'admin'|'super-admin'|'developer'; password: string }) {
    const { data } = await api.post('/admin/users', payload);
    return data;
  },

  async updateUser(userId: number, payload: Partial<{ name: string; email: string; role: 'attendee'|'organizer'|'admin'|'super-admin'|'developer'; password: string }>) {
    const { data } = await api.put(`/admin/users/${userId}`, payload);
    return data;
  },

  async deleteEvent(eventId: number) {
    await api.delete(`/admin/events/${eventId}`);
  },

  async deleteUser(userId: number) {
    await api.delete(`/admin/users/${userId}`);
  },

  async createEvent(payload: {
    title: string;
    description: string;
    date: string;
    time: string;
    venue: string;
    category: string;
    price: number;
    total_tickets: number;
    image?: string;
    user_id?: number;
  }) {
    const { data } = await api.post('/admin/events', payload);
    return data;
  },

  async updateEvent(eventId: number, payload: Partial<{
    title: string;
    description: string;
    date: string;
    time: string;
    venue: string;
    category: string;
    price: number;
    total_tickets: number;
    image?: string;
  }>) {
    const { data } = await api.put(`/admin/events/${eventId}`, payload);
    return data;
  },

  async getTickets(filters?: { event_id?: number; user_id?: number; code?: string; status?: string; page?: number; sort_by?: string; sort_dir?: 'asc'|'desc' }) {
    const { data } = await api.get('/admin/tickets', { params: filters });
    return data;
  },

  async updatePaymentStatus(paymentId: number, status: 'pending'|'success'|'failed'|'refunded') {
    const { data } = await api.put(`/admin/payments/${paymentId}/status`, { status });
    return data;
  },

  async getBlogPosts(filters?: { search?: string; category?: string; page?: number; sort_by?: string; sort_dir?: 'asc'|'desc' }) {
    const { data } = await api.get('/admin/blog-posts', { params: filters });
    return data;
  },

  async createBlogPost(payload: FormData) {
    const { data } = await api.post('/admin/blog-posts', payload, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async updateBlogPost(postId: number, payload: FormData) {
    payload.append('_method', 'PUT');
    const { data } = await api.post(`/admin/blog-posts/${postId}`, payload, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async deleteBlogPost(postId: number) {
    await api.delete(`/admin/blog-posts/${postId}`);
  },

  async getSettings(): Promise<AdminSettings> {
    const { data } = await api.get('/admin/settings');
    return data;
  },

  async updateSettings(payload: Partial<{
    platform_fee_percentage: number | null;
    platform_flat_fee: number | null;
    fee_payer: 'organizer' | 'attendee';
    site_title: string | null;
    site_description: string | null;
    site_keywords: string | null;
    flutterwave_webhook_secret_hash: string | null;
    low_balance_threshold: number | null;
    auto_withdrawal_minimum: number | null;
    auto_withdrawals_enabled: boolean;
    flutterwave_enabled: boolean;
    paystack_enabled: boolean;
  }>): Promise<AdminSettings> {
    const { data } = await api.put('/admin/settings', payload);
    return data;
  },

  async uploadOgImage(file: File): Promise<AdminSettings> {
    const formData = new FormData();
    formData.append('image', file);
    const { data } = await api.post('/admin/settings/og-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async clearCache() {
    const { data } = await api.post('/admin/settings/cache/clear');
    return data;
  },

  async getActivityLogs(filters?: { search?: string; action?: string; category?: string; user_id?: number; from?: string; to?: string; page?: number }) {
    const { data } = await api.get('/admin/settings/activity-logs', { params: filters });
    return data;
  },

  async getActivityLogActions(): Promise<string[]> {
    const { data } = await api.get('/admin/settings/activity-log-actions');
    return data;
  },

  async getErrorLogs(limit = 100) {
    const { data } = await api.get('/admin/settings/error-logs', { params: { limit } });
    return data as { entries: string[] };
  },

  async clearErrorLogs() {
    const { data } = await api.delete('/admin/settings/error-logs');
    return data;
  },

  async downloadErrorLogsExport(format: 'csv' | 'pdf', limit = 1000) {
    const { data } = await api.get('/admin/settings/error-logs/export', {
      params: { format, limit },
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([data]));
    const link = document.createElement('a');
    link.href = url;
    link.download = `error-logs-export.${format}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  async downloadExport(resource: 'users' | 'events' | 'tickets' | 'payments' | 'activity-logs', format: 'csv' | 'pdf', filters?: Record<string, any>) {
    const { data } = await api.get(`/admin/export/${resource}`, {
      params: { ...filters, format },
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([data]));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${resource}-export.${format}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

