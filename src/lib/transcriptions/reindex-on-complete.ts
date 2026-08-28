/**
 * Puente entre transcripciones y embeddings.
 *
 * El indexado incorpora las transcripciones leyendolas de Redis, pero corre
 * al guardar el contenido — momento en el que el video todavia no esta
 * transcrito (Whisper tarda minutos). Sin este puente, lo hablado en los
 * videos no entraba nunca al embedding.
 *
 * Vive en su propio archivo a proposito: `whisper-vps` no puede importar
 * `index-now` porque el indexado ya depende de las transcripciones, y seria
 * un ciclo de imports.
 */

import { eq } from 'drizzle-orm';

import { indexCourseNow, indexProjectNow } from '~/lib/embeddings/index-now';
import { db } from '~/server/db';
import {
  classMeetings,
  guidedObjectiveActivities,
  guidedObjectives,
  lessons,
} from '~/server/db/schema';

import { type ContentType } from './whisper-vps';

/**
 * Reindexa el curso o proyecto dueno del video recien transcrito.
 *
 * Nunca lanza: una transcripcion correcta no debe fallar porque el reindexado
 * tropiece. Si algo sale mal, lo recoge el cron de embeddings.
 */
export async function reindexAfterTranscription(
  type: ContentType,
  contentId: number
): Promise<void> {
  try {
    switch (type) {
      // --- contenidos de un curso ---
      case 'lesson': {
        const fila = await db.query.lessons.findFirst({
          where: eq(lessons.id, contentId),
          columns: { courseId: true },
        });
        if (fila?.courseId) await indexCourseNow(Number(fila.courseId));
        return;
      }

      case 'meeting': {
        const fila = await db
          .select({ courseId: classMeetings.courseId })
          .from(classMeetings)
          .where(eq(classMeetings.id, contentId))
          .limit(1);
        const courseId = fila[0]?.courseId;
        if (courseId) await indexCourseNow(Number(courseId));
        return;
      }

      // --- contenidos de un proyecto guiado ---
      case 'project':
        await indexProjectNow(contentId);
        return;

      case 'objective': {
        const fila = await db
          .select({ projectId: guidedObjectives.guidedProjectId })
          .from(guidedObjectives)
          .where(eq(guidedObjectives.id, contentId))
          .limit(1);
        const projectId = fila[0]?.projectId;
        if (projectId) await indexProjectNow(Number(projectId));
        return;
      }

      case 'activity': {
        const fila = await db
          .select({ projectId: guidedObjectives.guidedProjectId })
          .from(guidedObjectiveActivities)
          .innerJoin(
            guidedObjectives,
            eq(guidedObjectiveActivities.objectiveId, guidedObjectives.id)
          )
          .where(eq(guidedObjectiveActivities.id, contentId))
          .limit(1);
        const projectId = fila[0]?.projectId;
        if (projectId) await indexProjectNow(Number(projectId));
        return;
      }
    }
  } catch (error) {
    console.error(
      `[EMBEDDINGS] No se pudo reindexar tras transcribir ${type} ${contentId}:`,
      error instanceof Error ? error.message : error
    );
  }
}
