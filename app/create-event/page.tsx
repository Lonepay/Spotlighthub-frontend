'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { useAuth } from '@/components/AuthProvider';
import { events } from '@/lib/events';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, MapPin, Upload, ArrowRight, Loader2 } from 'lucide-react';
import { NairaSign } from '@/components/icons/NairaSign';
import { RichTextEditor } from '@/components/RichTextEditor';

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

  // Redirect if not authenticated
  if (typeof window !== 'undefined' && !user) {
    router.push('/login');
    return null;
  }

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

      await events.create(data);
      router.push('/organizer');
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

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="event-title">Event title *</Label>
              <Input
                id="event-title"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Amazing Concert 2026"
              />
            </div>

            <div>
              <Label htmlFor="event-description">Description *</Label>
              <RichTextEditor
                value={formData.description}
                onChange={(html) => setFormData({ ...formData, description: html })}
                placeholder="Describe your event in detail..."
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="event-category">Category *</Label>
                <select
                  id="event-category"
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full h-11 rounded-xl border border-input bg-background/50 px-4 text-sm"
                >
                  <option value="">Select category</option>
                  <option value="Movie">Movie</option>
                  <option value="Concert">Concert</option>
                  <option value="Conference">Conference</option>
                  <option value="Workshop">Workshop</option>
                  <option value="Sports">Sports</option>
                  <option value="Theater">Theater</option>
                  <option value="Festival">Festival</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <Label htmlFor="event-venue">Venue *</Label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="event-venue"
                    required={!formData.is_virtual}
                    value={formData.venue}
                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                    className="pl-12"
                    placeholder={formData.is_virtual ? "Virtual Event" : "Venue name"}
                    disabled={formData.is_virtual}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-4 bg-muted/40 rounded-xl">
              <input
                type="checkbox"
                id="is_virtual"
                checked={formData.is_virtual}
                onChange={(e) => setFormData({ ...formData, is_virtual: e.target.checked, venue: e.target.checked ? 'Virtual' : '' })}
                className="w-4 h-4 accent-primary rounded"
              />
              <label htmlFor="is_virtual" className="text-sm font-medium cursor-pointer">
                This is a virtual event (online)
              </label>
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
              </div>
            </div>

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
                <p className="text-xs text-muted-foreground mt-1">Set to 0 for free events</p>
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

            <div>
              <Label>Event image</Label>
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
              </div>
            </div>

            <div className="flex gap-3 pt-4">
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
