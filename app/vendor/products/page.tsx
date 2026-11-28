'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, X, ImagePlus, ArrowLeft, ShoppingBag, EyeOff } from 'lucide-react';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader } from '@/components/Loader';
import { shop, Product, naira, num } from '@/lib/shop';

const MAX_PHOTOS = 8;

type Photo = { kind: 'kept'; path: string; url: string } | { kind: 'new'; file: File; url: string };

const emptyForm = { name: '', description: '', category: '', price: '', compare_at_price: '', stock: '', is_active: true };

/** Vendor: list, add and edit products with up to 8 photos each. */
export default function VendorProductsPage() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [editing, setEditing] = useState<Product | 'new' | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [saving, setSaving] = useState(false);

  const load = () => shop.myProducts().then(setProducts).catch(() => setProducts([]));
  useEffect(() => {
    load();
  }, []);

  const open = (p: Product | 'new') => {
    setEditing(p);
    if (p === 'new') {
      setForm(emptyForm);
      setPhotos([]);
    } else {
      setForm({
        name: p.name,
        description: p.description ?? '',
        category: p.category ?? '',
        price: String(num(p.price)),
        compare_at_price: p.compare_at_price ? String(num(p.compare_at_price)) : '',
        stock: p.stock === null ? '' : String(p.stock),
        is_active: p.is_active,
      });
      setPhotos(p.images.map((path, i) => ({ kind: 'kept', path, url: p.image_urls[i] })));
    }
  };

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const room = MAX_PHOTOS - photos.length;
    const picked = Array.from(files).slice(0, room).map((file) => ({ kind: 'new' as const, file, url: URL.createObjectURL(file) }));
    if (files.length > room) toast.info(`Up to ${MAX_PHOTOS} photos per product`);
    setPhotos((prev) => [...prev, ...picked]);
  };

  const makeCover = (i: number) => setPhotos((prev) => [prev[i], ...prev.filter((_, j) => j !== i)]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (photos.length === 0) {
      toast.error('Add at least one photo');
      return;
    }
    setSaving(true);
    try {
      const data = new FormData();
      data.append('name', form.name.trim());
      data.append('description', form.description);
      data.append('category', form.category.trim());
      data.append('price', form.price);
      if (form.compare_at_price) data.append('compare_at_price', form.compare_at_price);
      data.append('stock', form.stock);
      data.append('is_active', form.is_active ? '1' : '0');
      // Existing photos keep their place; new ones are appended after them
      // by the server, so put kept photos first in the order shown.
      const kept = photos.filter((p): p is Extract<Photo, { kind: 'kept' }> => p.kind === 'kept');
      const fresh = photos.filter((p): p is Extract<Photo, { kind: 'new' }> => p.kind === 'new');
      if (editing !== 'new') kept.forEach((p) => data.append('keep_images[]', p.path));
      fresh.forEach((p) => data.append('images[]', p.file));

      await shop.saveProduct(data, editing === 'new' ? undefined : editing?.id);
      toast.success(editing === 'new' ? 'Product listed' : 'Product saved');
      setEditing(null);
      load();
    } catch (err: any) {
      const errors = err.response?.data?.errors;
      toast.error(errors ? (Object.values(errors)[0] as string[])[0] : err.response?.data?.message || 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (p: Product) => {
    if (!window.confirm(`Remove "${p.name}"?`)) return;
    try {
      const res = await shop.deleteProduct(p.id);
      toast.success(res.message);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not remove');
    }
  };

  return (
    <DashboardShell
      title="Products"
      description="What you sell. Buyers pay on Spotlight; you're paid when you mark the order delivered."
      actions={<Button onClick={() => open('new')}><Plus className="w-4 h-4" /> Add product</Button>}
    >
      {!products ? (
        <div className="py-16 flex justify-center"><Loader size={32} /></div>
      ) : products.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center space-y-3">
            <ShoppingBag className="w-10 h-10 mx-auto text-muted-foreground" />
            <p className="font-medium">No products yet</p>
            <p className="text-sm text-muted-foreground">Add your first product with a few good photos. It goes live on your storefront and in the shop straight away.</p>
            <Button onClick={() => open('new')}><Plus className="w-4 h-4" /> Add product</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((p) => (
            <Card key={p.id} className="overflow-hidden">
              <div className="relative aspect-square bg-muted">
                {p.image_urls[0] && <Image src={p.image_urls[0]} alt={p.name} fill sizes="300px" className="object-cover" />}
                <div className="absolute top-2 left-2 flex gap-1">
                  {!p.is_active && <Badge variant="secondary"><EyeOff className="w-3 h-3" /> Hidden</Badge>}
                  {!p.in_stock && <Badge variant="destructive">Sold out</Badge>}
                </div>
              </div>
              <CardContent className="p-4 space-y-2">
                <p className="font-medium truncate">{p.name}</p>
                <p className="text-sm"><span className="font-semibold">{naira(p.price)}</span> <span className="text-muted-foreground">· {p.stock === null ? 'stock not tracked' : `${p.stock} in stock`} · {p.sold_count} sold</span></p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => open(p)}><Pencil className="w-4 h-4" /> Edit</Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => remove(p)} aria-label="Remove"><Trash2 className="w-4 h-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={editing !== null} onOpenChange={(o) => !o && !saving && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing === 'new' ? 'Add product' : 'Edit product'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={save} className="space-y-4">
            <div>
              <Label>Photos ({photos.length}/{MAX_PHOTOS}) · the first one is the cover</Label>
              <div className="grid grid-cols-4 gap-2 mt-1.5">
                {photos.map((ph, i) => (
                  <div key={ph.url} className="relative aspect-square rounded-lg overflow-hidden bg-muted border border-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={ph.url} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => setPhotos((prev) => prev.filter((_, j) => j !== i))} aria-label="Remove photo"
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-background/90 inline-flex items-center justify-center"><X className="w-3.5 h-3.5" /></button>
                    {/* New photos are saved after the existing ones, so only those can be moved to the front. */}
                    {i > 0 && (ph.kind === 'kept' || !photos.some((x) => x.kind === 'kept')) && (
                      <button type="button" onClick={() => makeCover(i)} aria-label="Make cover"
                        className="absolute bottom-1 left-1 px-1.5 h-6 rounded bg-background/90 text-[11px] inline-flex items-center gap-0.5"><ArrowLeft className="w-3 h-3" /> Cover</button>
                    )}
                  </div>
                ))}
                {photos.length < MAX_PHOTOS && (
                  <label className="aspect-square rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center text-xs text-muted-foreground cursor-pointer hover:border-primary/50">
                    <ImagePlus className="w-5 h-5 mb-1" /> Add
                    <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
                  </label>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="p-name">Name *</Label>
              <Input id="p-name" required maxLength={150} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Super Soaker water gun" />
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="p-price">Price (₦) *</Label>
                <Input id="p-price" type="number" required min={50} step={50} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="p-was">Was (₦)</Label>
                <Input id="p-was" type="number" min={0} step={50} value={form.compare_at_price} onChange={(e) => setForm({ ...form, compare_at_price: e.target.value })} placeholder="Optional" />
              </div>
              <div>
                <Label htmlFor="p-stock">Stock</Label>
                <Input id="p-stock" type="number" min={0} value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} placeholder="Leave blank to not track" />
              </div>
            </div>
            <div>
              <Label htmlFor="p-category">Category</Label>
              <Input id="p-category" maxLength={100} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Toys, Party supplies, Merch" />
            </div>
            <div>
              <Label htmlFor="p-desc">Description</Label>
              <textarea id="p-desc" rows={4} maxLength={5000} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" placeholder="Size, colours, what's in the box…" />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Show on my storefront
            </label>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditing(null)} disabled={saving}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Saving…' : editing === 'new' ? 'List product' : 'Save'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
