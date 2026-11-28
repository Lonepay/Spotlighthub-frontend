'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { useAuth } from '@/components/AuthProvider';
import { isStaffRole } from '@/lib/auth';
import { organizer } from '@/lib/organizer';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader } from '@/components/Loader';
import { Calendar, Search } from 'lucide-react';

export type PickedEvent = {
  id: number;
  title: string;
  date: string | null;
  tickets_count: number;
  accepts_donations?: boolean;
  user?: { name: string };
};

type Props = {
  title: string;
  description: string;
  emptyText: string;
  /** e.g. '/organizer/attendees' - the chosen event goes in ?event= */
  basePath: string;
  children: (event: PickedEvent) => React.ReactNode;
};

/** A dashboard page about one event at a time: pick it, then see its details. */
export function EventPickerPage(props: Props) {
  return (
    <Suspense fallback={null}>
      <Inner {...props} />
    </Suspense>
  );
}

function Inner({ title, description, emptyText, basePath, children }: Props) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [eventList, setEventList] = useState<PickedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const selectedId = Number(searchParams.get('event')) || null;

  useEffect(() => {
    if (authLoading) return;
    if (!user || (user.role !== 'organizer' && !isStaffRole(user.role))) {
      router.push('/login');
      return;
    }
    organizer.getDashboard()
      .then((d) => setEventList(d.events as PickedEvent[]))
      .catch(() => setEventList([]))
      .finally(() => setLoading(false));
  }, [authLoading, user, router]);

  const selected = eventList.find((e) => e.id === selectedId) ?? null;
  const shown = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return q ? eventList.filter((e) => e.title.toLowerCase().includes(q) || e.user?.name?.toLowerCase().includes(q)) : eventList;
  }, [eventList, filter]);

  const choose = (id: number) => router.push(`${basePath}?event=${id}`);
  const fmt = (d: string, opts: Intl.DateTimeFormatOptions) => new Date(d).toLocaleDateString('en-NG', opts);

  return (
    <DashboardShell title={title} description={description}>
      {loading ? (
        <div className="py-16 flex justify-center"><Loader size={32} /></div>
      ) : eventList.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">{emptyText}</CardContent></Card>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardContent className="p-4 flex flex-col sm:flex-row gap-3 sm:items-center">
              <label htmlFor="event-picker" className="text-sm font-medium shrink-0 flex items-center gap-2"><Calendar className="w-4 h-4" /> Event</label>
              <select
                id="event-picker"
                className="h-10 border border-input bg-background px-3 text-sm flex-1 min-w-0"
                value={selectedId ?? ''}
                onChange={(e) => e.target.value && choose(Number(e.target.value))}
              >
                <option value="">Choose an event…</option>
                {eventList.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.title}{e.date ? ` — ${fmt(e.date, { day: 'numeric', month: 'short', year: 'numeric' })}` : ''} ({e.tickets_count} tickets)
                  </option>
                ))}
              </select>
            </CardContent>
          </Card>

          {selected ? (
            children(selected)
          ) : (
            <Card>
              <CardContent className="p-4 sm:p-6 space-y-4">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Find an event" className="pl-9" />
                </div>
                <div className="divide-y divide-border">
                  {shown.map((e) => (
                    <button key={e.id} type="button" onClick={() => choose(e.id)} className="w-full text-left py-3 flex items-center justify-between gap-3 hover:bg-muted/50 px-2">
                      <div className="min-w-0">
                        <div className="font-medium truncate">{e.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {e.date ? fmt(e.date, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : 'No date'}
                          {e.user?.name ? ` · ${e.user.name}` : ''}
                        </div>
                      </div>
                      <span className="text-sm text-muted-foreground shrink-0">{e.tickets_count} tickets</span>
                    </button>
                  ))}
                  {shown.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No events match.</p>}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </DashboardShell>
  );
}
