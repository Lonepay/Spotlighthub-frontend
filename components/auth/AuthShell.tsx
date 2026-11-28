'use client';

import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Ticket, Zap, Fingerprint } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';

const POINTS = [
  { icon: Ticket, title: 'Tickets in seconds', body: 'Check out securely and your QR ticket lands in your inbox.' },
  { icon: Zap, title: 'Sell without the stress', body: 'Organizers list events, track sales and get paid out to their bank.' },
  { icon: Fingerprint, title: 'Sign in your way', body: 'Password, emailed code or a passkey with your face or fingerprint.' },
];

/**
 * The frame for sign-in and sign-up: a brand panel on large screens (what
 * Spotlighticket is, and a sample ticket) beside a focused form column.
 */
export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-[1.05fr_1fr] bg-background">
      {/* Brand panel */}
      <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden p-12 text-white bg-[radial-gradient(120%_80%_at_0%_0%,#7c3aed_0%,#4c1d95_45%,#12052e_100%)]">
        <div aria-hidden="true" className="pointer-events-none absolute -right-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-fuchsia-500/30 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 -left-20 h-[26rem] w-[26rem] rounded-full bg-indigo-500/30 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(white_1px,transparent_1px),linear-gradient(90deg,white_1px,transparent_1px)] [background-size:44px_44px]" />

        <Link href="/" className="relative z-10 w-fit" aria-label="Spotlighticket home">
          <Logo className="h-10 w-auto object-contain brightness-0 invert" />
        </Link>

        <div className="relative z-10 max-w-md space-y-10">
          <div>
            <h2 className="font-display text-4xl xl:text-5xl font-bold leading-[1.1]">Every great night out starts here.</h2>
            <p className="mt-4 text-white/75 text-lg">Concerts, parties, movies and venues, all in one place.</p>
          </div>

          {/* A sample ticket, so the panel shows what you're signing up for. */}
          <div className="relative w-full max-w-sm rotate-[-3deg] rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl">
            <div className="flex">
              <div className="flex-1 p-5 space-y-3">
                <span className="inline-block rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider">Admit one · VIP</span>
                <p className="font-display text-xl font-bold leading-tight">Afro Night Live</p>
                <p className="text-sm text-white/70">Sat, 20 Dec · 8:00 PM<br />The Grand Arena</p>
              </div>
              <div className="relative w-28 border-l-2 border-dashed border-white/25 flex items-center justify-center">
                <span aria-hidden="true" className="absolute -top-3 -left-3 h-6 w-6 rounded-full bg-[#2b0f5c]" />
                <span aria-hidden="true" className="absolute -bottom-3 -left-3 h-6 w-6 rounded-full bg-[#1a0840]" />
                <div aria-hidden="true" className="grid grid-cols-5 gap-[3px] p-2 rounded-md bg-white">
                  {Array.from({ length: 25 }).map((_, i) => (
                    <span key={i} className={`h-2.5 w-2.5 ${[0, 1, 2, 4, 5, 7, 9, 10, 12, 14, 15, 17, 19, 20, 22, 23, 24].includes(i) ? 'bg-[#12052e]' : 'bg-white'}`} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <ul className="space-y-5">
            {POINTS.map((p) => (
              <li key={p.title} className="flex gap-4">
                <span className="mt-0.5 h-10 w-10 shrink-0 rounded-xl bg-white/15 inline-flex items-center justify-center"><p.icon className="h-5 w-5" /></span>
                <div>
                  <p className="font-semibold">{p.title}</p>
                  <p className="text-sm text-white/70">{p.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 flex items-center gap-2 text-sm text-white/60">
          <ShieldCheck className="h-4 w-4" /> Secure checkout · Your details stay private
        </p>
      </aside>

      {/* Form column */}
      <main className="flex flex-col min-h-screen">
        <header className="flex items-center justify-between px-6 sm:px-10 h-20">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Back to Spotlighticket</span><span className="sm:hidden">Back</span>
          </Link>
          <Link href="/" className="lg:hidden" aria-label="Spotlighticket home">
            <Logo className="h-8 w-auto object-contain" />
          </Link>
          <ThemeToggle />
        </header>

        <div className="flex-1 flex items-center justify-center px-6 sm:px-10 pb-12">
          <div className="w-full max-w-[420px]">
            <div className="mb-8">
              <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">{title}</h1>
              <p className="mt-2 text-muted-foreground">{subtitle}</p>
            </div>
            {children}
          </div>
        </div>

        <footer className="px-6 sm:px-10 pb-8 text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
          <span>© {new Date().getFullYear()} Spotlighticket</span>
          <Link href="/terms" className="hover:text-foreground">Terms</Link>
          <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
          <Link href="/support" className="hover:text-foreground">Help</Link>
        </footer>
      </main>
    </div>
  );
}
