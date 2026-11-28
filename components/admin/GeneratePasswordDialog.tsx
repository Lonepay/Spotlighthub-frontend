'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { KeyRound, Copy, Check, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogBody } from '@/components/ui/dialog';
import { admin } from '@/lib/admin';

type Target = { id: number; name: string; email: string } | null;

/**
 * Admin: generate a new password for someone who's locked out and share it
 * with them. Shown once; they're signed out everywhere and asked to choose
 * their own on next sign-in.
 */
export function GeneratePasswordDialog({ target, onClose }: { target: Target; onClose: () => void }) {
  const [sendEmail, setSendEmail] = useState(true);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ password: string; emailed: boolean; sessions_signed_out: number } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setResult(null);
    setSendEmail(true);
    setCopied(false);
  }, [target?.id]);

  const generate = async () => {
    if (!target) return;
    setBusy(true);
    try {
      setResult(await admin.generatePassword(target.id, sendEmail));
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not generate a password');
    } finally {
      setBusy(false);
    }
  };

  const shareText = result && target
    ? `Hi ${target.name}, your new Spotlighticket password is: ${result.password}\nSign in at https://www.spotlighticket.com/login with ${target.email}. You'll be asked to choose your own password straight away.`
    : '';

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.info(text);
    }
  };

  return (
    <Dialog open={target !== null} onOpenChange={(open) => !open && !busy && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><KeyRound className="w-5 h-5" /> Generate a password</DialogTitle>
          <DialogDescription>
            For {target?.name} ({target?.email}). Their old password stops working, they&apos;re signed out on every device, and
            they&apos;ll choose their own password when they next sign in.
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
        {!result ? (
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" checked={sendEmail} onChange={(e) => setSendEmail(e.target.checked)} className="mt-1" />
            <span>Also email it to them</span>
          </label>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <code className="flex-1 text-center text-lg tracking-widest font-mono bg-muted rounded-[0.5rem] py-3 select-all">{result.password}</code>
              <Button type="button" variant="outline" size="icon" onClick={() => copy(result.password)} aria-label="Copy password">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Shown only now - it isn&apos;t stored anywhere you can see it again.
              {result.emailed ? ' It was also emailed to them.' : ''}
              {result.sessions_signed_out > 0 ? ` Signed out of ${result.sessions_signed_out} session(s).` : ''}
            </p>
            <Button type="button" variant="outline" size="sm" onClick={() => copy(shareText)}>
              <Mail className="w-4 h-4" /> Copy a message to send them
            </Button>
          </div>
        )}
        </DialogBody>

        <DialogFooter>
          {!result ? (
            <>
              <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
              <Button onClick={generate} disabled={busy}>{busy ? 'Generating…' : 'Generate password'}</Button>
            </>
          ) : (
            <Button onClick={onClose}>Done</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
