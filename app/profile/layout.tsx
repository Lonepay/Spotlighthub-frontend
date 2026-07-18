'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { Card, CardContent } from '@/components/ui/card';
import { User, Lock } from 'lucide-react';

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const sidebarItems = [
    { name: 'Profile', href: '/profile', icon: User },
    { name: 'Security', href: '/profile/security', icon: Lock },
  ];

  return (
    <DashboardShell title="Account Settings" description="Manage your profile and security preferences">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-56 flex-shrink-0">
          <nav className="inline-flex lg:flex lg:flex-col gap-1 rounded-lg bg-muted p-1 lg:bg-transparent lg:p-0">
            {sidebarItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-background text-foreground shadow-sm lg:bg-primary/10 lg:text-primary lg:shadow-none'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <Card className="flex-1 shadow-none">
          <CardContent className="p-6 sm:p-8">{children}</CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
