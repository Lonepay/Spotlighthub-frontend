import Link from 'next/link';
import { Instagram, Youtube, MessageCircle } from 'lucide-react';
import { Logo } from './Logo';

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M16.6 5.82c-.9-.88-1.4-2.08-1.4-3.32h-3.14v13.44a2.7 2.7 0 1 1-1.9-2.58V9.9a5.83 5.83 0 1 0 5.04 5.78V9.36a7.1 7.1 0 0 0 4.4 1.5V7.72c-1.06 0-2.15-.34-3-.9Z" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="bg-card text-muted-foreground py-12 border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Logo className="h-8 w-auto object-contain" />
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Nigeria's home for booking events, movies, and visit-worthy locations.
            </p>
            <div className="flex items-center space-x-3">
              <a href="https://instagram.com/spot_lhub" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-muted-foreground hover:text-primary transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="https://tiktok.com/@spot_lhub" target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="text-muted-foreground hover:text-primary transition-colors">
                <TikTokIcon className="w-5 h-5" />
              </a>
              <a href="https://api.whatsapp.com/send?phone=2348132209554" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="text-muted-foreground hover:text-primary transition-colors">
                <MessageCircle className="w-5 h-5" />
              </a>
              <a href="https://www.youtube.com/@spot_lhub" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="text-muted-foreground hover:text-primary transition-colors">
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-display font-semibold text-foreground mb-4">Discover</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/events" className="hover:text-primary transition-colors">Events</Link></li>
              <li><Link href="/events" className="hover:text-primary transition-colors">Movies</Link></li>
              <li><Link href="/events" className="hover:text-primary transition-colors">Locations</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold text-foreground mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/organizers" className="hover:text-primary transition-colors">Organizers</Link></li>
              <li><Link href="/vendors" className="hover:text-primary transition-colors">Vendors</Link></li>
              <li><Link href="/blog" className="hover:text-primary transition-colors">Blog</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
              <li><Link href="/about" className="hover:text-primary transition-colors">About</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold text-foreground mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/find-tickets" className="hover:text-primary transition-colors">Find My Ticket</Link></li>
              <li><Link href="/faq" className="hover:text-primary transition-colors">FAQ</Link></li>
              <li><Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Spotlighticket. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
