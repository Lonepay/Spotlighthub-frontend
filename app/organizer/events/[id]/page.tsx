'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { useAuth } from '@/components/AuthProvider';
import { events, Event } from '@/lib/events';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import DOMPurify from 'isomorphic-dompurify';

interface TicketVariation {
  id?: number;
  name: string;
  description: string;
  price: number;
  quantity: number;
  sold?: number;
}

export default function OrganizerEventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [variations, setVariations] = useState<TicketVariation[]>([]);
  const [showVariationForm, setShowVariationForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<TicketVariation>({
    name: '',
    description: '',
    price: 0,
    quantity: 0,
  });

  useEffect(() => {
    if (!user || (user.role !== 'organizer' && user.role !== 'admin')) {
      router.push('/login');
    } else {
      loadEvent();
      loadVariations();
    }
  }, [params.id, user]);

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

  const loadVariations = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/events/${params.id}/variations`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setVariations(data.data || data);
      }
    } catch (error) {
      console.error('Failed to load variations:', error);
    }
  };

  const handleAddVariation = async () => {
    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId
        ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/events/${params.id}/variations/${editingId}`
        : `${process.env.NEXT_PUBLIC_BACKEND_URL}/events/${params.id}/variations`;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setFormData({ name: '', description: '', price: 0, quantity: 0 });
        setShowVariationForm(false);
        setEditingId(null);
        await loadVariations();
      }
    } catch (error) {
      alert('Failed to save variation');
    }
  };

  const handleDeleteVariation = async (id: number) => {
    if (!confirm('Delete this ticket variation?')) return;
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/events/${params.id}/variations/${id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      await loadVariations();
    } catch (error) {
      alert('Failed to delete variation');
    }
  };

  const handleEditVariation = (variation: TicketVariation) => {
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
            <h2 className="font-display font-bold text-xl mb-2">{event.title}</h2>
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
          </CardContent>
        </Card>

        {/* Ticket Variations */}
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="font-display font-bold text-lg">Ticket Types</h2>
                <p className="text-sm text-muted-foreground mt-1">Create different ticket tiers (VIP, General, etc.) with unique pricing</p>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  setShowVariationForm(!showVariationForm);
                  setEditingId(null);
                  setFormData({ name: '', description: '', price: 0, quantity: 0 });
                }}
              >
                <Plus className="w-4 h-4" /> Add Type
              </Button>
            </div>

            {showVariationForm && (
              <div className="p-5 mb-6 rounded-xl border border-border bg-muted/30">
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label htmlFor="var-name">Ticket type</Label>
                    <Input
                      id="var-name"
                      placeholder="e.g., VIP, General Admission"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="var-price">Price (NGN)</Label>
                    <Input
                      id="var-price"
                      type="number"
                      placeholder="0"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <Label htmlFor="var-quantity">Quantity</Label>
                  <Input
                    id="var-quantity"
                    type="number"
                    placeholder="0"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                  />
                </div>
                <div className="mb-4">
                  <Label htmlFor="var-description">Description</Label>
                  <textarea
                    id="var-description"
                    className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm"
                    placeholder="e.g., Includes early entry, free drinks"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowVariationForm(false);
                      setEditingId(null);
                      setFormData({ name: '', description: '', price: 0, quantity: 0 });
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleAddVariation}>
                    {editingId ? 'Update' : 'Create'} Type
                  </Button>
                </div>
              </div>
            )}

            {variations.length > 0 ? (
              <div className="space-y-3">
                {variations.map((variation) => (
                  <div key={variation.id} className="p-4 rounded-xl border border-border">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{variation.name}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{variation.description}</p>
                        <div className="flex gap-4 text-sm">
                          <span className="font-semibold">₦{variation.price.toLocaleString('en-NG', { maximumFractionDigits: 0 })}</span>
                          <span className="text-muted-foreground">{variation.sold || 0} sold / {variation.quantity} total</span>
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
      </div>
    </DashboardShell>
  );
}
