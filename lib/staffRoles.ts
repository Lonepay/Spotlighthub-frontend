import api from './api';
import { StaffRole } from './auth';

export const PERMISSION_LABELS: Record<string, string> = {
  view_users: 'View Organizers & Attendees',
  support_tickets: 'Support Tickets (view & reply)',
  finance: 'Financial: Withdrawals & Payments',
  operations: 'Events, KYC, Blog & Vendors management',
};

export const staffRoles = {
  async list(): Promise<{ roles: StaffRole[]; available_permissions: Record<string, string> }> {
    const { data } = await api.get('/admin/staff-roles');
    return data;
  },

  async create(payload: { name: string; duties?: string; permissions: string[] }): Promise<StaffRole> {
    const { data } = await api.post('/admin/staff-roles', payload);
    return data;
  },

  async update(id: number, payload: { name: string; duties?: string; permissions: string[] }): Promise<StaffRole> {
    const { data } = await api.put(`/admin/staff-roles/${id}`, payload);
    return data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/admin/staff-roles/${id}`);
  },
};
