'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { gateway, GatewayStatus } from '@/lib/gateway';
import { User, Users, DollarSign } from 'lucide-react';
import { NairaSign } from '@/components/icons/NairaSign';

type Currency = 'NGN' | 'USD';

export default function PricingCalculatorPage() {
  const [currency, setCurrency] = useState<Currency>('NGN');
  const [amount, setAmount] = useState('5000');
  const [payer, setPayer] = useState<'organizer' | 'attendee'>('organizer');
  const [feeInfo, setFeeInfo] = useState<GatewayStatus>({ flutterwave_enabled: true, paystack_enabled: true, stripe_enabled: false });

  useEffect(() => {
    gateway.status().then(setFeeInfo).catch(() => {});
  }, []);

  const isUsd = currency === 'USD';
  const money = (value: number, cur: Currency = currency) =>
    new Intl.NumberFormat(cur === 'USD' ? 'en-US' : 'en-NG', { style: 'currency', currency: cur, maximumFractionDigits: 2 }).format(value);

  // Switching currency keeps roughly the same ticket, at the admin's rate.
  const rate = feeInfo.usd_exchange_rate ?? 0;
  const switchCurrency = (next: Currency) => {
    if (next === currency) return;
    const value = parseFloat(amount) || 0;
    if (rate > 0 && value > 0) {
      setAmount(next === 'USD' ? (value / rate).toFixed(2) : String(Math.round(value * rate)));
    } else {
      setAmount(next === 'USD' ? '10' : '5000');
    }
    setCurrency(next);
  };

  const price = Math.max(0, parseFloat(amount) || 0);

  // Naira: platform % + flat ₦. USD: Stripe card charge % + flat $, of which
  // Spotlight keeps its share and Stripe the rest.
  const pct = isUsd ? feeInfo.stripe_fee_percentage ?? 0 : feeInfo.platform_fee_percentage ?? 0;
  const flat = isUsd ? feeInfo.stripe_fee_flat_usd ?? 0 : feeInfo.platform_flat_fee ?? 0;
  const fee = price > 0 ? Math.round((price * (pct / 100) + flat) * 100) / 100 : 0;
  const share = feeInfo.stripe_platform_share_percentage ?? 0;
  const spotlightPart = price > 0 ? Math.round(price * share) / 100 : 0;
  const stripePart = Math.max(0, Math.round((fee - spotlightPart) * 100) / 100);

  const attendeePays = payer === 'attendee' ? price + fee : price;
  const organizerReceives = payer === 'attendee' ? price : Math.max(0, price - fee);
  const nairaOf = (usd: number) => (rate > 0 ? money(usd * rate, 'NGN') : null);

  return (
    <div className="min-h-screen">
      <Navbar />
      <section className="pt-28 pb-20 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            {isUsd ? <DollarSign className="w-7 h-7 text-primary" /> : <NairaSign className="w-7 h-7 text-primary" />}
          </div>
          <h1 className="font-display font-bold text-4xl md:text-5xl mb-3">Pricing Calculator</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {isUsd
              ? `Buyers paying in US dollars pay by card through Stripe: ${pct}% + ${money(flat)} per paid order. Free events are never charged.`
              : `See exactly what a ticket costs before you list it. Spotlighticket charges ${pct}% + ${money(flat)} per paid order — free events are never charged.`}
          </p>
        </div>

        <div className="glass rounded-2xl p-6 md:p-8 shadow-card space-y-6">
          <div>
            <Label>Currency</Label>
            <div className="grid grid-cols-2 gap-2 mt-1" role="radiogroup" aria-label="Currency">
              {([
                { id: 'NGN' as const, label: 'Naira (₦)', note: 'Paystack · Flutterwave' },
                { id: 'USD' as const, label: 'US dollar ($)', note: 'Card via Stripe' },
              ]).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  role="radio"
                  aria-checked={currency === c.id}
                  onClick={() => switchCurrency(c.id)}
                  className={`rounded-xl border-2 px-4 py-3 text-sm font-medium text-left transition-colors ${currency === c.id ? 'border-primary bg-primary/5' : 'border-border'}`}
                >
                  {c.label}
                  <p className="text-xs text-muted-foreground font-normal mt-0.5">{c.note}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="calc-amount">Ticket price ({isUsd ? '$' : '₦'})</Label>
            <div className="relative">
              {isUsd
                ? <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                : <NairaSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />}
              <Input
                id="calc-amount"
                type="number"
                min={0}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-12 text-lg"
                placeholder="0.00"
              />
            </div>
            {isUsd && price > 0 && nairaOf(price) && (
              <p className="text-xs text-muted-foreground mt-1">≈ {nairaOf(price)} at ₦{rate.toLocaleString('en-NG')} per $1</p>
            )}
          </div>

          <div>
            <Label>Who covers the {isUsd ? 'card' : 'platform'} fee?</Label>
            <div className="grid sm:grid-cols-2 gap-2 mt-1">
              <button
                type="button"
                onClick={() => setPayer('organizer')}
                className={`rounded-xl border-2 px-4 py-3 text-sm font-medium text-left transition-colors flex items-start gap-2 ${
                  payer === 'organizer' ? 'border-primary bg-primary/5' : 'border-border'
                }`}
              >
                <User className="w-4 h-4 mt-0.5 shrink-0 text-primary-glow" />
                <span>
                  Organizer
                  <p className="text-xs text-muted-foreground font-normal mt-0.5">Fee comes out of your payout</p>
                </span>
              </button>
              <button
                type="button"
                onClick={() => setPayer('attendee')}
                className={`rounded-xl border-2 px-4 py-3 text-sm font-medium text-left transition-colors flex items-start gap-2 ${
                  payer === 'attendee' ? 'border-primary bg-primary/5' : 'border-border'
                }`}
              >
                <Users className="w-4 h-4 mt-0.5 shrink-0 text-primary-glow" />
                <span>
                  Attendee
                  <p className="text-xs text-muted-foreground font-normal mt-0.5">Fee is added on top at checkout</p>
                </span>
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              This is a per-event choice organizers make when they create an event — not something Spotlighticket sets for you.
            </p>
          </div>

          <div className="border-t border-border/50 pt-6 space-y-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Ticket price</span>
              <span>{money(price)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>{isUsd ? 'Card fee' : 'Platform fee'} ({pct}% + {money(flat)})</span>
              <span>{money(fee)}</span>
            </div>
            {isUsd && fee > 0 && (
              <div className="pl-4 space-y-1 text-xs text-muted-foreground">
                <div className="flex justify-between"><span>Spotlighticket ({share}%)</span><span>{money(spotlightPart)}</span></div>
                <div className="flex justify-between"><span>Stripe card processing ({Math.max(0, pct - share).toFixed(2)}% + {money(flat)})</span><span>{money(stripePart)}</span></div>
              </div>
            )}
            <div className="flex justify-between font-display font-bold text-lg pt-2 border-t border-border/50">
              <span>Attendee pays</span>
              <span className="text-gradient">{money(attendeePays)}</span>
            </div>
            <div className="flex justify-between font-display font-bold text-lg">
              <span>You receive</span>
              <span className="text-gradient">{money(organizerReceives)}</span>
            </div>
            {isUsd && organizerReceives > 0 && nairaOf(organizerReceives) && (
              <p className="text-xs text-muted-foreground text-right">Paid out in Naira: ≈ {nairaOf(organizerReceives)}</p>
            )}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
