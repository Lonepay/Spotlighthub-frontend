'use client';

import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { tickets, FoundTicket } from '@/lib/tickets';
import { Search, Mail, MailCheck, ShieldCheck, Calendar, MapPin, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

type Step = 'email' | 'otp' | 'select' | 'sent';

export default function FindTicketsPage() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [foundTickets, setFoundTickets] = useState<FoundTicket[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    try {
      await tickets.requestLookupCode(email.trim());
      setStep('otp');
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { tickets: found } = await tickets.verifyLookupCode(email.trim(), otp);
      setFoundTickets(found);
      setSelectedIds(new Set(found.map((t) => t.id)));
      setStep('select');
    } catch {
      setError('Invalid or expired code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    try {
      await tickets.requestLookupCode(email.trim());
      toast.success('A new code has been sent.');
    } catch {
      toast.error("Couldn't send a new code.");
    } finally {
      setLoading(false);
    }
  };

  const toggleSelected = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSendSelected = async () => {
    if (selectedIds.size === 0) return;
    setLoading(true);
    try {
      await tickets.resendSelected(email.trim(), otp, Array.from(selectedIds));
      setStep('sent');
    } catch {
      toast.error('Invalid or expired code — please start over.');
      setStep('email');
      setOtp('');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep('email');
    setEmail('');
    setOtp('');
    setError('');
    setFoundTickets([]);
    setSelectedIds(new Set());
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="pt-28 pb-20 max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="text-xs uppercase tracking-widest text-primary-glow mb-2">Lost your tickets?</div>
          <h1 className="font-display font-bold text-4xl md:text-5xl mb-3">Find My Ticket</h1>
          <p className="text-lg text-muted-foreground">
            Verify the email you used at checkout, then pick exactly which ticket you need resent.
          </p>
        </div>

        <div className="glass rounded-2xl p-6 md:p-8 shadow-card">
          {step === 'email' && (
            <form onSubmit={handleRequestCode}>
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
                  <Search className="w-4 h-4" /> {loading ? 'Sending…' : 'Send code'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                For security reasons, we need to verify it's really you before showing any ticket details.
              </p>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleVerifyCode} className="space-y-6">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
                <ShieldCheck className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <p className="text-sm text-muted-foreground">
                  If <span className="font-medium text-foreground">{email}</span> has tickets, we've emailed a 6-digit code to it.
                </p>
              </div>

              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-sm">{error}</div>
              )}

              <div>
                <Label htmlFor="find-otp">Verification code</Label>
                <Input
                  id="find-otp"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  autoFocus
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="text-center text-lg tracking-[0.5em]"
                />
              </div>

              <Button type="submit" disabled={loading || otp.length !== 6} variant="hero" size="lg" className="w-full">
                {loading ? 'Verifying…' : 'Verify'}
              </Button>

              <div className="flex items-center justify-between text-sm">
                <button type="button" onClick={() => { setStep('email'); setOtp(''); setError(''); }} className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
                <button type="button" onClick={handleResendCode} disabled={loading} className="text-muted-foreground hover:text-foreground transition-colors">
                  Resend code
                </button>
              </div>
            </form>
          )}

          {step === 'select' && (
            <div className="space-y-4">
              {foundTickets.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-muted-foreground mb-6">No tickets found for that email.</p>
                  <Button variant="outline" onClick={reset}>Try another email</Button>
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">Select which ticket{foundTickets.length > 1 ? 's' : ''} you'd like resent to your email.</p>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {foundTickets.map((t) => (
                      <label
                        key={t.id}
                        className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedIds.has(t.id) ? 'border-primary bg-primary/5' : 'border-border'}`}
                      >
                        <input
                          type="checkbox"
                          className="mt-1"
                          checked={selectedIds.has(t.id)}
                          onChange={() => toggleSelected(t.id)}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium truncate">{t.event?.title || 'Event'}</p>
                            {t.status === 'checked_in' && <Badge variant="secondary">Checked in</Badge>}
                            {(t.status === 'invalid' || t.status === 'revoked') && <Badge variant="destructive">{t.status === 'revoked' ? 'Revoked' : 'Invalid'}</Badge>}
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1">
                            {t.event?.date && (
                              <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(t.event.date).toLocaleDateString()}</span>
                            )}
                            {t.event && (
                              <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {t.event.is_virtual ? 'Online' : t.event.venue}</span>
                            )}
                            {t.variation && <span>{t.variation.name}</span>}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                  <Button
                    onClick={handleSendSelected}
                    disabled={loading || selectedIds.size === 0}
                    variant="hero"
                    size="lg"
                    className="w-full"
                  >
                    {loading ? 'Sending…' : `Send ${selectedIds.size || ''} selected ticket${selectedIds.size === 1 ? '' : 's'}`}
                  </Button>
                </>
              )}
            </div>
          )}

          {step === 'sent' && (
            <div className="text-center py-6">
              <MailCheck className="w-12 h-12 text-primary-glow mx-auto mb-4" />
              <h2 className="font-display font-bold text-xl mb-2">Check your inbox</h2>
              <p className="text-muted-foreground">
                Sent to <strong>{email}</strong> — each selected ticket is attached as a downloadable PDF.
              </p>
              <Button variant="outline" className="mt-6" onClick={reset}>
                Look up another email
              </Button>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
