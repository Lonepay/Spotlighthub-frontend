'use client';

import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { VerificationPanel } from '@/components/kyc/VerificationPanel';

export default function VendorVerificationPage() {
  return (
    <DashboardShell title="Verification" description="Get the verified badge on your storefront and products">
      <VerificationPanel role="vendor" />
    </DashboardShell>
  );
}
