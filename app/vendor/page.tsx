'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { useAuth } from '@/components/AuthProvider';
import { vendors, Vendor } from '@/lib/vendors';
import { storageUrl } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Store, Clock, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';

const CATEGORY_PRESETS = ['Photography', 'Catering', 'Decor & Styling', 'DJ & Entertainment', 'Makeup & Beauty', 'Event Planning', 'Furniture & Rentals', 'Sound & Lighting', 'Other'];

export default function VendorMyListingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [form, setForm] = useState({
    name: '', category: '', description: '', city: '', contact_email: '', contact_phone: '', website: '', instagram: '',
  });

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (user.role !== 'vendor') { router.push('/dashboard'); return; }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const load = async () => {
    try {
      const data = await vendors.getMyListing();
      setVendor(data);
      setForm({
        name: data.name, category: data.category, description: data.description || '', city: data.city,
        contact_email: data.contact_email, contact_phone: data.contact_phone || '', website: data.website || '', instagram: data.instagram || '',
      });
    } catch (error) {
      console.error('Failed to load listing:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setSaving(true);
    try {
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => data.append(key, value));
      if (coverImage) data.append('cover_image', coverImage);

      const updated = await vendors.updateMyListing(data);
      setVendor(updated);
      setCoverImage(null);
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardShell title="My Listing">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-64 bg-muted rounded-xl" />
        </div>
      </DashboardShell>
    );
  }

  if (!vendor) {
    return (
      <DashboardShell title="My Listing">
        <p className="text-muted-foreground">No listing found for this account.</p>
      </DashboardShell>
    );
  }

  const cover = storageUrl(vendor.cover_image);

  return (
    <DashboardShell title="My Listing" description="Edit your directory listing">
      <div className="max-w-2xl space-y-6">
        <div className="flex items-center gap-3">
          {vendor.is_published ? (
            <Badge variant="default"><CheckCircle2 className="w-3 h-3" /> Live in the directory</Badge>
          ) : (
            <Badge variant="secondary"><Clock className="w-3 h-3" /> Pending review</Badge>
          )}
        </div>

        {!vendor.is_published && (
          <div className="p-4 rounded-xl border border-border bg-muted/30 text-sm text-muted-foreground">
            Your listing isn't public yet — our team reviews new and edited listings before they go live. Any change you save here goes back into review.
          </div>
        )}

        {cover && (
          <div className="relative aspect-[16/8] rounded-xl overflow-hidden bg-muted">
            <Image src={cover} alt={vendor.name} fill className="object-cover" />
          </div>
        )}

        <Card>
          <CardContent className="p-6">
            {error && (
              <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-sm">{error}</div>
            )}
            {success && (
              <div className="mb-4 p-3 bg-primary/10 border border-primary/30 rounded-xl text-sm">Saved — your listing is back in review.</div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="v-name">Business name *</Label>
                  <Input id="v-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="v-category">Category *</Label>
                  <select
                    id="v-category"
                    required
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full h-11 rounded-xl border border-input bg-background/50 px-4 text-sm"
                  >
                    <option value="">Select category</option>
                    {CATEGORY_PRESETS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <Label htmlFor="v-description">Description</Label>
                <textarea
                  id="v-description"
                  rows={4}
                  className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="v-city">City *</Label>
                <Input id="v-city" required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="v-contact-email">Contact email *</Label>
                  <Input id="v-contact-email" type="email" required value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="v-contact-phone">Contact phone</Label>
                  <Input id="v-contact-phone" value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="v-website">Website</Label>
                  <Input id="v-website" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="v-instagram">Instagram</Label>
                  <Input id="v-instagram" value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} />
                </div>
              </div>
              <div>
                <Label htmlFor="v-cover">Replace cover image</Label>
                <input id="v-cover" type="file" accept="image/*" onChange={(e) => setCoverImage(e.target.files?.[0] || null)} className="w-full text-sm mt-1.5" />
              </div>
              <Button type="submit" disabled={saving}>
                <Store className="w-4 h-4" /> {saving ? 'Saving…' : 'Save changes'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
