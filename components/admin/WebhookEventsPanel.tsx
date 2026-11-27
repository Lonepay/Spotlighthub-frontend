'use client';

import { Fragment, useEffect, useState } from 'react';
import { admin, Paginated, WebhookEventRow } from '@/lib/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader } from '@/components/Loader';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';

const OUTCOMES: { value: string; label: string; tone: 'good' | 'bad' | 'neutral' }[] = [
  { value: 'fulfilled', label: 'Fulfilled', tone: 'good' },
  { value: 'already_fulfilled', label: 'Already fulfilled', tone: 'neutral' },
  { value: 'amount_mismatch', label: 'Amount mismatch', tone: 'bad' },
  { value: 'not_confirmed', label: 'Not confirmed by gateway', tone: 'bad' },
  { value: 'unknown_payment', label: 'Unknown order', tone: 'bad' },
  { value: 'invalid_signature', label: 'Invalid signature', tone: 'bad' },
  { value: 'error', label: 'Error', tone: 'bad' },
  { value: 'ignored', label: 'Ignored', tone: 'neutral' },
  { value: 'received', label: 'Received', tone: 'neutral' },
];
const outcomeMeta = (o: string) => OUTCOMES.find((x) => x.value === o) ?? { value: o, label: o, tone: 'neutral' as const };

/**
 * What payment gateways actually sent us, and what we did with each one —
 * the record to check when a payment and an order disagree.
 */
export function WebhookEventsPanel() {
  const [page, setPage] = useState<Paginated<WebhookEventRow> | null>(null);
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [gateway, setGateway] = useState('');
  const [outcome, setOutcome] = useState('');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<number | null>(null);
  const [payloads, setPayloads] = useState<Record<number, unknown>>({});

  const load = async (pageNo = 1) => {
    setLoading(true);
    try {
      const data = await admin.getWebhookEvents({
        gateway: gateway || undefined,
        outcome: outcome || undefined,
        search: search || undefined,
        page: pageNo,
      });
      setPage(data.events);
      setSummary(Array.isArray(data.last_24h) ? {} : data.last_24h);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gateway, outcome]);

  const toggle = async (id: number) => {
    if (expanded === id) {
      setExpanded(null);
      return;
    }
    setExpanded(id);
    if (!(id in payloads)) {
      const full = await admin.getWebhookEvent(id);
      setPayloads((p) => ({ ...p, [id]: full.payload }));
    }
  };

  const suspicious = ['invalid_signature', 'amount_mismatch', 'not_confirmed', 'unknown_payment', 'error']
    .reduce((n, k) => n + (summary[k] ?? 0), 0);

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="font-display font-semibold">Received webhooks</h3>
            <p className="text-xs text-muted-foreground">
              Every call gateways made to us, and what we did with it. Orders are only fulfilled when the gateway confirms the full amount.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => load(page?.current_page ?? 1)} disabled={loading}>
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
          <SummaryTile label="Fulfilled (24h)" value={summary.fulfilled ?? 0} />
          <SummaryTile label="Duplicates (24h)" value={summary.already_fulfilled ?? 0} />
          <SummaryTile label="Rejected (24h)" value={suspicious} alert={suspicious > 0} />
          <SummaryTile label="Bad signatures (24h)" value={summary.invalid_signature ?? 0} alert={(summary.invalid_signature ?? 0) > 0} />
        </div>

        <div className="flex flex-wrap gap-2">
          <select className="h-9 rounded-md border border-border bg-background px-2 text-sm" value={gateway} onChange={(e) => setGateway(e.target.value)}>
            <option value="">All gateways</option>
            <option value="paystack">Paystack</option>
            <option value="flutterwave">Flutterwave</option>
            <option value="stripe">Stripe</option>
          </select>
          <select className="h-9 rounded-md border border-border bg-background px-2 text-sm" value={outcome} onChange={(e) => setOutcome(e.target.value)}>
            <option value="">All outcomes</option>
            {OUTCOMES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <form className="flex gap-2 flex-1 min-w-[200px]" onSubmit={(e) => { e.preventDefault(); load(1); }}>
            <Input placeholder="Order reference or transaction id" value={search} onChange={(e) => setSearch(e.target.value)} />
            <Button type="submit" variant="outline" size="sm">Search</Button>
          </form>
        </div>

        {loading && <div className="py-8 flex justify-center"><Loader size={28} /></div>}
        {!loading && page && page.data.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No webhooks received yet.</p>
        )}
        {!loading && page && page.data.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground">
                  <th className="py-2 pr-3 font-medium">Received</th>
                  <th className="py-2 pr-3 font-medium">Gateway</th>
                  <th className="py-2 pr-3 font-medium">Order</th>
                  <th className="py-2 pr-3 font-medium">Amount</th>
                  <th className="py-2 pr-3 font-medium">Signature</th>
                  <th className="py-2 font-medium">Outcome</th>
                </tr>
              </thead>
              <tbody>
                {page.data.map((e) => {
                  const meta = outcomeMeta(e.outcome);
                  return (
                    <Fragment key={e.id}>
                      <tr className="border-t border-border cursor-pointer hover:bg-muted/40" onClick={() => toggle(e.id)}>
                        <td className="py-2 pr-3 whitespace-nowrap text-xs">{new Date(e.created_at).toLocaleString()}</td>
                        <td className="py-2 pr-3 capitalize">{e.gateway ?? '—'}</td>
                        <td className="py-2 pr-3 font-mono text-xs">{e.reference ?? '—'}</td>
                        <td className="py-2 pr-3 whitespace-nowrap">{e.amount ? `${Number(e.amount).toLocaleString()} ${e.currency ?? ''}` : '—'}</td>
                        <td className="py-2 pr-3">
                          {e.signature_valid
                            ? <span className="text-emerald-600 text-xs">Valid</span>
                            : <span className="text-destructive text-xs font-medium">Invalid</span>}
                        </td>
                        <td className="py-2">
                          <Badge
                            variant={meta.tone === 'bad' ? 'destructive' : meta.tone === 'good' ? 'outline' : 'secondary'}
                            className={meta.tone === 'good' ? 'text-emerald-600 border-emerald-600/40' : ''}
                          >
                            {meta.label}
                          </Badge>
                        </td>
                      </tr>
                      {expanded === e.id && (
                        <tr className="bg-muted/30">
                          <td colSpan={6} className="p-3 space-y-2 text-xs">
                            {e.detail && <p><span className="font-medium">Detail:</span> {e.detail}</p>}
                            <p className="text-muted-foreground">
                              Event {e.event_type ?? '—'} · Transaction {e.gateway_transaction_id ?? '—'} · Payment #{e.payment_id ?? '—'} · IP {e.ip ?? '—'}
                            </p>
                            <pre className="max-h-72 overflow-auto rounded bg-background border border-border p-2 font-mono whitespace-pre-wrap break-all">
                              {e.id in payloads ? JSON.stringify(payloads[e.id], null, 2) : 'Loading payload…'}
                            </pre>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
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

function SummaryTile({ label, value, alert }: { label: string; value: number; alert?: boolean }) {
  return (
    <div className="p-3 rounded-lg border border-border">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-lg font-display font-bold ${alert ? 'text-destructive' : ''}`}>{value}</div>
    </div>
  );
}
