// src/app/dashboard/super-admin/whatsapp/sesion2/page.tsx
'use client';

import WhatsAppInboxPage from '~/app/dashboard/super-admin/whatsapp/inbox/page';

export default function WhatsAppSesion2Page() {
    return <WhatsAppInboxPage searchParams={{ session: 'sesion2' }} />;
}