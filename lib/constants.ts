// International format, no leading 0 or +, matching wa.me/api.whatsapp.com's
// expected format. Single source of truth — this used to be hardcoded
// separately in WhatsAppButton.tsx and Footer.tsx with the same value,
// which is exactly the kind of duplication that lets one spot get missed
// on the next update.
export const WHATSAPP_NUMBER = '2349164007209';
