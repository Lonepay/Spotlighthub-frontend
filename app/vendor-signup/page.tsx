'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useAuth } from '@/components/AuthProvider';
import { vendors } from '@/lib/vendors';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { Store, CheckCircle2 } from 'lucide-react';

const CATEGORY_PRESETS = ['Photography', 'Catering', 'Decor & Styling', 'DJ & Entertainment', 'Makeup & Beauty', 'Event Planning', 'Furniture & Rentals', 'Sound & Lighting', 'Other'];

export default function VendorSignupPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [coverImage, setCoverImage] = useState<File | null>(null);

  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', password_confirmation: '',
    business_name: '', category: '', description: '', city: '',
    contact_email: '', contact_phone: '', website: '', instagram: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.password_confirmation) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    try {
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => data.append(key, value));
      if (coverImage) data.append('cover_image', coverImage);

      await vendors.register(data);
      await refreshUser();
      setDone(true);
    } catch (err: any) {
      const detail = err.response?.data?.message
        || (err.response?.data?.errors && Object.values(err.response.data.errors).flat().join(' '));
      setError(detail || 'Failed to sign up. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center py-24 px-4">
          <div className="max-w-md text-center">
            <CheckCircle2 className="w-14 h-14 text-primary-glow mx-auto mb-6" />
            <h1 className="text-3xl font-bold mb-3">You're signed up!</h1>
            <p className="text-muted-foreground mb-8">
              Your account is live and your listing is saved. It'll appear in the public directory once our team reviews and approves it — usually within a day or two.
            </p>
            <Button variant="hero" size="lg" onClick={() => router.push('/vendor')}>
              Go to my listing
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Store className="w-7 h-7 text-primary-glow" />
            </div>
            <h1 className="text-4xl font-bold mb-3">Become a vendor</h1>
            <p className="text-muted-foreground">Create your account and list your business — reviewed by our team, then live in the public directory.</p>
          </div>

          <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 sm:p-8 space-y-8">
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-sm">{error}</div>
            )}

            <div>
              <h2 className="font-display font-semibold text-lg mb-4">Your account</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Your name *</Label>
                  <Input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone *</Label>
                    <Input id="phone" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="password">Password *</Label>
                    <PasswordInput id="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="password_confirmation">Confirm password *</Label>
                    <PasswordInput id="password_confirmation" required value={form.password_confirmation} onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })} />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-border">
              <h2 className="font-display font-semibold text-lg mb-4">Your business</h2>
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="business_name">Business name *</Label>
                    <Input id="business_name" required value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <select
                      id="category"
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
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    rows={4}
                    className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm"
                    placeholder="What you offer, experience, what makes you a good fit..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input id="city" required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contact_email">Contact email *</Label>
                    <Input id="contact_email" type="email" required placeholder="Shown publicly — can differ from login email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="contact_phone">Contact phone</Label>
                    <Input id="contact_phone" value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input id="website" placeholder="https://…" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="instagram">Instagram</Label>
                    <Input id="instagram" placeholder="@yourbusiness" value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="cover_image">Cover image</Label>
                  <input id="cover_image" type="file" accept="image/*" onChange={(e) => setCoverImage(e.target.files?.[0] || null)} className="w-full text-sm mt-1.5" />
                </div>
              </div>
            </div>

            <Button type="submit" variant="hero" size="lg" disabled={loading} className="w-full">
              {loading ? 'Creating your account…' : 'Sign up as a vendor'}
            </Button>
          </form>
        </div>
      </section>

      <Footer />
    </div>
  );
}
