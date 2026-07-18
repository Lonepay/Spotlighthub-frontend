import api from './api';

export type CheckInResult = 'success' | 'already_checked_in' | 'revoked' | 'not_found' | 'unauthorized';

export interface CheckInResponse {
  message: string;
  result: CheckInResult;
  ticket?: {
    id: number;
    code: string;
    status: string;
    checked_in_at: string | null;
    attendee_name?: string;
    attendee_email?: string;
    event?: { id: number; title: string; date: string; time: string; venue: string };
    variation?: { id: number; name: string } | null;
  };
}

export const checkin = {
  async checkIn(code: string): Promise<CheckInResponse> {
    try {
      const { data } = await api.post('/tickets/check-in', { code });
      return data;
    } catch (err: any) {
      if (err.response?.data) {
        return err.response.data;
      }
      throw err;
    }
  },
};
