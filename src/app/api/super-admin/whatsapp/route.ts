// src/app/api/super-admin/whatsapp/route.ts
import { NextRequest, NextResponse } from 'next/server';

/** ===================== Config ===================== */
const WHATSAPP_WABA_ID = '1229944015242086';
const WHATSAPP_PHONE_NUMBER_ID = '687425254451016';
const ACCESS_TOKEN =
  'EAAgXFWT4Gt8BPfZApZC0ZBQSZBaiyOtxKsvMWTyTqIcRLPb8pfZCGhm1RB6vNr1szLrfNSJLiNreJPvXZC51vIQ5Y6TfpGAcwYJN0x21O8A9ZAShbmFiy0oqUN0nMQZBdP1FGa9zoBqa1RmSLQID1PZAX9c97imZAZCq2hzVnBxpFDiEu0PkE8B1PlgNmXvmhx4uiXZCCgZDZD';

/** ===================== Tipos ===================== */
// Request body del POST
interface PostBody {
  to: string; // "57XXXXXXXXXX" (sin +)
  text?: string;
  forceTemplate?: boolean;
  templateName?: string;
  languageCode?: string; // ej. es_ES, es_MX, en_US
  variables?: string[];
  ensureSession?: boolean;
  sessionTemplate?: string; // p.ej. "hello_world"
  sessionLanguage?: string; // p.ej. "en_US"
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

/** ===================== POST: enviar ===================== */
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
      ensureSession = false, // por defecto NO abre sesión
      sessionTemplate = 'hello_world',
      sessionLanguage = 'en_US',
    } = body;

    if (!to) {
      return NextResponse.json(
        { error: 'Falta el parámetro "to"' },
        { status: 400 }
      );
    }

    const usingExplicitTemplate = Boolean(forceTemplate ?? templateName);

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
        return NextResponse.json({
          success: true,
          step: 'template',
          used: baseTpl.template,
          data: ok,
        });
      } catch (_e: unknown) {
        // 1) mismo template en en_US
        try {
          const fallback1: TemplatePayload = {
            ...baseTpl,
            template: { ...baseTpl.template, language: { code: 'en_US' } },
          };
          const ok1 = await sendToMeta<MetaMessageResponse>(
            fallback1,
            'FALLBACK MISMA PLANTILLA (en_US)'
          );
          return NextResponse.json({
            success: true,
            step: 'template_fallback_en_US',
            used: fallback1.template,
            data: ok1,
          });
        } catch (_e2: unknown) {
          // 2) hello_world en en_US
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
          return NextResponse.json({
            success: true,
            step: 'hello_world_fallback',
            used: fallback2.template,
            data: ok2,
          });
        }
      }
    }

    // ---------- B) Texto (con/sin ensureSession) ----------
    let templateOpened: MetaMessageResponse | null = null;

    if (ensureSession) {
      // intenta con plantilla indicada; si falla, usa hello_world/en_US
      try {
        const open1: TemplatePayload = {
          messaging_product: 'whatsapp',
          to,
          type: 'template',
          template: {
            name: sessionTemplate,
            language: { code: sessionLanguage },
          },
        };
        templateOpened = await sendToMeta<MetaMessageResponse>(
          open1,
          'APERTURA DE VENTANA (plantilla inicial)'
        );
      } catch (_e: unknown) {
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
        step: ensureSession ? 'session_template_only' : 'no_content',
        templateOpened,
      });
    }

    const payloadText: TextPayload = {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text },
    };
    const textResp = await sendToMeta<MetaMessageResponse>(
      payloadText,
      'ENVÍO DE TEXTO'
    );

    return NextResponse.json({
      success: true,
      step: ensureSession ? 'template_then_text' : 'text_only',
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
