/**
 * Procesador de cursos completos con todos sus archivos asociados
 * Obtiene información de:
 * - Curso (título, descripción, imagen)
 * - Lecciones (título, descripción, video, recursos)
 * - Actividades (nombre, descripción)
 * - Archivos en S3 asociados
 */

import { eq } from 'drizzle-orm';

import { readTranscriptions } from '~/lib/transcriptions/read-many';
import { db } from '~/server/db';
import { activities, courses, lessons } from '~/server/db/schema';

import { downloadMultipleFilesFromS3 } from './s3-downloader';
import { estimateTokens, extractTextFromFile } from './utils';

export interface CourseContentData {
  courseId: number;
  courseTitle: string;
  courseDescription: string;
  courseCoverImage?: string;
  courseContent: string; // Texto acumulado de todo el curso
  sources: {
    type: 'course' | 'lesson' | 'activity' | 'file';
    name: string;
    key?: string;
  }[];
  totalTokens: number;
}

/**
 * Obtiene toda la información de un curso y sus archivos
 *
 * @param courseId - ID del curso
 * @returns CourseContentData con todo el contenido procesado
 */
export async function getCourseContentForEmbeddings(
  courseId: number
): Promise<CourseContentData> {
  console.log(`📚 Procesando curso ${courseId}...`);

  // 1. Obtener información del curso
  const courseData = await db.query.courses.findFirst({
    where: eq(courses.id, courseId),
  });

  if (!courseData) {
    throw new Error(`Curso ${courseId} no encontrado`);
  }

  console.log(`ℹ️ Curso: ${courseData.title}`);

  // Acumular contenido
  const contentParts: string[] = [];
  const sources: CourseContentData['sources'] = [];

  // 2. Agregar meta del curso
  contentParts.push(`=== CURSO: ${courseData.title} ===`);
  if (courseData.description) {
    contentParts.push(`Descripción: ${courseData.description}`);
  }
  sources.push({
    type: 'course',
    name: courseData.title,
  });

  console.log(`📖 Obteniendo lecciones...`);

  // 3. Obtener lecciones del curso
  const lessonsData = await db.query.lessons.findMany({
    where: eq(lessons.courseId, courseId),
  });

  console.log(`📄 Encontradas ${lessonsData.length} lecciones`);

  // Archivos a descargar (de todas las lecciones)
  const s3KeysToDownload = new Set<string>();

  for (const lesson of lessonsData) {
    contentParts.push(`\n--- LECCIÓN: ${lesson.title} ---`);

    if (lesson.description) {
      contentParts.push(`Descripción: ${lesson.description}`);
    }

    contentParts.push(`Duración: ${lesson.duration} minutos`);

    sources.push({
      type: 'lesson',
      name: lesson.title,
    });

    // Agregar claves de archivos a descargar
    if (lesson.resourceKey) {
      lesson.resourceKey.split(',').forEach((key) => {
        const trimmedKey = key.trim();
        if (trimmedKey) s3KeysToDownload.add(trimmedKey);
      });
    }

    if (lesson.coverVideoKey) {
      // Los videos generalmente no se pueden extraer texto
      console.log(`⏭️ Video (no procesable): ${lesson.coverVideoKey}`);
    }
  }

  // 4. Obtener actividades del curso (a través de lecciones)
  console.log(`🎯 Obteniendo actividades...`);

  const activitiesData = await db
    .select()
    .from(activities)
    .innerJoin(lessons, eq(activities.lessonsId, lessons.id))
    .where(eq(lessons.courseId, courseId));

  console.log(`✏️ Encontradas ${activitiesData.length} actividades`);

  for (const { activities: activity, lessons: lesson } of activitiesData) {
    contentParts.push(`\n>>> ACTIVIDAD: ${activity.name}`);
    contentParts.push(`Lección: ${lesson.title}`);

    if (activity.description) {
      contentParts.push(`Descripción: ${activity.description}`);
    }

    sources.push({
      type: 'activity',
      name: `${activity.name} (en ${lesson.title})`,
    });
  }

  // 5. Descargar y procesar archivos de S3
  console.log(`⬇️ Descargando ${s3KeysToDownload.size} archivos de S3...`);

  const downloadedFiles = await downloadMultipleFilesFromS3(
    Array.from(s3KeysToDownload)
  );

  for (const [key, buffer] of downloadedFiles.entries()) {
    if (!buffer) {
      console.warn(`⚠️ No se pudo descargar: ${key}`);
      continue;
    }

    try {
      const fileName = key.split('/').pop() || key;
      console.log(`📖 Extrayendo texto de: ${fileName}`);

      const extractedText = await extractTextFromFile(buffer, fileName);

      if (extractedText && extractedText.length > 0) {
        contentParts.push(
          `\n[Archivo: ${fileName}]\n${extractedText.substring(0, 1000)}...`
        );

        sources.push({
          type: 'file',
          name: fileName,
          key: key,
        });

        console.log(`✅ Texto extraído de ${fileName}`);
      }
    } catch (error) {
      console.error(`❌ Error extrayendo texto de ${key}:`, error);
    }
  }

  // 6. Transcripciones de los videos del curso.
  //
  // Lo que el instructor explica hablando suele ser el contenido más rico del
  // curso, y hasta ahora quedaba fuera del índice: se transcribía pero la IA
  // no podía usarlo para responder.
  try {
    const { classMeetings } = await import('~/server/db/schema');
    const meetings = await db
      .select({ id: classMeetings.id, title: classMeetings.title })
      .from(classMeetings)
      .where(eq(classMeetings.courseId, courseId));

    const transcripciones = await readTranscriptions([
      ...lessonsData.map((l) => ({ type: 'lesson' as const, contentId: l.id })),
      ...meetings.map((m) => ({ type: 'meeting' as const, contentId: m.id })),
    ]);

    if (transcripciones.length > 0) {
      const tituloPorId = new Map<string, string>([
        ...lessonsData.map((l) => [`lesson-${l.id}`, l.title] as const),
        ...meetings.map((m) => [`meeting-${m.id}`, m.title] as const),
      ]);

      contentParts.push('');
      contentParts.push('=== TRANSCRIPCIONES DE LOS VIDEOS ===');
      for (const t of transcripciones) {
        const titulo =
          tituloPorId.get(`${t.type}-${t.contentId}`) ??
          `${t.type} ${t.contentId}`;
        contentParts.push(`--- ${titulo} ---`);
        contentParts.push(t.text);
        sources.push({ type: 'file', name: `Transcripción: ${titulo}` });
      }
      console.log(`🎙️ ${transcripciones.length} transcripciones incorporadas`);
    }
  } catch (error) {
    // Sin transcripciones el curso se indexa igual; no vale la pena abortar.
    console.error('⚠️ No se pudieron leer las transcripciones:', error);
  }

  // 7. Combinar todo el contenido
  const fullContent = contentParts.join('\n');

  return {
    courseId,
    courseTitle: courseData.title,
    courseDescription: courseData.description || '',
    courseCoverImage: courseData.coverImageKey || undefined,
    courseContent: fullContent,
    sources,
    totalTokens: estimateTokens(fullContent),
  };
}
