'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { vendorInquiries } from '@/lib/vendorInquiries';
import { vendors, Vendor } from '@/lib/vendors';
import { storageUrl } from '@/lib/storage';
import { MapPin, Users, TrendingUp, ArrowRight, CheckCircle2, Store, Search } from 'lucide-react';

const BENEFITS = [
  { icon: MapPin, title: 'Get discovered', desc: 'List your venue or location where thousands of people search for places to go.' },
  { icon: Users, title: 'Reach new visitors', desc: 'Tap into Spotlighticket\'s audience of event-goers looking for their next outing.' },
  { icon: TrendingUp, title: 'Track performance', desc: 'See how many people are viewing and booking your location over time.' },
];

const NIGERIA_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT (Abuja)', 'Gombe',
  'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos',
  'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto',
  'Taraba', 'Yobe', 'Zamfara', 'Outside Nigeria',
];

export default function VendorsPage() {
  const [form, setForm] = useState({ business_name: '', contact_name: '', email: '', phone: '', location: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const [directory, setDirectory] = useState<Vendor[]>([]);
  const [directoryLoading, setDirectoryLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    vendors.getPublicAll({ search: search.trim() || undefined }).then((data) => {
      setDirectory(data.data || []);
      setDirectoryLoading(false);
    }).catch(() => setDirectoryLoading(false));
  }, [search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await vendorInquiries.submit(form);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit your request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <section className="relative overflow-hidden py-24">
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-xs uppercase tracking-widest text-primary-glow mb-3">For vendors &amp; venues</div>
          <h1 className="text-4xl sm:text-6xl font-display font-bold mb-6">
            List your <span className="text-gradient">location.</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Partner with Spotlighticket to put your venue, restaurant, or attraction in front of people
            actively planning their next night out.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild variant="hero" size="lg">
              <Link href="/vendor-signup">
                Sign up as a vendor <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button asChild variant="glass" size="lg">
              <a href="#partner-form">Just leave your details</a>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-20 border-t border-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">Browse our vendor directory</h2>
            <p className="text-muted-foreground">Photographers, caterers, decorators, and more — vetted businesses ready to help plan your event.</p>
          </div>

          <div className="relative max-w-xl mx-auto mb-10">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search vendors…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12"
            />
          </div>

          {directoryLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[4/3] bg-muted rounded-xl mb-4" />
                  <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : directory.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {directory.map((v) => {
                const cover = storageUrl(v.cover_image);
                return (
                  <Link key={v.id} href={`/vendors/${v.id}`} className="group relative block">
                    <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted shadow-card transition-all duration-300 group-hover:shadow-glow-sm group-hover:scale-[1.02]">
                      {cover ? (
                        <Image src={cover} alt={v.name} fill className="object-cover transition-transform duration-500 group-hover:scale-110" />
                      ) : (
                        <div className="w-full h-full bg-gradient-primary flex items-center justify-center">
                          <Store className="w-10 h-10 text-white/50" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-70" />
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <span className="inline-block px-2 py-1 mb-2 text-xs font-bold text-white bg-primary/80 backdrop-blur-sm rounded-md">{v.category}</span>
                        <h3 className="text-base font-bold text-white leading-tight line-clamp-1">{v.name}</h3>
                        <p className="text-white/80 text-xs">{v.city}</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No listings yet — be the first, partner with us below.</p>
          )}
        </div>
      </section>

      <section className="py-20 border-t border-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-3 gap-6">
          {BENEFITS.map((b) => (
            <div key={b.title} className="glass rounded-2xl p-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <b.icon className="w-6 h-6 text-primary-glow" />
              </div>
              <h3 className="font-display font-bold text-lg mb-2">{b.title}</h3>
              <p className="text-muted-foreground text-sm">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="partner-form" className="py-20 border-t border-border/60">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">Want your location listed?</h2>
            <p className="text-muted-foreground">Tell us about your venue and our partnerships team will reach out — no account needed.</p>
          </div>

          {submitted ? (
            <div className="glass rounded-2xl p-10 text-center">
              <CheckCircle2 className="w-12 h-12 text-primary-glow mx-auto mb-4" />
              <h3 className="font-display font-bold text-xl mb-2">Request received</h3>
              <p className="text-muted-foreground">We've got your details and will be in touch soon.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 sm:p-8 space-y-5">
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-sm">{error}</div>
              )}
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <Label htmlFor="business_name">Business / venue name *</Label>
                  <Input id="business_name" required value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="contact_name">Your name *</Label>
                  <Input id="contact_name" required value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
              </div>
              <div>
                <Label htmlFor="location">State</Label>
                <select
                  id="location"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="w-full h-11 rounded-xl border border-input bg-background/50 px-4 text-sm"
                >
                  <option value="">Select state</option>
                  {NIGERIA_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="message">Tell us about your venue *</Label>
                <textarea
                  id="message"
                  required
                  rows={5}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full rounded-xl border border-input bg-background/50 px-4 py-3 text-sm"
                  placeholder="Capacity, type of venue, what makes it a good fit..."
                />
              </div>
              <Button type="submit" variant="hero" size="lg" disabled={submitting} className="w-full">
                {submitting ? 'Submitting…' : 'Submit partner request'}
              </Button>
            </form>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
