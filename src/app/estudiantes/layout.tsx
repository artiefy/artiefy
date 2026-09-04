import React from 'react';

import TicketSupportChatbot from '~/components/estudiantes/layout/TicketSupportChatbot';
import { TourComponent } from '~/components/estudiantes/layout/TourComponent';

import '~/styles/ticketSupportButton.css';

// Partial Prefetching, scoped to the student area while the rest of the app
// stays on the legacy full prefetch. A <Link> into /estudiantes now warms the
// shared App Shell for its destination instead of prefetching each URL
// separately, so navigation paints immediately and the URL-specific region
// streams in after.
//
// This is the documented incremental path: once every area has adopted it,
// `partialPrefetching: true` goes in next.config.ts and the
// `remove-partial-prefetch` codemod strips these per-segment exports.
// See: https://nextjs.org/docs/app/guides/adopting-partial-prefetching
export const prefetch = 'partial';

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
