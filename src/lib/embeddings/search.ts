/**
 * Funciones de base de datos para embeddings
 * Maneja búsqueda vectorial, almacenamiento y recuperación
 */

import { eq, sql } from 'drizzle-orm';

import { db } from '~/server/db';
import { documentEmbeddings } from '~/server/db/schema/embeddings';

import { DocumentWithEmbedding } from './processor';

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
  courseId: string;
}

/**
 * Guarda documentos con embeddings en la base de datos
 *
 * @param courseId - ID del curso
 * @param documents - Documentos procesados con embeddings
 * @returns Número de documentos guardados
 */
export async function saveDocumentEmbeddings(
  courseId: string,
  documents: DocumentWithEmbedding[]
): Promise<number> {
  if (documents.length === 0) {
    return 0;
  }

  try {
    // Preparar datos para inserción
    const valuesToInsert = documents.map((doc) => ({
      courseId,
      content: doc.content,
      // Convertir array a string en formato PostgreSQL para vector
      embedding: JSON.stringify(doc.embedding),
      metadata: JSON.stringify(doc.metadata),
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
        INSERT INTO document_embeddings (course_id, content, embedding, metadata, source, chunk_index)
        VALUES ${sql.join(
          batch.map(
            (doc) => sql`
              (
                ${doc.courseId},
                ${doc.content},
                ${doc.embedding}::vector,
                ${doc.metadata},
                ${doc.source},
                ${doc.chunkIndex}
              )
            `
          ),
          sql`, `
        )}
        ON CONFLICT (course_id, content, chunk_index) 
        DO UPDATE SET 
          embedding = EXCLUDED.embedding,
          metadata = EXCLUDED.metadata,
          updated_at = NOW()
      `);

      inserted += batch.length;
      console.log(
        `✅ Insertados ${inserted}/${valuesToInsert.length} documentos`
      );
    }

    return inserted;
  } catch (error) {
    console.error('Error guardando embeddings:', error);
    throw error;
  }
}

/**
 * Busca documentos similares usando búsqueda vectorial
 *
 * @param courseId - ID del curso
 * @param queryEmbedding - Vector de embedding de la query
 * @param topK - Número de resultados (default: 5)
 * @param threshold - Similitud mínima (default: 0.5)
 * @returns Array de resultados ordenados por similitud
 */
export async function searchDocumentEmbeddings(
  courseId: number,
  queryEmbedding: number[],
  topK: number = 5,
  threshold: number = 0.5
): Promise<DatabaseSearchResult[]> {
  try {
    // Convertir courseId a string para comparación en BD
    const courseIdStr = String(courseId);

    // Ejecutar query raw con Drizzle
    const results = (await db.execute(
      sql`SELECT 
        id,
        content,
        metadata,
        source,
        chunk_index as "chunkIndex",
        course_id as "courseId",
        1 - (embedding <-> ${'[' + queryEmbedding.join(',') + ']'}::vector) as similarity
      FROM document_embeddings
      WHERE course_id = ${courseIdStr}
      ORDER BY embedding <-> ${'[' + queryEmbedding.join(',') + ']'}::vector
      LIMIT ${topK}`
    )) as {
      rows: Array<{
        id: number;
        content: string;
        metadata: string;
        source: string;
        chunkIndex: number;
        courseId: string;
        similarity: number;
      }>;
    };

    // Convertir resultados a nuestra interfaz
    return results.rows.map((row) => ({
      id: row.id,
      content: row.content,
      similarity: Number(row.similarity),
      metadata:
        typeof row.metadata === 'string'
          ? JSON.parse(row.metadata)
          : row.metadata,
      source: row.source,
      chunkIndex: row.chunkIndex,
      courseId: row.courseId,
    }));
  } catch (error) {
    console.error('Error buscando embeddings:', error);
    throw error;
  }
}

/**
 * Obtiene todos los embeddings de un curso
 *
 * @param courseId - ID del curso
 * @returns Array de documentos
 */
export async function getCourseDocuments(courseId: string) {
  try {
    const results = await db
      .select()
      .from(documentEmbeddings)
      .where(eq(documentEmbeddings.courseId, courseId));

    return results.map((row) => ({
      ...row,
      metadata:
        typeof row.metadata === 'string'
          ? JSON.parse(row.metadata)
          : row.metadata,
    }));
  } catch (error) {
    console.error('Error obteniendo documentos del curso:', error);
    throw error;
  }
}

/**
 * Elimina todos los embeddings de un curso
 * (útil para regenerar)
 *
 * @param courseId - ID del curso
 * @returns Número de documentos eliminados
 */
export async function deleteCourseEmbeddings(
  courseId: string
): Promise<number> {
  try {
    const result = await db
      .delete(documentEmbeddings)
      .where(eq(documentEmbeddings.courseId, courseId));

    console.log(`✅ Eliminados embeddings del curso ${courseId}`);
    return result.rowCount || 0;
  } catch (error) {
    console.error('Error eliminando embeddings:', error);
    throw error;
  }
}

/**
 * Obtiene estadísticas de embeddings
 */
export async function getEmbeddingsStats(courseId: string) {
  try {
    const result = await db.execute(sql`
      SELECT 
        COUNT(*) as total_chunks,
        COUNT(DISTINCT source) as total_sources,
        MIN(created_at) as first_created,
        MAX(updated_at) as last_updated
      FROM document_embeddings
      WHERE course_id = ${courseId}
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

/**
 * Limpia embeddings antiguos (más de X días)
 *
 * @param daysOld - Eliminar documentos más antiguos que esto (default: 30)
 * @returns Número de documentos eliminados
 */
export async function cleanOldEmbeddings(
  daysOld: number = 30
): Promise<number> {
  try {
    const result = await db.execute(sql`
      DELETE FROM document_embeddings
      WHERE created_at < NOW() - INTERVAL '${sql.raw(daysOld.toString())} days'
    `);

    console.log(`✅ Eliminados ${result.rowCount} embeddings antiguos`);
    return result.rowCount || 0;
  } catch (error) {
    console.error('Error limpiando embeddings antiguos:', error);
    throw error;
  }
}
