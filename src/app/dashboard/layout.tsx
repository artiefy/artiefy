'use client';

import { usePathname } from 'next/navigation';

import ResponsiveSidebar from '~/components/eduAndAdmiMenu';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isWhatsApp = pathname.includes('/whatsapp/');

  return (
    <section>
      {isWhatsApp ? (
        children
      ) : (
        <ResponsiveSidebar>{children}</ResponsiveSidebar>
      )}
    </section>
  );
}
