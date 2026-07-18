'use client';

import { useState, useEffect } from 'react';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { VerifiedBadge } from '@/components/VerifiedBadge';
import { kyc, KycInfo } from '@/lib/kyc';
import { ShieldCheck, Upload } from 'lucide-react';

export default function OrganizerVerificationPage() {
  const [info, setInfo] = useState<KycInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ kyc_business_name: '', kyc_id_type: 'NIN', kyc_id_number: '' });
  const [document, setDocument] = useState<File | null>(null);

  useEffect(() => {
    kyc.getMine()
      .then((data) => {
        setInfo(data);
        setForm({
          kyc_business_name: data.kyc_business_name || '',
          kyc_id_type: data.kyc_id_type || 'NIN',
          kyc_id_number: '',
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!document) {
      setError('Please upload an ID document.');
      return;
    }
    setSubmitting(true);
    try {
      const updated = await kyc.submit({ ...form, document });
      setInfo(updated);
      setDocument(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit verification');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardShell title="Verification">
        <p className="text-muted-foreground">Loading...</p>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Verification" description="Get a blue tick badge on your organizer profile">
      <Card className="max-w-2xl shadow-none">
        <CardContent className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg flex items-center gap-2">
                Organizer Verification
                {info?.is_verified && <VerifiedBadge size="md" />}
              </h2>
              <p className="text-sm text-muted-foreground">
                {info?.kyc_status === 'approved' && 'Verified — your blue tick is live across the platform.'}
                {info?.kyc_status === 'pending' && 'Your verification is under review.'}
                {info?.kyc_status === 'rejected' && 'Your last submission was not approved.'}
                {(!info || info.kyc_status === 'none') && 'Submit your details to get verified.'}
              </p>
            </div>
          </div>

          {info?.kyc_status === 'pending' && (
            <Badge variant="outline" className="text-amber-600 border-amber-300">Pending review</Badge>
          )}
          {info?.kyc_status === 'rejected' && info.kyc_rejection_reason && (
            <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-sm">
              <strong>Reason:</strong> {info.kyc_rejection_reason}
            </div>
          )}

          {info?.kyc_status !== 'approved' && (
            <form onSubmit={handleSubmit} className="space-y-4 pt-4 border-t border-border">
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-sm">
                  {error}
                </div>
              )}
              <div>
                <Label htmlFor="business-name">Business / organizer name</Label>
                <Input
                  id="business-name"
                  required
                  value={form.kyc_business_name}
                  onChange={(e) => setForm({ ...form, kyc_business_name: e.target.value })}
                  placeholder="Your business or brand name"
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="id-type">ID type</Label>
                  <select
                    id="id-type"
                    className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm"
                    value={form.kyc_id_type}
                    onChange={(e) => setForm({ ...form, kyc_id_type: e.target.value })}
                  >
                    <option value="NIN">NIN</option>
                    <option value="Passport">International Passport</option>
                    <option value="Drivers License">Driver's License</option>
                    <option value="Voters Card">Voter's Card</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="id-number">ID number</Label>
                  <Input
                    id="id-number"
                    required
                    value={form.kyc_id_number}
                    onChange={(e) => setForm({ ...form, kyc_id_number: e.target.value })}
                    placeholder="ID number"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="document">ID document (image or PDF)</Label>
                <input
                  id="document"
                  type="file"
                  accept="image/*,.pdf"
                  required
                  onChange={(e) => setDocument(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 file:cursor-pointer cursor-pointer"
                />
              </div>
              <Button type="submit" disabled={submitting}>
                <Upload className="w-4 h-4" />
                {submitting ? 'Submitting...' : info?.kyc_status === 'rejected' ? 'Resubmit for review' : 'Submit for verification'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
