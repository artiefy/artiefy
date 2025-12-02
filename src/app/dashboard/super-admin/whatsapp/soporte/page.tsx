// src/app/dashboard/super-admin/whatsapp/soporte/page.tsx
'use client';

import WhatsAppInboxPage from '~/app/dashboard/super-admin/whatsapp/inbox/page';

export default function WhatsAppSoportePage() {
  return <WhatsAppInboxPage searchParams={{ session: 'soporte' }} />;
}
