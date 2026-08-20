import { NextResponse } from 'next/server';

import {
  isTranscriptionServiceConfigured,
  startTranscription,
} from '~/lib/transcriptions/whisper-vps';
import { updateLesson } from '~/models/educatorsModels/lessonsModels';

export async function POST(req: Request) {
  try {
    const { key, lessonId } = (await req.json()) as {
      key: string;
      lessonId: number;
    };

    if (!key || !lessonId) {
      console.log(
        '[VIDEO_REGISTER] ❌ Faltan datos. key o lessonId no presentes:',
        { key, lessonId }
      );
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }

    console.log('[VIDEO_REGISTER] ✅ Datos recibidos correctamente:', {
      key,
      lessonId,
    });

    // Registrar el video en la lección
    await updateLesson(lessonId, { coverVideoKey: key });
    console.log('[VIDEO_REGISTER] ✅ Lección actualizada con video');

    // Encolar la transcripción en el servicio propio del VPS. El servicio
    // descarga el video por su cuenta, así que aquí no hace falta verificar
    // accesibilidad ni esperar: responde al instante y procesa en segundo
    // plano. El cron `/api/cron/transcriptions` guarda el resultado.
    let transcriptionQueued = false;

    if (isTranscriptionServiceConfigured()) {
      try {
        const job = await startTranscription('lesson', lessonId, key);
        transcriptionQueued = Boolean(job);
        console.log(
          '[VIDEO_REGISTER] 🎙️ Transcripción encolada:',
          job?.jobId ?? 'ya existía un job en curso'
        );
      } catch (error) {
        // Que falle la transcripción no debe invalidar el registro del video.
        console.error(
          '[VIDEO_REGISTER] ⚠️ No se pudo encolar la transcripción:',
          error instanceof Error ? error.message : error
        );
      }
    } else {
      console.log(
        '[VIDEO_REGISTER] ℹ️ Servicio de transcripción no configurado, se omite'
      );
    }

    return NextResponse.json({
      message: 'Video registrado correctamente',
      key,
      transcriptionQueued,
    });
  } catch (error) {
    console.error(
      '[VIDEO_REGISTER] ❌ Error general en el registro del video:',
      error
    );
    return NextResponse.json(
      { error: 'Error al registrar el video' },
      { status: 500 }
    );
  }
}
