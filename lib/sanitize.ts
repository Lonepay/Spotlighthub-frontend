import sanitizeHtml from 'sanitize-html';

// isomorphic-dompurify's server path (jsdom -> html-encoding-sniffer ->
// @exodus/bytes) crashes on Vercel's Node runtime with ERR_REQUIRE_ESM —
// @exodus/bytes ships ESM-only and html-encoding-sniffer requires() it
// synchronously, which no jsdom version currently avoids. sanitize-html has
// no native/DOM dependency at all, so it works identically server and
// client side. Allowlist matches what the RichTextEditor (Tiptap
// StarterKit + Link) can actually produce.
export function sanitize(html: string): string {
  return sanitizeHtml(html, {
    // RichTextEditor has a raw-HTML source mode, so content isn't limited to
    // what the toolbar produces — stay close to DOMPurify's old, permissive
    // default tag set (sanitize-html's own defaults already cover the
    // common formatting tags) rather than a narrow hand-picked list.
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      a: ['href', 'target', 'rel'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer', target: '_blank' }),
    },
  });
}
