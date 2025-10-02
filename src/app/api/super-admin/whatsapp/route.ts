// src/app/api/super-admin/whatsapp/route.ts
import { NextRequest, NextResponse } from 'next/server';

import { db } from '~/server/db';
import { waMessages } from '~/server/db/schema';

import { isIn24hWindow, pushInbox } from './_inbox';


/** ===================== Config ===================== */
const WHATSAPP_WABA_ID = '683921414745007';
const WHATSAPP_PHONE_NUMBER_ID = '805951652593761';
const ACCESS_TOKEN =
  'EAAgXFWT4Gt8BPRnyw8HZA038BKjYZAgQQN4q83KlIfQPeaq58gFlZAerzNTYmthlZA6h9CZBqZC9ZCS2Sp21JeRiW9go6iKonNdRsRzZBVrC5FkMgt84O8hMkpg8GODzU5tL8cCyKocnKl7ymjZCe84KompirjoRHZBvyX9uilAqEBBEF9gZABzTcf47ZCPpe9ovB4u0CAZDZD';

interface PostBody {
  to: string;                     // "57XXXXXXXXXX"
  text?: string;
  forceTemplate?: boolean;
  templateName?: string;
  languageCode?: string;
  variables?: string[];
  ensureSession?: boolean;        // nombre “oficial”
  autoSession?: boolean;          // alias que usas en el front
  sessionTemplate?: string;
  sessionLanguage?: string;
  replyTo?: string;               // 👈 id del mensaje a citar
}


// agrega context para responder a un mensaje específico
interface TextPayload {
  messaging_product: 'whatsapp';
  to: string;
  type: 'text';
  text: { body: string };
  context?: { message_id: string }; // 👈 reply
}

// WhatsApp payloads
interface TemplateParameter {
  type: 'text';
  text: string;
}

interface TemplateComponentBody {
  type: 'body' | 'BODY';
  parameters: TemplateParameter[];
}

interface TemplatePayload {
  messaging_product: 'whatsapp';
  to: string;
  type: 'template';
  template: {
    name: string;
    language: { code: string };
    components?: TemplateComponentBody[];
  };
}

interface TextPayload {
  messaging_product: 'whatsapp';
  to: string;
  type: 'text';
  text: { body: string };
}

type WhatsAppPayload = TemplatePayload | TextPayload;

// Meta success mínimo
interface MetaMessageId {
  id: string;
  message_status?: string;
}
interface MetaContact {
  input: string;
  wa_id: string;
}
interface MetaMessageResponse {
  messaging_product: 'whatsapp';
  contacts?: MetaContact[];
  messages?: MetaMessageId[];
}

// Meta error
interface MetaErrorData {
  message?: string;
  type?: string;
  code?: number;
  error_subcode?: number;
  fbtrace_id?: string;
  error_data?: unknown;
}
interface MetaErrorResponse {
  error?: MetaErrorData;
}

/** Plantillas (GET /message_templates) */
type TemplateStatus = string;

interface TemplateListComponent {
  type: string; // 'BODY', 'HEADER', etc.
  text?: string;
  example?: { body_text?: string[][] }; // formato que devuelve Meta
}
interface TemplateItem {
  name: string;
  language: string; // ej. 'es_ES'
  status: TemplateStatus;
  components?: TemplateListComponent[];
}
interface TemplateListResponse {
  data?: TemplateItem[];
}

/** Respuesta simplificada para el front */
interface UiTemplate {
  name: string;
  label: string;
  language: 'es' | 'en';
  langCode: string; // código exacto de Meta (usar al enviar)
  body: string;
  example: string[];
  status: TemplateStatus;
}

/** ===================== Helpers ===================== */
function toCurl(url: string, payload: unknown): string {
  return [
    `curl -i -X POST \\`,
    `  '${url}' \\`,
    `  -H 'Authorization: Bearer ${ACCESS_TOKEN}' \\`,
    `  -H 'Content-Type: application/json' \\`,
    `  -d '${JSON.stringify(payload).replace(/'/g, "\\'")}'`,
  ].join('\n');
}

function metaErrorInfo(json: unknown): { message?: string; code?: number } {
  const err = (json as MetaErrorResponse)?.error;
  return { message: err?.message, code: err?.code };
}

async function sendToMeta<T extends MetaMessageResponse>(
  payload: WhatsAppPayload,
  note: string
): Promise<T> {
  const url = `https://graph.facebook.com/v22.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
  const headers = {
    Authorization: `Bearer ${ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
  } as const;

  console.log(`\n================ [WA][POST] ${note} ================`);
  console.log('📤 Payload:\n', JSON.stringify(payload, null, 2));
  console.log('📟 cURL equivalente:\n' + toCurl(url, payload) + '\n');

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  const json: unknown = await res.json().catch(() => ({}));

  console.log('📗 Respuesta Meta:\n', JSON.stringify(json, null, 2));
  console.log('=====================================================\n');

  if (!res.ok) {
    const { message, code } = metaErrorInfo(json);
    const error = new Error(message ?? 'Error enviando WhatsApp');
    (error as Error & { code?: number }).code = code;
    throw error;
  }
  return json as T;
}

function isTemplateItem(value: unknown): value is TemplateItem {
  const v = value as TemplateItem;
  return (
    !!v &&
    typeof v === 'object' &&
    typeof v.name === 'string' &&
    typeof v.language === 'string' &&
    typeof v.status === 'string'
  );
}

function bodyComponent(
  components?: TemplateListComponent[]
): TemplateListComponent | undefined {
  return components?.find((c) => c.type.toUpperCase() === 'BODY');
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as PostBody;
    const {
      to,
      text,
      forceTemplate,
      templateName,
      languageCode,
      variables = [],
      ensureSession,            // opcional (override)
      autoSession = true,       // auto por defecto
      sessionTemplate = 'bienvenida', // 👈 usa bienvenida por defecto
      sessionLanguage = 'es_ES',      // 👈 idioma por defecto español
    } = body;


    if (!to) {
      return NextResponse.json(
        { error: 'Falta el parámetro "to"' },
        { status: 400 }
      );
    }

    // ¿hay que abrir ventana? -> override > auto > false
    const needEnsure =
      typeof ensureSession === 'boolean'
        ? ensureSession
        : autoSession
          ? !(await isIn24hWindow(to)) // ← Ahora es async
          : false;

    const usingExplicitTemplate = Boolean(forceTemplate ?? templateName);
    console.log('[WA] needEnsure para', to, ':', needEnsure);

    // ---------- A) Plantilla explícita ----------
    if (usingExplicitTemplate) {
      const baseTpl: TemplatePayload = {
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
          name: templateName ?? 'hello_world',
          language: { code: languageCode ?? 'en_US' },
          ...(variables.length > 0
            ? {
              components: [
                {
                  type: 'body',
                  parameters: variables.map<TemplateParameter>((v) => ({
                    type: 'text',
                    text: v,
                  })),
                },
              ],
            }
            : {}),
        },
      };

      try {
        const ok = await sendToMeta<MetaMessageResponse>(
          baseTpl,
          `ENVÍO DE PLANTILLA (${baseTpl.template.name}/${baseTpl.template.language.code})`
        );

        pushInbox({
          id: ok.messages?.[0]?.id,
          direction: 'outbound',
          timestamp: Date.now(),
          to,
          type: 'template',
          text: `[TPL] ${baseTpl.template.name}/${baseTpl.template.language.code}${variables.length ? ' | ' + variables.join(' | ') : ''}`,
          raw: ok,
        });

        return NextResponse.json({
          success: true,
          step: 'template',
          used: baseTpl.template,
          data: ok,
        });
      } catch {
        try {
          const fallback1: TemplatePayload = {
            ...baseTpl,
            template: { ...baseTpl.template, language: { code: 'en_US' } },
          };
          const ok1 = await sendToMeta<MetaMessageResponse>(
            fallback1,
            'FALLBACK MISMA PLANTILLA (en_US)'
          );

          pushInbox({
            id: ok1.messages?.[0]?.id,
            direction: 'outbound',
            timestamp: Date.now(),
            to,
            type: 'template',
            text: `[TPL] ${fallback1.template.name}/${fallback1.template.language.code}${variables.length ? ' | ' + variables.join(' | ') : ''}`,
            raw: ok1,
          });

          return NextResponse.json({
            success: true,
            step: 'template_fallback_en_US',
            used: fallback1.template,
            data: ok1,
          });
        } catch {
          const fallback2: TemplatePayload = {
            messaging_product: 'whatsapp',
            to,
            type: 'template',
            template: { name: 'hello_world', language: { code: 'en_US' } },
          };
          const ok2 = await sendToMeta<MetaMessageResponse>(
            fallback2,
            'FALLBACK hello_world (en_US)'
          );

          pushInbox({
            id: ok2.messages?.[0]?.id,
            direction: 'outbound',
            timestamp: Date.now(),
            to,
            type: 'template',
            text: `[TPL] hello_world/en_US`,
            raw: ok2,
          });

          return NextResponse.json({
            success: true,
            step: 'hello_world_fallback',
            used: fallback2.template,
            data: ok2,
          });
        }
      }
    }

    // ---------- B) Texto (auto ventana + reply) ----------
    let templateOpened: MetaMessageResponse | null = null;

    // Abre ventana si hace falta (auto/override)
    if (needEnsure) {
      try {
        const open1: TemplatePayload = {
          messaging_product: 'whatsapp',
          to,
          type: 'template',
          template: { name: sessionTemplate, language: { code: sessionLanguage } },
        };
        templateOpened = await sendToMeta<MetaMessageResponse>(
          open1,
          'APERTURA DE VENTANA (plantilla inicial)'
        );
      } catch {
        const open2: TemplatePayload = {
          messaging_product: 'whatsapp',
          to,
          type: 'template',
          template: { name: 'hello_world', language: { code: 'en_US' } },
        };
        templateOpened = await sendToMeta<MetaMessageResponse>(
          open2,
          'APERTURA DE VENTANA (fallback hello_world)'
        );
      }
    }

    if (!text) {
      return NextResponse.json({
        success: true,
        step: needEnsure ? 'session_template_only' : 'no_content',
        templateOpened,
      });
    }

    // si no nos pasan replyTo, intenta citar el último inbound
    // body ya debe estar tipado como PostBody
    const replyTo: string | undefined =
      typeof body.replyTo === 'string' ? body.replyTo : undefined;

    // si usas alias autoSession desde el front, unifícalo aquí:

    const payloadText: TextPayload = {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text },
      ...(replyTo ? { context: { message_id: replyTo } } : {}),
    };

    const textResp = await sendToMeta<MetaMessageResponse>(
      payloadText,
      replyTo ? 'ENVÍO DE TEXTO (reply)' : 'ENVÍO DE TEXTO'
    );

    pushInbox({
      id: textResp.messages?.[0]?.id,
      direction: 'outbound',
      timestamp: Date.now(),
      to,
      type: 'text',
      text,
      raw: textResp,
    });

    const metaId = textResp.messages?.[0]?.id;
    try {
      await db.insert(waMessages).values({
        metaMessageId: metaId,
        waid: to,
        direction: 'outbound',
        msgType: 'text',
        body: text,
        tsMs: Date.now(),
        raw: textResp as object,
      });
    } catch (e) {
      console.error('[WA][DB] No se pudo guardar OUTBOUND:', e);
    }

    return NextResponse.json({
      success: true,
      step: needEnsure ? 'template_then_text' : 'text_only',
      templateOpened,
      textMessage: textResp,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    console.error('❌ Error en backend WhatsApp:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}


/** ===================== GET: listar plantillas ===================== */
export async function GET(): Promise<NextResponse> {
  try {
    const url = `https://graph.facebook.com/v22.0/${WHATSAPP_WABA_ID}/message_templates?fields=name,language,status,components&limit=200`;

    console.log('🔎 [WA][GET] Consultando plantillas:', { url });

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
      method: 'GET',
    });

    const json: unknown = await res.json();
    const data = json as TemplateListResponse;

    console.log('📗 [WA][GET] Respuesta plantillas:', {
      status: res.status,
      ok: res.ok,
      count: Array.isArray(data.data) ? data.data.length : 0,
    });

    if (!res.ok) {
      const { message } = metaErrorInfo(json);
      return NextResponse.json(
        { error: message ?? 'Error consultando plantillas', details: json },
        { status: 400 }
      );
    }

    const rawList = Array.isArray(data.data) ? data.data : [];
    const mapped: UiTemplate[] = rawList
      .filter(isTemplateItem)
      .map<UiTemplate>((t) => {
        const bodyComp = bodyComponent(t.components);
        const body = bodyComp?.text ?? '';
        const example = bodyComp?.example?.body_text?.[0] ?? [];

        return {
          name: t.name,
          label: t.name.replace(/_/g, ' '),
          language: (t.language ?? 'es').startsWith('es') ? 'es' : 'en',
          langCode: t.language,
          body,
          example,
          status: t.status,
        };
      });

    console.log('✅ [WA][GET] Mapeadas:', {
      total: mapped.length,
      approved: mapped.filter((x) => x.status === 'APPROVED').length,
    });

    return NextResponse.json({ templates: mapped });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    console.error('❌ [WA][GET] Error listando plantillas:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
