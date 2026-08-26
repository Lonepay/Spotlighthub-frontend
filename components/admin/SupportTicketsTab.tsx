'use client';

import { useState, useEffect } from 'react';
import { supportTickets, SupportTicket } from '@/lib/supportTickets';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader } from '@/components/Loader';
import { LifeBuoy, Send, ArrowLeft } from 'lucide-react';

const STATUS_VARIANT: Record<SupportTicket['status'], 'outline' | 'secondary' | 'default' | 'destructive'> = {
  open: 'outline',
  pending: 'secondary',
  resolved: 'default',
  closed: 'destructive',
};

export function SupportTicketsTab() {
  const [statusFilter, setStatusFilter] = useState('');
  const [list, setList] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [openTicket, setOpenTicket] = useState<SupportTicket | null>(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const data = await supportTickets.list(statusFilter || undefined);
      setList(data.data || data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const openThread = async (ticket: SupportTicket) => {
    const full = await supportTickets.get(ticket.id);
    setOpenTicket(full);
  };

  const handleReply = async () => {
    if (!openTicket || !reply.trim()) return;
    setSending(true);
    try {
      await supportTickets.reply(openTicket.id, reply);
      setReply('');
      const full = await supportTickets.get(openTicket.id);
      setOpenTicket(full);
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (status: SupportTicket['status']) => {
    if (!openTicket) return;
    const updated = await supportTickets.updateStatus(openTicket.id, status);
    setOpenTicket({ ...openTicket, status: updated.status });
    refresh();
  };

  if (openTicket) {
    return (
      <div className="space-y-4">
        <button onClick={() => { setOpenTicket(null); refresh(); }} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Back to all tickets
        </button>

        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-lg">{openTicket.subject}</p>
                <p className="text-sm text-muted-foreground">{openTicket.user?.name} · {openTicket.user?.email}</p>
              </div>
              <select
                className="h-9 rounded-none border border-input bg-background px-2 text-sm"
                value={openTicket.status}
                onChange={(e) => handleStatusChange(e.target.value as SupportTicket['status'])}
              >
                <option value="open">Open</option>
                <option value="pending">Pending</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div className="space-y-3 max-h-[420px] overflow-y-auto border-t border-border pt-4">
              {openTicket.messages?.map((m) => (
                <div key={m.id} className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm ${m.user_id === openTicket.user_id ? 'bg-muted/50' : 'bg-primary/10 ml-auto'}`}>
                  <p className="text-xs font-semibold mb-0.5">{m.user?.name || 'User'}</p>
                  <p className="whitespace-pre-wrap">{m.message}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{new Date(m.created_at).toLocaleString()}</p>
                </div>
              ))}
            </div>

            <div className="flex gap-2 border-t border-border pt-4">
              <textarea
                className="flex-1 min-h-[44px] rounded-xl border border-input bg-background px-3 py-2 text-sm resize-none"
                placeholder="Type a reply…"
                value={reply}
                onChange={(e) => setReply(e.target.value)}
              />
              <Button onClick={handleReply} disabled={sending || !reply.trim()}>
                <Send className="w-4 h-4" /> Send
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Status:</span>
        <select
          className="h-10 rounded-none border border-input bg-background px-2 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All</option>
          <option value="open">Open</option>
          <option value="pending">Pending</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        <Button variant="outline" size="sm" onClick={refresh}>Refresh</Button>
      </div>

      {loading && <div className="py-8 flex justify-center"><Loader size={28} /></div>}
      {!loading && list.length === 0 && (
        <p className="text-muted-foreground text-sm text-center py-12">No support tickets in this status.</p>
      )}

      <div className="space-y-3">
        {list.map((t) => (
          <Card key={t.id} className="cursor-pointer hover:border-primary/40 transition-colors" onClick={() => openThread(t)}>
            <CardContent className="p-5 flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <LifeBuoy className="w-4 h-4 text-muted-foreground" />
                  <p className="font-semibold">{t.subject}</p>
                  <Badge variant={STATUS_VARIANT[t.status]}>{t.status}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{t.user?.name} · {t.user?.email}</p>
                {t.assignee && <p className="text-xs text-muted-foreground mt-0.5">Assigned to {t.assignee.name}</p>}
              </div>
              <p className="text-xs text-muted-foreground shrink-0">{new Date(t.created_at).toLocaleDateString()}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
