'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { useCart, entryTotal } from '@/lib/cart';
import { storageUrl } from '@/lib/storage';
import { ShoppingCart, Calendar, MapPin, ArrowRight, Trash2, Clapperboard, Building2, Ticket as TicketIcon } from 'lucide-react';

function formatNaira(value: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(value);
}

export default function CartPage() {
  const router = useRouter();
  const { cart, removeEntry, clear } = useCart();

  if (cart.entries.length === 0) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <section className="pt-28 pb-20 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="glass rounded-2xl p-10 md:p-14 shadow-card">
            <ShoppingCart className="h-14 w-14 mx-auto text-primary-glow mb-4" />
            <h1 className="font-display font-bold text-3xl md:text-4xl mb-2">Your cart is empty</h1>
            <p className="text-muted-foreground mb-8">Add tickets to an event, movie, or venue to see them here.</p>
            <Button asChild variant="hero" size="lg">
              <Link href="/events">Explore events</Link>
            </Button>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  const grandTotal = cart.entries.reduce((sum, e) => sum + entryTotal(e), 0);
  const hasMovieEntry = cart.entries.some((e) => e.type === 'movie');

  return (
    <div className="min-h-screen">
      <Navbar />
      <section className="pt-28 pb-20 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="text-xs uppercase tracking-widest text-primary-glow mb-2">Your cart</div>
            <h1 className="font-display font-bold text-4xl md:text-5xl">Cart</h1>
          </div>
          <button onClick={clear} className="text-sm text-muted-foreground hover:text-destructive transition-colors">
            Clear all
          </button>
        </div>

        <div className="space-y-4">
          {cart.entries.map((entry, idx) => (
            <div key={idx} className="glass rounded-2xl p-6 shadow-card">
              {entry.type === 'event' && (
                <div className="flex gap-4 items-center">
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-muted shrink-0">
                    {entry.event.image ? (
                      <Image src={storageUrl(entry.event.image)!} alt={entry.event.title} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-primary" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display font-semibold text-lg truncate">{entry.event.title}</h3>
                    <div className="mt-1 text-xs text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" /> {entry.selectedDate}{entry.selectedTime ? ` · ${entry.selectedTime}` : ''}</span>
                      <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {entry.event.is_virtual ? 'Online' : entry.event.venue}</span>
                    </div>
                    <div className="mt-2 space-y-1">
                      {entry.items.map((i, lineIdx) => {
                        const price = i.variation ? i.variation.price : entry.event.price;
                        return (
                          <div key={lineIdx} className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{i.variation ? `${i.variation.name} — ` : ''}{i.quantity} &times; {price === 0 ? 'Free' : formatNaira(price)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <span className="font-semibold shrink-0">{entryTotal(entry) === 0 ? 'Free' : formatNaira(entryTotal(entry))}</span>
                  <button onClick={() => removeEntry(idx)} className="text-muted-foreground hover:text-destructive transition-colors p-2 shrink-0">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              )}

              {entry.type === 'movie' && (
                <div className="flex gap-4 items-center">
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-muted shrink-0">
                    {entry.movie.poster ? (
                      <Image src={storageUrl(entry.movie.poster)!} alt={entry.movie.title} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-primary flex items-center justify-center"><Clapperboard className="w-8 h-8 text-white/50" /></div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display font-semibold text-lg truncate">{entry.movie.title}</h3>
                    <div className="mt-1 text-xs text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(entry.showtime.date).toLocaleDateString()} · {entry.showtime.time}</span>
                      <span>{entry.showtime.hall_name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Seats: {entry.seatIds.join(', ')}</p>
                    {entry.addons.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {entry.addons.map((a) => `${a.quantity}x ${a.name}`).join(', ')}
                      </p>
                    )}
                  </div>
                  <button onClick={() => removeEntry(idx)} className="text-muted-foreground hover:text-destructive transition-colors p-2 shrink-0">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              )}

              {entry.type === 'venue' && (
                <div className="flex gap-4 items-center">
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-muted shrink-0">
                    {entry.venue.cover_image ? (
                      <Image src={storageUrl(entry.venue.cover_image)!} alt={entry.venue.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-primary flex items-center justify-center"><Building2 className="w-8 h-8 text-white/50" /></div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display font-semibold text-lg truncate">{entry.venue.name}</h3>
                    <div className="mt-1 text-xs text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(entry.bookingDate).toLocaleDateString()}</span>
                      <span>{entry.tier.name}</span>
                    </div>
                  </div>
                  <span className="font-semibold shrink-0">{entryTotal(entry) === 0 ? 'Free' : formatNaira(entryTotal(entry))}</span>
                  <button onClick={() => removeEntry(idx)} className="text-muted-foreground hover:text-destructive transition-colors p-2 shrink-0">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="glass rounded-2xl p-6 mt-6 shadow-card">
          {hasMovieEntry && (
            <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1.5">
              <TicketIcon className="w-3.5 h-3.5 shrink-0" /> Seat prices shown are estimates — the final charge is confirmed at checkout.
            </p>
          )}
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{hasMovieEntry ? 'Estimated total' : 'Total'}</span>
            <span className="font-display font-bold text-xl">{grandTotal === 0 ? 'Free' : formatNaira(grandTotal)}</span>
          </div>
          <Button variant="hero" size="lg" className="w-full mt-4" onClick={() => router.push('/checkout')}>
            Proceed to checkout <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </section>
      <Footer />
    </div>
  );
}
