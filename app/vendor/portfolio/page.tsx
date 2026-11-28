'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import { Plus, Trash2, LayoutGrid } from 'lucide-react';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Loader } from '@/components/Loader';
import { shop, PortfolioItem } from '@/lib/shop';

/** Vendor: past work shown on the storefront's Portfolio tab. */
export default function VendorPortfolioPage() {
  const [items, setItems] = useState<PortfolioItem[] | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [fileKey, setFileKey] = useState(0);

  useEffect(() => {
    shop.myPortfolio().then(setItems).catch(() => setItems([]));
  }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image) {
      toast.error('Choose a photo');
      return;
    }
    setSaving(true);
    try {
      const data = new FormData();
      data.append('title', title.trim());
      data.append('description', description);
      data.append('image', image);
      const created = await shop.addPortfolio(data);
      setItems((prev) => [...(prev ?? []), created]);
      setTitle('');
      setDescription('');
      setImage(null);
      setFileKey((k) => k + 1); // clears the file input
      toast.success('Added to your portfolio');
    } catch (err: any) {
      const errors = err.response?.data?.errors;
      toast.error(errors ? (Object.values(errors)[0] as string[])[0] : err.response?.data?.message || 'Could not add');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item: PortfolioItem) => {
    if (!window.confirm(`Remove "${item.title}"?`)) return;
    await shop.deletePortfolio(item.id);
    setItems((prev) => (prev ?? []).filter((i) => i.id !== item.id));
  };

  return (
    <DashboardShell title="Portfolio" description="Show buyers your past work: events you've supplied, setups, happy customers.">
      <div className="grid lg:grid-cols-3 gap-6 items-start">
        <Card className="lg:col-span-1">
          <CardContent className="p-6">
            <form onSubmit={add} className="space-y-4">
              <h2 className="font-display font-bold text-lg flex items-center gap-2"><Plus className="w-5 h-5" /> Add work</h2>
              <div>
                <Label htmlFor="pf-image">Photo *</Label>
                <input key={fileKey} id="pf-image" type="file" accept="image/jpeg,image/png,image/webp" required onChange={(e) => setImage(e.target.files?.[0] ?? null)}
                  className="block w-full text-sm text-muted-foreground file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-primary file:text-primary-foreground file:cursor-pointer" />
              </div>
              <div>
                <Label htmlFor="pf-title">Title *</Label>
                <Input id="pf-title" required maxLength={150} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Pool party, Lekki, March 2026" />
              </div>
              <div>
                <Label htmlFor="pf-desc">Description</Label>
                <textarea id="pf-desc" rows={3} maxLength={2000} value={description} onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <Button type="submit" disabled={saving}>{saving ? 'Adding…' : 'Add to portfolio'}</Button>
            </form>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          {!items ? (
            <div className="py-16 flex justify-center"><Loader size={32} /></div>
          ) : items.length === 0 ? (
            <Card><CardContent className="p-10 text-center text-muted-foreground"><LayoutGrid className="w-8 h-8 mx-auto mb-2" /> Nothing here yet.</CardContent></Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {items.map((item) => (
                <div key={item.id} className="group">
                  <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-muted">
                    <Image src={item.image_url} alt={item.title} fill sizes="300px" className="object-cover" />
                    <button type="button" onClick={() => remove(item)} aria-label="Remove"
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-background/90 inline-flex items-center justify-center text-destructive"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  <p className="mt-2 text-sm font-medium">{item.title}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
