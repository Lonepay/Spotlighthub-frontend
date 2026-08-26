'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { useCart } from '@/lib/cart';
import { events, Event, TicketVariation } from '@/lib/events';
import { Calendar, MapPin, Ticket, ArrowLeft, Check, CreditCard, Clock, Star, Info, Minus, Plus, Zap, Wallet, Layers } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { sanitize } from '@/lib/sanitize';
import { VerifiedBadge } from '@/components/VerifiedBadge';
import { CountdownTimer } from '@/components/CountdownTimer';
import { VenueMap } from '@/components/VenueMap';
import { gateway, GatewayStatus } from '@/lib/gateway';
import { storageUrl } from '@/lib/storage';

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { setItem } = useCart();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  // Only used when the event has no ticket variations at all (a single,
  // undifferentiated ticket at the event's base price).
  const [quantity, setQuantity] = useState(1);

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedGateway, setSelectedGateway] = useState<'flutterwave' | 'paystack'>('flutterwave');
  const [gatewayStatus, setGatewayStatus] = useState<GatewayStatus>({ flutterwave_enabled: true, paystack_enabled: true });
  const [variations, setVariations] = useState<TicketVariation[]>([]);
  // One independent quantity per ticket type — buyers can mix Early Bird,
  // VIP, etc. in the same purchase instead of picking just one.
  const [variationQuantities, setVariationQuantities] = useState<Record<number, number>>({});

  const isMovie = event?.category === 'Movie';

  const eventStarted = event
    ? new Date(`${format(new Date(event.date), 'yyyy-MM-dd')}T${(event.time || '00:00').slice(0, 5)}`) <= new Date()
    : false;

  const formatNaira = (value: number) =>
    new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0,
    }).format(value);

  useEffect(() => {
    loadEvent();
  }, [params.id]);

  useEffect(() => {
    gateway.status().then((status) => {
      setGatewayStatus(status);
      if (!status.flutterwave_enabled && status.paystack_enabled) {
        setSelectedGateway('paystack');
      } else if (!status.paystack_enabled && status.flutterwave_enabled) {
        setSelectedGateway('flutterwave');
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (event) {
      setSelectedDate(new Date(event.date));
      setSelectedTime(event.time);
    }
  }, [event]);

  const loadEvent = async () => {
    try {
      const data = await events.getOne(Number(params.id));
      setEvent(data);
    } catch (error) {
      console.error('Failed to load event:', error);
    } finally {
      setLoading(false);
    }

    try {
      const variationData = await events.getVariations(Number(params.id));
      setVariations(variationData);
    } catch (error) {
      console.error('Failed to load ticket variations:', error);
    }
  };

  const setVariationQuantity = (variationId: number, qty: number, max: number) => {
    setVariationQuantities((prev) => ({ ...prev, [variationId]: Math.max(0, Math.min(qty, max)) }));
  };

  // Normalized selection regardless of whether the event has ticket
  // variations — each entry is one line item (a ticket type + how many).
  const selectedItems = variations.length > 0
    ? variations
        .map((v) => ({ variation: v, quantity: variationQuantities[v.id] || 0 }))
        .filter((i) => i.quantity > 0)
    : quantity > 0
    ? [{ variation: null as TicketVariation | null, quantity }]
    : [];

  const totalQuantity = selectedItems.reduce((sum, i) => sum + i.quantity, 0);

  const handleAddToCart = () => {
    if (!event) return;
    if (eventStarted) {
      toast.error('This event has already started — ticket sales are closed!');
      return;
    }
    if (!selectedDate || !selectedTime) {
      toast.error('Please select a date and time.');
      return;
    }
    if (selectedItems.length === 0) {
      toast.error('Select at least one ticket.');
      return;
    }
    setItem({
      event,
      selectedDate: isMovie ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(event.date), 'yyyy-MM-dd'),
      selectedTime: isMovie ? selectedTime : event.time,
      gateway: selectedGateway,
      items: selectedItems,
    });
    toast.success('Added to cart');
    router.push('/cart');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse space-y-8">
            <div className="h-[50vh] bg-muted rounded-3xl" />
            <div className="h-8 bg-muted rounded w-1/3" />
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <h1 className="text-2xl font-bold text-muted-foreground">Event not found</h1>
          <button onClick={() => router.push('/events')} className="mt-4 text-primary hover:underline">
            Browse all events
          </button>
        </div>
      </div>
    );
  }

  // Only meaningful for the no-variations fallback UI below.
  const availableTickets = event.available_tickets ?? event.total_tickets;

  const subtotal = selectedItems.reduce((sum, i) => sum + (i.variation ? i.variation.price : event.price) * i.quantity, 0);
  const serviceFee = event.fee_payer === 'attendee' && subtotal > 0
    ? Math.round((subtotal * (gatewayStatus.platform_fee_percentage ?? 0) / 100 + (gatewayStatus.platform_flat_fee ?? 0)) * 100) / 100
    : 0;
  const totalDue = subtotal + serviceFee;
  // "FREE" must mean the event/selection is actually free, not just that
  // nothing's been picked yet — an event with real ₦-priced tiers showing
  // "FREE" before any selection reads as "this event costs nothing", which
  // is wrong and misleading the moment it has paid ticket types.
  const priceLabel = totalQuantity > 0
    ? (totalDue === 0 ? 'FREE' : formatNaira(totalDue))
    : (variations.length === 0 && event.price === 0 ? 'FREE' : 'Select tickets');

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground">
      <Navbar />

      {/* Hero Backdrop */}
      <div className="relative w-full h-[75svh] min-h-[520px] lg:h-[85vh]">
        <div className="absolute inset-0">
          {event.image ? (
            <Image
              src={storageUrl(event.image)!}
              alt={event.title}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="w-full h-full bg-gradient-primary" />
          )}
          {/* Always a dark scrim, regardless of site theme — the title/back
              button/ratings/date/time/location below are hardcoded white to
              sit on the hero image, so this can't follow the light/dark
              `background` token or it washes them out in light mode. */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent" />
        </div>

        <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-start pt-8 pb-24 lg:pb-32">
          {/* A normal flow element, not absolute — an absolutely-positioned
              button here doesn't reserve any space, so tall hero content
              (a long wrapped title, the info rows, the countdown) could
              grow upward on mobile and visually overlap it. mt-auto below
              pushes the content to the bottom of whatever space remains,
              keeping the original bottom-anchored look without the overlap risk. */}
          <button
            onClick={() => router.back()}
            className="shrink-0 flex items-center space-x-2 text-white/80 hover:text-white transition-colors glass px-4 py-2 rounded-full"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Explore</span>
          </button>

          <div className="max-w-3xl space-y-4 sm:space-y-6 mt-auto pt-6 lg:pt-8">
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-3 py-1 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider rounded-md">
                {event.category}
              </span>
              {event.is_virtual && (
                <span className="px-3 py-1 bg-blue-500/20 text-blue-200 border border-blue-500/30 text-xs font-bold uppercase tracking-wider rounded-md backdrop-blur-sm">
                  Virtual
                </span>
              )}
              <span className="flex items-center text-yellow-400 text-sm font-medium">
                <Star className="w-4 h-4 fill-current mr-1" />
                4.8 (2.4k reviews)
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-7xl font-display font-extrabold tracking-tight text-white leading-[1.1]">
              {event.title}
            </h1>

            <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-3 sm:gap-6 text-sm sm:text-lg text-white/80">
              <div className="flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-primary-glow" />
                {new Date(event.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
              {event.time && (
                <div className="flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-primary-glow" />
                  {event.time}
                </div>
              )}
              <div className="flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-primary-glow" />
                {event.is_virtual ? 'Online Stream' : event.venue}
              </div>
            </div>

            <div className="max-w-sm">
              <CountdownTimer date={event.date} time={event.time} />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 sm:-mt-12 lg:-mt-20 relative z-10 pb-36 lg:pb-20">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Left Column: Details (padded below the hero's fade so text never sits over the image).
              min-w-0 is required here — grid items default to min-width:auto,
              and the Google Maps iframe's intrinsic width would otherwise
              force this column (and the whole page) wider than the viewport. */}
          <div className="lg:col-span-2 space-y-12 pt-20 min-w-0">
            <section>
              <h2 className="text-2xl font-bold mb-4 flex items-center">
                <Info className="w-6 h-6 mr-2 text-primary-glow" />
                About the Event
              </h2>
              <div
                className="prose prose-lg max-w-none text-muted-foreground leading-relaxed [&_p]:mb-4 [&_a]:text-primary [&_strong]:text-foreground [&_h1]:text-foreground [&_h2]:text-foreground [&_h3]:text-foreground [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6"
                dangerouslySetInnerHTML={{ __html: sanitize(event.description) }}
              />

              {!event.is_virtual && (
                <div className="mt-8">
                  <h3 className="font-semibold text-foreground mb-4 flex items-center">
                    <MapPin className="w-5 h-5 mr-2 text-primary-glow" /> Location
                  </h3>
                  <div className="w-full max-w-full overflow-hidden">
                    <VenueMap latitude={event.latitude} longitude={event.longitude} venue={event.venue} location={event.location} />
                  </div>
                </div>
              )}

              <div className="border-t border-border mt-8 pt-8">
                <h3 className="font-semibold text-foreground mb-4">Presented by</h3>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 shrink-0 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-xl font-bold text-primary">{event.user?.name?.charAt(0) || 'S'}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground flex flex-wrap items-center gap-1.5">
                      <span className="truncate">{event.user?.name || 'Spotlighticket Partner'}</span>
                      {event.user?.is_verified && <VerifiedBadge />}
                    </p>
                    <p className="text-sm text-muted-foreground">{event.user?.is_verified ? 'Verified Organizer' : 'Organizer'}</p>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column: Ticket selector.
              min-w-0 required — same grid-item min-width:auto issue as the
              left column: without it, the ticket-row's shrink-0 +/- controls
              can force this column (and the page) wider than the viewport,
              and the + button gets clipped off-screen by overflow-x:hidden
              instead of staying visible. */}
          <div className="lg:col-span-1 min-w-0" id="booking-section">
            <div className="sticky top-36 glass rounded-3xl shadow-elevated p-4 sm:p-6 lg:p-8">
              <div className="space-y-8">
                <div className="flex justify-between items-baseline border-b border-border pb-6">
                  <div>
                    <p className="text-sm text-muted-foreground uppercase font-bold tracking-wider">Total Price</p>
                    <div className={totalQuantity > 0 || (variations.length === 0 && event.price === 0) ? 'text-3xl font-black text-gradient' : 'text-lg font-bold text-muted-foreground'}>
                      {priceLabel}
                    </div>
                    {serviceFee > 0 && (
                      <p className="text-xs text-muted-foreground mt-0.5">Includes {formatNaira(serviceFee)} service fee</p>
                    )}
                  </div>
                  <div className="text-right">
                    {variations.length === 0 && (
                      <p className="text-xs text-muted-foreground">{availableTickets} seats left</p>
                    )}
                    {totalQuantity > 0 && (
                      <p className="text-xs text-muted-foreground">{totalQuantity} ticket{totalQuantity > 1 ? 's' : ''} selected</p>
                    )}
                  </div>
                </div>

                {eventStarted && (
                  <div className="rounded-xl bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive font-medium">
                    This event has already started. Ticket sales are closed.
                  </div>
                )}

                {variations.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-3 flex items-center">
                      <Layers className="w-4 h-4 mr-2" />
                      Select Ticket Types
                    </label>
                    <p className="text-xs text-muted-foreground -mt-2 mb-3">Mix and match — pick a quantity for as many types as you like.</p>
                    {/* id is watched by WhatsAppButton (IntersectionObserver) so the
                        bubble hides itself while this list is on screen, instead of
                        this list reserving permanent right-padding for it — that
                        padding made the rows look pushed/tilted left. */}
                    <div id="ticket-type-list" className="space-y-2">
                      {variations.map((v) => {
                        const qty = variationQuantities[v.id] || 0;
                        const soldOut = v.available_quantity <= 0;
                        return (
                          <div
                            key={v.id}
                            className={`w-full flex items-center justify-between gap-2 sm:gap-3 rounded-xl border-2 px-4 py-3 transition-all ${
                              qty > 0 ? 'border-primary bg-primary/5' : 'border-border'
                            } ${soldOut ? 'opacity-50' : ''}`}
                          >
                            <div className="min-w-0">
                              <p className="font-medium text-foreground truncate">{v.name}</p>
                              {v.description && <p className="text-xs text-muted-foreground truncate">{v.description}</p>}
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {soldOut ? 'Sold out' : `${v.available_quantity} left`} &middot; <span className="font-semibold text-foreground">{v.price === 0 ? 'FREE' : formatNaira(v.price)}</span>
                              </p>
                            </div>
                            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                              <button
                                type="button"
                                onClick={() => setVariationQuantity(v.id, qty - 1, v.available_quantity)}
                                disabled={qty <= 0}
                                className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center hover:bg-muted hover:border-primary/40 transition-all active:scale-90 disabled:opacity-50"
                                aria-label={`Decrease ${v.name} quantity`}
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="font-bold w-4 text-center">{qty}</span>
                              <button
                                type="button"
                                onClick={() => setVariationQuantity(v.id, qty + 1, v.available_quantity)}
                                disabled={soldOut || qty >= v.available_quantity}
                                className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center hover:bg-muted hover:border-primary/40 transition-all active:scale-90 disabled:opacity-50"
                                aria-label={`Increase ${v.name} quantity`}
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {isMovie ? (
                  <>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-3 flex items-center justify-between">
                        <span>Select Date</span>
                      </label>
                      <div className="relative">
                        <input
                          type="date"
                          min={new Date().toISOString().split('T')[0]}
                          value={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''}
                          onChange={(e) => setSelectedDate(e.target.value ? new Date(e.target.value) : null)}
                          className="w-full bg-secondary/30 border border-transparent focus:border-primary rounded-xl px-4 py-3 outline-none transition-all text-foreground appearance-none"
                        />
                        <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-3 flex items-center">
                        <Clock className="w-4 h-4 mr-2" />
                        Select Showtime
                      </label>
                      <div className="relative">
                        <input
                          type="time"
                          value={selectedTime || ''}
                          onChange={(e) => setSelectedTime(e.target.value)}
                          className="w-full bg-secondary/30 border border-transparent focus:border-primary rounded-xl px-4 py-3 outline-none transition-all text-foreground appearance-none"
                        />
                        <Clock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="rounded-xl bg-secondary/30 px-4 py-3">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Event Date & Time</p>
                    <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-2 sm:gap-4 text-sm text-foreground mb-3">
                      <span className="flex items-center"><Calendar className="w-4 h-4 mr-1.5 text-primary-glow" />{new Date(event.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                      {event.time && (
                        <span className="flex items-center"><Clock className="w-4 h-4 mr-1.5 text-primary-glow" />{event.time}</span>
                      )}
                    </div>
                    <CountdownTimer date={event.date} time={event.time} />
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-3 flex items-center">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Payment Method
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {([
                      { id: 'flutterwave', label: 'Flutterwave', icon: Zap, enabled: gatewayStatus.flutterwave_enabled },
                      { id: 'paystack', label: 'Paystack', icon: Wallet, enabled: gatewayStatus.paystack_enabled },
                    ] as const).filter((gw) => gw.enabled).map((gw) => (
                      <button
                        key={gw.id}
                        onClick={() => setSelectedGateway(gw.id)}
                        className={`relative py-3 px-4 rounded-xl text-sm font-bold border-2 transition-all duration-200 ease-smooth flex items-center justify-center gap-2 active:scale-[0.97] ${
                          selectedGateway === gw.id
                            ? 'bg-gradient-primary border-transparent text-white shadow-glow-sm'
                            : 'bg-card border-border text-foreground hover:border-primary/50 hover:-translate-y-0.5'
                        }`}
                      >
                        <gw.icon className="w-4 h-4" />
                        <span>{gw.label}</span>
                        {selectedGateway === gw.id && <Check className="w-4 h-4" />}
                      </button>
                    ))}
                  </div>
                </div>

                {variations.length === 0 && (
                  <div className="flex items-center justify-between bg-secondary/30 p-4 rounded-xl">
                    <span className="font-medium">Tickets</span>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1}
                        className="w-9 h-9 rounded-full bg-background border border-border flex items-center justify-center hover:bg-muted hover:border-primary/40 transition-all active:scale-90 disabled:opacity-50 disabled:active:scale-100"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="font-bold w-4 text-center">{quantity}</span>
                      <button
                        onClick={() => setQuantity(Math.min(availableTickets, quantity + 1))}
                        disabled={quantity >= availableTickets}
                        className="w-9 h-9 rounded-full bg-background border border-border flex items-center justify-center hover:bg-muted hover:border-primary/40 transition-all active:scale-90 disabled:opacity-50 disabled:active:scale-100"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleAddToCart}
                  disabled={totalQuantity === 0 || eventStarted}
                  variant="hero"
                  size="lg"
                  className="w-full"
                >
                  <Ticket className="w-5 h-5" />
                  {eventStarted
                    ? 'Sales Closed'
                    : totalQuantity > 0
                    ? `Add ${totalQuantity} Ticket${totalQuantity > 1 ? 's' : ''} to Cart`
                    : 'Select tickets to continue'}
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  Secured checkout &middot; Spotlighticket
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] glass border-t border-border lg:hidden z-50">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase font-bold">Total</p>
            <p className={totalQuantity > 0 || (variations.length === 0 && event.price === 0) ? 'text-xl font-black text-gradient' : 'text-sm font-bold text-muted-foreground'}>{priceLabel}</p>
          </div>
          <Button
            onClick={() => document.getElementById('booking-section')?.scrollIntoView({ behavior: 'smooth' })}
            variant="hero"
          >
            Get Tickets
          </Button>
        </div>
      </div>

      <Footer />
    </div>
  );
}
