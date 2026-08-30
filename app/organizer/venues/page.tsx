'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { useAuth } from '@/components/AuthProvider';
import { isStaffRole } from '@/lib/auth';
import { venues, Venue } from '@/lib/venues';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from 'sonner';
import { Plus, Building2, Trash2 } from 'lucide-react';

export default function OrganizerVenuesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [list, setList] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || (user.role !== 'organizer' && !isStaffRole(user.role))) {
      router.push('/login');
      return;
    }
    load();
  }, [user]);

  const load = async () => {
    try {
      setList(await venues.getAll());
    } catch (error) {
      console.error('Failed to load venues:', error);
    } finally {
      setLoading(false);
    }
  };

  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await venues.delete(deleteTarget.id);
      setDeleteTarget(null);
      await load();
    } catch {
      toast.error('Failed to delete venue');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <DashboardShell title="My Venues" description="Bookable spaces you've listed, with availability and pricing">
      <div className="flex justify-end mb-4">
        <Button asChild>
          <Link href="/create-venue"><Plus className="w-4 h-4" /> Create venue</Link>
        </Button>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          <div className="h-20 bg-muted rounded-xl" />
          <div className="h-20 bg-muted rounded-xl" />
        </div>
      ) : list.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <Building2 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No venues yet. Create one to start taking bookings.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {list.map((v) => (
            <Card key={v.id}>
              <CardContent className="p-4 flex items-center justify-between gap-3">
                <Link href={`/organizer/venues/${v.id}`} className="min-w-0 flex-1">
                  <p className="font-medium truncate">{v.name}</p>
                  <p className="text-sm text-muted-foreground truncate">{v.city} &middot; {v.pricing_tiers?.length ?? 0} pricing tier(s)</p>
                </Link>
                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0" onClick={() => setDeleteTarget({ id: v.id, name: v.name })}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete this venue?"
        description={deleteTarget ? `"${deleteTarget.name}" will be permanently removed. This removes its pricing tiers too.` : undefined}
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={confirmDelete}
      />
    </DashboardShell>
  );
}
