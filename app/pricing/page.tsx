'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { gateway, GatewayStatus } from '@/lib/gateway';
import { User, Users } from 'lucide-react';
import { NairaSign } from '@/components/icons/NairaSign';

export default function PricingCalculatorPage() {
  const [amount, setAmount] = useState('5000');
  const [payer, setPayer] = useState<'organizer' | 'attendee'>('organizer');
  const [feeInfo, setFeeInfo] = useState<GatewayStatus>({ flutterwave_enabled: true, paystack_enabled: true });

  useEffect(() => {
    gateway.status().then(setFeeInfo).catch(() => {});
  }, []);

  const formatNaira = (value: number) =>
    new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 2,
    }).format(value);

  const price = Math.max(0, parseFloat(amount) || 0);
  const pct = feeInfo.platform_fee_percentage ?? 0;
  const flat = feeInfo.platform_flat_fee ?? 0;
  const fee = price > 0 ? Math.round((price * (pct / 100) + flat) * 100) / 100 : 0;

  const attendeePays = payer === 'attendee' ? price + fee : price;
  const organizerReceives = payer === 'attendee' ? price : Math.max(0, price - fee);

  return (
    <div className="min-h-screen">
      <Navbar />
      <section className="pt-28 pb-20 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <NairaSign className="w-7 h-7 text-primary" />
          </div>
          <h1 className="font-display font-bold text-4xl md:text-5xl mb-3">Pricing Calculator</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            See exactly what a ticket costs before you list it. Spotlighticket charges {pct}% + {formatNaira(flat)} per paid
            order — free events are never charged.
          </p>
        </div>

        <div className="glass rounded-2xl p-6 md:p-8 shadow-card space-y-6">
          <div>
            <Label htmlFor="calc-amount">Ticket price (₦)</Label>
            <div className="relative">
              <NairaSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
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
          </div>

          <div>
            <Label>Who covers the platform fee?</Label>
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
              <span>{formatNaira(price)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Platform fee ({pct}% + {formatNaira(flat)})</span>
              <span>{price > 0 ? formatNaira(fee) : formatNaira(0)}</span>
            </div>
            <div className="flex justify-between font-display font-bold text-lg pt-2 border-t border-border/50">
              <span>Attendee pays</span>
              <span className="text-gradient">{formatNaira(attendeePays)}</span>
            </div>
            <div className="flex justify-between font-display font-bold text-lg">
              <span>You receive</span>
              <span className="text-gradient">{formatNaira(organizerReceives)}</span>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
