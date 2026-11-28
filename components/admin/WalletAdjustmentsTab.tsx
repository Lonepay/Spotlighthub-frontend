'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Search, ArrowDownCircle, ArrowUpCircle, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { PaginationFooter } from '@/components/dashboard/PaginationFooter';
import { admin, Paginated, WalletAdjustmentRow, WalletLookup } from '@/lib/admin';

const naira = (n: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 2 }).format(n);

/**
 * Super-admin/developer: credit or debit an organizer's, vendor's or
 * promoter's wallet with a purpose. A debit can go past the balance; the
 * account then owes and payouts stay blocked until it's covered.
 */
export function WalletAdjustmentsTab() {
  const [email, setEmail] = useState('');
  const [account, setAccount] = useState<WalletLookup | null>(null);
  const [looking, setLooking] = useState(false);
  const [direction, setDirection] = useState<'credit' | 'debit'>('credit');
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [reference, setReference] = useState('');
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [history, setHistory] = useState<Paginated<WalletAdjustmentRow> | null>(null);

  const loadHistory = () => admin.getWalletAdjustments({ page, user_id: account?.user.id }).then(setHistory).catch(() => setHistory(null));
  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, account?.user.id]);

  const errorOf = (err: any, fallback: string) => {
    const errors = err.response?.data?.errors;
    return errors ? (Object.values(errors)[0] as string[])[0] : err.response?.data?.message || fallback;
  };

  const lookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLooking(true);
    try {
      setAccount(await admin.lookupWallet(email.trim()));
      setPage(1);
    } catch (err) {
      setAccount(null);
      toast.error(errorOf(err, 'Account not found'));
    } finally {
      setLooking(false);
    }
  };

  const value = Number(amount) || 0;
  const after = account ? (account.debt > 0 ? -account.debt : account.balance) + (direction === 'credit' ? value : -value) : 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) return;
    const verb = direction === 'credit' ? 'Credit' : 'Debit';
    if (!window.confirm(`${verb} ${naira(value)} ${direction === 'credit' ? 'to' : 'from'} ${account.user.name}?\n\nPurpose: ${purpose}`)) return;
    setSaving(true);
    try {
      const res = await admin.adjustWallet({ user_id: account.user.id, direction, amount: value, purpose: purpose.trim(), reference: reference.trim() || undefined });
      setAccount(res.wallet);
      setAmount('');
      setPurpose('');
      setReference('');
      toast.success(`${verb}ed ${naira(value)}. New balance ${naira(res.wallet.balance)}${res.wallet.debt > 0 ? `, owes ${naira(res.wallet.debt)}` : ''}.`);
      setPage(1);
      loadHistory();
    } catch (err) {
      toast.error(errorOf(err, 'Adjustment failed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display font-bold text-lg flex items-center gap-2"><Scale className="w-5 h-5" /> Wallet adjustments</h2>
        <p className="text-sm text-muted-foreground">Credit or debit an organizer, vendor or promoter, always with a purpose. Every adjustment is recorded and shows in their earnings.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <Card>
          <CardContent className="p-6 space-y-5">
            <form onSubmit={lookup} className="flex gap-2 items-end">
              <div className="flex-1">
                <Label htmlFor="wa-email">Account email</Label>
                <Input id="wa-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="organizer@example.com" />
              </div>
              <Button type="submit" variant="outline" disabled={looking}><Search className="w-4 h-4" /> {looking ? 'Finding…' : 'Find'}</Button>
            </form>

            {account && (
              <>
                <div className="rounded-[0.5rem] border border-border p-4 grid grid-cols-3 gap-3 text-sm">
                  <div className="col-span-3 flex items-center gap-2">
                    <span className="font-medium">{account.user.name}</span>
                    <Badge variant="secondary" className="capitalize">{account.user.role}</Badge>
                  </div>
                  <div><p className="text-xs text-muted-foreground">Available</p><p className="font-semibold">{naira(account.balance)}</p></div>
                  <div><p className="text-xs text-muted-foreground">Owes</p><p className={`font-semibold ${account.debt > 0 ? 'text-destructive' : ''}`}>{naira(account.debt)}</p></div>
                  <div><p className="text-xs text-muted-foreground">Earned (net)</p><p className="font-semibold">{naira(account.total_earned)}</p></div>
                </div>

                <form onSubmit={submit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Credit or debit">
                    {(['credit', 'debit'] as const).map((d) => (
                      <button key={d} type="button" role="radio" aria-checked={direction === d} onClick={() => setDirection(d)}
                        className={`h-11 rounded-[0.5rem] border-2 text-sm font-medium inline-flex items-center justify-center gap-2 ${direction === d ? (d === 'credit' ? 'border-emerald-500 bg-emerald-500/10' : 'border-destructive bg-destructive/10') : 'border-border'}`}>
                        {d === 'credit' ? <ArrowUpCircle className="w-4 h-4" /> : <ArrowDownCircle className="w-4 h-4" />} {d === 'credit' ? 'Credit (add)' : 'Debit (take)'}
                      </button>
                    ))}
                  </div>
                  <div>
                    <Label htmlFor="wa-amount">Amount (₦)</Label>
                    <Input id="wa-amount" type="number" required min={1} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="wa-purpose">Purpose *</Label>
                    <textarea id="wa-purpose" required minLength={5} maxLength={500} rows={2} value={purpose} onChange={(e) => setPurpose(e.target.value)}
                      className="w-full rounded-[0.5rem] border border-input bg-background px-3 py-2 text-sm" placeholder="e.g. Refund of duplicate platform fee on order PAY-…" />
                    <p className="text-xs text-muted-foreground mt-1">Shown to the account in their earnings history.</p>
                  </div>
                  <div>
                    <Label htmlFor="wa-ref">Reference (optional)</Label>
                    <Input id="wa-ref" maxLength={100} value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Order, bank transfer or ticket reference" />
                  </div>
                  {value > 0 && (
                    <p className={`text-sm ${after < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                      After this: {after < 0 ? `owes ${naira(-after)} — withdrawals blocked until covered` : `${naira(after)} available`}
                    </p>
                  )}
                  <Button type="submit" disabled={saving || value <= 0 || purpose.trim().length < 5} variant={direction === 'debit' ? 'destructive' : 'default'}>
                    {saving ? 'Saving…' : `${direction === 'credit' ? 'Credit' : 'Debit'} ${value > 0 ? naira(value) : ''}`}
                  </Button>
                </form>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-3">
            <h3 className="font-display font-semibold">{account ? `History for ${account.user.name}` : 'Recent adjustments'}</h3>
            {!history || history.data.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No adjustments yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>When</TableHead>
                      {!account && <TableHead>Account</TableHead>}
                      <TableHead>Purpose</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.data.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{new Date(a.created_at).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })}<br />by {a.creator?.name ?? '—'}</TableCell>
                        {!account && <TableCell className="text-sm">{a.user?.name}<div className="text-xs text-muted-foreground">{a.user?.email}</div></TableCell>}
                        <TableCell className="text-sm">{a.purpose}{a.reference && <div className="text-xs text-muted-foreground">Ref {a.reference}</div>}</TableCell>
                        <TableCell className={`text-right font-semibold whitespace-nowrap ${Number(a.amount) < 0 ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400'}`}>
                          {Number(a.amount) < 0 ? '−' : '+'}{naira(Math.abs(Number(a.amount)))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            {history && history.last_page > 1 && <PaginationFooter meta={history} onPageChange={setPage} />}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
