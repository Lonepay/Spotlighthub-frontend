'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Copy, Megaphone, Ticket, Wallet, MousePointerClick } from 'lucide-react';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { StatCard } from '@/components/dashboard/StatCard';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Loader } from '@/components/Loader';
import { NairaSign } from '@/components/icons/NairaSign';
import { promoters, PromoterRow } from '@/lib/promoters';
import { eventUrl } from '@/lib/eventLink';
import { storageUrl } from '@/lib/storage';

const naira = (n: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(n);

/** A promoter's own links: copy and share them, see clicks, tickets and commission. */
export default function PromoterPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<{ totals: { tickets: number; commission: number }; links: PromoterRow[] } | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    promoters.mine().then(setData).catch(() => setData({ totals: { tickets: 0, commission: 0 }, links: [] }));
  }, [authLoading, user, router]);

  const linkFor = (p: PromoterRow) => (p.event ? `${eventUrl(p.event)}?ref=${p.code}` : '');

  const copy = (p: PromoterRow) => {
    const url = linkFor(p);
    navigator.clipboard?.writeText(url).then(() => toast.success('Link copied'), () => toast.info(url));
  };

  const totalClicks = data?.links.reduce((sum, l) => sum + l.clicks, 0) ?? 0;

  return (
    <DashboardShell title="My Promotions" description="Your promoter links. Share them; you earn a commission on every ticket sold through them.">
      {!data ? (
        <div className="py-16 flex justify-center"><Loader size={32} /></div>
      ) : data.links.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center space-y-2">
            <Megaphone className="w-8 h-8 mx-auto text-muted-foreground" />
            <p className="font-medium">No promoter links yet</p>
            <p className="text-sm text-muted-foreground">When an organizer adds you as a promoter for their event, your link shows up here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="grid sm:grid-cols-3 gap-4">
            <StatCard icon={MousePointerClick} label="Link visits" value={totalClicks.toLocaleString('en-NG')} />
            <StatCard icon={Ticket} label="Tickets sold" value={data.totals.tickets.toLocaleString('en-NG')} />
            <StatCard icon={NairaSign} label="Commission earned" value={naira(data.totals.commission)} />
          </div>

          {data.totals.commission > 0 && (
            <Button asChild variant="outline" size="sm">
              <Link href="/organizer/wallet"><Wallet className="w-4 h-4" /> Withdraw from your wallet</Link>
            </Button>
          )}

          <div className="grid gap-4">
            {data.links.map((p) => (
              <Card key={p.id}>
                <CardContent className="p-4 flex flex-col sm:flex-row gap-4">
                  {p.event?.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={storageUrl(p.event.image) ?? ''} alt="" className="w-full sm:w-32 h-32 sm:h-20 object-cover" />
                  )}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold truncate">{p.event?.title ?? 'Event'}</h3>
                      {p.earning ? <Badge variant="secondary">{p.effective_percentage}% commission</Badge> : <Badge variant="outline">Paused</Badge>}
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-muted px-2 py-1 truncate flex-1 min-w-0">{linkFor(p)}</code>
                      <Button size="sm" variant="outline" onClick={() => copy(p)}><Copy className="w-4 h-4" /> Copy</Button>
                    </div>
                    <div className="text-sm text-muted-foreground flex flex-wrap gap-x-4">
                      <span>{p.clicks} visits</span>
                      <span>{p.tickets_sold} tickets</span>
                      <span>{naira(p.sales_amount)} sales</span>
                      <span className="font-semibold text-foreground">{naira(p.commission_earned)} earned</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
