'use client';

import { useState, useEffect } from 'react';
import { vendorInquiries, VendorInquiry } from '@/lib/vendorInquiries';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/Loader';
import { Mail, Phone, MapPin } from 'lucide-react';

export function VendorsTab() {
  const [statusFilter, setStatusFilter] = useState('');
  const [list, setList] = useState<VendorInquiry[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    try {
      const data = await vendorInquiries.list({ status: statusFilter || undefined });
      setList(data.data || data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const handleStatusChange = async (id: number, status: 'new' | 'contacted' | 'closed') => {
    await vendorInquiries.updateStatus(id, status);
    await refresh();
  };

  const statusBadge = (status: string) => {
    if (status === 'contacted') return <Badge variant="secondary">Contacted</Badge>;
    if (status === 'closed') return <Badge variant="outline">Closed</Badge>;
    return <Badge variant="default">New</Badge>;
  };

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
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="closed">Closed</option>
        </select>
        <Button variant="outline" size="sm" onClick={refresh}>Refresh</Button>
      </div>

      {loading && <div className="py-8 flex justify-center"><Loader size={28} /></div>}
      {!loading && list.length === 0 && (
        <p className="text-muted-foreground text-sm text-center py-12">No vendor inquiries yet.</p>
      )}

      <div className="space-y-3">
        {list.map((v) => (
          <Card key={v.id}>
            <CardContent className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold">{v.business_name}</p>
                    {statusBadge(v.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">{v.contact_name}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {v.email}</span>
                    {v.phone && <span className="inline-flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {v.phone}</span>}
                    {v.location && <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {v.location}</span>}
                  </div>
                  <p className="text-sm mt-3 whitespace-pre-wrap">{v.message}</p>
                  <p className="text-xs text-muted-foreground mt-2">Submitted {new Date(v.created_at).toLocaleString()}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {v.status !== 'contacted' && (
                    <Button size="sm" variant="outline" onClick={() => handleStatusChange(v.id, 'contacted')}>Mark Contacted</Button>
                  )}
                  {v.status !== 'closed' && (
                    <Button size="sm" variant="ghost" onClick={() => handleStatusChange(v.id, 'closed')}>Close</Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
