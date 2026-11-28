'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Loader2, MailCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { auth } from '@/lib/auth';

const RESEND_AFTER = 60; // seconds

/**
 * Sign-up's second step: enter the 6-digit code we emailed, proving the
 * address belongs to the person signing up. Can resend (after a minute)
 * or go back to fix a typo in the email.
 */
export function EmailCodeStep({
  email,
  busy,
  submitLabel,
  onSubmit,
  onBack,
}: {
  email: string;
  busy: boolean;
  submitLabel: string;
  onSubmit: (code: string) => void;
  onBack: () => void;
}) {
  const [code, setCode] = useState('');
  const [wait, setWait] = useState(RESEND_AFTER);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const resend = async () => {
    setResending(true);
    try {
      await auth.sendRegistrationCode(email);
      toast.success('New code sent');
      setWait(RESEND_AFTER);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not send a new code');
    } finally {
      setResending(false);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(code);
      }}
      className="space-y-6"
    >
      <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
        <MailCheck className="h-5 w-5 text-primary mt-0.5 shrink-0" />
        <p className="text-sm text-muted-foreground">
          We sent a 6-digit code to <span className="font-medium text-foreground">{email}</span>. Enter it to confirm the email is yours.
          Check spam if it isn&apos;t there in a minute.
        </p>
      </div>

      <div>
        <Label htmlFor="email-code">Confirmation code</Label>
        <Input
          id="email-code"
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          required
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          placeholder="••••••"
          className="h-14 text-center text-2xl tracking-[0.6em] font-mono"
        />
      </div>

      <Button type="submit" disabled={busy || code.length !== 6} variant="hero" size="lg" className="w-full h-12">
        {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <>{submitLabel} <ArrowRight className="h-5 w-5" /></>}
      </Button>

      <div className="flex items-center justify-between text-sm">
        <button type="button" onClick={onBack} className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Change email
        </button>
        <button type="button" onClick={resend} disabled={wait > 0 || resending} className="font-medium text-primary disabled:text-muted-foreground disabled:cursor-not-allowed">
          {resending ? 'Sending…' : wait > 0 ? `Resend in ${wait}s` : 'Resend code'}
        </button>
      </div>
    </form>
  );
}
