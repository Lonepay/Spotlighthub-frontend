import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { MapPin, Users, TrendingUp, ArrowRight } from 'lucide-react';

const BENEFITS = [
  { icon: MapPin, title: 'Get discovered', desc: 'List your venue or location where thousands of people search for places to go.' },
  { icon: Users, title: 'Reach new visitors', desc: 'Tap into Spotlighticket\'s audience of event-goers looking for their next outing.' },
  { icon: TrendingUp, title: 'Track performance', desc: 'See how many people are viewing and booking your location over time.' },
];

export default function VendorsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <section className="relative overflow-hidden py-24">
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-xs uppercase tracking-widest text-primary-glow mb-3">For vendors &amp; venues</div>
          <h1 className="text-4xl sm:text-6xl font-display font-bold mb-6">
            List your <span className="text-gradient">location.</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Partner with Spotlighticket to put your venue, restaurant, or attraction in front of people
            actively planning their next night out.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild variant="hero" size="lg">
              <Link href="/register">
                Become a partner <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button asChild variant="glass" size="lg">
              <Link href="/contact">Talk to us</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-20 border-t border-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-3 gap-6">
          {BENEFITS.map((b) => (
            <div key={b.title} className="glass rounded-2xl p-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <b.icon className="w-6 h-6 text-primary-glow" />
              </div>
              <h3 className="font-display font-bold text-lg mb-2">{b.title}</h3>
              <p className="text-muted-foreground text-sm">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-20 border-t border-border/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">Want your location listed?</h2>
          <Button asChild variant="hero" size="lg">
            <Link href="/contact">
              Get in touch <ArrowRight className="w-5 h-5" />
            </Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
