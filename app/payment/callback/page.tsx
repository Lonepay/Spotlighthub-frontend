'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/AuthProvider';
import { payments } from '@/lib/payments';
import { useCart } from '@/lib/cart';
import { Check, X, Loader2, Receipt } from 'lucide-react';
import { toast } from 'sonner';

export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={null}>
      <PaymentCallbackContent />
    </Suspense>
  );
}

function PaymentCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { clear } = useCart();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [message, setMessage] = useState('Hang tight while we confirm your payment.');
  const [result, setResult] = useState<{ tickets: any[]; paymentId: number; guestEmail?: string } | null>(null);

  useEffect(() => {
    const reference = searchParams.get('reference') || searchParams.get('transaction_id');

    if (!reference) {
      setStatus('failed');
      setMessage('No payment reference found');
      return;
    }

    const verifyPayment = async () => {
      try {
        const response = await payments.verify(reference);

        if (response.status === 'success') {
          setStatus('success');
          setMessage('Your tickets have been issued.');
          clear();

          const isLoggedIn = !!response.payment?.user_id;
          setResult({
            tickets: response.tickets || [],
            paymentId: response.payment?.id,
            guestEmail: isLoggedIn ? undefined : response.payment?.guest_email,
          });

          if (isLoggedIn) {
            setTimeout(() => {
              router.push('/my-tickets');
            }, 3000);
          }
        } else {
          setStatus('failed');
          setMessage('Payment verification failed. Please contact support if you were charged.');
        }
      } catch (error: any) {
        setStatus('failed');
        setMessage(error.response?.data?.message || 'Failed to verify payment');
      }
    };

    verifyPayment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center py-20 px-4">
        <div className="w-full max-w-md">
          <div className="glass rounded-2xl shadow-elevated p-8 text-center">
            {status === 'loading' && (
              <>
                <Loader2 className="w-14 h-14 text-primary-glow mx-auto mb-4 animate-spin" />
                <h2 className="font-display text-2xl font-bold mb-2">Verifying payment…</h2>
                <p className="text-muted-foreground">{message}</p>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="w-16 h-16 bg-emerald-500/15 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-emerald-500" />
                </div>
                <h2 className="font-display text-2xl font-bold mb-2">You're in 🎉</h2>
                <p className="text-muted-foreground mb-6">{message}</p>

                {user ? (
                  <p className="text-sm text-muted-foreground">Redirecting to your tickets…</p>
                ) : (
                  result && (
                    <>
                      {result.tickets.length > 0 && (
                        <div className="grid sm:grid-cols-2 gap-3 mb-6">
                          {result.tickets.map((t: any) => (
                            <div key={t.id} className="flex items-center gap-3 rounded-xl bg-background/40 border border-border/50 p-3">
                              <div className="bg-white p-2 rounded-md grid place-items-center">
                                <QRCodeSVG
                                  value={t.code}
                                  size={72}
                                  level="H"
                                  imageSettings={{ src: '/storage/logo.png', height: 18, width: 18, excavate: true }}
                                />
                              </div>
                              <div className="text-xs text-left">
                                <div className="font-semibold font-mono">{t.code}</div>
                                <div className="text-muted-foreground mt-0.5">Scan at entry</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mb-6">Save this page — you can download your tickets and receipt here.</p>
                      <div className="flex flex-wrap gap-3 justify-center">
                        <Button
                          variant="glass"
                          onClick={async () => {
                            try {
                              await payments.downloadReceipt(result.paymentId, undefined, result.guestEmail);
                            } catch {
                              toast.error("Couldn't download the receipt");
                            }
                          }}
                        >
                          <Receipt className="w-4 h-4" /> Download receipt
                        </Button>
                        <Button asChild variant="hero">
                          <a href="/events">Explore more events</a>
                        </Button>
                      </div>
                    </>
                  )
                )}
              </>
            )}

            {status === 'failed' && (
              <>
                <div className="w-16 h-16 bg-destructive/15 rounded-full flex items-center justify-center mx-auto mb-4">
                  <X className="w-8 h-8 text-destructive" />
                </div>
                <h2 className="font-display text-2xl font-bold mb-2">Payment didn't go through</h2>
                <p className="text-muted-foreground mb-6">{message}</p>
                <Button variant="hero" onClick={() => router.push('/events')}>
                  Back to events
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
