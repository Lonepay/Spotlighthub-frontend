'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/components/AuthProvider';
import { isStaffRole, requiresTwoFactor } from '@/lib/auth';
import { Mail, Lock, ArrowRight, ShieldCheck } from 'lucide-react';

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
  const { login, completeTwoFactorLogin } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [otp, setOtp] = useState('');
  const [pendingTwoFactorEmail, setPendingTwoFactorEmail] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const goToDashboard = (role?: string) => {
    const next = searchParams.get('next');
    if (next) {
      router.push(next);
    } else if (role === 'organizer') {
      router.push('/organizer');
    } else if (isStaffRole(role)) {
      router.push('/admin');
    } else {
      router.push('/dashboard');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(formData.email, formData.password);
      if (requiresTwoFactor(result)) {
        setPendingTwoFactorEmail(result.email);
      } else {
        goToDashboard(result.user.role);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Invalid credentials';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingTwoFactorEmail) return;
    setError('');
    setLoading(true);

    try {
      const user = await completeTwoFactorLogin(pendingTwoFactorEmail, otp);
      goToDashboard(user.role);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Invalid or expired code';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center py-20 px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center mb-4">
              <Logo className="h-16 w-auto object-contain" />
            </div>
            <h1 className="text-4xl font-bold mb-2">Welcome back</h1>
            <p className="text-muted-foreground">Sign in to your account to continue</p>
          </div>

          <div className="glass rounded-2xl shadow-card p-8">
            {error && (
              <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-sm">
                {error}
              </div>
            )}

            {pendingTwoFactorEmail ? (
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <ShieldCheck className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    We emailed a 6-digit code to <span className="font-medium text-foreground">{pendingTwoFactorEmail}</span>.
                    Enter it below to finish signing in.
                  </p>
                </div>

                <div>
                  <Label htmlFor="login-otp">Verification code</Label>
                  <Input
                    id="login-otp"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="text-center text-lg tracking-[0.5em]"
                  />
                </div>

                <Button type="submit" disabled={loading || otp.length !== 6} variant="hero" size="lg" className="w-full">
                  {loading ? 'Verifying...' : 'Verify & sign in'}
                  {!loading && <ArrowRight className="w-5 h-5" />}
                </Button>

                <button
                  type="button"
                  onClick={() => { setPendingTwoFactorEmail(null); setOtp(''); setError(''); }}
                  className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Back to sign in
                </button>
              </form>
            ) : (
              <>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <Label htmlFor="login-email">Email address</Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="pl-12"
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <Label htmlFor="login-password" className="mb-0">Password</Label>
                      <Link href="/forgot-password" className="text-xs text-primary-glow hover:underline">
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
                      <PasswordInput
                        id="login-password"
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="pl-12"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <Button type="submit" disabled={loading} variant="hero" size="lg" className="w-full">
                    {loading ? 'Signing in...' : 'Sign in'}
                    {!loading && <ArrowRight className="w-5 h-5" />}
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-muted-foreground text-sm">
                    Don't have an account?{' '}
                    <Link href="/register" className="text-primary-glow hover:underline font-semibold">
                      Sign up
                    </Link>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
