// src/app/api/super-admin/whatsapp/media/route.ts
import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic'; // sin caché estática
const GRAPH = 'https://graph.facebook.com/v22.0';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const action = searchParams.get('action') ?? 'stream'; // stream por defecto

  if (!id) {
    return Response.json({ error: 'Media ID is required' }, { status: 400 });
  }

const token =
  process.env.WHATSAPP_ACCESS_TOKEN ||
  process.env.WHATSAPP_GRAPH_TOKEN ||
  process.env.FB_GRAPH_TOKEN;


  if (!token) {
    return Response.json({ error: 'Missing WhatsApp Graph token' }, { status: 500 });
  }

  // 1) Traer metadatos (url firmada + mime)
  const metaRes = await fetch(`${GRAPH}/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!metaRes.ok) {
    const body = await metaRes.text();
    return new Response(body || 'Error getting media info', { status: metaRes.status });
  }
  const meta = (await metaRes.json()) as { url: string; mime_type?: string };

  // Compatibilidad: devolver solo la URL (no recomendado para usar directo en <img/>)
  if (action === 'url') {
    return Response.json(meta);
  }

  // 2) Descargar el archivo desde Graph con Authorization y reenviarlo
  const fileRes = await fetch(meta.url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!fileRes.ok) {
    const body = await fileRes.text();
    return new Response(body || 'Error downloading media', { status: fileRes.status });
  }

  const contentType =
    fileRes.headers.get('content-type') || meta.mime_type || 'application/octet-stream';

  const headers: Record<string, string> = {
    'Content-Type': contentType,
    'Cache-Control': 'private, max-age=0, no-store',
  };

  // Forzar descarga si piden action=download
  if (action === 'download') {
    headers['Content-Disposition'] = `attachment; filename="whatsapp-media-${id}"`;
  }

  // Stream del cuerpo (no cargamos todo en memoria)
  return new Response(fileRes.body, { headers });
}
