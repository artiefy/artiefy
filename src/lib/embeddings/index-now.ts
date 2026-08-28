/**
 * Indexación inmediata al crear o modificar contenido.
 *
 * Se dispara con `after()` de Next: el trabajo corre DESPUÉS de que la
 * respuesta ya salió, así que el usuario no espera los segundos que tardan
 * las llamadas a OpenAI. Reindexar un curso grande puede tomar bastante y no
 * tiene por qué demorar un simple guardado.
 *
 * El cron (`/api/cron/embeddings`) sigue existiendo como red de seguridad,
 * para lo que se edite por vías que no pasen por estas rutas.
 *
 * Regla de oro: esto NUNCA debe hacer fallar la operación original. Si algo
 * sale mal se registra y listo — el cron lo tomará después.
 */

import { after } from 'next/server';

import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { activities, lessons } from '~/server/db/schema';

import { getCourseContentForEmbeddings } from './course-processor';
import { getGuidedProjectContentForEmbeddings } from './guided-project-processor';
import { processDocument } from './processor';
import { saveDocumentEmbeddings } from './search';

/** Techo de tamaño, igual que en las rutas manuales y el cron. */
const MAX_TOKENS = 100_000;

export async function indexCourseNow(courseId: number): Promise<void> {
  try {
    const data = await getCourseContentForEmbeddings(courseId);

    if (data.totalTokens === 0 || data.totalTokens > MAX_TOKENS) {
      console.log(
        `[EMBEDDINGS] Curso ${courseId} omitido (${data.totalTokens} tokens)`
      );
      return;
    }

    const documents = await processDocument(
      data.courseContent,
      `Curso-${data.courseTitle}`,
      1000,
      200
    );
    await saveDocumentEmbeddings({ type: 'course', id: courseId }, documents, {
      replaceAll: true,
    });

    console.log(
      `[EMBEDDINGS] Curso ${courseId} indexado al crearse (${documents.length} fragmentos)`
    );
  } catch (error) {
    console.error(
      `[EMBEDDINGS] No se pudo indexar el curso ${courseId} al crearlo — lo tomará el cron:`,
      error instanceof Error ? error.message : error
    );
  }
}

export async function indexProjectNow(projectId: number): Promise<void> {
  try {
    const data = await getGuidedProjectContentForEmbeddings(projectId);

    if (data.totalTokens === 0 || data.totalTokens > MAX_TOKENS) {
      console.log(
        `[EMBEDDINGS] Proyecto ${projectId} omitido (${data.totalTokens} tokens)`
      );
      return;
    }

    const documents = await processDocument(
      data.projectContent,
      `Proyecto-${data.projectTitle}`,
      1000,
      200
    );
    await saveDocumentEmbeddings(
      { type: 'project', id: projectId },
      documents,
      {
        replaceAll: true,
      }
    );

    console.log(
      `[EMBEDDINGS] Proyecto ${projectId} indexado al crearse (${documents.length} fragmentos)`
    );
  } catch (error) {
    console.error(
      `[EMBEDDINGS] No se pudo indexar el proyecto ${projectId} al crearlo — lo tomará el cron:`,
      error instanceof Error ? error.message : error
    );
  }
}

/**
 * Dispara la reindexación sin bloquear la respuesta.
 *
 * Se usa desde las rutas de creación y edición: `after()` ejecuta la tarea
 * una vez enviada la respuesta, de modo que guardar sigue siendo instantáneo
 * para quien está usando la plataforma.
 */
export function scheduleCourseIndex(courseId: number): void {
  if (!Number.isFinite(courseId) || courseId <= 0) return;
  after(() => indexCourseNow(courseId));
}

export function scheduleProjectIndex(projectId: number): void {
  if (!Number.isFinite(projectId) || projectId <= 0) return;
  after(() => indexProjectNow(projectId));
}

/**
 * Reindexa el curso al que pertenece una clase.
 *
 * Las rutas de clases suelen manejar solo el `lessonId` (al editar, borrar o
 * reordenar), asi que hay que resolver el curso antes de encolar. La consulta
 * corre dentro de `after()`, no en el camino de la respuesta.
 */
export function scheduleIndexForLesson(lessonId: number): void {
  if (!Number.isFinite(lessonId) || lessonId <= 0) return;

  after(async () => {
    try {
      const fila = await db.query.lessons.findFirst({
        where: eq(lessons.id, lessonId),
        columns: { courseId: true },
      });
      if (fila?.courseId) await indexCourseNow(Number(fila.courseId));
    } catch (error) {
      console.error(
        `[EMBEDDINGS] No se pudo resolver el curso de la clase ${lessonId}:`,
        error instanceof Error ? error.message : error
      );
    }
  });
}

/**
 * Reindexa el curso al que pertenece una actividad.
 *
 * Una actividad cuelga de una clase, y la clase de un curso, asi que hay que
 * dar dos saltos para llegar al dueno del embedding.
 */
export function scheduleIndexForActivity(activityId: number): void {
  if (!Number.isFinite(activityId) || activityId <= 0) return;

  after(async () => {
    try {
      const fila = await db
        .select({ courseId: lessons.courseId })
        .from(activities)
        .innerJoin(lessons, eq(activities.lessonsId, lessons.id))
        .where(eq(activities.id, activityId))
        .limit(1);

      const courseId = fila[0]?.courseId;
      if (courseId) await indexCourseNow(Number(courseId));
    } catch (error) {
      console.error(
        `[EMBEDDINGS] No se pudo resolver el curso de la actividad ${activityId}:`,
        error instanceof Error ? error.message : error
      );
    }
  });
}

/**
 * Devuelve el curso al que pertenece una clase, o null.
 *
 * A diferencia de los `schedule*`, esto corre en el camino de la respuesta:
 * hace falta cuando hay que averiguar el curso ANTES de borrar la clase,
 * porque despues ya no se puede consultar.
 */
export async function getCourseIdOfLesson(
  lessonId: number
): Promise<number | null> {
  if (!Number.isFinite(lessonId) || lessonId <= 0) return null;

  try {
    const fila = await db.query.lessons.findFirst({
      where: eq(lessons.id, lessonId),
      columns: { courseId: true },
    });
    return fila?.courseId ? Number(fila.courseId) : null;
  } catch {
    return null;
  }
}
