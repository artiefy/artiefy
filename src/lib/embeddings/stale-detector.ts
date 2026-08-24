/**
 * Detecta qué cursos y proyectos guiados tienen embeddings desactualizados.
 *
 * En vez de enganchar cada POST/PUT del árbol (que son más de diez rutas y
 * cualquiera nueva quedaría fuera), se compara la fecha de la última edición
 * de CUALQUIER pieza del árbol contra la fecha de la última indexación. Si el
 * contenido es más nuevo que sus embeddings, hay que reindexar.
 *
 * Ventaja: cubre automáticamente cualquier forma de editar el contenido, hoy
 * y en el futuro, incluso cambios hechos directo en la base de datos.
 */

import { sql } from 'drizzle-orm';

import { db } from '~/server/db';

export interface StaleItem {
  type: 'course' | 'project';
  id: number;
  title: string;
  /** Última edición detectada en el árbol. */
  contentUpdatedAt: Date;
  /** Cuándo se indexó por última vez (null si nunca). */
  indexedAt: Date | null;
}

/**
 * Cursos cuyo contenido (curso, lecciones o actividades) cambió después de la
 * última vez que se generaron sus embeddings.
 *
 * Solo considera cursos que YA fueron indexados alguna vez: indexar de oficio
 * todo el catálogo sería una decisión de negocio, no de mantenimiento.
 */
export async function findStaleCourses(limit = 20): Promise<StaleItem[]> {
  const result = await db.execute(sql`
    WITH contenido AS (
      SELECT
        c.id,
        c.title,
        GREATEST(
          c.updated_at,
          COALESCE(MAX(l.last_updated), c.updated_at),
          COALESCE(MAX(a.last_updated), c.updated_at)
        ) AS content_updated_at
      FROM courses c
      LEFT JOIN lessons l ON l.course_id = c.id
      LEFT JOIN activities a ON a.lessons_id = l.id
      GROUP BY c.id, c.title
    ),
    indexado AS (
      SELECT course_id, MAX(updated_at) AS indexed_at
      FROM document_embeddings
      WHERE course_id IS NOT NULL
      GROUP BY course_id
    )
    SELECT ct.id, ct.title, ct.content_updated_at, ix.indexed_at
    FROM contenido ct
    JOIN indexado ix ON ix.course_id = ct.id
    WHERE ct.content_updated_at > ix.indexed_at
    ORDER BY ct.content_updated_at DESC
    LIMIT ${limit}
  `);

  return (result.rows as Record<string, unknown>[]).map((row) => ({
    type: 'course' as const,
    id: Number(row.id),
    title: String(row.title),
    contentUpdatedAt: new Date(String(row.content_updated_at)),
    indexedAt: row.indexed_at ? new Date(String(row.indexed_at)) : null,
  }));
}

/**
 * Proyectos guiados cuyo contenido (proyecto, objetivos o actividades) cambió
 * después de la última indexación.
 */
export async function findStaleProjects(limit = 20): Promise<StaleItem[]> {
  const result = await db.execute(sql`
    WITH contenido AS (
      SELECT
        p.id,
        p.title,
        GREATEST(
          p.updated_at,
          COALESCE(MAX(o.updated_at), p.updated_at),
          COALESCE(MAX(ga.last_updated), p.updated_at)
        ) AS content_updated_at
      FROM guided_projects p
      LEFT JOIN guided_objectives o ON o.guided_project_id = p.id
      LEFT JOIN guided_objective_activities ga ON ga.objective_id = o.id
      GROUP BY p.id, p.title
    ),
    indexado AS (
      SELECT project_id, MAX(updated_at) AS indexed_at
      FROM document_embeddings
      WHERE project_id IS NOT NULL
      GROUP BY project_id
    )
    SELECT ct.id, ct.title, ct.content_updated_at, ix.indexed_at
    FROM contenido ct
    JOIN indexado ix ON ix.project_id = ct.id
    WHERE ct.content_updated_at > ix.indexed_at
    ORDER BY ct.content_updated_at DESC
    LIMIT ${limit}
  `);

  return (result.rows as Record<string, unknown>[]).map((row) => ({
    type: 'project' as const,
    id: Number(row.id),
    title: String(row.title),
    contentUpdatedAt: new Date(String(row.content_updated_at)),
    indexedAt: row.indexed_at ? new Date(String(row.indexed_at)) : null,
  }));
}
