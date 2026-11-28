'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { shop, num } from '@/lib/shop';
import { Vendor } from '@/lib/vendors';

/** How buyers receive orders: pickup and/or delivery at a flat fee. Saving doesn't send the listing back to review. */
export function DeliverySettingsCard({ vendor }: { vendor: Vendor }) {
  const [form, setForm] = useState({
    offers_pickup: vendor.offers_pickup ?? true,
    pickup_address: vendor.pickup_address ?? '',
    offers_delivery: vendor.offers_delivery ?? false,
    delivery_fee: String(num(vendor.delivery_fee)),
    delivery_note: vendor.delivery_note ?? '',
  });
  const [saving, setSaving] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await shop.saveDelivery({
        offers_pickup: form.offers_pickup,
        pickup_address: form.pickup_address.trim() || null,
        offers_delivery: form.offers_delivery,
        delivery_fee: Number(form.delivery_fee) || 0,
        delivery_note: form.delivery_note.trim() || null,
      });
      toast.success('Pickup and delivery saved');
    } catch (err: any) {
      const errors = err.response?.data?.errors;
      toast.error(errors ? (Object.values(errors)[0] as string[])[0] : err.response?.data?.message || 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <form onSubmit={save} className="space-y-4">
          <div>
            <h2 className="font-display font-bold text-lg flex items-center gap-2"><Truck className="w-5 h-5" /> Pickup &amp; delivery</h2>
            <p className="text-sm text-muted-foreground">How buyers get their orders. Changing this doesn&apos;t send your listing back to review.</p>
          </div>

          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={form.offers_pickup} onChange={(e) => setForm({ ...form, offers_pickup: e.target.checked })} />
            Buyers can pick up (free)
          </label>
          {form.offers_pickup && (
            <div>
              <Label htmlFor="pickup-address">Pickup address</Label>
              <Input id="pickup-address" required value={form.pickup_address} onChange={(e) => setForm({ ...form, pickup_address: e.target.value })} placeholder="Shop address and opening hours" />
            </div>
          )}

          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={form.offers_delivery} onChange={(e) => setForm({ ...form, offers_delivery: e.target.checked })} />
            I deliver
          </label>
          {form.offers_delivery && (
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="delivery-fee">Delivery fee (₦, per order)</Label>
                <Input id="delivery-fee" type="number" min={0} step={50} value={form.delivery_fee} onChange={(e) => setForm({ ...form, delivery_fee: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="delivery-note">Note for buyers</Label>
                <Input id="delivery-note" maxLength={500} value={form.delivery_note} onChange={(e) => setForm({ ...form, delivery_note: e.target.value })} placeholder="e.g. Lagos only, 1-3 days" />
              </div>
            </div>
          )}

          <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
        </form>
      </CardContent>
    </Card>
  );
}
