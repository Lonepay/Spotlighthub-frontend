'use client';

import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { VerificationPanel } from '@/components/kyc/VerificationPanel';

export default function OrganizerVerificationPage() {
  return (
    <DashboardShell title="Verification" description="Get the blue tick on your organizer profile and every event">
      <VerificationPanel role="organizer" />
    </DashboardShell>
  );
}
