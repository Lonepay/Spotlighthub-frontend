'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Plus, Trash2, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { events, EventGuest } from '@/lib/events';
import { storageUrl } from '@/lib/storage';

/**
 * Organizer: featured guests / lineup (artists, speakers, special guests)
 * shown on the public event page.
 */
export function EventGuestsManager({ eventId, guests, onChange }: { eventId: number; guests: EventGuest[]; onChange: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setName('');
    setRole('');
    setImage(null);
    setShowForm(false);
  };

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const data = new FormData();
      data.append('name', name.trim());
      if (role.trim()) data.append('role', role.trim());
      if (image) data.append('image', image);
      await events.addGuest(eventId, data);
      toast.success(`${name.trim()} added to the lineup`);
      reset();
      onChange();
    } catch (err: any) {
      const errors = err.response?.data?.errors;
      toast.error(errors ? (Object.values(errors)[0] as string[])[0] : err.response?.data?.message || 'Could not add guest');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (guest: EventGuest) => {
    if (!window.confirm(`Remove ${guest.name} from the lineup?`)) return;
    try {
      await events.deleteGuest(eventId, guest.id);
      onChange();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not remove guest');
    }
  };

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-display font-bold text-lg flex items-center gap-2"><Star className="w-5 h-5" /> Featured Guests</h2>
            <p className="text-sm text-muted-foreground">Artists, speakers or special guests shown on your event page.</p>
          </div>
          {!showForm && (
            <Button size="sm" onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4" /> Add guest
            </Button>
          )}
        </div>

        {showForm && (
          <form onSubmit={add} className="rounded-xl border border-border p-4 space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="guest-name">Name *</Label>
                <Input id="guest-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} required placeholder="e.g. Tems" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="guest-role">Role</Label>
                <Input id="guest-role" value={role} onChange={(e) => setRole(e.target.value)} maxLength={120} placeholder="e.g. Headliner, Keynote speaker" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="guest-photo">Photo (JPG, PNG or WebP, up to 5 MB)</Label>
              <input id="guest-photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setImage(e.target.files?.[0] ?? null)} className="block text-sm" />
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={saving || !name.trim()}>{saving ? 'Adding…' : 'Add to lineup'}</Button>
              <Button type="button" size="sm" variant="outline" onClick={reset}>Cancel</Button>
            </div>
          </form>
        )}

        {guests.length === 0 ? (
          !showForm && <p className="text-sm text-muted-foreground">No featured guests yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {guests.map((g) => {
              const photo = storageUrl(g.image);
              return (
                <div key={g.id} className="rounded-xl border border-border overflow-hidden">
                  <div className="aspect-square bg-muted flex items-center justify-center">
                    {photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={photo} alt={g.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl font-bold text-muted-foreground">{g.name.charAt(0)}</span>
                    )}
                  </div>
                  <div className="p-2 flex items-start justify-between gap-1">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{g.name}</p>
                      {g.role && <p className="text-xs text-muted-foreground truncate">{g.role}</p>}
                    </div>
                    <button type="button" onClick={() => remove(g)} className="text-muted-foreground hover:text-destructive shrink-0" aria-label={`Remove ${g.name}`}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
