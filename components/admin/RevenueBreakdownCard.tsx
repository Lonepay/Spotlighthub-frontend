'use client';

import { Card, CardContent } from '@/components/ui/card';
import { RevenueBreakdown } from '@/lib/admin';

const naira = (n: number) => `₦${n.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;

/**
 * Where the money from successful payments went. The lines always add up to
 * total revenue; anything the records can't explain shows as "Unmatched"
 * rather than being hidden.
 */
export function RevenueBreakdownCard({ data }: { data: RevenueBreakdown }) {
  const lines: { label: string; value: number; hint: string; strong?: boolean; warn?: boolean }[] = [
    { label: 'Credited to organizers, vendors & promoters', value: data.credited_to_accounts, hint: 'Their earnings from these orders (withdrawn or still in wallets)' },
    {
      label: 'Spotlight fees',
      value: data.spotlight_fees,
      hint: `Tickets ${naira(data.spotlight_fee_parts.tickets)} · donations ${naira(data.spotlight_fee_parts.donations)} · shop ${naira(data.spotlight_fee_parts.shop)}${data.spotlight_fee_parts.partner_commission_paid > 0 ? ` · minus partner commission ${naira(data.spotlight_fee_parts.partner_commission_paid)}` : ''}`,
      strong: true,
    },
  ];
  if (data.card_processing > 0) lines.push({ label: 'Card processing (Stripe)', value: data.card_processing, hint: "Stripe's share of the card fee" });
  if (data.awaiting_delivery > 0) lines.push({ label: 'Shop orders awaiting delivery', value: data.awaiting_delivery, hint: 'Paid to the vendor once they mark it delivered' });
  if (Math.abs(data.unmatched) >= 1) lines.push({ label: 'Unmatched', value: data.unmatched, hint: 'Orders with no earnings recorded (usually from before the current system)', warn: true });

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="font-display font-bold text-lg mb-4">Revenue breakdown</h2>
        <div className="divide-y divide-border border border-border rounded-[0.7rem]">
          {lines.map((l) => (
            <div key={l.label} className="flex items-start justify-between gap-4 p-4">
              <div className="min-w-0">
                <p className={`text-sm ${l.strong ? 'font-semibold' : 'font-medium'} ${l.warn ? 'text-amber-600 dark:text-amber-400' : ''}`}>{l.label}</p>
                <p className="text-xs text-muted-foreground">{l.hint}</p>
              </div>
              <span className={`font-display font-bold tabular-nums whitespace-nowrap ${l.warn ? 'text-amber-600 dark:text-amber-400' : ''}`}>{naira(l.value)}</span>
            </div>
          ))}
          <div className="flex items-center justify-between gap-4 p-4 bg-muted/40">
            <p className="font-semibold">Total revenue</p>
            <span className="font-display font-bold text-lg tabular-nums">{naira(data.revenue)}</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          From successful payments only.
          {data.refunded.count > 0 && ` ${data.refunded.count} refunded order${data.refunded.count === 1 ? '' : 's'} (${naira(data.refunded.amount)}) are left out.`}
          {' '}Fee rates are under Settings → General &amp; Fees.
        </p>
      </CardContent>
    </Card>
  );
}
