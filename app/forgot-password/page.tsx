'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import api from '@/lib/api';
import { Mail, ArrowLeft, Lock, Key } from 'lucide-react';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'otp' | 'password'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/forgot-password', { email });
      setStep('otp');
      setSuccess(`Code sent to ${email}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/verify-otp', { email, otp, type: 'reset' });
      setStep('password');
      setSuccess('Code verified. Set your new password.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== passwordConfirmation) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      await api.post('/reset-password', {
        email,
        otp,
        password,
        password_confirmation: passwordConfirmation,
      });
      setSuccess('Password reset successfully!');
      setTimeout(() => router.push('/login'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="flex-1 max-w-md mx-auto w-full px-4 sm:px-6 lg:px-8 py-16">
        <Link
          href="/login"
          className="inline-flex items-center text-muted-foreground hover:text-foreground mb-8 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to login
        </Link>

        <div className="glass rounded-2xl shadow-card p-8">
          {step === 'email' && (
            <>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-primary-glow" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Forgot password?</h1>
                <p className="text-muted-foreground">
                  Enter your email and we'll send you a verification code.
                </p>
              </div>

              {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg mb-6 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSendOtp} className="space-y-6">
                <div>
                  <Label htmlFor="fp-email">Email address</Label>
                  <Input
                    id="fp-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                  />
                </div>

                <Button type="submit" disabled={loading} variant="hero" size="lg" className="w-full">
                  {loading ? 'Sending code...' : 'Send code'}
                </Button>
              </form>
            </>
          )}

          {step === 'otp' && (
            <>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Key className="w-8 h-8 text-primary-glow" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Enter code</h1>
                <p className="text-muted-foreground">
                  We've sent a 6-digit code to <strong>{email}</strong>
                </p>
              </div>

              {success && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 px-4 py-3 rounded-lg mb-6 text-sm">
                  {success}
                </div>
              )}

              {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg mb-6 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div>
                  <Label htmlFor="fp-otp">Verification code</Label>
                  <Input
                    id="fp-otp"
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                    className="text-center text-2xl tracking-widest"
                    placeholder="000000"
                    maxLength={6}
                  />
                </div>

                <Button type="submit" disabled={loading} variant="hero" size="lg" className="w-full">
                  {loading ? 'Verifying...' : 'Verify code'}
                </Button>

                <div className="text-center space-y-2">
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={loading}
                    className="text-sm text-primary-glow hover:underline"
                  >
                    Resend code
                  </button>
                  <br />
                  <button
                    type="button"
                    onClick={() => setStep('email')}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Wrong email?
                  </button>
                </div>
              </form>
            </>
          )}

          {step === 'password' && (
            <>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-8 h-8 text-primary-glow" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Reset password</h1>
                <p className="text-muted-foreground">Create a new password for your account.</p>
              </div>

              {success && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 px-4 py-3 rounded-lg mb-6 text-sm">
                  {success}
                </div>
              )}

              {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg mb-6 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-6">
                <div>
                  <Label htmlFor="fp-new-password">New password</Label>
                  <Input
                    id="fp-new-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    minLength={8}
                  />
                </div>

                <div>
                  <Label htmlFor="fp-confirm-password">Confirm password</Label>
                  <Input
                    id="fp-confirm-password"
                    type="password"
                    value={passwordConfirmation}
                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                    required
                    placeholder="••••••••"
                    minLength={8}
                  />
                </div>

                <Button type="submit" disabled={loading} variant="hero" size="lg" className="w-full">
                  {loading ? 'Resetting...' : 'Reset password'}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
