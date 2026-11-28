import api from './api';

export interface PromoterRow {
  id: number;
  event_id: number;
  name: string;
  type: 'person' | 'organization';
  code: string;
  commission_percentage: number | null; // own override; null = event default
  effective_percentage: number;
  is_active: boolean;
  earning: boolean;
  clicks: number;
  account: { id: number; name: string; email: string } | null;
  orders: number;
  tickets_sold: number;
  sales_amount: number;
  commission_earned: number;
  created_at: string;
  event?: { id: number; title: string; date: string | null; image: string | null } | null;
}

export interface EventPromoters {
  promoter_commission_percentage: number | null;
  promoters: PromoterRow[];
}

// ?ref=CODE from a promoter link, remembered per event until checkout.
const REF_KEY = 'promoter_refs';
const REF_TTL_MS = 30 * 24 * 60 * 60 * 1000;

type RefStore = Record<string, { code: string; at: number }>;

function readRefs(): RefStore {
  try {
    const refs = JSON.parse(localStorage.getItem(REF_KEY) || '{}') as RefStore;
    const now = Date.now();
    return Object.fromEntries(Object.entries(refs).filter(([, r]) => r && now - r.at < REF_TTL_MS));
  } catch {
    return {};
  }
}

export const promoters = {
  async forEvent(eventId: number): Promise<EventPromoters> {
    const { data } = await api.get(`/events/${eventId}/promoters`);
    return data;
  },

  async setDefaultPercentage(eventId: number, percentage: number | null): Promise<EventPromoters> {
    const { data } = await api.put(`/events/${eventId}/promotion`, { promoter_commission_percentage: percentage });
    return data;
  },

  async create(eventId: number, payload: { email: string; name?: string; type: 'person' | 'organization'; commission_percentage?: number | null }): Promise<PromoterRow> {
    const { data } = await api.post(`/events/${eventId}/promoters`, payload);
    return data;
  },

  async update(eventId: number, promoterId: number, payload: Partial<{ name: string; type: 'person' | 'organization'; commission_percentage: number | null; is_active: boolean }>): Promise<PromoterRow> {
    const { data } = await api.put(`/events/${eventId}/promoters/${promoterId}`, payload);
    return data;
  },

  async remove(eventId: number, promoterId: number): Promise<{ message: string; paused?: boolean }> {
    const { data } = await api.delete(`/events/${eventId}/promoters/${promoterId}`);
    return data;
  },

  /** A promoter code typed in at checkout: who it credits and for which event. */
  async lookup(code: string): Promise<{ code: string; event_id: number; name: string }> {
    const { data } = await api.get(`/promoters/${encodeURIComponent(code.trim().toUpperCase())}`);
    return data;
  },

  async mine(): Promise<{ totals: { tickets: number; commission: number }; links: PromoterRow[] }> {
    const { data } = await api.get('/promoter/links');
    return data;
  },

  /** Remembers a promoter code for this event and counts the visit (once per browser session). */
  rememberRef(eventId: number, code: string) {
    const clean = code.trim().toUpperCase().slice(0, 32);
    if (!clean) return;
    try {
      const refs = readRefs();
      refs[String(eventId)] = { code: clean, at: Date.now() };
      localStorage.setItem(REF_KEY, JSON.stringify(refs));

      const seenKey = `promoter_click_${clean}`;
      if (!sessionStorage.getItem(seenKey)) {
        sessionStorage.setItem(seenKey, '1');
        api.post(`/promoters/${encodeURIComponent(clean)}/click`).catch(() => {});
      }
    } catch {
      // storage unavailable (private mode): the sale just won't be attributed
    }
  },

  refFor(eventId: number): string | undefined {
    return readRefs()[String(eventId)]?.code;
  },
};
