import { type NextRequest, NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';

import { env } from '~/env';

/**
 * Server-side proxy for the n8n project text generator.
 *
 * The browser used to call the n8n webhook directly with a NEXT_PUBLIC_ URL and
 * no credentials, which left an unauthenticated endpoint burning OpenAI credit
 * for anyone who opened the site. Requests now go through here so a Clerk
 * session is required and the webhook URL never reaches the client.
 *
 * The n8n response is relayed verbatim, status included, so the existing
 * `useGenerateContent` parsing keeps working unchanged.
 */

/**
 * Read at request time, never at module scope, so a value added to the
 * environment after the build is picked up without freezing as `undefined`.
 *
 * The NEXT_PUBLIC_ URLs are the ones already configured in every environment;
 * they stay as a fallback so this proxy needs no new configuration to work.
 * Setting N8N_PROJECTS_WEBHOOK_URL takes over and lets the public ones be
 * retired once the webhook is locked down in n8n.
 */
function readWebhookCandidates(): string[] {
  const dedicated = env.N8N_PROJECTS_WEBHOOK_URL;
  const local = env.NEXT_PUBLIC_N8N_WEBHOOK_PROJECTS_LOCAL;
  const prod = env.NEXT_PUBLIC_N8N_WEBHOOK_PROJECTS_PROD;
  const legacy = env.NEXT_PUBLIC_N8N_WEBHOOK_URL;

  // Same ordering the browser used: the environment's own webhook first, with
  // the other one kept as a fallback.
  const ordered =
    process.env.NODE_ENV === 'development' ? [local, prod] : [prod, local];

  return [dedicated, ...ordered, legacy].filter(
    (url): url is string => typeof url === 'string' && url.length > 0
  );
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const candidates = readWebhookCandidates();

  if (candidates.length === 0) {
    console.error('[projects generate] No hay webhook de n8n configurado');
    return NextResponse.json(
      { error: 'El generador de contenido no está configurado' },
      { status: 503 }
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const authHeader = env.N8N_PROJECTS_AUTH_HEADER;
  const authValue = env.N8N_PROJECTS_AUTH_VALUE;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  // Only sent once the n8n webhook is switched to header auth; until then the
  // webhook accepts the request without it.
  if (authHeader && authValue) {
    headers[authHeader] = authValue;
  }

  let lastStatus = 502;

  for (const url of candidates) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(60_000),
      });

      if (!response.ok) {
        lastStatus = response.status;
        console.warn(
          `[projects generate] ${url} respondió ${response.status}, probando el siguiente`
        );
        continue;
      }

      // Relayed as-is: the client parses n8n's own { success, body } shape.
      const body = (await response.json()) as unknown;
      return NextResponse.json(body);
    } catch (error) {
      console.warn(`[projects generate] Error llamando ${url}:`, error);
    }
  }

  return NextResponse.json(
    { error: 'No pudimos generar el contenido en este momento' },
    { status: lastStatus }
  );
}
