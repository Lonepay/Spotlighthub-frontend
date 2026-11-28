'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ArrowDown, ArrowUp, ArrowUpDown, Download, Pencil, Search, Users, UserCheck, Ban, Contact } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogBody, DialogForm } from '@/components/ui/dialog';
import { PaginationFooter } from '@/components/dashboard/PaginationFooter';
import { Loader } from '@/components/Loader';
import { attendees, AttendeeFilters, AttendeeRow, AttendeeSummary, CustomerRow } from '@/lib/attendees';
import { Paginated } from '@/lib/admin';

type View = 'attendees' | 'customers';

const ATTENDEE_COLUMNS: { key: string; label: string }[] = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'ticket_type', label: 'Ticket type' },
  { key: 'status', label: 'Status' },
  { key: 'purchased', label: 'Purchased' },
];

const CUSTOMER_COLUMNS: { key: string; label: string }[] = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'tickets', label: 'Tickets' },
  { key: 'purchased', label: 'Last purchase' },
];

function statusBadge(row: AttendeeRow) {
  if (row.status === 'revoked') return <Badge variant="destructive">Revoked</Badge>;
  if (row.checked_in_at || row.status === 'checked_in') return <Badge variant="default">Checked in</Badge>;
  if (row.status === 'invalid') return <Badge variant="outline">Invalid</Badge>;
  return <Badge variant="secondary">Valid</Badge>;
}

/** An event's attendees (or customers grouped by email): search, filter, sort, edit contacts, export. */
export function AttendeesTable({ eventId, eventTitle }: { eventId: number; eventTitle: string }) {
  const [view, setView] = useState<View>('attendees');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [ticketType, setTicketType] = useState<number | ''>('');
  const [sort, setSort] = useState('purchased');
  const [direction, setDirection] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [summary, setSummary] = useState<AttendeeSummary | null>(null);
  const [rows, setRows] = useState<Paginated<AttendeeRow> | null>(null);
  const [customers, setCustomers] = useState<Paginated<CustomerRow> | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<'' | 'csv' | 'xlsx'>('');
  const [editing, setEditing] = useState<AttendeeRow | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [saving, setSaving] = useState(false);

  const filters: AttendeeFilters = {
    view,
    search: query,
    status: view === 'attendees' ? status : '',
    ticket_type: view === 'attendees' ? ticketType : '',
    sort,
    direction,
    page,
    per_page: 25,
  };

  const load = async () => {
    setLoading(true);
    try {
      const data = await attendees.list(eventId, filters);
      setSummary(data.summary);
      setRows(data.attendees ?? null);
      setCustomers(data.customers ?? null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not load attendees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, view, query, status, ticketType, sort, direction, page]);

  // Search as you type, without a request per keystroke.
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      setQuery(search.trim());
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const toggleSort = (key: string) => {
    setPage(1);
    if (sort === key) {
      setDirection(direction === 'asc' ? 'desc' : 'asc');
    } else {
      setSort(key);
      setDirection(key === 'purchased' || key === 'tickets' ? 'desc' : 'asc');
    }
  };

  const switchView = (next: View) => {
    setView(next);
    setPage(1);
    setSort('purchased');
    setDirection('desc');
  };

  const exportFile = async (format: 'csv' | 'xlsx') => {
    setExporting(format);
    try {
      const slug = eventTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'event';
      await attendees.download(eventId, format, filters, `${slug}-${view}`);
    } catch {
      toast.error('Export failed. Please try again.');
    } finally {
      setExporting('');
    }
  };

  const openEdit = (row: AttendeeRow) => {
    setEditing(row);
    setForm({ name: row.name ?? '', email: row.email ?? '', phone: row.phone ?? '' });
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      const updated = await attendees.update(editing.id, {
        attendee_name: form.name.trim(),
        attendee_email: form.email.trim() || null,
        attendee_phone: form.phone.trim() || null,
      });
      setRows((prev) => (prev ? { ...prev, data: prev.data.map((r) => (r.id === updated.id ? updated : r)) } : prev));
      toast.success('Attendee updated');
      setEditing(null);
    } catch (err: any) {
      const errors = err.response?.data?.errors;
      toast.error(errors ? (Object.values(errors)[0] as string[])[0] : err.response?.data?.message || 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  const columns = view === 'attendees' ? ATTENDEE_COLUMNS : CUSTOMER_COLUMNS;
  const pageData = view === 'attendees' ? rows : customers;

  const sortHeader = (col: { key: string; label: string }) => (
    <TableHead key={col.key}>
      <button type="button" onClick={() => toggleSort(col.key)} className="inline-flex items-center gap-1 hover:text-foreground">
        {col.label}
        {sort === col.key ? (direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-40" />}
      </button>
    </TableHead>
  );

  return (
    <div className="space-y-4">
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Tile icon={Users} label="Tickets" value={summary.total} />
          <Tile icon={Contact} label="Customers" value={summary.customers} />
          <Tile icon={UserCheck} label="Checked in" value={summary.checked_in} />
          <Tile icon={Ban} label="Revoked" value={summary.revoked} />
        </div>
      )}

      <Card>
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="inline-flex border border-input w-fit">
              {(['attendees', 'customers'] as View[]).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => switchView(v)}
                  className={`px-3 h-9 text-sm capitalize ${view === v ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                >
                  {v === 'attendees' ? 'Per ticket' : 'Per customer'}
                </button>
              ))}
            </div>

            <div className="relative flex-1 min-w-0">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email, phone or ticket code" className="pl-9" />
            </div>

            {view === 'attendees' && (
              <div className="flex gap-2">
                <select
                  aria-label="Filter by status"
                  className="h-9 border border-input bg-background px-2 text-sm"
                  value={status}
                  onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                >
                  <option value="">All statuses</option>
                  <option value="valid">Valid</option>
                  <option value="checked_in">Checked in</option>
                  <option value="revoked">Revoked</option>
                </select>
                {summary && summary.ticket_types.length > 0 && (
                  <select
                    aria-label="Filter by ticket type"
                    className="h-9 border border-input bg-background px-2 text-sm"
                    value={ticketType}
                    onChange={(e) => { setTicketType(e.target.value ? Number(e.target.value) : ''); setPage(1); }}
                  >
                    <option value="">All ticket types</option>
                    {summary.ticket_types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={!!exporting} onClick={() => exportFile('csv')}>
                <Download className="w-4 h-4" /> {exporting === 'csv' ? 'Exporting…' : 'CSV'}
              </Button>
              <Button variant="outline" size="sm" disabled={!!exporting} onClick={() => exportFile('xlsx')}>
                <Download className="w-4 h-4" /> {exporting === 'xlsx' ? 'Exporting…' : 'Excel'}
              </Button>
            </div>
          </div>

          {loading && !pageData && <div className="py-10 flex justify-center"><Loader size={28} /></div>}

          {pageData && (
            <div className={`overflow-x-auto ${loading ? 'opacity-60' : ''}`}>
              <Table>
                <TableHeader>
                  <TableRow>
                    {columns.map(sortHeader)}
                    {view === 'attendees' && <TableHead>Code</TableHead>}
                    {view === 'attendees' && <TableHead className="text-right">Edit</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {view === 'attendees' && rows?.data.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.name || '—'}</TableCell>
                      <TableCell className="text-sm">{r.email ? <a href={`mailto:${r.email}`} className="hover:underline">{r.email}</a> : '—'}</TableCell>
                      <TableCell className="text-sm whitespace-nowrap">{r.phone ? <a href={`tel:${r.phone}`} className="hover:underline">{r.phone}</a> : '—'}</TableCell>
                      <TableCell className="text-sm">{r.ticket_type}</TableCell>
                      <TableCell>{statusBadge(r)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{r.purchased_at}</TableCell>
                      <TableCell className="font-mono text-xs">{r.code}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(r)} aria-label={`Edit ${r.name ?? 'attendee'}`}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {view === 'customers' && customers?.data.map((c) => (
                    <TableRow key={c.email}>
                      <TableCell className="font-medium">{c.name || '—'}</TableCell>
                      <TableCell className="text-sm"><a href={`mailto:${c.email}`} className="hover:underline">{c.email}</a></TableCell>
                      <TableCell className="text-sm whitespace-nowrap">{c.phone ? <a href={`tel:${c.phone}`} className="hover:underline">{c.phone}</a> : '—'}</TableCell>
                      <TableCell className="text-sm">{c.tickets}</TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{c.last_purchase?.slice(0, 16)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {pageData.data.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {query || status || ticketType ? 'No attendees match these filters.' : 'No tickets sold yet.'}
                </p>
              )}
            </div>
          )}

          {pageData && pageData.last_page > 1 && <PaginationFooter meta={pageData} onPageChange={setPage} />}
        </CardContent>
      </Card>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit attendee</DialogTitle>
            <DialogDescription>Ticket {editing?.code}. Changes are recorded in the activity log.</DialogDescription>
          </DialogHeader>
          <DialogForm onSubmit={saveEdit}>
            <DialogBody>
            <div className="space-y-2">
              <Label htmlFor="att-name">Name</Label>
              <Input id="att-name" required maxLength={255} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="att-email">Email</Label>
              <Input id="att-email" type="email" maxLength={255} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="att-phone">Phone</Label>
              <Input id="att-phone" type="tel" maxLength={20} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
            </DialogFooter>
          </DialogForm>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Tile({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  return (
    <div className="border border-border p-3">
      <div className="text-xs text-muted-foreground flex items-center gap-1"><Icon className="w-3.5 h-3.5" /> {label}</div>
      <div className="text-xl font-bold mt-1">{value.toLocaleString('en-NG')}</div>
    </div>
  );
}
