'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Megaphone, X, ArrowRight } from 'lucide-react';
import { announcements, TickerItem } from '@/lib/announcements';

const DISMISSED_KEY = 'dash-dismissed-announcements';

const TONE: Record<TickerItem['tone'], string> = {
  info: 'bg-primary/10 text-foreground',
  success: 'bg-emerald-500/10 text-foreground',
  warning: 'bg-amber-500/15 text-foreground',
};

function readDismissed(): string[] {
  try {
    return JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]');
  } catch {
    return [];
  }
}

/**
 * The ticker tape across the top of the dashboard: admin announcements and
 * the KYC reminder. Scrolls when there's more than fits, pauses on hover or
 * focus, and sits still for people who prefer reduced motion.
 */
export function AnnouncementTicker() {
  const [items, setItems] = useState<TickerItem[]>([]);
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    setDismissed(readDismissed());
    announcements.mine().then(setItems).catch(() => setItems([]));
  }, []);

  const visible = items.filter((i) => !i.dismissible || !dismissed.includes(i.id));
  if (visible.length === 0) return null;

  const dismiss = (id: string) => {
    const next = [...dismissed, id];
    setDismissed(next);
    try {
      localStorage.setItem(DISMISSED_KEY, JSON.stringify(next.slice(-50)));
    } catch {
      // private mode: it just comes back next visit
    }
  };

  // The strip takes the first item's tone (the KYC reminder when present).
  const tone = TONE[visible[0].tone] ?? TONE.info;

  const renderItem = (item: TickerItem, copy: boolean) => (
    <span key={`${item.id}-${copy}`} className="inline-flex items-center gap-2 whitespace-nowrap px-6" aria-hidden={copy || undefined}>
      <span className={`w-1.5 h-1.5 rounded-full ${item.tone === 'warning' ? 'bg-amber-500' : item.tone === 'success' ? 'bg-emerald-500' : 'bg-primary'}`} />
      <span>{item.message}</span>
      {item.link_url && (
        <Link href={item.link_url} tabIndex={copy ? -1 : undefined} className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
          {item.link_label || 'Learn more'} <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      )}
      {item.dismissible && !copy && (
        <button type="button" onClick={() => dismiss(item.id)} aria-label="Dismiss announcement" className="text-muted-foreground hover:text-foreground">
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </span>
  );

  return (
    <div className={`dash-ticker relative flex items-center h-10 border-b border-border text-sm overflow-hidden ${tone}`} role="region" aria-label="Announcements">
      <span className="relative z-10 h-full shrink-0 inline-flex items-center gap-1.5 px-3 sm:px-4 bg-card border-r border-border font-medium">
        <Megaphone className="w-4 h-4 text-primary" /> <span className="hidden sm:inline">News</span>
      </span>
      <div className="relative flex-1 overflow-hidden">
        {/* The content twice, so the loop is seamless; the copy is hidden from screen readers. */}
        <div className="dash-ticker__track inline-flex" style={{ animationDuration: `${Math.max(20, visible.reduce((n, i) => n + i.message.length, 0) / 4)}s` }}>
          {visible.map((i) => renderItem(i, false))}
          {visible.map((i) => renderItem(i, true))}
        </div>
      </div>
    </div>
  );
}
