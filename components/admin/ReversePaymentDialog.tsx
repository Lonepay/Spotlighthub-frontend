'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogBody } from '@/components/ui/dialog';
import { Loader } from '@/components/Loader';
import { admin, ReversalPreview } from '@/lib/admin';

const naira = (n: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 2 }).format(n);

const KIND_LABEL: Record<string, string> = {
  sale: 'Organizer sale',
  donation: 'Donation',
  partner_commission: 'Partner commission',
  promoter_commission: 'Promoter commission',
  promoter_fee: 'Promoter fee (given back to organizer)',
};

/**
 * Admin: reverse a fraudulent payment. Refunds the buyer through the gateway,
 * then revokes the tickets and takes the money back from everyone it was
 * credited to.
 */
export function ReversePaymentDialog({ paymentId, onClose, onDone }: { paymentId: number | null; onClose: () => void; onDone: () => void }) {
  const [preview, setPreview] = useState<ReversalPreview | null>(null);
  const [reason, setReason] = useState('');
  const [alreadyRefunded, setAlreadyRefunded] = useState(false);
  const [flagBuyer, setFlagBuyer] = useState(true);
  const [confirmText, setConfirmText] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setPreview(null);
    setReason('');
    setAlreadyRefunded(false);
    setFlagBuyer(true);
    setConfirmText('');
    if (paymentId) {
      admin.getReversalPreview(paymentId).then(setPreview).catch(() => {
        toast.error('Could not load this payment');
        onClose();
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentId]);

  const submit = async () => {
    if (!paymentId) return;
    setBusy(true);
    try {
      const res = await admin.reversePayment(paymentId, { reason: reason.trim(), already_refunded: alreadyRefunded, flag_buyer: flagBuyer });
      const owed = Object.values(res.summary.debts).reduce((a, b) => a + b, 0);
      toast.success(`${res.message} ${res.summary.tickets_revoked} ticket(s) revoked.${owed > 0 ? ` Organizer now owes ${naira(owed)}.` : ''}`);
      onDone();
      onClose();
    } catch (err: any) {
      const errors = err.response?.data?.errors;
      toast.error(errors ? (Object.values(errors)[0] as string[])[0] : err.response?.data?.message || 'Reversal failed');
    } finally {
      setBusy(false);
    }
  };

  const p = preview?.payment;
  const canSubmit = !!p && !p.reversed_at && p.status === 'success' && reason.trim().length >= 5 && confirmText.trim().toUpperCase() === 'REVERSE' && !busy;

  return (
    <Dialog open={paymentId !== null} onOpenChange={(open) => !open && !busy && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Undo2 className="w-5 h-5" /> Reverse payment</DialogTitle>
          <DialogDescription>Refunds the buyer in full and takes the money back from everyone who was credited. This can&apos;t be undone.</DialogDescription>
        </DialogHeader>

        <DialogBody>
        {!preview ? (
          <div className="py-8 flex justify-center"><Loader size={28} /></div>
        ) : (
          <div className="space-y-4 text-sm">
            <div className="border border-border p-3 space-y-1">
              <div className="flex justify-between"><span className="text-muted-foreground">Order</span><span className="font-mono">{p!.reference}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span className="font-semibold">{naira(p!.amount)} via {p!.gateway ?? 'free checkout'}</span></div>
              <div className="flex justify-between gap-2"><span className="text-muted-foreground">Buyer</span><span className="text-right">{p!.buyer} {p!.buyer_email && <span className="text-muted-foreground">({p!.buyer_email})</span>}</span></div>
              {p!.event && <div className="flex justify-between gap-2"><span className="text-muted-foreground">Event</span><span className="text-right">{p!.event}</span></div>}
              <div className="flex justify-between"><span className="text-muted-foreground">Tickets to revoke</span><span>{preview.tickets}</span></div>
            </div>

            {p!.reversed_at ? (
              <p className="text-destructive">Already reversed on {new Date(p!.reversed_at).toLocaleString()}: {p!.reversal_reason}</p>
            ) : p!.status !== 'success' ? (
              <p className="text-destructive">Only successful payments can be reversed (this one is {p!.status}).</p>
            ) : (
              <>
                {preview.earnings.length > 0 && (
                  <div>
                    <p className="font-medium mb-1">Money taken back</p>
                    <ul className="space-y-1">
                      {preview.earnings.map((e, i) => (
                        <li key={i} className="flex justify-between gap-2">
                          <span>{e.user ?? 'Unknown'} <span className="text-muted-foreground">· {KIND_LABEL[e.kind] ?? e.kind}</span></span>
                          <span className="font-mono">{naira(-e.amount)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="space-y-1">
                  <Label htmlFor="rev-reason">Reason (kept in the activity log)</Label>
                  <textarea id="rev-reason" rows={2} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} className="w-full border border-input bg-background px-3 py-2" placeholder="e.g. Stolen card - chargeback from Paystack" />
                </div>

                <label className="flex items-start gap-2">
                  <input type="checkbox" checked={flagBuyer} onChange={(e) => setFlagBuyer(e.target.checked)} className="mt-1" />
                  <span>Also fraud-flag the buyer (blocks their account, email and phone from buying again)</span>
                </label>
                <label className="flex items-start gap-2">
                  <input type="checkbox" checked={alreadyRefunded} onChange={(e) => setAlreadyRefunded(e.target.checked)} className="mt-1" />
                  <span>Money already returned outside Spotlight (chargeback, or refunded in the gateway dashboard): <strong>don&apos;t</strong> refund again</span>
                </label>

                <div className="space-y-1">
                  <Label htmlFor="rev-confirm">Type REVERSE to confirm</Label>
                  <input id="rev-confirm" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} className="w-full h-10 border border-input bg-background px-3" autoComplete="off" />
                </div>
              </>
            )}
          </div>
        )}
        </DialogBody>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant="destructive" onClick={submit} disabled={!canSubmit}>
            {busy ? 'Reversing…' : alreadyRefunded ? 'Reverse (no refund)' : `Refund ${p ? naira(p.amount) : ''} & reverse`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
