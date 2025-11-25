import { NextResponse } from 'next/server';

import { env } from '~/env';

interface ReqBody {
  assistantId?: string;
  prompt: string;
  messageHistory?: { role?: string; text?: string }[];
  systemPrompt?: string;
}

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ReqBody;
    const { assistantId, prompt, messageHistory, systemPrompt } = body;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });
    }

    const assistant =
      assistantId ??
      env.OPENAI_ASSISTANT_ID ??
      process.env.OPENAI_ASSISTANT_ID ??
      '';

    if (!assistant) {
      console.error('No assistant ID provided');
      return NextResponse.json(
        { error: 'No assistant ID configured' },
        { status: 400 }
      );
    }

    // Build message content, incluyendo system prompt en la primera línea si existe
    let fullPrompt = prompt;
    if (systemPrompt && typeof systemPrompt === 'string') {
      fullPrompt = `${systemPrompt}\n\n${prompt}`;
    }

    // Construir el historial de mensajes para la API de OpenAI
    const messages: { role: 'user' | 'assistant'; content: string }[] = [];

    // Agregar historial anterior
    if (Array.isArray(messageHistory) && messageHistory.length) {
      for (const m of messageHistory) {
        if (m && typeof m.text === 'string') {
          const role =
            m.role === 'assistant' || m.role === 'bot' ? 'assistant' : 'user';
          messages.push({ role, content: m.text });
        }
      }
    }

    // Agregar el prompt actual
    messages.push({ role: 'user', content: fullPrompt });

    // Normalizar assistant id: quitar llaves/<> o extraer id si se pasó una URL completa
    let normalizedAssistant = String(assistant).trim();
    // quitar llaves o signos angulares
    normalizedAssistant = normalizedAssistant.replace(/[{}<>\s]/g, '');
    // si vino una URL, extraer el último segmento
    try {
      if (normalizedAssistant.includes('/')) {
        const parts = normalizedAssistant.split('/').filter(Boolean);
        normalizedAssistant = parts[parts.length - 1];
      }
    } catch {
      // noop
    }

    const url = `https://api.openai.com/v1/assistants/${normalizedAssistant}/responses`;

    // La API de Assistants espera un objeto `input` con role + content[]
    const inputContent = messages.flatMap((m) => [
      { type: 'text', text: String(m.content) },
    ]);
    const requestPayload = {
      input: {
        role: 'user',
        content: inputContent,
      },
      temperature: 0.7,
    };

    console.log('Calling OpenAI Assistant API with:', {
      url,
      assistantId: normalizedAssistant,
      messageCount: messages.length,
      hasSystemPrompt: !!systemPrompt,
      samplePayload: inputContent.slice(0, 2),
    });

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Prefer an assistant-specific key if provided, otherwise fallback to the main key
        Authorization: `Bearer ${env.OPENAI_ASSISTANT_API_KEY ?? env.OPENAI_API_KEY ?? process.env.OPENAI_API_KEY}`,
        'OpenAI-Beta': 'assistants=v2',
      },
      body: JSON.stringify(requestPayload),
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      console.error('OpenAI API error:', res.status, txt);
      // Fallback: si es 404 o contiene "Invalid URL", usar /v1/responses con gpt-4o-mini
      if (res.status === 404 || (txt && txt.includes('Invalid URL'))) {
        // Construir prompt para responses API
        const fallbackPrompt = systemPrompt
          ? `${systemPrompt}\n\n${prompt}`
          : prompt;
        const fallbackUrl = 'https://api.openai.com/v1/responses';
        const fallbackPayload = {
          model: 'gpt-4o-mini',
          input: fallbackPrompt,
          temperature: 0.7,
        };
        const fallbackRes = await fetch(fallbackUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${env.OPENAI_ASSISTANT_API_KEY ?? env.OPENAI_API_KEY ?? process.env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify(fallbackPayload),
        });
        if (!fallbackRes.ok) {
          const fallbackTxt = await fallbackRes.text().catch(() => '');
          console.error(
            'OpenAI fallback /v1/responses error:',
            fallbackRes.status,
            fallbackTxt
          );
          return NextResponse.json(
            {
              error: 'OpenAI fallback error',
              detail: fallbackTxt,
              status: fallbackRes.status,
            },
            { status: 502 }
          );
        }
        const fallbackData: unknown = await fallbackRes.json();
        // Extraer texto del assistant
        let assistantText = '';
        if (isRecord(fallbackData)) {
          const d = fallbackData as Record<string, unknown>;
          // gpt-4o responses API: output[0].content[0].text
          if (Array.isArray(d.output)) {
            const first = d.output[0] as Record<string, unknown> | undefined;
            if (first && Array.isArray(first.content)) {
              const texts = (first.content as unknown[])
                .map((item) => {
                  if (
                    isRecord(item) &&
                    typeof (item as Record<string, unknown>).text === 'string'
                  )
                    return (item as Record<string, unknown>).text as string;
                  return '';
                })
                .filter(Boolean)
                .join('\n');
              if (texts) assistantText = texts;
            }
          }
          // gpt-3.5/4: output_text
          if (!assistantText && typeof d.output_text === 'string') {
            assistantText = d.output_text;
          }
        }
        if (!assistantText) {
          console.warn(
            'Could not extract assistant text from fallback response:',
            fallbackData
          );
        }
        return NextResponse.json({
          response: assistantText || 'No response from assistant (fallback)',
        });
      }
      return NextResponse.json(
        { error: 'OpenAI error', detail: txt, status: res.status },
        { status: 502 }
      );
    }

    const data: unknown = await res.json();

    console.log(
      'OpenAI response structure:',
      Object.keys(isRecord(data) ? (data as Record<string, unknown>) : {})
    );

    // Extract assistant text robustly without using `any`
    let assistantText = '';
    if (isRecord(data)) {
      const d = data as Record<string, unknown>;

      if (Array.isArray(d.output)) {
        const first = d.output[0] as Record<string, unknown> | undefined;
        if (first && Array.isArray(first.content)) {
          const texts = (first.content as unknown[])
            .map((item) => {
              if (
                isRecord(item) &&
                typeof (item as Record<string, unknown>).text === 'string'
              )
                return (item as Record<string, unknown>).text as string;
              return '';
            })
            .filter(Boolean)
            .join('\n');
          if (texts) assistantText = texts;
        }
      }

      if (!assistantText && typeof d.output_text === 'string') {
        assistantText = d.output_text;
      }

      if (!assistantText && Array.isArray(d?.choices)) {
        const firstChoice = (d.choices?.[0] ?? undefined) as
          | Record<string, unknown>
          | undefined;
        if (firstChoice) {
          const message = (firstChoice.message ?? undefined) as
            | Record<string, unknown>
            | undefined;
          const content = message?.content as unknown[] | undefined;
          if (Array.isArray(content)) {
            const texts = content
              .map((item) => {
                if (
                  isRecord(item) &&
                  typeof (item as Record<string, unknown>).text === 'string'
                )
                  return (item as Record<string, unknown>).text as string;
                return '';
              })
              .filter(Boolean)
              .join('\n');
            if (texts) assistantText = texts;
          }
        }
      }
    }

    if (!assistantText) {
      console.warn('Could not extract assistant text from response:', data);
    }

    return NextResponse.json({
      response: assistantText || 'No response from assistant',
    });
  } catch (err) {
    console.error('Error in /api/openai-assistant', err);
    return NextResponse.json(
      { error: 'Internal error', detail: String(err) },
      { status: 500 }
    );
  }
}
