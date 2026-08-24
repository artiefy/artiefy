/**
 * Convierte una transcripción cruda en un documento estructurado.
 *
 * La transcripción que devuelve Whisper es habla continua con marcas de
 * tiempo: sirve para buscar un momento del video, pero es incómoda de leer.
 * Acá se le pide a la IA que la reorganice en markdown —con títulos,
 * secciones, listas y bloques de código— para poder mostrarla como material
 * de estudio.
 *
 * GET  ?type=activity&contentId=6   -> devuelve la versión ya formateada
 * POST { type, contentId, force? }  -> la genera (y la cachea en Redis)
 */

import { NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';
import { Redis } from '@upstash/redis';
import { OpenAI } from 'openai';

import { env } from '~/env';
import {
  type ContentType,
  type TranscriptionItem,
  transcriptionKey,
} from '~/lib/transcriptions/whisper-vps';

export const maxDuration = 300;

const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
});

const VALID_TYPES: ContentType[] = [
  'lesson',
  'meeting',
  'project',
  'objective',
  'activity',
];

/** Key del documento ya formateado. La cruda vive en `transcription:*`. */
const formattedKey = (type: ContentType, id: number) =>
  `transcription:formatted:${type}:${id}`;

interface FormattedDoc {
  markdown: string;
  generatedAt: string;
  segments: number;
}

const SYSTEM_PROMPT = `Eres un editor de material educativo. Recibes la transcripción automática del audio de una clase en video y la conviertes en una guía escrita que el estudiante pueda seguir PASO A PASO mientras mira el video.

PRINCIPIO RECTOR: fidelidad. El documento debe seguir el video de principio a fin, en el mismo orden y sin perder nada de lo explicado. NO es un resumen.

QUÉ SÍ HACER:
1. Respetar el orden exacto en que se explicaron las cosas.
2. Conservar TODOS los pasos, comandos, nombres de archivos, rutas y detalles mencionados. Si el instructor dijo algo, tiene que estar.
3. Corregir errores de la transcripción automática, sobre todo términos técnicos mal escuchados (p. ej. "grid branch" es "git branch", "K" suele ser "acá", "npm" puede aparecer como "npn"). Usa el contexto para deducirlos.
4. Quitar muletillas, titubeos y repeticiones ("eh", "o sea", "entonces bueno", frases empezadas y abandonadas).
5. Puntuar correctamente y separar en párrafos legibles.
6. Poner títulos \`##\` cuando el video cambia de tema, y \`###\` para subtemas. Los títulos deben describir lo que se hace en esa parte.
7. Numerar los pasos secuenciales con listas numeradas, en el orden en que se ejecutan.
8. Poner comandos y código en bloques \`\`\` con su lenguaje (bash, tsx, ts, sql, json...). Si el instructor dictó un comando, transcríbelo exacto.
9. Marcar en **negrita** los nombres de botones, menús y opciones que hay que tocar.
10. Empezar con un título \`#\` que nombre lo que se construye o aprende.

QUÉ NO HACER:
- No resumir ni condensar. No omitas pasos por parecer obvios.
- No agregues secciones de "Resumen", "Conclusión" ni "Requisitos" si no se dijeron en el video.
- No inventes explicaciones, advertencias ni buenas prácticas que el instructor no mencionó.
- No cambies el orden para que quede "más lógico": el orden del video manda.

Responde ÚNICAMENTE con el Markdown, sin explicaciones previas ni bloque de código envolvente.`;

export async function GET(request: Request) {
  const { userId, sessionClaims } = await auth();
  const role = sessionClaims?.metadata?.role;
  if (!userId || (role !== 'admin' && role !== 'super-admin')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') as ContentType | null;
  const contentId = Number(searchParams.get('contentId'));

  if (!type || !VALID_TYPES.includes(type) || !Number.isFinite(contentId)) {
    return NextResponse.json(
      { error: 'type y contentId son requeridos' },
      { status: 400 }
    );
  }

  const doc = await redis.get<FormattedDoc>(formattedKey(type, contentId));
  const raw = await redis.get<TranscriptionItem[]>(
    transcriptionKey(type, contentId)
  );

  return NextResponse.json({
    hasTranscription: Array.isArray(raw) && raw.length > 0,
    hasFormatted: Boolean(doc),
    ...(doc ?? {}),
  });
}

export async function POST(request: Request) {
  const { userId, sessionClaims } = await auth();
  const role = sessionClaims?.metadata?.role;
  if (!userId || (role !== 'admin' && role !== 'super-admin')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    type?: ContentType;
    contentId?: number;
    force?: boolean;
  };
  const { type, contentId, force = false } = body;

  if (!type || !VALID_TYPES.includes(type) || !contentId) {
    return NextResponse.json(
      { error: 'type y contentId son requeridos' },
      { status: 400 }
    );
  }

  try {
    if (!force) {
      const existing = await redis.get<FormattedDoc>(
        formattedKey(type, contentId)
      );
      if (existing) {
        return NextResponse.json({ success: true, cached: true, ...existing });
      }
    }

    const raw = await redis.get<TranscriptionItem[]>(
      transcriptionKey(type, contentId)
    );

    if (!Array.isArray(raw) || raw.length === 0) {
      return NextResponse.json(
        { error: 'Este contenido todavía no tiene transcripción' },
        { status: 404 }
      );
    }

    // Se manda el texto corrido sin marcas de tiempo: los timestamps solo
    // distraen al modelo y gastan tokens, y el documento resultante es para
    // leer, no para navegar el video.
    const texto = raw.map((s) => s.text).join(' ');

    const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.3,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: texto },
      ],
    });

    const markdown = completion.choices[0]?.message?.content?.trim();
    if (!markdown) {
      return NextResponse.json(
        { error: 'La IA no devolvió contenido' },
        { status: 502 }
      );
    }

    const doc: FormattedDoc = {
      markdown,
      generatedAt: new Date().toISOString(),
      segments: raw.length,
    };

    await redis.set(formattedKey(type, contentId), doc);

    return NextResponse.json({ success: true, cached: false, ...doc });
  } catch (error) {
    console.error('[TRANSCRIPCIÓN] Error formateando:', error);
    return NextResponse.json(
      {
        error: 'Error generando el documento',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}
