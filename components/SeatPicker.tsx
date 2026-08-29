'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { seatHolds, SeatStatusEntry, SeatStatus } from '@/lib/seatHolds';
import type { MovieShowtime, MovieTicketTier } from '@/lib/movies';
import { toast } from 'sonner';

const TIER_COLORS: Record<string, string> = {
  Regular: 'bg-slate-400 border-slate-500',
  VIP: 'bg-amber-400 border-amber-500',
  Premium: 'bg-purple-400 border-purple-500',
  Recliner: 'bg-rose-400 border-rose-500',
};
const DEFAULT_COLOR = 'bg-sky-400 border-sky-500';

interface SeatPickerProps {
  movieId: number;
  showtime: MovieShowtime;
  ticketTiers: MovieTicketTier[];
  sessionToken: string;
  onSelectionChange: (seatIds: string[], holdExpiresAt: string | null) => void;
}

export function SeatPicker({ movieId, showtime, ticketTiers, sessionToken, onSelectionChange }: SeatPickerProps) {
  const [seats, setSeats] = useState<SeatStatusEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [holdExpiresAt, setHoldExpiresAt] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const pendingRef = useRef(false);

  const loadStatus = useCallback(async () => {
    try {
      const data = await seatHolds.status(movieId, showtime.id, sessionToken);
      setSeats(data);
      const mine = data.filter((s) => s.status === 'held_by_you');
      const expires = mine[0]?.expires_at ?? null;
      setHoldExpiresAt(expires);
      onSelectionChange(mine.map((s) => s.seat_id), expires);
    } catch {
      // ignore transient poll failures — the next tick retries
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movieId, showtime.id, sessionToken]);

  useEffect(() => {
    loadStatus();
    const poll = setInterval(loadStatus, 10000);
    const onFocus = () => loadStatus();
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(poll);
      window.removeEventListener('focus', onFocus);
    };
  }, [loadStatus]);

  useEffect(() => {
    if (!holdExpiresAt) return;
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, [holdExpiresAt]);

  useEffect(() => {
    // Best-effort release on unmount — not guaranteed on tab close, but the
    // real backstop is the server's own lazy 15-minute expiry either way.
    return () => {
      const mine = seats.filter((s) => s.status === 'held_by_you').map((s) => s.seat_id);
      if (mine.length > 0) {
        seatHolds.release(movieId, showtime.id, mine, sessionToken).catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSeatClick = async (seatId: string, status: SeatStatus) => {
    if (pendingRef.current || status === 'sold' || status === 'held_by_other') return;

    pendingRef.current = true;
    try {
      if (status === 'held_by_you') {
        await seatHolds.release(movieId, showtime.id, [seatId], sessionToken);
      } else {
        const currentlyMine = seats.filter((s) => s.status === 'held_by_you').map((s) => s.seat_id);
        await seatHolds.hold(movieId, showtime.id, [...currentlyMine, seatId], sessionToken);
      }
      await loadStatus();
    } catch (error: any) {
      if (error.response?.status === 409) {
        toast.error('That seat was just taken — refreshing availability.');
        await loadStatus();
      } else {
        toast.error('Failed to update seat selection');
      }
    } finally {
      pendingRef.current = false;
    }
  };

  const seatMap = showtime.seat_map;

  if (loading) {
    return <div className="p-6 text-center text-muted-foreground text-sm">Loading seat map…</div>;
  }
  if (!seatMap || seatMap.rows.length === 0) {
    return <div className="p-6 text-center text-muted-foreground text-sm">No seat map set up for this showtime yet.</div>;
  }

  const liveById = new Map(seats.map((s) => [s.seat_id, s]));
  const secondsLeft = holdExpiresAt ? Math.max(0, Math.floor((new Date(holdExpiresAt).getTime() - now) / 1000)) : null;

  return (
    <div className="rounded-xl border border-border p-4 sm:p-5 bg-muted/20">
      <div className="mx-auto w-full max-w-xs mb-4">
        <div className="h-2 rounded-full bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
        <p className="text-center text-[10px] uppercase tracking-widest text-muted-foreground mt-1">{seatMap.screen_label || 'Screen'}</p>
      </div>

      <div className="space-y-1.5 sm:space-y-2 -mx-4 sm:mx-0 px-4 sm:px-0 overflow-x-auto pb-2">
        {seatMap.rows.map((row) => (
          <div key={row.row_id} className="flex items-center gap-2 min-w-max">
            <span className="w-5 sm:w-6 text-xs font-semibold text-muted-foreground shrink-0">{row.label}</span>
            <div className="flex gap-1.5">
              {row.seats.filter((s) => s.enabled).map((seat) => {
                const live = liveById.get(seat.seat_id);
                const status: SeatStatus = live?.status ?? 'available';
                const tierLabel = live?.tier_label ?? seat.tier_label ?? row.tier_label ?? '';
                const colorClass =
                  status === 'sold' ? 'bg-transparent border-dashed border-border cursor-not-allowed'
                  : status === 'held_by_other' ? 'bg-muted border-border cursor-not-allowed opacity-50'
                  : status === 'held_by_you' ? 'bg-primary border-primary text-white'
                  : `${TIER_COLORS[tierLabel] || DEFAULT_COLOR} text-white`;

                return (
                  <button
                    key={seat.seat_id}
                    type="button"
                    title={`${seat.seat_id} — ${tierLabel || 'Unassigned'} (${status.replace('_', ' ')})`}
                    onClick={() => handleSeatClick(seat.seat_id, status)}
                    disabled={status === 'sold' || status === 'held_by_other'}
                    className={`w-7 h-7 rounded-sm border text-[9px] font-medium flex items-center justify-center shrink-0 transition-colors touch-manipulation ${colorClass}`}
                  >
                    {seat.number}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-border text-xs text-muted-foreground">
        {ticketTiers.map((t) => (
          <span key={t.id} className="flex items-center gap-1.5">
            <span className={`w-3 h-3 rounded-sm ${(TIER_COLORS[t.name] || DEFAULT_COLOR).split(' ')[0]}`} /> {t.name}
          </span>
        ))}
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-primary" /> Your selection</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-muted opacity-50" /> Held by another buyer</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm border border-dashed border-border" /> Sold</span>
      </div>

      {secondsLeft !== null && (
        <p className="text-xs mt-3 font-medium text-primary">
          Your seats are held for {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')} — complete checkout before then.
        </p>
      )}
    </div>
  );
}
