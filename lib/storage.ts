/**
 * Builds a full URL for an uploaded file (event/blog images, KYC docs,
 * og-image, etc). These are stored relative to the storage root — e.g.
 * "events/abc123.jpg" — regardless of whether the backend serves them
 * itself or from Cloudflare R2, so this is the one place that decides
 * which base URL to prefix.
 */
export function storageUrl(path?: string | null): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;

  const base = process.env.NEXT_PUBLIC_STORAGE_URL || `${process.env.NEXT_PUBLIC_BACKEND_URL?.replace('/api', '')}/storage`;
  return `${base}/${path}`;
}
