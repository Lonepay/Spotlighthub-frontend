'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Reveal, RevealGroup, RevealItem } from '@/components/Reveal';
import {
  ArrowRight,
  Calendar,
  MapPin,
  ShieldCheck,
  QrCode,
  Clock,
  Ticket,
  Film,
  Building2,
  MessageCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { events, Event, CategoryCount } from '@/lib/events';
import { storageUrl } from '@/lib/storage';
import { COMMUNITY_LINK } from '@/lib/constants';

const CATEGORY_ICONS = [Ticket, Film, MapPin, Calendar, Building2, ShieldCheck];
const CATEGORY_IMAGES = ['/images/feature-experience.jpg', '/images/feature-secure.jpg', '/images/feature-global.jpg'];

const VENUES = [
  { name: 'Eko Hotel & Suites', city: 'Lagos', capacity: '3,000 capacity' },
  { name: 'International Conference Centre', city: 'Abuja', capacity: '6,000 capacity' },
];

function formatNaira(value: number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(value);
}

export default function Home() {
  const [trendingEvents, setTrendingEvents] = useState<Event[]>([]);
  const [pastEvents, setPastEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<CategoryCount[]>([]);

  useEffect(() => {
    events.getAll({ page: 1, sort: 'trending' }).then((data) => {
      setTrendingEvents(data.data?.slice(0, 8) || []);
      setLoading(false);
    }).catch(() => setLoading(false));

    events.getAll({ page: 1, when: 'past' }).then((data) => {
      setPastEvents(data.data?.slice(0, 4) || []);
    }).catch(() => {});

    events.getCategories().then((data) => setCategories(data.slice(0, 6))).catch(() => setCategories([]));
  }, []);

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden min-h-[85vh] flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <Image src="/images/hero-bg.jpg" alt="" fill className="object-cover" priority />
          <div className="absolute inset-0 bg-background/70" />
          <div className="absolute inset-0 bg-gradient-hero" />
        </div>

        <Reveal className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-xs uppercase tracking-widest text-primary-glow mb-6">
            Over 500,000 tickets sold this year
          </div>
          <h1 className="text-5xl sm:text-7xl font-display font-bold mb-6 text-foreground tracking-tight">
            Every night out.
            <span className="block text-gradient">One ticket away.</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            Book events, movies, and visit-worthy locations across Nigeria — secure checkout, instant tickets.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild variant="hero" size="lg">
              <Link href="/events">
                Explore events <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button asChild variant="glass" size="lg">
              <Link href="/organizers">For organizers</Link>
            </Button>
          </div>
          <a
            href={COMMUNITY_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-6 text-sm text-muted-foreground hover:text-primary-glow transition-colors"
          >
            <MessageCircle className="w-4 h-4" /> Join our community on WhatsApp
          </a>
        </Reveal>
      </section>

      {/* Key features */}
      <section className="py-16">
        <RevealGroup className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-3 gap-8">
          {[
            { icon: ShieldCheck, title: 'Secure checkout', desc: 'Bank-level encryption on every transaction.' },
            { icon: QrCode, title: 'Instant tickets', desc: 'Your ticket is ready the moment payment clears.' },
            { icon: Clock, title: 'Flexible cancellation', desc: "Cancel up to 24 hours before an event." },
          ].map((f) => (
            <RevealItem key={f.title} className="glass rounded-2xl p-6 flex items-start gap-4 transition-transform duration-300 hover:-translate-y-1 hover:shadow-glow-sm">
              <div className="w-12 h-12 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center">
                <f.icon className="w-6 h-6 text-primary-glow" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg mb-1">{f.title}</h3>
                <p className="text-muted-foreground text-sm">{f.desc}</p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </section>

      {/* Browse by category */}
      {categories.length > 0 && (
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Reveal className="flex justify-between items-center mb-12">
              <div>
                <h2 className="text-4xl font-bold mb-2">Browse by category</h2>
                <p className="text-lg text-muted-foreground">Everything worth going out for, in one place</p>
              </div>
              <Button asChild variant="outline" className="hidden sm:inline-flex">
                <Link href="/events">
                  See all events <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
            </Reveal>
            <RevealGroup className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
              {categories.map((cat, i) => {
                const Icon = CATEGORY_ICONS[i % CATEGORY_ICONS.length];
                return (
                  <RevealItem key={cat.category}>
                    <Link
                      href={`/events?category=${encodeURIComponent(cat.category)}`}
                      className="group relative h-72 rounded-2xl overflow-hidden shadow-card block transition-transform duration-300 hover:-translate-y-1 hover:shadow-glow-sm"
                    >
                      <Image
                        src={CATEGORY_IMAGES[i % CATEGORY_IMAGES.length]}
                        alt={cat.category}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-6">
                        <Icon className="w-8 h-8 text-primary-glow mb-2" />
                        <h3 className="font-display font-bold text-2xl text-foreground mb-1">{cat.category}</h3>
                        <p className="text-muted-foreground text-sm">{cat.event_count} event{cat.event_count === 1 ? '' : 's'}</p>
                      </div>
                    </Link>
                  </RevealItem>
                );
              })}
            </RevealGroup>
          </div>
        </section>
      )}

      {/* Featured / trending */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-4xl font-bold mb-2">Trending now</h2>
              <p className="text-lg text-muted-foreground">Ranked by ticket sales — the events everyone's going to</p>
            </div>
            <Button asChild variant="outline" className="hidden sm:inline-flex">
              <Link href="/events">
                See all events <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
          </Reveal>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[2/3] bg-muted rounded-xl mb-4" />
                  <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : trendingEvents.length > 0 ? (
            <RevealGroup className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {trendingEvents.map((event) => (
                <RevealItem key={event.id}>
                <Link href={`/events/${event.id}`} className="group relative block">
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
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-70" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <span className="inline-block px-2 py-1 mb-2 text-xs font-bold text-white bg-primary/80 backdrop-blur-sm rounded-md">
                        {event.category}
                      </span>
                      <h3 className="text-lg font-bold text-white leading-tight mb-1 line-clamp-2">{event.title}</h3>
                      <div className="flex items-center text-white/80 text-xs space-x-2 mb-1">
                        <span>{new Date(event.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                        <span>&middot;</span>
                        <span>{event.venue}</span>
                      </div>
                      <span className="text-white font-bold text-sm">
                        {event.price === 0 ? 'Free' : `From ${formatNaira(event.price)}`}
                      </span>
                    </div>
                  </div>
                </Link>
                </RevealItem>
              ))}
            </RevealGroup>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">No upcoming events yet. Check back soon!</p>
            </div>
          )}
        </div>
      </section>

      {/* Past events */}
      {pastEvents.length > 0 && (
        <section className="py-20 bg-muted/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Reveal className="flex justify-between items-center mb-12">
              <div>
                <h2 className="text-4xl font-bold mb-2">Past events</h2>
                <p className="text-lg text-muted-foreground">A look back at what already happened</p>
              </div>
              <Button asChild variant="outline" className="hidden sm:inline-flex">
                <Link href="/events?when=past">
                  See all past events <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
            </Reveal>

            <RevealGroup className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {pastEvents.map((event) => (
                <RevealItem key={event.id}>
                  <Link href={`/events/${event.id}`} className="group relative block opacity-80 hover:opacity-100 transition-opacity">
                    <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-muted shadow-card grayscale-[40%] group-hover:grayscale-0 transition-all duration-300">
                      {event.image ? (
                        <Image src={storageUrl(event.image)!} alt={event.title} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-primary p-6 flex items-center justify-center text-center">
                          <span className="text-xl font-bold text-white/50">{event.title}</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-70" />
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <span className="inline-block px-2 py-1 mb-2 text-xs font-bold text-white bg-secondary/80 backdrop-blur-sm rounded-md">
                          Ended
                        </span>
                        <h3 className="text-lg font-bold text-white leading-tight mb-1 line-clamp-2">{event.title}</h3>
                        <span className="text-white/70 text-xs">
                          {new Date(event.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </Link>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </section>
      )}

      {/* Smart event planning */}
      <section className="py-20">
        <Reveal className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="text-xs uppercase tracking-widest text-primary-glow mb-3">Smart event planning</div>
            <h2 className="text-4xl font-bold mb-6">Plan your night in minutes</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Pick a date, browse nearby venues, and lock in your tickets — all in one place.
            </p>
            <div className="space-y-4">
              {VENUES.map((v) => (
                <div key={v.name} className="glass rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-primary-glow" />
                    <div>
                      <p className="font-semibold">{v.name}</p>
                      <p className="text-sm text-muted-foreground">{v.city}</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{v.capacity}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="relative h-[420px] rounded-3xl overflow-hidden shadow-elevated">
            <Image src="/images/how-it-works.jpg" alt="" fill className="object-cover" />
            <div className="absolute inset-0 bg-black/20" />
          </div>
        </Reveal>
      </section>

      {/* Organizer promotion */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero" />
        <Reveal className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl sm:text-5xl font-bold mb-6">Selling tickets? We've got you.</h2>
          <p className="text-lg sm:text-xl text-muted-foreground mb-10">
            Real-time sales tracking, fast payouts, and a dashboard built for event organizers.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild variant="hero" size="lg">
              <Link href="/register">
                Start selling <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/organizers">Learn more</Link>
            </Button>
          </div>
        </Reveal>
      </section>

      <Footer />
    </div>
  );
}
