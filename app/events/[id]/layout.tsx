import type { Metadata } from 'next';
import { eventPath, parseEventId, SITE_URL } from '@/lib/eventLink';
import { storageUrl } from '@/lib/storage';

/**
 * Server-side link previews for /events/<slug>-<id>. The page itself is a
 * client component, so WhatsApp/Facebook/X (which don't run JavaScript)
 * only ever saw the site-wide title and logo. This fetches the event and
 * emits its own title, description and image.
 */

const API = (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000/api').replace(/\/$/, '');

type PreviewEvent = {
  id: number;
  title: string;
  description?: string | null;
  image?: string | null;
  date?: string | null;
  venue?: string | null;
  is_virtual?: boolean;
};

async function fetchEvent(id: number): Promise<PreviewEvent | null> {
  try {
    const res = await fetch(`${API}/events/${id}`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 300 }, // previews refresh within 5 minutes of an edit
    });
    return res.ok ? ((await res.json()) as PreviewEvent) : null;
  } catch {
    return null;
  }
}

// Descriptions are stored as HTML; decode entities so Next's own escaping
// doesn't turn "&amp;" into a visible "&amp;amp;" in previews.
const ENTITIES: Record<string, string> = {
  '&nbsp;': ' ', '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&apos;': "'",
  '&ndash;': '–', '&mdash;': '—', '&hellip;': '…', '&lsquo;': '‘', '&rsquo;': '’', '&ldquo;': '“', '&rdquo;': '”',
};

function plainText(html?: string | null, max = 180): string {
  const text = (html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&[a-z]+;|&#39;/g, (m) => ENTITIES[m] ?? m)
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const id = parseEventId(params.id);
  const event = id ? await fetchEvent(id) : null;
  if (!event) {
    return { title: 'Event — Spotlighticket' };
  }

  const when = event.date
    ? new Date(event.date).toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
    : null;
  const where = event.is_virtual ? 'Online' : event.venue;
  const subtitle = [when, where].filter(Boolean).join(' · ');
  const description = [subtitle, plainText(event.description)].filter(Boolean).join(' — ');
  const url = `${SITE_URL}${eventPath(event)}`;
  const image = storageUrl(event.image);
  const title = `${event.title} — Spotlighticket`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      siteName: 'Spotlighticket',
      url,
      title: event.title,
      description,
      images: image ? [{ url: image, alt: event.title }] : undefined,
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title: event.title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default function EventLayout({ children }: { children: React.ReactNode }) {
  return children;
}
