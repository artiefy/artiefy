/**
 * Funciones de base de datos para embeddings
 * Maneja búsqueda vectorial, almacenamiento y recuperación
 */

import { eq, sql } from 'drizzle-orm';

import { db } from '~/server/db';
import { documentEmbeddings } from '~/server/db/schema';

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
 * Dueño de un embedding: o un curso, o un proyecto guiado. Nunca los dos.
 * La base lo garantiza con el CHECK `document_embeddings_owner_check`.
 */
export type EmbeddingOwner =
  { type: 'course'; id: number } | { type: 'project'; id: number };

/**
 * Acepta el formato viejo (solo el id del curso) para no romper a los
 * llamadores que ya existen.
 */
function normalizeOwner(
  owner: string | number | EmbeddingOwner
): EmbeddingOwner {
  if (typeof owner === 'string' || typeof owner === 'number') {
    return { type: 'course', id: Number(owner) };
  }
  return owner;
}

/**
 * Guarda documentos con embeddings en la base de datos
 *
 * @param owner - Curso (id suelto o `{type:'course'}`) o proyecto guiado
 * @param documents - Documentos procesados con embeddings
 * @returns Número de documentos guardados
 */
export interface SaveOptions {
  /**
   * true = reindexado completo: borra los fragmentos que ya tenia ese curso o
   * proyecto antes de insertar los nuevos. Es lo correcto cuando se regenera
   * todo el contenido del dueno.
   *
   * false (por defecto) = se anaden documentos sin tocar los existentes. Lo
   * usa la ruta que sube un documento suelto a un curso.
   */
  replaceAll?: boolean;
}

export async function saveDocumentEmbeddings(
  owner: string | number | EmbeddingOwner,
  documents: DocumentWithEmbedding[],
  options: SaveOptions = {}
): Promise<number> {
  if (documents.length === 0) {
    return 0;
  }

  const { type, id } = normalizeOwner(owner);
  const isCourse = type === 'course';
  const { replaceAll = false } = options;

  try {
    // Preparar datos para inserción
    const valuesToInsert = documents.map((doc) => ({
      courseId: isCourse ? id : null,
      projectId: isCourse ? null : id,
      content: doc.content,
      // Convertir array a string en formato PostgreSQL para vector
      embedding: JSON.stringify(doc.embedding),
      // El dueño va también DENTRO de metadata, no solo en sus columnas: el
      // nodo PGVector de n8n solo sabe filtrar por claves del JSON, y compara
      // como texto. Sin esto el RAG no se puede acotar a un curso o proyecto.
      metadata: JSON.stringify({
        ...doc.metadata,
        scope: type,
        ...(isCourse ? { courseId: String(id) } : { projectId: String(id) }),
      }),
      source: doc.metadata.source,
      chunkIndex: doc.chunkIndex,
    }));

    // Reindexado completo: fuera lo anterior.
    //
    // El ON CONFLICT solo pisa la fila cuando el CONTENIDO es identico, asi
    // que al cambiar el curso (editar la descripcion, agregar una clase) el
    // texto nuevo entra como fila aparte y la version vieja se queda para
    // siempre. Sin esto, cada reindexado deja una copia obsoleta y la
    // busqueda acaba recuperando contenido que ya no existe.
    if (replaceAll) {
      const borradas = await db
        .delete(documentEmbeddings)
        .where(
          isCourse
            ? eq(documentEmbeddings.courseId, id)
            : eq(documentEmbeddings.projectId, id)
        )
        .returning({ id: documentEmbeddings.id });

      if (borradas.length > 0) {
        console.log(`🧹 Eliminados ${borradas.length} fragmentos anteriores`);
      }
    }

    // Insertar en lotes para evitar queries muy grandes
    const batchSize = 50;
    let inserted = 0;

    for (let i = 0; i < valuesToInsert.length; i += batchSize) {
      const batch = valuesToInsert.slice(i, i + batchSize);

      // Usar SQL raw para insertar con casting correcto del vector
      // El ON CONFLICT tiene que apuntar al índice parcial correspondiente:
      // desde la migración 0011 los únicos son
      //   UNIQUE (course_id, content, chunk_index)  WHERE course_id IS NOT NULL
      //   UNIQUE (project_id, content, chunk_index) WHERE project_id IS NOT NULL
      // Un ON CONFLICT sin la cláusula WHERE no encuentra el índice y falla.
      const conflictTarget = isCourse
        ? sql`(course_id, content, chunk_index) WHERE course_id IS NOT NULL`
        : sql`(project_id, content, chunk_index) WHERE project_id IS NOT NULL`;

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
                ${doc.metadata},
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
  owner: number | EmbeddingOwner,
  queryEmbedding: number[],
  topK: number = 5,
  threshold: number = 0.5
): Promise<DatabaseSearchResult[]> {
  try {
    const { type, id } = normalizeOwner(owner);
    const ownerFilter =
      type === 'course' ? sql`course_id = ${id}` : sql`project_id = ${id}`;

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
      WHERE ${ownerFilter}
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
 * Obtiene todos los embeddings de un curso o de un proyecto guiado
 *
 * @param owner - Curso (id suelto) o `{type:'project', id}`
 * @returns Array de documentos
 */
export async function getCourseDocuments(
  owner: string | number | EmbeddingOwner
) {
  try {
    const { type, id } = normalizeOwner(owner);

    const results = await db
      .select()
      .from(documentEmbeddings)
      .where(
        type === 'course'
          ? eq(documentEmbeddings.courseId, id)
          : eq(documentEmbeddings.projectId, id)
      );

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
  owner: string | number | EmbeddingOwner
): Promise<number> {
  try {
    const { type, id } = normalizeOwner(owner);

    const result = await db
      .delete(documentEmbeddings)
      .where(
        type === 'course'
          ? eq(documentEmbeddings.courseId, id)
          : eq(documentEmbeddings.projectId, id)
      );

    console.log(`✅ Eliminados embeddings de ${type} ${id}`);
    return result.rowCount || 0;
  } catch (error) {
    console.error('Error eliminando embeddings:', error);
    throw error;
  }
}

/**
 * Obtiene estadísticas de embeddings
 */
export async function getEmbeddingsStats(
  owner: string | number | EmbeddingOwner
) {
  try {
    const { type, id } = normalizeOwner(owner);
    const ownerFilter =
      type === 'course' ? sql`course_id = ${id}` : sql`project_id = ${id}`;

    const result = await db.execute(sql`
      SELECT 
        COUNT(*) as total_chunks,
        COUNT(DISTINCT source) as total_sources,
        MIN(created_at) as first_created,
        MAX(updated_at) as last_updated
      FROM document_embeddings
      WHERE ${ownerFilter}
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
