// src/app/api/super-admin/teams/video-sync-all/route.ts
import { NextResponse } from 'next/server';

import { invalidarCache } from '~/server/lib/cache-ttl';

interface SyncRequestBody {
  userId?: unknown;
}

interface VideoApiResponse {
  videos?: unknown[];
}

export async function POST(req: Request) {
  // Sincronizar a mano debe traer datos frescos: se tira el caché de la
  // lectura para que la siguiente consulta no devuelva lo de hace 5 minutos.
  invalidarCache('teams-video:');

  const body = (await req.json()) as SyncRequestBody;
  const userId = body.userId;

  if (!userId || typeof userId !== 'string') {
    return NextResponse.json({ error: 'userId requerido' }, { status: 400 });
  }

  // Iniciar sincronización en background
  void syncAllVideos(userId);

  return NextResponse.json({
    message: 'Sincronización iniciada en background',
    status: 'processing',
  });
}

async function syncAllVideos(userId: string): Promise<void> {
  const BATCH_SIZE = 10;
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    try {
      console.log(`📦 Procesando batch ${offset} - ${offset + BATCH_SIZE}`);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/api/super-admin/teams/video?userId=${userId}&limit=${BATCH_SIZE}&offset=${offset}`,
        { method: 'GET' }
      );

      const data = (await res.json()) as VideoApiResponse;

      if (
        !data.videos ||
        !Array.isArray(data.videos) ||
        data.videos.length === 0
      ) {
        hasMore = false;
        console.log('✅ Sincronización completa');
      } else {
        console.log(`✅ Procesados ${data.videos.length} videos`);
        offset += BATCH_SIZE;

        // Esperar 2 segundos entre batches para no saturar
        await new Promise((r) => setTimeout(r, 2000));
      }
    } catch (err) {
      console.error(`❌ Error en batch ${offset}:`, err);
      hasMore = false;
    }
  }
}

export function GET() {
  return NextResponse.json({
    message: 'Usa POST para iniciar sincronización',
  });
}
