'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/components/AuthProvider';
import { AuthShell } from '@/components/auth/AuthShell';
import { isStaffRole, requiresTwoFactor } from '@/lib/auth';
import { ArrowRight, ShieldCheck, Fingerprint, Loader2, AlertCircle } from 'lucide-react';
import { safeNext } from '@/lib/redirect';
import { passkeysSupported, passkeyErrorMessage } from '@/lib/passkeys';

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, completeTwoFactorLogin, loginWithPasskey } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [otp, setOtp] = useState('');
  const [pendingTwoFactorEmail, setPendingTwoFactorEmail] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState<'' | 'password' | 'passkey' | 'otp'>('');
  // Checked after mount: the server render can't know the browser's support.
  const [canUsePasskey, setCanUsePasskey] = useState(false);
  useEffect(() => setCanUsePasskey(passkeysSupported()), []);

  // Back to the page that sent you here (same-site paths only), else your home.
  const next = safeNext(searchParams.get('next'));

  const goToDashboard = (role?: string, mustChangePassword?: boolean) => {
    // A password an admin generated: choose your own first, then carry on.
    if (mustChangePassword) {
      router.push(`/profile/security?change_password=1${next ? `&next=${encodeURIComponent(next)}` : ''}`);
    } else if (next) {
      router.push(next);
    } else if (role === 'organizer') {
      router.push('/organizer');
    } else if (isStaffRole(role)) {
      router.push('/admin');
    } else if (role === 'vendor') {
      router.push('/vendor');
    } else {
      router.push('/dashboard');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading('password');
    try {
      const result = await login(formData.email, formData.password);
      if (requiresTwoFactor(result)) {
        setPendingTwoFactorEmail(result.email);
      } else {
        goToDashboard(result.user.role, result.user.must_change_password);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Invalid credentials');
    } finally {
      setLoading('');
    }
  };

  // No email or password: the browser offers the passkeys it has for Spotlighticket.
  const handlePasskey = async () => {
    setError('');
    setLoading('passkey');
    try {
      const user = await loginWithPasskey();
      goToDashboard(user.role, user.must_change_password);
    } catch (err: any) {
      setError(passkeyErrorMessage(err, 'Could not sign in with a passkey'));
    } finally {
      setLoading('');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingTwoFactorEmail) return;
    setError('');
    setLoading('otp');
    try {
      const user = await completeTwoFactorLogin(pendingTwoFactorEmail, otp);
      goToDashboard(user.role, user.must_change_password);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Invalid or expired code');
    } finally {
      setLoading('');
    }
  };

  const errorBox = error && (
    <div role="alert" className="mb-6 flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-sm text-destructive">
      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" /> <span>{error}</span>
    </div>
  );

  if (pendingTwoFactorEmail) {
    return (
      <AuthShell title="Check your email" subtitle={`We sent a 6-digit code to ${pendingTwoFactorEmail}.`}>
        {errorBox}
        <form onSubmit={handleVerifyOtp} className="space-y-6">
          <div>
            <Label htmlFor="login-otp">Verification code</Label>
            <Input
              id="login-otp"
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              required
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="••••••"
              className="h-14 text-center text-2xl tracking-[0.6em] font-mono"
            />
          </div>
          <Button type="submit" disabled={!!loading || otp.length !== 6} variant="hero" size="lg" className="w-full h-12">
            {loading === 'otp' ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Verify & sign in <ArrowRight className="h-5 w-5" /></>}
          </Button>
          <button
            type="button"
            onClick={() => { setPendingTwoFactorEmail(null); setOtp(''); setError(''); }}
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Use a different account
          </button>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to get your tickets, manage events and get paid.">
      {errorBox}

      {canUsePasskey && (
        <>
          <Button type="button" variant="outline" size="lg" className="w-full h-12" onClick={handlePasskey} disabled={!!loading}>
            {loading === 'passkey' ? <Loader2 className="h-5 w-5 animate-spin" /> : <Fingerprint className="h-5 w-5" />}
            Sign in with a passkey
          </Button>
          <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wider text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or with email <span className="h-px flex-1 bg-border" />
          </div>
        </>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <Label htmlFor="login-email">Email</Label>
          <Input
            id="login-email"
            type="email"
            autoComplete="email webauthn"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="h-12"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1.5">
            <Label htmlFor="login-password" className="mb-0">Password</Label>
            <Link href="/forgot-password" className="text-sm font-medium text-primary hover:underline">Forgot password?</Link>
          </div>
          <PasswordInput
            id="login-password"
            autoComplete="current-password"
            required
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="h-12"
            placeholder="Your password"
          />
        </div>

        <Button type="submit" disabled={!!loading} variant="hero" size="lg" className="w-full h-12">
          {loading === 'password' ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Sign in <ArrowRight className="h-5 w-5" /></>}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        New to Spotlighticket?{' '}
        <Link href={next ? `/register?next=${encodeURIComponent(next)}` : '/register'} className="font-semibold text-primary hover:underline">
          Create an account
        </Link>
      </p>
      <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5" /> We&apos;ll never share your details.
      </p>
    </AuthShell>
  );
}
