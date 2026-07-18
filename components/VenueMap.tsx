'use client';

import { ExternalLink } from 'lucide-react';

/**
 * Embeds OpenStreetMap — no API key needed. If we have coordinates (event
 * was geocoded server-side from its address) we show a proper embedded map
 * with a marker; otherwise we fall back to a plain "open in maps" link built
 * from the address text alone.
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
  const lat = latitude != null ? Number(latitude) : null;
  const lng = longitude != null ? Number(longitude) : null;
  const address = [venue, location].filter(Boolean).join(', ');

  if (lat != null && lng != null && !isNaN(lat) && !isNaN(lng)) {
    const delta = 0.01;
    const bbox = `${lng - delta}%2C${lat - delta}%2C${lng + delta}%2C${lat + delta}`;
    const embedSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;
    const viewLargerHref = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`;

    return (
      <div className="rounded-2xl overflow-hidden border border-border">
        <iframe
          title={`Map showing ${venue}`}
          src={embedSrc}
          className="w-full h-64 sm:h-80 border-0"
          loading="lazy"
        />
        <div className="flex items-center justify-between px-4 py-2.5 bg-muted/30 text-sm">
          <span className="text-muted-foreground truncate">{address}</span>
          <a
            href={viewLargerHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-primary hover:underline shrink-0 ml-3"
          >
            View larger map <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <a
      href={`https://www.openstreetmap.org/search?query=${encodeURIComponent(address)}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between rounded-2xl border border-border px-4 py-4 text-sm hover:bg-muted/30 transition-colors"
    >
      <span className="text-muted-foreground">{address || 'View location'}</span>
      <span className="flex items-center gap-1 text-primary shrink-0 ml-3">
        Open in maps <ExternalLink className="w-3.5 h-3.5" />
      </span>
    </a>
  );
}
