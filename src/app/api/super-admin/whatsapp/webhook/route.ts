import { NextRequest, NextResponse } from 'next/server';

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

        const messages: WaMessage[] = Array.isArray(v?.messages)
          ? (v!.messages as WaMessage[])
          : [];
        const statuses: WaStatus[] = Array.isArray(v?.statuses)
          ? (v!.statuses as WaStatus[])
          : [];

        for (const m of messages) {
          const tsMs =
            m.timestamp && /^\d+$/.test(m.timestamp)
              ? m.timestamp.length === 10
                ? Number(m.timestamp) * 1000
                : Number(m.timestamp)
              : Date.now();

          let text = '';
          switch (m.type) {
            case 'text':
              text = m.text?.body ?? '';
              break;
            case 'image':
              text = m.image?.caption
                ? `📷 Imagen: ${m.image.caption}`
                : '📷 Imagen recibida';
              break;
            case 'audio':
              text = '🎧 Audio recibido';
              break;
            case 'video':
              text = m.video?.caption
                ? `🎬 Video: ${m.video.caption}`
                : '🎬 Video recibido';
              break;
            case 'document':
              text = m.document?.filename
                ? `📄 Documento: ${m.document.filename}`
                : '📄 Documento recibido';
              break;
            case 'button':
              text = m.button?.text
                ? `🔘 Botón: ${m.button.text}`
                : `🔘 Botón: ${m.button?.payload ?? ''}`;
              break;
            case 'interactive': {
              const br = m.interactive?.button_reply;
              const lr = m.interactive?.list_reply;
              if (br?.title) text = `🔘 Botón: ${br.title}`;
              else if (lr?.title) text = `📋 Lista: ${lr.title}`;
              else text = '🧩 Interactivo';
              break;
            }
            default: {
              text = '📝 Mensaje recibido';
              break;
            }
          }

          pushInbox({
            id: m.id,
            direction: 'inbound',
            timestamp: tsMs,
            from: m.from,
            name: v?.contacts?.[0]?.profile?.name ?? null,
            type: m.type,
            text,
            raw: m,
          });
        }

        for (const st of statuses) {
          const tsMs =
            st.timestamp && /^\d+$/.test(st.timestamp)
              ? st.timestamp.length === 10
                ? Number(st.timestamp) * 1000
                : Number(st.timestamp)
              : Date.now();

          pushInbox({
            id: st.id,
            direction: 'status',
            timestamp: tsMs,
            to: st.recipient_id,
            type: 'status',
            text: `Status: ${st.status ?? 'unknown'}`,
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
