'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Megaphone, Trash2, Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { PaginationFooter } from '@/components/dashboard/PaginationFooter';
import { Paginated } from '@/lib/admin';
import { announcements, Announcement, AnnouncementAudience, AnnouncementTone } from '@/lib/announcements';

const AUDIENCES: { value: AnnouncementAudience; label: string }[] = [
  { value: 'all', label: 'Everyone' },
  { value: 'organizers', label: 'Organizers' },
  { value: 'vendors', label: 'Vendors' },
  { value: 'attendees', label: 'Attendees' },
  { value: 'staff', label: 'Staff & admins' },
];

const empty = { message: '', link_url: '', link_label: '', audience: 'all' as AnnouncementAudience, tone: 'info' as AnnouncementTone, starts_at: '', ends_at: '' };

function liveState(a: Announcement): { label: string; variant: 'default' | 'secondary' | 'outline' } {
  const now = Date.now();
  if (!a.is_active) return { label: 'Paused', variant: 'outline' };
  if (a.ends_at && new Date(a.ends_at).getTime() <= now) return { label: 'Ended', variant: 'outline' };
  if (a.starts_at && new Date(a.starts_at).getTime() > now) return { label: 'Scheduled', variant: 'secondary' };
  return { label: 'Live', variant: 'default' };
}

/**
 * Admin: post announcements to the dashboard ticker. Organizers and vendors
 * who aren't verified also see an automatic KYC reminder - no need to post one.
 */
export function AnnouncementsTab() {
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [list, setList] = useState<Paginated<Announcement> | null>(null);

  const load = () => announcements.list(page).then(setList).catch(() => setList(null));
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const errorOf = (err: any, fallback: string) => {
    const errors = err.response?.data?.errors;
    return errors ? (Object.values(errors)[0] as string[])[0] : err.response?.data?.message || fallback;
  };

  const post = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await announcements.create({
        message: form.message.trim(),
        link_url: form.link_url.trim() || null,
        link_label: form.link_label.trim() || null,
        audience: form.audience,
        tone: form.tone,
        starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
        ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
      });
      toast.success('Announcement posted');
      setForm(empty);
      setPage(1);
      load();
    } catch (err) {
      toast.error(errorOf(err, 'Could not post'));
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (a: Announcement) => {
    try {
      await announcements.update(a.id, { is_active: !a.is_active });
      load();
    } catch (err) {
      toast.error(errorOf(err, 'Could not update'));
    }
  };

  const remove = async (a: Announcement) => {
    if (!window.confirm('Delete this announcement?')) return;
    await announcements.remove(a.id);
    load();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <form onSubmit={post} className="space-y-4">
            <div>
              <h2 className="font-display font-bold text-lg flex items-center gap-2"><Megaphone className="w-5 h-5" /> New announcement</h2>
              <p className="text-sm text-muted-foreground">Shown in the ticker across the top of the dashboard. Unverified organizers and vendors already get an automatic KYC reminder.</p>
            </div>
            <div>
              <Label htmlFor="an-message">Message *</Label>
              <Input id="an-message" required maxLength={280} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="e.g. Payouts now go out every Monday and Thursday." />
              <p className="text-xs text-muted-foreground mt-1">{form.message.length}/280</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="an-audience">Who sees it</Label>
                <select id="an-audience" className="w-full h-10 rounded-[0.5rem] border border-input bg-background px-3 text-sm" value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value as AnnouncementAudience })}>
                  {AUDIENCES.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
                </select>
              </div>
              <div>
                <Label htmlFor="an-tone">Style</Label>
                <select id="an-tone" className="w-full h-10 rounded-[0.5rem] border border-input bg-background px-3 text-sm" value={form.tone} onChange={(e) => setForm({ ...form, tone: e.target.value as AnnouncementTone })}>
                  <option value="info">Info</option>
                  <option value="success">Good news</option>
                  <option value="warning">Important</option>
                </select>
              </div>
              <div>
                <Label htmlFor="an-start">Starts (optional)</Label>
                <Input id="an-start" type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="an-end">Ends (optional)</Label>
                <Input id="an-end" type="datetime-local" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="an-link">Link (optional)</Label>
                <Input id="an-link" value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} placeholder="/organizer/verification or https://…" />
              </div>
              <div>
                <Label htmlFor="an-link-label">Link text</Label>
                <Input id="an-link-label" maxLength={40} value={form.link_label} onChange={(e) => setForm({ ...form, link_label: e.target.value })} placeholder="Learn more" />
              </div>
            </div>
            <Button type="submit" disabled={saving}>{saving ? 'Posting…' : 'Post announcement'}</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-3">
          <h2 className="font-display font-bold text-lg">Announcements</h2>
          {!list || list.data.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">Nothing posted yet.</p>
          ) : (
            <div className="divide-y divide-border">
              {list.data.map((a) => {
                const state = liveState(a);
                return (
                  <div key={a.id} className="py-3 flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">{a.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {AUDIENCES.find((x) => x.value === a.audience)?.label} · {a.tone}
                        {a.ends_at ? ` · until ${new Date(a.ends_at).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })}` : ''}
                        {a.creator ? ` · by ${a.creator.name}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={state.variant}>{state.label}</Badge>
                      <Button size="sm" variant="ghost" onClick={() => toggle(a)} aria-label={a.is_active ? 'Pause' : 'Resume'}>{a.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}</Button>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => remove(a)} aria-label="Delete"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {list && list.last_page > 1 && <PaginationFooter meta={list} onPageChange={setPage} />}
        </CardContent>
      </Card>
    </div>
  );
}
