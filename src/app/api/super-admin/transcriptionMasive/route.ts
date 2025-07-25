import { NextResponse } from 'next/server';

import { Redis } from '@upstash/redis';
import axios, { isAxiosError } from 'axios';

import { db } from '~/server/db';
import { lessons } from '~/server/db/schema';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});


export async function POST() {
  try {
    const allLessons = await db
      .select({
        id: lessons.id,
        coverVideoKey: lessons.coverVideoKey,
      })
      .from(lessons);

    const AWS_BASE_URL = 'https://s3.us-east-2.amazonaws.com/artiefy-upload/';

    for (const lesson of allLessons) {
      const { id: lessonId, coverVideoKey } = lesson;

      if (!coverVideoKey) {
        console.log(`[TRANSCRIPCIÓN] ❌ Lección ${lessonId} no tiene coverVideoKey.`);
        continue;
      }

      const videoUrl = `${AWS_BASE_URL}${coverVideoKey}`;
      console.log(`[TRANSCRIPCIÓN] 📹 Procesando video: ${videoUrl}`);

      // Verificar que el video sea accesible
      try {
        const check = await fetch(videoUrl, { method: 'HEAD' });

        if (!check.ok) {
          console.error(
            `[TRANSCRIPCIÓN] ❌ Video no accesible para lección ${lessonId}. Status:`,
            check.status
          );
          continue;
        }
      } catch (error) {
        console.error(`[TRANSCRIPCIÓN] ❌ Error al verificar el video:`, error);
        continue;
      }

      // Procesar transcripción
      try {
        const redisKey = `transcription:lesson:${lessonId}`;
        const alreadyTranscribed = await redis.get(redisKey);
        if (alreadyTranscribed) {
        console.log(`[TRANSCRIPCIÓN] 🟡 Ya existe transcripción para lección ${lessonId}`);
        continue;
        }
        const response = await axios.post(
          'http://3.148.245.81:8000/video2text',
          { url: videoUrl },
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 20 * 60 * 1000, // 20 minutos
          }
        );

        if (!Array.isArray(response.data)) {
          console.error(
            `[TRANSCRIPCIÓN] ❌ Formato inválido para lección ${lessonId}:`,
            response.data
          );
          continue;
        }

        await redis.set(redisKey, response.data);
        console.log(`[TRANSCRIPCIÓN] ✅ Guardada transcripción para lección ${lessonId}`);
      } catch (err) {
        if (isAxiosError(err)) {
          console.error(`Axios Error (lección ${lessonId}):`, err.message);
          console.error('Response data:', err.response?.data);
        } else {
          console.error(`Error genérico (lección ${lessonId}):`, err);
        }
      }
    }

    return NextResponse.json({
      message: 'Proceso de transcripción iniciado para todas las lecciones con video',
    });
  } catch (err) {
    console.error('[TRANSCRIPCIÓN] ❌ Error general:', err);
    return NextResponse.json(
      { error: 'Error general al procesar las transcripciones' },
      { status: 500 }
    );
  }
}
