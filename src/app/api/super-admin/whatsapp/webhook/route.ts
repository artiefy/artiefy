import { NextRequest, NextResponse } from 'next/server';

import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { waMessages } from '~/server/db/schema';

import { inbox, pushInbox } from '../_inbox'; // puedes mantenerlo para “pintar” al vuelo

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN ?? '';

type WaMessage =
  | {
      id?: string;
      from: string;
      timestamp?: string;
      type: 'text';
      text?: { body?: string };
    }
  | {
      id?: string;
      from: string;
      timestamp?: string;
      type: 'image';
      image?: { id?: string; caption?: string };
    }
  | {
      id?: string;
      from: string;
      timestamp?: string;
      type: 'audio';
      audio?: { id?: string };
    }
  | {
      id?: string;
      from: string;
      timestamp?: string;
      type: 'video';
      video?: { id?: string; caption?: string };
    }
  | {
      id?: string;
      from: string;
      timestamp?: string;
      type: 'document';
      document?: { id?: string; filename?: string; caption?: string };
    }
  | {
      id?: string;
      from: string;
      timestamp?: string;
      type: 'button';
      button?: { payload?: string; text?: string };
    }
  | {
      id?: string;
      from: string;
      timestamp?: string;
      type: 'interactive';
      interactive?: {
        type?: 'button_reply' | 'list_reply';
        button_reply?: { id?: string; title?: string };
        list_reply?: { id?: string; title?: string; description?: string };
      };
    };

interface WaStatus {
  id?: string;
  status?: string;
  timestamp?: string;
  recipient_id?: string;
}

interface WaWebhookBody {
  object?: string;
  entry?: {
    id?: string;
    changes?: {
      field?: string;
      value?: {
        messaging_product?: 'whatsapp';
        metadata?: {
          display_phone_number?: string;
          phone_number_id?: string;
        };
        contacts?: { wa_id?: string; profile?: { name?: string } }[];
        messages?: WaMessage[];
        statuses?: WaStatus[];
      };
    }[];
  }[];
}

/** Recepción de mensajes (Meta → tu backend) */
function toMs(ts?: string): number {
  if (!ts) return Date.now();
  if (/^\d+$/.test(ts)) return ts.length === 10 ? Number(ts) * 1000 : Number(ts);
  return Date.now();
}

async function saveMessage({
  metaMessageId,
  waid,
  name,
  direction,
  msgType,
  body,
  tsMs,
  raw,
}: {
  metaMessageId?: string;
  waid: string;
  name?: string | null;
  direction: 'inbound' | 'outbound' | 'status';
  msgType: string;
  body?: string;
  tsMs: number;
  raw?: unknown;
}) {
  try {
    // upsert suave por metaMessageId (cuando exista)
    if (metaMessageId) {
      const exists = await db
        .select({ id: waMessages.id })
        .from(waMessages)
        .where(eq(waMessages.metaMessageId, metaMessageId))
        .limit(1);

      if (exists.length) return; // ya guardado
    }

    await db.insert(waMessages).values({
      metaMessageId,
      waid,
      name: name ?? undefined,
      direction,
      msgType,
      body,
      tsMs,
      raw: raw as object | undefined,
    });
  } catch (e) {
    console.error('[WA][DB] Error guardando mensaje:', e);
  }
}

/** Verificación inicial (Meta) */
export function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  console.log('[WA-WEBHOOK][GET] verify', { mode, tokenSet: !!token });

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ Webhook verificado');
    return new NextResponse(challenge ?? '', { status: 200 });
  }
  console.warn('❌ Verificación fallida', { mode, token });
  return NextResponse.json({ error: 'verification failed' }, { status: 403 });
}



/** Recepción de mensajes (Meta → tu backend) */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as WaWebhookBody;
  console.log('[WA-WEBHOOK][POST] raw body:', JSON.stringify(body, null, 2));

  try {
    for (const entry of body.entry ?? []) {
      for (const change of entry.changes ?? []) {
        const v = change.value;
        const contacts = v?.contacts ?? [];

        const messages = Array.isArray(v?.messages) ? (v!.messages as WaMessage[]) : [];
        const statuses = Array.isArray(v?.statuses) ? (v!.statuses as WaStatus[]) : [];

        for (const m of messages) {
          const tsMs = toMs(m.timestamp);
          let text = '';

          switch (m.type) {
            case 'text': text = m.text?.body ?? ''; break;
            case 'image': text = m.image?.caption ? `📷 Imagen: ${m.image.caption}` : '📷 Imagen recibida'; break;
            case 'audio': text = '🎧 Audio recibido'; break;
            case 'video': text = m.video?.caption ? `🎬 Video: ${m.video.caption}` : '🎬 Video recibido'; break;
            case 'document': text = m.document?.filename ? `📄 Documento: ${m.document.filename}` : '📄 Documento recibido'; break;
            case 'button': text = m.button?.text ?? m.button?.payload ?? '🔘 Botón'; break;
            case 'interactive': {
              const br = m.interactive?.button_reply;
              const lr = m.interactive?.list_reply;
              text = br?.title ? `🔘 Botón: ${br.title}` : lr?.title ? `📋 Lista: ${lr.title}` : '🧩 Interactivo';
              break;
            }
            default: text = '📝 Mensaje recibido';
          }

          // pinta en UI inmediata (opcional)
          pushInbox({
            id: m.id,
            direction: 'inbound',
            timestamp: tsMs,
            from: m.from,
            name: contacts?.[0]?.profile?.name ?? null,
            type: m.type,
            text,
            raw: m,
          });

          // guarda en BD (permanente)
          await saveMessage({
            metaMessageId: m.id,
            waid: m.from,
            name: contacts?.[0]?.profile?.name ?? null,
            direction: 'inbound',
            msgType: m.type,
            body: text,
            tsMs,
            raw: m,
          });
        }

        for (const st of statuses) {
          const tsMs = toMs(st.timestamp);

          pushInbox({
            id: st.id,
            direction: 'status',
            timestamp: tsMs,
            to: st.recipient_id,
            type: 'status',
            text: `Status: ${st.status ?? 'unknown'}`,
            raw: st,
          });

          await saveMessage({
            metaMessageId: st.id,
            waid: st.recipient_id ?? 'unknown',
            direction: 'status',
            msgType: 'status',
            body: `Status: ${st.status ?? 'unknown'}`,
            tsMs,
            raw: st,
          });
        }
      }
    }
  } catch (e) {
    console.error('[WA-WEBHOOK][ERROR]', e);
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}

/** Limpieza local rápida (opcional) */
export function DELETE() {
  inbox.length = 0;
  console.log('[WA-WEBHOOK] Inbox cleared');
  return NextResponse.json({ ok: true });
}
