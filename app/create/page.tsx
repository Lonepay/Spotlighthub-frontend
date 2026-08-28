'use client';

import Link from 'next/link';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarDays, Clapperboard, Building2, ArrowRight } from 'lucide-react';

const OPTIONS = [
  {
    href: '/create-event',
    icon: CalendarDays,
    title: 'Event',
    description: 'A concert, conference, or general-admission event with a single date, price, and optional ticket tiers.',
  },
  {
    href: '/create-movie',
    icon: Clapperboard,
    title: 'Movie',
    description: 'Multiple showtimes with hall/screen, a visual seat arrangement, snack & drink add-ons, and ticket tiers.',
  },
  {
    href: '/create-venue',
    icon: Building2,
    title: 'Venue / Location',
    description: 'A bookable space with daily open/close hours, an availability window, and pricing tiers.',
  },
];

export default function CreateChooserPage() {
  return (
    <DashboardShell title="Create" description="What are you setting up?">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl">
        {OPTIONS.map((opt) => (
          <Link key={opt.href} href={opt.href}>
            <Card className="h-full transition-colors hover:border-primary/50 cursor-pointer">
              <CardContent className="p-6 flex flex-col h-full">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <opt.icon className="w-5 h-5 text-primary" />
                </div>
                <h2 className="font-display font-semibold text-lg mb-1.5">{opt.title}</h2>
                <p className="text-sm text-muted-foreground flex-1">{opt.description}</p>
                <span className="inline-flex items-center gap-1 text-sm font-medium text-primary mt-4">
                  Get started <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </DashboardShell>
  );
}
