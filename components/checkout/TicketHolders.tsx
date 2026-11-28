'use client';

import { useState } from 'react';
import { Users, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { EventCartEntry, TicketHolder } from '@/lib/cart';

/**
 * "Some of these tickets are for other people": one name + email per
 * ticket. Each person gets their own ticket by email; blank rows stay with
 * the buyer.
 */
export function TicketHolders({
  entry,
  buyerName,
  onChange,
}: {
  entry: EventCartEntry;
  buyerName: string;
  onChange: (attendees: TicketHolder[] | undefined) => void;
}) {
  // One slot per ticket, labelled with its ticket type.
  const slots = entry.items.flatMap((line) =>
    Array.from({ length: line.quantity }, () => line.variation?.name ?? 'Ticket')
  );
  const filled = (entry.attendees ?? []).some((h) => h && (h.name.trim() || h.email.trim()));
  const [open, setOpen] = useState(filled);

  if (slots.length === 0) return null;

  const holders: TicketHolder[] = slots.map((_, i) => entry.attendees?.[i] ?? { name: '', email: '' });

  const update = (i: number, patch: Partial<TicketHolder>) => {
    const next = holders.map((h, k) => (k === i ? { ...h, ...patch } : h));
    onChange(next.some((h) => h.name.trim() || h.email.trim()) ? next : undefined);
  };

  const toggle = () => {
    if (open) onChange(undefined); // closing = all tickets back to the buyer
    setOpen(!open);
  };

  return (
    <div className="mt-3">
      <button type="button" onClick={toggle} aria-expanded={open}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
        <Users className="h-3.5 w-3.5" />
        {slots.length > 1 ? 'Some tickets are for other people' : 'This ticket is for someone else'}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="mt-3 space-y-3 rounded-xl border border-border p-3">
          <p className="text-xs text-muted-foreground">
            Each person gets their ticket by email. Leave a row blank to keep that ticket{buyerName ? `, ${buyerName.split(' ')[0]}` : ''}; you&apos;ll still receive every ticket and the receipt.
          </p>
          {holders.map((h, i) => (
            <div key={i} className="grid grid-cols-1 sm:grid-cols-[6.5rem_1fr_1fr] gap-2 items-center">
              <span className="text-xs font-medium text-muted-foreground">#{i + 1} · {slots[i]}</span>
              <Input aria-label={`Ticket ${i + 1} name`} placeholder="Full name" value={h.name} maxLength={255}
                onChange={(e) => update(i, { name: e.target.value })} className="h-9 text-sm" />
              <Input aria-label={`Ticket ${i + 1} email`} type="email" placeholder="Email" value={h.email}
                onChange={(e) => update(i, { email: e.target.value })} className="h-9 text-sm" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** A row that's half filled in (name without email or the reverse), or a bad email. */
export function invalidHolder(entry: EventCartEntry): number | null {
  const list = entry.attendees ?? [];
  for (let i = 0; i < list.length; i++) {
    const h = list[i];
    if (!h) continue;
    const name = h.name.trim();
    const email = h.email.trim();
    if (!name && !email) continue;
    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return i + 1;
  }
  return null;
}
