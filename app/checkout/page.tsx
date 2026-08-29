'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/components/AuthProvider';
import { useCart, entryTotal, EventCartEntry } from '@/lib/cart';
import { payments } from '@/lib/payments';
import { gateway as gatewayApi, GatewayStatus } from '@/lib/gateway';
import { coupons, CouponValidation } from '@/lib/coupons';
import { ArrowLeft, Mail, User as UserIcon, Phone, ShieldCheck, Loader2, CheckCircle2, Receipt, Tag, X, Clapperboard, Building2 } from 'lucide-react';
import { toast } from 'sonner';

function formatNaira(value: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(value);
}

export default function CheckoutPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { cart, clear } = useCart();

  const [email, setEmail] = useState('');
  const [attendeeName, setAttendeeName] = useState('');
  const [attendeePhone, setAttendeePhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [freeSuccess, setFreeSuccess] = useState<{ tickets: any[]; paymentId: number; guestEmail: string } | null>(null);
  const [feeInfo, setFeeInfo] = useState<GatewayStatus>({ flutterwave_enabled: true, paystack_enabled: true });
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<CouponValidation | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  useEffect(() => {
    gatewayApi.status().then(setFeeInfo).catch(() => {});
  }, []);

  useEffect(() => {
    if (user) {
      setAttendeeName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  if (authLoading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="pt-32 pb-20 text-center text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (freeSuccess) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <section className="flex-1 pt-28 pb-20 max-w-2xl mx-auto w-full px-4 sm:px-6 lg:px-8">
          <div className="glass rounded-2xl p-8 md:p-12 shadow-card text-center">
            <CheckCircle2 className="h-14 w-14 mx-auto text-emerald-500 mb-4" />
            <h1 className="font-display font-bold text-3xl md:text-4xl mb-2">You're in 🎉</h1>
            <p className="text-muted-foreground mb-8">
              {freeSuccess.tickets.length} ticket{freeSuccess.tickets.length > 1 ? 's have' : ' has'} been issued.
              {!user && ' Save this page — you can download your tickets and receipt here.'}
            </p>

            <div className="grid sm:grid-cols-2 gap-3 mb-8">
              {freeSuccess.tickets.map((t: any) => (
                <div key={t.id} className="flex items-center gap-3 rounded-xl bg-background/40 border border-border/50 p-3">
                  <div className="bg-white p-2 rounded-md grid place-items-center">
                    <QRCodeSVG value={t.code} size={72} level="H" imageSettings={{ src: '/storage/logo.png', height: 18, width: 18, excavate: true }} />
                  </div>
                  <div className="text-xs text-left">
                    <div className="font-semibold font-mono">{t.code}</div>
                    <div className="text-muted-foreground mt-0.5">Scan at entry</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 justify-center">
              <Button
                variant="glass"
                onClick={async () => {
                  try {
                    await payments.downloadReceipt(freeSuccess.paymentId, undefined, user ? undefined : freeSuccess.guestEmail);
                  } catch {
                    toast.error("Couldn't download the receipt");
                  }
                }}
              >
                <Receipt className="w-4 h-4" /> Download receipt
              </Button>
              {user ? (
                <Button asChild variant="hero">
                  <Link href="/my-tickets">View all tickets</Link>
                </Button>
              ) : (
                <Button asChild variant="hero">
                  <Link href="/events">Explore more events</Link>
                </Button>
              )}
            </div>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  if (cart.entries.length === 0) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <section className="pt-28 pb-20 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="glass rounded-2xl p-10 md:p-14 shadow-card">
            <h1 className="font-display font-bold text-3xl md:text-4xl mb-2">Nothing to pay for yet</h1>
            <p className="text-muted-foreground mb-8">Your cart is empty — add tickets to check out.</p>
            <Button asChild variant="hero" size="lg">
              <Link href="/events">Explore events</Link>
            </Button>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  const primaryEventEntry = cart.entries.find((e): e is EventCartEntry => e.type === 'event');
  const allEventType = cart.entries.every((e) => e.type === 'event');

  const eventSubtotal = cart.entries.filter((e) => e.type === 'event').reduce((sum, e) => sum + entryTotal(e), 0);
  const otherSubtotal = cart.entries.filter((e) => e.type !== 'event').reduce((sum, e) => sum + entryTotal(e), 0);
  const discountAmount = appliedCoupon?.discount_amount ?? 0;
  const subtotal = eventSubtotal + otherSubtotal;
  const discountedSubtotal = Math.max(0, subtotal - discountAmount);

  // Fee only ever applies to an all-Event cart, using the first event's own
  // fee_payer choice — matches PaymentController::initializeMulti exactly.
  const feePayerIsAttendee = allEventType && primaryEventEntry?.event.fee_payer === 'attendee';
  const serviceFee = feePayerIsAttendee && discountedSubtotal > 0
    ? Math.round((discountedSubtotal * (feeInfo.platform_fee_percentage ?? 0) / 100 + (feeInfo.platform_flat_fee ?? 0)) * 100) / 100
    : 0;
  const total = discountedSubtotal + serviceFee;
  const isFree = total <= 0;

  const handleApplyCoupon = async () => {
    if (!couponInput.trim() || !primaryEventEntry) return;
    setApplyingCoupon(true);
    try {
      const itemsPayload = primaryEventEntry.items.map((i) => ({ variationId: i.variation?.id, quantity: i.quantity }));
      const result = await coupons.validate(primaryEventEntry.event.id, couponInput.trim(), itemsPayload);
      setAppliedCoupon(result);
      toast.success(`Coupon applied — ${formatNaira(result.discount_amount)} off`);
    } catch (error: any) {
      setAppliedCoupon(null);
      toast.error(error.response?.data?.message || 'Invalid coupon code');
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
  };

  const handleSubmit = async () => {
    if (!email || !attendeeName || !attendeePhone) {
      toast.error('Please fill in all attendee details');
      return;
    }

    setSubmitting(true);
    try {
      const response = await payments.initializeMulti(
        cart.entries,
        email,
        attendeeName,
        attendeePhone,
        cart.gateway,
        appliedCoupon?.code
      );

      if (response.is_free) {
        clear();
        if (user) {
          toast.success("You're in! Tickets have been issued.");
          router.push('/my-tickets');
        } else {
          setFreeSuccess({ tickets: response.tickets, paymentId: response.payment.id, guestEmail: email });
        }
      } else if (response.authorization_url) {
        clear();
        window.location.href = response.authorization_url;
      } else {
        toast.error('Failed to initialize payment. Please try again.');
      }
    } catch (error: any) {
      if (error.response?.status === 409) {
        toast.error(error.response?.data?.message || 'Some items were just taken by someone else — please review your cart.');
      } else {
        toast.error(error.response?.data?.message || 'Failed to initialize payment');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <section className="pt-28 pb-20 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Button asChild variant="ghost" size="sm" className="-ml-3 mb-6">
          <Link href="/cart">
            <ArrowLeft className="h-4 w-4" /> Back to cart
          </Link>
        </Button>

        <div className="text-xs uppercase tracking-widest text-primary-glow mb-2">
          Confirm &amp; {isFree ? 'get tickets' : 'pay'}
        </div>
        <h1 className="font-display font-bold text-4xl md:text-5xl mb-8">Checkout</h1>

        <div className="glass rounded-2xl p-6 md:p-8 shadow-card">
          <div className="pb-6 border-b border-border/50 space-y-4">
            {cart.entries.map((entry, idx) => (
              <div key={idx} className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  {entry.type === 'event' && <span className="text-xs font-bold text-primary">{entry.items.reduce((s, i) => s + i.quantity, 0)}</span>}
                  {entry.type === 'movie' && <Clapperboard className="w-4 h-4 text-primary" />}
                  {entry.type === 'venue' && <Building2 className="w-4 h-4 text-primary" />}
                </div>
                <div className="min-w-0 flex-1">
                  {entry.type === 'event' && (
                    <>
                      <div className="text-sm font-medium truncate">{entry.event.title}</div>
                      <div className="text-xs text-muted-foreground">{entry.selectedDate}{entry.selectedTime ? ` ${entry.selectedTime}` : ''}</div>
                    </>
                  )}
                  {entry.type === 'movie' && (
                    <>
                      <div className="text-sm font-medium truncate">{entry.movie.title} — {entry.seatIds.length} seat{entry.seatIds.length > 1 ? 's' : ''}</div>
                      <div className="text-xs text-muted-foreground">{new Date(entry.showtime.date).toLocaleDateString()} {entry.showtime.time} · Seats {entry.seatIds.join(', ')}</div>
                    </>
                  )}
                  {entry.type === 'venue' && (
                    <>
                      <div className="text-sm font-medium truncate">{entry.venue.name} — {entry.tier.name}</div>
                      <div className="text-xs text-muted-foreground">{new Date(entry.bookingDate).toLocaleDateString()}</div>
                    </>
                  )}
                </div>
                <div className="text-sm font-semibold shrink-0">{entryTotal(entry) === 0 ? 'Free' : formatNaira(entryTotal(entry))}</div>
              </div>
            ))}
          </div>

          <div className="py-6 border-b border-border/50 space-y-4">
            <div className="flex items-center justify-between">
              <div className="font-display font-semibold">Attendee details</div>
              {!user && (
                <Link href={`/login?next=/checkout`} className="text-xs text-primary-glow hover:underline">
                  Sign in instead
                </Link>
              )}
            </div>
            {!user && (
              <p className="text-xs text-muted-foreground -mt-2">No account needed — your tickets are tied to the email below.</p>
            )}
            <div>
              <Label htmlFor="attendee-email">Email *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="attendee-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" placeholder="you@example.com" required />
              </div>
            </div>
            <div>
              <Label htmlFor="attendee-name">Full name *</Label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="attendee-name" value={attendeeName} onChange={(e) => setAttendeeName(e.target.value)} className="pl-10" placeholder="Ada Okafor" required />
              </div>
            </div>
            <div>
              <Label htmlFor="attendee-phone">Phone number *</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="attendee-phone" type="tel" inputMode="tel" autoComplete="tel" value={attendeePhone} onChange={(e) => setAttendeePhone(e.target.value)} className="pl-10" placeholder="+234 801 234 5678" required />
              </div>
            </div>
          </div>

          {primaryEventEntry && eventSubtotal > 0 && (
            <div className="py-6 border-b border-border/50">
              <Label htmlFor="coupon-code">Coupon code</Label>
              <p className="text-xs text-muted-foreground mb-1.5">Applies to {primaryEventEntry.event.title} only.</p>
              {appliedCoupon ? (
                <div className="flex items-center justify-between mt-1 rounded-lg bg-primary/5 border border-primary/30 px-3 py-2">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <Tag className="h-4 w-4 text-primary" /> {appliedCoupon.code}
                  </span>
                  <button type="button" onClick={handleRemoveCoupon} className="text-muted-foreground hover:text-destructive">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2 mt-1">
                  <Input id="coupon-code" value={couponInput} onChange={(e) => setCouponInput(e.target.value)} placeholder="Enter code" className="uppercase" />
                  <Button type="button" variant="outline" onClick={handleApplyCoupon} disabled={applyingCoupon || !couponInput.trim()}>
                    {applyingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
                  </Button>
                </div>
              )}
            </div>
          )}

          <div className="py-6 space-y-2 text-sm">
            {(serviceFee > 0 || discountAmount > 0 || cart.entries.length > 1) && (
              <>
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatNaira(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                    <span>Discount ({appliedCoupon?.code})</span>
                    <span>-{formatNaira(discountAmount)}</span>
                  </div>
                )}
                {serviceFee > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Service fee</span>
                    <span>{formatNaira(serviceFee)}</span>
                  </div>
                )}
              </>
            )}
            <div className="flex justify-between font-display font-bold text-xl pt-2">
              <span>Total</span>
              <span className="text-gradient">{isFree ? 'Free' : formatNaira(total)}</span>
            </div>
          </div>

          <Button variant="hero" size="lg" className="w-full" onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Processing…
              </>
            ) : isFree ? (
              'Get free tickets'
            ) : (
              `Pay ${formatNaira(total)}`
            )}
          </Button>

          {!isFree && (
            <p className="text-[11px] text-muted-foreground text-center mt-4 flex items-center justify-center gap-1.5">
              <ShieldCheck className="h-3 w-3" /> Secured by {cart.gateway === 'flutterwave' ? 'Flutterwave' : 'Paystack'} &middot; Seats/dates held for 15 minutes
            </p>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
}
