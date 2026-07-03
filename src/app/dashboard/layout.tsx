'use client';

import { usePathname } from 'next/navigation';

import ResponsiveSidebar from '~/components/eduAndAdmiMenu';
import GuidedTutorialButton from '~/components/super-admin/GuidedTutorialButton';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isWhatsApp = pathname.includes('/whatsapp/');
  const isSuperAdminRoute = pathname.startsWith('/dashboard/super-admin');

  return (
    <section>
      {isWhatsApp ? (
        children
      ) : (
        <ResponsiveSidebar>{children}</ResponsiveSidebar>
      )}

      {isSuperAdminRoute ? <GuidedTutorialButton /> : null}
    </section>
  );
}
