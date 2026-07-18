'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { useAuth } from '@/components/AuthProvider';
import { checkin, CheckInResponse } from '@/lib/checkin';
import { QrScanner } from '@/components/QrScanner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CheckCircle2, XCircle, AlertTriangle, Camera, Keyboard, Loader2 } from 'lucide-react';

const RESULT_STYLES: Record<string, { icon: any; className: string }> = {
  success: { icon: CheckCircle2, className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  already_checked_in: { icon: AlertTriangle, className: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  revoked: { icon: XCircle, className: 'border-destructive/30 bg-destructive/10 text-destructive' },
  not_found: { icon: XCircle, className: 'border-destructive/30 bg-destructive/10 text-destructive' },
  unauthorized: { icon: XCircle, className: 'border-destructive/30 bg-destructive/10 text-destructive' },
};

export default function ScanTicketsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [mode, setMode] = useState<'camera' | 'manual'>('camera');
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<CheckInResponse | null>(null);
  const [history, setHistory] = useState<CheckInResponse[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const busyRef = useRef(false);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'organizer' && user.role !== 'admin') {
        router.push('/dashboard');
      }
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (mode === 'manual') inputRef.current?.focus();
  }, [mode]);

  const runCheckIn = async (rawCode: string) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setSubmitting(true);
    try {
      const response = await checkin.checkIn(rawCode.trim());
      setLastResult(response);
      setHistory((prev) => [response, ...prev].slice(0, 20));
    } finally {
      setSubmitting(false);
      busyRef.current = false;
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    await runCheckIn(code.trim());
    setCode('');
    inputRef.current?.focus();
  };

  if (authLoading || !user) {
    return (
      <DashboardShell title="Scan Tickets">
        <div className="animate-pulse h-64 bg-muted rounded-xl" />
      </DashboardShell>
    );
  }

  const resultStyle = lastResult ? RESULT_STYLES[lastResult.result] : null;
  const ResultIcon = resultStyle?.icon;

  return (
    <DashboardShell title="Scan Tickets" description="Check attendees in at the door">
      <div className="max-w-2xl space-y-6">
        <Card className="shadow-none">
          <CardContent className="p-6">
            <Tabs value={mode} onValueChange={(v) => setMode(v as any)}>
              <TabsList className="mb-4">
                <TabsTrigger value="camera"><Camera className="w-4 h-4" /> Camera</TabsTrigger>
                <TabsTrigger value="manual"><Keyboard className="w-4 h-4" /> Manual / barcode scanner</TabsTrigger>
              </TabsList>

              <TabsContent value="camera" className="mt-4">
                <QrScanner onScan={runCheckIn} paused={submitting} />
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  Point the camera at the attendee's ticket QR code
                </p>
              </TabsContent>

              <TabsContent value="manual" className="mt-4">
                <form onSubmit={handleManualSubmit} className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="TKT-XXXXXXXX"
                    className="font-mono"
                    autoComplete="off"
                  />
                  <Button type="submit" disabled={submitting || !code.trim()}>
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Check in'}
                  </Button>
                </form>
                <p className="text-xs text-muted-foreground mt-3">
                  Works with a handheld barcode scanner (acts as a keyboard) or manual typing
                </p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {lastResult && resultStyle && ResultIcon && (
          <Card className={`shadow-none border ${resultStyle.className}`}>
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <ResultIcon className="w-6 h-6 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="font-semibold">{lastResult.message}</p>
                  {lastResult.ticket && (
                    <div className="mt-2 text-sm space-y-0.5 text-foreground/80">
                      <p className="font-medium">{lastResult.ticket.event?.title}</p>
                      {lastResult.ticket.attendee_name && <p>{lastResult.ticket.attendee_name}</p>}
                      {lastResult.ticket.variation?.name && <p>{lastResult.ticket.variation.name}</p>}
                      <p className="font-mono text-xs opacity-70">{lastResult.ticket.code}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {history.length > 0 && (
          <Card className="shadow-none">
            <CardContent className="p-6">
              <h3 className="font-display font-bold text-sm mb-4">Recent scans</h3>
              <div className="space-y-2">
                {history.map((h, idx) => {
                  const style = RESULT_STYLES[h.result];
                  const Icon = style.icon;
                  return (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 text-sm">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="font-mono text-xs text-muted-foreground">{h.ticket?.code || '—'}</span>
                      <span className="flex-1 truncate">{h.ticket?.event?.title || h.message}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardShell>
  );
}
