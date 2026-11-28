/**
 * Where to go after signing in. Only same-site paths are allowed - never
 * "//evil.com" or "https://…", which would turn the login page into an open
 * redirect.
 */
export function safeNext(value: string | null | undefined): string | null {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return null;
  if (value.startsWith('/login') || value.startsWith('/register')) return null;
  return value;
}

/** /login?next=<this page>, so signing in lands you back where you were. */
export function loginHref(next?: string): string {
  const here = next ?? (typeof window !== 'undefined' ? window.location.pathname + window.location.search : '');
  const target = safeNext(here);
  return target && target !== '/' ? `/login?next=${encodeURIComponent(target)}` : '/login';
}
