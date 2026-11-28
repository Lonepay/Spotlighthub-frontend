'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { VerifiedBadge } from '@/components/VerifiedBadge';
import { Loader } from '@/components/Loader';
import { kyc, KycInfo } from '@/lib/kyc';
import { ShieldCheck, Upload, BadgeCheck, TrendingUp, Zap, Wallet, Search, HeartHandshake, Clock, CheckCircle2, XCircle, FileCheck2 } from 'lucide-react';

type Role = 'organizer' | 'vendor';

const BENEFITS: Record<Role, { icon: any; title: string; body: string }[]> = {
  organizer: [
    { icon: BadgeCheck, title: 'Blue tick on every event', body: 'Buyers see your events come from a checked, real organizer.' },
    { icon: TrendingUp, title: 'More ticket sales', body: 'Verified events earn more trust, especially from first-time buyers.' },
    { icon: Zap, title: 'Faster payouts', body: 'Verified organizers qualify for automatic withdrawals.' },
    { icon: HeartHandshake, title: 'Partnerships and promoters', body: 'Promoters and partners prefer working with verified organizers.' },
  ],
  vendor: [
    { icon: BadgeCheck, title: 'Verified badge on your storefront', body: 'Shown on your page and on every product.' },
    { icon: Search, title: 'Listed first', body: 'Verified vendors appear at the top of the vendor directory.' },
    { icon: TrendingUp, title: 'More orders', body: 'Buyers pay ahead for products, so trust decides who they buy from.' },
    { icon: Wallet, title: 'Smoother payouts', body: 'Verified accounts get through withdrawal checks faster.' },
  ],
};

const STEPS = [
  { icon: FileCheck2, label: 'Submit your ID and business name' },
  { icon: Clock, label: 'We review it, usually within 1-2 working days' },
  { icon: BadgeCheck, label: 'Your badge goes live everywhere' },
];

/** KYC verification for organizers and vendors: why it's worth it, where you are, and the form. */
export function VerificationPanel({ role }: { role: Role }) {
  const [info, setInfo] = useState<KycInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ kyc_business_name: '', kyc_id_type: role === 'vendor' ? 'CAC' : 'NIN', kyc_id_number: '' });
  const [document, setDocument] = useState<File | null>(null);

  useEffect(() => {
    kyc.getMine()
      .then((data) => {
        setInfo(data);
        setForm((f) => ({ ...f, kyc_business_name: data.kyc_business_name || '', kyc_id_type: data.kyc_id_type || f.kyc_id_type }));
      })
      .catch(() => setInfo(null))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!document) {
      setError('Please upload an ID document.');
      return;
    }
    setSubmitting(true);
    try {
      setInfo(await kyc.submit({ ...form, document }));
      setDocument(null);
    } catch (err: any) {
      const errors = err.response?.data?.errors;
      setError(errors ? (Object.values(errors)[0] as string[])[0] : err.response?.data?.message || 'Failed to submit verification');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="py-16 flex justify-center"><Loader size={32} /></div>;

  const status = info?.kyc_status ?? 'none';
  const statusCard = {
    approved: { icon: CheckCircle2, tone: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300', title: 'You\'re verified', body: 'Your badge is live across Spotlight.' },
    pending: { icon: Clock, tone: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300', title: 'Under review', body: 'We\'ll email you as soon as it\'s done.' },
    rejected: { icon: XCircle, tone: 'border-destructive/30 bg-destructive/10 text-destructive', title: 'Needs another look', body: info?.kyc_rejection_reason || 'Please check your details and resubmit.' },
    none: { icon: ShieldCheck, tone: 'border-primary/30 bg-primary/10 text-primary', title: 'Not verified yet', body: 'It takes about 2 minutes to submit.' },
  }[status as 'approved' | 'pending' | 'rejected' | 'none'] ?? null;

  return (
    <div className="grid lg:grid-cols-5 gap-6 items-start">
      <div className="lg:col-span-3 space-y-6">
        {statusCard && (
          <div className={`flex items-start gap-3 border p-4 rounded-[0.7rem] ${statusCard.tone}`}>
            <statusCard.icon className="w-5 h-5 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold flex items-center gap-2">{statusCard.title} {info?.is_verified && <VerifiedBadge size="md" />}</p>
              <p className="text-sm opacity-90">{statusCard.body}</p>
            </div>
          </div>
        )}

        <Card className="shadow-none">
          <CardContent className="p-6 space-y-4">
            <h2 className="font-display font-bold text-lg">Why get verified</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {BENEFITS[role].map((b) => (
                <div key={b.title} className="flex gap-3">
                  <span className="w-9 h-9 shrink-0 rounded-[0.5rem] bg-primary/10 text-primary inline-flex items-center justify-center"><b.icon className="w-[18px] h-[18px]" /></span>
                  <div>
                    <p className="font-medium text-sm">{b.title}</p>
                    <p className="text-sm text-muted-foreground">{b.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {status !== 'approved' && status !== 'pending' && (
          <Card className="shadow-none">
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <h2 className="font-display font-bold text-lg">{status === 'rejected' ? 'Resubmit your details' : 'Submit your details'}</h2>
                {error && <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-[0.5rem] text-destructive text-sm">{error}</div>}
                <div>
                  <Label htmlFor="business-name">{role === 'vendor' ? 'Registered business name' : 'Business / organizer name'}</Label>
                  <Input id="business-name" required value={form.kyc_business_name} onChange={(e) => setForm({ ...form, kyc_business_name: e.target.value })} placeholder="As it appears on your documents" />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="id-type">ID type</Label>
                    <select id="id-type" className="w-full h-10 rounded-[0.5rem] border border-input bg-background px-3 text-sm" value={form.kyc_id_type} onChange={(e) => setForm({ ...form, kyc_id_type: e.target.value })}>
                      {role === 'vendor' && <option value="CAC">CAC registration</option>}
                      <option value="NIN">NIN</option>
                      <option value="Passport">International Passport</option>
                      <option value="Drivers License">Driver&apos;s License</option>
                      <option value="Voters Card">Voter&apos;s Card</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="id-number">{form.kyc_id_type === 'CAC' ? 'RC / BN number' : 'ID number'}</Label>
                    <Input id="id-number" required value={form.kyc_id_number} onChange={(e) => setForm({ ...form, kyc_id_number: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="document">Document (photo or PDF, up to 30 MB)</Label>
                  <input
                    id="document"
                    type="file"
                    accept="image/*,.pdf"
                    required
                    onChange={(e) => setDocument(e.target.files?.[0] || null)}
                    className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-[0.5rem] file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 file:cursor-pointer cursor-pointer"
                  />
                </div>
                <Button type="submit" disabled={submitting}>
                  <Upload className="w-4 h-4" />
                  {submitting ? 'Submitting…' : status === 'rejected' ? 'Resubmit for review' : 'Submit for verification'}
                </Button>
                <p className="text-xs text-muted-foreground">Your documents are only seen by Spotlight&apos;s review team.</p>
              </form>
            </CardContent>
          </Card>
        )}
      </div>

      <Card className="lg:col-span-2 shadow-none">
        <CardContent className="p-6 space-y-4">
          <h2 className="font-display font-bold text-lg">How it works</h2>
          <ol className="space-y-4">
            {STEPS.map((s, i) => (
              <li key={s.label} className="flex gap-3 items-start">
                <span className="w-8 h-8 shrink-0 rounded-full bg-muted inline-flex items-center justify-center text-sm font-medium">{i + 1}</span>
                <span className="text-sm pt-1.5">{s.label}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
