'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/components/AuthProvider';
import { payments } from '@/lib/payments';
import { GatewayStatus, PaymentGateway } from '@/lib/gateway';

// Mirrors Donation::MIN_AMOUNT / MAX_AMOUNT on the backend (which enforces them).
const MIN = 100;
const MAX = 5_000_000;
const PRESETS = [1000, 2000, 5000, 10000];

const naira = (n: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(n);

/** "Donate to show support" - a donation on its own, no ticket needed. */
export function DonateBox({ eventId, eventTitle, gatewayStatus }: { eventId: number; eventTitle: string; gatewayStatus: GatewayStatus }) {
  const { user } = useAuth();
  const [amount, setAmount] = useState<string>('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const gateways = ([
    ['paystack', gatewayStatus.paystack_enabled, 'Paystack'],
    ['flutterwave', gatewayStatus.flutterwave_enabled, 'Flutterwave'],
  ] as const).filter(([, enabled]) => enabled);
  const [gatewayChoice, setGatewayChoice] = useState<PaymentGateway | null>(null);
  const selectedGateway: PaymentGateway | null = gatewayChoice ?? gateways[0]?.[0] ?? null;

  useEffect(() => {
    if (user) {
      setName((v) => v || user.name || '');
      setEmail((v) => v || user.email || '');
      setPhone((v) => v || user.phone || '');
    }
  }, [user]);

  const value = Number(amount);
  const amountValid = Number.isFinite(value) && value >= MIN && value <= MAX;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amountValid) {
      toast.error(`Enter an amount between ${naira(MIN)} and ${naira(MAX)}`);
      return;
    }
    if (!selectedGateway) {
      toast.error('Payments are unavailable right now. Please try again later.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await payments.donate(eventId, Math.round(value * 100) / 100, { email, name, phone, message, anonymous }, selectedGateway);
      if (res.authorization_url) {
        window.location.href = res.authorization_url;
        return;
      }
      toast.error('Could not start the payment. Please try again.');
    } catch (err: any) {
      const errors = err.response?.data?.errors;
      toast.error(errors ? (Object.values(errors)[0] as string[])[0] : err.response?.data?.message || 'Could not start the payment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="rounded-3xl border border-border bg-card p-5 sm:p-6">
      <h2 className="text-2xl font-bold mb-1 flex items-center">
        <Heart className="w-6 h-6 mr-2 text-primary-glow" />
        Donate to show support
      </h2>
      <p className="text-sm text-muted-foreground mb-4">Support {eventTitle} with any amount. No ticket needed.</p>

      <form onSubmit={submit} className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <Button key={p} type="button" size="sm" variant={value === p ? 'default' : 'outline'} onClick={() => setAmount(String(p))}>
              {naira(p)}
            </Button>
          ))}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="donate-amount">Amount (₦)</Label>
          <Input
            id="donate-amount"
            type="number"
            inputMode="decimal"
            min={MIN}
            max={MAX}
            step="1"
            placeholder="Any amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="donate-name">Your name</Label>
            <Input id="donate-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="donate-phone">Phone</Label>
            <Input id="donate-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} required />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="donate-email">Email (for your receipt)</Label>
          <Input id="donate-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="donate-message">Message (optional)</Label>
          <textarea
            id="donate-message"
            className="w-full min-h-[70px] rounded-md border border-border bg-background px-3 py-2 text-sm"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={500}
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} />
          Donate anonymously (the organizer won&apos;t see your name)
        </label>

        {gateways.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {gateways.map(([key, , label]) => (
              <Button key={key} type="button" size="sm" variant={selectedGateway === key ? 'default' : 'outline'} onClick={() => setGatewayChoice(key)}>
                {label}
              </Button>
            ))}
          </div>
        )}

        <Button type="submit" variant="hero" className="w-full" disabled={submitting || !amountValid}>
          {submitting ? 'Starting payment…' : amountValid ? `Donate ${naira(value)}` : 'Donate'}
        </Button>
      </form>
    </section>
  );
}
