'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { useAuth } from '@/components/AuthProvider';
import { isStaffRole } from '@/lib/auth';
import { movies, Movie } from '@/lib/movies';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Clapperboard, Trash2 } from 'lucide-react';

export default function OrganizerMoviesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [list, setList] = useState<Movie[]>([]);
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
      setList(await movies.getAll());
    } catch (error) {
      console.error('Failed to load movies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this movie? This removes all its showtimes, tiers, and add-ons.')) return;
    try {
      await movies.delete(id);
      await load();
    } catch {
      alert('Failed to delete movie');
    }
  };

  return (
    <DashboardShell title="My Movies" description="Movies you've listed, with showtimes, seating, and tiers">
      <div className="flex justify-end mb-4">
        <Button asChild>
          <Link href="/create-movie"><Plus className="w-4 h-4" /> Create movie</Link>
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
            <Clapperboard className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No movies yet. Create one to start selling showtimes.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {list.map((m) => (
            <Card key={m.id}>
              <CardContent className="p-4 flex items-center justify-between gap-3">
                <Link href={`/organizer/movies/${m.id}`} className="min-w-0 flex-1">
                  <p className="font-medium truncate">{m.title}</p>
                  <p className="text-sm text-muted-foreground truncate">{m.city} &middot; {m.showtimes?.length ?? 0} showtime(s) &middot; {m.ticket_tiers?.length ?? 0} tier(s)</p>
                </Link>
                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0" onClick={() => handleDelete(m.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
