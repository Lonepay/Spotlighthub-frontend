'use client';

import { useState, useEffect } from 'react';
import { wallet, Withdrawal, GatewayBalances } from '@/lib/wallet';
import { admin } from '@/lib/admin';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/dashboard/StatCard';
import { TableSkeleton } from '@/components/dashboard/TableSkeleton';
import { toast } from 'sonner';
import { Check, X, Banknote, Zap, AlertTriangle } from 'lucide-react';

export function WithdrawalsTab() {
  const [statusFilter, setStatusFilter] = useState('pending');
  const [list, setList] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [reason, setReason] = useState('');
  // undefined = loading; each gateway's figure is null when unavailable.
  const [balances, setBalances] = useState<GatewayBalances | null | undefined>(undefined);
  const [lowBalanceThreshold, setLowBalanceThreshold] = useState<number | null>(null);
  const [payingId, setPayingId] = useState<number | null>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const data = await wallet.adminList(statusFilter || undefined);
      setList(data.data || data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  useEffect(() => {
    wallet.adminPayoutBalance().then(setBalances).catch(() => setBalances(null));
    admin.getSettings().then((s) => setLowBalanceThreshold(s.low_balance_threshold)).catch(() => setLowBalanceThreshold(null));
  }, []);

  const handleApprove = async (id: number) => {
    await wallet.adminApprove(id);
    await refresh();
  };

  const handleMarkPaid = async (id: number) => {
    await wallet.adminMarkPaid(id);
    await refresh();
  };

  const handlePayViaPaystack = async (id: number) => {
    setPayingId(id);
    try {
      await wallet.adminPayViaPaystack(id);
      await refresh();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Paystack payout failed');
    } finally {
      setPayingId(null);
    }
  };

  const handleReject = async (id: number) => {
    if (!reason.trim()) return;
    await wallet.adminReject(id, reason);
    setRejectingId(null);
    setReason('');
    await refresh();
  };

  const statusBadge = (status: string) => {
    if (status === 'paid') return <Badge variant="default">Paid</Badge>;
    if (status === 'approved') return <Badge variant="secondary">Approved</Badge>;
    if (status === 'rejected') return <Badge variant="destructive">Rejected</Badge>;
    return <Badge variant="outline" className="text-amber-600 border-amber-300">Pending</Badge>;
  };

  return (
    <div className="space-y-4">
      {balances !== undefined && (
        <div className="grid sm:grid-cols-3 gap-4">
          {/* Paystack sends payouts, so its low-balance warning matters most. */}
          {balances?.paystack != null ? (
            <StatCard
              icon={Banknote}
              label="Paystack · payout balance"
              value={`₦${balances.paystack.toLocaleString('en-NG')}`}
              hint={lowBalanceThreshold != null && balances.paystack < lowBalanceThreshold ? 'Below the configured low-balance threshold' : 'Withdrawals are paid from this'}
              variant={lowBalanceThreshold != null && balances.paystack < lowBalanceThreshold ? 'alert' : 'default'}
            />
          ) : (
            <BalanceUnavailable gateway="Paystack" />
          )}
          {balances?.flutterwave ? (
            <StatCard
              icon={Banknote}
              label="Flutterwave · available"
              value={`₦${balances.flutterwave.available.toLocaleString('en-NG')}`}
              hint={`Ledger ₦${balances.flutterwave.ledger.toLocaleString('en-NG')} (incl. unsettled)`}
            />
          ) : (
            <BalanceUnavailable gateway="Flutterwave" />
          )}
          {balances?.stripe ? (
            <StatCard
              icon={Banknote}
              label="Stripe · available"
              value={`$${balances.stripe.available.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
              hint={`Pending $${balances.stripe.pending.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
            />
          ) : (
            <BalanceUnavailable gateway="Stripe" />
          )}
        </div>
      )}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Status:</span>
        <select
          className="h-10 rounded-none border border-input bg-background px-2 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="paid">Paid</option>
          <option value="rejected">Rejected</option>
          <option value="">All</option>
        </select>
        <Button variant="outline" size="sm" onClick={refresh}>Refresh</Button>
      </div>

      {loading && <TableSkeleton rows={4} cols={5} />}
      {!loading && list.length === 0 && (
        <p className="text-muted-foreground text-sm text-center py-12">No withdrawals in this status.</p>
      )}

      <div className="space-y-3">
        {list.map((w) => (
          <Card key={w.id}>
            <CardContent className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{w.user?.name}</p>
                    {statusBadge(w.status)}
                    {w.auto_processed && <Badge variant="outline" className="text-primary border-primary/40"><Zap className="w-3 h-3" /> Auto</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">{w.user?.email}</p>
                  <p className="text-lg font-bold mt-1">₦{Number(w.amount).toLocaleString('en-NG')}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                    <Banknote className="w-4 h-4" /> {w.bank_name} · {w.account_number} · {w.account_name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Requested {new Date(w.created_at).toLocaleString()}</p>
                  {w.admin_notes && <p className="text-xs text-destructive mt-1">Note: {w.admin_notes}</p>}
                </div>

                <div className="flex items-center gap-2">
                  {w.status === 'pending' && (
                    <Button size="sm" onClick={() => handleApprove(w.id)}>
                      <Check className="w-4 h-4" /> Approve
                    </Button>
                  )}
                  {(w.status === 'pending' || w.status === 'approved') && (
                    <Button size="sm" onClick={() => handlePayViaPaystack(w.id)} disabled={payingId === w.id}>
                      <Zap className="w-4 h-4" /> {payingId === w.id ? 'Processing...' : 'Pay via Paystack'}
                    </Button>
                  )}
                  {w.status === 'approved' && (
                    <Button size="sm" variant="outline" onClick={() => handleMarkPaid(w.id)}>
                      <Banknote className="w-4 h-4" /> Mark Paid Manually
                    </Button>
                  )}
                  {(w.status === 'pending' || w.status === 'approved') && (
                    <Button size="sm" variant="outline" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setRejectingId(w.id)}>
                      <X className="w-4 h-4" /> Reject
                    </Button>
                  )}
                </div>
              </div>

              {rejectingId === w.id && (
                <div className="mt-4 pt-4 border-t border-border flex gap-2">
                  <input
                    autoFocus
                    className="flex-1 h-9 rounded-lg border border-input bg-background px-3 text-sm"
                    placeholder="Reason for rejection..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleReject(w.id)}
                  />
                  <Button size="sm" onClick={() => handleReject(w.id)}>Confirm</Button>
                  <Button size="sm" variant="outline" onClick={() => { setRejectingId(null); setReason(''); }}>Cancel</Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function BalanceUnavailable({ gateway }: { gateway: string }) {
  return (
    <div className="flex items-start gap-2 p-4 rounded-[0.7rem] border border-border text-muted-foreground text-sm">
      <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
      <span>{gateway} balance unavailable - check its API keys in Payment Settings.</span>
    </div>
  );
}
