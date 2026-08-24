import { NextResponse } from 'next/server';

import { autoTranscribe } from '~/lib/transcriptions/auto-transcribe';
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

    // Encolar la transcripción. El servicio del VPS descarga el video por su
    // cuenta, así que esto responde al instante. `force` porque si se
    // reemplazó el video, la transcripción vieja ya no corresponde.
    await autoTranscribe('lesson', lessonId, key, true);

    return NextResponse.json({
      message: 'Video registrado correctamente',
      key,
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
