'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { PhoneInput } from '@/components/ui/phone-input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/components/AuthProvider';
import { AuthShell } from '@/components/auth/AuthShell';
import { PasswordStrength } from '@/components/auth/PasswordStrength';
import { EmailCodeStep } from '@/components/auth/EmailCodeStep';
import { auth } from '@/lib/auth';
import { ArrowRight, Ticket, CalendarPlus, Store, Check, Loader2, AlertCircle } from 'lucide-react';
import { safeNext } from '@/lib/redirect';

const ACCOUNT_TYPES = [
  { role: 'attendee' as const, icon: Ticket, title: 'Go to events', body: 'Buy tickets, keep them in one place' },
  { role: 'organizer' as const, icon: CalendarPlus, title: 'Host events', body: 'Sell tickets and get paid' },
];

export default function RegisterPage() {
  const router = useRouter();
  // The page that sent you to sign up (same-site only), read after mount.
  const [next, setNext] = useState<string | null>(null);
  useEffect(() => setNext(safeNext(new URLSearchParams(window.location.search).get('next'))), []);
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    country: 'NG',
    password: '',
    password_confirmation: '',
    role: 'attendee' as 'attendee' | 'organizer' | 'admin',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // Step two: the code we emailed, proving the address is theirs.
  const [awaitingCode, setAwaitingCode] = useState(false);

  const mismatch = formData.password_confirmation.length > 0 && formData.password !== formData.password_confirmation;

  const showError = (err: any, fallback: string) => {
    if (err.response?.data?.errors) {
      setError(Object.values(err.response.data.errors).flat().join(', '));
    } else {
      setError(err.response?.data?.message || err.message || fallback);
    }
  };

  // Step one: check the form, then email a code to the address.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.password_confirmation) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await auth.sendRegistrationCode(formData.email.trim());
      setAwaitingCode(true);
    } catch (err: any) {
      showError(err, 'Could not send the confirmation code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step two: create the account with the code.
  const handleCreate = async (code: string) => {
    setError('');
    setLoading(true);

    try {
      await register(formData.name, formData.email.trim(), formData.phone, formData.password, formData.password_confirmation, formData.role, formData.country, code);
      // Signed up from a page that needed an account: go straight back to it.
      if (next) {
        router.push(next);
      } else if (formData.role === 'organizer') {
        router.push('/organizer');
      } else if (formData.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      showError(err, 'Registration failed. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  if (awaitingCode) {
    return (
      <AuthShell title="Confirm your email" subtitle="One last step before your account is ready.">
        {error && (
          <div role="alert" className="mb-6 flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" /> <span>{error}</span>
          </div>
        )}
        <EmailCodeStep
          email={formData.email.trim()}
          busy={loading}
          submitLabel="Create account"
          onSubmit={handleCreate}
          onBack={() => { setAwaitingCode(false); setError(''); }}
        />
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Create your account" subtitle="It takes a minute. We'll email you a code to confirm it's you.">
      {error && (
        <div role="alert" className="mb-6 flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" /> <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <fieldset>
          <legend className="text-sm font-medium mb-2">I want to</legend>
          <div className="grid grid-cols-2 gap-3" role="radiogroup">
            {ACCOUNT_TYPES.map((t) => {
              const selected = formData.role === t.role;
              return (
                <button
                  key={t.role}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setFormData({ ...formData, role: t.role })}
                  className={`relative text-left rounded-xl border-2 p-4 transition-all ${selected ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/40'}`}
                >
                  {selected && (
                    <span className="absolute top-2.5 right-2.5 h-5 w-5 rounded-full bg-primary text-primary-foreground inline-flex items-center justify-center">
                      <Check className="h-3 w-3" />
                    </span>
                  )}
                  <t.icon className={`h-6 w-6 mb-2 ${selected ? 'text-primary' : 'text-muted-foreground'}`} />
                  <p className="font-semibold text-sm">{t.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t.body}</p>
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1.5">
            <Store className="h-3.5 w-3.5" /> Selling products or services?{' '}
            <Link href="/vendor-signup" className="font-medium text-primary hover:underline">Join as a vendor</Link>
          </p>
        </fieldset>

        <div>
          <Label htmlFor="reg-name">Full name</Label>
          <Input id="reg-name" type="text" autoComplete="name" required value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="h-12" placeholder="Ada Okafor" />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="reg-email">Email</Label>
            <Input id="reg-email" type="email" autoComplete="email" required value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="h-12" placeholder="you@example.com" />
          </div>
          <div>
            <Label htmlFor="reg-phone">Phone</Label>
            <PhoneInput
              id="reg-phone"
              required
              value={formData.phone}
              onChange={(value) => setFormData({ ...formData, phone: value || '' })}
              defaultCountry={formData.country}
              onCountryChange={(country) => country && setFormData((f) => ({ ...f, country }))}
              placeholder="800 000 0000"
              className="h-12"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="reg-password">Password</Label>
          <PasswordInput id="reg-password" autoComplete="new-password" required minLength={8} value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="h-12" placeholder="At least 8 characters" />
          <PasswordStrength password={formData.password} />
        </div>

        <div>
          <Label htmlFor="reg-password-confirm">Confirm password</Label>
          <PasswordInput id="reg-password-confirm" autoComplete="new-password" required value={formData.password_confirmation}
            onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
            className={`h-12 ${mismatch ? 'border-destructive' : ''}`} placeholder="Type it again" aria-invalid={mismatch || undefined} />
          {mismatch && <p className="mt-1.5 text-xs text-destructive">Passwords don&apos;t match yet.</p>}
        </div>

        <Button type="submit" disabled={loading || mismatch} variant="hero" size="lg" className="w-full h-12">
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Continue <ArrowRight className="h-5 w-5" /></>}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          By creating an account you agree to our <Link href="/terms" className="underline hover:text-foreground">Terms</Link> and{' '}
          <Link href="/privacy" className="underline hover:text-foreground">Privacy Policy</Link>.
        </p>
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href={next ? `/login?next=${encodeURIComponent(next)}` : '/login'} className="font-semibold text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
