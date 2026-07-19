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
import { wallet, WalletSummary, Withdrawal, Bank } from '@/lib/wallet';
import { NairaSign } from '@/components/icons/NairaSign';
import { TrendingUp, Clock, Send, CheckCircle2 } from 'lucide-react';

export default function OrganizerWalletPage() {
  const [summary, setSummary] = useState<WalletSummary | null>(null);
  const [earnings, setEarnings] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [resolvedName, setResolvedName] = useState('');
  const [form, setForm] = useState({ amount: '', bank_code: '', account_number: '' });

  const load = async () => {
    const [s, e, w, b] = await Promise.all([wallet.summary(), wallet.earnings(), wallet.withdrawals(), wallet.getBanks()]);
    setSummary(s);
    setEarnings(e.data || e);
    setWithdrawals(w.data || w);
    setBanks(b);
  };

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setResolvedName('');
  }, [form.bank_code, form.account_number]);

  const handleVerify = async () => {
    setError('');
    setVerifying(true);
    try {
      const result = await wallet.resolveAccount(form.account_number, form.bank_code);
      setResolvedName(result.account_name);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not verify this account');
    } finally {
      setVerifying(false);
    }
  };

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!resolvedName) {
      setError('Please verify the account details first.');
      return;
    }
    setRequesting(true);
    try {
      const bankName = banks.find((b) => b.code === form.bank_code)?.name || form.bank_code;
      await wallet.requestWithdrawal({ amount: Number(form.amount), bank_name: bankName, bank_code: form.bank_code, account_number: form.account_number, account_name: resolvedName });
      setForm({ amount: '', bank_code: '', account_number: '' });
      setResolvedName('');
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
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h2 className="font-display font-bold text-lg">Request Withdrawal</h2>
              <Button onClick={() => setShowForm((v) => !v)}>{showForm ? 'Cancel' : 'New Withdrawal'}</Button>
            </div>

            {showForm && (
              <form onSubmit={handleRequest} className="space-y-4 p-4 rounded-xl border border-border bg-muted/30">
                {error && <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-sm">{error}</div>}
                {banks.length === 0 && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-700 dark:text-amber-400 text-sm">
                    No banks available — Paystack isn&apos;t configured on this server yet. Ask an admin to set real Paystack credentials.
                  </div>
                )}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="wd-amount">Amount (₦)</Label>
                    <Input id="wd-amount" type="number" required max={summary.balance} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder={`Max ₦${summary.balance.toLocaleString('en-NG')}`} />
                  </div>
                  <div>
                    <Label htmlFor="wd-bank">Bank</Label>
                    <select
                      id="wd-bank"
                      required
                      className="w-full h-10 rounded-none border border-input bg-background px-3 text-sm"
                      value={form.bank_code}
                      onChange={(e) => setForm({ ...form, bank_code: e.target.value })}
                    >
                      <option value="">Select bank...</option>
                      {banks.map((b) => (
                        <option key={b.code} value={b.code}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="wd-acct-num">Account number</Label>
                    <div className="flex gap-2">
                      <Input id="wd-acct-num" required value={form.account_number} onChange={(e) => setForm({ ...form, account_number: e.target.value })} />
                      <Button type="button" variant="outline" onClick={handleVerify} disabled={verifying || !form.bank_code || !form.account_number}>
                        {verifying ? 'Verifying...' : 'Verify'}
                      </Button>
                    </div>
                    {resolvedName && (
                      <p className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mt-2">
                        <CheckCircle2 className="w-4 h-4" /> Verified: {resolvedName}
                      </p>
                    )}
                  </div>
                </div>
                <Button type="submit" disabled={requesting || !resolvedName}>{requesting ? 'Submitting...' : 'Submit Request'}</Button>
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
