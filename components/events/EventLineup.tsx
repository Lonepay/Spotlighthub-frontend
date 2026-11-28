'use client';

import { Star } from 'lucide-react';
import { EventGuest } from '@/lib/events';
import { storageUrl } from '@/lib/storage';

/** Featured guests / lineup on the public event page. */
export function EventLineup({ guests }: { guests?: EventGuest[] }) {
  if (!guests || guests.length === 0) return null;

  return (
    <section>
      <h2 className="text-2xl font-bold mb-4 flex items-center">
        <Star className="w-6 h-6 mr-2 text-primary-glow" />
        Lineup
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {guests.map((guest) => {
          const photo = storageUrl(guest.image);
          return (
            <div key={guest.id} className="rounded-2xl border border-border overflow-hidden bg-card">
              <div className="aspect-square bg-muted flex items-center justify-center">
                {photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photo} alt={guest.name} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <span className="text-4xl font-bold text-muted-foreground">{guest.name.charAt(0)}</span>
                )}
              </div>
              <div className="p-3">
                <p className="font-semibold text-foreground truncate">{guest.name}</p>
                {guest.role && <p className="text-xs text-muted-foreground truncate">{guest.role}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
