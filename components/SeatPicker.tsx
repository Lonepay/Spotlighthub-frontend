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

// A tap must never wait on the network to feel like it worked — this is how
// long we batch rapid taps before actually syncing the hold to the server.
const SYNC_DEBOUNCE_MS = 350;

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
  const [localSelection, setLocalSelection] = useState<string[]>([]);
  const [holdExpiresAt, setHoldExpiresAt] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  // Click handling is synchronous and instant; these refs coordinate the
  // debounced, serialized network sync that happens in the background.
  const localSelectionRef = useRef<string[]>([]);
  const syncedRef = useRef<string[]>([]); // last selection actually confirmed held by the server
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightRef = useRef(false);
  const dirtyRef = useRef(false); // a newer selection arrived while a sync was in flight

  const loadStatus = useCallback(async () => {
    try {
      const data = await seatHolds.status(movieId, showtime.id, sessionToken);
      setSeats(data);
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

  // Server truth only overwrites the buyer's own in-progress selection when
  // nothing is actively being tapped/synced — otherwise a slow poll response
  // landing mid-tap would stomp on seats the user just picked.
  useEffect(() => {
    if (debounceTimerRef.current || inFlightRef.current || dirtyRef.current) return;
    const mine = seats.filter((s) => s.status === 'held_by_you').map((s) => s.seat_id);
    localSelectionRef.current = mine;
    syncedRef.current = mine;
    setLocalSelection(mine);
  }, [seats]);

  useEffect(() => {
    if (!holdExpiresAt) return;
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, [holdExpiresAt]);

  const runSync = useCallback(async () => {
    if (inFlightRef.current) {
      dirtyRef.current = true;
      return;
    }
    inFlightRef.current = true;
    dirtyRef.current = false;
    const desired = localSelectionRef.current;
    const previouslySynced = syncedRef.current;
    // hold() only ever adds/renews the seats it's given — it never drops
    // ones missing from the list, so a seat the buyer deselects has to be
    // released explicitly or it sits reserved for the full 15 minutes.
    const droppedSeats = previouslySynced.filter((id) => !desired.includes(id));

    try {
      if (desired.length === 0) {
        if (previouslySynced.length > 0) {
          await seatHolds.release(movieId, showtime.id, previouslySynced, sessionToken);
        }
        syncedRef.current = [];
        setHoldExpiresAt(null);
      } else {
        const result = await seatHolds.hold(movieId, showtime.id, desired, sessionToken);
        syncedRef.current = desired;
        setHoldExpiresAt(result.expires_at);
        onSelectionChange(desired, result.expires_at);
        if (droppedSeats.length > 0) {
          seatHolds.release(movieId, showtime.id, droppedSeats, sessionToken).catch(() => {});
        }
      }
    } catch (error: any) {
      const conflicts: string[] = error?.response?.data?.conflicts ?? [];
      if (conflicts.length > 0) {
        toast.error(conflicts.length > 1 ? 'Some of those seats were just taken.' : 'That seat was just taken.');
        localSelectionRef.current = localSelectionRef.current.filter((id) => !conflicts.includes(id));
        setLocalSelection(localSelectionRef.current);
        dirtyRef.current = true; // retry with the trimmed, non-conflicting selection
      } else {
        toast.error('Failed to update seat selection');
      }
      loadStatus();
    } finally {
      inFlightRef.current = false;
      if (dirtyRef.current) runSync();
    }
  }, [movieId, showtime.id, sessionToken, onSelectionChange, loadStatus]);

  const scheduleSync = useCallback(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      debounceTimerRef.current = null;
      runSync();
    }, SYNC_DEBOUNCE_MS);
  }, [runSync]);

  useEffect(() => {
    // Best-effort release on unmount — not guaranteed on tab close, but the
    // real backstop is the server's own lazy 15-minute expiry either way.
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (syncedRef.current.length > 0) {
        seatHolds.release(movieId, showtime.id, syncedRef.current, sessionToken).catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSeatClick = (seatId: string, status: SeatStatus) => {
    if (status === 'sold' || status === 'held_by_other') return;

    const next = localSelectionRef.current.includes(seatId)
      ? localSelectionRef.current.filter((id) => id !== seatId)
      : [...localSelectionRef.current, seatId];
    localSelectionRef.current = next;
    setLocalSelection(next);
    // Instant feedback for the price/Add-to-cart button — expires_at catches
    // up once the debounced hold actually confirms with the server.
    onSelectionChange(next, holdExpiresAt);
    scheduleSync();
  };

  const seatMap = showtime.seat_map;

  if (loading) {
    return <div className="p-6 text-center text-muted-foreground text-sm">Loading seat map…</div>;
  }
  if (!seatMap || seatMap.rows.length === 0) {
    return <div className="p-6 text-center text-muted-foreground text-sm">No seat map set up for this showtime yet.</div>;
  }

  const liveById = new Map(seats.map((s) => [s.seat_id, s]));
  const mySelection = new Set(localSelection);
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
                // Own selection is decided locally (instant) — everyone
                // else's held/sold status still comes from the poll.
                const status: SeatStatus = mySelection.has(seat.seat_id)
                  ? 'held_by_you'
                  : (live?.status === 'held_by_you' ? 'available' : live?.status ?? 'available');
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
