import { type NextRequest, NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';

import { env } from '~/env';
import {
  consumeAgentQuota,
  refundAgentQuota,
} from '~/server/agents/agentChatQuota';
import { ratelimit } from '~/server/ratelimit/ratelimit';

/** Same anonymous-visitor cookie used by `/api/agents/chat`. */
const ANON_COOKIE = 'artiefy_agent_anon';
const ANON_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const MAX_SYSTEM_PROMPT_CHARS = 4000;
const MAX_PROMPT_CHARS = 2000;
const MAX_HISTORY_MESSAGES = 10;
const MAX_HISTORY_TEXT_CHARS = 2000;

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const first = forwarded?.split(',')[0]?.trim();
  return first ?? req.headers.get('x-real-ip') ?? 'unknown';
}

interface ReqBody {
  assistantId?: string; // kept for backward compatibility but no longer used
  prompt: string;
  messageHistory?: { role?: string; text?: string }[];
  systemPrompt?: string;
}

// Definición de la función de WhatsApp para OpenAI Chat Completions Function Calling
interface WhatsAppContactFunctionSchema {
  name: 'contact_whatsapp_advisor';
  description: string;
  parameters: {
    type: 'object';
    properties: {
      user_message: { type: 'string'; description: string };
      reason: { type: 'string'; enum: string[]; description: string };
    };
    required: string[];
  };
}

const WHATSAPP_FUNCTION: WhatsAppContactFunctionSchema = {
  name: 'contact_whatsapp_advisor',
  description:
    'Conecta al usuario con un asesor humano vía WhatsApp cuando pide hablar con alguien real, negociar precios, resolver dudas complejas, soporte técnico, inscripción o asistencia personalizada. Llama esta función solo si explícitamente busca contacto humano.',
  parameters: {
    type: 'object',
    properties: {
      user_message: {
        type: 'string',
        description:
          'Mensaje original del usuario que motiva el contacto humano',
      },
      reason: {
        type: 'string',
        enum: [
          'inscripcion',
          'precios',
          'dudas_tecnicas',
          'negociacion',
          'otros',
        ],
        description: 'Clasificación breve de la intención del usuario',
      },
    },
    required: ['user_message', 'reason'],
  },
};

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null;
}

// Clasificación simple de intención para pasar como "reason" si el modelo no lo llena
function classifyReason(msg: string): string {
  const t = msg.toLowerCase();
  if (/inscrib|registro|matricul|entrar|unirme/.test(t)) return 'inscripcion';
  if (/precio|coste|valor|cuanto|oferta|descuento/.test(t)) return 'precios';
  if (/error|bug|tecnic|soporte|problema|no funciona|ayuda técnica/.test(t))
    return 'dudas_tecnicas';
  if (/negociar|rebaja|bajar|cerrar|trato/.test(t)) return 'negociacion';
  return 'otros';
}

export async function POST(req: NextRequest) {
  let refundKey: string | null = null;
  try {
    const { userId } = await auth();

    // Anonymous visitors (the sales chat) share the agent chat's anonymous
    // allowance, tracked with the same cookie; signed-in users are only rate
    // limited here.
    const existingAnonId = req.cookies.get(ANON_COOKIE)?.value;
    const anonId = userId
      ? null
      : existingAnonId && UUID_PATTERN.test(existingAnonId)
        ? existingAnonId
        : crypto.randomUUID();

    const withAnonCookie = (response: NextResponse) => {
      if (anonId) {
        response.cookies.set(ANON_COOKIE, anonId, {
          httpOnly: true,
          sameSite: 'lax',
          secure: req.nextUrl.protocol === 'https:',
          path: '/',
          maxAge: ANON_COOKIE_MAX_AGE,
        });
      }
      return response;
    };

    const limitKey = userId
      ? `openai-assistant:user:${userId}`
      : `openai-assistant:ip:${getClientIp(req)}`;
    const { success } = await ratelimit.limit(limitKey);
    if (!success) {
      return withAnonCookie(
        NextResponse.json(
          { error: 'Demasiadas solicitudes. Intenta de nuevo en un momento.' },
          { status: 429 }
        )
      );
    }

    if (anonId) {
      const quota = await consumeAgentQuota('anon', anonId);
      if (!quota.allowed) {
        return withAnonCookie(
          NextResponse.json(
            {
              error:
                'Alcanzaste el límite de mensajes. Inicia sesión para seguir conversando.',
            },
            { status: 429 }
          )
        );
      }
      refundKey = quota.key;
    }

    const releaseQuota = async () => {
      if (refundKey) await refundAgentQuota(refundKey);
    };

    const body = (await req.json()) as ReqBody;
    const { messageHistory } = body;
    const prompt = body.prompt;
    const systemPrompt =
      typeof body.systemPrompt === 'string'
        ? body.systemPrompt.slice(0, MAX_SYSTEM_PROMPT_CHARS)
        : undefined;

    if (!prompt || typeof prompt !== 'string') {
      await releaseQuota();
      return withAnonCookie(
        NextResponse.json({ error: 'Missing prompt' }, { status: 400 })
      );
    }
    if (prompt.length > MAX_PROMPT_CHARS) {
      await releaseQuota();
      return withAnonCookie(
        NextResponse.json({ error: 'Prompt too long' }, { status: 413 })
      );
    }

    // Construir mensajes para Chat Completions
    const messages: {
      role: 'system' | 'user' | 'assistant';
      content: string;
    }[] = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }

    // Limitar historial a los últimos 10 relevantes
    const historySlice = Array.isArray(messageHistory)
      ? messageHistory.slice(-MAX_HISTORY_MESSAGES)
      : [];
    for (const m of historySlice) {
      if (!m || typeof m.text !== 'string') continue;
      const role =
        m.role === 'assistant' || m.role === 'bot' ? 'assistant' : 'user';
      messages.push({
        role,
        content: m.text.slice(0, MAX_HISTORY_TEXT_CHARS),
      });
    }

    // Mensaje actual del usuario
    messages.push({ role: 'user', content: prompt });

    const url = 'https://api.openai.com/v1/chat/completions';

    const requestPayload = {
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.7,
      tools: [
        {
          type: 'function',
          function: WHATSAPP_FUNCTION,
        },
      ],
      tool_choice: 'auto' as const,
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.OPENAI_ASSISTANT_API_KEY ?? env.OPENAI_API_KEY ?? process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify(requestPayload),
    });

    if (!res.ok) {
      // Fallback muy simple sin tools
      const fallbackUrl = 'https://api.openai.com/v1/responses';
      const fallbackPrompt = systemPrompt
        ? `${systemPrompt}\n\n${prompt}`
        : prompt;
      const fallbackPayload = {
        model: 'gpt-4o-mini',
        input: fallbackPrompt,
        temperature: 0.7,
      };
      const fb = await fetch(fallbackUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${env.OPENAI_ASSISTANT_API_KEY ?? env.OPENAI_API_KEY ?? process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify(fallbackPayload),
      });
      if (!fb.ok) {
        await releaseQuota();
        return withAnonCookie(
          NextResponse.json({ error: 'Fallback error' }, { status: 502 })
        );
      }
      const fbData = await fb.json();
      let fbText = '';
      if (isRecord(fbData) && Array.isArray(fbData.output)) {
        const first = fbData.output[0] as Record<string, unknown> | undefined;
        if (first && Array.isArray(first.content)) {
          fbText = (first.content as unknown[])
            .map((i) =>
              isRecord(i) && typeof i.text === 'string'
                ? (i.text as string)
                : ''
            )
            .filter(Boolean)
            .join('\n');
        }
      }
      if (!fbText && isRecord(fbData) && typeof fbData.output_text === 'string')
        fbText = fbData.output_text as string;
      return withAnonCookie(
        NextResponse.json({
          response: fbText || 'No response (fallback)',
        })
      );
    }

    const data: unknown = await res.json();

    // Parse tool_calls
    let functionCall: { name: string; arguments: string } | null = null;
    if (
      isRecord(data) &&
      Array.isArray((data as Record<string, unknown>).choices as unknown[])
    ) {
      const choices = (data as Record<string, unknown>).choices as unknown[];
      const firstChoice = (choices[0] ?? undefined) as
        Record<string, unknown> | undefined;
      const message = firstChoice?.message as
        Record<string, unknown> | undefined;
      const toolCalls = message?.tool_calls as unknown[] | undefined;
      if (Array.isArray(toolCalls) && toolCalls.length) {
        const tc = toolCalls.find(
          (c) =>
            isRecord(c) && (c as Record<string, unknown>).type === 'function'
        );
        if (tc && isRecord(tc)) {
          const fn = tc.function as Record<string, unknown> | undefined;
          if (
            fn &&
            typeof fn.name === 'string' &&
            typeof fn.arguments === 'string'
          ) {
            functionCall = { name: fn.name, arguments: fn.arguments };
          }
        }
      }
    }

    if (functionCall?.name === 'contact_whatsapp_advisor') {
      try {
        const args = JSON.parse(functionCall.arguments) as {
          user_message?: string;
          reason?: string;
        };
        const userMessage = args.user_message ?? prompt;
        const reason = args.reason ?? classifyReason(userMessage);
        const encodedMessage = encodeURIComponent(
          `Hola, necesito ayuda (${reason}): ${userMessage}`
        );
        return withAnonCookie(
          NextResponse.json({
            response: '¿Prefieres hablar directo con nuestro equipo?',
            whatsapp_action: {
              type: 'whatsapp_contact',
              phone: '573241149554',
              message: userMessage,
              reason,
              url: `https://wa.me/573241149554?text=${encodedMessage}`,
              button_text: 'WhatsApp 🚀',
            },
          })
        );
      } catch {
        // Malformed tool arguments: fall through to the plain text answer.
      }
    }

    // Extraer texto de assistant
    let assistantText = '';
    if (
      isRecord(data) &&
      Array.isArray((data as Record<string, unknown>).choices as unknown[])
    ) {
      const choices = (data as Record<string, unknown>).choices as unknown[];
      const firstChoice = (choices[0] ?? undefined) as
        Record<string, unknown> | undefined;
      const message = firstChoice?.message as
        Record<string, unknown> | undefined;
      if (message && typeof message.content === 'string')
        assistantText = message.content as string;
      // Algunos modelos pueden devolver array de content parts
      if (!assistantText && Array.isArray(message?.content)) {
        assistantText = (message!.content as unknown[])
          .map((p) =>
            typeof p === 'string'
              ? p
              : isRecord(p) && typeof p.text === 'string'
                ? (p.text as string)
                : ''
          )
          .filter(Boolean)
          .join('\n');
      }
    }

    return withAnonCookie(
      NextResponse.json({
        response: assistantText || 'No response from model',
      })
    );
  } catch {
    if (refundKey) await refundAgentQuota(refundKey);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
