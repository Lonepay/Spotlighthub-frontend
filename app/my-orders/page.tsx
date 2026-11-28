'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Truck, Store, Phone } from 'lucide-react';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { PaginationFooter } from '@/components/dashboard/PaginationFooter';
import { Loader } from '@/components/Loader';
import { Paginated } from '@/lib/admin';
import { shop, ShopOrder, STATUS_LABEL, naira } from '@/lib/shop';

/** A buyer's product orders and where each one is. */
export default function MyOrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [orders, setOrders] = useState<Paginated<ShopOrder> | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login?next=/my-orders');
      return;
    }
    shop.myOrders(page).then(setOrders).catch(() => setOrders(null));
  }, [authLoading, user, router, page]);

  return (
    <DashboardShell title="My Orders" description="Products you've bought from vendors on Spotlight.">
      {!orders ? (
        <div className="py-16 flex justify-center"><Loader size={32} /></div>
      ) : orders.data.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center space-y-3">
            <ShoppingBag className="w-10 h-10 mx-auto text-muted-foreground" />
            <p className="font-medium">No orders yet</p>
            <Button asChild variant="outline"><Link href="/shop">Browse the shop</Link></Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.data.map((o) => (
            <Card key={o.id}>
              <CardContent className="p-5 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{o.vendor?.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{o.reference} · {new Date(o.created_at).toLocaleDateString('en-NG', { dateStyle: 'medium' })}</p>
                  </div>
                  <Badge variant={o.status === 'delivered' ? 'default' : o.status === 'refunded' ? 'destructive' : 'secondary'}>{STATUS_LABEL[o.status]}</Badge>
                </div>
                <ul className="text-sm space-y-1">
                  {o.items.map((line) => (
                    <li key={line.id} className="flex justify-between gap-3"><span>{line.quantity} × {line.name}</span><span className="tabular-nums">{naira(line.line_total)}</span></li>
                  ))}
                  {Number(o.delivery_fee) > 0 && <li className="flex justify-between text-muted-foreground"><span>Delivery</span><span>{naira(o.delivery_fee)}</span></li>}
                  <li className="flex justify-between font-semibold pt-1 border-t border-border"><span>Total</span><span>{naira(o.total)}</span></li>
                </ul>
                <div className="text-sm text-muted-foreground space-y-1">
                  {o.delivery_method === 'delivery'
                    ? <p className="flex items-start gap-1.5"><Truck className="w-4 h-4 mt-0.5 shrink-0" /> Delivering to {o.delivery_address}</p>
                    : <p className="flex items-start gap-1.5"><Store className="w-4 h-4 mt-0.5 shrink-0" /> Pickup{o.vendor?.pickup_address ? ` from ${o.vendor.pickup_address}` : ''}</p>}
                  {o.vendor_note && <p>Note from the vendor: {o.vendor_note}</p>}
                  {o.vendor?.contact_phone && <p className="flex items-center gap-1.5"><Phone className="w-4 h-4" /> <a href={`tel:${o.vendor.contact_phone}`} className="hover:underline">{o.vendor.contact_phone}</a></p>}
                </div>
              </CardContent>
            </Card>
          ))}
          {orders.last_page > 1 && <PaginationFooter meta={orders} onPageChange={setPage} />}
        </div>
      )}
    </DashboardShell>
  );
}
