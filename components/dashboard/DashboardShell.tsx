'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useAuth } from '@/components/AuthProvider';
import { dashboardSans, dashboardHeading } from '@/app/fonts/dashboard';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
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
  Search,
  Moon,
  Sun,
  Users,
  Calendar,
  Receipt,
  Newspaper,
  UserCircle,
  Percent,
  Globe,
  Webhook,
  Trash2,
  Activity,
  AlertTriangle,
  BadgeCheck,
  Wallet,
  ShieldCheck,
  Store,
  LifeBuoy,
  Briefcase,
  Clapperboard,
  Building2,
  ShieldAlert,
  ShieldBan,
  Contact,
  Megaphone,
  Home,
  ShoppingBag,
  LayoutGrid,
  Package,
  HeartHandshake,
  CreditCard,
  Scale,
} from 'lucide-react';
import { NairaSign } from '@/components/icons/NairaSign';
import { TopProgressBar } from '@/components/TopProgressBar';
import { AnnouncementTicker } from '@/components/dashboard/AnnouncementTicker';

type NavItem = { label: string; href: string; icon: any };
type NavSection = { title: string; items: NavItem[] };

const item = (label: string, href: string, icon: any): NavItem => ({ label, href, icon });

const NAV_BY_ROLE: Record<string, NavSection[]> = {
  attendee: [
    { title: 'Tickets', items: [
      item('Overview', '/dashboard', LayoutDashboard),
      item('My Tickets', '/my-tickets', Ticket),
      item('My Orders', '/my-orders', ShoppingBag),
      item('My Promotions', '/promoter', Megaphone),
    ] },
    { title: 'Discover', items: [
      item('Explore', '/events', Compass),
      item('Shop', '/shop', Store),
      item('Pricing', '/pricing', NairaSign),
    ] },
    { title: 'Account', items: [
      item('Support', '/support', LifeBuoy),
      item('Settings', '/profile', Settings),
    ] },
  ],
  organizer: [
    { title: 'Workspace', items: [
      item('Overview', '/organizer', LayoutDashboard),
      item('Create', '/create', PlusCircle),
      item('Attendees', '/organizer/attendees', Contact),
      item('Donations', '/organizer/donations', HeartHandshake),
      item('Scan Tickets', '/organizer/scan', QrCode),
    ] },
    { title: 'Listings', items: [
      item('My Movies', '/organizer/movies', Clapperboard),
      item('My Venues', '/organizer/venues', Building2),
    ] },
    { title: 'Money', items: [
      item('Wallet', '/organizer/wallet', Wallet),
      item('My Promotions', '/promoter', Megaphone),
      item('Verification', '/organizer/verification', BadgeCheck),
    ] },
    { title: 'More', items: [
      item('Pricing', '/pricing', NairaSign),
      item('Explore', '/events', Compass),
      item('Support', '/support', LifeBuoy),
      item('Settings', '/profile', Settings),
    ] },
  ],
  vendor: [
    { title: 'Storefront', items: [
      item('My Listing', '/vendor', Store),
      item('Products', '/vendor/products', ShoppingBag),
      item('Portfolio', '/vendor/portfolio', LayoutGrid),
      item('Orders', '/vendor/orders', Package),
    ] },
    { title: 'Money', items: [
      item('Wallet', '/organizer/wallet', Wallet),
      item('Verification', '/vendor/verification', BadgeCheck),
    ] },
    { title: 'More', items: [
      item('Shop', '/shop', Compass),
      item('Support', '/support', LifeBuoy),
      item('Settings', '/profile', Settings),
    ] },
  ],
};

const ELEVATED_ROLES = ['super-admin', 'developer'];

function buildAdminNav(role: string): NavSection[] {
  const sections: NavSection[] = [
    { title: 'Overview', items: [item('Overview', '/admin?tab=overview', LayoutDashboard)] },
    { title: 'Operations', items: [
      item('Users', '/admin?tab=users', Users),
      item('Events', '/admin?tab=events', Calendar),
      item('Tickets', '/admin?tab=tickets', Ticket),
      item('KYC Review', '/admin?tab=kyc', BadgeCheck),
      item('Fraud Flags', '/admin?tab=fraud', ShieldBan),
    ] },
    { title: 'Finance', items: [
      item('Payments', '/admin?tab=payments', Receipt),
      item('Withdrawals', '/admin?tab=withdrawals', Wallet),
    ] },
    { title: 'Content & support', items: [
      item('Announcements', '/admin?tab=announcements', Megaphone),
      item('Blog', '/admin?tab=blog', Newspaper),
      item('Vendors', '/admin?tab=vendors', Store),
      item('Support Tickets', '/admin?tab=support', LifeBuoy),
    ] },
  ];

  // Admin Settings and Roles & Staff Management are super-admin/developer only.
  if (ELEVATED_ROLES.includes(role)) {
    sections.push({ title: 'Settings', items: [
      item('Roles & Staff', '/admin?tab=settings&sub=staff', ShieldCheck),
      item('Manage Staff Roles', '/admin?tab=settings&sub=staff-roles', LifeBuoy),
      item('General & Fees', '/admin?tab=settings&sub=general', Percent),
      item('SEO', '/admin?tab=settings&sub=seo', Globe),
      item('Payment Settings', '/admin?tab=settings&sub=payments', CreditCard),
      item('Webhooks', '/admin?tab=settings&sub=webhooks', Webhook),
      item('Wallet Adjustments', '/admin?tab=wallet', Scale),
      item('Cache', '/admin?tab=settings&sub=cache', Trash2),
      item('Patch', '/admin?tab=settings&sub=patch', ShieldAlert),
      item('Activity Logs', '/admin?tab=settings&sub=activity', Activity),
      item('Error Logs', '/admin?tab=settings&sub=errors', AlertTriangle),
    ] });
  }

  sections.push(
    { title: 'Organizer tools', items: [
      item('Organizer', '/organizer', Briefcase),
      item('Attendees', '/organizer/attendees', Contact),
      item('Donations', '/organizer/donations', HeartHandshake),
      item('My Movies', '/organizer/movies', Clapperboard),
      item('My Venues', '/organizer/venues', Building2),
      item('Scan Tickets', '/organizer/scan', QrCode),
    ] },
    { title: 'More', items: [
      item('Pricing', '/pricing', NairaSign),
      item('Explore', '/events', Compass),
      item('My Profile', '/profile', UserCircle),
    ] },
  );
  return sections;
}

/**
 * A 'staff' account has no fixed nav — it's built from whatever permissions
 * their assigned StaffRole actually grants (see StaffRole::PERMISSIONS on
 * the backend), so a Finance role and a Customer Support role see
 * different things without needing separate code for each.
 */
function buildStaffNav(permissions: string[]): NavSection[] {
  const work: NavItem[] = [];
  if (permissions.includes('view_users')) work.push(item('Users', '/admin?tab=users', Users));
  if (permissions.includes('support_tickets')) work.push(item('Support Tickets', '/admin?tab=support', LifeBuoy));
  if (permissions.includes('finance')) {
    work.push(item('Withdrawals', '/admin?tab=withdrawals', Wallet));
    work.push(item('Payments', '/admin?tab=payments', Receipt));
  }
  if (permissions.includes('operations')) {
    work.push(item('Events', '/admin?tab=events', Calendar));
    work.push(item('Attendees', '/organizer/attendees', Contact));
    work.push(item('My Movies', '/organizer/movies', Clapperboard));
    work.push(item('My Venues', '/organizer/venues', Building2));
    work.push(item('KYC Review', '/admin?tab=kyc', BadgeCheck));
    work.push(item('Blog', '/admin?tab=blog', Newspaper));
    work.push(item('Vendors', '/admin?tab=vendors', Store));
  }
  const sections: NavSection[] = work.length ? [{ title: 'Your work', items: work }] : [];
  // Not permission-gated — any staff position may need to look up an organizer.
  sections.push({ title: 'More', items: [
    item('Organizer', '/organizer', Briefcase),
    item('Explore', '/events', Compass),
    item('My Profile', '/profile', UserCircle),
  ] });
  return sections;
}

const SURFACE_BY_ROLE: Record<string, string> = {
  attendee: 'Your account',
  organizer: 'Organizer workspace',
  vendor: 'Vendor listing',
  staff: 'Staff console',
  admin: 'Admin console',
  'super-admin': 'Admin console',
  developer: 'Admin console',
};

export function DashboardShell(props: {
  title: string;
  description?: string;
  /** Buttons shown at the right of the page title row. */
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  // Suspense boundary required: useSearchParams() below needs one for static generation to build.
  return (
    <Suspense fallback={null}>
      <DashboardShellInner {...props} />
    </Suspense>
  );
}

function initials(name?: string | null): string {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean).slice(0, 2);
  return parts.map((p) => p.charAt(0).toUpperCase()).join('') || 'S';
}

function DashboardShellInner({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab');
  const { user, logout } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => setMounted(true), []);

  // The page behind must not scroll under the open drawer.
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const role = user?.role || 'attendee';
  const sections = ['admin', 'super-admin', 'developer'].includes(role)
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

  const surface = role === 'staff' && user?.staff_role?.name ? user.staff_role.name : SURFACE_BY_ROLE[role] ?? 'Dashboard';
  const roleLabel = role === 'staff' ? user?.staff_role?.name || 'Staff' : role.replace('-', ' ');
  const verified = !!(user as { is_verified?: boolean } | null)?.is_verified;

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = search.trim();
    router.push(q ? `/events?search=${encodeURIComponent(q)}` : '/events');
  };

  const sidebar = (
    <div className="flex h-full flex-col bg-card border-r border-border">
      <div className="px-4 pt-8 flex flex-col gap-4 shrink-0">
        <div className="flex items-center justify-between gap-3">
          {/* Who you're acting as, stated before any navigation. */}
          <Link href="/" className="flex flex-1 min-w-0 items-center gap-3 p-2.5 border border-border rounded-[0.5rem] bg-card hover:bg-muted transition-colors" aria-label="Spotlighticket home">
            <span className="w-9 h-9 shrink-0 rounded-[0.4rem] bg-primary/10 text-primary flex items-center justify-center font-display text-sm" aria-hidden="true">ST</span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-foreground truncate">Spotlighticket</span>
              <span className="block text-xs text-muted-foreground truncate">{surface}</span>
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="lg:hidden w-9 h-9 shrink-0 inline-flex items-center justify-center border border-border rounded-[0.5rem] text-muted-foreground"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <hr className="border-0 h-px bg-border" />
      </div>

      <nav className="dash-scroll flex-1 overflow-y-auto p-4" aria-label="Dashboard">
        <ul className="flex flex-col gap-2">
          {sections.map((section, i) => (
            <li key={section.title} className={i > 0 ? 'mt-2 pt-4 border-t border-border' : ''}>
              <span className="block pb-1 text-xs uppercase text-muted-foreground">{section.title}</span>
              <ul className="flex flex-col gap-1">
                {section.items.map((navItem) => {
                  const active = isItemActive(navItem.href);
                  return (
                    <li key={navItem.href}>
                      <Link
                        href={navItem.href}
                        onClick={() => setMobileOpen(false)}
                        aria-current={active ? 'page' : undefined}
                        className={`h-10 flex items-center gap-4 px-2 rounded-[0.5rem] whitespace-nowrap overflow-hidden transition-colors ${
                          active ? 'bg-muted text-foreground font-medium' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                      >
                        {/* Active is weight plus a tinted icon, never colour alone. */}
                        <navItem.icon className={`w-[18px] h-[18px] shrink-0 ${active ? 'text-primary' : ''}`} />
                        <span className="truncate">{navItem.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>
      </nav>

      <div className="px-4 pb-6 text-xs text-muted-foreground shrink-0">
        Spotlighticket &middot; {new Date().getFullYear()}
      </div>
    </div>
  );

  return (
    <div className={`dash-ui ${dashboardSans.variable} ${dashboardHeading.variable} min-h-screen bg-background text-foreground`}>
      <TopProgressBar />

      {/* Fixed sidebar on desktop */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 z-40 w-[272px]">{sidebar}</aside>

      {/* Drawer on smaller screens, with a scrim to tap away */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/45" onClick={() => setMobileOpen(false)} />
          <aside className="fixed inset-y-0 left-0 w-[min(280px,86vw)]">{sidebar}</aside>
        </div>
      )}

      <div className="lg:pl-[272px] flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 h-[72px] flex items-center justify-between gap-4 px-4 sm:px-6 bg-card border-b border-border">
          <div className="flex items-center gap-3 sm:gap-6 min-w-0 flex-1 max-w-[420px]">
            <button
              type="button"
              className="lg:hidden w-10 h-10 shrink-0 inline-flex items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              aria-expanded={mobileOpen}
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* A real search: lands on Explore with the term applied. */}
            <form onSubmit={submitSearch} role="search" className="relative flex-1 min-w-0 hidden md:block">
              <Search className="w-[18px] h-[18px] absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <label htmlFor="dash-search" className="sr-only">Search events</label>
              <input
                id="dash-search"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search events"
                autoComplete="off"
                className="w-full h-10 pl-[42px] pr-3.5 text-sm bg-background border border-input rounded-[0.5rem] placeholder:text-muted-foreground"
              />
            </form>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span
              className={`hidden sm:inline-flex items-center gap-[7px] h-8 px-3 rounded-full text-xs font-medium whitespace-nowrap capitalize ${
                verified
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                  : 'bg-primary/10 text-primary'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current" aria-hidden="true" />
              {verified ? 'Verified' : roleLabel}
            </span>

            <span className="hidden sm:block w-px h-6 bg-border" aria-hidden="true" />

            <button
              type="button"
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              className="w-10 h-10 inline-flex items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Switch between light and dark"
            >
              {mounted && resolvedTheme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="w-10 h-10 rounded-full overflow-hidden bg-primary/10 text-primary inline-flex items-center justify-center font-display text-sm"
                  aria-label="Account"
                >
                  {user?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    initials(user?.name)
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className={`dash-ui ${dashboardSans.variable} ${dashboardHeading.variable} w-72 p-0 rounded-[0.7rem] border border-border`}>
                <div className="p-4 flex items-center gap-3 border-b border-border">
                  <span className="w-10 h-10 shrink-0 rounded-full bg-primary/10 text-primary inline-flex items-center justify-center font-display text-sm" aria-hidden="true">
                    {initials(user?.name)}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{user?.name}</p>
                    <p className="text-xs text-muted-foreground truncate capitalize">{roleLabel}</p>
                  </div>
                </div>
                <div className="p-2">
                  <DropdownMenuItem asChild className="gap-3 p-2.5 rounded-[0.5rem] cursor-pointer">
                    <Link href="/profile"><Settings className="w-[18px] h-[18px]" /> Your account</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="gap-3 p-2.5 rounded-[0.5rem] cursor-pointer">
                    <Link href="/"><Home className="w-[18px] h-[18px]" /> Back to the site</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="gap-3 p-2.5 rounded-[0.5rem] cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="w-[18px] h-[18px]" /> Sign out
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {user?.must_change_password && (
          <Link href="/profile/security?change_password=1" className="block px-4 sm:px-6 py-2.5 text-sm bg-amber-500/15 border-b border-border hover:bg-amber-500/20">
            <strong>Choose your own password.</strong> Yours was set by our team — change it now in Security settings →
          </Link>
        )}
        {user && <AnnouncementTicker key={user.id} />}

        <main className="flex-1 w-full max-w-[1536px] mx-auto px-4 py-6 sm:p-6 flex flex-col gap-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-[1.75rem] leading-[2.125rem] sm:text-[2rem] sm:leading-[2.375rem]">{title}</h1>
              {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
            </div>
            {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
          </div>
          <div className="min-w-0">{children}</div>
        </main>
      </div>
    </div>
  );
}
