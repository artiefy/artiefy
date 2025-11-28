import { NextResponse } from 'next/server';

import { env } from '~/env';

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

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ReqBody;
    const { prompt, messageHistory, systemPrompt } = body;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });
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
      ? messageHistory.slice(-10)
      : [];
    for (const m of historySlice) {
      if (!m || typeof m.text !== 'string') continue;
      const role =
        m.role === 'assistant' || m.role === 'bot' ? 'assistant' : 'user';
      messages.push({ role, content: m.text });
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

    console.log('Calling Chat Completions with:', {
      messageCount: messages.length,
      hasSystemPrompt: !!systemPrompt,
    });

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.OPENAI_ASSISTANT_API_KEY ?? env.OPENAI_API_KEY ?? process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify(requestPayload),
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      console.error('Chat Completions error:', res.status, txt);
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
        const fbTxt = await fb.text().catch(() => '');
        return NextResponse.json(
          { error: 'Fallback error', detail: fbTxt },
          { status: 502 }
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
      return NextResponse.json({
        response: fbText || 'No response (fallback)',
      });
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
        | Record<string, unknown>
        | undefined;
      const message = firstChoice?.message as
        | Record<string, unknown>
        | undefined;
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
        return NextResponse.json({
          response:
            'Te conecto con un asesor humano de Artiefy para continuar por WhatsApp. 👇',
          whatsapp_action: {
            type: 'whatsapp_contact',
            phone: '573241149554',
            message: userMessage,
            reason,
            url: `https://wa.me/573241149554?text=${encodedMessage}`,
            button_text: '💬 Chatear por WhatsApp',
          },
        });
      } catch (e) {
        console.error('Error parsing function arguments', e);
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
        | Record<string, unknown>
        | undefined;
      const message = firstChoice?.message as
        | Record<string, unknown>
        | undefined;
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

    return NextResponse.json({
      response: assistantText || 'No response from model',
    });
  } catch (err) {
    console.error('Error in /api/openai-assistant', err);
    return NextResponse.json(
      { error: 'Internal error', detail: String(err) },
      { status: 500 }
    );
  }
}
