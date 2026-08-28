'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { useAuth } from '@/components/AuthProvider';
import { isAdminLevelRole, hasPermission } from '@/lib/auth';
import { venues, Venue, VenuePricingTier } from '@/lib/venues';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, Edit2, Calendar, MapPin, BookText } from 'lucide-react';
import { NairaSign } from '@/components/icons/NairaSign';

const emptyTierForm = () => ({ name: '', description: '', price: 0 });

export default function OrganizerVenueDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const venueId = Number(params.id);

  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);

  const [showEdit, setShowEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [editForm, setEditForm] = useState({
    name: '', tagline: '', description: '', location: '', city: '',
    available_from: '', available_to: '', daily_open_time: '', daily_close_time: '',
  });

  const [tiers, setTiers] = useState<VenuePricingTier[]>([]);
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
      const data = await venues.getOne(venueId);
      setVenue(data);
      setTiers(data.pricing_tiers || []);
    } catch (error) {
      console.error('Failed to load venue:', error);
    } finally {
      setLoading(false);
    }
  };

  const canManage = !!venue && (user?.id === venue.user_id || isAdminLevelRole(user?.role) || hasPermission(user, 'operations'));

  const handleOpenEdit = () => {
    if (!venue) return;
    setEditForm({
      name: venue.name,
      tagline: venue.tagline || '',
      description: venue.description || '',
      location: venue.location || '',
      city: venue.city,
      available_from: venue.available_from?.slice(0, 10) || '',
      available_to: venue.available_to?.slice(0, 10) || '',
      daily_open_time: venue.daily_open_time || '',
      daily_close_time: venue.daily_close_time || '',
    });
    setCoverFile(null);
    setShowEdit(true);
  };

  const handleSaveVenue = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = new FormData();
      data.append('name', editForm.name);
      data.append('tagline', editForm.tagline);
      data.append('description', editForm.description);
      data.append('location', editForm.location);
      data.append('city', editForm.city);
      if (editForm.available_from) data.append('available_from', editForm.available_from);
      if (editForm.available_to) data.append('available_to', editForm.available_to);
      if (editForm.daily_open_time) data.append('daily_open_time', editForm.daily_open_time);
      if (editForm.daily_close_time) data.append('daily_close_time', editForm.daily_close_time);
      if (coverFile) data.append('cover_image', coverFile);
      await venues.update(venueId, data);
      setShowEdit(false);
      await load();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to save venue');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteVenue = async () => {
    if (!confirm('Delete this venue? This removes its pricing tiers too.')) return;
    try {
      await venues.delete(venueId);
      router.push('/organizer/venues');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete venue');
    }
  };

  const handleSaveTier = async () => {
    setTierError('');
    if (!tierForm.name.trim()) { setTierError('Name this pricing tier.'); return; }
    if (tierForm.price < 0) { setTierError("Price can't be negative."); return; }

    setSavingTier(true);
    try {
      if (editingTierId) {
        await venues.updateTier(venueId, editingTierId, tierForm);
      } else {
        await venues.createTier(venueId, tierForm);
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

  const handleEditTier = (t: VenuePricingTier) => {
    setTierForm({ name: t.name, description: t.description || '', price: t.price });
    setEditingTierId(t.id);
    setTierError('');
    setShowTierForm(true);
  };

  const handleDeleteTier = async (id: number) => {
    if (!confirm('Delete this pricing tier?')) return;
    try {
      await venues.deleteTier(venueId, id);
      await load();
    } catch {
      alert('Failed to delete tier');
    }
  };

  if (loading) {
    return (
      <DashboardShell title="Manage Venue">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-64 bg-muted rounded-xl" />
        </div>
      </DashboardShell>
    );
  }

  if (!venue) {
    return (
      <DashboardShell title="Manage Venue">
        <p className="text-muted-foreground">Venue not found</p>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title={venue.name} description="Manage availability and pricing tiers">
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>&larr; Back to venues</Button>

        <Card>
          <CardContent className="p-6">
            <div className="flex flex-wrap justify-between items-start gap-3 mb-2">
              <h2 className="font-display font-bold text-xl">{venue.name}</h2>
              {canManage && (
                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="outline" size="sm" onClick={() => (showEdit ? setShowEdit(false) : handleOpenEdit())}>
                    <Edit2 className="w-4 h-4" /> {showEdit ? 'Cancel' : 'Edit'}
                  </Button>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleDeleteVenue}>
                    <Trash2 className="w-4 h-4" /> Delete
                  </Button>
                </div>
              )}
            </div>

            {showEdit ? (
              <form onSubmit={handleSaveVenue} className="space-y-5 mt-4 p-4 rounded-xl border border-border bg-muted/30">
                <div>
                  <Label htmlFor="edit-venue-name">Name *</Label>
                  <Input id="edit-venue-name" required value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="edit-venue-tagline">Tagline</Label>
                  <Input id="edit-venue-tagline" value={editForm.tagline} onChange={(e) => setEditForm({ ...editForm, tagline: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="edit-venue-description">Description</Label>
                  <textarea id="edit-venue-description" rows={3} className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-venue-location">Address</Label>
                    <Input id="edit-venue-location" value={editForm.location} onChange={(e) => setEditForm({ ...editForm, location: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="edit-venue-city">City *</Label>
                    <Input id="edit-venue-city" required value={editForm.city} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-available-from">Available from</Label>
                    <Input id="edit-available-from" type="date" value={editForm.available_from} onChange={(e) => setEditForm({ ...editForm, available_from: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="edit-available-to">Available to</Label>
                    <Input id="edit-available-to" type="date" value={editForm.available_to} onChange={(e) => setEditForm({ ...editForm, available_to: e.target.value })} />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-open-time">Daily open time</Label>
                    <Input id="edit-open-time" type="time" value={editForm.daily_open_time} onChange={(e) => setEditForm({ ...editForm, daily_open_time: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="edit-close-time">Daily close time</Label>
                    <Input id="edit-close-time" type="time" value={editForm.daily_close_time} onChange={(e) => setEditForm({ ...editForm, daily_close_time: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-venue-cover">Replace cover image (optional)</Label>
                  <input id="edit-venue-cover" type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files?.[0] || null)} className="w-full text-sm" />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</Button>
                  <Button type="button" variant="outline" onClick={() => setShowEdit(false)}>Cancel</Button>
                </div>
              </form>
            ) : (
              <>
                {venue.description && <p className="text-sm text-muted-foreground mb-4">{venue.description}</p>}
                <div className="grid sm:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> Location</p>
                    <p className="font-medium text-sm">{venue.location || '—'}, {venue.city}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> Available</p>
                    <p className="font-medium text-sm">{venue.available_from ? new Date(venue.available_from).toLocaleDateString() : 'Any date'} {venue.available_to ? `– ${new Date(venue.available_to).toLocaleDateString()}` : ''}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Daily hours</p>
                    <p className="font-medium text-sm">{venue.daily_open_time && venue.daily_close_time ? `${venue.daily_open_time} – ${venue.daily_close_time}` : '—'}</p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Pricing tiers */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
              <div>
                <h2 className="font-display font-bold text-lg">Pricing Tiers</h2>
                <p className="text-sm text-muted-foreground mt-1">Rate options buyers choose from</p>
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
                    <Label htmlFor="vt-name">Tier name *</Label>
                    <Input id="vt-name" placeholder="Full Day" value={tierForm.name} onChange={(e) => setTierForm({ ...tierForm, name: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="vt-price">Price *</Label>
                    <div className="relative">
                      <NairaSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="vt-price" type="number" min="0" step="0.01" value={tierForm.price} onChange={(e) => setTierForm({ ...tierForm, price: Number(e.target.value) })} className="pl-10" />
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <Label htmlFor="vt-description">Description (optional)</Label>
                  <textarea id="vt-description" rows={2} className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm" value={tierForm.description} onChange={(e) => setTierForm({ ...tierForm, description: e.target.value })} />
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" disabled={savingTier} onClick={() => { setShowTierForm(false); setEditingTierId(null); }}>Cancel</Button>
                  <Button onClick={handleSaveTier} disabled={savingTier}>{savingTier ? 'Saving…' : editingTierId ? 'Update tier' : 'Create tier'}</Button>
                </div>
              </div>
            )}

            {tiers.length > 0 ? (
              <div className="space-y-3">
                {tiers.map((t) => (
                  <div key={t.id} className="p-4 rounded-xl border border-border flex flex-wrap justify-between items-start gap-3">
                    <div>
                      <h3 className="font-medium flex items-center gap-1.5"><BookText className="w-4 h-4 text-primary" /> {t.name}</h3>
                      <p className="text-sm text-muted-foreground mb-1">{t.description}</p>
                      <span className="font-semibold text-sm">₦{t.price.toLocaleString('en-NG', { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon" onClick={() => handleEditTier(t)}><Edit2 className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteTier(t.id)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10"><p className="text-muted-foreground">No pricing tiers yet.</p></div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
