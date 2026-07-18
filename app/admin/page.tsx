'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { StatCard } from '@/components/dashboard/StatCard';
import { useAuth } from '@/components/AuthProvider';
import { admin, AdminDashboard } from '@/lib/admin';
import { payments } from '@/lib/payments';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Users, Calendar, Ticket, Award, BarChart3, Plus, Edit, Trash, ChevronUp, ChevronDown, Newspaper, Receipt, Settings, Search, Download } from 'lucide-react';
import { NairaSign } from '@/components/icons/NairaSign';
import { SettingsTab } from '@/components/admin/SettingsTab';
import Link from 'next/link';

type AdminTab = 'overview' | 'users' | 'events' | 'tickets' | 'payments' | 'blog' | 'settings';
const VALID_TABS: AdminTab[] = ['overview', 'users', 'events', 'tickets', 'payments', 'blog', 'settings'];

export default function AdminDashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: authUser, loading: authLoading } = useAuth();
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
    router.replace(`/admin?tab=${tab}`, { scroll: false });
  };

  useEffect(() => {
    if (tabParam && VALID_TABS.includes(tabParam) && tabParam !== activeTab) {
      setActiveTabState(tabParam);
      setSortBy('created_at');
      setSortDir('desc');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabParam]);
  const [search, setSearch] = useState<string>('');
  const [eventCategoryFilter, setEventCategoryFilter] = useState<string>('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('');
  const [paymentSearch, setPaymentSearch] = useState<string>('');

  const [newUser, setNewUser] = useState<{name:string; email:string; role:'attendee'|'organizer'|'admin'; password:string}>({
    name: '', email: '', role: 'attendee', password: ''
  });
  const [creatingUser, setCreatingUser] = useState(false);

  const [newEvent, setNewEvent] = useState<{title:string; description:string; date:string; time:string; venue:string; category:string; price:number; total_tickets:number; image?:string}>({
    title:'', description:'', date:'', time:'', venue:'', category:'Concert', price:0, total_tickets:1
  });
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [editingEventId, setEditingEventId] = useState<number| null>(null);
  const [editingEvent, setEditingEvent] = useState<any>(null);

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
      } else if (authUser.role !== 'admin') {
        router.push('/dashboard');
      } else {
        loadDashboard();
      }
    }
  }, [authUser, authLoading]);

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

  const refreshUsers = async () => {
    const data = await admin.getUsers({ search, sort_by: sortBy, sort_dir: sortDir });
    setUsersList(data.data || data);
  };

  const refreshEvents = async (categoryOverride?: string) => {
    const data = await admin.getEvents({ search, category: categoryOverride ?? eventCategoryFilter, sort_by: sortBy, sort_dir: sortDir });
    setEventsList(data.data || data);
  };

  const refreshTickets = async () => {
    const data = await admin.getTickets({ code: search, sort_by: sortBy, sort_dir: sortDir });
    setTicketsList(data.data || data);
  };

  const refreshPayments = async (statusOverride?: string) => {
    const data = await admin.getPayments({ search: paymentSearch, status: statusOverride ?? paymentStatusFilter, sort_by: sortBy, sort_dir: sortDir });
    setPaymentsList(data.data || data);
  };

  const refreshBlogPosts = async () => {
    const data = await admin.getBlogPosts({ search, sort_by: sortBy, sort_dir: sortDir });
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

  return (
    <DashboardShell title="Admin Dashboard" description={`Welcome back, ${authUser?.name}`}>
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
          <TabsList>
            <TabsTrigger value="overview"><BarChart3 className="w-4 h-4" /> <span className="hidden sm:inline">Overview</span></TabsTrigger>
            <TabsTrigger value="users"><Users className="w-4 h-4" /> <span className="hidden sm:inline">Users</span></TabsTrigger>
            <TabsTrigger value="events"><Calendar className="w-4 h-4" /> <span className="hidden sm:inline">Events</span></TabsTrigger>
            <TabsTrigger value="tickets"><Ticket className="w-4 h-4" /> <span className="hidden sm:inline">Tickets</span></TabsTrigger>
            <TabsTrigger value="payments"><NairaSign className="w-4 h-4" /> <span className="hidden sm:inline">Payments</span></TabsTrigger>
            <TabsTrigger value="blog"><Newspaper className="w-4 h-4" /> <span className="hidden sm:inline">Blog</span></TabsTrigger>
            <TabsTrigger value="settings"><Settings className="w-4 h-4" /> <span className="hidden sm:inline">Settings</span></TabsTrigger>
          </TabsList>

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

            <Card>
              <CardContent className="p-6">
                <h2 className="font-display font-bold text-lg mb-4">Events by Category</h2>
                <div className="grid sm:grid-cols-3 gap-3">
                  {dashboard.events_by_category.map((cat: any) => (
                    <div key={cat.category} className="p-4 rounded-lg border border-border">
                      <div className="text-sm font-medium mb-1">{cat.category}</div>
                      <div className="text-xl font-display font-bold">{cat.count}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

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
                  <div className="flex items-center gap-2">
                    <Input placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && refreshUsers()} className="w-48" />
                    <Button variant="outline" size="icon" onClick={refreshUsers}><Search className="w-4 h-4" /></Button>
                    {exportButtons('users', { search })}
                    <Button onClick={() => setCreatingUser((v) => !v)}>
                      <Plus className="w-4 h-4" /> Add User
                    </Button>
                  </div>
                </div>

                {creatingUser && (
                  <div className="p-4 mb-6 rounded-xl border border-border bg-muted/30">
                    <div className="grid md:grid-cols-2 gap-4">
                      <Input placeholder="Name" value={newUser.name} onChange={(e)=>setNewUser({...newUser, name:e.target.value})} />
                      <Input placeholder="Email" value={newUser.email} onChange={(e)=>setNewUser({...newUser, email:e.target.value})} />
                      <select className="h-11 rounded-xl border border-input bg-background px-4 text-sm" value={newUser.role} onChange={(e)=>setNewUser({...newUser, role: e.target.value as any})}>
                        <option value="attendee">Attendee</option>
                        <option value="organizer">Organizer</option>
                        <option value="admin">Admin</option>
                      </select>
                      <Input type="password" placeholder="Password" value={newUser.password} onChange={(e)=>setNewUser({...newUser, password:e.target.value})} />
                    </div>
                    <div className="flex justify-end space-x-2 mt-4">
                      <Button variant="outline" onClick={()=>setCreatingUser(false)}>Cancel</Button>
                      <Button
                        onClick={async()=>{
                          try { await admin.createUser(newUser); setNewUser({name:'',email:'',role:'attendee',password:''}); setCreatingUser(false); await refreshUsers(); } catch(e){ alert('Failed to create user'); }
                        }}
                      >Create</Button>
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
                  <Button variant="outline" onClick={refreshUsers}>Refresh</Button>
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
                    {(usersList.length? usersList : (dashboard.recent_users || [])).map((u: any) => (
                      <TableRow key={u.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold text-sm shrink-0">
                              {u.name?.charAt(0)?.toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium text-sm">{u.name}</div>
                              <div className="text-xs text-muted-foreground">{u.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <select
                            className="h-9 rounded-lg border border-input bg-background px-2 text-sm"
                            value={u.role}
                            onChange={async(e)=>{ try { await admin.updateUserRole(u.id, e.target.value as any); await refreshUsers(); } catch(err){ alert('Failed to update role'); } }}
                          >
                            <option value="attendee">Attendee</option>
                            <option value="organizer">Organizer</option>
                            <option value="admin">Admin</option>
                          </select>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {u.events_count || 0} events, {u.tickets_count || 0} tickets
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={async()=>{ if(confirm('Delete this user?')) { try{ await admin.deleteUser(u.id); await refreshUsers(); } catch(e){ alert('Failed to delete'); } } }}
                          >
                            <Trash className="w-4 h-4"/> Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Events */}
          <TabsContent value="events">
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                  <h2 className="font-display font-bold text-lg">Events</h2>
                  <div className="flex items-center gap-2">
                    <Input placeholder="Search events..." value={search} onChange={(e)=>setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && refreshEvents()} className="w-48" />
                    <select
                      className="h-10 rounded-lg border border-input bg-background px-2 text-sm"
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
                    <Button onClick={()=>setCreatingEvent((v)=>!v)}>
                      <Plus className="w-4 h-4"/> Add Event
                    </Button>
                  </div>
                </div>

                {creatingEvent && (
                  <div className="p-4 mb-6 rounded-xl border border-border bg-muted/30">
                    <div className="grid md:grid-cols-2 gap-4">
                      <Input placeholder="Title" value={newEvent.title} onChange={(e)=>setNewEvent({...newEvent, title:e.target.value})}/>
                      <Input placeholder="Venue" value={newEvent.venue} onChange={(e)=>setNewEvent({...newEvent, venue:e.target.value})}/>
                      <Input type="date" value={newEvent.date} onChange={(e)=>setNewEvent({...newEvent, date:e.target.value})}/>
                      <Input type="time" value={newEvent.time} onChange={(e)=>setNewEvent({...newEvent, time:e.target.value})}/>
                      <Input type="number" placeholder="Price (NGN)" value={newEvent.price} onChange={(e)=>setNewEvent({...newEvent, price: Number(e.target.value)})}/>
                      <Input type="number" placeholder="Total Tickets" value={newEvent.total_tickets} onChange={(e)=>setNewEvent({...newEvent, total_tickets: Number(e.target.value)})}/>
                      <Input placeholder="Category" value={newEvent.category} onChange={(e)=>setNewEvent({...newEvent, category:e.target.value})}/>
                    </div>
                    <textarea className="w-full mt-4 rounded-xl border border-input bg-background px-4 py-3 text-sm" rows={3} placeholder="Description" value={newEvent.description} onChange={(e)=>setNewEvent({...newEvent, description:e.target.value})}/>
                    <div className="flex justify-end space-x-2 mt-4">
                      <Button variant="outline" onClick={()=>setCreatingEvent(false)}>Cancel</Button>
                      <Button onClick={async()=>{ try { await admin.createEvent(newEvent); setCreatingEvent(false); setNewEvent({title:'',description:'',date:'',time:'',venue:'',category:'Concert',price:0,total_tickets:1}); await refreshEvents(); } catch(e){ alert('Failed to create event'); } }}>Create</Button>
                    </div>
                  </div>
                )}

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
                  {(eventsList.length? eventsList : (dashboard.recent_events || [])).map((event: any) => (
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
                          <Button variant="outline" size="sm" onClick={()=>{ setEditingEventId(event.id); setEditingEvent({ title: event.title, price: event.price, date: event.date, time: event.time, venue: event.venue, category: event.category }); }}>
                            <Edit className="w-4 h-4"/> Edit
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
                      {editingEventId===event.id && (
                        <div className="mt-4 p-4 rounded-xl bg-muted/30">
                          <div className="grid md:grid-cols-2 gap-4">
                            <Input placeholder="Title" value={editingEvent.title} onChange={(e)=>setEditingEvent({...editingEvent, title:e.target.value})}/>
                            <Input type="number" placeholder="Price" value={editingEvent.price} onChange={(e)=>setEditingEvent({...editingEvent, price:Number(e.target.value)})}/>
                            <Input type="date" value={editingEvent.date||''} onChange={(e)=>setEditingEvent({...editingEvent, date:e.target.value})}/>
                            <Input type="time" value={editingEvent.time||''} onChange={(e)=>setEditingEvent({...editingEvent, time:e.target.value})}/>
                            <Input placeholder="Venue" value={editingEvent.venue||''} onChange={(e)=>setEditingEvent({...editingEvent, venue:e.target.value})}/>
                            <Input placeholder="Category" value={editingEvent.category||''} onChange={(e)=>setEditingEvent({...editingEvent, category:e.target.value})}/>
                          </div>
                          <div className="flex justify-end space-x-2 mt-4">
                            <Button variant="outline" onClick={()=>{ setEditingEventId(null); setEditingEvent(null); }}>Cancel</Button>
                            <Button onClick={async()=>{ try { await admin.updateEvent(event.id, editingEvent); setEditingEventId(null); setEditingEvent(null); await refreshEvents(); } catch(e){ alert('Failed to update'); } }}>Save</Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tickets */}
          <TabsContent value="tickets">
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <h2 className="font-display font-bold text-lg">Tickets</h2>
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Search by ticket code..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') refreshTickets(); }}
                      className="w-56 font-mono"
                    />
                    {exportButtons('tickets', { code: search })}
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
                  <Button variant="outline" onClick={refreshTickets}>Refresh</Button>
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
                          <Badge variant={ticket.status === 'checked_in' ? 'success' : ticket.status === 'revoked' ? 'destructive' : 'outline'}>
                            {ticket.status || 'valid'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={async()=>{ if(confirm('Revoke this ticket?')) { try{ await admin.revokeTicket(ticket.id); await refreshTickets(); } catch(e){ alert('Failed to revoke'); } } }}
                          >
                            <Trash className="w-4 h-4"/> Revoke
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {ticketsList.length===0 && (
                  <p className="text-muted-foreground text-center py-8">No tickets found.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments */}
          <TabsContent value="payments">
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <h2 className="font-display font-bold text-lg">All Payments</h2>
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Search reference/transaction #..."
                      value={paymentSearch}
                      onChange={(e) => setPaymentSearch(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && refreshPayments()}
                      className="w-56"
                    />
                    <select
                      className="h-10 rounded-lg border border-input bg-background px-2 text-sm"
                      value={paymentStatusFilter}
                      onChange={async (e) => { setPaymentStatusFilter(e.target.value); await refreshPayments(e.target.value); }}
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
                            className="h-9 rounded-lg border border-input bg-background px-2 text-sm"
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
              </CardContent>
            </Card>
          </TabsContent>

          {/* Blog */}
          <TabsContent value="blog">
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                  <h2 className="font-display font-bold text-lg">Blog Posts</h2>
                  <div className="flex items-center gap-2">
                    <Input placeholder="Search posts..." value={search} onChange={(e)=>setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && refreshBlogPosts()} className="w-48" />
                    <Button variant="outline" size="icon" onClick={refreshBlogPosts}><Search className="w-4 h-4" /></Button>
                    <Button onClick={()=>setCreatingBlogPost((v)=>!v)}>
                      <Plus className="w-4 h-4"/> Add Post
                    </Button>
                  </div>
                </div>

                {creatingBlogPost && (
                  <div className="p-4 mb-6 rounded-xl border border-border bg-muted/30">
                    <div className="grid md:grid-cols-2 gap-4">
                      <Input placeholder="Title" value={newBlogPost.title} onChange={(e)=>setNewBlogPost({...newBlogPost, title:e.target.value})}/>
                      <Input placeholder="Category" value={newBlogPost.category} onChange={(e)=>setNewBlogPost({...newBlogPost, category:e.target.value})}/>
                      <Input className="md:col-span-2" placeholder="Excerpt" value={newBlogPost.excerpt} onChange={(e)=>setNewBlogPost({...newBlogPost, excerpt:e.target.value})}/>
                      <input className="md:col-span-2 text-sm" type="file" accept="image/*" onChange={(e)=>setNewBlogPost({...newBlogPost, image: e.target.files?.[0] ?? null})}/>
                    </div>
                    <textarea className="w-full mt-4 rounded-xl border border-input bg-background px-4 py-3 text-sm" rows={5} placeholder="Content" value={newBlogPost.content} onChange={(e)=>setNewBlogPost({...newBlogPost, content:e.target.value})}/>
                    <div className="flex justify-end space-x-2 mt-4">
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
                      }}>Create</Button>
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
                  <Button variant="outline" onClick={refreshBlogPosts}>Refresh</Button>
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
                        <div className="mt-4 p-4 rounded-xl bg-muted/30">
                          <div className="grid md:grid-cols-2 gap-4">
                            <Input placeholder="Title" value={editingBlogPost.title} onChange={(e)=>setEditingBlogPost({...editingBlogPost, title:e.target.value})}/>
                            <Input placeholder="Category" value={editingBlogPost.category} onChange={(e)=>setEditingBlogPost({...editingBlogPost, category:e.target.value})}/>
                            <Input className="md:col-span-2" placeholder="Excerpt" value={editingBlogPost.excerpt} onChange={(e)=>setEditingBlogPost({...editingBlogPost, excerpt:e.target.value})}/>
                            <input className="md:col-span-2 text-sm" type="file" accept="image/*" onChange={(e)=>setEditingBlogPost({...editingBlogPost, image: e.target.files?.[0] ?? null})}/>
                            <select className="h-11 rounded-xl border border-input bg-background px-4 text-sm" value={editingBlogPost.is_published ? '1' : '0'} onChange={(e)=>setEditingBlogPost({...editingBlogPost, is_published: e.target.value === '1'})}>
                              <option value="1">Published</option>
                              <option value="0">Draft</option>
                            </select>
                          </div>
                          <textarea className="w-full mt-4 rounded-xl border border-input bg-background px-4 py-3 text-sm" rows={5} placeholder="Content" value={editingBlogPost.content} onChange={(e)=>setEditingBlogPost({...editingBlogPost, content:e.target.value})}/>
                          <div className="flex justify-end space-x-2 mt-4">
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
                            }}>Save</Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  {blogPostsList.length===0 && (
                    <p className="text-muted-foreground text-center py-8">No blog posts found.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <SettingsTab />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardShell>
  );
}
