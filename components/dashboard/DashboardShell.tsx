'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Logo } from '@/components/Logo';
import {
  Avatar,
  AvatarImage,
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
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
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
  ChevronsLeft,
  ChevronsRight,
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
  ShieldCheck,
  Crown,
  Store,
  LifeBuoy,
  Briefcase,
  Clapperboard,
  Building2,
} from 'lucide-react';
import { NairaSign } from '@/components/icons/NairaSign';
import { TopProgressBar } from '@/components/TopProgressBar';

type NavLink = { type: 'link'; label: string; href: string; icon: any };
type NavGroup = { type: 'group'; label: string; icon: any; items: { label: string; href: string; icon: any }[] };
type NavEntry = NavLink | NavGroup;

const link = (label: string, href: string, icon: any): NavLink => ({ type: 'link', label, href, icon });

const NAV_BY_ROLE: Record<string, NavEntry[]> = {
  attendee: [
    link('Overview', '/dashboard', LayoutDashboard),
    link('My Tickets', '/my-tickets', Ticket),
    link('Explore', '/events', Compass),
    link('Pricing', '/pricing', NairaSign),
    link('Support', '/support', LifeBuoy),
    link('Settings', '/profile', Settings),
  ],
  organizer: [
    link('Overview', '/organizer', LayoutDashboard),
    link('Create', '/create', PlusCircle),
    link('My Movies', '/organizer/movies', Clapperboard),
    link('My Venues', '/organizer/venues', Building2),
    link('Scan Tickets', '/organizer/scan', QrCode),
    link('Verification', '/organizer/verification', BadgeCheck),
    link('Wallet', '/organizer/wallet', Wallet),
    link('Pricing', '/pricing', NairaSign),
    link('Explore', '/events', Compass),
    link('Support', '/support', LifeBuoy),
    link('Settings', '/profile', Settings),
  ],
  vendor: [
    link('My Listing', '/vendor', Store),
    link('Settings', '/profile', Settings),
  ],
};

const ELEVATED_ROLES = ['super-admin', 'developer'];

function buildAdminNav(role: string): NavEntry[] {
  const isElevated = ELEVATED_ROLES.includes(role);

  const adminToolsItems = [
    { label: 'Users', href: '/admin?tab=users', icon: Users },
    { label: 'Events', href: '/admin?tab=events', icon: Calendar },
    { label: 'KYC Review', href: '/admin?tab=kyc', icon: BadgeCheck },
    { label: 'Withdrawals', href: '/admin?tab=withdrawals', icon: Wallet },
    { label: 'Tickets', href: '/admin?tab=tickets', icon: Ticket },
    { label: 'Payments', href: '/admin?tab=payments', icon: Receipt },
    { label: 'Blog', href: '/admin?tab=blog', icon: Newspaper },
    { label: 'Vendors', href: '/admin?tab=vendors', icon: Store },
    { label: 'Support Tickets', href: '/admin?tab=support', icon: LifeBuoy },
  ];

  // Admin Settings and Roles & Staff Management are super-admin/developer only.
  if (isElevated) {
    adminToolsItems.push(
      { label: 'Roles & Staff', href: '/admin?tab=settings&sub=staff', icon: ShieldCheck },
      { label: 'Manage Staff Roles', href: '/admin?tab=settings&sub=staff-roles', icon: LifeBuoy },
      { label: 'General & Fees', href: '/admin?tab=settings&sub=general', icon: Percent },
      { label: 'SEO', href: '/admin?tab=settings&sub=seo', icon: Globe },
      { label: 'Webhooks', href: '/admin?tab=settings&sub=webhooks', icon: Webhook },
      { label: 'Cache', href: '/admin?tab=settings&sub=cache', icon: Trash2 },
      { label: 'Activity Logs', href: '/admin?tab=settings&sub=activity', icon: Activity },
      { label: 'Error Logs', href: '/admin?tab=settings&sub=errors', icon: AlertTriangle }
    );
  }

  return [
    link('Overview', '/admin?tab=overview', LayoutDashboard),
    { type: 'group', label: 'Admin Tools', icon: Wrench, items: adminToolsItems },
    link('Organizer', '/organizer', Briefcase),
    link('My Movies', '/organizer/movies', Clapperboard),
    link('My Venues', '/organizer/venues', Building2),
    link('Scan Tickets', '/organizer/scan', QrCode),
    link('Pricing', '/pricing', NairaSign),
    link('Explore', '/events', Compass),
    link('My Profile', '/profile', UserCircle),
  ];
}

/**
 * A 'staff' account has no fixed nav — it's built from whatever permissions
 * their assigned StaffRole actually grants (see StaffRole::PERMISSIONS on
 * the backend), so a Finance role and a Customer Support role see
 * different things without needing separate code for each.
 */
function buildStaffNav(permissions: string[]): NavEntry[] {
  const items: NavEntry[] = [];
  if (permissions.includes('view_users')) items.push(link('Users', '/admin?tab=users', Users));
  if (permissions.includes('support_tickets')) items.push(link('Support Tickets', '/admin?tab=support', LifeBuoy));
  if (permissions.includes('finance')) {
    items.push(link('Withdrawals', '/admin?tab=withdrawals', Wallet));
    items.push(link('Payments', '/admin?tab=payments', Receipt));
  }
  if (permissions.includes('operations')) {
    items.push(link('Events', '/admin?tab=events', Calendar));
    items.push(link('My Movies', '/organizer/movies', Clapperboard));
    items.push(link('My Venues', '/organizer/venues', Building2));
    items.push(link('KYC Review', '/admin?tab=kyc', BadgeCheck));
    items.push(link('Blog', '/admin?tab=blog', Newspaper));
    items.push(link('Vendors', '/admin?tab=vendors', Store));
  }
  // Read-only platform-wide events visibility (via OrganizerController's
  // isStaff() bypass) — not gated behind a specific permission since every
  // staff position can reasonably need to look up an organizer's event.
  items.push(link('Organizer', '/organizer', Briefcase));
  items.push(link('Explore', '/events', Compass));
  items.push(link('My Profile', '/profile', UserCircle));
  return items;
}

export function DashboardShell(props: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  // useSearchParams() below opts this whole subtree into client-only
  // rendering, which Next.js requires a Suspense boundary for during static
  // generation — without it the production build fails outright on every
  // page that renders this shell.
  return (
    <Suspense fallback={null}>
      <DashboardShellInner {...props} />
    </Suspense>
  );
}

function DashboardShellInner({
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

  // Desktop-only icon-rail mode, remembered per browser like the theme
  // preference. Starts false (matching SSR output) and is corrected from
  // localStorage on mount, rather than read synchronously in the
  // initializer, to avoid a hydration mismatch against the server render.
  const [dense, setDense] = useState(false);
  const [denseHydrated, setDenseHydrated] = useState(false);

  useEffect(() => {
    setDense(window.localStorage.getItem('sidebar-dense') === '1');
    setDenseHydrated(true);
  }, []);

  useEffect(() => {
    if (denseHydrated) window.localStorage.setItem('sidebar-dense', dense ? '1' : '0');
  }, [dense, denseHydrated]);

  const role = user?.role || 'attendee';
  const navItems = ['admin', 'super-admin', 'developer'].includes(role)
    ? buildAdminNav(role)
    : role === 'staff'
    ? buildStaffNav(user?.staff_role?.permissions || [])
    : NAV_BY_ROLE[role] || NAV_BY_ROLE.attendee;

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

  const navLink = (item: { label: string; href: string; icon: any }, indent = false, isDense = false) => {
    const isActive = isItemActive(item.href);
    const link = (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => setMobileOpen(false)}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-none text-sm font-medium transition-colors ${
          isDense ? 'justify-center px-0' : ''
        } ${indent && !isDense ? 'ml-3 pl-3 border-l border-border' : ''} ${
          isActive
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:bg-primary/20 hover:text-primary'
        }`}
      >
        <item.icon className="w-4 h-4 shrink-0" />
        {!isDense && <span>{item.label}</span>}
      </Link>
    );

    if (!isDense) return link;

    return (
      <Tooltip key={item.href} delayDuration={200}>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right">{item.label}</TooltipContent>
      </Tooltip>
    );
  };

  // Rendered twice — once for the desktop rail (which respects `dense`) and
  // once for the mobile drawer (always full-width) — so dense mode never
  // leaks into the mobile layout.
  const renderSidebarContent = (isDense: boolean) => (
    <div className="flex h-full flex-col">
      <div className={`flex items-center h-16 border-b border-border shrink-0 ${isDense ? 'justify-center px-2' : 'px-5'}`}>
        <Link href="/" className="flex items-center">
          <Logo className="h-10 w-auto object-contain" />
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((entry) => {
          if (entry.type === 'link') {
            return navLink(entry, false, isDense);
          }

          if (isDense) {
            // No room for a collapsible group header at icon-rail width —
            // flatten straight to the leaf items, each with its own tooltip.
            return entry.items.map((item) => navLink(item, false, true));
          }

          const isOpen = openGroups[entry.label] ?? false;
          return (
            <div key={entry.label}>
              <button
                type="button"
                onClick={() => setOpenGroups((prev) => ({ ...prev, [entry.label]: !isOpen }))}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-none text-sm font-medium text-muted-foreground hover:bg-primary/20 hover:text-primary transition-colors"
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
            <button className={`w-full flex items-center gap-3 py-2 rounded-none hover:bg-secondary transition-colors text-left ${isDense ? 'justify-center px-0' : 'px-2'}`}>
              <Avatar>
                {user?.avatar_url && <AvatarImage src={user.avatar_url} alt={user.name} />}
                <AvatarFallback>{user?.name?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
              </Avatar>
              {!isDense && (
                <>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{user?.name}</p>
                    <p className="text-xs text-muted-foreground truncate capitalize flex items-center gap-1">
                      {user?.role === 'developer' && <Crown className="w-3 h-3 text-amber-500 shrink-0" fill="currentColor" />}
                      {user?.role === 'super-admin' && <Crown className="w-3 h-3 text-slate-400 shrink-0" fill="currentColor" />}
                      {user?.role}
                    </p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                </>
              )}
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
    <TooltipProvider delayDuration={200}>
    <div className="min-h-screen bg-background">
      <TopProgressBar />
      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex lg:fixed lg:inset-y-0 lg:flex-col relative border-r border-border bg-card transition-[width] duration-200 ${
          dense ? 'lg:w-[72px]' : 'lg:w-64'
        }`}
      >
        {renderSidebarContent(dense)}
        <button
          type="button"
          onClick={() => setDense((v) => !v)}
          className="absolute -right-3 top-20 hidden lg:flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-card hover:text-primary hover:border-primary/40 transition-colors"
          aria-label={dense ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {dense ? <ChevronsRight className="w-3.5 h-3.5" /> : <ChevronsLeft className="w-3.5 h-3.5" />}
        </button>
      </aside>

      {/* Mobile sidebar overlay — always full-width, unaffected by desktop dense mode */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="fixed inset-y-0 left-0 w-64 bg-card border-r border-border">
            {renderSidebarContent(false)}
          </aside>
        </div>
      )}

      <div className={`flex flex-col min-h-screen transition-[padding] duration-200 ${dense ? 'lg:pl-[72px]' : 'lg:pl-64'}`}>
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
    </TooltipProvider>
  );
}
