'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { useAuth } from '@/components/AuthProvider';
import { isAdminLevelRole, hasPermission } from '@/lib/auth';
import { movies, Movie, MovieShowtime, MovieTicketTier, MovieAddon } from '@/lib/movies';
import type { SeatMapValue } from '@/lib/movies';
import { SeatMapBuilder } from '@/components/SeatMapBuilder';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, Edit2, Calendar, Building, Ticket, Popcorn, Clock, ChevronUp, ChevronDown } from 'lucide-react';
import { NairaSign } from '@/components/icons/NairaSign';

const MOVIE_TIER_PRESETS = ['Regular', 'VIP', 'Premium', 'Recliner'];

const emptyShowtimeForm = () => ({ date: '', time: '', hall_name: '', capacity: '', seat_map: { rows: [] } as SeatMapValue });
const emptyAddonForm = () => ({ name: '', type: 'snack' as 'snack' | 'drink', price: '', description: '' });
const emptyTierForm = () => ({ name: '', description: '', price: 0, quantity: 0 });

export default function OrganizerMovieDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const movieId = Number(params.id);

  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);

  const [showEdit, setShowEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [editForm, setEditForm] = useState({ title: '', tagline: '', city: '' });

  const [showtimes, setShowtimes] = useState<MovieShowtime[]>([]);
  const [showShowtimeForm, setShowShowtimeForm] = useState(false);
  const [editingShowtimeId, setEditingShowtimeId] = useState<number | null>(null);
  const [showtimeForm, setShowtimeForm] = useState(emptyShowtimeForm());
  const [showtimeError, setShowtimeError] = useState('');
  const [savingShowtime, setSavingShowtime] = useState(false);

  const [addons, setAddons] = useState<MovieAddon[]>([]);
  const [showAddonForm, setShowAddonForm] = useState(false);
  const [editingAddonId, setEditingAddonId] = useState<number | null>(null);
  const [addonForm, setAddonForm] = useState(emptyAddonForm());
  const [addonError, setAddonError] = useState('');
  const [savingAddon, setSavingAddon] = useState(false);

  const [tiers, setTiers] = useState<MovieTicketTier[]>([]);
  const [showTierForm, setShowTierForm] = useState(false);
  const [editingTierId, setEditingTierId] = useState<number | null>(null);
  const [tierForm, setTierForm] = useState(emptyTierForm());
  const [tierError, setTierError] = useState('');
  const [savingTier, setSavingTier] = useState(false);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    load();
  }, [params.id, user]);

  const load = async () => {
    try {
      const data = await movies.getOne(movieId);
      setMovie(data);
      setShowtimes(data.showtimes || []);
      setAddons(data.addons || []);
      setTiers(data.ticket_tiers || []);
    } catch (error) {
      console.error('Failed to load movie:', error);
    } finally {
      setLoading(false);
    }
  };

  const canManage = !!movie && (user?.id === movie.user_id || isAdminLevelRole(user?.role) || hasPermission(user, 'operations'));

  const handleOpenEdit = () => {
    if (!movie) return;
    setEditForm({ title: movie.title, tagline: movie.tagline || '', city: movie.city });
    setPosterFile(null);
    setShowEdit(true);
  };

  const handleSaveMovie = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = new FormData();
      data.append('title', editForm.title);
      data.append('tagline', editForm.tagline);
      data.append('city', editForm.city);
      if (posterFile) data.append('poster', posterFile);
      await movies.update(movieId, data);
      setShowEdit(false);
      await load();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to save movie');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMovie = async () => {
    if (!confirm('Delete this movie? This removes all its showtimes, tiers, and add-ons.')) return;
    try {
      await movies.delete(movieId);
      router.push('/organizer/movies');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete movie');
    }
  };

  // Showtimes
  const handleSaveShowtime = async () => {
    setShowtimeError('');
    if (!showtimeForm.date) { setShowtimeError('Pick a date.'); return; }
    if (!showtimeForm.time) { setShowtimeError('Pick a time.'); return; }
    if (!showtimeForm.hall_name.trim()) { setShowtimeError('Name the screen/hall.'); return; }
    const cap = Number(showtimeForm.capacity);
    if (!cap || cap < 1) { setShowtimeError('Enter a capacity of at least 1.'); return; }

    setSavingShowtime(true);
    try {
      const payload = {
        date: showtimeForm.date,
        time: showtimeForm.time,
        hall_name: showtimeForm.hall_name,
        capacity: cap,
        seat_map: showtimeForm.seat_map.rows.length > 0 ? showtimeForm.seat_map : null,
      };
      if (editingShowtimeId) {
        await movies.updateShowtime(movieId, editingShowtimeId, payload);
      } else {
        await movies.createShowtime(movieId, payload);
      }
      setShowtimeForm(emptyShowtimeForm());
      setEditingShowtimeId(null);
      setShowShowtimeForm(false);
      await load();
    } catch (error: any) {
      setShowtimeError(error.response?.data?.message || 'Failed to save showtime');
    } finally {
      setSavingShowtime(false);
    }
  };

  const handleEditShowtime = (s: MovieShowtime) => {
    setShowtimeForm({ date: s.date?.slice(0, 10) || '', time: s.time, hall_name: s.hall_name, capacity: String(s.capacity), seat_map: s.seat_map || { rows: [] } });
    setEditingShowtimeId(s.id);
    setShowtimeError('');
    setShowShowtimeForm(true);
  };

  const handleDeleteShowtime = async (id: number) => {
    if (!confirm('Delete this showtime?')) return;
    try {
      await movies.deleteShowtime(movieId, id);
      await load();
    } catch {
      alert('Failed to delete showtime');
    }
  };

  // Addons
  const handleSaveAddon = async () => {
    setAddonError('');
    if (!addonForm.name.trim()) { setAddonError('Name the snack or drink.'); return; }
    if (Number(addonForm.price) < 0) { setAddonError("Price can't be negative."); return; }

    setSavingAddon(true);
    try {
      const payload = { name: addonForm.name, type: addonForm.type, price: Number(addonForm.price), description: addonForm.description };
      if (editingAddonId) {
        await movies.updateAddon(movieId, editingAddonId, payload);
      } else {
        await movies.createAddon(movieId, payload);
      }
      setAddonForm(emptyAddonForm());
      setEditingAddonId(null);
      setShowAddonForm(false);
      await load();
    } catch (error: any) {
      setAddonError(error.response?.data?.message || 'Failed to save');
    } finally {
      setSavingAddon(false);
    }
  };

  const handleEditAddon = (a: MovieAddon) => {
    setAddonForm({ name: a.name, type: a.type, price: String(a.price), description: a.description || '' });
    setEditingAddonId(a.id);
    setAddonError('');
    setShowAddonForm(true);
  };

  const handleDeleteAddon = async (id: number) => {
    if (!confirm('Delete this snack/drink option?')) return;
    try {
      await movies.deleteAddon(movieId, id);
      await load();
    } catch {
      alert('Failed to delete');
    }
  };

  // Tiers
  const handleSaveTier = async () => {
    setTierError('');
    if (!tierForm.name.trim()) { setTierError('Pick or type a ticket tier name.'); return; }
    if (!tierForm.quantity || tierForm.quantity < 1) { setTierError('Enter a quantity of at least 1.'); return; }
    if (tierForm.price < 0) { setTierError("Price can't be negative."); return; }

    setSavingTier(true);
    try {
      const payload = { name: tierForm.name, description: tierForm.description, price: tierForm.price, quantity: tierForm.quantity };
      if (editingTierId) {
        await movies.updateTier(movieId, editingTierId, payload);
      } else {
        await movies.createTier(movieId, payload);
      }
      setTierForm(emptyTierForm());
      setEditingTierId(null);
      setShowTierForm(false);
      await load();
    } catch (error: any) {
      setTierError(error.response?.data?.message || 'Failed to save tier');
    } finally {
      setSavingTier(false);
    }
  };

  const handleEditTier = (t: MovieTicketTier) => {
    setTierForm({ name: t.name, description: t.description || '', price: t.price, quantity: t.quantity });
    setEditingTierId(t.id);
    setTierError('');
    setShowTierForm(true);
  };

  const handleDeleteTier = async (id: number) => {
    if (!confirm('Delete this ticket tier?')) return;
    try {
      await movies.deleteTier(movieId, id);
      await load();
    } catch {
      alert('Failed to delete tier');
    }
  };

  const handleMoveTier = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= tiers.length) return;
    const reordered = [...tiers];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    setTiers(reordered);
    try {
      await movies.reorderTiers(movieId, reordered.map((t) => t.id));
    } catch {
      alert('Failed to save the new order');
      await load();
    }
  };

  if (loading) {
    return (
      <DashboardShell title="Manage Movie">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-64 bg-muted rounded-xl" />
        </div>
      </DashboardShell>
    );
  }

  if (!movie) {
    return (
      <DashboardShell title="Manage Movie">
        <p className="text-muted-foreground">Movie not found</p>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title={movie.title} description="Manage showtimes, seating, add-ons, and ticket tiers">
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>&larr; Back to movies</Button>

        <Card>
          <CardContent className="p-6">
            <div className="flex flex-wrap justify-between items-start gap-3 mb-2">
              <h2 className="font-display font-bold text-xl">{movie.title}</h2>
              {canManage && (
                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="outline" size="sm" onClick={() => (showEdit ? setShowEdit(false) : handleOpenEdit())}>
                    <Edit2 className="w-4 h-4" /> {showEdit ? 'Cancel' : 'Edit'}
                  </Button>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleDeleteMovie}>
                    <Trash2 className="w-4 h-4" /> Delete
                  </Button>
                </div>
              )}
            </div>

            {showEdit ? (
              <form onSubmit={handleSaveMovie} className="space-y-5 mt-4 p-4 rounded-xl border border-border bg-muted/30">
                <div>
                  <Label htmlFor="edit-movie-title">Title *</Label>
                  <Input id="edit-movie-title" required value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-movie-tagline">Tagline</Label>
                    <Input id="edit-movie-tagline" value={editForm.tagline} onChange={(e) => setEditForm({ ...editForm, tagline: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="edit-movie-city">City *</Label>
                    <Input id="edit-movie-city" required value={editForm.city} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-movie-poster">Replace poster (optional)</Label>
                  <input id="edit-movie-poster" type="file" accept="image/*" onChange={(e) => setPosterFile(e.target.files?.[0] || null)} className="w-full text-sm" />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</Button>
                  <Button type="button" variant="outline" onClick={() => setShowEdit(false)}>Cancel</Button>
                </div>
              </form>
            ) : (
              <div className="grid sm:grid-cols-3 gap-4 mt-2">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Tagline</p>
                  <p className="font-medium text-sm">{movie.tagline || '—'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">City</p>
                  <p className="font-medium text-sm">{movie.city}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Showtimes */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
              <div>
                <h2 className="font-display font-bold text-lg">Showtimes</h2>
                <p className="text-sm text-muted-foreground mt-1">Date, time, screen/hall, capacity, and seat arrangement</p>
              </div>
              <Button size="sm" onClick={() => { setShowShowtimeForm(!showShowtimeForm); setEditingShowtimeId(null); setShowtimeError(''); setShowtimeForm(emptyShowtimeForm()); }}>
                <Plus className="w-4 h-4" /> Add showtime
              </Button>
            </div>

            {showShowtimeForm && (
              <div className="p-5 sm:p-6 mb-6 rounded-xl border border-primary/30 bg-muted/30 space-y-4">
                {showtimeError && (
                  <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-sm">{showtimeError}</div>
                )}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="st-date">Date *</Label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input id="st-date" type="date" value={showtimeForm.date} onChange={(e) => setShowtimeForm({ ...showtimeForm, date: e.target.value })} className="pl-12" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="st-time">Time *</Label>
                    <Input id="st-time" type="time" value={showtimeForm.time} onChange={(e) => setShowtimeForm({ ...showtimeForm, time: e.target.value })} />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="st-hall">Screen / hall *</Label>
                    <div className="relative">
                      <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="st-hall" value={showtimeForm.hall_name} onChange={(e) => setShowtimeForm({ ...showtimeForm, hall_name: e.target.value })} className="pl-10" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="st-capacity">Capacity *</Label>
                    <Input id="st-capacity" type="number" min="1" value={showtimeForm.capacity} onChange={(e) => setShowtimeForm({ ...showtimeForm, capacity: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label>Seat arrangement</Label>
                  <div className="mt-1.5">
                    <SeatMapBuilder
                      capacity={Number(showtimeForm.capacity) || 0}
                      tierPresets={MOVIE_TIER_PRESETS}
                      value={showtimeForm.seat_map}
                      onChange={(seat_map) => setShowtimeForm({ ...showtimeForm, seat_map })}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" disabled={savingShowtime} onClick={() => { setShowShowtimeForm(false); setEditingShowtimeId(null); }}>Cancel</Button>
                  <Button onClick={handleSaveShowtime} disabled={savingShowtime}>{savingShowtime ? 'Saving…' : editingShowtimeId ? 'Update showtime' : 'Create showtime'}</Button>
                </div>
              </div>
            )}

            {showtimes.length > 0 ? (
              <div className="space-y-3">
                {showtimes.map((s) => (
                  <div key={s.id} className="p-4 rounded-xl border border-border flex flex-wrap justify-between items-start gap-3">
                    <div className="flex items-start gap-2">
                      <Clock className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <div>
                        <h3 className="font-medium">{s.hall_name} &middot; {new Date(s.date).toLocaleDateString()} {s.time}</h3>
                        <p className="text-sm text-muted-foreground">{s.seat_count ?? s.capacity} seats {s.seat_map ? '· seat map set' : '· no seat map yet'}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon" onClick={() => handleEditShowtime(s)}><Edit2 className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteShowtime(s.id)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10"><p className="text-muted-foreground">No showtimes yet.</p></div>
            )}
          </CardContent>
        </Card>

        {/* Snacks & Drinks */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
              <div>
                <h2 className="font-display font-bold text-lg">Snacks & Drinks</h2>
                <p className="text-sm text-muted-foreground mt-1">Add-ons buyers can pick up alongside their ticket</p>
              </div>
              <Button size="sm" onClick={() => { setShowAddonForm(!showAddonForm); setEditingAddonId(null); setAddonError(''); setAddonForm(emptyAddonForm()); }}>
                <Plus className="w-4 h-4" /> Add snack/drink
              </Button>
            </div>

            {showAddonForm && (
              <div className="p-5 sm:p-6 mb-6 rounded-xl border border-primary/30 bg-muted/30">
                {addonError && (
                  <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-sm">{addonError}</div>
                )}
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="ad-name">Name *</Label>
                    <Input id="ad-name" value={addonForm.name} onChange={(e) => setAddonForm({ ...addonForm, name: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="ad-type">Type *</Label>
                    <select id="ad-type" className="w-full h-11 rounded-xl border border-input bg-background px-4 text-sm" value={addonForm.type} onChange={(e) => setAddonForm({ ...addonForm, type: e.target.value as 'snack' | 'drink' })}>
                      <option value="snack">Snack</option>
                      <option value="drink">Drink</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="ad-price">Price *</Label>
                    <div className="relative">
                      <NairaSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="ad-price" type="number" min="0" step="0.01" value={addonForm.price} onChange={(e) => setAddonForm({ ...addonForm, price: e.target.value })} className="pl-10" />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" disabled={savingAddon} onClick={() => { setShowAddonForm(false); setEditingAddonId(null); }}>Cancel</Button>
                  <Button onClick={handleSaveAddon} disabled={savingAddon}>{savingAddon ? 'Saving…' : editingAddonId ? 'Update' : 'Add to menu'}</Button>
                </div>
              </div>
            )}

            {addons.length > 0 ? (
              <div className="space-y-3">
                {addons.map((a) => (
                  <div key={a.id} className="p-4 rounded-xl border border-border flex flex-wrap justify-between items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Popcorn className="w-4 h-4 text-primary shrink-0" />
                      <div>
                        <h3 className="font-medium">{a.name} <span className="text-xs text-muted-foreground capitalize">({a.type})</span></h3>
                        <p className="text-sm text-muted-foreground">{a.price === 0 ? 'Free' : `₦${a.price.toLocaleString('en-NG')}`}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon" onClick={() => handleEditAddon(a)}><Edit2 className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteAddon(a.id)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10"><p className="text-muted-foreground">No snacks or drinks yet.</p></div>
            )}
          </CardContent>
        </Card>

        {/* Ticket Tiers */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
              <div>
                <h2 className="font-display font-bold text-lg">Ticket Tiers</h2>
                <p className="text-sm text-muted-foreground mt-1">Priced ticket types buyers choose between</p>
              </div>
              <Button size="sm" onClick={() => { setShowTierForm(!showTierForm); setEditingTierId(null); setTierError(''); setTierForm(emptyTierForm()); }}>
                <Plus className="w-4 h-4" /> Add tier
              </Button>
            </div>

            {showTierForm && (
              <div className="p-5 sm:p-6 mb-6 rounded-xl border border-primary/30 bg-muted/30">
                {tierError && (
                  <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-sm">{tierError}</div>
                )}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="mt-name">Tier *</Label>
                    <select id="mt-name" className="w-full h-11 rounded-xl border border-input bg-background px-4 text-sm" value={tierForm.name} onChange={(e) => setTierForm({ ...tierForm, name: e.target.value })}>
                      <option value="">Select tier</option>
                      {MOVIE_TIER_PRESETS.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="mt-price">Price *</Label>
                    <div className="relative">
                      <NairaSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="mt-price" type="number" min="0" step="0.01" value={tierForm.price} onChange={(e) => setTierForm({ ...tierForm, price: Number(e.target.value) })} className="pl-10" />
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <Label htmlFor="mt-quantity">Quantity available *</Label>
                  <Input id="mt-quantity" type="number" min="1" value={tierForm.quantity} onChange={(e) => setTierForm({ ...tierForm, quantity: Number(e.target.value) })} />
                </div>
                <div className="mt-4">
                  <Label htmlFor="mt-description">Description (optional)</Label>
                  <textarea id="mt-description" rows={2} className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm" value={tierForm.description} onChange={(e) => setTierForm({ ...tierForm, description: e.target.value })} />
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" disabled={savingTier} onClick={() => { setShowTierForm(false); setEditingTierId(null); }}>Cancel</Button>
                  <Button onClick={handleSaveTier} disabled={savingTier}>{savingTier ? 'Saving…' : editingTierId ? 'Update tier' : 'Create tier'}</Button>
                </div>
              </div>
            )}

            {tiers.length > 0 ? (
              <div className="space-y-3">
                {tiers.map((t, index) => (
                  <div key={t.id} className="p-4 rounded-xl border border-border flex flex-wrap justify-between items-start gap-3">
                    <div className="flex items-start gap-2">
                      {tiers.length > 1 && (
                        <div className="flex flex-col shrink-0 -mt-1">
                          <Button variant="ghost" size="icon" className="h-6 w-6" disabled={index === 0} onClick={() => handleMoveTier(index, -1)}><ChevronUp className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6" disabled={index === tiers.length - 1} onClick={() => handleMoveTier(index, 1)}><ChevronDown className="w-4 h-4" /></Button>
                        </div>
                      )}
                      <div>
                        <h3 className="font-medium flex items-center gap-1.5"><Ticket className="w-4 h-4 text-primary" /> {t.name}</h3>
                        <p className="text-sm text-muted-foreground mb-1">{t.description}</p>
                        <div className="flex gap-4 text-sm">
                          <span className="font-semibold">₦{t.price.toLocaleString('en-NG', { maximumFractionDigits: 0 })}</span>
                          <span className="text-muted-foreground">{t.available_quantity} / {t.quantity} available</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon" onClick={() => handleEditTier(t)}><Edit2 className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteTier(t.id)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10"><p className="text-muted-foreground">No ticket tiers yet.</p></div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
