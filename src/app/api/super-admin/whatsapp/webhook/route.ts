import { type NextRequest, NextResponse } from 'next/server';

import { eq } from 'drizzle-orm';

import { createTicket } from '~/models/educatorsModels/ticketsModels';
import { db } from '~/server/db';
import { waMessages } from '~/server/db/schema';
import { sendWhatsAppMessage } from '~/server/whatsapp/send-message';

import { inbox, pushInbox } from '../_inbox';

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
      image?: {
        id?: string;
        caption?: string;
        mime_type?: string;
        sha256?: string;
      };
    }
  | {
      id?: string;
      from: string;
      timestamp?: string;
      type: 'audio';
      audio?: { id?: string; mime_type?: string; sha256?: string };
    }
  | {
      id?: string;
      from: string;
      timestamp?: string;
      type: 'video';
      video?: {
        id?: string;
        caption?: string;
        mime_type?: string;
        sha256?: string;
      };
    }
  | {
      id?: string;
      from: string;
      timestamp?: string;
      type: 'document';
      document?: {
        id?: string;
        filename?: string;
        caption?: string;
        mime_type?: string;
        sha256?: string;
      };
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

function toMs(ts?: string): number {
  if (!ts) return Date.now();

  if (/^\d+$/.test(ts)) {
    return ts.length === 10 ? Number(ts) * 1000 : Number(ts);
  }

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
  mediaId,
  mediaType,
  fileName,
  raw,
}: {
  metaMessageId?: string;
  waid: string;
  name?: string | null;
  direction: 'inbound' | 'outbound' | 'status';
  msgType: string;
  body?: string;
  tsMs: number;
  mediaId?: string;
  mediaType?: string;
  fileName?: string;
  raw?: unknown;
}) {
  try {
    if (metaMessageId) {
      const exists = await db
        .select({ id: waMessages.id })
        .from(waMessages)
        .where(eq(waMessages.metaMessageId, metaMessageId))
        .limit(1);

      if (exists.length) return;
    }

    await db.insert(waMessages).values({
      metaMessageId,
      waid,
      name: name ?? undefined,
      direction,
      msgType,
      body,
      tsMs,
      mediaId,
      mediaType,
      fileName,
      raw: raw as object | undefined,
    });
  } catch (e) {
    console.error('[WA][DB] Error guardando mensaje:', e);
  }
}

async function sendInitialSupportTemplate({
  waId,
  name,
}: {
  waId: string;
  name: string;
}) {
  return sendWhatsAppMessage({
    to: waId,
    forceTemplate: true,
    templateName: 'inicio_soporte',
    languageCode: 'es_ES',
    variables: [name || 'Usuario'],
    session: 'soporte',
  });
}

async function handleEscalation({
  waId,
  name,
  text,
}: {
  waId: string;
  name: string;
  text: string;
}) {
  try {
    await createTicket({
      comments: text,
      description: `Ticket creado desde WhatsApp

Cliente: ${name}
WhatsApp: ${waId}

Mensaje:
${text}`,
      coverImageKey: '',
      email: `${waId}@whatsapp.local`,
      userId: `whatsapp_${waId}`,
    });

    await sendWhatsAppMessage({
      to: waId,
      forceTemplate: true,
      templateName: 'escalamiento_humano',
      languageCode: 'es_ES',
      variables: [name || 'Usuario'],
      session: 'soporte',
    });
  } catch (error) {
    console.error('[WA][BOT] Error escalando a humano:', error);

    await sendWhatsAppMessage({
      to: waId,
      text: 'Tuvimos un problema creando tu solicitud. Por favor intenta nuevamente escribiendo "asesor".',
      session: 'soporte',
    }).catch((sendError) => {
      console.error('[WA][BOT] Error enviando fallback:', sendError);
    });
  }
}

async function handleIncomingMessage({
  waId,
  name,
  text,
}: {
  waId: string;
  name: string;
  text: string;
}) {
  try {
    const normalized = text.trim().toLowerCase();

    if (!normalized) {
      return sendInitialSupportTemplate({ waId, name });
    }

    if (
      normalized.includes('asesor') ||
      normalized.includes('humano') ||
      normalized.includes('ayuda') ||
      normalized.includes('agente')
    ) {
      return handleEscalation({ waId, name, text });
    }

    if (normalized === '1') {
      return sendWhatsAppMessage({
        to: waId,
        text: `Selecciona una opción de gestión financiera:

1. Estado de cuenta
2. Problema con pago
3. Renovación
4. Hablar con asesor`,
        session: 'soporte',
      });
    }

    if (normalized === '2') {
      return sendWhatsAppMessage({
        to: waId,
        text: `Selecciona una opción de soporte técnico:

1. Error en plataforma
2. No puedo acceder
3. Fallo de sistema
4. Hablar con asesor`,
        session: 'soporte',
      });
    }

    if (normalized === '4') {
      return handleEscalation({ waId, name, text });
    }

    return sendInitialSupportTemplate({ waId, name });
  } catch (error) {
    console.error('[WA][BOT] Error manejando mensaje:', error);
  }
}

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

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as WaWebhookBody;
  console.log('[WA-WEBHOOK][POST] raw body:', JSON.stringify(body, null, 2));

  try {
    for (const entry of body.entry ?? []) {
      for (const change of entry.changes ?? []) {
        const v = change.value;
        const contacts = v?.contacts ?? [];

        const messages = Array.isArray(v?.messages)
          ? (v.messages as WaMessage[])
          : [];

        const statuses = Array.isArray(v?.statuses)
          ? (v.statuses as WaStatus[])
          : [];

        for (const m of messages) {
          const tsMs = toMs(m.timestamp);
          let text = '';
          let mediaId = '';
          let mediaType = '';
          let fileName = '';

          switch (m.type) {
            case 'text':
              text = m.text?.body ?? '';
              break;

            case 'image':
              mediaId = m.image?.id ?? '';
              mediaType = m.image?.mime_type ?? 'image/jpeg';
              text = m.image?.caption ?? 'Imagen recibida';
              break;

            case 'audio':
              mediaId = m.audio?.id ?? '';
              mediaType = m.audio?.mime_type ?? 'audio/ogg';
              text = 'Audio recibido';
              break;

            case 'video':
              mediaId = m.video?.id ?? '';
              mediaType = m.video?.mime_type ?? 'video/mp4';
              text = m.video?.caption ?? 'Video recibido';
              break;

            case 'document':
              mediaId = m.document?.id ?? '';
              mediaType = m.document?.mime_type ?? 'application/octet-stream';
              fileName = m.document?.filename ?? 'documento';
              text = m.document?.caption ?? `Documento: ${fileName}`;
              break;

            case 'button':
              text = m.button?.text ?? m.button?.payload ?? 'Botón presionado';
              break;

            case 'interactive': {
              const br = m.interactive?.button_reply;
              const lr = m.interactive?.list_reply;

              text =
                br?.title ??
                br?.id ??
                lr?.title ??
                lr?.id ??
                'Mensaje interactivo';

              break;
            }

            default:
              text = 'Mensaje recibido';
          }

          const contactName = contacts?.[0]?.profile?.name ?? 'Usuario';

          pushInbox({
            id: m.id,
            direction: 'inbound',
            timestamp: tsMs,
            from: m.from,
            name: contactName,
            type: m.type,
            text,
            mediaId,
            mediaType,
            fileName,
            raw: m,
            session: 'soporte',
          });

          await saveMessage({
            metaMessageId: m.id,
            waid: m.from,
            name: contactName,
            direction: 'inbound',
            msgType: m.type,
            body: text,
            tsMs,
            mediaId,
            mediaType,
            fileName,
            raw: m,
          });

          if (
            m.type === 'text' ||
            m.type === 'button' ||
            m.type === 'interactive'
          ) {
            await handleIncomingMessage({
              waId: m.from,
              name: contactName,
              text,
            });
          }
        }

        for (const st of statuses) {
          const tsMs = toMs(st.timestamp);

          if (st.status === 'failed') {
            console.error(
              '❌ [WA-WEBHOOK] Mensaje fallido:',
              JSON.stringify(st, null, 2)
            );
          } else {
            console.log(`✅ [WA-WEBHOOK] Status: ${st.status}`, {
              id: st.id,
              to: st.recipient_id,
            });
          }

          pushInbox({
            id: st.id,
            direction: 'status',
            timestamp: tsMs,
            to: st.recipient_id,
            type: 'status',
            text: `Status: ${st.status ?? 'unknown'}`,
            raw: st,
            session: 'soporte',
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

export function DELETE() {
  inbox.length = 0;
  console.log('[WA-WEBHOOK] Inbox cleared');
  return NextResponse.json({ ok: true });
}
