'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { useCart } from '@/lib/cart';
import { ShoppingCart, Calendar, MapPin, ArrowRight, Trash2 } from 'lucide-react';

export default function CartPage() {
  const router = useRouter();
  const { item, clear } = useCart();

  const formatNaira = (value: number) =>
    new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0,
    }).format(value);

  if (!item) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <section className="pt-28 pb-20 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="glass rounded-2xl p-10 md:p-14 shadow-card">
            <ShoppingCart className="h-14 w-14 mx-auto text-primary-glow mb-4" />
            <h1 className="font-display font-bold text-3xl md:text-4xl mb-2">Your cart is empty</h1>
            <p className="text-muted-foreground mb-8">Add tickets to an event to see them here.</p>
            <Button asChild variant="hero" size="lg">
              <Link href="/events">Explore events</Link>
            </Button>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  const { event, quantity, selectedDate, selectedTime } = item;
  const total = event.price * quantity;

  return (
    <div className="min-h-screen">
      <Navbar />
      <section className="pt-28 pb-20 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-xs uppercase tracking-widest text-primary-glow mb-2">Your cart</div>
        <h1 className="font-display font-bold text-4xl md:text-5xl mb-8">Cart</h1>

        <div className="glass rounded-2xl p-6 md:p-8 shadow-card space-y-6">
          <div className="flex gap-4 items-center">
            <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-muted shrink-0">
              {event.image ? (
                <Image
                  src={`${process.env.NEXT_PUBLIC_BACKEND_URL?.replace('/api', '')}/storage/${event.image}`}
                  alt={event.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-primary" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-display font-semibold text-lg truncate">{event.title}</h3>
              <div className="mt-1 text-xs text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> {selectedDate} &middot; {selectedTime}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {event.is_virtual ? 'Online' : event.venue}
                </span>
              </div>
            </div>
            <button
              onClick={clear}
              className="text-muted-foreground hover:text-destructive transition-colors p-2"
              title="Remove from cart"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center justify-between text-sm border-t border-border/50 pt-4">
            <span className="text-muted-foreground">
              {quantity} &times; {event.price === 0 ? 'Free' : formatNaira(event.price)}
            </span>
            <span className="font-display font-bold text-xl">
              {total === 0 ? 'Free' : formatNaira(total)}
            </span>
          </div>

          <Button variant="hero" size="lg" className="w-full" onClick={() => router.push('/checkout')}>
            Proceed to checkout <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </section>
      <Footer />
    </div>
  );
}
