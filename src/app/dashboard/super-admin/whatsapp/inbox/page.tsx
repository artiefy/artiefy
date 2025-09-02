// src/app/dashboard/super-admin/whatsapp/inbox/page.tsx
'use client';

import { useEffect, useState } from 'react';

interface InboxItem {
  id?: string;
  from: string;
  name?: string | null;
  timestamp: number;
  type: string;
  text: string;
}

interface ApiInboxResponse {
  items: InboxItem[];
  total?: number;
}

export default function WhatsAppInboxPage() {
  const [inbox, setInbox] = useState<InboxItem[]>([]);

  useEffect(() => {
    let cancelled = false;

    fetch('/api/super-admin/whatsapp/inbox', { cache: 'no-store' })
      .then((res) => res.json() as Promise<ApiInboxResponse>)
      .then((data) => {
        if (!cancelled) setInbox(Array.isArray(data?.items) ? data.items : []);
      })
      .catch(() => {
        if (!cancelled) setInbox([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="p-4">
      <h1 className="mb-4 text-xl font-bold">WhatsApp Inbox</h1>
      <ul className="space-y-2">
        {inbox.map((item) => (
          <li
            key={item.id ?? String(item.timestamp)}
            className="rounded border p-2"
          >
            <div>
              <strong>📨 {item.text}</strong>
            </div>
            <div>👤 {item.name ?? item.from}</div>
            <div>📅 {new Date(item.timestamp).toLocaleString()}</div>
            <div>📦 Tipo: {item.type}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
