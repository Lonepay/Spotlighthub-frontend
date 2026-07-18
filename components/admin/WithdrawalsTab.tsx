'use client';

import { useState, useEffect } from 'react';
import { wallet, Withdrawal } from '@/lib/wallet';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, X, Banknote, Zap, AlertTriangle } from 'lucide-react';

export function WithdrawalsTab() {
  const [statusFilter, setStatusFilter] = useState('pending');
  const [list, setList] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [reason, setReason] = useState('');
  const [payoutBalance, setPayoutBalance] = useState<number | null | undefined>(undefined);
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
    wallet.adminPayoutBalance().then((r) => setPayoutBalance(r.balance)).catch(() => setPayoutBalance(null));
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
      alert(e.response?.data?.message || 'Paystack payout failed');
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
      {payoutBalance !== undefined && (
        <div className={`flex items-center gap-2 p-3 rounded-xl border text-sm ${payoutBalance === null ? 'border-border bg-muted/30 text-muted-foreground' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'}`}>
          {payoutBalance === null ? (
            <>
              <AlertTriangle className="w-4 h-4" />
              Paystack balance unavailable — check that real API credentials are configured.
            </>
          ) : (
            <>
              <Banknote className="w-4 h-4" />
              Paystack payout balance: ₦{payoutBalance.toLocaleString('en-NG')}
            </>
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

      {loading && <p className="text-muted-foreground text-sm">Loading...</p>}
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
