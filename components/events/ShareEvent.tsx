'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Check, Copy, Share2 } from 'lucide-react';
import { eventUrl } from '@/lib/eventLink';

/**
 * Copy / WhatsApp / native share for an event's public link. The link
 * carries the event name and its preview shows the event's own image.
 */
export function ShareEvent({ event, compact = false }: { event: { id: number; title: string }; compact?: boolean }) {
  const [copied, setCopied] = useState(false);
  const url = eventUrl(event);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link copied');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy - select the link and copy it manually');
    }
  };

  const nativeShare = async () => {
    try {
      await navigator.share({ title: event.title, url });
    } catch {
      // user cancelled - nothing to do
    }
  };

  const whatsapp = `https://wa.me/?text=${encodeURIComponent(`${event.title} ${url}`)}`;
  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  return (
    <div className="space-y-2">
      {!compact && (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
          <input
            readOnly
            value={url}
            onFocus={(e) => e.currentTarget.select()}
            className="flex-1 min-w-0 bg-transparent text-sm font-mono outline-none"
            aria-label="Event link"
          />
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={copy}>
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} {copied ? 'Copied' : 'Copy link'}
        </Button>
        <Button type="button" variant="outline" size="sm" asChild>
          <a href={whatsapp} target="_blank" rel="noopener noreferrer">WhatsApp</a>
        </Button>
        {canNativeShare && (
          <Button type="button" variant="outline" size="sm" onClick={nativeShare}>
            <Share2 className="w-4 h-4" /> Share
          </Button>
        )}
      </div>
    </div>
  );
}
