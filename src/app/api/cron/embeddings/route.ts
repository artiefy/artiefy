/**
 * GET /api/cron/embeddings
 *
 * Reindexa automáticamente los cursos y proyectos guiados cuyo contenido
 * cambió después de la última vez que se generaron sus embeddings.
 *
 * POR QUÉ ASÍ Y NO EN CADA POST/PUT:
 *
 * 1. Latencia. Reindexar un curso son decenas de llamadas a OpenAI. Hacerlo
 *    dentro del PUT haría que guardar un título tardara medio minuto.
 * 2. Amplificación. Editar diez lecciones seguidas dispararía diez
 *    reindexaciones completas del mismo curso. Acá se agrupan en una sola.
 * 3. Cobertura. Comparar fechas detecta cualquier forma de editar el
 *    contenido —incluidas rutas que se agreguen en el futuro, o cambios
 *    hechos directo en la base— sin tener que enganchar nada.
 *
 * El resultado práctico es el mismo que pedía el requerimiento: después de un
 * POST o PUT, los embeddings se regeneran solos.
 */

import { type NextRequest } from 'next/server';

import { env } from '~/env';
import { getCourseContentForEmbeddings } from '~/lib/embeddings/course-processor';
import { getGuidedProjectContentForEmbeddings } from '~/lib/embeddings/guided-project-processor';
import { processDocument } from '~/lib/embeddings/processor';
import { saveDocumentEmbeddings } from '~/lib/embeddings/search';
import {
  findStaleCourses,
  findStaleProjects,
} from '~/lib/embeddings/stale-detector';

export const maxDuration = 300;

/**
 * Cuántos se reindexan por corrida. Cada reindexación son varias llamadas a
 * OpenAI, y la función tiene un techo de 300 s: mejor poco y seguido que
 * quedarse a mitad de camino por timeout.
 */
const MAX_POR_CORRIDA = 3;

/** Techo de tamaño, igual que en las rutas manuales. */
const MAX_TOKENS = 100_000;

interface Resultado {
  type: 'course' | 'project';
  id: number;
  title: string;
  chunks?: number;
  skipped?: string;
  error?: string;
}

async function reindexarCurso(id: number, title: string): Promise<Resultado> {
  const data = await getCourseContentForEmbeddings(id);

  if (data.totalTokens === 0) {
    return { type: 'course', id, title, skipped: 'sin contenido' };
  }
  if (data.totalTokens > MAX_TOKENS) {
    return { type: 'course', id, title, skipped: `${data.totalTokens} tokens` };
  }

  const documents = await processDocument(
    data.courseContent,
    `Curso-${data.courseTitle}`,
    1000,
    200
  );
  await saveDocumentEmbeddings({ type: 'course', id }, documents);

  return { type: 'course', id, title, chunks: documents.length };
}

async function reindexarProyecto(
  id: number,
  title: string
): Promise<Resultado> {
  const data = await getGuidedProjectContentForEmbeddings(id);

  if (data.totalTokens === 0) {
    return { type: 'project', id, title, skipped: 'sin contenido' };
  }
  if (data.totalTokens > MAX_TOKENS) {
    return {
      type: 'project',
      id,
      title,
      skipped: `${data.totalTokens} tokens`,
    };
  }

  const documents = await processDocument(
    data.projectContent,
    `Proyecto-${data.projectTitle}`,
    1000,
    200
  );
  await saveDocumentEmbeddings({ type: 'project', id }, documents);

  return { type: 'project', id, title, chunks: documents.length };
}

export async function GET(request: NextRequest) {
  const cronSecret = env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');

  if (!cronSecret) {
    return Response.json(
      { error: 'CRON_SECRET not configured' },
      { status: 500 }
    );
  }
  if (authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: 'Invalid authorization' }, { status: 401 });
  }

  try {
    // Los proyectos van primero por ser muchos menos: así no quedan siempre
    // atrás de la cola de cursos.
    const proyectos = await findStaleProjects(MAX_POR_CORRIDA);
    const restante = MAX_POR_CORRIDA - proyectos.length;
    const cursos = restante > 0 ? await findStaleCourses(restante) : [];

    const resultados: Resultado[] = [];

    for (const p of proyectos) {
      try {
        resultados.push(await reindexarProyecto(p.id, p.title));
      } catch (error) {
        resultados.push({
          type: 'project',
          id: p.id,
          title: p.title,
          error: error instanceof Error ? error.message : 'Error desconocido',
        });
      }
    }

    for (const c of cursos) {
      try {
        resultados.push(await reindexarCurso(c.id, c.title));
      } catch (error) {
        resultados.push({
          type: 'course',
          id: c.id,
          title: c.title,
          error: error instanceof Error ? error.message : 'Error desconocido',
        });
      }
    }

    console.log('[EMBEDDINGS] Cron:', resultados);

    return Response.json({
      success: true,
      procesados: resultados.length,
      resultados,
    });
  } catch (error) {
    console.error('[EMBEDDINGS] Error en el cron:', error);
    return Response.json(
      {
        error: 'Error reindexando embeddings',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}
