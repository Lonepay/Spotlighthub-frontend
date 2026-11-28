'use client';

import { EventPickerPage } from '@/components/organizer/EventPickerPage';
import { AttendeesTable } from '@/components/organizer/AttendeesTable';

/** Customers per event: pick an event, see everyone holding a ticket. */
export default function OrganizerAttendeesPage() {
  return (
    <EventPickerPage
      title="Attendees"
      description="Everyone with a ticket to your events: names, emails and phone numbers. Search, sort, correct details and export."
      emptyText="No events yet. Attendees appear here once you sell tickets."
      basePath="/organizer/attendees"
    >
      {(event) => <AttendeesTable key={event.id} eventId={event.id} eventTitle={event.title} />}
    </EventPickerPage>
  );
}
