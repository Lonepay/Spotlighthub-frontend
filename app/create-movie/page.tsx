'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { useAuth } from '@/components/AuthProvider';
import { movies } from '@/lib/movies';
import type { SeatMapValue } from '@/lib/movies';
import { SeatMapBuilder } from '@/components/SeatMapBuilder';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Clock, Upload, ArrowRight, Loader2, Info, FileText, Ticket, Image as ImageIcon, Trash2, Plus, X, Popcorn, Building } from 'lucide-react';
import { NairaSign } from '@/components/icons/NairaSign';

const CITY_PRESETS = ['Lagos', 'Abuja', 'Port Harcourt', 'Ibadan', 'Kano', 'Enugu', 'Benin City', 'Kaduna', 'Owerri', 'Uyo', 'Calabar', 'Abeokuta'];
const MOVIE_TIER_PRESETS = ['Regular', 'VIP', 'Premium', 'Recliner'];

interface ShowtimeDraft {
  date: string;
  time: string;
  hall_name: string;
  capacity: string;
  seat_map: SeatMapValue;
}

interface AddonDraft {
  name: string;
  type: 'snack' | 'drink';
  price: string;
}

interface TierDraft {
  name: string;
  price: string;
  quantity: string;
  description: string;
}

function SectionHeader({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle: string }) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div className="w-9 h-9 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div>
        <h2 className="font-display font-semibold text-lg">{title}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}

const emptyShowtime = (): ShowtimeDraft => ({ date: '', time: '', hall_name: '', capacity: '', seat_map: { rows: [] } });
const emptyAddon = (): AddonDraft => ({ name: '', type: 'snack', price: '' });
const emptyTier = (): TierDraft => ({ name: '', price: '', quantity: '', description: '' });

export default function CreateMoviePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [city, setCity] = useState('');
  const [customCity, setCustomCity] = useState(false);
  const [poster, setPoster] = useState<File | null>(null);
  const [feePayer, setFeePayer] = useState<'organizer' | 'attendee'>('organizer');

  const [showtimes, setShowtimes] = useState<ShowtimeDraft[]>([]);
  const [showShowtimeForm, setShowShowtimeForm] = useState(false);
  const [showtimeDraft, setShowtimeDraft] = useState<ShowtimeDraft>(emptyShowtime());
  const [showtimeError, setShowtimeError] = useState('');

  const [addons, setAddons] = useState<AddonDraft[]>([]);
  const [showAddonForm, setShowAddonForm] = useState(false);
  const [addonDraft, setAddonDraft] = useState<AddonDraft>(emptyAddon());
  const [addonError, setAddonError] = useState('');

  const [tiers, setTiers] = useState<TierDraft[]>([]);
  const [showTierForm, setShowTierForm] = useState(false);
  const [tierDraft, setTierDraft] = useState<TierDraft>(emptyTier());
  const [tierError, setTierError] = useState('');

  if (typeof window !== 'undefined' && !user) {
    router.push('/login');
    return null;
  }

  const handleAddShowtime = () => {
    setShowtimeError('');
    if (!showtimeDraft.date) { setShowtimeError('Pick a date for this showtime.'); return; }
    if (!showtimeDraft.time) { setShowtimeError('Pick a time for this showtime.'); return; }
    if (!showtimeDraft.hall_name.trim()) { setShowtimeError('Name the screen/hall, e.g. "Screen 1".'); return; }
    const cap = Number(showtimeDraft.capacity);
    if (!cap || cap < 1) { setShowtimeError('Enter the seating capacity (at least 1).'); return; }
    setShowtimes([...showtimes, showtimeDraft]);
    setShowtimeDraft(emptyShowtime());
    setShowShowtimeForm(false);
  };

  const removeShowtime = (index: number) => setShowtimes(showtimes.filter((_, i) => i !== index));

  const handleAddAddon = () => {
    setAddonError('');
    if (!addonDraft.name.trim()) { setAddonError('Name the snack or drink.'); return; }
    const price = Number(addonDraft.price || 0);
    if (price < 0) { setAddonError("Price can't be negative — use 0 if it's free."); return; }
    setAddons([...addons, { ...addonDraft, price: String(price) }]);
    setAddonDraft(emptyAddon());
    setShowAddonForm(false);
  };

  const removeAddon = (index: number) => setAddons(addons.filter((_, i) => i !== index));

  const handleAddTier = () => {
    setTierError('');
    if (!tierDraft.name.trim()) { setTierError('Pick or type a ticket type name.'); return; }
    const qty = Number(tierDraft.quantity);
    if (!qty || qty < 1) { setTierError('Enter how many of this ticket type are available (at least 1).'); return; }
    const price = Number(tierDraft.price || 0);
    if (price < 0) { setTierError("Price can't be negative — use 0 for a free ticket type."); return; }
    setTiers([...tiers, { ...tierDraft, price: String(price), quantity: String(qty) }]);
    setTierDraft(emptyTier());
    setShowTierForm(false);
  };

  const removeTier = (index: number) => setTiers(tiers.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!poster) {
      setError('Upload a poster or cover image — it\'s required so buyers can see what they\'re booking.');
      window.scrollTo({ top: document.getElementById('poster-upload')?.offsetTop ?? 0, behavior: 'smooth' });
      return;
    }

    setLoading(true);
    try {
      const data = new FormData();
      data.append('title', title);
      data.append('tagline', tagline);
      data.append('city', city);
      data.append('poster', poster);
      data.append('fee_payer', feePayer);

      const movie = await movies.create(data);
      const failures: string[] = [];

      if (showtimes.length > 0) {
        const results = await Promise.allSettled(
          showtimes.map((s) =>
            movies.createShowtime(movie.id, {
              date: s.date,
              time: s.time,
              hall_name: s.hall_name,
              capacity: Number(s.capacity),
              seat_map: s.seat_map.rows.length > 0 ? s.seat_map : null,
            })
          )
        );
        const failed = results.filter((r) => r.status === 'rejected').length;
        if (failed > 0) failures.push(`${failed} of ${showtimes.length} showtime(s)`);
      }

      if (addons.length > 0) {
        const results = await Promise.allSettled(
          addons.map((a) => movies.createAddon(movie.id, { name: a.name, type: a.type, price: Number(a.price) }))
        );
        const failed = results.filter((r) => r.status === 'rejected').length;
        if (failed > 0) failures.push(`${failed} of ${addons.length} snack/drink option(s)`);
      }

      if (tiers.length > 0) {
        const results = await Promise.allSettled(
          tiers.map((t) => movies.createTier(movie.id, { name: t.name, description: t.description, price: Number(t.price), quantity: Number(t.quantity) }))
        );
        const failed = results.filter((r) => r.status === 'rejected').length;
        if (failed > 0) failures.push(`${failed} of ${tiers.length} ticket tier(s)`);
      }

      if (failures.length > 0) {
        alert(`Movie created, but ${failures.join(' and ')} failed to save. You can add them again from this page.`);
      }

      router.push(`/organizer/movies/${movie.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create movie');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardShell title="Create Movie" description="Set up showtimes, seating, snacks, and ticket tiers">
      <Card className="max-w-3xl shadow-none">
        <CardContent className="p-6 sm:p-8">
          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic info */}
            <section className="pb-8 border-b border-border">
              <SectionHeader icon={FileText} title="Basic info" subtitle="What's showing, and where." />
              <div className="space-y-6">
                <div>
                  <Label htmlFor="movie-title">Movie title *</Label>
                  <Input id="movie-title" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="The Great Adventure" />
                </div>
                <div>
                  <Label htmlFor="movie-tagline">Tagline</Label>
                  <Input id="movie-tagline" value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="One line that sells the movie" />
                </div>
                <div>
                  <Label htmlFor="movie-city">City *</Label>
                  {customCity ? (
                    <div className="flex gap-2">
                      <Input id="movie-city" required autoFocus value={city} onChange={(e) => setCity(e.target.value)} placeholder="Type your city" />
                      <Button type="button" variant="outline" onClick={() => { setCustomCity(false); setCity(''); }}>List</Button>
                    </div>
                  ) : (
                    <select
                      id="movie-city"
                      required
                      value={city}
                      onChange={(e) => {
                        if (e.target.value === '__custom__') { setCustomCity(true); setCity(''); }
                        else setCity(e.target.value);
                      }}
                      className="w-full h-11 rounded-xl border border-input bg-background/50 px-4 text-sm"
                    >
                      <option value="">Select city</option>
                      {CITY_PRESETS.map((c) => <option key={c} value={c}>{c}</option>)}
                      <option value="__custom__">Other (type your own)…</option>
                    </select>
                  )}
                </div>
              </div>
            </section>

            {/* Poster */}
            <section className="pb-8 border-b border-border">
              <SectionHeader icon={ImageIcon} title="Poster / cover image *" subtitle="Shown on the movie card and detail page — required." />
              <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${poster ? 'border-primary/50' : 'border-destructive/40 hover:border-destructive/60'}`}>
                <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
                <input type="file" accept="image/*" required onChange={(e) => { setPoster(e.target.files?.[0] || null); setError(''); }} className="hidden" id="poster-upload" />
                <label htmlFor="poster-upload" className="cursor-pointer text-primary font-semibold hover:underline">
                  {poster ? poster.name : 'Click to upload poster (required)'}
                </label>
                <p className="text-xs text-muted-foreground mt-2">PNG or JPG, portrait works best. Up to 30MB.</p>
              </div>
            </section>

            {/* Fee payer */}
            <section className="pb-8 border-b border-border">
              <SectionHeader icon={NairaSign} title="Platform fee" subtitle="Who covers Spotlighticket's fee on paid tickets." />
              <div>
                <Label>Who covers the platform fee?</Label>
                <p className="text-xs text-muted-foreground mb-2">Only applies to paid tiers — free tickets are never charged.</p>
                <div className="grid md:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFeePayer('organizer')}
                    className={`rounded-xl border-2 px-4 py-3 text-sm font-medium text-left transition-colors ${feePayer === 'organizer' ? 'border-primary bg-primary/5' : 'border-border'}`}
                  >
                    You (the organizer)
                    <p className="text-xs text-muted-foreground font-normal mt-0.5">Deducted from your payout. Buyers pay exactly the price you set.</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeePayer('attendee')}
                    className={`rounded-xl border-2 px-4 py-3 text-sm font-medium text-left transition-colors ${feePayer === 'attendee' ? 'border-primary bg-primary/5' : 'border-border'}`}
                  >
                    Buyers
                    <p className="text-xs text-muted-foreground font-normal mt-0.5">Added on top at checkout. You receive the full price you set.</p>
                  </button>
                </div>
              </div>
            </section>

            {/* Showtimes */}
            <section className="pb-8 border-b border-border">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
                <SectionHeader icon={Clock} title="Showtimes" subtitle="Add each date, time, and screen/hall — build the seat map for each one right here." />
                <Button type="button" size="sm" variant="outline" onClick={() => { setShowtimeDraft(emptyShowtime()); setShowShowtimeForm(!showShowtimeForm); }}>
                  <Plus className="w-4 h-4" /> Add showtime
                </Button>
              </div>

              {showtimes.length > 0 && (
                <div className="space-y-2 mb-4">
                  {showtimes.map((s, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border bg-muted/30">
                      <div className="min-w-0">
                        <p className="font-medium text-sm">{s.hall_name} &middot; {s.date} {s.time}</p>
                        <p className="text-xs text-muted-foreground">
                          {s.capacity} seats{s.seat_map.rows.length > 0 ? ' · seat map set' : ' · no seat map yet'}
                        </p>
                      </div>
                      <button type="button" onClick={() => removeShowtime(i)} className="shrink-0 text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {showShowtimeForm && (
                <div className="p-5 rounded-xl border border-primary/30 bg-muted/30 space-y-4">
                  {showtimeError && (
                    <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-sm">{showtimeError}</div>
                  )}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="showtime-date">Date *</Label>
                      <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input id="showtime-date" type="date" min={new Date().toISOString().split('T')[0]} value={showtimeDraft.date} onChange={(e) => setShowtimeDraft({ ...showtimeDraft, date: e.target.value })} className="pl-12" />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="showtime-time">Time *</Label>
                      <Input id="showtime-time" type="time" value={showtimeDraft.time} onChange={(e) => setShowtimeDraft({ ...showtimeDraft, time: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="showtime-hall">Screen / hall *</Label>
                      <div className="relative">
                        <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input id="showtime-hall" placeholder="Screen 1" value={showtimeDraft.hall_name} onChange={(e) => setShowtimeDraft({ ...showtimeDraft, hall_name: e.target.value })} className="pl-10" />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="showtime-capacity">Capacity *</Label>
                      <Input id="showtime-capacity" type="number" min="1" placeholder="e.g. 80" value={showtimeDraft.capacity} onChange={(e) => setShowtimeDraft({ ...showtimeDraft, capacity: e.target.value })} />
                    </div>
                  </div>

                  <div>
                    <Label>Seat arrangement</Label>
                    <div className="mt-1.5">
                      <SeatMapBuilder
                        capacity={Number(showtimeDraft.capacity) || 0}
                        tierPresets={MOVIE_TIER_PRESETS}
                        value={showtimeDraft.seat_map}
                        onChange={(seat_map) => setShowtimeDraft({ ...showtimeDraft, seat_map })}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => { setShowShowtimeForm(false); setShowtimeDraft(emptyShowtime()); }}>
                      <X className="w-4 h-4" /> Cancel
                    </Button>
                    <Button type="button" onClick={handleAddShowtime}>Add showtime</Button>
                  </div>
                </div>
              )}

              {showtimes.length === 0 && !showShowtimeForm && (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 shrink-0" /> Add at least one showtime so buyers have something to book.
                </p>
              )}
            </section>

            {/* Snacks & Drinks */}
            <section className="pb-8 border-b border-border">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
                <SectionHeader icon={Popcorn} title="Snacks & drinks (optional)" subtitle="Add-ons buyers can pick up alongside their ticket." />
                <Button type="button" size="sm" variant="outline" onClick={() => { setAddonDraft(emptyAddon()); setShowAddonForm(!showAddonForm); }}>
                  <Plus className="w-4 h-4" /> Add snack/drink
                </Button>
              </div>

              {addons.length > 0 && (
                <div className="space-y-2 mb-4">
                  {addons.map((a, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border bg-muted/30">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{a.name} <span className="text-xs text-muted-foreground capitalize">({a.type})</span></p>
                        <p className="text-xs text-muted-foreground">{Number(a.price) === 0 ? 'Free' : `₦${Number(a.price).toLocaleString('en-NG')}`}</p>
                      </div>
                      <button type="button" onClick={() => removeAddon(i)} className="shrink-0 text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {showAddonForm && (
                <div className="p-5 rounded-xl border border-primary/30 bg-muted/30">
                  {addonError && (
                    <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-sm">{addonError}</div>
                  )}
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="addon-name">Name *</Label>
                      <Input id="addon-name" placeholder="Popcorn (Large)" value={addonDraft.name} onChange={(e) => setAddonDraft({ ...addonDraft, name: e.target.value })} />
                    </div>
                    <div>
                      <Label htmlFor="addon-type">Type *</Label>
                      <select id="addon-type" className="w-full h-11 rounded-xl border border-input bg-background/50 px-4 text-sm" value={addonDraft.type} onChange={(e) => setAddonDraft({ ...addonDraft, type: e.target.value as 'snack' | 'drink' })}>
                        <option value="snack">Snack</option>
                        <option value="drink">Drink</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="addon-price">Price *</Label>
                      <div className="relative">
                        <NairaSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input id="addon-price" type="number" min="0" step="0.01" placeholder="0.00" value={addonDraft.price} onChange={(e) => setAddonDraft({ ...addonDraft, price: e.target.value })} className="pl-10" />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button type="button" variant="outline" onClick={() => { setShowAddonForm(false); setAddonDraft(emptyAddon()); }}>
                      <X className="w-4 h-4" /> Cancel
                    </Button>
                    <Button type="button" onClick={handleAddAddon}>Add to menu</Button>
                  </div>
                </div>
              )}

              {addons.length === 0 && !showAddonForm && (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 shrink-0" /> Skip this if you don't want to sell snacks or drinks.
                </p>
              )}
            </section>

            {/* Ticket Tiers */}
            <section>
              <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
                <SectionHeader icon={Ticket} title="Ticket tiers" subtitle="Use the same names you used to label seats above (e.g. VIP) so prices match up correctly." />
                <Button type="button" size="sm" variant="outline" onClick={() => { setTierDraft(emptyTier()); setShowTierForm(!showTierForm); }}>
                  <Plus className="w-4 h-4" /> Add tier
                </Button>
              </div>

              {tiers.length > 0 && (
                <div className="space-y-2 mb-4">
                  {tiers.map((t, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border bg-muted/30">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{t.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {Number(t.price) === 0 ? 'Free' : `₦${Number(t.price).toLocaleString('en-NG')}`} &middot; {t.quantity} available
                        </p>
                      </div>
                      <button type="button" onClick={() => removeTier(i)} className="shrink-0 text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {showTierForm && (
                <div className="p-5 rounded-xl border border-primary/30 bg-muted/30">
                  {tierError && (
                    <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-sm">{tierError}</div>
                  )}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="tier-name">Ticket tier *</Label>
                      <select id="tier-name" value={tierDraft.name} onChange={(e) => setTierDraft({ ...tierDraft, name: e.target.value })} className="w-full h-11 rounded-xl border border-input bg-background/50 px-4 text-sm">
                        <option value="">Select tier</option>
                        {MOVIE_TIER_PRESETS.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="tier-price">Price *</Label>
                      <div className="relative">
                        <NairaSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input id="tier-price" type="number" min="0" step="0.01" placeholder="0.00" value={tierDraft.price} onChange={(e) => setTierDraft({ ...tierDraft, price: e.target.value })} className="pl-10" />
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Label htmlFor="tier-quantity">Quantity available *</Label>
                    <Input id="tier-quantity" type="number" min="1" placeholder="e.g. 100" value={tierDraft.quantity} onChange={(e) => setTierDraft({ ...tierDraft, quantity: e.target.value })} />
                  </div>
                  <div className="mt-4">
                    <Label htmlFor="tier-description">Description (optional)</Label>
                    <textarea id="tier-description" rows={2} className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm" placeholder="e.g., Front rows, reclining seats" value={tierDraft.description} onChange={(e) => setTierDraft({ ...tierDraft, description: e.target.value })} />
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button type="button" variant="outline" onClick={() => { setShowTierForm(false); setTierDraft(emptyTier()); }}>
                      <X className="w-4 h-4" /> Cancel
                    </Button>
                    <Button type="button" onClick={handleAddTier}>Add tier</Button>
                  </div>
                </div>
              )}

              {tiers.length === 0 && !showTierForm && (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 shrink-0" /> Add at least one ticket tier so buyers have a price to pay.
                </p>
              )}
            </section>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {loading ? 'Creating movie...' : 'Create movie'}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
