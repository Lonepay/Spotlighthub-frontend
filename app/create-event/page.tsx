'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { useAuth } from '@/components/AuthProvider';
import { events } from '@/lib/events';
import { coupons as couponsApi } from '@/lib/coupons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, MapPin, Upload, ArrowRight, Loader2, Info, FileText, Ticket, Image as ImageIcon, Trash2, Plus, X, Tag } from 'lucide-react';
import { NairaSign } from '@/components/icons/NairaSign';
import { RichTextEditor } from '@/components/RichTextEditor';

const BASE_CATEGORIES = ['Movie', 'Concert', 'Conference', 'Workshop', 'Sports', 'Theater', 'Festival'];
const TIER_PRESETS = ['Regular', 'VIP', 'VVIP', 'Early Bird', 'Table', 'Group', 'Student', 'Season Pass'];

interface TierDraft {
  name: string;
  price: string;
  quantity: string;
  description: string;
}

interface CouponDraft {
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: string;
  max_uses: string;
  expires_at: string;
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

export default function CreateEventPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    venue: '',
    date: '',
    time: '',
    price: '',
    total_tickets: '',
    is_virtual: false,
    fee_payer: 'organizer' as 'organizer' | 'attendee',
  });
  const [image, setImage] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [categoryOptions, setCategoryOptions] = useState<string[]>(BASE_CATEGORIES);
  const [customCategory, setCustomCategory] = useState(false);

  // Ticket tiers are built up locally and only sent to the server once the
  // event itself has been created — the API has no "create event + tiers"
  // endpoint, so this stays a two-step submit hidden behind one page/one click.
  const [tiers, setTiers] = useState<TierDraft[]>([]);
  const [showTierForm, setShowTierForm] = useState(false);
  const [customTierName, setCustomTierName] = useState(false);
  const [tierDraft, setTierDraft] = useState<TierDraft>({ name: '', price: '', quantity: '', description: '' });
  const [tierError, setTierError] = useState('');

  // Same deal as ticket tiers — coupons are built up locally and only sent
  // once the event has actually been created.
  const [coupons, setCoupons] = useState<CouponDraft[]>([]);
  const [showCouponForm, setShowCouponForm] = useState(false);
  const [couponDraft, setCouponDraft] = useState<CouponDraft>({ code: '', discount_type: 'percentage', discount_value: '', max_uses: '', expires_at: '' });
  const [couponError, setCouponError] = useState('');

  useEffect(() => {
    events.getCategories().then((data) => {
      const merged = Array.from(new Set([...BASE_CATEGORIES, ...data.map((c) => c.category)])).sort();
      setCategoryOptions(merged);
    }).catch(() => {});
  }, []);

  // Redirect if not authenticated
  if (typeof window !== 'undefined' && !user) {
    router.push('/login');
    return null;
  }

  const resetTierForm = () => {
    setTierDraft({ name: '', price: '', quantity: '', description: '' });
    setCustomTierName(false);
    setTierError('');
  };

  const handleAddTier = () => {
    setTierError('');
    if (!tierDraft.name.trim()) {
      setTierError('Pick or type a ticket type name.');
      return;
    }
    const qty = Number(tierDraft.quantity);
    if (!qty || qty < 1) {
      setTierError("Enter how many of this ticket type you're making available (at least 1).");
      return;
    }
    const price = Number(tierDraft.price || 0);
    if (price < 0) {
      setTierError("Price can't be negative — use 0 for a free ticket type.");
      return;
    }
    setTiers([...tiers, { ...tierDraft, price: String(price), quantity: String(qty) }]);
    resetTierForm();
    setShowTierForm(false);
  };

  const removeTier = (index: number) => {
    setTiers(tiers.filter((_, i) => i !== index));
  };

  const resetCouponForm = () => {
    setCouponDraft({ code: '', discount_type: 'percentage', discount_value: '', max_uses: '', expires_at: '' });
    setCouponError('');
  };

  const handleAddCoupon = () => {
    setCouponError('');
    if (!couponDraft.code.trim()) {
      setCouponError('Enter a code buyers will type at checkout, e.g. EARLYBIRD.');
      return;
    }
    const value = Number(couponDraft.discount_value);
    if (!value || value <= 0) {
      setCouponError('Discount value must be greater than 0.');
      return;
    }
    if (couponDraft.discount_type === 'percentage' && value > 100) {
      setCouponError("A percentage discount can't exceed 100%.");
      return;
    }
    if (coupons.some((c) => c.code.toUpperCase() === couponDraft.code.trim().toUpperCase())) {
      setCouponError('You already added a coupon with this code.');
      return;
    }
    setCoupons([...coupons, { ...couponDraft, code: couponDraft.code.trim().toUpperCase(), discount_value: String(value) }]);
    resetCouponForm();
    setShowCouponForm(false);
  };

  const removeCoupon = (index: number) => {
    setCoupons(coupons.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('category', formData.category);
      data.append('venue', formData.venue);
      data.append('date', formData.date);
      data.append('time', formData.time);
      data.append('price', formData.price);
      data.append('total_tickets', formData.total_tickets);
      data.append('is_virtual', formData.is_virtual ? '1' : '0');
      data.append('fee_payer', formData.fee_payer);
      if (image) {
        data.append('image', image);
      }

      const newEvent = await events.create(data);

      const failures: string[] = [];

      if (tiers.length > 0) {
        const results = await Promise.allSettled(
          tiers.map((t) =>
            events.createVariation(newEvent.id, {
              name: t.name,
              description: t.description,
              price: Number(t.price),
              quantity: Number(t.quantity),
            })
          )
        );
        const failed = results.filter((r) => r.status === 'rejected').length;
        if (failed > 0) failures.push(`${failed} of ${tiers.length} ticket type(s)`);
      }

      if (coupons.length > 0) {
        const results = await Promise.allSettled(
          coupons.map((c) =>
            couponsApi.create(newEvent.id, {
              code: c.code,
              discount_type: c.discount_type,
              discount_value: Number(c.discount_value),
              max_uses: c.max_uses === '' ? null : Number(c.max_uses),
              expires_at: c.expires_at || null,
            })
          )
        );
        const failed = results.filter((r) => r.status === 'rejected').length;
        if (failed > 0) failures.push(`${failed} of ${coupons.length} coupon(s)`);
      }

      if (failures.length > 0) {
        alert(`Event created, but ${failures.join(' and ')} failed to save. You can add them again from this page.`);
      }

      router.push(`/organizer/events/${newEvent.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardShell title="Create Event" description="Fill in the details to start selling tickets">
      <Card className="max-w-3xl shadow-none">
        <CardContent className="p-6 sm:p-8">
          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic info */}
            <section className="pb-8 border-b border-border">
              <SectionHeader icon={FileText} title="Basic info" subtitle="What's the event called, and what should people know about it?" />
              <div className="space-y-6">
                <div>
                  <Label htmlFor="event-title">Event title *</Label>
                  <Input
                    id="event-title"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Amazing Concert 2026"
                  />
                  <p className="text-xs text-muted-foreground mt-1">This is the headline buyers see everywhere — keep it short and clear.</p>
                </div>

                <div>
                  <Label htmlFor="event-description">Description *</Label>
                  <RichTextEditor
                    value={formData.description}
                    onChange={(html) => setFormData({ ...formData, description: html })}
                    placeholder="Describe your event in detail..."
                  />
                  <p className="text-xs text-muted-foreground mt-1">Line-up, what's included, dress code, anything a buyer would want to know before paying.</p>
                </div>

                <div>
                  <Label htmlFor="event-category">Category *</Label>
                  {customCategory ? (
                    <div className="flex gap-2">
                      <Input
                        id="event-category"
                        required
                        autoFocus
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        placeholder="Type your category"
                      />
                      <Button type="button" variant="outline" onClick={() => { setCustomCategory(false); setFormData({ ...formData, category: '' }); }}>
                        Choose from list
                      </Button>
                    </div>
                  ) : (
                    <select
                      id="event-category"
                      required
                      value={formData.category}
                      onChange={(e) => {
                        if (e.target.value === '__custom__') {
                          setCustomCategory(true);
                          setFormData({ ...formData, category: '' });
                        } else {
                          setFormData({ ...formData, category: e.target.value });
                        }
                      }}
                      className="w-full h-11 rounded-xl border border-input bg-background/50 px-4 text-sm"
                    >
                      <option value="">Select category</option>
                      {categoryOptions.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                      <option value="__custom__">Other (type your own)…</option>
                    </select>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">Controls where your event shows up when people browse or filter by category.</p>
                </div>
              </div>
            </section>

            {/* Date & location */}
            <section className="pb-8 border-b border-border">
              <SectionHeader icon={MapPin} title="Date & location" subtitle="When it's happening, and where people go (or log in) to attend." />
              <div className="space-y-6">
                <div className="flex items-center space-x-3 p-4 bg-muted/40 rounded-xl">
                  <input
                    type="checkbox"
                    id="is_virtual"
                    checked={formData.is_virtual}
                    onChange={(e) => setFormData({ ...formData, is_virtual: e.target.checked, venue: '' })}
                    className="w-4 h-4 accent-primary rounded"
                  />
                  <label htmlFor="is_virtual" className="text-sm font-medium cursor-pointer">
                    This is a virtual event (online) — attendees get a meeting link instead of a venue
                  </label>
                </div>

                <div>
                  <Label htmlFor="event-venue">{formData.is_virtual ? 'Meeting link *' : 'Venue *'}</Label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="event-venue"
                      required
                      type={formData.is_virtual ? 'url' : 'text'}
                      value={formData.venue}
                      onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                      className="pl-12"
                      placeholder={formData.is_virtual ? 'https://zoom.us/j/... or https://meet.google.com/...' : 'Venue name'}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formData.is_virtual ? "Only shown to people who've bought a ticket." : 'Where attendees physically go — shown on the event page and map.'}
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="event-date">Date *</Label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="event-date"
                        type="date"
                        required
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="pl-12"
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="event-time">Time (optional)</Label>
                    <Input
                      id="event-time"
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground mt-1">Local time — leave blank if it's an all-day thing.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Pricing & capacity */}
            <section className="pb-8 border-b border-border">
              <SectionHeader icon={NairaSign} title="Pricing & capacity" subtitle="Your default price and stock. You can add specific ticket types (VIP, Table, etc.) below." />
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="event-price">Price per ticket (NGN) *</Label>
                    <div className="relative">
                      <NairaSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="event-price"
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        className="pl-12"
                        placeholder="0.00"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Set to 0 for free events.</p>
                  </div>

                  <div>
                    <Label htmlFor="event-total-tickets">Total tickets *</Label>
                    <Input
                      id="event-total-tickets"
                      type="number"
                      required
                      min="1"
                      value={formData.total_tickets}
                      onChange={(e) => setFormData({ ...formData, total_tickets: e.target.value })}
                      placeholder="100"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Overall capacity across every ticket type combined.</p>
                  </div>
                </div>

                <div>
                  <Label>Who covers the platform fee?</Label>
                  <p className="text-xs text-muted-foreground mb-2">Only applies if you charge for tickets — free events are never charged.</p>
                  <div className="grid md:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, fee_payer: 'organizer' })}
                      className={`rounded-xl border-2 px-4 py-3 text-sm font-medium text-left transition-colors ${
                        formData.fee_payer === 'organizer' ? 'border-primary bg-primary/5' : 'border-border'
                      }`}
                    >
                      You (the organizer)
                      <p className="text-xs text-muted-foreground font-normal mt-0.5">Deducted from your payout. Buyers pay exactly the price above.</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, fee_payer: 'attendee' })}
                      className={`rounded-xl border-2 px-4 py-3 text-sm font-medium text-left transition-colors ${
                        formData.fee_payer === 'attendee' ? 'border-primary bg-primary/5' : 'border-border'
                      }`}
                    >
                      Attendees
                      <p className="text-xs text-muted-foreground font-normal mt-0.5">Added on top at checkout. You receive the full price above.</p>
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Ticket types */}
            <section className="pb-8 border-b border-border">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
                <SectionHeader icon={Ticket} title="Ticket types (optional)" subtitle="Sell Regular, VIP, Table, etc. separately, each with its own price and stock — all set up right here." />
                <Button type="button" size="sm" variant="outline" onClick={() => { resetTierForm(); setShowTierForm(!showTierForm); }}>
                  <Plus className="w-4 h-4" /> Add ticket type
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
                    <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-sm">
                      {tierError}
                    </div>
                  )}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="tier-name">Ticket type *</Label>
                      {customTierName ? (
                        <div className="flex gap-2">
                          <Input
                            id="tier-name"
                            autoFocus
                            placeholder="Type your ticket type"
                            value={tierDraft.name}
                            onChange={(e) => setTierDraft({ ...tierDraft, name: e.target.value })}
                          />
                          <Button type="button" variant="outline" onClick={() => { setCustomTierName(false); setTierDraft({ ...tierDraft, name: '' }); }}>
                            List
                          </Button>
                        </div>
                      ) : (
                        <select
                          id="tier-name"
                          value={tierDraft.name}
                          onChange={(e) => {
                            if (e.target.value === '__custom__') {
                              setCustomTierName(true);
                              setTierDraft({ ...tierDraft, name: '' });
                            } else {
                              setTierDraft({ ...tierDraft, name: e.target.value });
                            }
                          }}
                          className="w-full h-11 rounded-xl border border-input bg-background/50 px-4 text-sm"
                        >
                          <option value="">Select ticket type</option>
                          {TIER_PRESETS.map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                          <option value="__custom__">Other (type your own)…</option>
                        </select>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="tier-price">Price *</Label>
                      <div className="relative">
                        <NairaSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="tier-price"
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={tierDraft.price}
                          onChange={(e) => setTierDraft({ ...tierDraft, price: e.target.value })}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Label htmlFor="tier-quantity">Quantity available *</Label>
                    <Input
                      id="tier-quantity"
                      type="number"
                      min="1"
                      placeholder="e.g. 100"
                      value={tierDraft.quantity}
                      onChange={(e) => setTierDraft({ ...tierDraft, quantity: e.target.value })}
                    />
                  </div>
                  <div className="mt-4">
                    <Label htmlFor="tier-description">Description (optional)</Label>
                    <textarea
                      id="tier-description"
                      rows={2}
                      className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm"
                      placeholder="e.g., Includes early entry, front-row seating"
                      value={tierDraft.description}
                      onChange={(e) => setTierDraft({ ...tierDraft, description: e.target.value })}
                    />
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button type="button" variant="outline" onClick={() => { setShowTierForm(false); resetTierForm(); }}>
                      <X className="w-4 h-4" /> Cancel
                    </Button>
                    <Button type="button" onClick={handleAddTier}>
                      Add to event
                    </Button>
                  </div>
                </div>
              )}

              {tiers.length === 0 && !showTierForm && (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 shrink-0" /> Skip this and your event just sells at the single price set above.
                </p>
              )}
            </section>

            {/* Coupons */}
            <section className="pb-8 border-b border-border">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
                <SectionHeader icon={Tag} title="Coupons (optional)" subtitle="Discount codes buyers can apply at checkout — set them up now or add them later from the event page." />
                <Button type="button" size="sm" variant="outline" onClick={() => { resetCouponForm(); setShowCouponForm(!showCouponForm); }}>
                  <Plus className="w-4 h-4" /> Add coupon
                </Button>
              </div>

              {coupons.length > 0 && (
                <div className="space-y-2 mb-4">
                  {coupons.map((c, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border bg-muted/30">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5 text-primary shrink-0" /> {c.code}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {c.discount_type === 'percentage' ? `${c.discount_value}% off` : `₦${Number(c.discount_value).toLocaleString('en-NG')} off`}
                          {c.max_uses ? ` · max ${c.max_uses} uses` : ''}
                          {c.expires_at ? ` · expires ${c.expires_at}` : ''}
                        </p>
                      </div>
                      <button type="button" onClick={() => removeCoupon(i)} className="shrink-0 text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {showCouponForm && (
                <div className="p-5 rounded-xl border border-primary/30 bg-muted/30">
                  {couponError && (
                    <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-sm">
                      {couponError}
                    </div>
                  )}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="coupon-code">Code *</Label>
                      <Input
                        id="coupon-code"
                        placeholder="e.g., EARLYBIRD"
                        value={couponDraft.code}
                        onChange={(e) => setCouponDraft({ ...couponDraft, code: e.target.value.toUpperCase() })}
                        className="uppercase"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Not case-sensitive at checkout.</p>
                    </div>
                    <div>
                      <Label htmlFor="coupon-type">Discount type *</Label>
                      <select
                        id="coupon-type"
                        className="w-full h-11 rounded-xl border border-input bg-background/50 px-4 text-sm"
                        value={couponDraft.discount_type}
                        onChange={(e) => setCouponDraft({ ...couponDraft, discount_type: e.target.value as 'percentage' | 'fixed' })}
                      >
                        <option value="percentage">Percentage (%)</option>
                        <option value="fixed">Fixed amount (₦)</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-3 gap-4 mt-4">
                    <div>
                      <Label htmlFor="coupon-value">
                        {couponDraft.discount_type === 'percentage' ? 'Discount % *' : 'Discount ₦ *'}
                      </Label>
                      <Input
                        id="coupon-value"
                        type="number"
                        min={0}
                        max={couponDraft.discount_type === 'percentage' ? 100 : undefined}
                        value={couponDraft.discount_value}
                        onChange={(e) => setCouponDraft({ ...couponDraft, discount_value: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="coupon-max-uses">Max uses</Label>
                      <Input
                        id="coupon-max-uses"
                        type="number"
                        min={1}
                        placeholder="Unlimited"
                        value={couponDraft.max_uses}
                        onChange={(e) => setCouponDraft({ ...couponDraft, max_uses: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground mt-1">Leave blank for no cap.</p>
                    </div>
                    <div>
                      <Label htmlFor="coupon-expires">Expires</Label>
                      <Input
                        id="coupon-expires"
                        type="date"
                        value={couponDraft.expires_at}
                        onChange={(e) => setCouponDraft({ ...couponDraft, expires_at: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground mt-1">Leave blank to never expire.</p>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button type="button" variant="outline" onClick={() => { setShowCouponForm(false); resetCouponForm(); }}>
                      <X className="w-4 h-4" /> Cancel
                    </Button>
                    <Button type="button" onClick={handleAddCoupon}>
                      Add to event
                    </Button>
                  </div>
                </div>
              )}

              {coupons.length === 0 && !showCouponForm && (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 shrink-0" /> Skip this if you don't need discount codes yet.
                </p>
              )}
            </section>

            {/* Event image */}
            <section>
              <SectionHeader icon={ImageIcon} title="Event image" subtitle="The cover photo shown on your event card and detail page." />
              <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors">
                <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImage(e.target.files?.[0] || null)}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer text-primary font-semibold hover:underline">
                  {image ? image.name : 'Click to upload image'}
                </label>
                <p className="text-xs text-muted-foreground mt-2">PNG or JPG, landscape works best.</p>
              </div>
            </section>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {loading ? 'Creating event...' : 'Create event'}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
