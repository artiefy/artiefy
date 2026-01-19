import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  try {
    // Validar que la llamada es segura (desde Vercel Cron o con token CRON_SECRET)
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get('authorization');
    const vercelCronHeader = request.headers.get('x-vercel-cron');

    // Validar si viene de Vercel Cron o del token local
    const isFromVercel = vercelCronHeader === 'true';
    const isAuthorized =
      isFromVercel || (cronSecret && authHeader === `Bearer ${cronSecret}`);

    if (!isAuthorized) {
      console.log('[CRON WhatsApp] Unauthorized attempt:', {
        vercelCron: vercelCronHeader,
        hasAuth: !!authHeader,
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[CRON WhatsApp] Starting...', {
      source: isFromVercel ? 'Vercel Cron' : 'Local Token',
    });

    // Llamar al endpoint de envío de mensajes programados
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const response = await fetch(
      `${baseUrl}/api/super-admin/whatsapp/send-scheduled`,
      {
        method: 'GET',
        headers: {
          authorization: `Bearer ${cronSecret || 'vercel-cron'}`,
        },
      }
    );

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[CRON WhatsApp] Error:', error);
    return NextResponse.json(
      {
        error: 'Error en CRON de WhatsApp',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
