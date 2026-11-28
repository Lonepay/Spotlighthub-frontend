'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Megaphone, Copy, Pause, Play, Trash2, UserPlus, Building2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Loader } from '@/components/Loader';
import { promoters, PromoterRow } from '@/lib/promoters';
import { eventUrl } from '@/lib/eventLink';

const naira = (n: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(n);

/**
 * Organizer: promoter links for one event. Each promoter (a person or an
 * organization) gets a unique link and earns a % of the ticket sales it
 * brings in - paid out of the organizer's share.
 */
export function EventPromotersPanel({ event }: { event: { id: number; title: string } }) {
  const [list, setList] = useState<PromoterRow[]>([]);
  const [defaultPct, setDefaultPct] = useState<number | null>(null);
  const [pctInput, setPctInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingPct, setSavingPct] = useState(false);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ email: '', name: '', type: 'person' as 'person' | 'organization', pct: '' });

  const linkFor = (code: string) => `${eventUrl(event)}?ref=${code}`;

  const apply = (data: { promoter_commission_percentage: number | null; promoters: PromoterRow[] }) => {
    setDefaultPct(data.promoter_commission_percentage);
    setPctInput(data.promoter_commission_percentage !== null ? String(data.promoter_commission_percentage) : '');
    setList(data.promoters);
  };

  useEffect(() => {
    promoters.forEvent(event.id).then(apply).catch(() => {}).finally(() => setLoading(false));
  }, [event.id]);

  const error = (err: any, fallback: string) => {
    const errors = err.response?.data?.errors;
    toast.error(errors ? (Object.values(errors)[0] as string[])[0] : err.response?.data?.message || fallback);
  };

  const savePct = async (value: number | null) => {
    setSavingPct(true);
    try {
      apply(await promoters.setDefaultPercentage(event.id, value));
      toast.success(value === null ? 'Promoter commission turned off' : `Promoters earn ${value}% on this event`);
    } catch (err) {
      error(err, 'Could not save the commission');
    } finally {
      setSavingPct(false);
    }
  };

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      const created = await promoters.create(event.id, {
        email: form.email.trim(),
        name: form.name.trim() || undefined,
        type: form.type,
        commission_percentage: form.pct ? Number(form.pct) : null,
      });
      setList((prev) => [created, ...prev]);
      setForm({ email: '', name: '', type: 'person', pct: '' });
      copy(created.code);
    } catch (err) {
      error(err, 'Could not add promoter');
    } finally {
      setAdding(false);
    }
  };

  const toggle = async (p: PromoterRow) => {
    try {
      const updated = await promoters.update(event.id, p.id, { is_active: !p.is_active });
      setList((prev) => prev.map((x) => (x.id === p.id ? updated : x)));
    } catch (err) {
      error(err, 'Could not update promoter');
    }
  };

  const remove = async (p: PromoterRow) => {
    if (!window.confirm(`Remove ${p.name}'s link? A link with sales is paused instead, to keep its history.`)) return;
    try {
      const res = await promoters.remove(event.id, p.id);
      if (res.paused) {
        setList((prev) => prev.map((x) => (x.id === p.id ? { ...x, is_active: false, earning: false } : x)));
        toast.info(res.message);
      } else {
        setList((prev) => prev.filter((x) => x.id !== p.id));
      }
    } catch (err) {
      error(err, 'Could not remove promoter');
    }
  };

  const copy = (code: string) => {
    navigator.clipboard?.writeText(linkFor(code)).then(
      () => toast.success('Promoter link copied'),
      () => toast.info(linkFor(code)),
    );
  };

  return (
    <Card>
      <CardContent className="p-6 space-y-5">
        <div>
          <h2 className="font-display font-bold text-lg flex items-center gap-2"><Megaphone className="w-5 h-5" /> Promoters</h2>
          <p className="text-sm text-muted-foreground">
            Give people or organizations their own link. They earn a % of every ticket sold through it, paid from your earnings (after discounts, not on free tickets or their own purchases).
          </p>
        </div>

        {loading ? (
          <div className="py-6 flex justify-center"><Loader size={28} /></div>
        ) : (
          <>
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1">
                <Label htmlFor="promo-default">Commission for this event</Label>
                <div className="flex items-center gap-2">
                  <Input id="promo-default" type="number" min={0.5} max={50} step={0.5} className="w-28" value={pctInput} onChange={(e) => setPctInput(e.target.value)} placeholder="e.g. 10" />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              </div>
              <Button size="sm" disabled={savingPct || !pctInput} onClick={() => savePct(Number(pctInput))}>Save</Button>
              {defaultPct !== null && (
                <Button size="sm" variant="outline" disabled={savingPct} onClick={() => savePct(null)}>Turn off</Button>
              )}
              <span className="text-xs text-muted-foreground">{defaultPct === null ? 'Off: links earn nothing until you set a %.' : `On: ${defaultPct}% unless a promoter has their own rate.`}</span>
            </div>

            <form onSubmit={add} className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end border border-border p-4">
              <div className="space-y-1 lg:col-span-2">
                <Label htmlFor="promo-email">Promoter's account email</Label>
                <Input id="promo-email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="They need a Spotlight account" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="promo-name">Display name</Label>
                <Input id="promo-name" maxLength={120} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Optional" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="promo-type">Type</Label>
                <select id="promo-type" className="h-10 w-full border border-input bg-background px-2 text-sm" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as 'person' | 'organization' })}>
                  <option value="person">Person</option>
                  <option value="organization">Organization</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="promo-pct">Own rate %</Label>
                <Input id="promo-pct" type="number" min={0.5} max={50} step={0.5} value={form.pct} onChange={(e) => setForm({ ...form, pct: e.target.value })} placeholder={defaultPct !== null ? `${defaultPct} (default)` : 'Required if off'} />
              </div>
              <div className="sm:col-span-2 lg:col-span-5">
                <Button type="submit" size="sm" disabled={adding}><UserPlus className="w-4 h-4" /> {adding ? 'Adding…' : 'Create link'}</Button>
              </div>
            </form>

            {list.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No promoters yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Promoter</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead className="text-right">Clicks</TableHead>
                      <TableHead className="text-right">Tickets</TableHead>
                      <TableHead className="text-right">Sales</TableHead>
                      <TableHead className="text-right">Commission</TableHead>
                      <TableHead className="text-right">Link</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {list.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>
                          <div className="font-medium flex items-center gap-1.5">
                            {p.type === 'organization' ? <Building2 className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                            {p.name}
                            {!p.is_active && <Badge variant="outline">Paused</Badge>}
                          </div>
                          <div className="text-xs text-muted-foreground">{p.account?.email} · <span className="font-mono">{p.code}</span></div>
                        </TableCell>
                        <TableCell className="text-sm whitespace-nowrap">{p.effective_percentage}%{p.commission_percentage === null && <span className="text-muted-foreground"> (default)</span>}</TableCell>
                        <TableCell className="text-right text-sm">{p.clicks}</TableCell>
                        <TableCell className="text-right text-sm">{p.tickets_sold}</TableCell>
                        <TableCell className="text-right text-sm">{naira(p.sales_amount)}</TableCell>
                        <TableCell className="text-right text-sm font-semibold">{naira(p.commission_earned)}</TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          <Button variant="ghost" size="sm" onClick={() => copy(p.code)} aria-label="Copy link"><Copy className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => toggle(p)} aria-label={p.is_active ? 'Pause' : 'Resume'}>
                            {p.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => remove(p)} aria-label="Remove"><Trash2 className="w-4 h-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
