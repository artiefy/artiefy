/**
 * Compatibilidad. Este archivo declaraba una SEGUNDA versión de
 * `document_embeddings` que no coincidía con la tabla real: `course_id` como
 * `text` sin FK, `chunk_index` como `serial` y otros nombres de índice. El
 * snapshot de drizzle-kit (`drizzle/meta/0010_snapshot.json`) confirma que la
 * definición buena es la de `~/server/db/schema`.
 *
 * Se reexporta desde ahí para que quede una sola fuente de verdad. Los imports
 * existentes siguen funcionando; los nuevos deberían apuntar directo a
 * `~/server/db/schema`.
 */

export {
  documentEmbeddings,
  documentEmbeddingsRelations,
  embeddingProcessingLog,
} from '~/server/db/schema';
