'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/AuthProvider';
import { tickets, Ticket } from '@/lib/tickets';
import { payments } from '@/lib/payments';
import api from '@/lib/api';
import { storageUrl } from '@/lib/storage';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Ticket as TicketIcon, ArrowRight, Download, Receipt } from 'lucide-react';
import { toast } from 'sonner';

export default function MyTicketsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [ticketsList, setTicketsList] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [downloadingReceiptId, setDownloadingReceiptId] = useState<number | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login?next=/my-tickets');
      } else {
        loadTickets();
      }
    }
  }, [user, authLoading]);

  const loadTickets = async () => {
    try {
      const data = await tickets.getAll();
      setTicketsList(data.data || []);
    } catch (error) {
      console.error('Failed to load tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async (ticket: Ticket) => {
    setDownloadingId(ticket.id);
    try {
      const response = await api.get(`/tickets/${ticket.id}/pdf`, { responseType: 'blob' });
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

  const handleDownloadReceipt = async (ticket: Ticket) => {
    if (!ticket.payment_id) return;
    setDownloadingReceiptId(ticket.id);
    try {
      await payments.downloadReceipt(ticket.payment_id, `receipt-${ticket.code}.pdf`);
      toast.success('Receipt downloaded');
    } catch {
      toast.error("Couldn't download the receipt");
    } finally {
      setDownloadingReceiptId(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass rounded-2xl p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-4" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <section className="flex-1 pt-16 pb-20 max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <div className="text-xs uppercase tracking-widest text-primary-glow mb-2">My purchases</div>
          <h1 className="font-display font-bold text-4xl md:text-5xl mb-2">Tickets</h1>
          <p className="text-muted-foreground">Every ticket you've booked, with a QR code ready for entry.</p>
        </div>

        {ticketsList.length === 0 ? (
          <div className="glass rounded-2xl p-10 md:p-16 text-center">
            <TicketIcon className="h-14 w-14 mx-auto text-primary-glow mb-4" />
            <h2 className="font-display font-bold text-2xl mb-2">No tickets yet</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              When you buy tickets, they'll show up here with a scannable QR code.
            </p>
            <Button asChild variant="hero" size="lg">
              <Link href="/events">Browse events</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            {ticketsList.map((ticket) => (
              <div key={ticket.id} className="glass rounded-2xl border border-border/50 overflow-hidden">
                <div className="p-5 md:p-6 border-b border-border/50 flex flex-wrap items-start justify-between gap-4">
                  <div className="flex gap-4 min-w-0">
                    {ticket.event?.image && (
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                        <Image
                          src={storageUrl(ticket.event.image)!}
                          alt={ticket.event.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="font-display font-bold text-xl truncate">{ticket.event?.title || 'Event'}</div>
                        {ticket.status === 'checked_in' && <Badge variant="success">Checked in</Badge>}
                        {ticket.status === 'revoked' && <Badge variant="destructive">Revoked</Badge>}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1">
                        {ticket.event && (
                          <>
                            <span className="inline-flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(ticket.event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}{ticket.event.time ? ` · ${ticket.event.time}` : ''}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> {ticket.event.venue}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <Link
                    href={`/events/${ticket.event_id}`}
                    className="text-xs text-primary-glow hover:underline inline-flex items-center gap-1 shrink-0"
                  >
                    View event <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                <div className="p-5 md:p-6 flex flex-wrap items-center gap-4 justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-white p-2 rounded-md grid place-items-center">
                      <QRCodeSVG
                        value={ticket.code}
                        size={72}
                        level="H"
                        imageSettings={{
                          src: '/storage/logo.png',
                          height: 18,
                          width: 18,
                          excavate: true,
                        }}
                      />
                    </div>
                    <div className="text-xs">
                      <div className="font-semibold font-mono">{ticket.code}</div>
                      <div className="text-muted-foreground mt-0.5">Scan at entry</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {ticket.payment_id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadReceipt(ticket)}
                        disabled={downloadingReceiptId === ticket.id}
                      >
                        <Receipt className="h-4 w-4" />
                        {downloadingReceiptId === ticket.id ? 'Preparing…' : 'Receipt'}
                      </Button>
                    )}
                    <Button
                      variant="glass"
                      size="sm"
                      onClick={() => handleDownloadPdf(ticket)}
                      disabled={downloadingId === ticket.id}
                    >
                      <Download className="h-4 w-4" />
                      {downloadingId === ticket.id ? 'Preparing…' : 'Download PDF'}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      <Footer />
    </div>
  );
}
