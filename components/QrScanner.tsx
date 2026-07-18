'use client';

import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { CameraOff, Loader2 } from 'lucide-react';

export function QrScanner({
  onScan,
  paused = false,
}: {
  onScan: (value: string) => void;
  paused?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastScanRef = useRef<{ value: string; at: number } | null>(null);
  const [status, setStatus] = useState<'starting' | 'ready' | 'denied' | 'unsupported'>('starting');

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setStatus('unsupported');
      return;
    }

    let cancelled = false;

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' } })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
        setStatus('ready');
        rafRef.current = requestAnimationFrame(tick);
      })
      .catch(() => {
        if (!cancelled) setStatus('denied');
      });

    function tick() {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });
          if (code?.data) {
            const now = Date.now();
            const last = lastScanRef.current;
            // Debounce repeated scans of the same code while it's still in frame
            if (!last || last.value !== code.data || now - last.at > 3000) {
              lastScanRef.current = { value: code.data, at: now };
              onScan(code.data);
            }
          }
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === 'unsupported') {
    return (
      <div className="aspect-video rounded-xl bg-muted/40 border border-border flex flex-col items-center justify-center text-center p-6">
        <CameraOff className="w-8 h-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">Camera scanning isn't supported in this browser. Use manual entry below.</p>
      </div>
    );
  }

  if (status === 'denied') {
    return (
      <div className="aspect-video rounded-xl bg-muted/40 border border-border flex flex-col items-center justify-center text-center p-6">
        <CameraOff className="w-8 h-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">Camera access was denied. Enable it in your browser settings, or use manual entry below.</p>
      </div>
    );
  }

  return (
    <div className="relative aspect-video rounded-xl overflow-hidden bg-black">
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
      <canvas ref={canvasRef} className="hidden" />
      {status === 'starting' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
          <Loader2 className="w-6 h-6 text-white animate-spin" />
        </div>
      )}
      {status === 'ready' && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className={`w-2/3 aspect-square border-4 rounded-2xl transition-colors ${paused ? 'border-emerald-400' : 'border-white/70'}`} />
        </div>
      )}
    </div>
  );
}
