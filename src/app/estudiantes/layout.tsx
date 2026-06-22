import React from 'react';

import StudentChatbot from '~/components/estudiantes/layout/studentdashboard/StudentChatbot';
import TicketSupportChatbot from '~/components/estudiantes/layout/TicketSupportChatbot';
import { TourComponent } from '~/components/estudiantes/layout/TourComponent';

import '~/styles/ticketSupportButton.css';

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
      <StudentChatbot isAlwaysVisible={true} />
      <TicketSupportChatbot />
    </div>
  );
}
