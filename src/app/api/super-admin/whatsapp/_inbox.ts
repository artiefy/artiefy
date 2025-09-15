// src/app/api/super-admin/whatsapp/_inbox.ts

export interface InboxItem {
  id?: string;
  direction: 'inbound' | 'outbound' | 'status';
  timestamp: number; // ms epoch
  from?: string;
  to?: string;
  name?: string | null;
  type: string; // text, image, audio, document, interactive, status, etc.
  text?: string;
  raw?: unknown;
}

// Global único en el proceso (persiste entre requests en dev/prod)
const g = globalThis as unknown as { __waInbox?: InboxItem[] };
g.__waInbox ??= [];
export const inbox = g.__waInbox!;

// Helpers
export function pushInbox(item: InboxItem) {
  inbox.unshift(item);
  console.log('[WA-INBOX][+]', {
    dir: item.direction,
    type: item.type,
    from: item.from,
    to: item.to,
    text: item.text,
    ts: item.timestamp,
  });
}

export function clearInbox() {
  inbox.length = 0;
}


// Devuelve el último mensaje entrante de ese wa_id (número) si existe
export function getLastInbound(waId: string): InboxItem | undefined {
  return inbox.find(
    (m) => m.direction === 'inbound' && m.from === waId
  );
}

// ¿Sigue abierta la ventana de 24h desde el último inbound?
export function isIn24hWindow(waId: string, now = Date.now()): boolean {
  const last = getLastInbound(waId)?.timestamp;
  if (!last) return false;
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
  return now - last < TWENTY_FOUR_HOURS;
}
