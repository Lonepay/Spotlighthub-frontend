'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { venues, Venue } from '@/lib/venues';
import { storageUrl } from '@/lib/storage';
import { Search, Building2 } from 'lucide-react';

export default function VenuesPage() {
  return (
    <Suspense fallback={null}>
      <VenuesPageInner />
    </Suspense>
  );
}

function VenuesPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [list, setList] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [city, setCity] = useState(searchParams.get('city') || '');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<{ current_page: number; last_page: number } | null>(null);

  useEffect(() => {
    load();
  }, [search, city, page]);

  const load = async () => {
    setLoading(true);
    try {
      const params: { page: number; search?: string; city?: string } = { page };
      if (search.trim()) params.search = search.trim();
      if (city) params.city = city;

      const data = await venues.getPublicAll(params);
      setList(data.data || []);
      setMeta({ current_page: data.current_page, last_page: data.last_page });
    } catch (error) {
      console.error('Failed to load venues:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectCity = (c: string) => {
    setCity(c);
    setPage(1);
    router.replace(c ? `/venues?city=${encodeURIComponent(c)}` : '/venues');
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-10">
          <div className="text-xs uppercase tracking-widest text-primary-glow mb-2">Venues</div>
          <h1 className="text-4xl font-bold mb-3">Book a space</h1>
          <p className="text-lg text-muted-foreground">Halls and locations you can rent by the day</p>
        </div>

        <div className="mb-10 space-y-4">
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search venues…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-12"
            />
          </div>

          {city && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => selectCity('')}
                className="px-4 py-2 rounded-full text-sm font-medium bg-gradient-primary text-primary-foreground shadow-glow-sm"
              >
                {city} &times;
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[16/10] bg-muted rounded-xl mb-4" />
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : list.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {list.map((venue) => {
                const cover = storageUrl(venue.cover_image);
                return (
                  <Link key={venue.id} href={`/venues/${venue.id}`} className="group relative block">
                    <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-muted shadow-card transition-all duration-300 group-hover:shadow-glow-sm group-hover:scale-[1.02]">
                      {cover ? (
                        <Image src={cover} alt={venue.name} fill className="object-cover transition-transform duration-500 group-hover:scale-110" />
                      ) : (
                        <div className="w-full h-full bg-gradient-primary p-6 flex items-center justify-center text-center">
                          <Building2 className="w-10 h-10 text-white/50" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                      <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                        <span className="inline-block px-2 py-1 mb-2 text-xs font-bold text-white bg-primary/80 backdrop-blur-sm rounded-md">
                          {venue.city}
                        </span>
                        <h3 className="text-lg font-bold text-white leading-tight mb-1 line-clamp-2">{venue.name}</h3>
                        {venue.tagline && <p className="text-white/80 text-xs line-clamp-1">{venue.tagline}</p>}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {meta && meta.last_page > 1 && (
              <div className="mt-12 flex justify-center items-center space-x-2">
                <Button variant="outline" onClick={() => setPage(page - 1)} disabled={page === 1}>Previous</Button>
                <span className="px-4 text-muted-foreground text-sm">Page {page} of {meta.last_page}</span>
                <Button variant="outline" onClick={() => setPage(page + 1)} disabled={page === meta.last_page}>Next</Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">No venues available right now. Check back soon.</p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
