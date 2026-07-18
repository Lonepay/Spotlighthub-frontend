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
import { useCart } from '@/lib/cart';
import { payments } from '@/lib/payments';
import { ArrowLeft, Mail, User as UserIcon, Phone, ShieldCheck, Loader2, CheckCircle2, Download, Receipt } from 'lucide-react';
import { toast } from 'sonner';

export default function CheckoutPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { item, clear } = useCart();

  const [email, setEmail] = useState('');
  const [attendeeName, setAttendeeName] = useState('');
  const [attendeePhone, setAttendeePhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [freeSuccess, setFreeSuccess] = useState<{ tickets: any[]; paymentId: number; guestEmail: string } | null>(null);

  const formatNaira = (value: number) =>
    new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0,
    }).format(value);

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

  // Free-ticket success (shown inline since guests have no /my-tickets to land on)
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

  if (!item) {
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

  const { event, quantity, selectedDate, selectedTime, gateway } = item;
  const total = event.price * quantity;
  const isFree = total <= 0;

  const handleSubmit = async () => {
    if (!email || !attendeeName || !attendeePhone) {
      toast.error('Please fill in all attendee details');
      return;
    }

    setSubmitting(true);
    try {
      const response = await payments.initialize(
        event.id,
        quantity,
        email,
        attendeeName,
        attendeePhone,
        gateway,
        selectedDate,
        selectedTime
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
      toast.error(error.response?.data?.message || 'Failed to initialize payment');
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
          <div className="pb-6 border-b border-border/50">
            <div className="flex gap-3 items-center">
              <div className="min-w-0 flex-1">
                <div className="font-display font-semibold truncate">{event.title}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {quantity} &times; {event.price === 0 ? 'Free' : formatNaira(event.price)} &middot; {selectedDate} {selectedTime}
                </div>
              </div>
              <div className="font-display font-semibold">{total === 0 ? 'Free' : formatNaira(total)}</div>
            </div>
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
                <Input
                  id="attendee-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="attendee-name">Full name *</Label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="attendee-name"
                  value={attendeeName}
                  onChange={(e) => setAttendeeName(e.target.value)}
                  className="pl-10"
                  placeholder="Ada Okafor"
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="attendee-phone">Phone number *</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="attendee-phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={attendeePhone}
                  onChange={(e) => setAttendeePhone(e.target.value)}
                  className="pl-10"
                  placeholder="+234 801 234 5678"
                  required
                />
              </div>
            </div>
          </div>

          <div className="py-6 space-y-2 text-sm">
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
              <ShieldCheck className="h-3 w-3" /> Secured by {gateway === 'flutterwave' ? 'Flutterwave' : 'Paystack'} &middot; Tickets reserved for 15 minutes
            </p>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
}
