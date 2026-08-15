'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { useAuth } from '@/components/AuthProvider';
import { isAdminLevelRole } from '@/lib/auth';
import { events, Event } from '@/lib/events';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, Edit2, Tag, Calendar, MapPin, Ticket, Info, ChevronUp, ChevronDown } from 'lucide-react';
import DOMPurify from 'isomorphic-dompurify';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { tickets as ticketsApi } from '@/lib/tickets';
import { coupons as couponsApi, Coupon } from '@/lib/coupons';
import { NairaSign } from '@/components/icons/NairaSign';
import { RichTextEditor } from '@/components/RichTextEditor';

interface TicketVariation {
  id?: number;
  name: string;
  description: string;
  price: number;
  quantity: number;
  sold?: number;
}

const BASE_CATEGORIES = ['Movie', 'Concert', 'Conference', 'Workshop', 'Sports', 'Theater', 'Festival'];
const TIER_PRESETS = ['Regular', 'VIP', 'VVIP', 'Early Bird', 'Table', 'Group', 'Student', 'Season Pass'];

export default function OrganizerEventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [variations, setVariations] = useState<TicketVariation[]>([]);
  const [soldTickets, setSoldTickets] = useState<any[]>([]);
  const [ticketsPage, setTicketsPage] = useState({ current_page: 1, last_page: 1 });
  const [showVariationForm, setShowVariationForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [customTierName, setCustomTierName] = useState(false);
  const [savingVariation, setSavingVariation] = useState(false);
  const [variationError, setVariationError] = useState('');
  const [formData, setFormData] = useState<TicketVariation>({
    name: '',
    description: '',
    price: 0,
    quantity: 0,
  });

  const [showEditEvent, setShowEditEvent] = useState(false);
  const [savingEvent, setSavingEvent] = useState(false);
  const [eventImage, setEventImage] = useState<File | null>(null);
  const [categoryOptions, setCategoryOptions] = useState<string[]>(BASE_CATEGORIES);
  const [customCategory, setCustomCategory] = useState(false);
  const [eventForm, setEventForm] = useState({
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

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [showCouponForm, setShowCouponForm] = useState(false);
  const [editingCouponId, setEditingCouponId] = useState<number | null>(null);
  const [savingCoupon, setSavingCoupon] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [couponForm, setCouponForm] = useState({
    code: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: 0,
    max_uses: '' as number | '',
    expires_at: '',
    partner_email: '',
    commission_per_ticket: '' as number | '',
  });

  useEffect(() => {
    if (!user || (user.role !== 'organizer' && !isAdminLevelRole(user.role))) {
      router.push('/login');
    } else {
      loadEvent();
      loadVariations();
      loadTickets(1);
      loadCoupons();
    }
  }, [params.id, user]);

  const loadCoupons = async () => {
    try {
      setCoupons(await couponsApi.list(Number(params.id)));
    } catch (error) {
      console.error('Failed to load coupons:', error);
    }
  };

  const resetCouponForm = () => {
    setCouponForm({ code: '', discount_type: 'percentage', discount_value: 0, max_uses: '', expires_at: '', partner_email: '', commission_per_ticket: '' });
    setEditingCouponId(null);
    setCouponError('');
  };

  const handleSaveCoupon = async () => {
    setCouponError('');
    if (!couponForm.code.trim()) {
      setCouponError('Enter a code buyers will type at checkout, e.g. EARLYBIRD.');
      return;
    }
    if (couponForm.discount_value <= 0) {
      setCouponError('Discount value must be greater than 0.');
      return;
    }
    if (couponForm.discount_type === 'percentage' && couponForm.discount_value > 100) {
      setCouponError("A percentage discount can't exceed 100%.");
      return;
    }
    if (couponForm.partner_email.trim() && !couponForm.commission_per_ticket) {
      setCouponError('Set a commission per ticket for this partner code.');
      return;
    }

    setSavingCoupon(true);
    try {
      const payload = {
        code: couponForm.code.trim().toUpperCase(),
        discount_type: couponForm.discount_type,
        discount_value: couponForm.discount_value,
        max_uses: couponForm.max_uses === '' ? null : Number(couponForm.max_uses),
        expires_at: couponForm.expires_at || null,
        ...(couponForm.partner_email.trim() && {
          partner_email: couponForm.partner_email.trim(),
          commission_per_ticket: Number(couponForm.commission_per_ticket),
        }),
      };
      if (editingCouponId) {
        await couponsApi.update(Number(params.id), editingCouponId, payload);
      } else {
        await couponsApi.create(Number(params.id), payload);
      }
      resetCouponForm();
      setShowCouponForm(false);
      await loadCoupons();
    } catch (error: any) {
      setCouponError(error.response?.data?.message || 'Failed to save coupon');
    } finally {
      setSavingCoupon(false);
    }
  };

  const handleEditCoupon = (coupon: Coupon) => {
    setCouponForm({
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      max_uses: coupon.max_uses ?? '',
      expires_at: coupon.expires_at ? coupon.expires_at.slice(0, 10) : '',
      partner_email: coupon.partner?.email ?? '',
      commission_per_ticket: coupon.commission_per_ticket ?? '',
    });
    setEditingCouponId(coupon.id);
    setCouponError('');
    setShowCouponForm(true);
  };

  const handleDeleteCoupon = async (id: number) => {
    if (!confirm('Delete this coupon?')) return;
    try {
      await couponsApi.delete(Number(params.id), id);
      await loadCoupons();
    } catch (error) {
      alert('Failed to delete coupon');
    }
  };

  const handleToggleCouponActive = async (coupon: Coupon) => {
    try {
      await couponsApi.update(Number(params.id), coupon.id, { is_active: !coupon.is_active });
      await loadCoupons();
    } catch (error) {
      alert('Failed to update coupon');
    }
  };

  const loadTickets = async (page: number) => {
    try {
      const data = await ticketsApi.getForEvent(Number(params.id), page);
      setSoldTickets(data.data || data);
      setTicketsPage({ current_page: data.current_page ?? 1, last_page: data.last_page ?? 1 });
    } catch (error) {
      console.error('Failed to load tickets:', error);
    }
  };

  const handleTicketStatusChange = async (ticketId: number, status: 'valid' | 'checked_in' | 'invalid' | 'revoked') => {
    const reason = (status === 'invalid' || status === 'revoked') ? window.prompt(`Reason for marking this ticket ${status}?`) || undefined : undefined;
    try {
      await ticketsApi.updateStatus(ticketId, status, reason);
      await loadTickets(ticketsPage.current_page);
    } catch (error) {
      alert('Failed to update ticket status');
    }
  };

  const handleDeleteTicket = async (ticketId: number) => {
    if (!confirm('Delete this ticket? This cannot be undone.')) return;
    try {
      await ticketsApi.deleteTicket(ticketId);
      await loadTickets(ticketsPage.current_page);
    } catch (error) {
      alert('Failed to delete ticket');
    }
  };

  const loadEvent = async () => {
    try {
      const data = await events.getOne(Number(params.id));
      setEvent(data);
    } catch (error) {
      console.error('Failed to load event:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    events.getCategories().then((data) => {
      const merged = Array.from(new Set([...BASE_CATEGORIES, ...data.map((c) => c.category)])).sort();
      setCategoryOptions(merged);
    }).catch(() => {});
  }, []);

  const handleOpenEditEvent = () => {
    if (!event) return;
    setCustomCategory(!!event.category && !categoryOptions.includes(event.category));
    setEventForm({
      title: event.title,
      description: event.description,
      category: event.category,
      venue: event.venue,
      date: event.date?.slice(0, 10) || '',
      time: event.time || '',
      price: String(event.price ?? ''),
      total_tickets: String(event.total_tickets ?? ''),
      is_virtual: !!event.is_virtual,
      fee_payer: event.fee_payer || 'organizer',
    });
    setEventImage(null);
    setShowEditEvent(true);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingEvent(true);
    try {
      const data = new FormData();
      data.append('title', eventForm.title);
      data.append('description', eventForm.description);
      data.append('category', eventForm.category);
      data.append('venue', eventForm.venue);
      data.append('date', eventForm.date);
      data.append('time', eventForm.time);
      data.append('price', eventForm.price);
      data.append('total_tickets', eventForm.total_tickets);
      data.append('is_virtual', eventForm.is_virtual ? '1' : '0');
      data.append('fee_payer', eventForm.fee_payer);
      if (eventImage) {
        data.append('image', eventImage);
      }
      await events.update(Number(params.id), data);
      setShowEditEvent(false);
      await loadEvent();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to save event');
    } finally {
      setSavingEvent(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!confirm('Delete this event? This cannot be undone and will remove all its ticket types and coupons.')) return;
    try {
      await events.delete(Number(params.id));
      router.push('/organizer');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete event');
    }
  };

  const loadVariations = async () => {
    try {
      const data = await events.getVariations(Number(params.id));
      setVariations(data.map((v) => ({ ...v, description: v.description || '' })));
    } catch (error) {
      console.error('Failed to load variations:', error);
    }
  };

  const handleAddVariation = async () => {
    setVariationError('');
    if (!formData.name.trim()) {
      setVariationError('Pick or type a ticket type name.');
      return;
    }
    if (!formData.quantity || formData.quantity < 1) {
      setVariationError('Enter how many of this ticket type you\'re making available (at least 1).');
      return;
    }
    if (formData.price < 0) {
      setVariationError('Price can\'t be negative — use 0 for a free ticket type.');
      return;
    }

    setSavingVariation(true);
    try {
      const payload = { name: formData.name, description: formData.description, price: formData.price, quantity: formData.quantity };
      if (editingId) {
        await events.updateVariation(Number(params.id), editingId, payload);
      } else {
        await events.createVariation(Number(params.id), payload);
      }
      setFormData({ name: '', description: '', price: 0, quantity: 0 });
      setCustomTierName(false);
      setShowVariationForm(false);
      setEditingId(null);
      await loadVariations();
    } catch (error: any) {
      setVariationError(error.response?.data?.message || 'Failed to save variation');
    } finally {
      setSavingVariation(false);
    }
  };

  const handleMoveVariation = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= variations.length) return;
    const reordered = [...variations];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    setVariations(reordered);
    try {
      await events.reorderVariations(Number(params.id), reordered.map((v) => v.id!));
    } catch (error) {
      alert('Failed to save the new order');
      await loadVariations();
    }
  };

  const handleDeleteVariation = async (id: number) => {
    if (!confirm('Delete this ticket variation?')) return;
    try {
      await events.deleteVariation(Number(params.id), id);
      await loadVariations();
    } catch (error) {
      alert('Failed to delete variation');
    }
  };

  const handleEditVariation = (variation: TicketVariation) => {
    setCustomTierName(!!variation.name && !TIER_PRESETS.includes(variation.name));
    setVariationError('');
    setFormData({
      name: variation.name,
      description: variation.description,
      price: variation.price,
      quantity: variation.quantity,
    });
    setEditingId(variation.id || null);
    setShowVariationForm(true);
  };

  if (loading) {
    return (
      <DashboardShell title="Manage Event">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-64 bg-muted rounded-xl" />
        </div>
      </DashboardShell>
    );
  }

  if (!event) {
    return (
      <DashboardShell title="Manage Event">
        <p className="text-muted-foreground">Event not found</p>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title={event.title} description="Manage event details and ticket types">
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          &larr; Back to events
        </Button>

        {/* Event Header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-wrap justify-between items-start gap-3 mb-2">
              <h2 className="font-display font-bold text-xl">{event.title}</h2>
              <div className="flex items-center gap-2 shrink-0">
                <Button variant="outline" size="sm" onClick={() => (showEditEvent ? setShowEditEvent(false) : handleOpenEditEvent())}>
                  <Edit2 className="w-4 h-4" /> {showEditEvent ? 'Cancel' : 'Edit Event'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={handleDeleteEvent}
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </Button>
              </div>
            </div>

            {showEditEvent ? (
              <form onSubmit={handleSaveEvent} className="space-y-5 mt-4 p-4 rounded-xl border border-border bg-muted/30">
                <div>
                  <Label htmlFor="edit-title">Event title *</Label>
                  <Input id="edit-title" required value={eventForm.title} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })} />
                </div>

                <div>
                  <Label htmlFor="edit-description">Description *</Label>
                  <RichTextEditor value={eventForm.description} onChange={(html) => setEventForm({ ...eventForm, description: html })} />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-category">Category *</Label>
                    {customCategory ? (
                      <div className="flex gap-2">
                        <Input
                          id="edit-category"
                          required
                          autoFocus
                          value={eventForm.category}
                          onChange={(e) => setEventForm({ ...eventForm, category: e.target.value })}
                          placeholder="Type your category"
                        />
                        <Button type="button" variant="outline" onClick={() => { setCustomCategory(false); setEventForm({ ...eventForm, category: '' }); }}>
                          List
                        </Button>
                      </div>
                    ) : (
                      <select
                        id="edit-category"
                        required
                        value={eventForm.category}
                        onChange={(e) => {
                          if (e.target.value === '__custom__') {
                            setCustomCategory(true);
                            setEventForm({ ...eventForm, category: '' });
                          } else {
                            setEventForm({ ...eventForm, category: e.target.value });
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
                  </div>
                  <div>
                    <Label htmlFor="edit-venue">{eventForm.is_virtual ? 'Meeting link *' : 'Venue *'}</Label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="edit-venue"
                        required
                        type={eventForm.is_virtual ? 'url' : 'text'}
                        value={eventForm.venue}
                        onChange={(e) => setEventForm({ ...eventForm, venue: e.target.value })}
                        className="pl-12"
                        placeholder={eventForm.is_virtual ? 'https://zoom.us/j/... or https://meet.google.com/...' : undefined}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 bg-background rounded-xl">
                  <input
                    type="checkbox"
                    id="edit-is-virtual"
                    checked={eventForm.is_virtual}
                    onChange={(e) => setEventForm({ ...eventForm, is_virtual: e.target.checked, venue: '' })}
                    className="w-4 h-4 accent-primary rounded"
                  />
                  <label htmlFor="edit-is-virtual" className="text-sm font-medium cursor-pointer">This is a virtual event (online) — attendees get a meeting link instead of a venue</label>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-date">Date *</Label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input id="edit-date" type="date" required value={eventForm.date} onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })} className="pl-12" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="edit-time">Time</Label>
                    <Input id="edit-time" type="time" value={eventForm.time} onChange={(e) => setEventForm({ ...eventForm, time: e.target.value })} />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-price">Price per ticket (NGN) *</Label>
                    <div className="relative">
                      <NairaSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input id="edit-price" type="number" required min="0" step="0.01" value={eventForm.price} onChange={(e) => setEventForm({ ...eventForm, price: e.target.value })} className="pl-12" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="edit-total-tickets">Total tickets *</Label>
                    <Input id="edit-total-tickets" type="number" required min="1" value={eventForm.total_tickets} onChange={(e) => setEventForm({ ...eventForm, total_tickets: e.target.value })} />
                  </div>
                </div>

                <div>
                  <Label>Who covers the platform fee?</Label>
                  <div className="grid md:grid-cols-2 gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => setEventForm({ ...eventForm, fee_payer: 'organizer' })}
                      className={`rounded-xl border-2 px-4 py-3 text-sm font-medium text-left transition-colors ${eventForm.fee_payer === 'organizer' ? 'border-primary bg-primary/5' : 'border-border'}`}
                    >
                      You (the organizer)
                    </button>
                    <button
                      type="button"
                      onClick={() => setEventForm({ ...eventForm, fee_payer: 'attendee' })}
                      className={`rounded-xl border-2 px-4 py-3 text-sm font-medium text-left transition-colors ${eventForm.fee_payer === 'attendee' ? 'border-primary bg-primary/5' : 'border-border'}`}
                    >
                      Attendees
                    </button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="edit-image">Replace event image (optional)</Label>
                  <input
                    id="edit-image"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setEventImage(e.target.files?.[0] || null)}
                    className="w-full text-sm"
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={savingEvent}>{savingEvent ? 'Saving...' : 'Save changes'}</Button>
                  <Button type="button" variant="outline" onClick={() => setShowEditEvent(false)}>Cancel</Button>
                </div>
              </form>
            ) : (
              <>
                <div
                  className="prose prose-sm max-w-none text-muted-foreground mb-6 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(event.description) }}
                />
                <div className="grid sm:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Date</p>
                    <p className="font-medium text-sm">{new Date(event.date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Time</p>
                    <p className="font-medium text-sm">{event.time}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Venue</p>
                    <p className="font-medium text-sm">{event.venue}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Category</p>
                    <p className="font-medium text-sm">{event.category}</p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Ticket Variations */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
              <div>
                <h2 className="font-display font-bold text-lg">Ticket Types</h2>
                <p className="text-sm text-muted-foreground mt-1">Create different ticket tiers (VIP, General, etc.) with unique pricing</p>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  setShowVariationForm(!showVariationForm);
                  setEditingId(null);
                  setCustomTierName(false);
                  setVariationError('');
                  setFormData({ name: '', description: '', price: 0, quantity: 0 });
                }}
              >
                <Plus className="w-4 h-4" /> Add Type
              </Button>
            </div>

            {showVariationForm && (
              <div className="p-5 sm:p-6 mb-6 rounded-xl border border-primary/30 bg-muted/30">
                <div className="flex items-start gap-3 mb-5 pb-4 border-b border-border">
                  <div className="w-9 h-9 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Ticket className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold">{editingId ? 'Edit ticket type' : 'Add a ticket type'}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Each type is sold separately with its own price and stock — e.g. Regular ₦5,000 and VIP ₦15,000 for the same event.
                    </p>
                  </div>
                </div>

                {variationError && (
                  <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-sm">
                    {variationError}
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-4 mb-1">
                  <div>
                    <Label htmlFor="var-name">Ticket type *</Label>
                    {customTierName ? (
                      <div className="flex gap-2">
                        <Input
                          id="var-name"
                          autoFocus
                          placeholder="Type your ticket type"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                        <Button type="button" variant="outline" onClick={() => { setCustomTierName(false); setFormData({ ...formData, name: '' }); }}>
                          List
                        </Button>
                      </div>
                    ) : (
                      <select
                        id="var-name"
                        value={formData.name}
                        onChange={(e) => {
                          if (e.target.value === '__custom__') {
                            setCustomTierName(true);
                            setFormData({ ...formData, name: '' });
                          } else {
                            setFormData({ ...formData, name: e.target.value });
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
                    <p className="text-xs text-muted-foreground mt-1">What buyers will see and choose between at checkout.</p>
                  </div>
                  <div>
                    <Label htmlFor="var-price">Price *</Label>
                    <div className="relative">
                      <NairaSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="var-price"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                        className="pl-10"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Per single ticket of this type. Use 0 for a free tier.</p>
                  </div>
                </div>

                <div className="mb-1 mt-4">
                  <Label htmlFor="var-quantity">Quantity available *</Label>
                  <Input
                    id="var-quantity"
                    type="number"
                    min="1"
                    placeholder="e.g. 100"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">How many of this specific ticket type you're releasing for sale.</p>
                </div>

                <div className="mb-1 mt-4">
                  <Label htmlFor="var-description">Description (optional)</Label>
                  <textarea
                    id="var-description"
                    rows={3}
                    className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm"
                    placeholder="e.g., Includes early entry, free drinks, front-row seating"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Info className="w-3.5 h-3.5 shrink-0" /> Shown to buyers to help them pick the right tier — perks, seating, access, etc.
                  </p>
                </div>

                <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-border">
                  <Button
                    variant="outline"
                    disabled={savingVariation}
                    onClick={() => {
                      setShowVariationForm(false);
                      setEditingId(null);
                      setVariationError('');
                      setFormData({ name: '', description: '', price: 0, quantity: 0 });
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleAddVariation} disabled={savingVariation}>
                    {savingVariation ? 'Saving…' : editingId ? 'Update ticket type' : 'Create ticket type'}
                  </Button>
                </div>
              </div>
            )}

            {variations.length > 0 ? (
              <div className="space-y-3">
                {variations.length > 1 && (
                  <p className="text-xs text-muted-foreground">Auto-sorted by price — use the arrows to set a custom order instead.</p>
                )}
                {variations.map((variation, index) => (
                  <div key={variation.id} className="p-4 rounded-xl border border-border">
                    <div className="flex flex-wrap justify-between items-start gap-3">
                      <div className="flex items-start gap-2">
                        {variations.length > 1 && (
                          <div className="flex flex-col shrink-0 -mt-1">
                            <Button variant="ghost" size="icon" className="h-6 w-6" disabled={index === 0} onClick={() => handleMoveVariation(index, -1)}>
                              <ChevronUp className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6" disabled={index === variations.length - 1} onClick={() => handleMoveVariation(index, 1)}>
                              <ChevronDown className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                        <div>
                          <h3 className="font-medium">{variation.name}</h3>
                          <p className="text-sm text-muted-foreground mb-2">{variation.description}</p>
                          <div className="flex gap-4 text-sm">
                            <span className="font-semibold">₦{variation.price.toLocaleString('en-NG', { maximumFractionDigits: 0 })}</span>
                            <span className="text-muted-foreground">{variation.sold || 0} sold / {variation.quantity} total</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="icon" onClick={() => handleEditVariation(variation)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteVariation(variation.id!)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-muted-foreground">No ticket types yet. Create one to get started!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Coupons */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
              <div>
                <h2 className="font-display font-bold text-lg">Coupons</h2>
                <p className="text-sm text-muted-foreground mt-1">Create discount codes buyers can apply at checkout</p>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  setShowCouponForm(!showCouponForm);
                  resetCouponForm();
                }}
              >
                <Plus className="w-4 h-4" /> Add Coupon
              </Button>
            </div>

            {showCouponForm && (
              <div className="p-5 sm:p-6 mb-6 rounded-xl border border-primary/30 bg-muted/30">
                <div className="flex items-start gap-3 mb-5 pb-4 border-b border-border">
                  <div className="w-9 h-9 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Tag className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold">{editingCouponId ? 'Edit coupon' : 'Add a coupon'}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">Buyers type this code at checkout to get the discount you set here.</p>
                  </div>
                </div>

                {couponError && (
                  <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-sm">
                    {couponError}
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-4 mb-1">
                  <div>
                    <Label htmlFor="coupon-code-input">Code *</Label>
                    <Input
                      id="coupon-code-input"
                      placeholder="e.g., EARLYBIRD"
                      value={couponForm.code}
                      onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                      className="uppercase"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Not case-sensitive at checkout — shown here in caps for clarity.</p>
                  </div>
                  <div>
                    <Label htmlFor="coupon-type">Discount type *</Label>
                    <select
                      id="coupon-type"
                      className="w-full h-11 rounded-xl border border-input bg-background px-4 text-sm"
                      value={couponForm.discount_type}
                      onChange={(e) => setCouponForm({ ...couponForm, discount_type: e.target.value as 'percentage' | 'fixed' })}
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed amount (₦)</option>
                    </select>
                    <p className="text-xs text-muted-foreground mt-1">Percentage takes a cut off the price; fixed knocks off a flat Naira amount.</p>
                  </div>
                </div>
                <div className="grid md:grid-cols-3 gap-4 mt-4 mb-1">
                  <div>
                    <Label htmlFor="coupon-value">
                      {couponForm.discount_type === 'percentage' ? 'Discount % *' : 'Discount ₦ *'}
                    </Label>
                    <Input
                      id="coupon-value"
                      type="number"
                      min={0}
                      max={couponForm.discount_type === 'percentage' ? 100 : undefined}
                      value={couponForm.discount_value}
                      onChange={(e) => setCouponForm({ ...couponForm, discount_value: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="coupon-max-uses">Max uses</Label>
                    <Input
                      id="coupon-max-uses"
                      type="number"
                      min={1}
                      placeholder="Unlimited"
                      value={couponForm.max_uses}
                      onChange={(e) => setCouponForm({ ...couponForm, max_uses: e.target.value === '' ? '' : Number(e.target.value) })}
                    />
                    <p className="text-xs text-muted-foreground mt-1">Leave blank for no cap.</p>
                  </div>
                  <div>
                    <Label htmlFor="coupon-expires">Expires</Label>
                    <Input
                      id="coupon-expires"
                      type="date"
                      value={couponForm.expires_at}
                      onChange={(e) => setCouponForm({ ...couponForm, expires_at: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground mt-1">Leave blank to never expire.</p>
                  </div>
                </div>

                {user && isAdminLevelRole(user.role) && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <h4 className="font-medium text-sm mb-1">Make this a partnership code (admin only)</h4>
                    <p className="text-xs text-muted-foreground mb-3">
                      Turns this into a promo code a partner shares on their socials — they earn a flat commission per ticket sold through it, paid by the platform (not deducted from the organizer). Leave blank for a normal discount-only coupon.
                    </p>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="coupon-partner-email">Partner&apos;s account email</Label>
                        <Input
                          id="coupon-partner-email"
                          type="email"
                          placeholder="partner@example.com"
                          value={couponForm.partner_email}
                          onChange={(e) => setCouponForm({ ...couponForm, partner_email: e.target.value })}
                        />
                        <p className="text-xs text-muted-foreground mt-1">They must already have a Spotlighticket account — this is who gets paid.</p>
                      </div>
                      <div>
                        <Label htmlFor="coupon-commission">Commission per ticket (₦)</Label>
                        <Input
                          id="coupon-commission"
                          type="number"
                          min={0}
                          step="0.01"
                          placeholder="e.g. 500"
                          value={couponForm.commission_per_ticket}
                          onChange={(e) => setCouponForm({ ...couponForm, commission_per_ticket: e.target.value === '' ? '' : Number(e.target.value) })}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-2 mt-5 pt-4 border-t border-border">
                  <Button
                    variant="outline"
                    disabled={savingCoupon}
                    onClick={() => {
                      setShowCouponForm(false);
                      resetCouponForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSaveCoupon} disabled={savingCoupon}>
                    {savingCoupon ? 'Saving…' : editingCouponId ? 'Update coupon' : 'Create coupon'}
                  </Button>
                </div>
              </div>
            )}

            {coupons.length > 0 ? (
              <div className="space-y-3">
                {coupons.map((coupon) => (
                  <div key={coupon.id} className="p-4 rounded-xl border border-border">
                    <div className="flex flex-wrap justify-between items-start gap-3">
                      <div>
                        <h3 className="font-medium flex items-center gap-1.5">
                          <Tag className="w-4 h-4 text-primary" /> {coupon.code}
                          {!coupon.is_active && <Badge variant="outline">Disabled</Badge>}
                          {coupon.partner && <Badge>Partner code</Badge>}
                        </h3>
                        <div className="flex flex-wrap gap-4 text-sm mt-1">
                          <span className="font-semibold">
                            {coupon.discount_type === 'percentage' ? `${coupon.discount_value}% off` : `₦${Number(coupon.discount_value).toLocaleString('en-NG')} off`}
                          </span>
                          <span className="text-muted-foreground">
                            {coupon.used_count} used{coupon.max_uses ? ` / ${coupon.max_uses}` : ''}
                          </span>
                          {coupon.expires_at && (
                            <span className="text-muted-foreground">Expires {new Date(coupon.expires_at).toLocaleDateString()}</span>
                          )}
                        </div>
                        {coupon.partner && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Earns {coupon.partner.name} (<span className="break-all">{coupon.partner.email}</span>) ₦{Number(coupon.commission_per_ticket).toLocaleString('en-NG')} per ticket
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleToggleCouponActive(coupon)}>
                          {coupon.is_active ? 'Disable' : 'Enable'}
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => handleEditCoupon(coupon)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteCoupon(coupon.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-muted-foreground">No coupons yet. Create one to offer a discount!</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="font-display font-bold text-xl mb-4">Sold Tickets</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Attendee</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Update Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {soldTickets.map((ticket: any) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-mono text-xs">{ticket.code}</TableCell>
                    <TableCell className="font-medium">{ticket.user?.name || ticket.attendee_name || '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{ticket.variation?.name || 'General'}</TableCell>
                    <TableCell>
                      <Badge variant={ticket.status === 'checked_in' ? 'success' : (ticket.status === 'revoked' || ticket.status === 'invalid') ? 'destructive' : 'outline'}>
                        {ticket.status || 'valid'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2 flex-wrap">
                        <select
                          className="h-9 rounded-none border border-input bg-background px-2 text-sm"
                          value={ticket.status || 'valid'}
                          onChange={(e) => handleTicketStatusChange(ticket.id, e.target.value as any)}
                        >
                          <option value="valid">Valid</option>
                          <option value="checked_in">Checked</option>
                          <option value="invalid">Invalid</option>
                          <option value="revoked">Revoked</option>
                        </select>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteTicket(ticket.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {soldTickets.length === 0 && <p className="text-muted-foreground text-center py-8">No tickets sold yet.</p>}
            {ticketsPage.last_page > 1 && (
              <div className="flex flex-wrap items-center justify-between gap-2 pt-4">
                <span className="text-xs text-muted-foreground">Page {ticketsPage.current_page} of {ticketsPage.last_page}</span>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" disabled={ticketsPage.current_page <= 1} onClick={() => loadTickets(ticketsPage.current_page - 1)}>Previous</Button>
                  <Button variant="outline" size="sm" disabled={ticketsPage.current_page >= ticketsPage.last_page} onClick={() => loadTickets(ticketsPage.current_page + 1)}>Next</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
