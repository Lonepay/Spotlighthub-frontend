'use client';

import { useState } from 'react';
import { useAuth } from './AuthProvider';
import { auth } from '@/lib/auth';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ShieldCheck, LogOut } from 'lucide-react';
import { toast } from 'sonner';

export function SessionLockOverlay() {
  const { locked, unlockSession, logout, user } = useAuth();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resending, setResending] = useState(false);

  if (!locked) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await unlockSession(otp);
      setOtp('');
    } catch {
      setError('Invalid or expired code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await auth.lockSession();
      toast.success('A new code has been sent to your email.');
    } catch {
      toast.error("Couldn't send a new code. Please try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-sm p-4">
      <div className="w-full max-w-md glass rounded-2xl shadow-elevated p-8">
        <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20 mb-6">
          <ShieldCheck className="w-5 h-5 text-primary mt-0.5 shrink-0" />
          <p className="text-sm text-muted-foreground">
            You've been inactive for a while. For your security, enter the code we emailed to{' '}
            <span className="font-medium text-foreground">{user?.email}</span> to keep going.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-sm">
              {error}
            </div>
          )}

          <div>
            <Label htmlFor="lock-otp">Verification code</Label>
            <Input
              id="lock-otp"
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
            {loading ? 'Verifying…' : 'Unlock'}
          </Button>

          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {resending ? 'Sending…' : 'Resend code'}
            </button>
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-1 text-muted-foreground hover:text-destructive transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" /> Log out instead
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
