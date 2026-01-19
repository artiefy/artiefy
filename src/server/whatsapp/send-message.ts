import { db } from '~/server/db';
import { waMessages } from '~/server/db/schema';
import {
  getSession,
  type WhatsAppSession,
} from '~/app/api/super-admin/whatsapp/_config';
import {
  isIn24hWindow,
  pushInbox,
} from '~/app/api/super-admin/whatsapp/_inbox';

interface SendWhatsAppParams {
  to: string;
  text?: string;
  forceTemplate?: boolean;
  templateName?: string | null;
  languageCode?: string;
  variables?: string[];
  autoSession?: boolean;
  session?: string;
}

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

interface TemplateParameter {
  type: 'text';
  text: string;
}

interface TemplatePayload {
  messaging_product: 'whatsapp';
  to: string;
  type: 'template';
  template: {
    name: string;
    language: { code: string };
    components?: Array<{
      type: 'body' | 'BODY';
      parameters: TemplateParameter[];
    }>;
  };
}

interface TextPayload {
  messaging_product: 'whatsapp';
  to: string;
  type: 'text';
  text: { body: string };
  context?: { message_id: string };
}

type WhatsAppPayload = TemplatePayload | TextPayload;

function toCurl(url: string, payload: unknown, accessToken: string): string {
  return [
    `curl -i -X POST \\`,
    `  '${url}' \\`,
    `  -H 'Authorization: Bearer ${accessToken}' \\`,
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
  note: string,
  sessionConfig: WhatsAppSession
): Promise<T> {
  const url = `https://graph.facebook.com/v22.0/${sessionConfig.phoneNumberId}/messages`;
  const headers = {
    Authorization: `Bearer ${sessionConfig.accessToken}`,
    'Content-Type': 'application/json',
  } as const;

  console.log(
    `\n================ [WA][POST][${sessionConfig.displayName}] ${note} ================`
  );
  console.log('📤 Payload:\n', JSON.stringify(payload, null, 2));
  console.log(
    '📟 cURL equivalente:\n' +
      toCurl(url, payload, sessionConfig.accessToken) +
      '\n'
  );

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  }).catch((error) => {
    console.error('[WA] Fetch error:', error);
    throw error;
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

/**
 * Envía un mensaje WhatsApp a través de Meta API
 * Usado por CRON y por endpoints de API
 */
export async function sendWhatsAppMessage(
  params: SendWhatsAppParams
): Promise<MetaMessageResponse> {
  const {
    to,
    text,
    forceTemplate,
    templateName,
    languageCode,
    variables = [],
    autoSession = true,
    session,
  } = params;

  // Obtener configuración de la sesión
  const sessionConfig = getSession(session);
  console.log(`[WA] Usando sesión: ${sessionConfig.displayName}`);

  if (!to) {
    throw new Error('Falta el parámetro "to"');
  }

  const needEnsure =
    typeof autoSession === 'boolean'
      ? autoSession
        ? !(await isIn24hWindow(to, sessionConfig.name))
        : false
      : false;

  const usingExplicitTemplate = Boolean(forceTemplate ?? templateName);
  console.log('[WA] needEnsure para', to, ':', needEnsure);

  // Si es una plantilla explícita
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
        `ENVÍO DE PLANTILLA (${baseTpl.template.name}/${baseTpl.template.language.code})`,
        sessionConfig
      );

      pushInbox({
        id: ok.messages?.[0]?.id,
        direction: 'outbound',
        timestamp: Date.now(),
        to,
        type: 'template',
        text: `[TPL] ${baseTpl.template.name}/${baseTpl.template.language.code}${variables.length ? ' | ' + variables.join(' | ') : ''}`,
        raw: ok,
        session: sessionConfig.name,
      });

      return ok;
    } catch {
      try {
        const fallback1: TemplatePayload = {
          ...baseTpl,
          template: { ...baseTpl.template, language: { code: 'en_US' } },
        };
        const ok1 = await sendToMeta<MetaMessageResponse>(
          fallback1,
          'FALLBACK MISMA PLANTILLA (en_US)',
          sessionConfig
        );

        pushInbox({
          id: ok1.messages?.[0]?.id,
          direction: 'outbound',
          timestamp: Date.now(),
          to,
          type: 'template',
          text: `[TPL] ${fallback1.template.name}/${fallback1.template.language.code}${variables.length ? ' | ' + variables.join(' | ') : ''}`,
          raw: ok1,
          session: sessionConfig.name,
        });

        return ok1;
      } catch {
        const fallback2: TemplatePayload = {
          messaging_product: 'whatsapp',
          to,
          type: 'template',
          template: { name: 'hello_world', language: { code: 'en_US' } },
        };
        const ok2 = await sendToMeta<MetaMessageResponse>(
          fallback2,
          'FALLBACK hello_world (en_US)',
          sessionConfig
        );

        pushInbox({
          id: ok2.messages?.[0]?.id,
          direction: 'outbound',
          timestamp: Date.now(),
          to,
          type: 'template',
          text: `[TPL] hello_world/en_US`,
          raw: ok2,
          session: sessionConfig.name,
        });

        return ok2;
      }
    }
  }

  // Si es texto (con gestión de ventana de 24h)
  let templateOpened: MetaMessageResponse | null = null;

  if (needEnsure) {
    try {
      const open1: TemplatePayload = {
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
          name: 'bienvenida',
          language: { code: 'es_ES' },
        },
      };
      templateOpened = await sendToMeta<MetaMessageResponse>(
        open1,
        'APERTURA DE VENTANA (bienvenida)',
        sessionConfig
      );
    } catch {
      try {
        const open2: TemplatePayload = {
          messaging_product: 'whatsapp',
          to,
          type: 'template',
          template: {
            name: 'hello_world',
            language: { code: 'en_US' },
          },
        };
        templateOpened = await sendToMeta<MetaMessageResponse>(
          open2,
          'APERTURA DE VENTANA (fallback hello_world)',
          sessionConfig
        );
      } catch {
        console.log(
          '[WA] No se pudo abrir ventana, se intentará enviar texto directo'
        );
      }
    }
  }

  // Enviar el texto
  const textPayload: TextPayload = {
    messaging_product: 'whatsapp',
    to,
    type: 'text',
    text: { body: text ?? '' },
    ...(templateOpened
      ? { context: { message_id: templateOpened.messages?.[0]?.id ?? '' } }
      : {}),
  };

  const textResponse = await sendToMeta<MetaMessageResponse>(
    textPayload,
    `ENVÍO DE TEXTO${templateOpened ? ' (Con contexto de plantilla)' : ''}`,
    sessionConfig
  );

  pushInbox({
    id: textResponse.messages?.[0]?.id,
    direction: 'outbound',
    timestamp: Date.now(),
    to,
    type: 'text',
    text: text ?? '',
    raw: textResponse,
    session: sessionConfig.name,
  });

  return textResponse;
}
