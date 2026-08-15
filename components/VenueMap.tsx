'use client';

import { useState } from 'react';
import { ExternalLink, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Embeds Google's free, keyless "output=embed" map iframe (no API key
 * required — this is the classic query-based embed, distinct from the paid
 * JS Maps API). Falls back to a plain "open in maps" link when there's no
 * address/venue text at all.
 */
export function VenueMap({
  latitude,
  longitude,
  venue,
  location,
}: {
  latitude?: number | string | null;
  longitude?: number | string | null;
  venue: string;
  location?: string | null;
}) {
  const [copied, setCopied] = useState(false);
  const lat = latitude != null ? Number(latitude) : null;
  const lng = longitude != null ? Number(longitude) : null;
  const address = [venue, location].filter(Boolean).join(', ');
  const hasCoords = lat != null && lng != null && !isNaN(lat) && !isNaN(lng);

  // Anchor to Nigeria when we don't have precise coordinates yet — a bare
  // venue name with no country context is ambiguous to Google's free
  // query-based embed search and was resolving to random places worldwide.
  const query = hasCoords ? `${lat},${lng}` : /nigeria/i.test(address) ? address : `${address}, Nigeria`;
  const embedSrc = `//maps.google.com/maps?width=100%25&height=385&hl=en&q=${encodeURIComponent(
    query
  )}&t=&z=15&ie=UTF8&iwloc=B&output=embed`;
  const viewLargerHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

  const handleCopy = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      toast.success('Address copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy address');
    }
  };

  if (!address) {
    return null;
  }

  return (
    <div className="rounded-2xl overflow-hidden border border-border">
      <iframe
        title={`Map showing ${venue}`}
        src={embedSrc}
        height="385"
        className="w-full h-64 sm:h-80 border-0"
        allowFullScreen
        loading="lazy"
      />
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-muted/30 text-sm">
        <span className="text-muted-foreground truncate">{address}</span>
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 text-primary hover:underline"
            aria-label="Copy address to clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <a
            href={viewLargerHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-primary hover:underline"
          >
            View larger map <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
