import React from 'react';

import { ExtrasProvider } from '~/app/estudiantes/StudentContext';
import Providers from '~/app/providers';
import { TourComponent } from '~/components/estudiantes/layout/TourComponent';

import '~/styles/ticketSupportButton.css';

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <ExtrasProvider>
        <div className="relative min-h-screen">
          {children}
          <TourComponent />
        </div>
      </ExtrasProvider>
    </Providers>
  );
}
