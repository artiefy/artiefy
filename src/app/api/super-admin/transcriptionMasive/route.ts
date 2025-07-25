import { Redis } from '@upstash/redis';
import axios, { isAxiosError } from 'axios';

import { db } from '~/server/db';
import { lessons } from '~/server/db/schema';

import type { NextRequest, NextResponse } from 'next/server'; // ✅ IMPORT TYPED

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url); // ✅ usar URL segura
    const lessonId = searchParams.get('lessonId');

    if (!lessonId) {
      return NextResponse.json(
        { error: 'lessonId es requerido' },
        { status: 400 }
      );
    }

    const redisKey = `transcription:lesson:${lessonId}`;
    const transcription = await redis.get<string[] | string>(redisKey); // ✅ tipado correcto

    if (!transcription) {
      return NextResponse.json(
        { error: 'Transcripción no encontrada para esta lección' },
        { status: 404 }
      );
    }

    const textContent = Array.isArray(transcription)
      ? transcription.join('\n')
      : String(transcription); // ✅ evita [object Object]

    return new NextResponse(textContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': `attachment; filename="transcription-${lessonId}.txt"`,
      },
    });
  } catch (error) {
    console.error('[TRANSCRIPCIÓN] ❌ Error al obtener transcripción:', error);
    return NextResponse.json(
      { error: 'Error al obtener la transcripción' },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const allLessons = await db
      .select({
        id: lessons.id,
        coverVideoKey: lessons.coverVideoKey,
      })
      .from(lessons);

    const AWS_BASE_URL = 'https://s3.us-east-2.amazonaws.com/artiefy-upload/';

    // Obtener todas las claves de transcripciones ya existentes
    const existingKeys = await redis.keys('transcription:lesson:*');
    const alreadyProcessedIds = new Set(
      existingKeys.map((key: string) =>
        key.replace('transcription:lesson:', '')
      )
    );

    // Filtrar solo las lecciones que NO tienen transcripción
    const lessonsToProcess = allLessons.filter((lesson) => {
      return (
        lesson.coverVideoKey && !alreadyProcessedIds.has(lesson.id.toString())
      );
    });

    if (lessonsToProcess.length === 0) {
      console.log(
        '[TRANSCRIPCIÓN] ✅ No hay lecciones nuevas por transcribir.'
      );
      return NextResponse.json({
        message: 'Todas las lecciones ya tienen transcripción.',
      });
    }

    for (const lesson of lessonsToProcess) {
      const { id: lessonId, coverVideoKey } = lesson;
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

        const redisKey = `transcription:lesson:${lessonId}`;
        await redis.set(redisKey, response.data);
        console.log(
          `[TRANSCRIPCIÓN] ✅ Guardada transcripción para lección ${lessonId}`
        );
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
      message:
        'Proceso de transcripción completado para las lecciones pendientes.',
    });
  } catch (err) {
    console.error('[TRANSCRIPCIÓN] ❌ Error general:', err);
    return NextResponse.json(
      { error: 'Error general al procesar las transcripciones' },
      { status: 500 }
    );
  }
}
