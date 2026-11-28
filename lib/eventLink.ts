/**
 * Shareable event links: /events/<title-slug>-<id>, e.g.
 * /events/burna-boy-live-lagos-123. The trailing id is what's looked up, so
 * the link keeps working if the title changes, and old /events/123 links
 * still resolve.
 */

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.spotlighticket.com').replace(/\/$/, '');

export function slugify(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70)
    .replace(/-+$/g, '');
}

export function eventPath(event: { id: number | string; title?: string | null }): string {
  const slug = event.title ? slugify(event.title) : '';
  return slug ? `/events/${slug}-${event.id}` : `/events/${event.id}`;
}

export function eventUrl(event: { id: number | string; title?: string | null }): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : SITE_URL;
  return `${origin}${eventPath(event)}`;
}

/** "burna-boy-live-lagos-123" -> 123; "123" -> 123; anything else -> null. */
export function parseEventId(param: string | string[] | undefined): number | null {
  const value = Array.isArray(param) ? param[0] : param;
  const match = value?.match(/(?:^|-)(\d+)$/);
  return match ? Number(match[1]) : null;
}
