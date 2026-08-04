import React from 'react';

import TicketSupportChatbot from '~/components/estudiantes/layout/TicketSupportChatbot';
import { TourComponent } from '~/components/estudiantes/layout/TourComponent';

import '~/styles/ticketSupportButton.css';

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

// The root layout already wraps the whole app in <Providers> (ProgressProvider
// + ExtrasProvider). Re-wrapping here would nest a second ProgressProvider, so
// the student layout only renders its own segment-scoped UI.
export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen">
      {children}
      <TourComponent />
      <TicketSupportChatbot />
    </div>
  );
}
