'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { movies, Movie, MovieShowtime } from '@/lib/movies';
import { storageUrl } from '@/lib/storage';
import { Clapperboard, MapPin, Calendar, Clock, Ticket, Popcorn } from 'lucide-react';
import { toast } from 'sonner';

export default function MovieDetailPage() {
  const params = useParams();
  const movieId = Number(params.id);
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedShowtime, setSelectedShowtime] = useState<MovieShowtime | null>(null);

  useEffect(() => {
    movies.getPublicOne(movieId)
      .then((data) => {
        setMovie(data);
        const upcoming = (data.showtimes || []).filter((s) => new Date(s.date) >= new Date(new Date().toDateString()));
        setSelectedShowtime(upcoming[0] || data.showtimes?.[0] || null);
      })
      .catch((error) => console.error('Failed to load movie:', error))
      .finally(() => setLoading(false));
  }, [movieId]);

  const formatNaira = (value: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(value);

  const handleBuy = () => {
    toast.info("Ticket purchase for movies is launching soon — check back shortly!");
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

  if (!movie) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 py-24 text-center">
          <p className="text-muted-foreground text-lg">Movie not found.</p>
        </div>
        <Footer />
      </div>
    );
  }

  const poster = storageUrl(movie.poster);
  const tiers = movie.ticket_tiers || [];
  const addons = (movie.addons || []).filter((a) => a.is_available);
  const showtimes = movie.showtimes || [];

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-[320px_1fr] gap-10">
          <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-muted shadow-elevated">
            {poster ? (
              <Image src={poster} alt={movie.title} fill className="object-cover" priority />
            ) : (
              <div className="w-full h-full bg-gradient-primary flex items-center justify-center">
                <Clapperboard className="w-16 h-16 text-white/50" />
              </div>
            )}
          </div>

          <div>
            <div className="text-xs uppercase tracking-widest text-primary-glow mb-2 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> {movie.city}
            </div>
            <h1 className="text-4xl font-bold mb-2">{movie.title}</h1>
            {movie.tagline && <p className="text-lg text-muted-foreground mb-6">{movie.tagline}</p>}
            {movie.description && <p className="text-muted-foreground mb-8 whitespace-pre-line">{movie.description}</p>}

            <section className="mb-8">
              <h2 className="font-display font-semibold text-lg mb-4 flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /> Showtimes</h2>
              {showtimes.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {showtimes.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedShowtime(s)}
                      className={`px-4 py-3 rounded-xl border-2 text-left text-sm transition-colors ${selectedShowtime?.id === s.id ? 'border-primary bg-primary/5' : 'border-border'}`}
                    >
                      <div className="flex items-center gap-1.5 font-medium">
                        <Calendar className="w-3.5 h-3.5" /> {new Date(s.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                      </div>
                      <div className="text-muted-foreground mt-0.5">{s.time} &middot; {s.hall_name}</div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No showtimes scheduled yet.</p>
              )}
            </section>

            {tiers.length > 0 && (
              <section className="mb-8">
                <h2 className="font-display font-semibold text-lg mb-4 flex items-center gap-2"><Ticket className="w-4 h-4 text-primary" /> Ticket tiers</h2>
                <div className="space-y-2">
                  {tiers.map((t) => (
                    <div key={t.id} className="flex items-center justify-between p-3 rounded-xl border border-border">
                      <div>
                        <p className="font-medium text-sm">{t.name}</p>
                        {t.description && <p className="text-xs text-muted-foreground">{t.description}</p>}
                      </div>
                      <span className="font-semibold">{t.price === 0 ? 'Free' : formatNaira(t.price)}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {addons.length > 0 && (
              <section className="mb-8">
                <h2 className="font-display font-semibold text-lg mb-4 flex items-center gap-2"><Popcorn className="w-4 h-4 text-primary" /> Snacks & drinks</h2>
                <div className="grid sm:grid-cols-2 gap-2">
                  {addons.map((a) => (
                    <div key={a.id} className="flex items-center justify-between p-3 rounded-xl border border-border">
                      <span className="text-sm">{a.name} <span className="text-xs text-muted-foreground capitalize">({a.type})</span></span>
                      <span className="font-semibold text-sm">{a.price === 0 ? 'Free' : formatNaira(a.price)}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <Button variant="hero" size="lg" onClick={handleBuy} disabled={!selectedShowtime}>
              <Ticket className="w-4 h-4" /> Buy tickets
            </Button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
