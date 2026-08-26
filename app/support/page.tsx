'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/AuthProvider';
import { supportTickets, SupportTicket } from '@/lib/supportTickets';
import { LifeBuoy, Send, ArrowLeft, Plus } from 'lucide-react';
import { toast } from 'sonner';

const STATUS_VARIANT: Record<SupportTicket['status'], 'outline' | 'secondary' | 'default' | 'destructive'> = {
  open: 'outline',
  pending: 'secondary',
  resolved: 'default',
  closed: 'destructive',
};

export default function SupportPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [list, setList] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [openTicket, setOpenTicket] = useState<SupportTicket | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [creating, setCreating] = useState(false);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login?next=/support');
      } else {
        loadTickets();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  const loadTickets = async () => {
    try {
      const data = await supportTickets.list();
      setList(data.data || data);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    setCreating(true);
    try {
      await supportTickets.create(subject.trim(), message.trim());
      setSubject('');
      setMessage('');
      setShowNewForm(false);
      toast.success('Support ticket created — we\'ll get back to you soon.');
      loadTickets();
    } catch {
      toast.error("Couldn't create the ticket. Please try again.");
    } finally {
      setCreating(false);
    }
  };

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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse space-y-4">
            {[1, 2].map((i) => <div key={i} className="glass rounded-2xl p-6 h-20" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <section className="flex-1 pt-16 pb-20 max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-xs uppercase tracking-widest text-primary-glow mb-2">Help</div>
            <h1 className="font-display font-bold text-4xl md:text-5xl mb-2">Support</h1>
            <p className="text-muted-foreground">Open a ticket and our team will get back to you here.</p>
          </div>
          {!openTicket && (
            <Button onClick={() => setShowNewForm((v) => !v)}>
              <Plus className="w-4 h-4" /> New ticket
            </Button>
          )}
        </div>

        {openTicket ? (
          <div className="space-y-4">
            <button onClick={() => { setOpenTicket(null); loadTickets(); }} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4" /> Back to my tickets
            </button>

            <div className="glass rounded-2xl border border-border/50 p-6 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-lg">{openTicket.subject}</p>
                <Badge variant={STATUS_VARIANT[openTicket.status]}>{openTicket.status}</Badge>
              </div>

              <div className="space-y-3 max-h-[420px] overflow-y-auto border-t border-border pt-4">
                {openTicket.messages?.map((m) => (
                  <div key={m.id} className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm ${m.user_id === openTicket.user_id ? 'bg-primary/10 ml-auto' : 'bg-muted/50'}`}>
                    <p className="text-xs font-semibold mb-0.5">{m.user_id === openTicket.user_id ? 'You' : (m.user?.name || 'Support')}</p>
                    <p className="whitespace-pre-wrap">{m.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{new Date(m.created_at).toLocaleString()}</p>
                  </div>
                ))}
              </div>

              {openTicket.status !== 'closed' && (
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
              )}
            </div>
          </div>
        ) : (
          <>
            {showNewForm && (
              <form onSubmit={handleCreate} className="glass rounded-2xl border border-border/50 p-6 mb-6 space-y-4">
                <div>
                  <Label htmlFor="support-subject">Subject</Label>
                  <Input id="support-subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="What's this about?" required />
                </div>
                <div>
                  <Label htmlFor="support-message">Message</Label>
                  <textarea
                    id="support-message"
                    className="w-full min-h-[120px] rounded-xl border border-input bg-background px-3 py-2 text-sm resize-y"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe your issue…"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={creating}>{creating ? 'Submitting…' : 'Submit ticket'}</Button>
                  <Button type="button" variant="outline" onClick={() => setShowNewForm(false)}>Cancel</Button>
                </div>
              </form>
            )}

            {list.length === 0 ? (
              <div className="glass rounded-2xl p-10 md:p-16 text-center">
                <LifeBuoy className="h-14 w-14 mx-auto text-primary-glow mb-4" />
                <h2 className="font-display font-bold text-2xl mb-2">No support tickets yet</h2>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">Need help with something? Open a ticket and we'll respond here.</p>
                <Button variant="hero" size="lg" onClick={() => setShowNewForm(true)}>
                  <Plus className="w-4 h-4" /> New ticket
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {list.map((t) => (
                  <div
                    key={t.id}
                    className="glass rounded-2xl border border-border/50 p-5 flex items-center justify-between gap-3 cursor-pointer hover:border-primary/40 transition-colors"
                    onClick={() => openThread(t)}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{t.subject}</p>
                        <Badge variant={STATUS_VARIANT[t.status]}>{t.status}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Opened {new Date(t.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </section>
      <Footer />
    </div>
  );
}
