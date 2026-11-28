import api from './api';

export interface AdminStats {
  total_users: number;
  total_organizers: number;
  total_attendees: number;
  total_vendors: number;
  total_team: number; // admins, developers, staff
  total_events: number;
  total_tickets: number;
  total_revenue: number;
  total_transactions: number;
  platform_fee_percentage: number;
  platform_fee_total: number;
  organizer_payout_total: number;
}

export interface Paginated<T> {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
}

export interface WebhookEventRow {
  id: number;
  gateway: 'flutterwave' | 'paystack' | 'stripe' | null;
  event_type: string | null;
  signature_valid: boolean;
  reference: string | null;
  gateway_transaction_id: string | null;
  amount: string | null;
  currency: string | null;
  payment_id: number | null;
  outcome: string;
  detail: string | null;
  ip: string | null;
  created_at: string;
}

export interface FraudFlagRow {
  id: number;
  user: { id: number; name: string; email: string; role: string } | null;
  vendor: { id: number; name: string } | null;
  email: string | null;
  phone: string | null;
  reason: string;
  flagged_by: { id: number; name: string } | null;
  lifted_at: string | null;
  lifted_by: { id: number; name: string } | null;
  lift_reason: string | null;
  created_at: string;
}

export interface PatchAudit {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  unknown: number;
  packages: string[];
}

export interface PatchMajor {
  name: string;
  current: string;
  latest: string;
}

// Shape written by patch.ps1 into backend/storage/app/patch-report.json.
export interface PatchReport {
  generated_at: string;
  generated_by: string;
  mode: 'check' | 'update' | 'majors';
  result: 'updated' | 'partial' | 'check_only';
  backend: { laravel: string | null; audit: PatchAudit; audit_before: PatchAudit | null; majors: PatchMajor[]; tests: string };
  frontend: { next: string | null; audit: PatchAudit; audit_before: PatchAudit | null; majors: PatchMajor[]; build: string };
  notes: string[];
}

// Written on the live server by backend/patch-server.sh.
export interface ServerPatchRun {
  ran_at: string;
  mode: 'check' | 'apply' | 'rollback';
  result: 'success' | 'check_only' | 'rolled_back' | 'rollback_unhealthy' | 'rejected';
  detail: string;
  laravel_version: string;
  php_version: string;
  git_commit: string;
}

export interface PatchStatus {
  server: { php_version: string; laravel_version: string; environment: string; pending_migrations: string[] };
  checks: { key: string; label: string; ok: boolean; detail: string }[];
  report: PatchReport | null;
  server_patch: ServerPatchRun | null;
  // storage/app/patch-request waiting for the next cron run.
  pending_request: { command: string; created_at: string } | null;
}

export interface WalletLookup {
  user: { id: number; name: string; email: string; role: string };
  balance: number;
  debt: number;
  total_earned: number;
}

export interface WalletAdjustmentRow {
  id: number;
  amount: string; // + credit, - debit
  purpose: string;
  reference: string | null;
  created_at: string;
  user: { id: number; name: string; email: string; role: string } | null;
  creator: { id: number; name: string } | null;
}

export interface ReversalPreview {
  payment: {
    id: number;
    reference: string;
    amount: number;
    gateway: string | null;
    status: string;
    reversed_at: string | null;
    reversal_reason: string | null;
    buyer: string | null;
    buyer_email: string | null;
    event: string | null;
  };
  tickets: number;
  earnings: { user: string | null; kind: string; amount: number; description: string | null }[];
}

export interface ReversalResult {
  message: string;
  summary: {
    refunded_amount: number;
    gateway_refund_reference: string | null;
    tickets_revoked: number;
    earnings_reversed: { user_id: number; kind: string; amount: number }[];
    debts: Record<string, number>;
    buyer_flagged?: boolean;
  };
}

export interface AdminSettings {
  platform_fee_percentage: number | null;
  platform_flat_fee: number | null;
  // null = same as platform_fee_percentage
  donation_fee_percentage: number | null;
  // Platform cut of product sales; null = same as platform_fee_percentage
  marketplace_fee_percentage: number | null;
  // Stripe (USD cards): charge % + flat $, of which Spotlight keeps share %
  stripe_fee_percentage: number;
  stripe_fee_flat_usd: number;
  stripe_platform_share_percentage: number;
  site_title: string | null;
  site_description: string | null;
  site_keywords: string | null;
  og_image_url: string | null;
  has_flutterwave_webhook_secret: boolean;
  flutterwave_webhook_url: string;
  has_paystack_secret_key: boolean;
  paystack_webhook_url: string;
  has_stripe_secret_key: boolean;
  stripe_webhook_url: string;
  low_balance_threshold: number | null;
  auto_withdrawal_minimum: number | null;
  auto_withdrawals_enabled: boolean;
  flutterwave_enabled: boolean;
  paystack_enabled: boolean;
  stripe_enabled: boolean;
  usd_exchange_rate: number | null;
}

/** Where successful-payment money went; the parts add up to revenue. */
export interface RevenueBreakdown {
  revenue: number;
  credited_to_accounts: number;
  spotlight_fees: number;
  spotlight_fee_parts: { tickets: number; donations: number; shop: number; partner_commission_paid: number };
  card_processing: number;
  awaiting_delivery: number;
  unmatched: number;
  refunded: { count: number; amount: number };
}

export interface AdminDashboard {
  stats: AdminStats;
  revenue_breakdown?: RevenueBreakdown;
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

  async updateUserRole(userId: number, role: 'attendee' | 'organizer' | 'vendor' | 'admin' | 'super-admin' | 'developer' | 'staff') {
    const { data } = await api.put(`/admin/users/${userId}/role`, { role });
    return data;
  },

  async createUser(payload: { name: string; email: string; role: 'attendee'|'organizer'|'vendor'|'admin'|'super-admin'|'developer'|'staff'; staff_role_id?: number | null; password: string }) {
    const { data } = await api.post('/admin/users', payload);
    return data;
  },

  async updateUser(userId: number, payload: Partial<{ name: string; email: string; role: 'attendee'|'organizer'|'vendor'|'admin'|'super-admin'|'developer'|'staff'; staff_role_id: number | null; password: string }>) {
    const { data } = await api.put(`/admin/users/${userId}`, payload);
    return data;
  },

  async deleteEvent(eventId: number) {
    await api.delete(`/admin/events/${eventId}`);
  },

  async deleteUser(userId: number) {
    await api.delete(`/admin/users/${userId}`);
  },

  async deleteTicket(ticketId: number) {
    await api.delete(`/admin/tickets/${ticketId}`);
  },

  async createEvent(payload: {
    title: string;
    description: string;
    date: string;
    time?: string;
    venue: string;
    category: string;
    price: number;
    total_tickets: number;
    image?: string;
    user_id?: number;
    fee_payer?: 'organizer' | 'attendee';
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
    fee_payer: 'organizer' | 'attendee';
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

  /** A new password for a locked-out user, returned once (optionally emailed to them). */
  async generatePassword(userId: number, sendEmail: boolean) {
    const { data } = await api.post(`/admin/users/${userId}/generate-password`, { send_email: sendEmail });
    return data as { password: string; emailed: boolean; sessions_signed_out: number };
  },

  async lookupWallet(email: string): Promise<WalletLookup> {
    const { data } = await api.get('/admin/wallet-adjustments/lookup', { params: { email } });
    return data;
  },

  async getWalletAdjustments(params?: { page?: number; user_id?: number }) {
    const { data } = await api.get('/admin/wallet-adjustments', { params });
    return data as Paginated<WalletAdjustmentRow>;
  },

  async adjustWallet(payload: { user_id: number; direction: 'credit' | 'debit'; amount: number; purpose: string; reference?: string }) {
    const { data } = await api.post('/admin/wallet-adjustments', payload);
    return data as { adjustment: WalletAdjustmentRow; wallet: WalletLookup };
  },

  async getReversalPreview(paymentId: number): Promise<ReversalPreview> {
    const { data } = await api.get(`/admin/payments/${paymentId}/reversal`);
    return data;
  },

  async reversePayment(paymentId: number, payload: { reason: string; already_refunded?: boolean; flag_buyer?: boolean }): Promise<ReversalResult> {
    const { data } = await api.post(`/admin/payments/${paymentId}/reverse`, payload);
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
    donation_fee_percentage: number | null;
    marketplace_fee_percentage: number | null;
    stripe_fee_percentage: number;
    stripe_fee_flat_usd: number;
    stripe_platform_share_percentage: number;
    site_title: string | null;
    site_description: string | null;
    site_keywords: string | null;
    flutterwave_webhook_secret_hash: string | null;
    low_balance_threshold: number | null;
    auto_withdrawal_minimum: number | null;
    auto_withdrawals_enabled: boolean;
    flutterwave_enabled: boolean;
    paystack_enabled: boolean;
    stripe_enabled: boolean;
    usd_exchange_rate: number | null;
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

  async getWebhookEvents(params?: { gateway?: string; outcome?: string; search?: string; page?: number }) {
    const { data } = await api.get('/admin/settings/webhook-events', { params });
    return data as { events: Paginated<WebhookEventRow>; last_24h: Record<string, number> };
  },

  async getWebhookEvent(id: number) {
    const { data } = await api.get(`/admin/settings/webhook-events/${id}`);
    return data as WebhookEventRow & { payload: unknown };
  },

  async getFraudFlags(params?: { status?: 'active' | 'lifted' | 'all'; search?: string; page?: number }) {
    const { data } = await api.get('/admin/fraud-flags', { params });
    return data as Paginated<FraudFlagRow>;
  },

  async createFraudFlag(payload: { target: 'user' | 'vendor' | 'contact'; user_email?: string; vendor_id?: number; email?: string; phone?: string; reason: string }) {
    const { data } = await api.post('/admin/fraud-flags', payload);
    return data as FraudFlagRow;
  },

  async liftFraudFlag(id: number, reason: string) {
    const { data } = await api.post(`/admin/fraud-flags/${id}/lift`, { reason });
    return data as FraudFlagRow;
  },

  async getPatchStatus(): Promise<PatchStatus> {
    const { data } = await api.get('/admin/settings/patch-status');
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

  async downloadExport(resource: 'users' | 'events' | 'tickets' | 'payments' | 'activity-logs', format: 'csv' | 'xlsx' | 'pdf', filters?: Record<string, any>) {
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

