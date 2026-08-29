'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { venues, Venue } from '@/lib/venues';
import { storageUrl } from '@/lib/storage';
import { Building2, MapPin, Calendar, Clock, BookText } from 'lucide-react';
import { toast } from 'sonner';

export default function VenueDetailPage() {
  const params = useParams();
  const venueId = Number(params.id);
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTierId, setSelectedTierId] = useState<number | null>(null);

  useEffect(() => {
    venues.getPublicOne(venueId)
      .then((data) => {
        setVenue(data);
        setSelectedTierId(data.pricing_tiers?.[0]?.id ?? null);
      })
      .catch((error) => console.error('Failed to load venue:', error))
      .finally(() => setLoading(false));
  }, [venueId]);

  const formatNaira = (value: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(value);

  const handleBook = () => {
    toast.info('Venue booking is launching soon — check back shortly!');
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 py-24 animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-96 bg-muted rounded-xl" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 py-24 text-center">
          <p className="text-muted-foreground text-lg">Venue not found.</p>
        </div>
        <Footer />
      </div>
    );
  }

  const cover = storageUrl(venue.cover_image);
  const tiers = venue.pricing_tiers || [];

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="relative aspect-[16/7] rounded-2xl overflow-hidden bg-muted shadow-elevated mb-10">
          {cover ? (
            <Image src={cover} alt={venue.name} fill className="object-cover" priority />
          ) : (
            <div className="w-full h-full bg-gradient-primary flex items-center justify-center">
              <Building2 className="w-16 h-16 text-white/50" />
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-[1fr_320px] gap-10">
          <div>
            <div className="text-xs uppercase tracking-widest text-primary-glow mb-2 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> {venue.location ? `${venue.location}, ` : ''}{venue.city}
            </div>
            <h1 className="text-4xl font-bold mb-2">{venue.name}</h1>
            {venue.tagline && <p className="text-lg text-muted-foreground mb-6">{venue.tagline}</p>}
            {venue.description && <p className="text-muted-foreground whitespace-pre-line">{venue.description}</p>}

            <section className="mt-8 grid sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-border">
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> Available</p>
                <p className="font-medium text-sm">
                  {venue.available_from ? new Date(venue.available_from).toLocaleDateString() : 'Any date'}
                  {venue.available_to ? ` – ${new Date(venue.available_to).toLocaleDateString()}` : ''}
                </p>
              </div>
              <div className="p-4 rounded-xl border border-border">
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1 flex items-center gap-1"><Clock className="w-3 h-3" /> Daily hours</p>
                <p className="font-medium text-sm">
                  {venue.daily_open_time && venue.daily_close_time ? `${venue.daily_open_time} – ${venue.daily_close_time}` : 'Not specified'}
                </p>
              </div>
            </section>
          </div>

          <div className="p-6 rounded-2xl border border-border glass h-fit">
            <h2 className="font-display font-semibold text-lg mb-4 flex items-center gap-2"><BookText className="w-4 h-4 text-primary" /> Pricing tiers</h2>
            {tiers.length > 0 ? (
              <div className="space-y-2 mb-6">
                {tiers.map((t) => (
                  <label key={t.id} className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-colors ${selectedTierId === t.id ? 'border-primary bg-primary/5' : 'border-border'}`}>
                    <div className="flex items-center gap-2">
                      <input type="radio" name="tier" checked={selectedTierId === t.id} onChange={() => setSelectedTierId(t.id)} />
                      <div>
                        <p className="font-medium text-sm">{t.name}</p>
                        {t.description && <p className="text-xs text-muted-foreground">{t.description}</p>}
                      </div>
                    </div>
                    <span className="font-semibold text-sm">{t.price === 0 ? 'Free' : formatNaira(t.price)}</span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm mb-6">No pricing tiers set yet.</p>
            )}
            <Button variant="hero" size="lg" className="w-full" onClick={handleBook} disabled={!selectedTierId}>
              Book this venue
            </Button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
