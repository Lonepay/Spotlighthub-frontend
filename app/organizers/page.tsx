import Link from 'next/link';
import Image from 'next/image';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { BarChart3, Wallet, QrCode, ArrowRight, Zap, ShieldCheck } from 'lucide-react';

const FEATURES = [
  { icon: BarChart3, title: 'Real-time sales tracking', desc: 'Watch tickets sell live, broken down by tier, date, and channel.' },
  { icon: Wallet, title: 'Fast payouts', desc: 'Get paid quickly after your event, with clear, transparent fees.' },
  { icon: QrCode, title: 'Instant QR tickets', desc: 'Every buyer gets a scannable ticket the moment they pay — no printing.' },
  { icon: Zap, title: 'Set up in minutes', desc: 'Create an event, add ticket tiers, and start selling the same day.' },
  { icon: ShieldCheck, title: 'Secure by default', desc: 'Payments, checkout, and attendee data are all handled securely.' },
];

export default function OrganizersPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <section className="relative overflow-hidden py-24">
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-xs uppercase tracking-widest text-primary-glow mb-3">For organizers</div>
          <h1 className="text-4xl sm:text-6xl font-display font-bold mb-6">
            Sell tickets. <span className="text-gradient">Get paid fast.</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Everything you need to list, promote, and sell tickets to your event — with real-time sales tracking
            and a dashboard built for organizers.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild variant="hero" size="lg">
              <Link href="/register">
                Start selling <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button asChild variant="glass" size="lg">
              <Link href="/contact">Talk to us</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-20 border-t border-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="glass rounded-2xl p-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <f.icon className="w-6 h-6 text-primary-glow" />
                </div>
                <h3 className="font-display font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 border-t border-border/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">Ready to list your event?</h2>
          <Button asChild variant="hero" size="lg">
            <Link href="/register">
              Create an organizer account <ArrowRight className="w-5 h-5" />
            </Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
