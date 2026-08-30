'use client';

import { useState, useEffect } from 'react';
import { vendorInquiries, VendorInquiry } from '@/lib/vendorInquiries';
import { vendors as vendorsApi, Vendor } from '@/lib/vendors';
import { storageUrl } from '@/lib/storage';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { TableSkeleton } from '@/components/dashboard/TableSkeleton';
import { Mail, Phone, MapPin, Plus, Edit2, Trash2, Store, Globe, Instagram } from 'lucide-react';

const CATEGORY_PRESETS = ['Photography', 'Catering', 'Decor & Styling', 'DJ & Entertainment', 'Makeup & Beauty', 'Event Planning', 'Furniture & Rentals', 'Sound & Lighting', 'Other'];

const emptyForm = () => ({
  name: '', category: '', description: '', city: '', contact_email: '', contact_phone: '', website: '', instagram: '', is_published: true,
});

export function VendorsTab() {
  const [view, setView] = useState<'inquiries' | 'directory'>('inquiries');

  const [statusFilter, setStatusFilter] = useState('');
  const [list, setList] = useState<VendorInquiry[]>([]);
  const [loading, setLoading] = useState(true);

  const [directory, setDirectory] = useState<Vendor[]>([]);
  const [loadingDirectory, setLoadingDirectory] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Vendor | null>(null);
  const [deleting, setDeleting] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const data = await vendorInquiries.list({ status: statusFilter || undefined });
      setList(data.data || data);
    } finally {
      setLoading(false);
    }
  };

  const refreshDirectory = async () => {
    setLoadingDirectory(true);
    try {
      const data = await vendorsApi.adminGetAll();
      setDirectory(data.data || []);
    } catch (error) {
      console.error('Failed to load vendor directory:', error);
    } finally {
      setLoadingDirectory(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  useEffect(() => {
    if (view === 'directory') refreshDirectory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  const handleStatusChange = async (id: number, status: 'new' | 'contacted' | 'closed') => {
    await vendorInquiries.updateStatus(id, status);
    await refresh();
  };

  const statusBadge = (status: string) => {
    if (status === 'contacted') return <Badge variant="secondary">Contacted</Badge>;
    if (status === 'closed') return <Badge variant="outline">Closed</Badge>;
    return <Badge variant="default">New</Badge>;
  };

  const openCreateForm = (fromInquiry?: VendorInquiry) => {
    setEditingId(null);
    setCoverImage(null);
    setFormError('');
    setForm(fromInquiry ? {
      ...emptyForm(),
      name: fromInquiry.business_name,
      city: fromInquiry.location || '',
      contact_email: fromInquiry.email,
      contact_phone: fromInquiry.phone || '',
      description: fromInquiry.message,
    } : emptyForm());
    setShowForm(true);
    setView('directory');
  };

  const openEditForm = (v: Vendor) => {
    setEditingId(v.id);
    setCoverImage(null);
    setFormError('');
    setForm({
      name: v.name, category: v.category, description: v.description || '', city: v.city,
      contact_email: v.contact_email, contact_phone: v.contact_phone || '', website: v.website || '',
      instagram: v.instagram || '', is_published: v.is_published,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    setFormError('');
    if (!form.name.trim() || !form.category.trim() || !form.city.trim() || !form.contact_email.trim()) {
      setFormError('Name, category, city, and contact email are required.');
      return;
    }
    setSaving(true);
    try {
      const data = new FormData();
      data.append('name', form.name);
      data.append('category', form.category);
      data.append('description', form.description);
      data.append('city', form.city);
      data.append('contact_email', form.contact_email);
      data.append('contact_phone', form.contact_phone);
      data.append('website', form.website);
      data.append('instagram', form.instagram);
      data.append('is_published', form.is_published ? '1' : '0');
      if (coverImage) data.append('cover_image', coverImage);

      if (editingId) {
        await vendorsApi.update(editingId, data);
      } else {
        await vendorsApi.create(data);
      }
      setShowForm(false);
      setEditingId(null);
      await refreshDirectory();
    } catch (error: any) {
      setFormError(error.response?.data?.message || 'Failed to save vendor listing');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await vendorsApi.delete(deleteTarget.id);
      setDeleteTarget(null);
      await refreshDirectory();
    } catch {
      toast.error('Failed to delete vendor listing');
    } finally {
      setDeleting(false);
    }
  };

  const togglePublished = async (v: Vendor) => {
    const data = new FormData();
    data.append('is_published', v.is_published ? '0' : '1');
    try {
      await vendorsApi.update(v.id, data);
      await refreshDirectory();
    } catch {
      toast.error('Failed to update listing');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setView('inquiries')}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${view === 'inquiries' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}
        >
          Inquiries
        </button>
        <button
          onClick={() => setView('directory')}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${view === 'directory' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}
        >
          Directory Listings
        </button>
      </div>

      {view === 'inquiries' && (
        <>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Status:</span>
            <select
              className="h-10 rounded-none border border-input bg-background px-2 text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="closed">Closed</option>
            </select>
            <Button variant="outline" size="sm" onClick={refresh}>Refresh</Button>
          </div>

          {loading && <TableSkeleton rows={5} cols={4} />}
          {!loading && list.length === 0 && (
            <p className="text-muted-foreground text-sm text-center py-12">No vendor inquiries yet.</p>
          )}

          <div className="space-y-3">
            {list.map((v) => (
              <Card key={v.id}>
                <CardContent className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold">{v.business_name}</p>
                        {statusBadge(v.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">{v.contact_name}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {v.email}</span>
                        {v.phone && <span className="inline-flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {v.phone}</span>}
                        {v.location && <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {v.location}</span>}
                      </div>
                      <p className="text-sm mt-3 whitespace-pre-wrap">{v.message}</p>
                      <p className="text-xs text-muted-foreground mt-2">Submitted {new Date(v.created_at).toLocaleString()}</p>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <Button size="sm" variant="outline" onClick={() => openCreateForm(v)}>
                        <Plus className="w-3.5 h-3.5" /> Add to directory
                      </Button>
                      <div className="flex items-center gap-2">
                        {v.status !== 'contacted' && (
                          <Button size="sm" variant="outline" onClick={() => handleStatusChange(v.id, 'contacted')}>Mark Contacted</Button>
                        )}
                        {v.status !== 'closed' && (
                          <Button size="sm" variant="ghost" onClick={() => handleStatusChange(v.id, 'closed')}>Close</Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {view === 'directory' && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Public listings shown on /vendors. Not tied to inquiries — create or edit freely.</p>
            <Button size="sm" onClick={() => (showForm ? setShowForm(false) : openCreateForm())}>
              {showForm ? 'Cancel' : <><Plus className="w-4 h-4" /> Add listing</>}
            </Button>
          </div>

          {showForm && (
            <Card>
              <CardContent className="p-5 space-y-4">
                {formError && (
                  <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-sm">{formError}</div>
                )}
                <div className="grid md:grid-cols-2 gap-3">
                  <Input placeholder="Business name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  <select
                    className="h-11 rounded-none border border-input bg-background px-3 text-sm"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  >
                    <option value="">Select category *</option>
                    {CATEGORY_PRESETS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <textarea
                  placeholder="Description"
                  rows={3}
                  className="w-full rounded-none border border-input bg-background px-3 py-2 text-sm"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
                <div className="grid md:grid-cols-2 gap-3">
                  <Input placeholder="City *" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                  <Input placeholder="Contact email *" type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} />
                </div>
                <div className="grid md:grid-cols-3 gap-3">
                  <Input placeholder="Contact phone" value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} />
                  <Input placeholder="Website" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
                  <Input placeholder="Instagram" value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Cover image</label>
                  <input type="file" accept="image/*" onChange={(e) => setCoverImage(e.target.files?.[0] || null)} className="text-sm" />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} />
                  Published (visible on the public directory)
                </label>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowForm(false)} disabled={saving}>Cancel</Button>
                  <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : editingId ? 'Update listing' : 'Create listing'}</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {loadingDirectory && <TableSkeleton rows={5} cols={4} />}
          {!loadingDirectory && directory.length === 0 && (
            <p className="text-muted-foreground text-sm text-center py-12">No directory listings yet.</p>
          )}

          <div className="space-y-3">
            {directory.map((v) => (
              <Card key={v.id}>
                <CardContent className="p-5 flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    {v.cover_image ? (
                      <img src={storageUrl(v.cover_image) || undefined} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0 border border-border" />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-muted shrink-0 flex items-center justify-center text-muted-foreground">
                        <Store className="w-5 h-5" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold flex items-center gap-1.5"><Store className="w-4 h-4 text-primary" /> {v.name}</p>
                        <Badge variant="outline">{v.category}</Badge>
                        {!v.is_published && <Badge variant="secondary">Unpublished</Badge>}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {v.city}</span>
                        <span className="inline-flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {v.contact_email}</span>
                        {v.website && <span className="inline-flex items-center gap-1"><Globe className="w-3.5 h-3.5" /> {v.website}</span>}
                        {v.instagram && <span className="inline-flex items-center gap-1"><Instagram className="w-3.5 h-3.5" /> {v.instagram}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button size="sm" variant="outline" onClick={() => togglePublished(v)}>{v.is_published ? 'Unpublish' : 'Publish'}</Button>
                    <Button size="sm" variant="outline" onClick={() => openEditForm(v)}><Edit2 className="w-3.5 h-3.5" /></Button>
                    <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setDeleteTarget(v)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete this vendor listing?"
        description={deleteTarget ? `"${deleteTarget.name}" will be permanently removed from the public directory.` : undefined}
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
