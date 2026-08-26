'use client';

import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { tickets } from '@/lib/tickets';
import { Search, Mail, MailCheck } from 'lucide-react';
import { toast } from 'sonner';

export default function FindTicketsPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      await tickets.resendByEmail(email.trim());
      setSent(true);
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="pt-28 pb-20 max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="text-xs uppercase tracking-widest text-primary-glow mb-2">Lost your tickets?</div>
          <h1 className="font-display font-bold text-4xl md:text-5xl mb-3">Find My Ticket</h1>
          <p className="text-lg text-muted-foreground">
            Enter the email you used at checkout — if we find tickets tied to it, we&apos;ll send them straight to your inbox.
          </p>
        </div>

        <div className="glass rounded-2xl p-6 md:p-8 shadow-card">
          {sent ? (
            <div className="text-center py-6">
              <MailCheck className="w-12 h-12 text-primary-glow mx-auto mb-4" />
              <h2 className="font-display font-bold text-xl mb-2">Check your inbox</h2>
              <p className="text-muted-foreground">
                If we found tickets for <strong>{email}</strong>, they're on their way — each one attached as a downloadable PDF.
              </p>
              <Button variant="outline" className="mt-6" onClick={() => setSent(false)}>
                Try another email
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <Label htmlFor="find-email">Email address</Label>
              <div className="flex flex-col sm:flex-row gap-3 mt-1.5">
                <div className="relative flex-1">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="find-email"
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-12"
                  />
                </div>
                <Button type="submit" variant="hero" disabled={loading} className="sm:w-auto">
                  <Search className="w-4 h-4" /> {loading ? 'Sending…' : 'Send my tickets'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                For your security, tickets are only ever sent to the email address they were bought with — we never show them directly on this page.
              </p>
            </form>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
