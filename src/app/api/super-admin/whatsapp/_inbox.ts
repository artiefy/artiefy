// src/app/api/super-admin/whatsapp/_inbox.ts

import { and,desc, eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { waMessages } from '~/server/db/schema';

export interface InboxItem {
  id?: string;
  direction: 'inbound' | 'outbound' | 'status';
  timestamp: number;
  from?: string;
  to?: string;
  name?: string | null;
  type: string;
  text?: string;
  mediaId?: string;
  mediaType?: string;
  fileName?: string;
  raw?: unknown;
}

// Global único en el proceso (solo para UI inmediata)
const g = globalThis as unknown as { __waInbox?: InboxItem[] };
g.__waInbox ??= [];
export const inbox = g.__waInbox!;

export function pushInbox(item: InboxItem) {
  inbox.unshift(item);
  console.log('[WA-INBOX][+]', {
    dir: item.direction,
    type: item.type,
    from: item.from,
    to: item.to,
    text: item.text,
    mediaId: item.mediaId,
    ts: item.timestamp,
  });
}

export function clearInbox() {
  inbox.length = 0;
}

// ✅ NUEVA: Consulta BD para último mensaje entrante
export async function getLastInboundFromDB(waId: string): Promise<{ timestamp: number } | null> {
  try {
    const result = await db
      .select({ tsMs: waMessages.tsMs })
      .from(waMessages)
      .where(
        and(
          eq(waMessages.waid, waId),
          eq(waMessages.direction, 'inbound')
        )
      )
      .orderBy(desc(waMessages.tsMs))
      .limit(1);
    
    return result[0] ? { timestamp: result[0].tsMs } : null;
  } catch (error) {
    console.error('[WA] Error consultando último inbound de BD:', error);
    return null;
  }
}

// Devuelve el último mensaje entrante de ese wa_id desde memoria (inmediato)
export function getLastInbound(waId: string): InboxItem | undefined {
  return inbox.find(
    (m) => m.direction === 'inbound' && m.from === waId
  );
}

// ✅ ACTUALIZADA: Verifica ventana de 24h consultando BD
export async function isIn24hWindow(waId: string, now = Date.now()): Promise<boolean> {
  // Primero busca en memoria (más rápido)
  const memoryLast = getLastInbound(waId)?.timestamp;
  if (memoryLast) {
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
    const inWindow = now - memoryLast < TWENTY_FOUR_HOURS;
    console.log('[WA] Ventana 24h (memoria):', { waId, memoryLast, inWindow });
    return inWindow;
  }
  
  // Si no encuentra en memoria, consulta BD
  const dbLast = await getLastInboundFromDB(waId);
  if (!dbLast) {
    console.log('[WA] No hay mensajes entrantes para:', waId);
    return false;
  }
  
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
  const inWindow = now - dbLast.timestamp < TWENTY_FOUR_HOURS;
  console.log('[WA] Ventana 24h (BD):', { waId, dbTimestamp: dbLast.timestamp, inWindow });
  return inWindow;
}