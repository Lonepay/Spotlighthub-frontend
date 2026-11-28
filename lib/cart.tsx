'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Event, TicketVariation } from '@/lib/events';
import { Movie, MovieShowtime, MovieTicketTier } from '@/lib/movies';
import { Venue, VenuePricingTier } from '@/lib/venues';
import { PaymentGateway } from '@/lib/gateway';

export interface CartLineItem {
  variation: TicketVariation | null;
  quantity: number;
}

export interface EventCartEntry {
  type: 'event';
  event: Event;
  selectedDate: string;
  selectedTime: string;
  items: CartLineItem[];
  // Optional donation on top of the tickets (events with donations open).
  donationAmount?: number;
}

export interface MovieAddonSelection {
  addonId: number;
  quantity: number;
  name: string;
  price: number;
}

export interface MovieCartEntry {
  type: 'movie';
  movie: Movie;
  showtime: MovieShowtime;
  seatIds: string[];
  // Snapshot of the movie's tiers at add-to-cart time, for display/estimate
  // only — the actual charge always resolves server-side per seat from the
  // showtime's own seat_map, this is never sent to the backend.
  ticketTiers: MovieTicketTier[];
  addons: MovieAddonSelection[];
  sessionToken: string;
}

/** Estimated price for one seat, by matching its seat_map tier_label to a MovieTicketTier's name. Display-only. */
export function estimateSeatPrice(entry: MovieCartEntry, seatId: string): number {
  for (const row of entry.showtime.seat_map?.rows || []) {
    for (const seat of row.seats) {
      if (seat.seat_id === seatId) {
        const label = (seat.tier_label ?? row.tier_label ?? '').toLowerCase();
        const tier = entry.ticketTiers.find((t) => t.name.toLowerCase() === label);
        return tier?.price ?? 0;
      }
    }
  }
  return 0;
}

export interface VenueCartEntry {
  type: 'venue';
  venue: Venue;
  tier: VenuePricingTier;
  bookingDate: string;
  sessionToken: string;
}

export interface ProductCartEntry {
  type: 'product';
  // Snapshot for display; the price charged is always re-read server-side.
  product: {
    id: number;
    name: string;
    price: number;
    image: string | null;
    stock: number | null;
    vendor_id: number;
    vendor_name: string;
    // The vendor's handover options, for the checkout estimate.
    offers_pickup: boolean;
    pickup_address: string | null;
    offers_delivery: boolean;
    delivery_fee: number;
    delivery_note: string | null;
  };
  quantity: number;
}

export type CartEntry = EventCartEntry | MovieCartEntry | VenueCartEntry | ProductCartEntry;

/** How one vendor's products reach the buyer, chosen at checkout. */
export interface DeliveryChoice {
  method: 'pickup' | 'delivery';
  address?: string;
}

export interface Cart {
  entries: CartEntry[];
  gateway: PaymentGateway;
  // vendor_id -> pickup or delivery
  deliveries?: Record<string, DeliveryChoice>;
  version: 2;
}

/** Estimated total for one entry — display/estimate only, see estimateSeatPrice. */
export function entryTotal(entry: CartEntry): number {
  if (entry.type === 'event') {
    return entry.items.reduce((sum, i) => sum + (i.variation ? i.variation.price : entry.event.price) * i.quantity, 0);
  }
  if (entry.type === 'product') {
    return entry.product.price * entry.quantity;
  }
  if (entry.type === 'movie') {
    const seatsTotal = entry.seatIds.reduce((sum, id) => sum + estimateSeatPrice(entry, id), 0);
    const addonsTotal = entry.addons.reduce((sum, a) => sum + a.price * a.quantity, 0);
    return seatsTotal + addonsTotal;
  }
  return entry.tier.price;
}

interface CartContextType {
  cart: Cart;
  itemCount: number;
  addEntry: (entry: CartEntry) => void;
  removeEntry: (index: number) => void;
  setDonation: (index: number, amount: number | undefined) => void;
  setQuantity: (index: number, quantity: number) => void;
  setDelivery: (vendorId: number, choice: DeliveryChoice) => void;
  setGateway: (gateway: PaymentGateway) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY = 'spotlighticket_cart';

const EMPTY_CART: Cart = { entries: [], gateway: 'flutterwave', version: 2 };

function entryKey(entry: CartEntry): string {
  if (entry.type === 'event') return `event-${entry.event.id}`;
  if (entry.type === 'movie') return `movie-${entry.showtime.id}`;
  if (entry.type === 'product') return `product-${entry.product.id}`;
  return `venue-${entry.venue.id}-${entry.bookingDate}`;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCartState] = useState<Cart>(EMPTY_CART);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return;
      const parsed = JSON.parse(stored);
      // A cart saved before this multi-item rework has an `items` array
      // directly on the root object, not `entries` — valid JSON, wrong
      // shape, so JSON.parse alone doesn't catch it. Drop anything that
      // doesn't match instead of crashing every page that reads the cart
      // (the Navbar's item count, on every page, does).
      if (parsed && Array.isArray(parsed.entries)) {
        setCartState(parsed);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // ignore corrupt cart state
    }
  }, []);

  const persist = (next: Cart) => {
    setCartState(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const addEntry = (entry: CartEntry) => {
    const key = entryKey(entry);
    const existing = cart.entries.find((e) => entryKey(e) === key);
    // Adding the same product again adds to its quantity (up to stock).
    if (entry.type === 'product' && existing?.type === 'product') {
      const cap = entry.product.stock ?? 100;
      const merged = { ...entry, quantity: Math.min(existing.quantity + entry.quantity, cap, 100) };
      persist({ ...cart, entries: cart.entries.map((e) => (entryKey(e) === key ? merged : e)) });
      return;
    }
    const withoutExisting = cart.entries.filter((e) => entryKey(e) !== key);
    persist({ ...cart, entries: [...withoutExisting, entry] });
  };

  const setQuantity = (index: number, quantity: number) => {
    persist({
      ...cart,
      entries: cart.entries.map((e, i) => {
        if (i !== index || e.type !== 'product') return e;
        const cap = Math.min(e.product.stock ?? 100, 100);
        return { ...e, quantity: Math.max(1, Math.min(quantity, cap)) };
      }),
    });
  };

  const setDelivery = (vendorId: number, choice: DeliveryChoice) => {
    persist({ ...cart, deliveries: { ...(cart.deliveries ?? {}), [String(vendorId)]: choice } });
  };

  const removeEntry = (index: number) => {
    persist({ ...cart, entries: cart.entries.filter((_, i) => i !== index) });
  };

  const setDonation = (index: number, amount: number | undefined) => {
    persist({
      ...cart,
      entries: cart.entries.map((e, i) => (i === index && e.type === 'event' ? { ...e, donationAmount: amount } : e)),
    });
  };

  const setGateway = (gateway: PaymentGateway) => {
    persist({ ...cart, gateway });
  };

  const clear = () => {
    setCartState(EMPTY_CART);
    localStorage.removeItem(STORAGE_KEY);
  };

  const itemCount = cart.entries.reduce((sum, entry) => {
    if (entry.type === 'event') return sum + entry.items.reduce((s, i) => s + i.quantity, 0);
    if (entry.type === 'movie') return sum + entry.seatIds.length;
    if (entry.type === 'product') return sum + entry.quantity;
    return sum + 1;
  }, 0);

  return (
    <CartContext.Provider value={{ cart, itemCount, addEntry, removeEntry, setDonation, setQuantity, setDelivery, setGateway, clear }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}
