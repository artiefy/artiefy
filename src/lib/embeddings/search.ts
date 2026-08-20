/**
 * Funciones de base de datos para embeddings
 * Maneja búsqueda vectorial, almacenamiento y recuperación
 */

import { eq, sql } from 'drizzle-orm';

import { db } from '~/server/db';
import { documentEmbeddings } from '~/server/db/schema';

import type { DocumentWithEmbedding } from './processor';

/**
 * A qué pertenece un chunk. Cada fila de `document_embeddings` cuelga de un
 * curso o de un proyecto guiado, nunca de ambos, así que el scope decide tanto
 * la columna que se llena al indexar como el filtro al buscar.
 */
export type EmbeddingScope =
  { kind: 'course'; id: number } | { kind: 'project'; id: number };

export const courseScope = (id: number | string): EmbeddingScope => ({
  kind: 'course',
  id: Number(id),
});

export const projectScope = (id: number | string): EmbeddingScope => ({
  kind: 'project',
  id: Number(id),
});

/** Columna a filtrar según el scope. */
const scopeColumn = (scope: EmbeddingScope) =>
  scope.kind === 'course' ? sql`course_id` : sql`project_id`;

/**
 * Interfaz para resultado de búsqueda en BD
 */
export interface DatabaseSearchResult {
  id: number;
  content: string;
  similarity: number;
  metadata: {
    source: string;
    totalChunks: number;
    chunkSize: number;
    overlap: number;
  };
  source: string;
  chunkIndex: number;
  courseId: number | null;
  projectId: number | null;
}

/**
 * Guarda documentos con embeddings en la base de datos
 *
 * @param scope - Curso o proyecto guiado al que pertenecen los chunks
 * @param documents - Documentos procesados con embeddings
 * @returns Número de documentos guardados
 */
export async function saveEmbeddingsForScope(
  scope: EmbeddingScope,
  documents: DocumentWithEmbedding[]
): Promise<number> {
  if (documents.length === 0) {
    return 0;
  }

  const courseId = scope.kind === 'course' ? scope.id : null;
  const projectId = scope.kind === 'project' ? scope.id : null;

  // Cada scope tiene su propio índice único, porque en Postgres los NULL son
  // distintos entre sí y el índice del otro scope no restringe estas filas.
  const conflictTarget =
    scope.kind === 'course'
      ? sql`(course_id, content, chunk_index)`
      : sql`(project_id, content, chunk_index)`;

  try {
    const valuesToInsert = documents.map((doc) => ({
      courseId,
      projectId,
      content: doc.content,
      // Convertir array a string en formato PostgreSQL para vector
      embedding: JSON.stringify(doc.embedding),
      // El scope va DENTRO de metadata además de en sus columnas: el filtro
      // del nodo PGVector de n8n solo sabe mirar dentro del JSON de metadata,
      // no las columnas sueltas. Como string, porque ese filtro compara texto.
      metadata: JSON.stringify({
        ...doc.metadata,
        scope: scope.kind,
        courseId: courseId === null ? null : String(courseId),
        projectId: projectId === null ? null : String(projectId),
      }),
      source: doc.metadata.source,
      chunkIndex: doc.chunkIndex,
    }));

    // Insertar en lotes para evitar queries muy grandes
    const batchSize = 50;
    let inserted = 0;

    for (let i = 0; i < valuesToInsert.length; i += batchSize) {
      const batch = valuesToInsert.slice(i, i + batchSize);

      // Usar SQL raw para insertar con casting correcto del vector
      await db.execute(sql`
        INSERT INTO document_embeddings (course_id, project_id, content, embedding, metadata, source, chunk_index)
        VALUES ${sql.join(
          batch.map(
            (doc) => sql`
              (
                ${doc.courseId},
                ${doc.projectId},
                ${doc.content},
                ${doc.embedding}::vector,
                ${doc.metadata}::jsonb,
                ${doc.source},
                ${doc.chunkIndex}
              )
            `
          ),
          sql`, `
        )}
        ON CONFLICT ${conflictTarget}
        DO UPDATE SET
          embedding = EXCLUDED.embedding,
          metadata = EXCLUDED.metadata,
          updated_at = NOW()
      `);

      inserted += batch.length;
    }

    return inserted;
  } catch (error) {
    console.error('Error guardando embeddings:', error);
    throw error;
  }
}

/**
 * Guarda embeddings de un curso.
 *
 * @deprecated Usar `saveEmbeddingsForScope` con `courseScope(id)`.
 */
export async function saveDocumentEmbeddings(
  courseId: string | number,
  documents: DocumentWithEmbedding[]
): Promise<number> {
  return saveEmbeddingsForScope(courseScope(courseId), documents);
}

/**
 * Busca documentos similares usando búsqueda vectorial dentro de un scope
 *
 * @param scope - Curso o proyecto guiado en el que buscar
 * @param queryEmbedding - Vector de embedding de la query
 * @param topK - Número de resultados (default: 5)
 * @param threshold - Similitud mínima, de 0 a 1 (default: 0, sin filtrar).
 *   La versión anterior recibía este parámetro y NUNCA lo aplicaba; ahora sí,
 *   así que un llamador que mande 0.5 puede recibir menos resultados que antes.
 * @returns Array de resultados ordenados por similitud
 */
export async function searchEmbeddingsInScope(
  scope: EmbeddingScope,
  queryEmbedding: number[],
  topK = 5,
  threshold = 0
): Promise<DatabaseSearchResult[]> {
  try {
    const vector = `[${queryEmbedding.join(',')}]`;

    const results = (await db.execute(
      sql`SELECT
        id,
        content,
        metadata,
        source,
        chunk_index as "chunkIndex",
        course_id as "courseId",
        project_id as "projectId",
        1 - (embedding <-> ${vector}::vector) as similarity
      FROM document_embeddings
      WHERE ${scopeColumn(scope)} = ${scope.id}
      ORDER BY embedding <-> ${vector}::vector
      LIMIT ${topK}`
    )) as {
      rows: {
        id: number;
        content: string;
        metadata: string;
        source: string;
        chunkIndex: number;
        courseId: number | null;
        projectId: number | null;
        similarity: number;
      }[];
    };

    return results.rows
      .map((row) => ({
        id: row.id,
        content: row.content,
        similarity: Number(row.similarity),
        metadata:
          typeof row.metadata === 'string'
            ? (JSON.parse(row.metadata) as DatabaseSearchResult['metadata'])
            : row.metadata,
        source: row.source,
        chunkIndex: row.chunkIndex,
        courseId: row.courseId,
        projectId: row.projectId,
      }))
      .filter((result) => result.similarity >= threshold);
  } catch (error) {
    console.error('Error buscando embeddings:', error);
    throw error;
  }
}

/**
 * Busca dentro de un curso.
 *
 * @deprecated Usar `searchEmbeddingsInScope` con `courseScope(id)`.
 */
export async function searchDocumentEmbeddings(
  courseId: number | string,
  queryEmbedding: number[],
  topK = 5,
  threshold = 0
): Promise<DatabaseSearchResult[]> {
  return searchEmbeddingsInScope(
    courseScope(courseId),
    queryEmbedding,
    topK,
    threshold
  );
}

/**
 * Obtiene todos los embeddings de un curso o proyecto
 */
export async function getScopeDocuments(scope: EmbeddingScope) {
  try {
    const column =
      scope.kind === 'course'
        ? documentEmbeddings.courseId
        : documentEmbeddings.projectId;

    const results = await db
      .select()
      .from(documentEmbeddings)
      .where(eq(column, scope.id));

    return results.map((row) => ({
      ...row,
      metadata:
        typeof row.metadata === 'string'
          ? (JSON.parse(row.metadata) as Record<string, unknown>)
          : row.metadata,
    }));
  } catch (error) {
    console.error('Error obteniendo documentos del scope:', error);
    throw error;
  }
}

/** @deprecated Usar `getScopeDocuments` con `courseScope(id)`. */
export async function getCourseDocuments(courseId: string | number) {
  return getScopeDocuments(courseScope(courseId));
}

/**
 * Elimina todos los embeddings de un curso o proyecto
 * (útil para regenerar)
 *
 * @returns Número de documentos eliminados
 */
export async function deleteScopeEmbeddings(
  scope: EmbeddingScope
): Promise<number> {
  try {
    const column =
      scope.kind === 'course'
        ? documentEmbeddings.courseId
        : documentEmbeddings.projectId;

    const result = await db
      .delete(documentEmbeddings)
      .where(eq(column, scope.id));

    console.log(`✅ Eliminados embeddings de ${scope.kind} ${scope.id}`);
    return result.rowCount ?? 0;
  } catch (error) {
    console.error('Error eliminando embeddings:', error);
    throw error;
  }
}

/** @deprecated Usar `deleteScopeEmbeddings` con `courseScope(id)`. */
export async function deleteCourseEmbeddings(
  courseId: string | number
): Promise<number> {
  return deleteScopeEmbeddings(courseScope(courseId));
}

/**
 * Obtiene estadísticas de embeddings de un curso o proyecto
 */
export async function getScopeEmbeddingsStats(scope: EmbeddingScope) {
  try {
    const result = await db.execute(sql`
      SELECT
        COUNT(*) as total_chunks,
        COUNT(DISTINCT source) as total_sources,
        MIN(created_at) as first_created,
        MAX(updated_at) as last_updated
      FROM document_embeddings
      WHERE ${scopeColumn(scope)} = ${scope.id}
    `);

    if (!result.rows || result.rows.length === 0) {
      return {
        totalChunks: 0,
        totalSources: 0,
        firstCreated: null,
        lastUpdated: null,
      };
    }

    const row = result.rows[0] as {
      total_chunks: string | number;
      total_sources: string | number;
      first_created: Date | null;
      last_updated: Date | null;
    };
    return {
      totalChunks: parseInt(String(row.total_chunks)) || 0,
      totalSources: parseInt(String(row.total_sources)) || 0,
      firstCreated: row.first_created,
      lastUpdated: row.last_updated,
    };
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    return {
      totalChunks: 0,
      totalSources: 0,
      firstCreated: null,
      lastUpdated: null,
    };
  }
}

/** @deprecated Usar `getScopeEmbeddingsStats` con `courseScope(id)`. */
export async function getEmbeddingsStats(courseId: string | number) {
  return getScopeEmbeddingsStats(courseScope(courseId));
}

/**
 * Limpia embeddings antiguos (más de X días)
 *
 * @param daysOld - Eliminar documentos más antiguos que esto (default: 30)
 * @returns Número de documentos eliminados
 */
export async function cleanOldEmbeddings(daysOld = 30): Promise<number> {
  try {
    const result = await db.execute(sql`
      DELETE FROM document_embeddings
      WHERE created_at < NOW() - INTERVAL '${sql.raw(daysOld.toString())} days'
    `);

    console.log(`✅ Eliminados ${result.rowCount} embeddings antiguos`);
    return result.rowCount ?? 0;
  } catch (error) {
    console.error('Error limpiando embeddings antiguos:', error);
    throw error;
  }
}
