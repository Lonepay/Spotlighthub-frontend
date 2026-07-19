'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import api from '@/lib/api';
import { auth } from '@/lib/auth';
import { useAuth } from '@/components/AuthProvider';
import { Save, Loader2, ShieldCheck, Mail } from 'lucide-react';

export default function SecurityPage() {
  const { user, refreshUser } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirmation, setNewPasswordConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [showTwoFactorForm, setShowTwoFactorForm] = useState(false);
  const [twoFactorPassword, setTwoFactorPassword] = useState('');
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const [twoFactorError, setTwoFactorError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');
    setError('');

    if (newPassword !== newPasswordConfirmation) {
      setError('New passwords do not match');
      setLoading(false);
      return;
    }

    try {
      await api.put('/user/profile', {
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: newPasswordConfirmation,
      });
      setSuccess('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setNewPasswordConfirmation('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTwoFactor = async (e: React.FormEvent) => {
    e.preventDefault();
    setTwoFactorLoading(true);
    setTwoFactorError('');
    try {
      await auth.toggleTwoFactor(!user?.two_factor_enabled, twoFactorPassword);
      await refreshUser();
      setShowTwoFactorForm(false);
      setTwoFactorPassword('');
    } catch (err: any) {
      setTwoFactorError(err.response?.data?.message || 'Failed to update two-factor authentication');
    } finally {
      setTwoFactorLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display font-bold text-xl mb-1">Security Settings</h2>
        <p className="text-muted-foreground text-sm">Manage your password and security preferences.</p>
      </div>

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-4 py-3 rounded-lg mb-6 text-sm">
          {success}
        </div>
      )}

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg mb-6 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6">
          <div>
            <Label htmlFor="currentPassword">Current password</Label>
            <PasswordInput
              id="currentPassword"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="newPassword">New password</Label>
            <PasswordInput
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>

          <div>
            <Label htmlFor="newPasswordConfirmation">Confirm new password</Label>
            <PasswordInput
              id="newPasswordConfirmation"
              value={newPasswordConfirmation}
              onChange={(e) => setNewPasswordConfirmation(e.target.value)}
              required
              minLength={8}
            />
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Update password
          </Button>
        </div>
      </form>

      <div className="mt-10 pt-8 border-t border-border">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Mail className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="font-display font-semibold">Two-factor authentication</h3>
              <p className="text-muted-foreground text-sm mt-0.5">
                {user?.two_factor_enabled
                  ? "Enabled — we'll email you a code every time you sign in."
                  : "Add an extra layer of security: we'll email you a one-time code at every sign-in."}
              </p>
            </div>
          </div>
          {user?.two_factor_enabled && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 shrink-0">
              <ShieldCheck className="w-3.5 h-3.5" /> On
            </span>
          )}
        </div>

        {showTwoFactorForm ? (
          <form onSubmit={handleToggleTwoFactor} className="space-y-4 max-w-sm">
            {twoFactorError && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">
                {twoFactorError}
              </div>
            )}
            <div>
              <Label htmlFor="tfa-password">Confirm your password</Label>
              <PasswordInput
                id="tfa-password"
                value={twoFactorPassword}
                onChange={(e) => setTwoFactorPassword(e.target.value)}
                required
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={twoFactorLoading} variant={user?.two_factor_enabled ? 'destructive' : 'default'}>
                {twoFactorLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {user?.two_factor_enabled ? 'Disable 2FA' : 'Enable 2FA'}
              </Button>
              <Button type="button" variant="outline" onClick={() => { setShowTwoFactorForm(false); setTwoFactorPassword(''); setTwoFactorError(''); }}>
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <Button type="button" variant={user?.two_factor_enabled ? 'outline' : 'default'} onClick={() => setShowTwoFactorForm(true)}>
            {user?.two_factor_enabled ? 'Disable two-factor authentication' : 'Enable two-factor authentication'}
          </Button>
        )}
      </div>
    </div>
  );
}
