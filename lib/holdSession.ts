// Identifies "this browser tab" to the seat/venue hold endpoints so the
// backend can tell "you renewing your own hold" apart from "someone else
// claiming it". Deliberately sessionStorage, not localStorage — a fresh
// identity per tab is exactly right here, no reason for it to survive a
// browser restart or be shared across tabs.
const KEY = 'spotlighticket_hold_session';

export function getOrCreateHoldSessionToken(): string {
  if (typeof window === 'undefined') return '';

  try {
    let token = sessionStorage.getItem(KEY);
    if (!token) {
      token = crypto.randomUUID();
      sessionStorage.setItem(KEY, token);
    }
    return token;
  } catch {
    // Private browsing / storage disabled — fall back to an in-memory
    // token for this page load only.
    return crypto.randomUUID();
  }
}
