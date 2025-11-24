// src/app/api/super-admin/teams/video-sync-all/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    const { userId } = await req.json();

    if (!userId) {
        return NextResponse.json({ error: 'userId requerido' }, { status: 400 });
    }

    // Iniciar sincronización en background
    void syncAllVideos(userId);

    return NextResponse.json({
        message: 'Sincronización iniciada en background',
        status: 'processing'
    });
}

async function syncAllVideos(userId: string) {
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

            const data = await res.json();

            if (!data.videos || data.videos.length === 0) {
                hasMore = false;
                console.log('✅ Sincronización completa');
            } else {
                console.log(`✅ Procesados ${data.videos.length} videos`);
                offset += BATCH_SIZE;

                // Esperar 2 segundos entre batches para no saturar
                await new Promise(r => setTimeout(r, 2000));
            }
        } catch (err) {
            console.error(`❌ Error en batch ${offset}:`, err);
            hasMore = false;
        }
    }
}

export async function GET() {
    return NextResponse.json({
        message: 'Usa POST para iniciar sincronización'
    });
}