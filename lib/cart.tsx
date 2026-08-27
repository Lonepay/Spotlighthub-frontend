'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Event, TicketVariation } from '@/lib/events';

export interface CartLineItem {
  variation: TicketVariation | null;
  quantity: number;
}

export interface CartItem {
  event: Event;
  selectedDate: string;
  selectedTime: string;
  gateway: 'flutterwave' | 'paystack';
  items: CartLineItem[];
}

interface CartContextType {
  item: CartItem | null;
  itemCount: number;
  setItem: (item: CartItem) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY = 'spotlighticket_cart';

export function CartProvider({ children }: { children: ReactNode }) {
  const [item, setItemState] = useState<CartItem | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return;
      const parsed = JSON.parse(stored);
      // A cart saved before the multi-variation rework has no `items` array
      // at all (old shape was {quantity, variation}, not {items: [...]})  —
      // valid JSON, wrong shape, so JSON.parse alone doesn't catch it. Drop
      // anything that doesn't match instead of crashing every page that
      // reads the cart (the Navbar's item count, on every page, does).
      if (parsed && Array.isArray(parsed.items)) {
        setItemState(parsed);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // ignore corrupt cart state
    }
  }, []);

  const setItem = (newItem: CartItem) => {
    setItemState(newItem);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newItem));
  };

  const clear = () => {
    setItemState(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const itemCount = item?.items?.reduce((sum, i) => sum + i.quantity, 0) ?? 0;

  return (
    <CartContext.Provider value={{ item, itemCount, setItem, clear }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}
