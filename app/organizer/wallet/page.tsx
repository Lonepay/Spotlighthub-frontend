'use client';

import { useState, useEffect } from 'react';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { StatCard } from '@/components/dashboard/StatCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { wallet, WalletSummary, Withdrawal } from '@/lib/wallet';
import { NairaSign } from '@/components/icons/NairaSign';
import { TrendingUp, Clock, Send } from 'lucide-react';

export default function OrganizerWalletPage() {
  const [summary, setSummary] = useState<WalletSummary | null>(null);
  const [earnings, setEarnings] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ amount: '', bank_name: '', account_number: '', account_name: '' });

  const load = async () => {
    const [s, e, w] = await Promise.all([wallet.summary(), wallet.earnings(), wallet.withdrawals()]);
    setSummary(s);
    setEarnings(e.data || e);
    setWithdrawals(w.data || w);
  };

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setRequesting(true);
    try {
      await wallet.requestWithdrawal({ ...form, amount: Number(form.amount) });
      setForm({ amount: '', bank_name: '', account_number: '', account_name: '' });
      setShowForm(false);
      await load();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to request withdrawal');
    } finally {
      setRequesting(false);
    }
  };

  const statusBadge = (status: string) => {
    if (status === 'paid') return <Badge variant="default">Paid</Badge>;
    if (status === 'approved') return <Badge variant="secondary">Approved</Badge>;
    if (status === 'rejected') return <Badge variant="destructive">Rejected</Badge>;
    return <Badge variant="outline" className="text-amber-600 border-amber-300">Pending</Badge>;
  };

  if (loading || !summary) {
    return (
      <DashboardShell title="Wallet">
        <p className="text-muted-foreground">Loading...</p>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Wallet" description="Your earnings and withdrawal history">
      <div className="space-y-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={NairaSign} label="Available Balance" value={`₦${summary.balance.toLocaleString('en-NG')}`} />
          <StatCard icon={TrendingUp} label="Total Earned" value={`₦${summary.total_earned.toLocaleString('en-NG')}`} />
          <StatCard icon={Send} label="Total Withdrawn" value={`₦${summary.total_withdrawn.toLocaleString('en-NG')}`} />
          <StatCard icon={Clock} label="Pending Withdrawals" value={`₦${summary.pending_withdrawals.toLocaleString('en-NG')}`} />
        </div>

        <Card className="shadow-none">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-lg">Request Withdrawal</h2>
              <Button onClick={() => setShowForm((v) => !v)}>{showForm ? 'Cancel' : 'New Withdrawal'}</Button>
            </div>

            {showForm && (
              <form onSubmit={handleRequest} className="space-y-4 p-4 rounded-xl border border-border bg-muted/30">
                {error && <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-sm">{error}</div>}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="wd-amount">Amount (₦)</Label>
                    <Input id="wd-amount" type="number" required max={summary.balance} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder={`Max ₦${summary.balance.toLocaleString('en-NG')}`} />
                  </div>
                  <div>
                    <Label htmlFor="wd-bank">Bank name</Label>
                    <Input id="wd-bank" required value={form.bank_name} onChange={(e) => setForm({ ...form, bank_name: e.target.value })} placeholder="e.g. GTBank" />
                  </div>
                  <div>
                    <Label htmlFor="wd-acct-num">Account number</Label>
                    <Input id="wd-acct-num" required value={form.account_number} onChange={(e) => setForm({ ...form, account_number: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="wd-acct-name">Account name</Label>
                    <Input id="wd-acct-name" required value={form.account_name} onChange={(e) => setForm({ ...form, account_name: e.target.value })} />
                  </div>
                </div>
                <Button type="submit" disabled={requesting}>{requesting ? 'Submitting...' : 'Submit Request'}</Button>
              </form>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardContent className="p-6">
            <h2 className="font-display font-bold text-lg mb-4">Withdrawal History</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Amount</TableHead>
                  <TableHead>Bank</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {withdrawals.map((w) => (
                  <TableRow key={w.id}>
                    <TableCell className="font-semibold">₦{Number(w.amount).toLocaleString('en-NG')}</TableCell>
                    <TableCell className="text-muted-foreground">{w.bank_name} · {w.account_number}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(w.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>{statusBadge(w.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {withdrawals.length === 0 && <p className="text-muted-foreground text-center py-8">No withdrawals yet.</p>}
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardContent className="p-6">
            <h2 className="font-display font-bold text-lg mb-4">Recent Earnings</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Gross</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Net</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {earnings.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="text-muted-foreground">{e.description}</TableCell>
                    <TableCell>₦{Number(e.gross_amount).toLocaleString('en-NG')}</TableCell>
                    <TableCell className="text-muted-foreground">₦{Number(e.commission_amount).toLocaleString('en-NG')}</TableCell>
                    <TableCell className="font-semibold text-emerald-600 dark:text-emerald-400">₦{Number(e.amount).toLocaleString('en-NG')}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(e.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {earnings.length === 0 && <p className="text-muted-foreground text-center py-8">No earnings yet.</p>}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
