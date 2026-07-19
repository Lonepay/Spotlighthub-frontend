'use client';

import { useState, useEffect } from 'react';
import { kyc, KycInfo } from '@/lib/kyc';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { VerifiedBadge } from '@/components/VerifiedBadge';
import { storageUrl } from '@/lib/storage';
import { FileText, Check, X } from 'lucide-react';

export function KycReviewTab() {
  const [statusFilter, setStatusFilter] = useState('pending');
  const [list, setList] = useState<KycInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [reason, setReason] = useState('');

  const refresh = async () => {
    setLoading(true);
    try {
      const data = await kyc.adminList(statusFilter || undefined);
      setList(data.data || data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const handleApprove = async (userId: number) => {
    await kyc.approve(userId);
    await refresh();
  };

  const handleReject = async (userId: number) => {
    if (!reason.trim()) return;
    await kyc.reject(userId, reason);
    setRejectingId(null);
    setReason('');
    await refresh();
  };

  const statusBadge = (status: string) => {
    if (status === 'approved') return <Badge variant="default">Approved</Badge>;
    if (status === 'rejected') return <Badge variant="destructive">Rejected</Badge>;
    return <Badge variant="outline" className="text-amber-600 border-amber-300">Pending</Badge>;
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
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="">All</option>
        </select>
        <Button variant="outline" size="sm" onClick={refresh}>Refresh</Button>
      </div>

      {loading && <p className="text-muted-foreground text-sm">Loading...</p>}
      {!loading && list.length === 0 && (
        <p className="text-muted-foreground text-sm text-center py-12">No KYC submissions in this status.</p>
      )}

      <div className="space-y-3">
        {list.map((item) => (
          <Card key={item.id}>
            <CardContent className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{item.name}</p>
                    {item.is_verified && <VerifiedBadge />}
                    {statusBadge(item.kyc_status)}
                  </div>
                  <p className="text-sm text-muted-foreground">{item.email}</p>
                  <p className="text-sm mt-1">
                    <span className="text-muted-foreground">Business:</span> {item.kyc_business_name || '—'}
                    {' · '}
                    <span className="text-muted-foreground">{item.kyc_id_type}</span>
                  </p>
                  {item.kyc_submitted_at && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Submitted {new Date(item.kyc_submitted_at).toLocaleString()}
                    </p>
                  )}
                  {item.kyc_rejection_reason && (
                    <p className="text-xs text-destructive mt-1">Reason: {item.kyc_rejection_reason}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {item.kyc_document_path && (
                    <a
                      href={storageUrl(item.kyc_document_path)!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                    >
                      <FileText className="w-4 h-4" /> View document
                    </a>
                  )}
                  {item.kyc_status !== 'approved' && (
                    <Button size="sm" onClick={() => handleApprove(item.id)}>
                      <Check className="w-4 h-4" /> Approve
                    </Button>
                  )}
                  {item.kyc_status !== 'rejected' && (
                    <Button size="sm" variant="outline" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setRejectingId(item.id)}>
                      <X className="w-4 h-4" /> Reject
                    </Button>
                  )}
                </div>
              </div>

              {rejectingId === item.id && (
                <div className="mt-4 pt-4 border-t border-border flex gap-2">
                  <input
                    autoFocus
                    className="flex-1 h-9 rounded-lg border border-input bg-background px-3 text-sm"
                    placeholder="Reason for rejection..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleReject(item.id)}
                  />
                  <Button size="sm" onClick={() => handleReject(item.id)}>Confirm</Button>
                  <Button size="sm" variant="outline" onClick={() => { setRejectingId(null); setReason(''); }}>Cancel</Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
