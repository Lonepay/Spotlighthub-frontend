'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { tickets, FoundTicket } from '@/lib/tickets';
import { storageUrl } from '@/lib/storage';
import api from '@/lib/api';
import { Search, Calendar, MapPin, Ticket as TicketIcon, Download, Mail } from 'lucide-react';
import { toast } from 'sonner';

export default function FindTicketsPage() {
  const [email, setEmail] = useState('');
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<FoundTicket[]>([]);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const data = await tickets.findByEmail(email.trim());
      setResults(data);
      if (data.length === 0) {
        toast.error("No tickets found for that email.");
      }
    } catch {
      toast.error('Something went wrong looking up your tickets. Please try again.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (ticket: FoundTicket) => {
    setDownloadingId(ticket.id);
    try {
      const response = await api.get(`/tickets/${ticket.id}/pdf`, {
        params: { email: email.trim() },
        responseType: 'blob',
      });
      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `ticket-${ticket.code}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
      toast.success('Ticket PDF downloaded');
    } catch {
      toast.error("Couldn't download the ticket PDF");
    } finally {
      setDownloadingId(null);
    }
  };

  const statusBadge = (status?: string) => {
    if (status === 'checked_in') return <Badge variant="secondary">Checked in</Badge>;
    if (status === 'invalid' || status === 'revoked') return <Badge variant="destructive">{status === 'revoked' ? 'Revoked' : 'Invalid'}</Badge>;
    return <Badge>Valid</Badge>;
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="pt-28 pb-20 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="text-xs uppercase tracking-widest text-primary-glow mb-2">Lost your tickets?</div>
          <h1 className="font-display font-bold text-4xl md:text-5xl mb-3">Find My Ticket</h1>
          <p className="text-lg text-muted-foreground">
            Enter the email you used at checkout and we&apos;ll pull up every ticket tied to it — no account needed.
          </p>
        </div>

        <form onSubmit={handleSearch} className="glass rounded-2xl p-6 md:p-8 shadow-card mb-10">
          <Label htmlFor="find-email">Email address</Label>
          <div className="flex flex-col sm:flex-row gap-3 mt-1.5">
            <div className="relative flex-1">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="find-email"
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-12"
              />
            </div>
            <Button type="submit" variant="hero" disabled={loading} className="sm:w-auto">
              <Search className="w-4 h-4" /> {loading ? 'Searching…' : 'Find tickets'}
            </Button>
          </div>
        </form>

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse h-28 bg-muted rounded-2xl" />
            ))}
          </div>
        ) : searched && results.length === 0 ? (
          <div className="text-center py-10">
            <TicketIcon className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground">No tickets found for that email. Double-check the address you used at checkout.</p>
          </div>
        ) : results.length > 0 ? (
          <div className="space-y-4">
            {results.map((ticket) => (
              <div key={ticket.id} className="glass rounded-2xl p-5 shadow-card flex flex-wrap items-center gap-4">
                <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-muted shrink-0">
                  {ticket.event?.image ? (
                    <Image src={storageUrl(ticket.event.image)!} alt={ticket.event.title} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-primary" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-display font-semibold truncate">{ticket.event?.title || 'Event'}</h3>
                    {statusBadge(ticket.status)}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1">
                    {ticket.event?.date && (
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> {new Date(ticket.event.date).toLocaleDateString()}
                      </span>
                    )}
                    {ticket.event && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {ticket.event.is_virtual ? 'Online' : ticket.event.venue}
                      </span>
                    )}
                    <span className="font-mono">{ticket.code}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {ticket.event_id && (
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/events/${ticket.event_id}`}>View event</Link>
                    </Button>
                  )}
                  <Button
                    size="sm"
                    disabled={downloadingId === ticket.id}
                    onClick={() => handleDownload(ticket)}
                  >
                    <Download className="w-4 h-4" /> {downloadingId === ticket.id ? 'Downloading…' : 'PDF'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <Footer />
    </div>
  );
}
