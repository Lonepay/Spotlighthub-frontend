import api from './api';
import { Paginated } from './admin';

export type AnnouncementTone = 'info' | 'success' | 'warning';
export type AnnouncementAudience = 'all' | 'organizers' | 'vendors' | 'attendees' | 'staff';

/** What the ticker shows (admin posts plus the automatic KYC reminder). */
export interface TickerItem {
  id: string;
  message: string;
  link_url: string | null;
  link_label: string | null;
  tone: AnnouncementTone;
  dismissible: boolean;
}

export interface Announcement {
  id: number;
  message: string;
  link_url: string | null;
  link_label: string | null;
  audience: AnnouncementAudience;
  tone: AnnouncementTone;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  creator: { id: number; name: string } | null;
  created_at: string;
}

export type AnnouncementInput = Partial<Pick<Announcement, 'message' | 'link_url' | 'link_label' | 'audience' | 'tone' | 'starts_at' | 'ends_at' | 'is_active'>>;

export const announcements = {
  async mine(): Promise<TickerItem[]> {
    const { data } = await api.get('/announcements');
    return data.announcements;
  },

  async list(page = 1) {
    const { data } = await api.get('/admin/announcements', { params: { page } });
    return data as Paginated<Announcement>;
  },

  async create(payload: AnnouncementInput): Promise<Announcement> {
    const { data } = await api.post('/admin/announcements', payload);
    return data;
  },

  async update(id: number, payload: AnnouncementInput): Promise<Announcement> {
    const { data } = await api.put(`/admin/announcements/${id}`, payload);
    return data;
  },

  async remove(id: number) {
    await api.delete(`/admin/announcements/${id}`);
  },
};
