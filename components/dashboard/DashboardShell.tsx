'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useSearchParams } from 'next/navigation';
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
  Users,
  Calendar,
  Receipt,
  Newspaper,
  UserCircle,
  Wrench,
  Percent,
  Globe,
  Webhook,
  Trash2,
  Activity,
  AlertTriangle,
  BadgeCheck,
  Wallet,
} from 'lucide-react';

type NavLink = { type: 'link'; label: string; href: string; icon: any };
type NavGroup = { type: 'group'; label: string; icon: any; items: { label: string; href: string; icon: any }[] };
type NavEntry = NavLink | NavGroup;

const link = (label: string, href: string, icon: any): NavLink => ({ type: 'link', label, href, icon });

const NAV_BY_ROLE: Record<string, NavEntry[]> = {
  attendee: [
    link('Overview', '/dashboard', LayoutDashboard),
    link('My Tickets', '/my-tickets', Ticket),
    link('Explore', '/events', Compass),
    link('Settings', '/profile', Settings),
  ],
  organizer: [
    link('Overview', '/organizer', LayoutDashboard),
    link('Create Event', '/create-event', PlusCircle),
    link('Scan Tickets', '/organizer/scan', QrCode),
    link('Verification', '/organizer/verification', BadgeCheck),
    link('Wallet', '/organizer/wallet', Wallet),
    link('Explore', '/events', Compass),
    link('Settings', '/profile', Settings),
  ],
  admin: [
    link('Overview', '/admin?tab=overview', LayoutDashboard),
    {
      type: 'group',
      label: 'Admin Tools',
      icon: Wrench,
      items: [
        { label: 'Users', href: '/admin?tab=users', icon: Users },
        { label: 'Events', href: '/admin?tab=events', icon: Calendar },
        { label: 'KYC Review', href: '/admin?tab=kyc', icon: BadgeCheck },
        { label: 'Withdrawals', href: '/admin?tab=withdrawals', icon: Wallet },
        { label: 'Tickets', href: '/admin?tab=tickets', icon: Ticket },
        { label: 'Payments', href: '/admin?tab=payments', icon: Receipt },
        { label: 'Blog', href: '/admin?tab=blog', icon: Newspaper },
        { label: 'General & Fees', href: '/admin?tab=settings&sub=general', icon: Percent },
        { label: 'SEO', href: '/admin?tab=settings&sub=seo', icon: Globe },
        { label: 'Webhooks', href: '/admin?tab=settings&sub=webhooks', icon: Webhook },
        { label: 'Cache', href: '/admin?tab=settings&sub=cache', icon: Trash2 },
        { label: 'Activity Logs', href: '/admin?tab=settings&sub=activity', icon: Activity },
        { label: 'Error Logs', href: '/admin?tab=settings&sub=errors', icon: AlertTriangle },
      ],
    },
    link('Scan Tickets', '/organizer/scan', QrCode),
    link('Explore', '/events', Compass),
    link('My Profile', '/profile', UserCircle),
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
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab');
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = NAV_BY_ROLE[user?.role || 'attendee'] || NAV_BY_ROLE.attendee;

  const isItemActive = (href: string) => {
    const [itemPath, itemQuery] = href.split('?');
    if (pathname !== itemPath) return false;
    if (!itemQuery) return !currentTab && searchParams.toString() === '';

    const itemParams = new URLSearchParams(itemQuery);
    for (const [key, value] of itemParams.entries()) {
      const actual = searchParams.get(key) ?? (key === 'tab' ? 'overview' : key === 'sub' ? 'general' : null);
      if (actual !== value) return false;
    }
    return true;
  };

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const entry of navItems) {
      if (entry.type === 'group') {
        initial[entry.label] = entry.items.some((i) => isItemActive(i.href));
      }
    }
    return initial;
  });

  const navLink = (item: { label: string; href: string; icon: any }, indent = false) => {
    const isActive = isItemActive(item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => setMobileOpen(false)}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-none text-sm font-medium transition-colors ${indent ? 'ml-3 pl-3 border-l border-border' : ''} ${
          isActive
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
        }`}
      >
        <item.icon className="w-4 h-4 shrink-0" />
        {item.label}
      </Link>
    );
  };

  const SidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex items-center h-16 px-5 border-b border-border shrink-0">
        <Link href="/" className="flex items-center">
          <Image src="/storage/logo.png" alt="Spotlighticket" width={219} height={99} className="h-8 w-auto object-contain" />
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((entry) => {
          if (entry.type === 'link') {
            return navLink(entry);
          }

          const isOpen = openGroups[entry.label] ?? false;
          return (
            <div key={entry.label}>
              <button
                type="button"
                onClick={() => setOpenGroups((prev) => ({ ...prev, [entry.label]: !isOpen }))}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-none text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              >
                <entry.icon className="w-4 h-4 shrink-0" />
                <span className="flex-1 text-left">{entry.label}</span>
                <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              {isOpen && (
                <div className="mt-1 space-y-1">
                  {entry.items.map((item) => navLink(item, true))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-3 px-2 py-2 rounded-none hover:bg-secondary transition-colors text-left">
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
