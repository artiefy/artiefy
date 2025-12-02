import React from 'react';

import Providers from '~/app/providers';
import StudentChatbot from '~/components/estudiantes/layout/studentdashboard/StudentChatbot';
import TicketSupportChatbot from '~/components/estudiantes/layout/TicketSupportChatbot';
import { TourComponent } from '~/components/estudiantes/layout/TourComponent';

import '~/styles/ticketSupportButton.css';

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <div className="relative min-h-screen">
        {children}
        <TourComponent />
        <StudentChatbot isAlwaysVisible={true} />
        <TicketSupportChatbot />
      </div>
    </Providers>
  );
}
