'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/components/AuthProvider';
import { Mail, Lock, User, Phone, ArrowRight, Users, Calendar } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
    role: 'attendee' as 'attendee' | 'organizer' | 'admin',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.password_confirmation) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await register(formData.name, formData.email, formData.phone, formData.password, formData.password_confirmation, formData.role);
      if (formData.role === 'organizer') {
        router.push('/organizer');
      } else if (formData.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      if (err.response?.data) {
        if (err.response.data.errors) {
          const errors = err.response.data.errors;
          const errorMessages = Object.values(errors).flat().join(', ');
          setError(errorMessages);
        } else {
          setError(err.response.data.message || 'Registration failed');
        }
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Registration failed. Please check your connection and try again.');
      }
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
            <h1 className="text-4xl font-bold mb-2">Create account</h1>
            <p className="text-muted-foreground">Join Spotlighticket and start your journey</p>
          </div>

          <div className="glass rounded-2xl shadow-card p-8">
            {error && (
              <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label className="mb-3">I want to...</Label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'attendee' })}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      formData.role === 'attendee'
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <Users className={`w-6 h-6 mx-auto mb-2 ${formData.role === 'attendee' ? 'text-primary-glow' : 'text-muted-foreground'}`} />
                    <div className="font-semibold">Attend Events</div>
                    <div className="text-xs text-muted-foreground mt-1">Buy tickets</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'organizer' })}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      formData.role === 'organizer'
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <Calendar className={`w-6 h-6 mx-auto mb-2 ${formData.role === 'organizer' ? 'text-primary-glow' : 'text-muted-foreground'}`} />
                    <div className="font-semibold">Create Events</div>
                    <div className="text-xs text-muted-foreground mt-1">Sell tickets</div>
                  </button>
                </div>
              </div>

              <div>
                <Label htmlFor="reg-name">Full name</Label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="reg-name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="pl-12"
                    placeholder="Ada Okafor"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="reg-email">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="reg-email"
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
                <Label htmlFor="reg-phone">Phone number</Label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="reg-phone"
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="pl-12"
                    placeholder="+234 800 000 0000"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="reg-password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
                  <PasswordInput
                    id="reg-password"
                    required
                    minLength={8}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pl-12"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="reg-password-confirm">Confirm password</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
                  <PasswordInput
                    id="reg-password-confirm"
                    required
                    value={formData.password_confirmation}
                    onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
                    className="pl-12"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <Button type="submit" disabled={loading} variant="hero" size="lg" className="w-full">
                {loading ? 'Creating account...' : 'Create account'}
                {!loading && <ArrowRight className="w-5 h-5" />}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-muted-foreground text-sm">
                Already have an account?{' '}
                <Link href="/login" className="text-primary-glow hover:underline font-semibold">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
