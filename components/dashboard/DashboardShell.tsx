'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  Avatar,
  AvatarFallback,
} from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  LayoutDashboard,
  Ticket,
  Compass,
  Settings,
  PlusCircle,
  QrCode,
  Menu,
  X,
  LogOut,
  ChevronDown,
} from 'lucide-react';

const NAV_BY_ROLE: Record<string, { label: string; href: string; icon: any }[]> = {
  attendee: [
    { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { label: 'My Tickets', href: '/my-tickets', icon: Ticket },
    { label: 'Explore', href: '/events', icon: Compass },
    { label: 'Settings', href: '/profile', icon: Settings },
  ],
  organizer: [
    { label: 'Overview', href: '/organizer', icon: LayoutDashboard },
    { label: 'Create Event', href: '/create-event', icon: PlusCircle },
    { label: 'Scan Tickets', href: '/organizer/scan', icon: QrCode },
    { label: 'Explore', href: '/events', icon: Compass },
    { label: 'Settings', href: '/profile', icon: Settings },
  ],
  admin: [
    { label: 'Overview', href: '/admin', icon: LayoutDashboard },
    { label: 'Scan Tickets', href: '/organizer/scan', icon: QrCode },
    { label: 'Explore', href: '/events', icon: Compass },
    { label: 'Settings', href: '/profile', icon: Settings },
  ],
};

export function DashboardShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = NAV_BY_ROLE[user?.role || 'attendee'] || NAV_BY_ROLE.attendee;

  const SidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex items-center h-16 px-5 border-b border-border shrink-0">
        <Link href="/" className="flex items-center">
          <Image src="/storage/logo.png" alt="Spotlighticket" width={219} height={99} className="h-8 w-auto object-contain" />
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-secondary transition-colors text-left">
              <Avatar>
                <AvatarFallback>{user?.name?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{user?.name}</p>
                <p className="text-xs text-muted-foreground truncate capitalize">{user?.role}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href="/profile">
                <Settings className="w-4 h-4" /> Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
              <LogOut className="w-4 h-4" /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:fixed lg:inset-y-0 lg:w-64 lg:flex-col border-r border-border bg-card">
        {SidebarContent}
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="fixed inset-y-0 left-0 w-64 bg-card border-r border-border">
            {SidebarContent}
          </aside>
        </div>
      )}

      <div className="lg:pl-64 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 border-b border-border bg-background/95 backdrop-blur">
          <div className="flex items-center gap-3 min-w-0">
            <button
              className="lg:hidden text-foreground shrink-0"
              onClick={() => setMobileOpen((v) => !v)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="min-w-0">
              <h1 className="text-lg font-display font-bold leading-tight truncate">{title}</h1>
              {description && <p className="text-xs text-muted-foreground truncate hidden sm:block">{description}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
