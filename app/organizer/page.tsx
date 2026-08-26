'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { StatCard } from '@/components/dashboard/StatCard';
import { useAuth } from '@/components/AuthProvider';
import { isAdminLevelRole, isStaffRole } from '@/lib/auth';
import { getGreeting } from '@/lib/utils';
import { organizer, OrganizerDashboard } from '@/lib/organizer';
import { payments } from '@/lib/payments';
import { admin } from '@/lib/admin';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { DonutBreakdown } from '@/components/charts/DonutBreakdown';
import { Ticket, Calendar, ArrowRight, Receipt, PieChart, Trash2 } from 'lucide-react';
import { NairaSign } from '@/components/icons/NairaSign';

export default function OrganizerDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [dashboard, setDashboard] = useState<OrganizerDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'organizer' && !isStaffRole(user.role)) {
        router.push('/dashboard');
      } else {
        loadDashboard();
      }
    }
  }, [user, authLoading]);

  const loadDashboard = async () => {
    try {
      const data = await organizer.getDashboard();
      setDashboard(data);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (e: React.MouseEvent, eventId: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Delete this event? This cannot be undone.')) return;
    try {
      await admin.deleteEvent(eventId);
      await loadDashboard();
    } catch (err) {
      alert('Failed to delete event');
    }
  };

  if (authLoading || loading) {
    return (
      <DashboardShell title="Organizer Dashboard">
        <div className="animate-pulse space-y-6">
          <div className="grid sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
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
      <DashboardShell title="Organizer Dashboard">
        <p className="text-muted-foreground">Failed to load dashboard</p>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Organizer Dashboard" description={`${getGreeting()}, ${user?.name} — manage your events and track earnings`}>
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-4">
          <StatCard
            icon={NairaSign}
            label="Total Earnings"
            value={`₦${dashboard.stats.total_earnings.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`}
          />
          <StatCard icon={Ticket} label="Tickets Sold" value={String(dashboard.stats.total_tickets_sold)} />
          <StatCard icon={Calendar} label="Total Events" value={String(dashboard.stats.total_events)} />
        </div>

        {/* Revenue Breakdown */}
        {dashboard.earnings_by_event.length > 0 && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-bold text-lg">Revenue by Event</h2>
                <PieChart className="w-5 h-5 text-muted-foreground" />
              </div>
              <DonutBreakdown
                data={dashboard.earnings_by_event.map((e: any) => ({
                  name: e.event?.title || `Event #${e.event_id}`,
                  value: Number(e.total_earnings),
                }))}
                formatter={(v) => `₦${v.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`}
                emptyLabel="No revenue yet."
              />
            </CardContent>
          </Card>
        )}

        {/* Events List */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
              <h2 className="font-display font-bold text-lg">{user && isStaffRole(user.role) ? 'All Events' : 'Your Events'}</h2>
              <Button asChild size="sm">
                <Link href="/create-event">
                  Create event <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>

            {dashboard.events.length > 0 ? (
              <div className="space-y-2">
                {dashboard.events.map((event: any) => (
                  <Link
                    key={event.id}
                    href={`/organizer/events/${event.id}`}
                    className="block p-4 rounded-xl border border-border hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex justify-between items-center gap-3">
                      <div className="min-w-0">
                        <h3 className="font-medium truncate">{event.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {event.tickets_count} bookings &middot; {new Date(event.date).toLocaleDateString()}
                          {event.user && (
                            <> &middot; by {event.user.name || event.user.email}</>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {user && isAdminLevelRole(user.role) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={(e) => handleDeleteEvent(e, event.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <Calendar className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                <h3 className="font-semibold mb-1">No events yet</h3>
                <p className="text-sm text-muted-foreground mb-4">Create your first event to start selling tickets</p>
                <Button asChild size="sm">
                  <Link href="/create-event">
                    Create your first event <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Payments */}
        {dashboard.recent_payments.length > 0 && (
          <Card>
            <CardContent className="p-6">
              <h2 className="font-display font-bold text-lg mb-4">Recent Payments</h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Buyer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Receipt</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dashboard.recent_payments.map((payment: any) => (
                    <TableRow key={payment.id}>
                      <TableCell>{payment.event?.title}</TableCell>
                      <TableCell className="font-medium">{payment.user?.name || payment.guest_name || payment.user?.email}</TableCell>
                      <TableCell className="font-semibold text-emerald-600 dark:text-emerald-400">
                        ₦{payment.amount.toLocaleString('en-NG', { maximumFractionDigits: 0 })}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(payment.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => { try { await payments.downloadReceipt(payment.id); } catch (e) { alert('Failed to download receipt'); } }}
                        >
                          <Receipt className="w-4 h-4" /> Receipt
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardShell>
  );
}
