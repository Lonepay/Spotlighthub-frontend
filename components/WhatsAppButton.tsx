'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

const WHATSAPP_NUMBER = '2348132209554';
const DEFAULT_MESSAGE = "Hi Spotlighticket, I need some help.";

export function WhatsAppButton() {
  const pathname = usePathname();
  const [hidden, setHidden] = useState(false);
  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(DEFAULT_MESSAGE)}`;

  // Pages can opt a scrollable region out of bubble overlap by giving it
  // id="ticket-type-list" (currently just the event page's ticket steppers)
  // instead of that region reserving permanent padding for the bubble.
  // Re-run on route change since this component lives in the root layout
  // and never remounts across client-side navigations.
  useEffect(() => {
    setHidden(false);
    const target = document.getElementById('ticket-type-list');
    if (!target) return;
    const observer = new IntersectionObserver(([entry]) => setHidden(entry.isIntersecting));
    observer.observe(target);
    return () => observer.disconnect();
  }, [pathname]);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      title="Chat with us on WhatsApp"
      // The event detail page has its own fixed bottom CTA bar on mobile
      // (lg:hidden) — bottom-5 here would sit right on top of its "Get
      // Tickets" button. Lifted clear of it on small screens; back to the
      // corner on lg+ where that bar doesn't exist.
      className={`fixed bottom-24 lg:bottom-5 right-5 z-40 flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] text-white shadow-elevated hover:scale-105 active:scale-95 transition-all ${hidden ? 'opacity-0 scale-75 pointer-events-none' : 'opacity-100'}`}
    >
      <svg viewBox="0 0 32 32" width="28" height="28" fill="currentColor" aria-hidden="true">
        <path d="M16.004 3C9.377 3 4 8.373 4 15c0 2.362.687 4.564 1.872 6.417L4 29l7.77-1.84A11.94 11.94 0 0 0 16.004 27C22.63 27 28 21.627 28 15S22.63 3 16.004 3Zm0 21.818c-1.94 0-3.75-.55-5.29-1.5l-.38-.226-4.61 1.092 1.116-4.49-.248-.393A9.77 9.77 0 0 1 5.182 15c0-5.968 4.854-10.818 10.822-10.818S26.818 9.032 26.818 15 21.972 24.818 16.004 24.818Zm5.96-8.14c-.326-.163-1.93-.953-2.23-1.062-.298-.109-.516-.163-.734.163-.217.326-.842 1.062-1.032 1.28-.19.217-.38.245-.706.082-.326-.163-1.377-.508-2.623-1.618-.97-.865-1.624-1.933-1.814-2.26-.19-.326-.02-.503.143-.665.146-.146.326-.38.49-.57.163-.19.217-.326.326-.543.109-.217.054-.407-.027-.57-.082-.163-.734-1.77-1.006-2.424-.265-.638-.535-.552-.734-.562l-.626-.011c-.217 0-.57.082-.868.407-.298.326-1.136 1.11-1.136 2.707s1.163 3.14 1.325 3.357c.163.217 2.288 3.494 5.543 4.9.774.334 1.378.534 1.848.683.776.247 1.483.212 2.042.129.623-.093 1.93-.789 2.202-1.55.272-.762.272-1.415.19-1.55-.08-.136-.298-.217-.624-.38Z" />
      </svg>
    </a>
  );
}
