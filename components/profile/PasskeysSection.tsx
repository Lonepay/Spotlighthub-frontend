'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Fingerprint, Plus, Pencil, Trash2, Smartphone, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { passkeys, PasskeyRow, passkeysSupported, passkeyErrorMessage } from '@/lib/passkeys';

/** Security settings: add, rename and remove the passkeys you sign in with. */
export function PasskeysSection() {
  const [list, setList] = useState<PasskeyRow[] | null>(null);
  const [supported, setSupported] = useState(true);
  const [name, setName] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    setSupported(passkeysSupported());
    passkeys.list().then(setList).catch(() => setList([]));
  }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      const created = await passkeys.add(name.trim() || undefined);
      setList((prev) => [created, ...(prev ?? [])]);
      setName('');
      toast.success('Passkey added. Next time, choose "Sign in with a passkey".');
    } catch (err) {
      toast.error(passkeyErrorMessage(err, 'Could not add the passkey'));
    } finally {
      setAdding(false);
    }
  };

  const rename = async (p: PasskeyRow) => {
    const next = window.prompt('Name this passkey', p.name)?.trim();
    if (!next || next === p.name) return;
    try {
      const updated = await passkeys.rename(p.id, next);
      setList((prev) => (prev ?? []).map((x) => (x.id === p.id ? updated : x)));
    } catch (err) {
      toast.error(passkeyErrorMessage(err, 'Could not rename'));
    }
  };

  const remove = async (p: PasskeyRow) => {
    if (!window.confirm(`Remove "${p.name}"? You won't be able to sign in with it any more.`)) return;
    try {
      await passkeys.remove(p.id);
      setList((prev) => (prev ?? []).filter((x) => x.id !== p.id));
      toast.success('Passkey removed');
    } catch (err) {
      toast.error(passkeyErrorMessage(err, 'Could not remove'));
    }
  };

  return (
    <div className="mt-10 pt-8 border-t border-border space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <Fingerprint className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h3 className="font-display font-semibold">Passkeys</h3>
          <p className="text-muted-foreground text-sm mt-0.5">
            Sign in with Face ID, your fingerprint or your device PIN instead of a password. Nothing to remember or type, and it
            can&apos;t be phished. Add one on each phone or computer you use.
          </p>
        </div>
      </div>

      {!supported ? (
        <p className="text-sm text-muted-foreground">This browser doesn&apos;t support passkeys. Try an up-to-date Chrome, Safari, Edge or Firefox.</p>
      ) : (
        <form onSubmit={add} className="flex flex-col sm:flex-row gap-2 sm:items-end max-w-lg">
          <div className="flex-1">
            <Label htmlFor="passkey-name">Name (optional)</Label>
            <Input id="passkey-name" maxLength={100} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. My iPhone" />
          </div>
          <Button type="submit" disabled={adding}><Plus className="w-4 h-4" /> {adding ? 'Follow your device…' : 'Add a passkey'}</Button>
        </form>
      )}

      {list && list.length > 0 && (
        <ul className="divide-y divide-border border border-border rounded-[0.5rem] max-w-lg">
          {list.map((p) => (
            <li key={p.id} className="flex items-center gap-3 p-3">
              {p.transports?.includes('internal') ? <Smartphone className="w-4 h-4 text-muted-foreground shrink-0" /> : <KeyRound className="w-4 h-4 text-muted-foreground shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{p.name}</p>
                <p className="text-xs text-muted-foreground">
                  Added {new Date(p.created_at).toLocaleDateString('en-NG', { dateStyle: 'medium' })}
                  {p.last_used_at ? ` · last used ${new Date(p.last_used_at).toLocaleDateString('en-NG', { dateStyle: 'medium' })}` : ' · not used yet'}
                </p>
              </div>
              <Button type="button" size="sm" variant="ghost" onClick={() => rename(p)} aria-label={`Rename ${p.name}`}><Pencil className="w-4 h-4" /></Button>
              <Button type="button" size="sm" variant="ghost" className="text-destructive" onClick={() => remove(p)} aria-label={`Remove ${p.name}`}><Trash2 className="w-4 h-4" /></Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
