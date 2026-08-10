'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { StatCard } from '@/components/dashboard/StatCard';
import { useAuth } from '@/components/AuthProvider';
import { isAdminLevelRole } from '@/lib/auth';
import { user, UserDashboard } from '@/lib/user';
import { getGreeting } from '@/lib/utils';
import { storageUrl } from '@/lib/storage';
import { payments } from '@/lib/payments';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { DonutBreakdown } from '@/components/charts/DonutBreakdown';
import { Ticket, Calendar, TrendingUp, ArrowRight, Clock, Heart, Receipt } from 'lucide-react';
import { NairaSign } from '@/components/icons/NairaSign';

export default function UserDashboardPage() {
  const router = useRouter();
  const { user: authUser, loading: authLoading } = useAuth();
  const [dashboard, setDashboard] = useState<UserDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!authUser) {
        router.push('/login');
      } else if (authUser.role === 'organizer') {
        router.push('/organizer');
      } else if (isAdminLevelRole(authUser.role)) {
        router.push('/admin');
      } else {
        loadDashboard();
      }
    }
  }, [authUser, authLoading]);

  const loadDashboard = async () => {
    try {
      const data = await user.getDashboard();
      setDashboard(data);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <DashboardShell title="My Dashboard">
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
      <DashboardShell title="My Dashboard">
        <p className="text-muted-foreground">Failed to load dashboard</p>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="My Dashboard" description={`${getGreeting()}, ${authUser?.name}`}>
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-4">
          <StatCard icon={Ticket} label="Total Bookings" value={String(dashboard.stats.total_tickets)} />
          <StatCard
            icon={NairaSign}
            label="Total Spent"
            value={`₦${dashboard.stats.total_spent.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`}
          />
          <StatCard icon={Calendar} label="Events Attended" value={String(dashboard.stats.total_events_attended)} />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Upcoming Events */}
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-display font-bold text-lg">Upcoming Events</h2>
                <Clock className="w-5 h-5 text-muted-foreground" />
              </div>
              {dashboard.upcoming_events.length > 0 ? (
                <div className="space-y-2">
                  {dashboard.upcoming_events.map((ticket: any) => (
                    <Link
                      key={ticket.id}
                      href={`/events/${ticket.event_id}`}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/40 transition-colors"
                    >
                      {ticket.event?.image && (
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                          <Image
                            src={storageUrl(ticket.event.image)!}
                            alt={ticket.event.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm truncate">{ticket.event?.title}</h3>
                        <p className="text-xs text-muted-foreground">
                          {ticket.event?.date && new Date(ticket.event.date).toLocaleDateString()}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <Calendar className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground mb-4">No upcoming events</p>
                  <Button asChild size="sm">
                    <Link href="/events">
                      Browse events <ArrowRight className="w-4 h-4" />
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Favorite Categories */}
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-display font-bold text-lg">Favorite Categories</h2>
                <Heart className="w-5 h-5 text-muted-foreground" />
              </div>
              {dashboard.favorite_categories.length > 0 ? (
                <DonutBreakdown
                  data={dashboard.favorite_categories.map((cat: any) => ({ name: cat.category, value: Number(cat.count) }))}
                  height={220}
                />
              ) : (
                <div className="text-center py-10">
                  <TrendingUp className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Start attending events to see your favorites!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Bookings */}
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-display font-bold text-lg">Recent Bookings</h2>
              <Link href="/my-tickets" className="text-sm font-medium text-primary hover:underline">
                View all
              </Link>
            </div>
            {dashboard.recent_tickets.length > 0 ? (
              <div className="space-y-2">
                {dashboard.recent_tickets.map((ticket: any) => (
                  <div key={ticket.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                    <div className="flex items-center gap-3">
                      {ticket.event?.image && (
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                          <Image
                            src={storageUrl(ticket.event.image)!}
                            alt={ticket.event.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div>
                        <h3 className="font-medium text-sm">{ticket.event?.title}</h3>
                        <p className="text-xs text-muted-foreground font-mono">{ticket.code}</p>
                      </div>
                    </div>
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/events/${ticket.event_id}`}>View event</Link>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <Ticket className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-4">No tickets yet</p>
                <Button asChild size="sm">
                  <Link href="/events">
                    Browse events <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment History */}
        {dashboard.payment_history.length > 0 && (
          <Card>
            <CardContent className="p-6">
              <h2 className="font-display font-bold text-lg mb-4">Recent Payments</h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Receipt</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dashboard.payment_history.map((payment: any) => (
                    <TableRow key={payment.id}>
                      <TableCell>{payment.event?.title}</TableCell>
                      <TableCell className="font-semibold text-emerald-600 dark:text-emerald-400">
                        ₦{payment.amount.toLocaleString('en-NG', { maximumFractionDigits: 0 })}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(payment.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            payment.status === 'success' ? 'success' :
                            payment.status === 'pending' ? 'outline' : 'destructive'
                          }
                        >
                          {payment.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {payment.status === 'success' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => { try { await payments.downloadReceipt(payment.id); } catch (e) { alert('Failed to download receipt'); } }}
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
        )}
      </div>
    </DashboardShell>
  );
}
