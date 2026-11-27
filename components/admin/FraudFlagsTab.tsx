'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { admin, FraudFlagRow, Paginated } from '@/lib/admin';
import { vendors as vendorsApi, Vendor } from '@/lib/vendors';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader } from '@/components/Loader';
import { ChevronLeft, ChevronRight, ShieldOff, ShieldBan } from 'lucide-react';

type Target = 'user' | 'vendor' | 'contact';

const TARGETS: { value: Target; label: string; hint: string }[] = [
  { value: 'user', label: 'Account', hint: 'A buyer or business (organizer) account, found by its login email. Their email and phone are blocked too, so checking out as a guest doesn’t get around it.' },
  { value: 'vendor', label: 'Vendor', hint: 'Hides the vendor listing. If it has an owner account, that account is restricted too.' },
  { value: 'contact', label: 'Email / phone', hint: 'Blocks checkout for anyone using this email or phone, even with no account.' },
];

/**
 * Admin → Fraud Flags. A flagged party can't buy, hold seats, or browse and
 * search listings; a flagged business's listings disappear and its payouts
 * stop until the flag is lifted.
 */
export function FraudFlagsTab() {
  const [list, setList] = useState<Paginated<FraudFlagRow> | null>(null);
  const [status, setStatus] = useState<'active' | 'lifted' | 'all'>('active');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [target, setTarget] = useState<Target>('user');
  const [userEmail, setUserEmail] = useState('');
  const [vendorId, setVendorId] = useState<number | null>(null);
  const [vendorQuery, setVendorQuery] = useState('');
  const [vendorOptions, setVendorOptions] = useState<Vendor[]>([]);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const [liftingId, setLiftingId] = useState<number | null>(null);
  const [liftReason, setLiftReason] = useState('');

  const load = async (page = 1) => {
    setLoading(true);
    try {
      setList(await admin.getFraudFlags({ status, search: search || undefined, page }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  useEffect(() => {
    if (target !== 'vendor') return;
    const t = setTimeout(async () => {
      const res = await vendorsApi.adminGetAll({ search: vendorQuery || undefined });
      setVendorOptions(res.data ?? []);
    }, 250);
    return () => clearTimeout(t);
  }, [target, vendorQuery]);

  const resetForm = () => {
    setUserEmail('');
    setVendorId(null);
    setVendorQuery('');
    setEmail('');
    setPhone('');
    setReason('');
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await admin.createFraudFlag({
        target,
        user_email: target === 'user' ? userEmail : undefined,
        vendor_id: target === 'vendor' ? vendorId ?? undefined : undefined,
        email: target === 'contact' ? email || undefined : undefined,
        phone: target === 'contact' ? phone || undefined : undefined,
        reason,
      });
      toast.success('Flag added. Restrictions apply immediately.');
      resetForm();
      setStatus('active');
      load(1);
    } catch (err: any) {
      const errors = err.response?.data?.errors;
      toast.error(errors ? (Object.values(errors)[0] as string[])[0] : err.response?.data?.message || 'Could not add flag');
    } finally {
      setSaving(false);
    }
  };

  const lift = async (id: number) => {
    try {
      await admin.liftFraudFlag(id, liftReason);
      toast.success('Flag lifted');
      setLiftingId(null);
      setLiftReason('');
      load(list?.current_page ?? 1);
    } catch (err: any) {
      const errors = err.response?.data?.errors;
      toast.error(errors ? (Object.values(errors)[0] as string[])[0] : err.response?.data?.message || 'Could not lift flag');
    }
  };

  const canSubmit = reason.trim().length >= 5 && (
    (target === 'user' && userEmail.trim() !== '')
    || (target === 'vendor' && vendorId !== null)
    || (target === 'contact' && (email.trim() !== '' || phone.trim() !== ''))
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display font-bold text-lg">Fraud Flags</h2>
        <p className="text-sm text-muted-foreground">
          Flagged parties can&apos;t buy tickets, hold seats, or browse and search listings. A flagged business&apos;s listings are hidden and its payouts are held. Tickets already issued are not revoked — do that from Tickets.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={submit} className="space-y-4 max-w-xl">
            <h3 className="font-display font-semibold flex items-center gap-2"><ShieldBan className="w-4 h-4" /> Add a flag</h3>
            <div className="flex flex-wrap gap-2">
              {TARGETS.map((t) => (
                <Button key={t.value} type="button" size="sm" variant={target === t.value ? 'default' : 'outline'} onClick={() => setTarget(t.value)}>
                  {t.label}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">{TARGETS.find((t) => t.value === target)?.hint}</p>

            {target === 'user' && (
              <div className="space-y-1.5">
                <Label htmlFor="flag-user-email">Account email</Label>
                <Input id="flag-user-email" type="email" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} placeholder="user@example.com" />
              </div>
            )}

            {target === 'vendor' && (
              <div className="space-y-1.5">
                <Label htmlFor="flag-vendor">Vendor</Label>
                <Input id="flag-vendor" value={vendorQuery} onChange={(e) => { setVendorQuery(e.target.value); setVendorId(null); }} placeholder="Search vendors by name" />
                <div className="max-h-40 overflow-y-auto rounded-md border border-border">
                  {vendorOptions.length === 0 && <p className="p-2 text-xs text-muted-foreground">No vendors found.</p>}
                  {vendorOptions.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => { setVendorId(v.id); setVendorQuery(v.name); }}
                      className={`block w-full text-left px-3 py-1.5 text-sm hover:bg-muted ${vendorId === v.id ? 'bg-muted font-medium' : ''}`}
                    >
                      {v.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {target === 'contact' && (
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="flag-email">Email</Label>
                  <Input id="flag-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="flag-phone">Phone</Label>
                  <Input id="flag-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0803 123 4567" />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="flag-reason">Reason (visible to admins only)</Label>
              <textarea
                id="flag-reason"
                className="w-full min-h-[80px] rounded-md border border-border bg-background px-3 py-2 text-sm"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Chargeback on order PAY-XXXX, card reported stolen"
              />
            </div>

            <Button type="submit" disabled={!canSubmit || saving} variant="destructive">
              {saving ? 'Flagging…' : 'Flag'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {(['active', 'lifted', 'all'] as const).map((s) => (
              <Button key={s} size="sm" variant={status === s ? 'default' : 'outline'} onClick={() => setStatus(s)} className="capitalize">{s}</Button>
            ))}
            <form className="flex gap-2 flex-1 min-w-[200px]" onSubmit={(e) => { e.preventDefault(); load(1); }}>
              <Input placeholder="Search name, email, phone or reason" value={search} onChange={(e) => setSearch(e.target.value)} />
              <Button type="submit" size="sm" variant="outline">Search</Button>
            </form>
          </div>

          {loading && <div className="py-8 flex justify-center"><Loader size={28} /></div>}
          {!loading && list && list.data.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No {status === 'all' ? '' : status} flags.</p>
          )}

          {!loading && list && list.data.map((f) => (
            <div key={f.id} className="rounded-lg border border-border p-4 space-y-2">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="space-y-0.5">
                  <p className="font-medium">
                    {f.user ? `${f.user.name} (${f.user.role})` : f.vendor ? f.vendor.name : 'Contact details'}
                    {f.vendor && f.user && <span className="text-muted-foreground font-normal"> · vendor {f.vendor.name}</span>}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {[f.user?.email ?? f.email, f.phone ? `…${f.phone}` : null].filter(Boolean).join(' · ')}
                  </p>
                </div>
                {f.lifted_at
                  ? <Badge variant="secondary">Lifted</Badge>
                  : <Badge variant="destructive">Active</Badge>}
              </div>
              <p className="text-sm">{f.reason}</p>
              <p className="text-xs text-muted-foreground">
                Flagged {new Date(f.created_at).toLocaleString()}{f.flagged_by ? ` by ${f.flagged_by.name}` : ''}
                {f.lifted_at && ` · Lifted ${new Date(f.lifted_at).toLocaleString()}${f.lifted_by ? ` by ${f.lifted_by.name}` : ''}: ${f.lift_reason}`}
              </p>

              {!f.lifted_at && (liftingId === f.id ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  <Input className="flex-1 min-w-[200px]" placeholder="Why is this being lifted?" value={liftReason} onChange={(e) => setLiftReason(e.target.value)} />
                  <Button size="sm" onClick={() => lift(f.id)} disabled={liftReason.trim().length < 5}>Confirm lift</Button>
                  <Button size="sm" variant="outline" onClick={() => { setLiftingId(null); setLiftReason(''); }}>Cancel</Button>
                </div>
              ) : (
                <Button size="sm" variant="outline" onClick={() => { setLiftingId(f.id); setLiftReason(''); }}>
                  <ShieldOff className="w-4 h-4" /> Lift flag
                </Button>
              ))}
            </div>
          ))}

          {list && list.last_page > 1 && (
            <div className="flex items-center justify-end gap-2 text-sm">
              <Button variant="outline" size="sm" disabled={list.current_page <= 1} onClick={() => load(list.current_page - 1)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-muted-foreground">Page {list.current_page} of {list.last_page}</span>
              <Button variant="outline" size="sm" disabled={list.current_page >= list.last_page} onClick={() => load(list.current_page + 1)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
