'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import type { SeatMapValue, SeatRow, Seat } from '@/lib/movies';

interface SeatMapBuilderProps {
  capacity: number;
  tierPresets: string[];
  value: SeatMapValue;
  onChange: (value: SeatMapValue) => void;
}

const TIER_COLORS: Record<string, string> = {
  Regular: 'bg-slate-400 border-slate-500',
  VIP: 'bg-amber-400 border-amber-500',
  Premium: 'bg-purple-400 border-purple-500',
  Recliner: 'bg-rose-400 border-rose-500',
};
const DEFAULT_COLOR = 'bg-sky-400 border-sky-500';

// A, B, C ... Z, AA, AB, ... — same convention real cinemas use for rows
// once they run out of single letters.
function rowLabelForIndex(index: number): string {
  let label = '';
  let n = index;
  do {
    label = String.fromCharCode(65 + (n % 26)) + label;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return label;
}

function generateSeatMap(capacity: number, defaultTier: string): SeatMapValue {
  const seatsPerRow = Math.min(12, Math.max(4, Math.ceil(Math.sqrt(capacity * 1.6))));
  const rowCount = Math.max(1, Math.ceil(capacity / seatsPerRow));
  const rows: SeatRow[] = [];
  let remaining = capacity;
  for (let r = 0; r < rowCount; r++) {
    const label = rowLabelForIndex(r);
    const seatsInThisRow = Math.min(seatsPerRow, remaining);
    const seats: Seat[] = [];
    for (let s = 1; s <= seatsPerRow; s++) {
      seats.push({
        seat_id: `${label}${s}`,
        number: s,
        enabled: s <= seatsInThisRow,
        tier_label: s <= seatsInThisRow ? defaultTier : null,
      });
    }
    remaining -= seatsInThisRow;
    rows.push({ row_id: label, label, tier_label: defaultTier, seats });
  }
  return { screen_label: 'Screen', rows };
}

export function SeatMapBuilder({ capacity, tierPresets, value, onChange }: SeatMapBuilderProps) {
  const [confirmRegen, setConfirmRegen] = useState(false);
  const hasMap = value.rows && value.rows.length > 0;
  const presets = tierPresets.length > 0 ? tierPresets : ['Regular'];

  const handleGenerate = () => {
    onChange(generateSeatMap(Math.max(1, capacity || 1), presets[0]));
    setConfirmRegen(false);
  };

  const toggleSeat = (rowId: string, seatId: string) => {
    onChange({
      ...value,
      rows: value.rows.map((row) =>
        row.row_id !== rowId ? row : {
          ...row,
          seats: row.seats.map((seat) =>
            seat.seat_id !== seatId ? seat : {
              ...seat,
              enabled: !seat.enabled,
              tier_label: !seat.enabled ? (seat.tier_label || row.tier_label) : seat.tier_label,
            }
          ),
        }
      ),
    });
  };

  const setRowTier = (rowId: string, tier: string) => {
    onChange({
      ...value,
      rows: value.rows.map((row) =>
        row.row_id !== rowId ? row : {
          ...row,
          tier_label: tier,
          seats: row.seats.map((seat) => (seat.enabled ? { ...seat, tier_label: tier } : seat)),
        }
      ),
    });
  };

  if (!hasMap) {
    return (
      <div className="p-6 rounded-xl border border-dashed border-border text-center">
        <p className="text-sm text-muted-foreground mb-3">No seat layout yet — generate one from the capacity above, then customize it.</p>
        <Button type="button" variant="outline" onClick={handleGenerate}>
          Generate seat map ({capacity || 0} seats)
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border p-4 sm:p-5 bg-muted/20">
      <div className="mx-auto w-full max-w-xs mb-4">
        <div className="h-2 rounded-full bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
        <p className="text-center text-[10px] uppercase tracking-widest text-muted-foreground mt-1">Screen</p>
      </div>

      <div className="space-y-2 overflow-x-auto pb-2">
        {value.rows.map((row) => (
          <div key={row.row_id} className="flex items-center gap-2 min-w-max">
            <span className="w-6 text-xs font-semibold text-muted-foreground shrink-0">{row.label}</span>
            <div className="flex gap-1">
              {row.seats.map((seat) => {
                const color = seat.enabled ? (TIER_COLORS[seat.tier_label || ''] || DEFAULT_COLOR) : 'bg-transparent border-dashed border-border';
                return (
                  <button
                    key={seat.seat_id}
                    type="button"
                    title={seat.enabled ? `${seat.seat_id} — ${seat.tier_label || 'Unassigned'}` : `${seat.seat_id} — disabled (aisle/gap)`}
                    onClick={() => toggleSeat(row.row_id, seat.seat_id)}
                    className={`w-6 h-6 rounded-sm border text-[9px] font-medium flex items-center justify-center shrink-0 transition-colors ${color} ${seat.enabled ? 'text-white' : 'text-muted-foreground/40'}`}
                  >
                    {seat.number}
                  </button>
                );
              })}
            </div>
            <select
              className="h-7 rounded-lg border border-input bg-background px-2 text-xs ml-2"
              value={row.tier_label || presets[0]}
              onChange={(e) => setRowTier(row.row_id, e.target.value)}
            >
              {presets.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-border">
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          {presets.map((t) => (
            <span key={t} className="flex items-center gap-1.5">
              <span className={`w-3 h-3 rounded-sm ${(TIER_COLORS[t] || DEFAULT_COLOR).split(' ')[0]}`} /> {t}
            </span>
          ))}
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm border border-dashed border-border" /> Disabled / gap
          </span>
        </div>
        <div className="ml-auto">
          {confirmRegen ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-destructive">Discard current layout?</span>
              <Button type="button" size="sm" variant="destructive" onClick={handleGenerate}>Yes, regenerate</Button>
              <Button type="button" size="sm" variant="outline" onClick={() => setConfirmRegen(false)}>Cancel</Button>
            </div>
          ) : (
            <Button type="button" size="sm" variant="ghost" onClick={() => setConfirmRegen(true)}>
              <RefreshCw className="w-3.5 h-3.5" /> Regenerate
            </Button>
          )}
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-3">Click a seat to toggle it on/off (use this for aisles or gaps). The dropdown sets a row's ticket tier — it applies to every enabled seat in that row.</p>
    </div>
  );
}
