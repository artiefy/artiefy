// src/app/api/super-admin/whatsapp/media/route.ts
import { db } from '~/server/db';
import { waMessages } from '~/server/db/schema';

import { getSession } from '../_config';

import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';
const GRAPH = 'https://graph.facebook.com/v22.0';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const action = searchParams.get('action') ?? 'stream';

  if (!id) {
    return Response.json({ error: 'Media ID is required' }, { status: 400 });
  }

  const token =
    process.env.WHATSAPP_ACCESS_TOKEN ??
    process.env.WHATSAPP_GRAPH_TOKEN ??
    process.env.FB_GRAPH_TOKEN;

  if (!token) {
    return Response.json(
      { error: 'Missing WhatsApp Graph token' },
      { status: 500 }
    );
  }

  const metaRes = await fetch(`${GRAPH}/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!metaRes.ok) {
    const body = await metaRes.text();
    return new Response(body || 'Error getting media info', {
      status: metaRes.status,
    });
  }
  const meta = (await metaRes.json()) as {
    url: string;
    mime_type?: string;
    file_name?: string;
  };

  if (action === 'url') {
    return Response.json(meta);
  }

  const fileRes = await fetch(meta.url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!fileRes.ok) {
    const body = await fileRes.text();
    return new Response(body || 'Error downloading media', {
      status: fileRes.status,
    });
  }

  const contentType =
    fileRes.headers.get('content-type') ??
    meta.mime_type ??
    'application/octet-stream';

  const getExtensionFromMimeType = (mimeType: string): string => {
    const map: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'video/mp4': 'mp4',
      'video/3gpp': '3gp',
      'audio/ogg': 'ogg',
      'audio/mpeg': 'mp3',
      'audio/mp4': 'm4a',
      'audio/amr': 'amr',
      'application/pdf': 'pdf',
      'application/vnd.ms-powerpoint': 'ppt',
      'application/msword': 'doc',
      'application/vnd.ms-excel': 'xls',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        'docx',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation':
        'pptx',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
        'xlsx',
      'text/plain': 'txt',
    };
    return map[mimeType.toLowerCase()] ?? 'bin';
  };

  const extension = getExtensionFromMimeType(contentType);
  const fileName = meta.file_name ?? `whatsapp-media-${id}.${extension}`;

  const headers: Record<string, string> = {
    'Content-Type': contentType,
    'Cache-Control': 'private, max-age=0, no-store',
  };

  if (action === 'download') {
    headers['Content-Disposition'] = `attachment; filename="${fileName}"`;
  }

  return new Response(fileRes.body, { headers });
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const to = formData.get('to') as string | null;
    const caption = formData.get('caption') as string | null;
    const sessionNameRaw = formData.get('session');
    const sessionName =
      typeof sessionNameRaw === 'string' ? sessionNameRaw : undefined;

    if (!file || !to) {
      return Response.json({ error: 'Faltan file o to' }, { status: 400 });
    }

    const sessionConfig = getSession(sessionName);
    const token = sessionConfig.accessToken;
    const phoneNumberId = sessionConfig.phoneNumberId;

    if (!token || !phoneNumberId) {
      return Response.json(
        { error: 'Configuración de sesión inválida' },
        { status: 500 }
      );
    }

    // 1. Subir el archivo a WhatsApp
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);
    uploadFormData.append('messaging_product', 'whatsapp');

    const uploadRes = await fetch(`${GRAPH}/${phoneNumberId}/media`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: uploadFormData,
    });

    if (!uploadRes.ok) {
      const errorText = await uploadRes.text();
      throw new Error(`Error subiendo archivo a WhatsApp: ${errorText}`);
    }

    const uploadData = (await uploadRes.json()) as { id: string };
    const mediaId = uploadData.id;

    // 2. Determinar tipo de mensaje
    const mimeType = file.type;
    let messageType: 'image' | 'video' | 'audio' | 'document' = 'document';
    if (mimeType.startsWith('image/')) messageType = 'image';
    else if (mimeType.startsWith('video/')) messageType = 'video';
    else if (mimeType.startsWith('audio/')) messageType = 'audio';

    // 3. Enviar mensaje con el media
    const messagePayload: Record<string, unknown> = {
      messaging_product: 'whatsapp',
      to,
      type: messageType,
      [messageType]: {
        id: mediaId,
        ...(caption && messageType !== 'audio' ? { caption } : {}),
      },
    };

    const sendRes = await fetch(`${GRAPH}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messagePayload),
    });

    if (!sendRes.ok) {
      const errorText = await sendRes.text();
      throw new Error(`Error enviando mensaje: ${errorText}`);
    }

    const sendData = (await sendRes.json()) as {
      messages?: { id: string }[];
    };
    const messageId = sendData.messages?.[0]?.id;

    // 4. Guardar en BD
    try {
      await db.insert(waMessages).values({
        metaMessageId: messageId,
        waid: to,
        direction: 'outbound',
        msgType: messageType,
        body: caption ?? `[${messageType}]`,
        mediaId,
        mediaType: mimeType,
        fileName: file.name,
        tsMs: Date.now(),
        raw: sendData as object,
        session: sessionConfig.name,
      });
    } catch (dbError) {
      console.error('[WA][DB] Error guardando media:', dbError);
    }

    return Response.json({
      success: true,
      mediaId,
      messageId,
      type: messageType,
    });
  } catch (error) {
    console.error('[WA] Error en POST media:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}
