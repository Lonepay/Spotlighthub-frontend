'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { events, Event } from '@/lib/events';
import { storageUrl } from '@/lib/storage';
import { Search } from 'lucide-react';

export default function EventsPage() {
  const [eventsList, setEventsList] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<any>(null);

  const formatNaira = (value: number) =>
    new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0,
    }).format(value);

  useEffect(() => {
    loadEvents();
  }, [search, category, page]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const params: any = { page };
      if (search.trim()) {
        params.search = search.trim();
      }
      if (category) {
        params.category = category;
      }

      const data = await events.getAll(params);
      setEventsList(data.data || []);
      setMeta(data.meta);
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Romance', 'Documentary', 'Other'];

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-10">
          <div className="text-xs uppercase tracking-widest text-primary-glow mb-2">Explore</div>
          <h1 className="text-4xl font-bold mb-3">Find your next night out</h1>
          <p className="text-lg text-muted-foreground">Events, movies, and locations — all in one place</p>
        </div>

        {/* Search and Filters */}
        <div className="mb-10 space-y-4">
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search events, movies, locations…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-12"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setCategory('');
                setPage(1);
              }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                category === ''
                  ? 'bg-gradient-primary text-primary-foreground shadow-glow-sm'
                  : 'glass text-muted-foreground hover:text-foreground'
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setCategory(cat);
                  setPage(1);
                }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  category === cat
                    ? 'bg-gradient-primary text-primary-foreground shadow-glow-sm'
                    : 'glass text-muted-foreground hover:text-foreground'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[2/3] bg-muted rounded-xl mb-4" />
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : eventsList.length > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {eventsList.map((event) => (
                <Link key={event.id} href={`/events/${event.id}`} className="group relative block">
                  <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-muted shadow-card transition-all duration-300 group-hover:shadow-glow-sm group-hover:scale-[1.02]">
                    {event.image ? (
                      <Image
                        src={storageUrl(event.image)!}
                        alt={event.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-primary p-6 flex items-center justify-center text-center">
                        <span className="text-xl font-bold text-white/50">{event.title}</span>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                    <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                      <span className="inline-block px-2 py-1 mb-2 text-xs font-bold text-white bg-primary/80 backdrop-blur-sm rounded-md">
                        {event.category}
                      </span>
                      <h3 className="text-lg font-bold text-white leading-tight mb-1 line-clamp-2">
                        {event.title}
                      </h3>
                      <div className="flex items-center text-white/80 text-xs space-x-2">
                        <span>{new Date(event.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                        {event.time && (
                          <>
                            <span>&middot;</span>
                            <span>{event.time}</span>
                          </>
                        )}
                      </div>
                      <div className="mt-3 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <span className="text-white font-bold">{event.price === 0 ? 'Free' : formatNaira(event.price)}</span>
                        <span className="text-xs text-white/80 underline">Get Tickets</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {meta && meta.last_page > 1 && (
              <div className="mt-12 flex justify-center items-center space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="px-4 text-muted-foreground text-sm">
                  Page {page} of {meta.last_page}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setPage(page + 1)}
                  disabled={page === meta.last_page}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">No events found. Try adjusting your search.</p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
