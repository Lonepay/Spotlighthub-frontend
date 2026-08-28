'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { useAuth } from '@/components/AuthProvider';
import { venues } from '@/lib/venues';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Clock, MapPin, Upload, ArrowRight, Loader2, Info, FileText, Image as ImageIcon, Trash2, Plus, X, BookText } from 'lucide-react';
import { NairaSign } from '@/components/icons/NairaSign';

const CITY_PRESETS = ['Lagos', 'Abuja', 'Port Harcourt', 'Ibadan', 'Kano', 'Enugu', 'Benin City', 'Kaduna', 'Owerri', 'Uyo', 'Calabar', 'Abeokuta'];

interface TierDraft {
  name: string;
  price: string;
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

const emptyTier = (): TierDraft => ({ name: '', price: '', description: '' });

export default function CreateVenuePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [city, setCity] = useState('');
  const [customCity, setCustomCity] = useState(false);
  const [coverImage, setCoverImage] = useState<File | null>(null);

  const [availableFrom, setAvailableFrom] = useState('');
  const [availableTo, setAvailableTo] = useState('');
  const [dailyOpenTime, setDailyOpenTime] = useState('');
  const [dailyCloseTime, setDailyCloseTime] = useState('');

  const [tiers, setTiers] = useState<TierDraft[]>([]);
  const [showTierForm, setShowTierForm] = useState(false);
  const [tierDraft, setTierDraft] = useState<TierDraft>(emptyTier());
  const [tierError, setTierError] = useState('');

  if (typeof window !== 'undefined' && !user) {
    router.push('/login');
    return null;
  }

  const handleAddTier = () => {
    setTierError('');
    if (!tierDraft.name.trim()) { setTierError('Name this pricing tier, e.g. "Full Day".'); return; }
    const price = Number(tierDraft.price || 0);
    if (price < 0) { setTierError("Price can't be negative — use 0 if it's free."); return; }
    setTiers([...tiers, { ...tierDraft, price: String(price) }]);
    setTierDraft(emptyTier());
    setShowTierForm(false);
  };

  const removeTier = (index: number) => setTiers(tiers.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!coverImage) {
      setError('Upload a cover image — it\'s required so buyers can see the space.');
      window.scrollTo({ top: document.getElementById('cover-upload')?.offsetTop ?? 0, behavior: 'smooth' });
      return;
    }

    setLoading(true);
    try {
      const data = new FormData();
      data.append('name', name);
      data.append('tagline', tagline);
      data.append('description', description);
      data.append('location', location);
      data.append('city', city);
      data.append('cover_image', coverImage);
      if (availableFrom) data.append('available_from', availableFrom);
      if (availableTo) data.append('available_to', availableTo);
      if (dailyOpenTime) data.append('daily_open_time', dailyOpenTime);
      if (dailyCloseTime) data.append('daily_close_time', dailyCloseTime);

      const venue = await venues.create(data);

      if (tiers.length > 0) {
        const results = await Promise.allSettled(
          tiers.map((t) => venues.createTier(venue.id, { name: t.name, description: t.description, price: Number(t.price) }))
        );
        const failed = results.filter((r) => r.status === 'rejected').length;
        if (failed > 0) {
          alert(`Venue created, but ${failed} of ${tiers.length} pricing tier(s) failed to save. You can add them again from this page.`);
        }
      }

      router.push(`/organizer/venues/${venue.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create venue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardShell title="Create Venue" description="Set up availability and pricing for a bookable space">
      <Card className="max-w-3xl shadow-none">
        <CardContent className="p-6 sm:p-8">
          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basics */}
            <section className="pb-8 border-b border-border">
              <SectionHeader icon={FileText} title="Basics" subtitle="What the space is called and what it's for." />
              <div className="space-y-6">
                <div>
                  <Label htmlFor="venue-name">Venue / place name *</Label>
                  <Input id="venue-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="The Grand Hall" />
                </div>
                <div>
                  <Label htmlFor="venue-tagline">Tagline</Label>
                  <Input id="venue-tagline" value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="One line that sells the space" />
                </div>
                <div>
                  <Label htmlFor="venue-description">Description</Label>
                  <textarea
                    id="venue-description"
                    rows={4}
                    className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm"
                    placeholder="Capacity, amenities, what's included..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>
            </section>

            {/* Location */}
            <section className="pb-8 border-b border-border">
              <SectionHeader icon={MapPin} title="Location" subtitle="Where the venue physically is." />
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="venue-location">Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input id="venue-location" value={location} onChange={(e) => setLocation(e.target.value)} className="pl-12" placeholder="Street address" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="venue-city">City *</Label>
                  {customCity ? (
                    <div className="flex gap-2">
                      <Input id="venue-city" required autoFocus value={city} onChange={(e) => setCity(e.target.value)} placeholder="Type your city" />
                      <Button type="button" variant="outline" onClick={() => { setCustomCity(false); setCity(''); }}>List</Button>
                    </div>
                  ) : (
                    <select
                      id="venue-city"
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

            {/* Cover image */}
            <section className="pb-8 border-b border-border">
              <SectionHeader icon={ImageIcon} title="Cover image *" subtitle="Shown on the venue card and detail page — required." />
              <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${coverImage ? 'border-primary/50' : 'border-destructive/40 hover:border-destructive/60'}`}>
                <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
                <input type="file" accept="image/*" required onChange={(e) => { setCoverImage(e.target.files?.[0] || null); setError(''); }} className="hidden" id="cover-upload" />
                <label htmlFor="cover-upload" className="cursor-pointer text-primary font-semibold hover:underline">
                  {coverImage ? coverImage.name : 'Click to upload cover image (required)'}
                </label>
                <p className="text-xs text-muted-foreground mt-2">PNG or JPG, landscape works best. Up to 30MB.</p>
              </div>
            </section>

            {/* Availability */}
            <section className="pb-8 border-b border-border">
              <SectionHeader icon={Clock} title="Availability" subtitle="The window this venue can be booked in, and its daily hours." />
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="available-from">Available from</Label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input id="available-from" type="date" value={availableFrom} onChange={(e) => setAvailableFrom(e.target.value)} className="pl-12" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="available-to">Available to</Label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input id="available-to" type="date" value={availableTo} onChange={(e) => setAvailableTo(e.target.value)} className="pl-12" />
                    </div>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="open-time">Daily open time</Label>
                    <Input id="open-time" type="time" value={dailyOpenTime} onChange={(e) => setDailyOpenTime(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="close-time">Daily close time</Label>
                    <Input id="close-time" type="time" value={dailyCloseTime} onChange={(e) => setDailyCloseTime(e.target.value)} />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 shrink-0" /> Leave any of these blank if the venue doesn't have a fixed window or fixed hours.
                </p>
              </div>
            </section>

            {/* Pricing tiers */}
            <section>
              <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
                <SectionHeader icon={BookText} title="Pricing tiers" subtitle="Rate options buyers choose from, e.g. Full Day / Half Day." />
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
                          {Number(t.price) === 0 ? 'Free' : `₦${Number(t.price).toLocaleString('en-NG')}`}
                          {t.description ? ` · ${t.description}` : ''}
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
                      <Label htmlFor="venue-tier-name">Tier name *</Label>
                      <Input id="venue-tier-name" placeholder="Full Day" value={tierDraft.name} onChange={(e) => setTierDraft({ ...tierDraft, name: e.target.value })} />
                    </div>
                    <div>
                      <Label htmlFor="venue-tier-price">Price *</Label>
                      <div className="relative">
                        <NairaSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input id="venue-tier-price" type="number" min="0" step="0.01" placeholder="0.00" value={tierDraft.price} onChange={(e) => setTierDraft({ ...tierDraft, price: e.target.value })} className="pl-10" />
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Label htmlFor="venue-tier-description">Description (optional)</Label>
                    <textarea id="venue-tier-description" rows={2} className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm" placeholder="e.g., 8am–6pm, includes chairs and tables" value={tierDraft.description} onChange={(e) => setTierDraft({ ...tierDraft, description: e.target.value })} />
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
                  <Info className="w-3.5 h-3.5 shrink-0" /> Add at least one pricing tier so buyers have a rate to book.
                </p>
              )}
            </section>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {loading ? 'Creating venue...' : 'Create venue'}
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
