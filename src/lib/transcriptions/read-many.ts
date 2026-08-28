/**
 * Lectura masiva de transcripciones desde Redis.
 *
 * Lo usa el generador de embeddings: al indexar un curso o un proyecto
 * guiado, el texto hablado de los videos vale tanto como la descripción
 * escrita —a veces más, porque ahí está la explicación real— así que se
 * incorpora al contenido que se vectoriza.
 */

import { Redis } from '@upstash/redis';

import { env } from '~/env';

import {
  type ContentType,
  type TranscriptionItem,
  transcriptionKey,
} from './whisper-vps';

const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
});

export interface TranscriptionText {
  type: ContentType;
  contentId: number;
  /** Texto corrido, sin marcas de tiempo. */
  text: string;
}

/**
 * Trae las transcripciones que existan para los contenidos indicados.
 *
 * Los que no tengan transcripción simplemente no aparecen en el resultado:
 * no es un error, es lo normal mientras el video está en cola.
 */
export async function readTranscriptions(
  items: { type: ContentType; contentId: number }[]
): Promise<TranscriptionText[]> {
  if (items.length === 0) return [];

  const resultados = await Promise.all(
    items.map(async ({ type, contentId }) => {
      try {
        const segments = await redis.get<TranscriptionItem[]>(
          transcriptionKey(type, contentId)
        );
        if (!Array.isArray(segments) || segments.length === 0) return null;

        // Sin timestamps: para la búsqueda semántica solo importa el texto.
        const text = segments
          .map((s) => s.text)
          .join(' ')
          .trim();

        return text ? { type, contentId, text } : null;
      } catch {
        // Que falle una transcripción no debe tumbar toda la indexación.
        return null;
      }
    })
  );

  return resultados.filter((r): r is TranscriptionText => r !== null);
}
