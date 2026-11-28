'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Package, Truck, Store, Phone, Mail } from 'lucide-react';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { PaginationFooter } from '@/components/dashboard/PaginationFooter';
import { Loader } from '@/components/Loader';
import { Paginated } from '@/lib/admin';
import { shop, ShopOrder, ShopOrderStatus, STATUS_LABEL, naira } from '@/lib/shop';

const FILTERS: { id: string; label: string }[] = [
  { id: 'open', label: 'To fulfil' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'refunded', label: 'Refunded' },
  { id: '', label: 'All' },
];

/** The next steps a vendor can take from each status (mirrors the backend). */
function nextSteps(order: ShopOrder): { status: ShopOrderStatus; label: string }[] {
  const handover = order.delivery_method === 'delivery'
    ? { status: 'shipped' as const, label: 'Out for delivery' }
    : { status: 'ready' as const, label: 'Ready for pickup' };
  switch (order.status) {
    case 'paid':
      return [{ status: 'processing', label: 'Start preparing' }, handover, { status: 'delivered', label: 'Mark delivered' }];
    case 'processing':
      return [handover, { status: 'delivered', label: 'Mark delivered' }];
    case 'ready':
    case 'shipped':
      return [{ status: 'delivered', label: 'Mark delivered' }];
    default:
      return [];
  }
}

function statusBadge(status: ShopOrderStatus) {
  if (status === 'delivered') return <Badge variant="default">{STATUS_LABEL[status]}</Badge>;
  if (status === 'refunded') return <Badge variant="destructive">{STATUS_LABEL[status]}</Badge>;
  if (status === 'paid') return <Badge className="bg-amber-500 text-white">{STATUS_LABEL[status]}</Badge>;
  return <Badge variant="secondary">{STATUS_LABEL[status]}</Badge>;
}

export default function VendorOrdersPage() {
  const [filter, setFilter] = useState('open');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ orders: Paginated<ShopOrder>; counts: Record<string, number> } | null>(null);
  const [busy, setBusy] = useState<number | null>(null);

  const load = () => shop.vendorOrders({ status: filter || undefined, page }).then(setData).catch(() => setData(null));
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, page]);

  const move = async (order: ShopOrder, status: ShopOrderStatus) => {
    let note: string | undefined;
    if (status === 'delivered' && !window.confirm(`Mark ${order.reference} as delivered? You'll be paid ${naira(order.vendor_payout ?? 0)} into your wallet.`)) return;
    if (status === 'ready' || status === 'shipped') {
      note = window.prompt('Add a note for the buyer (optional)', status === 'ready' ? 'Pickup times: ' : 'Rider: ') ?? undefined;
    }
    setBusy(order.id);
    try {
      await shop.setOrderStatus(order.id, status, note?.trim() || undefined);
      toast.success(`${order.reference}: ${STATUS_LABEL[status]}. The buyer has been emailed.`);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not update the order');
    } finally {
      setBusy(null);
    }
  };

  const openCount = data ? ['paid', 'processing', 'ready', 'shipped'].reduce((s, k) => s + (data.counts[k] ?? 0), 0) : 0;

  return (
    <DashboardShell title="Orders" description="Prepare each order, hand it over, then mark it delivered to get paid.">
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button key={f.id} type="button" onClick={() => { setFilter(f.id); setPage(1); }}
              className={`px-3 h-9 rounded-full text-sm border ${filter === f.id ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'}`}>
              {f.label}{f.id === 'open' && openCount > 0 ? ` (${openCount})` : f.id && data?.counts[f.id] ? ` (${data.counts[f.id]})` : ''}
            </button>
          ))}
        </div>

        {!data ? (
          <div className="py-16 flex justify-center"><Loader size={32} /></div>
        ) : data.orders.data.length === 0 ? (
          <Card><CardContent className="p-10 text-center text-muted-foreground"><Package className="w-8 h-8 mx-auto mb-2" /> No orders here.</CardContent></Card>
        ) : (
          <div className="space-y-4">
            {data.orders.data.map((o) => (
              <Card key={o.id}>
                <CardContent className="p-5 space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-sm font-semibold">{o.reference}</p>
                      <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                    </div>
                    {statusBadge(o.status)}
                  </div>

                  <ul className="text-sm space-y-1">
                    {o.items.map((line) => (
                      <li key={line.id} className="flex justify-between gap-3">
                        <span>{line.quantity} × {line.name}</span>
                        <span className="tabular-nums">{naira(line.line_total)}</span>
                      </li>
                    ))}
                    {Number(o.delivery_fee) > 0 && (
                      <li className="flex justify-between gap-3 text-muted-foreground"><span>Delivery</span><span className="tabular-nums">{naira(o.delivery_fee)}</span></li>
                    )}
                    <li className="flex justify-between gap-3 pt-1 border-t border-border text-muted-foreground">
                      <span>You receive (after {Number(o.fee_percentage)}% fee)</span>
                      <span className="tabular-nums font-semibold text-foreground">{naira(o.vendor_payout ?? 0)}</span>
                    </li>
                  </ul>

                  <div className="grid sm:grid-cols-2 gap-3 text-sm">
                    <div className="space-y-1">
                      <p className="font-medium">{o.buyer_name}</p>
                      <p className="text-muted-foreground flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> <a href={`mailto:${o.buyer_email}`} className="hover:underline">{o.buyer_email}</a></p>
                      {o.buyer_phone && <p className="text-muted-foreground flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> <a href={`tel:${o.buyer_phone}`} className="hover:underline">{o.buyer_phone}</a></p>}
                    </div>
                    <div className="text-muted-foreground">
                      {o.delivery_method === 'delivery' ? (
                        <p className="flex items-start gap-1.5"><Truck className="w-4 h-4 mt-0.5 shrink-0" /> Deliver to: {o.delivery_address}</p>
                      ) : (
                        <p className="flex items-start gap-1.5"><Store className="w-4 h-4 mt-0.5 shrink-0" /> Buyer picks up</p>
                      )}
                      {o.vendor_note && <p className="mt-1 text-xs">Your note: {o.vendor_note}</p>}
                    </div>
                  </div>

                  {nextSteps(o).length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {nextSteps(o).map((step) => (
                        <Button key={step.status} size="sm" variant={step.status === 'delivered' ? 'default' : 'outline'} disabled={busy === o.id} onClick={() => move(o, step.status)}>
                          {step.label}
                        </Button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            {data.orders.last_page > 1 && <PaginationFooter meta={data.orders} onPageChange={setPage} />}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
