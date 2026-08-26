'use client';

import { Fragment, Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { StatCard } from '@/components/dashboard/StatCard';
import { useAuth } from '@/components/AuthProvider';
import { isStaffRole, StaffRole as StaffRoleType } from '@/lib/auth';
import { staffRoles as staffRolesApi } from '@/lib/staffRoles';
import { getGreeting } from '@/lib/utils';
import { admin, AdminDashboard } from '@/lib/admin';
import { wallet } from '@/lib/wallet';
import { payments } from '@/lib/payments';
import { tickets } from '@/lib/tickets';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Users, Calendar, Ticket, Award, Plus, Edit, Trash, ChevronUp, ChevronDown, Newspaper, Receipt, Search, Download, Crown, Eye, EyeOff, Phone, Mail, ShieldCheck } from 'lucide-react';
import { NairaSign } from '@/components/icons/NairaSign';
import { SettingsTab } from '@/components/admin/SettingsTab';
import { DashboardCharts } from '@/components/admin/DashboardCharts';
import { RichTextEditor } from '@/components/RichTextEditor';
import { KycReviewTab } from '@/components/admin/KycReviewTab';
import { WithdrawalsTab } from '@/components/admin/WithdrawalsTab';
import { VendorsTab } from '@/components/admin/VendorsTab';
import { SupportTicketsTab } from '@/components/admin/SupportTicketsTab';
import { VerifiedBadge } from '@/components/VerifiedBadge';
import Link from 'next/link';

type AdminTab = 'overview' | 'users' | 'events' | 'kyc' | 'withdrawals' | 'tickets' | 'payments' | 'blog' | 'vendors' | 'settings' | 'support';
const VALID_TABS: AdminTab[] = ['overview', 'users', 'events', 'kyc', 'withdrawals', 'tickets', 'payments', 'blog', 'vendors', 'settings', 'support'];

export default function AdminDashboardPage() {
  // useSearchParams() below requires a Suspense ancestor for Next.js's
  // production build (static generation) — without it the build fails.
  return (
    <Suspense fallback={null}>
      <AdminDashboardPageInner />
    </Suspense>
  );
}

function AdminDashboardPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: authUser, loading: authLoading } = useAuth();
  const isElevatedActor = !!authUser?.role && ['super-admin', 'developer'].includes(authUser.role);
  const isDeveloperActor = authUser?.role === 'developer';
  const isStaffActor = authUser?.role === 'staff';
  const actorPermissions = authUser?.staff_role?.permissions || [];
  const actorCan = (permission: string) => isElevatedActor || (authUser?.role === 'admin') || actorPermissions.includes(permission);
  const canChangeRoleOf = (u: any) => {
    if (u.role === 'developer') return false;
    if (u.role === 'super-admin') return isDeveloperActor;
    return true;
  };
  const canDeleteUser = (u: any) => {
    if (u.role === 'developer') return false;
    if (u.role === 'super-admin') return isDeveloperActor;
    return true;
  };
  const roleCrown = (role: string) => {
    if (role === 'developer') return <Crown className="w-3.5 h-3.5 text-amber-500" fill="currentColor" />;
    if (role === 'super-admin') return <Crown className="w-3.5 h-3.5 text-slate-400" fill="currentColor" />;
    return null;
  };
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const tabParam = searchParams.get('tab') as AdminTab | null;
  const [activeTab, setActiveTabState] = useState<AdminTab>(
    tabParam && VALID_TABS.includes(tabParam) ? tabParam : 'overview'
  );

  const [usersList, setUsersList] = useState<any[]>([]);
  const [eventsList, setEventsList] = useState<any[]>([]);
  const [ticketsList, setTicketsList] = useState<any[]>([]);
  const [paymentsList, setPaymentsList] = useState<any[]>([]);
  const [blogPostsList, setBlogPostsList] = useState<any[]>([]);

  type PageMeta = { current_page: number; last_page: number; total: number };
  const defaultPageMeta: PageMeta = { current_page: 1, last_page: 1, total: 0 };
  const [usersPage, setUsersPage] = useState<PageMeta>(defaultPageMeta);
  const [eventsPage, setEventsPage] = useState<PageMeta>(defaultPageMeta);
  const [ticketsPage, setTicketsPage] = useState<PageMeta>(defaultPageMeta);
  const [paymentsPage, setPaymentsPage] = useState<PageMeta>(defaultPageMeta);
  const [blogPage, setBlogPage] = useState<PageMeta>(defaultPageMeta);
  // sortBy is scoped per-tab: each resource has different valid columns, so a
  // sort field picked on one tab (e.g. "Published" on Blog) must not leak
  // into another tab's fetch (e.g. Tickets, where it isn't a valid column
  // and would silently fail server-side).
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('desc');

  const setActiveTab = (tab: AdminTab) => {
    setActiveTabState(tab);
    setSortBy('created_at');
    setSortDir('desc');
    setSearch('');
    setPaymentSearch('');
    router.replace(`/admin?tab=${tab}`, { scroll: false });
  };

  useEffect(() => {
    if (tabParam && VALID_TABS.includes(tabParam) && tabParam !== activeTab) {
      setActiveTabState(tabParam);
      setSortBy('created_at');
      setSortDir('desc');
      setSearch('');
      setPaymentSearch('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabParam]);
  const [search, setSearch] = useState<string>('');
  const [eventCategoryFilter, setEventCategoryFilter] = useState<string>('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('');
  const [ticketStatusFilter, setTicketStatusFilter] = useState<string>('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('');
  const [paymentSearch, setPaymentSearch] = useState<string>('');
  const [expandedUserId, setExpandedUserId] = useState<number | null>(null);
  const [organizerOverview, setOrganizerOverview] = useState<Record<number, any>>({});
  const [loadingOverviewId, setLoadingOverviewId] = useState<number | null>(null);

  const toggleExpandUser = async (u: any) => {
    if (expandedUserId === u.id) {
      setExpandedUserId(null);
      return;
    }
    setExpandedUserId(u.id);
    // Admin-only "view as organizer" balance peek — support can't reach this
    // endpoint (financial data), so don't even attempt the fetch for them.
    if (u.role === 'organizer' && !isStaffActor && !organizerOverview[u.id]) {
      setLoadingOverviewId(u.id);
      try {
        const data = await wallet.adminOrganizerOverview(u.id);
        setOrganizerOverview((prev) => ({ ...prev, [u.id]: data }));
      } catch {
        // Silently skip — the plain user-detail fields above still render fine.
      } finally {
        setLoadingOverviewId(null);
      }
    }
  };

  const [newUser, setNewUser] = useState<{name:string; email:string; role:'attendee'|'organizer'|'admin'|'super-admin'|'developer'|'staff'; staff_role_id: number | null; password:string}>({
    name: '', email: '', role: 'attendee', staff_role_id: null, password: ''
  });
  const [staffRolesList, setStaffRolesList] = useState<StaffRoleType[]>([]);
  const [creatingUser, setCreatingUser] = useState(false);

  const [newBlogPost, setNewBlogPost] = useState<{title:string; excerpt:string; content:string; category:string; image: File|null}>({
    title:'', excerpt:'', content:'', category:'General', image: null
  });
  const [creatingBlogPost, setCreatingBlogPost] = useState(false);
  const [editingBlogPostId, setEditingBlogPostId] = useState<number|null>(null);
  const [editingBlogPost, setEditingBlogPost] = useState<any>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!authUser) {
        router.push('/login');
      } else if (!isStaffRole(authUser.role)) {
        router.push('/dashboard');
      } else if (authUser.role === 'staff') {
        // Staff can't reach /admin/dashboard (strict admin-only endpoint) —
        // skip the platform-overview fetch entirely, and never leave them
        // sitting on the blank Overview tab if they land on a bare /admin.
        setLoading(false);
        if (activeTab === 'overview') {
          setActiveTab('users');
        }
      } else {
        loadDashboard();
      }
    }
  }, [authUser, authLoading]);

  useEffect(() => {
    if (isElevatedActor) {
      staffRolesApi.list().then((data) => setStaffRolesList(data.roles)).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isElevatedActor]);

  const loadDashboard = async () => {
    try {
      const data = await admin.getDashboard();
      setDashboard(data);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshUsers = async (page: number = usersPage.current_page, roleOverride?: string) => {
    const data = await admin.getUsers({ search, role: roleOverride ?? userRoleFilter, sort_by: sortBy, sort_dir: sortDir, page });
    setUsersList(data.data || data);
    setUsersPage({ current_page: data.current_page ?? 1, last_page: data.last_page ?? 1, total: data.total ?? 0 });
  };

  const refreshEvents = async (categoryOverride?: string, page: number = eventsPage.current_page) => {
    const data = await admin.getEvents({ search, category: categoryOverride ?? eventCategoryFilter, sort_by: sortBy, sort_dir: sortDir, page });
    setEventsList(data.data || data);
    setEventsPage({ current_page: data.current_page ?? 1, last_page: data.last_page ?? 1, total: data.total ?? 0 });
  };

  const refreshTickets = async (page: number = ticketsPage.current_page, statusOverride?: string) => {
    const data = await admin.getTickets({ code: search, status: statusOverride ?? ticketStatusFilter, sort_by: sortBy, sort_dir: sortDir, page });
    setTicketsList(data.data || data);
    setTicketsPage({ current_page: data.current_page ?? 1, last_page: data.last_page ?? 1, total: data.total ?? 0 });
  };

  const refreshPayments = async (statusOverride?: string, page: number = paymentsPage.current_page) => {
    const data = await admin.getPayments({ search: paymentSearch, status: statusOverride ?? paymentStatusFilter, sort_by: sortBy, sort_dir: sortDir, page });
    setPaymentsList(data.data || data);
    setPaymentsPage({ current_page: data.current_page ?? 1, last_page: data.last_page ?? 1, total: data.total ?? 0 });
  };

  const refreshBlogPosts = async (page: number = blogPage.current_page) => {
    const data = await admin.getBlogPosts({ search, sort_by: sortBy, sort_dir: sortDir, page });
    setBlogPage({ current_page: data.current_page ?? 1, last_page: data.last_page ?? 1, total: data.total ?? 0 });
    setBlogPostsList(data.data || data);
  };

  useEffect(() => {
    const load = async () => {
      try {
        if (activeTab === 'users') await refreshUsers();
        if (activeTab === 'events') await refreshEvents();
        if (activeTab === 'tickets') await refreshTickets();
        if (activeTab === 'payments') await refreshPayments();
        if (activeTab === 'blog') await refreshBlogPosts();
      } catch (e) {
        console.error('Failed to load admin list:', e);
      }
    };
    load();
  }, [activeTab, sortBy, sortDir]);

  if (authLoading || loading) {
    return (
      <DashboardShell title="Admin Dashboard">
        <div className="animate-pulse space-y-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-xl border border-border p-5">
                <div className="h-4 bg-muted rounded w-1/2 mb-4" />
                <div className="h-8 bg-muted rounded w-3/4" />
              </div>
            ))}
          </div>
        </div>
      </DashboardShell>
    );
  }

  if (!dashboard) {
    return (
      <DashboardShell title="Admin Dashboard">
        <p className="text-muted-foreground">Failed to load dashboard</p>
      </DashboardShell>
    );
  }

  const sortSelect = (options: { value: string; label: string }[]) => (
    <select
      className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
      value={sortBy}
      onChange={(e) => setSortBy(e.target.value)}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );

  const exportButtons = (resource: 'users' | 'events' | 'tickets' | 'payments', filters: Record<string, any>) => (
    <div className="flex items-center gap-1">
      <Button variant="outline" size="sm" onClick={() => admin.downloadExport(resource, 'csv', filters)}>
        <Download className="w-4 h-4" /> CSV
      </Button>
      <Button variant="outline" size="sm" onClick={() => admin.downloadExport(resource, 'pdf', filters)}>
        <Download className="w-4 h-4" /> PDF
      </Button>
    </div>
  );

  const paginationControls = (meta: PageMeta, onPageChange: (page: number) => void) => {
    if (meta.last_page <= 1) return null;
    return (
      <div className="flex items-center justify-between pt-4">
        <span className="text-xs text-muted-foreground">
          Page {meta.current_page} of {meta.last_page} ({meta.total} total)
        </span>
        <div className="flex gap-1">
          <Button variant="outline" size="sm" disabled={meta.current_page <= 1} onClick={() => onPageChange(meta.current_page - 1)}>Previous</Button>
          <Button variant="outline" size="sm" disabled={meta.current_page >= meta.last_page} onClick={() => onPageChange(meta.current_page + 1)}>Next</Button>
        </div>
      </div>
    );
  };

  return (
    <DashboardShell title="Admin Dashboard" description={`${getGreeting()}, ${authUser?.name}`}>
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Users}
            label="Total Users"
            value={String(dashboard.stats.total_users)}
            hint={`${dashboard.stats.total_organizers} organizers, ${dashboard.stats.total_attendees} attendees`}
          />
          <StatCard icon={Calendar} label="Total Events" value={String(dashboard.stats.total_events)} />
          <StatCard
            icon={NairaSign}
            label="Total Revenue"
            value={`₦${dashboard.stats.total_revenue.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`}
          />
          <StatCard
            icon={Ticket}
            label="Tickets Sold"
            value={String(dashboard.stats.total_tickets)}
            hint={`${dashboard.stats.total_transactions} transactions`}
          />
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          {/* Overview */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display font-bold text-lg">Revenue Breakdown</h2>
                  <span className="text-xs text-muted-foreground">{dashboard.stats.platform_fee_percentage}% platform fee</span>
                </div>
                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-lg border border-border">
                    <div className="text-sm font-medium mb-1 text-muted-foreground">Total Revenue</div>
                    <div className="text-xl font-display font-bold">₦{dashboard.stats.total_revenue.toLocaleString('en-NG', { maximumFractionDigits: 0 })}</div>
                  </div>
                  <div className="p-4 rounded-lg border border-border">
                    <div className="text-sm font-medium mb-1 text-muted-foreground">Platform Fee</div>
                    <div className="text-xl font-display font-bold">₦{dashboard.stats.platform_fee_total.toLocaleString('en-NG', { maximumFractionDigits: 0 })}</div>
                  </div>
                  <div className="p-4 rounded-lg border border-border">
                    <div className="text-sm font-medium mb-1 text-muted-foreground">Organizer Payouts</div>
                    <div className="text-xl font-display font-bold">₦{dashboard.stats.organizer_payout_total.toLocaleString('en-NG', { maximumFractionDigits: 0 })}</div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Adjust the fee percentage under Settings → General &amp; Fees.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display font-bold text-lg">Top Events</h2>
                  <Award className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  {dashboard.top_events.slice(0, 5).map((event: any, idx: number) => (
                    <div key={event.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{event.title}</p>
                          <p className="text-xs text-muted-foreground">{event.tickets_count} tickets sold</p>
                        </div>
                      </div>
                      <Link href={`/events/${event.id}`} className="text-sm font-medium text-primary hover:underline">
                        View
                      </Link>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <DashboardCharts
              eventsByCategory={dashboard.events_by_category}
              revenueTrends={dashboard.revenue_trends}
              topOrganizers={dashboard.top_organizers}
            />

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardContent className="p-6">
                  <h2 className="font-display font-bold text-lg mb-4">Recent Users</h2>
                  <div className="space-y-2">
                    {dashboard.recent_users.slice(0, 5).map((u: any) => (
                      <div key={u.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                        <div>
                          <div className="font-medium text-sm">{u.name}</div>
                          <div className="text-xs text-muted-foreground">{u.email}</div>
                        </div>
                        <Badge variant={u.role === 'admin' ? 'default' : u.role === 'organizer' ? 'secondary' : 'outline'}>
                          {u.role}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h2 className="font-display font-bold text-lg mb-4">Recent Payments</h2>
                  <div className="space-y-2">
                    {dashboard.recent_payments.slice(0, 5).map((payment: any) => (
                      <div key={payment.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                        <div>
                          <div className="font-medium text-sm">{payment.event?.title}</div>
                          <div className="text-xs text-muted-foreground">{payment.user?.name || payment.guest_name}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-sm text-emerald-600 dark:text-emerald-400">
                            ₦{payment.amount.toLocaleString('en-NG', { maximumFractionDigits: 0 })}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(payment.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users */}
          <TabsContent value="users">
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                  <h2 className="font-display font-bold text-lg">Users</h2>
                  <div className="flex flex-wrap items-center gap-2">
                    <Input placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && refreshUsers()} className="w-48" />
                    <select
                      className="h-10 rounded-none border border-input bg-background px-2 text-sm"
                      value={userRoleFilter}
                      onChange={(e) => { setUserRoleFilter(e.target.value); refreshUsers(1, e.target.value); }}
                    >
                      <option value="">All roles</option>
                      <option value="attendee">Attendees</option>
                      <option value="organizer">Organizers</option>
                      <option value="admin">Admins</option>
                      <option value="support">Support</option>
                      {isElevatedActor && <option value="staff">Staff (Admin+)</option>}
                    </select>
                    <Button variant="outline" size="icon" onClick={() => refreshUsers()}><Search className="w-4 h-4" /></Button>
                    {!isStaffActor && exportButtons('users', { search, role: userRoleFilter })}
                    {!isStaffActor && (
                      <Button onClick={() => setCreatingUser((v) => !v)}>
                        <Plus className="w-4 h-4" /> Add User
                      </Button>
                    )}
                  </div>
                </div>

                {creatingUser && (
                  <div className="p-5 mb-6 rounded-xl border border-primary/30 bg-muted/30">
                    <div className="mb-4 pb-4 border-b border-border">
                      <h3 className="font-display font-semibold">Add a user</h3>
                      <p className="text-sm text-muted-foreground mt-0.5">Creates the account directly — they can log in immediately with this password.</p>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="new-user-name">Full name</Label>
                        <Input id="new-user-name" placeholder="Jane Doe" value={newUser.name} onChange={(e)=>setNewUser({...newUser, name:e.target.value})} />
                      </div>
                      <div>
                        <Label htmlFor="new-user-email">Email</Label>
                        <Input id="new-user-email" type="email" placeholder="jane@example.com" value={newUser.email} onChange={(e)=>setNewUser({...newUser, email:e.target.value})} />
                      </div>
                      <div>
                        <Label htmlFor="new-user-role">Role</Label>
                        <select id="new-user-role" className="w-full h-11 rounded-xl border border-input bg-background px-4 text-sm" value={newUser.role} onChange={(e)=>setNewUser({...newUser, role: e.target.value as any, staff_role_id: e.target.value === 'staff' ? newUser.staff_role_id : null})}>
                          <option value="attendee">Attendee</option>
                          <option value="organizer">Organizer</option>
                          <option value="admin">Admin</option>
                          {isElevatedActor && <option value="staff">Staff</option>}
                          {isElevatedActor && <option value="super-admin">Super Admin</option>}
                          {isDeveloperActor && <option value="developer">Developer</option>}
                        </select>
                        <p className="text-xs text-muted-foreground mt-1">Determines what they can access — admin and above reach the admin dashboard. A staff account's access depends entirely on their assigned staff role.</p>
                      </div>
                      {newUser.role === 'staff' && (
                        <div>
                          <Label htmlFor="new-user-staff-role">Staff role</Label>
                          <select
                            id="new-user-staff-role"
                            className="w-full h-11 rounded-xl border border-input bg-background px-4 text-sm"
                            value={newUser.staff_role_id ?? ''}
                            onChange={(e) => setNewUser({ ...newUser, staff_role_id: e.target.value ? Number(e.target.value) : null })}
                          >
                            <option value="">Select staff role…</option>
                            {staffRolesList.map((r) => (
                              <option key={r.id} value={r.id}>{r.name}</option>
                            ))}
                          </select>
                          {staffRolesList.length === 0 && (
                            <p className="text-xs text-amber-600 mt-1">No staff roles exist yet — create one under Admin Settings → Manage Staff Roles first.</p>
                          )}
                        </div>
                      )}
                      <div>
                        <Label htmlFor="new-user-password">Password</Label>
                        <PasswordInput id="new-user-password" placeholder="At least 8 characters" value={newUser.password} onChange={(e)=>setNewUser({...newUser, password:e.target.value})} />
                        <p className="text-xs text-muted-foreground mt-1">Share this with them directly — they can change it after logging in.</p>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2 mt-5 pt-4 border-t border-border">
                      <Button variant="outline" onClick={()=>setCreatingUser(false)}>Cancel</Button>
                      <Button
                        onClick={async()=>{
                          try { await admin.createUser(newUser); setNewUser({name:'',email:'',role:'attendee',staff_role_id:null,password:''}); setCreatingUser(false); await refreshUsers(); } catch(e){ alert('Failed to create user'); }
                        }}
                      >Create user</Button>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 mb-4">
                  <span className="text-sm text-muted-foreground">Sort by:</span>
                  {sortSelect([
                    { value: 'created_at', label: 'Created' },
                    { value: 'name', label: 'Name' },
                    { value: 'email', label: 'Email' },
                  ])}
                  <Button variant="outline" size="icon" onClick={()=>setSortDir(sortDir==='asc'?'desc':'asc')}>
                    {sortDir==='asc'? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}
                  </Button>
                  <Button variant="outline" onClick={() => refreshUsers()}>Refresh</Button>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Activity</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersList.map((u: any) => (
                      <Fragment key={u.id}>
                      <TableRow>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold text-sm shrink-0">
                              {u.name?.charAt(0)?.toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium text-sm flex items-center gap-1.5">
                                {u.name}
                                {roleCrown(u.role)}
                                {u.is_verified && <VerifiedBadge />}
                              </div>
                              <div className="text-xs text-muted-foreground">{u.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {isStaffActor ? (
                            <Badge variant="outline" className="capitalize">{u.role}</Badge>
                          ) : (
                            <select
                              className="h-9 rounded-none border border-input bg-background px-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                              value={u.role}
                              disabled={!canChangeRoleOf(u)}
                              title={!canChangeRoleOf(u) ? "This account's role is protected" : undefined}
                              onChange={async(e)=>{ try { await admin.updateUserRole(u.id, e.target.value as any); await refreshUsers(); } catch(err: any){ alert(err?.response?.data?.message || 'Failed to update role'); } }}
                            >
                              <option value="attendee">Attendee</option>
                              <option value="organizer">Organizer</option>
                              <option value="admin">Admin</option>
                              {isElevatedActor && <option value="support">Support</option>}
                              <option value="super-admin">Super Admin</option>
                              {/* Only the developer can see/assign the developer role — this option is rendered for a
                                  non-developer viewer only when it's the row's own current value, so the <select>
                                  still displays "Developer" correctly for a protected (disabled) row. */}
                              {(isDeveloperActor || u.role === 'developer') && <option value="developer">Developer</option>}
                            </select>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {u.events_count || 0} events, {u.tickets_count || 0} tickets
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1 flex-wrap">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleExpandUser(u)}
                            >
                              {expandedUserId === u.id ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              {expandedUserId === u.id ? 'Hide' : 'View'}
                            </Button>
                            {!isStaffActor && (
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={!canDeleteUser(u)}
                                title={!canDeleteUser(u) ? "This account is protected and can't be deleted" : undefined}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10 disabled:opacity-40 disabled:hover:bg-transparent"
                                onClick={async()=>{ if(confirm('Delete this user?')) { try{ await admin.deleteUser(u.id); await refreshUsers(); } catch(e){ alert('Failed to delete'); } } }}
                              >
                                <Trash className="w-4 h-4"/> Delete
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                      {expandedUserId === u.id && (
                        <TableRow key={`${u.id}-detail`}>
                          <TableCell colSpan={4} className="bg-muted/30">
                            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 py-2 text-sm">
                              <div>
                                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1 flex items-center gap-1"><Mail className="w-3 h-3" /> Email</p>
                                <p className="font-medium break-all">{u.email}</p>
                              </div>
                              <div>
                                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1 flex items-center gap-1"><Phone className="w-3 h-3" /> Phone</p>
                                <p className="font-medium">{u.phone || '—'}</p>
                              </div>
                              <div>
                                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1 flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> KYC status</p>
                                <p className="font-medium capitalize">{u.kyc_status || 'Not submitted'}</p>
                                {u.kyc_business_name && <p className="text-xs text-muted-foreground">{u.kyc_business_name}</p>}
                              </div>
                              <div>
                                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Joined</p>
                                <p className="font-medium">{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</p>
                              </div>
                            </div>

                            {u.role === 'organizer' && !isStaffActor && (
                              <div className="mt-3 pt-3 border-t border-border">
                                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1">
                                  <NairaSign className="w-3 h-3" /> Wallet overview (admin-only, logged)
                                </p>
                                {loadingOverviewId === u.id ? (
                                  <p className="text-xs text-muted-foreground">Loading…</p>
                                ) : organizerOverview[u.id] ? (
                                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                                    <div>
                                      <p className="text-xs text-muted-foreground mb-0.5">Available balance</p>
                                      <p className="font-semibold">₦{Number(organizerOverview[u.id].balance).toLocaleString('en-NG')}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground mb-0.5">Total earned</p>
                                      <p className="font-semibold">₦{Number(organizerOverview[u.id].total_earned).toLocaleString('en-NG')}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground mb-0.5">Total withdrawn</p>
                                      <p className="font-semibold">₦{Number(organizerOverview[u.id].total_withdrawn).toLocaleString('en-NG')}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground mb-0.5">Pending withdrawals</p>
                                      <p className="font-semibold">₦{Number(organizerOverview[u.id].pending_withdrawals).toLocaleString('en-NG')}</p>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-xs text-muted-foreground">Couldn't load wallet data.</p>
                                )}
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      )}
                      </Fragment>
                    ))}
                  </TableBody>
                </Table>
                {usersList.length === 0 && <p className="text-muted-foreground text-center py-8">No users found.</p>}
                {paginationControls(usersPage, refreshUsers)}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Events */}
          <TabsContent value="events">
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                  <h2 className="font-display font-bold text-lg">Events</h2>
                  <div className="flex flex-wrap items-center gap-2">
                    <Input placeholder="Search events..." value={search} onChange={(e)=>setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && refreshEvents()} className="w-48" />
                    <select
                      className="h-10 rounded-none border border-input bg-background px-2 text-sm"
                      value={eventCategoryFilter}
                      onChange={async (e) => { setEventCategoryFilter(e.target.value); await refreshEvents(e.target.value); }}
                    >
                      <option value="">All categories</option>
                      {dashboard.events_by_category.map((cat: any) => (
                        <option key={cat.category} value={cat.category}>{cat.category}</option>
                      ))}
                    </select>
                    <Button variant="outline" size="icon" onClick={()=>refreshEvents()}><Search className="w-4 h-4" /></Button>
                    {exportButtons('events', { search, category: eventCategoryFilter })}
                    <Button asChild>
                      <Link href="/create-event">
                        <Plus className="w-4 h-4"/> Add Event
                      </Link>
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <span className="text-sm text-muted-foreground">Sort by:</span>
                  {sortSelect([
                    { value: 'created_at', label: 'Created' },
                    { value: 'title', label: 'Title' },
                    { value: 'date', label: 'Date' },
                    { value: 'price', label: 'Price' },
                  ])}
                  <Button variant="outline" size="icon" onClick={()=>setSortDir(sortDir==='asc'?'desc':'asc')}>
                    {sortDir==='asc'? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}
                  </Button>
                  <Button variant="outline" onClick={() => refreshEvents()}>Refresh</Button>
                </div>

                <div className="space-y-3">
                  {eventsList.map((event: any) => (
                    <div key={event.id} className="p-4 rounded-xl border border-border">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{event.title}</div>
                          <div className="text-sm text-muted-foreground">By {event.user?.name} &middot; {event.tickets_count || 0} tickets sold</div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/events/${event.id}`}>View</Link>
                          </Button>
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/organizer/events/${event.id}`}>
                              <Edit className="w-4 h-4"/> Manage
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={async()=>{ if(confirm('Delete this event?')) { try { await admin.deleteEvent(event.id); await refreshEvents(); } catch(e){ alert('Failed to delete'); } } }}
                          >
                            <Trash className="w-4 h-4"/> Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {eventsList.length === 0 && <p className="text-muted-foreground text-center py-8">No events found.</p>}
                {paginationControls(eventsPage, (page) => refreshEvents(undefined, page))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* KYC Review */}
          <TabsContent value="kyc">
            <KycReviewTab />
          </TabsContent>

          {/* Withdrawals */}
          <TabsContent value="withdrawals">
            <WithdrawalsTab />
          </TabsContent>

          {/* Tickets */}
          <TabsContent value="tickets">
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <h2 className="font-display font-bold text-lg">Tickets</h2>
                  <div className="flex flex-wrap items-center gap-2">
                    <Input
                      placeholder="Search by ticket code..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') refreshTickets(1); }}
                      className="w-56 font-mono"
                    />
                    <select
                      className="h-10 rounded-none border border-input bg-background px-2 text-sm"
                      value={ticketStatusFilter}
                      onChange={(e) => { setTicketStatusFilter(e.target.value); refreshTickets(1, e.target.value); }}
                    >
                      <option value="">All statuses</option>
                      <option value="valid">Valid</option>
                      <option value="checked_in">Checked</option>
                      <option value="invalid">Invalid</option>
                      <option value="revoked">Revoked</option>
                    </select>
                    <Button variant="outline" size="icon" onClick={() => refreshTickets(1)}><Search className="w-4 h-4" /></Button>
                    {exportButtons('tickets', { code: search, status: ticketStatusFilter })}
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-sm text-muted-foreground">Sort by:</span>
                  {sortSelect([
                    { value: 'created_at', label: 'Created' },
                    { value: 'code', label: 'Code' },
                  ])}
                  <Button variant="outline" size="icon" onClick={()=>setSortDir(sortDir==='asc'?'desc':'asc')}>
                    {sortDir==='asc'? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}
                  </Button>
                  <Button variant="outline" onClick={() => refreshTickets()}>Refresh</Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event</TableHead>
                      <TableHead>Attendee</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ticketsList.map((ticket: any)=> (
                      <TableRow key={ticket.id}>
                        <TableCell className="font-medium">{ticket.event?.title}</TableCell>
                        <TableCell className="text-muted-foreground">{ticket.user?.name || ticket.attendee_name}</TableCell>
                        <TableCell className="font-mono text-xs">{ticket.code}</TableCell>
                        <TableCell>
                          <Badge variant={ticket.status === 'checked_in' ? 'success' : (ticket.status === 'revoked' || ticket.status === 'invalid') ? 'destructive' : 'outline'}>
                            {ticket.status || 'valid'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2 flex-wrap">
                            <select
                              className="h-9 rounded-none border border-input bg-background px-2 text-sm"
                              value={ticket.status || 'valid'}
                              onChange={async (e) => {
                                const status = e.target.value as 'valid' | 'checked_in' | 'invalid' | 'revoked';
                                const reason = (status === 'invalid' || status === 'revoked') ? window.prompt(`Reason for marking this ticket ${status}?`) || undefined : undefined;
                                try { await tickets.updateStatus(ticket.id, status, reason); await refreshTickets(); } catch (e) { alert('Failed to update ticket status'); }
                              }}
                            >
                              <option value="valid">Valid</option>
                              <option value="checked_in">Checked</option>
                              <option value="invalid">Invalid</option>
                              <option value="revoked">Revoked</option>
                            </select>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={async () => {
                                if (!confirm('Delete this ticket? This cannot be undone.')) return;
                                try { await admin.deleteTicket(ticket.id); await refreshTickets(); } catch (e) { alert('Failed to delete ticket'); }
                              }}
                            >
                              <Trash className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {ticketsList.length===0 && (
                  <p className="text-muted-foreground text-center py-8">No tickets found.</p>
                )}
                {paginationControls(ticketsPage, refreshTickets)}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments */}
          <TabsContent value="payments">
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <h2 className="font-display font-bold text-lg">All Payments</h2>
                  <div className="flex flex-wrap items-center gap-2">
                    <Input
                      placeholder="Search reference/transaction #..."
                      value={paymentSearch}
                      onChange={(e) => setPaymentSearch(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && refreshPayments()}
                      className="w-56"
                    />
                    <select
                      className="h-10 rounded-none border border-input bg-background px-2 text-sm"
                      value={paymentStatusFilter}
                      onChange={async (e) => { setPaymentStatusFilter(e.target.value); await refreshPayments(e.target.value, 1); }}
                    >
                      <option value="">All statuses</option>
                      <option value="pending">Pending</option>
                      <option value="success">Success</option>
                      <option value="failed">Failed</option>
                      <option value="refunded">Refunded</option>
                    </select>
                    <Button variant="outline" size="icon" onClick={() => refreshPayments()}><Search className="w-4 h-4" /></Button>
                    {exportButtons('payments', { search: paymentSearch, status: paymentStatusFilter })}
                  </div>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Receipt</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(paymentsList.length? paymentsList : dashboard.recent_payments).map((payment: any) => (
                      <TableRow key={payment.id}>
                        <TableCell>{payment.event?.title}</TableCell>
                        <TableCell className="text-muted-foreground">{payment.user?.name || payment.guest_name}</TableCell>
                        <TableCell className="font-semibold text-emerald-600 dark:text-emerald-400">
                          ₦{payment.amount.toLocaleString('en-NG', { maximumFractionDigits: 0 })}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(payment.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <select
                            className="h-9 rounded-none border border-input bg-background px-2 text-sm"
                            value={payment.status}
                            onChange={async(e)=>{ try{ await admin.updatePaymentStatus(payment.id, e.target.value as any); await refreshPayments(); } catch(err){ alert('Failed to update status'); } }}
                          >
                            <option value="pending">pending</option>
                            <option value="success">success</option>
                            <option value="failed">failed</option>
                            <option value="refunded">refunded</option>
                          </select>
                        </TableCell>
                        <TableCell className="text-right">
                          {payment.status === 'success' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async()=>{ try { await payments.downloadReceipt(payment.id); } catch(e){ alert('Failed to download receipt'); } }}
                            >
                              <Receipt className="w-4 h-4" /> Receipt
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {paymentsList.length === 0 && <p className="text-muted-foreground text-center py-8">No payments found.</p>}
                {paginationControls(paymentsPage, (page) => refreshPayments(undefined, page))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Blog */}
          <TabsContent value="blog">
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                  <h2 className="font-display font-bold text-lg">Blog Posts</h2>
                  <div className="flex flex-wrap items-center gap-2">
                    <Input placeholder="Search posts..." value={search} onChange={(e)=>setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && refreshBlogPosts()} className="w-48" />
                    <Button variant="outline" size="icon" onClick={() => refreshBlogPosts()}><Search className="w-4 h-4" /></Button>
                    <Button onClick={()=>setCreatingBlogPost((v)=>!v)}>
                      <Plus className="w-4 h-4"/> Add Post
                    </Button>
                  </div>
                </div>

                {creatingBlogPost && (
                  <div className="p-5 mb-6 rounded-xl border border-primary/30 bg-muted/30">
                    <div className="mb-4 pb-4 border-b border-border">
                      <h3 className="font-display font-semibold">Add a blog post</h3>
                      <p className="text-sm text-muted-foreground mt-0.5">Publishes to the public /blog page — drafts aren't supported yet, so double-check before creating.</p>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="new-post-title">Title</Label>
                        <Input id="new-post-title" placeholder="Post title" value={newBlogPost.title} onChange={(e)=>setNewBlogPost({...newBlogPost, title:e.target.value})}/>
                      </div>
                      <div>
                        <Label htmlFor="new-post-category">Category</Label>
                        <Input id="new-post-category" placeholder="e.g. Announcements, Tips" value={newBlogPost.category} onChange={(e)=>setNewBlogPost({...newBlogPost, category:e.target.value})}/>
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="new-post-excerpt">Excerpt</Label>
                        <Input id="new-post-excerpt" placeholder="One or two sentences shown on the blog listing" value={newBlogPost.excerpt} onChange={(e)=>setNewBlogPost({...newBlogPost, excerpt:e.target.value})}/>
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="new-post-image">Cover image</Label>
                        <input id="new-post-image" className="w-full text-sm" type="file" accept="image/*" onChange={(e)=>setNewBlogPost({...newBlogPost, image: e.target.files?.[0] ?? null})}/>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Label>Content</Label>
                      <RichTextEditor value={newBlogPost.content} onChange={(html) => setNewBlogPost({ ...newBlogPost, content: html })} placeholder="Write the full post here..." />
                    </div>
                    <div className="flex justify-end space-x-2 mt-5 pt-4 border-t border-border">
                      <Button variant="outline" onClick={()=>setCreatingBlogPost(false)}>Cancel</Button>
                      <Button onClick={async()=>{
                        try {
                          const fd = new FormData();
                          fd.append('title', newBlogPost.title);
                          fd.append('excerpt', newBlogPost.excerpt);
                          fd.append('content', newBlogPost.content);
                          fd.append('category', newBlogPost.category);
                          if (newBlogPost.image) fd.append('image', newBlogPost.image);
                          await admin.createBlogPost(fd);
                          setCreatingBlogPost(false);
                          setNewBlogPost({title:'',excerpt:'',content:'',category:'General',image:null});
                          await refreshBlogPosts();
                        } catch(e){ alert('Failed to create post'); }
                      }}>Publish post</Button>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 mb-4">
                  <span className="text-sm text-muted-foreground">Sort by:</span>
                  {sortSelect([
                    { value: 'created_at', label: 'Created' },
                    { value: 'title', label: 'Title' },
                    { value: 'published_at', label: 'Published' },
                  ])}
                  <Button variant="outline" size="icon" onClick={()=>setSortDir(sortDir==='asc'?'desc':'asc')}>
                    {sortDir==='asc'? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}
                  </Button>
                  <Button variant="outline" onClick={() => refreshBlogPosts()}>Refresh</Button>
                </div>

                <div className="space-y-3">
                  {blogPostsList.map((post: any) => (
                    <div key={post.id} className="p-4 rounded-xl border border-border">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{post.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {post.category} &middot; By {post.user?.name || 'Unknown'} &middot; {post.is_published ? 'Published' : 'Draft'}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/blog/${post.slug}`}>View</Link>
                          </Button>
                          <Button variant="outline" size="sm" onClick={()=>{ setEditingBlogPostId(post.id); setEditingBlogPost({ title: post.title, excerpt: post.excerpt || '', content: post.content, category: post.category, is_published: post.is_published, image: null }); }}>
                            <Edit className="w-4 h-4"/> Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={async()=>{ if(confirm('Delete this post?')) { try { await admin.deleteBlogPost(post.id); await refreshBlogPosts(); } catch(e){ alert('Failed to delete'); } } }}
                          >
                            <Trash className="w-4 h-4"/> Delete
                          </Button>
                        </div>
                      </div>
                      {editingBlogPostId===post.id && (
                        <div className="mt-4 p-5 rounded-xl border border-primary/30 bg-muted/30">
                          <div className="mb-4 pb-4 border-b border-border">
                            <h3 className="font-display font-semibold">Edit post</h3>
                          </div>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor={`edit-post-title-${post.id}`}>Title</Label>
                              <Input id={`edit-post-title-${post.id}`} placeholder="Post title" value={editingBlogPost.title} onChange={(e)=>setEditingBlogPost({...editingBlogPost, title:e.target.value})}/>
                            </div>
                            <div>
                              <Label htmlFor={`edit-post-category-${post.id}`}>Category</Label>
                              <Input id={`edit-post-category-${post.id}`} placeholder="e.g. Announcements, Tips" value={editingBlogPost.category} onChange={(e)=>setEditingBlogPost({...editingBlogPost, category:e.target.value})}/>
                            </div>
                            <div className="md:col-span-2">
                              <Label htmlFor={`edit-post-excerpt-${post.id}`}>Excerpt</Label>
                              <Input id={`edit-post-excerpt-${post.id}`} placeholder="One or two sentences shown on the blog listing" value={editingBlogPost.excerpt} onChange={(e)=>setEditingBlogPost({...editingBlogPost, excerpt:e.target.value})}/>
                            </div>
                            <div className="md:col-span-2">
                              <Label htmlFor={`edit-post-image-${post.id}`}>Cover image</Label>
                              <input id={`edit-post-image-${post.id}`} className="w-full text-sm" type="file" accept="image/*" onChange={(e)=>setEditingBlogPost({...editingBlogPost, image: e.target.files?.[0] ?? null})}/>
                              <p className="text-xs text-muted-foreground mt-1">Leave empty to keep the current image.</p>
                            </div>
                            <div>
                              <Label htmlFor={`edit-post-status-${post.id}`}>Status</Label>
                              <select id={`edit-post-status-${post.id}`} className="w-full h-11 rounded-xl border border-input bg-background px-4 text-sm" value={editingBlogPost.is_published ? '1' : '0'} onChange={(e)=>setEditingBlogPost({...editingBlogPost, is_published: e.target.value === '1'})}>
                                <option value="1">Published</option>
                                <option value="0">Draft</option>
                              </select>
                            </div>
                          </div>
                          <div className="mt-4">
                            <Label>Content</Label>
                            <RichTextEditor value={editingBlogPost.content} onChange={(html) => setEditingBlogPost({ ...editingBlogPost, content: html })} placeholder="Write the full post here..." />
                          </div>
                          <div className="flex justify-end space-x-2 mt-5 pt-4 border-t border-border">
                            <Button variant="outline" onClick={()=>{ setEditingBlogPostId(null); setEditingBlogPost(null); }}>Cancel</Button>
                            <Button onClick={async()=>{
                              try {
                                const fd = new FormData();
                                fd.append('title', editingBlogPost.title);
                                fd.append('excerpt', editingBlogPost.excerpt);
                                fd.append('content', editingBlogPost.content);
                                fd.append('category', editingBlogPost.category);
                                fd.append('is_published', editingBlogPost.is_published ? '1' : '0');
                                if (editingBlogPost.image) fd.append('image', editingBlogPost.image);
                                await admin.updateBlogPost(post.id, fd);
                                setEditingBlogPostId(null);
                                setEditingBlogPost(null);
                                await refreshBlogPosts();
                              } catch(e){ alert('Failed to update'); }
                            }}>Save changes</Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  {blogPostsList.length===0 && (
                    <p className="text-muted-foreground text-center py-8">No blog posts found.</p>
                  )}
                </div>
                {paginationControls(blogPage, (page) => refreshBlogPosts(page))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vendors">
            <VendorsTab />
          </TabsContent>

          <TabsContent value="support">
            <SupportTicketsTab />
          </TabsContent>

          <TabsContent value="settings">
            {authUser?.role && ['super-admin', 'developer'].includes(authUser.role) ? (
              <SettingsTab />
            ) : (
              <Card>
                <CardContent className="p-10 text-center">
                  <h2 className="font-display font-bold text-lg mb-1">Unauthorized</h2>
                  <p className="text-sm text-muted-foreground">
                    Admin Settings and Roles &amp; Staff Management are restricted to super-admins.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardShell>
  );
}
