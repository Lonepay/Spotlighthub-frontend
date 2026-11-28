import api from './api';
import { Paginated } from './admin';

export interface AttendeeRow {
  id: number;
  name: string | null;
  email: string | null;
  phone: string | null;
  ticket_type: string;
  code: string;
  status: string;
  checked_in_at: string | null;
  purchased_at: string | null;
  order_reference: string | null;
}

export interface CustomerRow {
  name: string | null;
  email: string;
  phone: string | null;
  tickets: number;
  first_purchase: string;
  last_purchase: string;
}

export interface AttendeeSummary {
  total: number;
  checked_in: number;
  revoked: number;
  customers: number;
  ticket_types: { id: number; name: string }[];
}

export interface AttendeeFilters {
  view?: 'attendees' | 'customers';
  search?: string;
  status?: string;
  ticket_type?: number | '';
  sort?: string;
  direction?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

const clean = (f: AttendeeFilters) =>
  Object.fromEntries(Object.entries(f).filter(([, v]) => v !== '' && v !== undefined && v !== null));

export const attendees = {
  async list(eventId: number, filters: AttendeeFilters) {
    const { data } = await api.get(`/organizer/events/${eventId}/attendees`, { params: clean(filters) });
    return data as { summary: AttendeeSummary; attendees?: Paginated<AttendeeRow>; customers?: Paginated<CustomerRow> };
  },

  async update(ticketId: number, payload: Partial<{ attendee_name: string; attendee_email: string | null; attendee_phone: string | null }>) {
    const { data } = await api.put(`/organizer/tickets/${ticketId}/attendee`, payload);
    return data as AttendeeRow;
  },

  async download(eventId: number, format: 'csv' | 'xlsx', filters: AttendeeFilters, filename: string) {
    const { page, per_page, ...rest } = filters;
    const { data } = await api.get(`/organizer/events/${eventId}/attendees/export`, {
      params: { ...clean(rest), format },
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([data]));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.${format}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
