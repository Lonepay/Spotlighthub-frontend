'use client';

import { EventPickerPage } from '@/components/organizer/EventPickerPage';
import { EventDonationsPanel } from '@/components/organizer/EventDonationsPanel';

/** Donations per event: who gave, how much, and what you receive. */
export default function OrganizerDonationsPage() {
  return (
    <EventPickerPage
      title="Donations"
      description="Support from your audience, per event: donors, messages, and what you receive after the platform fee."
      emptyText="No events yet. Create an event and tick Accept donations to start receiving support."
      basePath="/organizer/donations"
    >
      {(event) => <EventDonationsPanel key={event.id} eventId={event.id} acceptsDonations={!!event.accepts_donations} showWhenEmpty />}
    </EventPickerPage>
  );
}
