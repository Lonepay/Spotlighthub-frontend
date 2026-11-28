'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Loader } from '@/components/Loader';
import { events, EventDonations } from '@/lib/events';

const naira = (n: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 2 }).format(n);

/** Organizer: every donation to this event, and what they receive after the platform fee. */
export function EventDonationsPanel({ eventId, acceptsDonations, showWhenEmpty = false }: { eventId: number; acceptsDonations: boolean; showWhenEmpty?: boolean }) {
  const [data, setData] = useState<EventDonations | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async (page = 1) => {
    setLoading(true);
    try {
      setData(await events.getDonations(eventId, page));
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const totals = data?.totals;
  const page = data?.donations;

  // Nothing to show for an event that never took donations.
  if (!showWhenEmpty && !acceptsDonations && !loading && (!totals || totals.count === 0)) return null;

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div>
          <h2 className="font-display font-bold text-lg flex items-center gap-2"><Heart className="w-5 h-5" /> Donations</h2>
          {!acceptsDonations && (
            <p className="text-sm text-muted-foreground">
              Donations are switched off for this event.{' '}
              <Link href={`/organizer/events/${eventId}`} className="text-primary hover:underline">Turn them on under Edit Event</Link>{' '}
              (tick &ldquo;Accept donations&rdquo;) to show a &ldquo;Donate to show support&rdquo; box on your event page.
            </p>
          )}
        </div>

        {loading && <div className="py-6 flex justify-center"><Loader size={28} /></div>}

        {!loading && totals && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Tile label="Donations" value={String(totals.count)} />
            <Tile label="Total donated" value={naira(totals.gross)} />
            <Tile label="Platform fee" value={naira(totals.fees)} />
            <Tile label="You receive" value={naira(totals.net)} strong />
          </div>
        )}

        {!loading && page && page.data.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">No donations yet. Share your event link to start receiving support.</p>
        )}

        {!loading && page && page.data.length > 0 && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Donor</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead className="text-right">Donated</TableHead>
                  <TableHead className="text-right">You receive</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {page.data.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>
                      <div className="font-medium">{d.donor}</div>
                      {d.email && <div className="text-xs text-muted-foreground">{d.email}</div>}
                    </TableCell>
                    <TableCell className="max-w-[260px] text-sm text-muted-foreground whitespace-pre-wrap break-words">{d.message || '—'}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">{naira(d.amount)}</TableCell>
                    <TableCell className="text-right whitespace-nowrap font-medium">{naira(d.net_amount)}</TableCell>
                    <TableCell className="whitespace-nowrap text-sm">{new Date(d.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {page && page.last_page > 1 && (
          <div className="flex items-center justify-end gap-2 text-sm">
            <Button variant="outline" size="sm" disabled={page.current_page <= 1} onClick={() => load(page.current_page - 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-muted-foreground">Page {page.current_page} of {page.last_page}</span>
            <Button variant="outline" size="sm" disabled={page.current_page >= page.last_page} onClick={() => load(page.current_page + 1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Tile({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="p-3 rounded-lg border border-border">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`font-display ${strong ? 'font-bold text-lg' : 'font-semibold'}`}>{value}</div>
    </div>
  );
}
