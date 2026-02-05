import {
  index,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
  vector,
} from 'drizzle-orm/pg-core';

/**
 * Tabla para almacenar embeddings vectoriales de documentos
 * Utiliza pgvector para búsqueda semántica eficiente
 */
export const documentEmbeddings = pgTable(
  'document_embeddings',
  {
    // ID único del documento
    id: serial('id').primaryKey(),

    // ID del curso al que pertenece (para asociar embeddings a cursos)
    courseId: text('course_id').notNull(),

    // Contenido del documento/chunk
    content: text('content').notNull(),

    // Vector de embedding (1536 dimensiones para text-embedding-3-small)
    embedding: vector('embedding', { dimensions: 1536 }).notNull(),

    // Metadatos en JSON (página, sección, autor, etc.)
    metadata: text('metadata').default('{}'), // JSON como string

    // Fuente del documento (PDF, DOCX, TXT, URL, etc.)
    source: text('source').notNull(),

    // Orden del chunk dentro del documento (para reconstruir contexto)
    chunkIndex: serial('chunk_index').notNull(),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    // Índice HNSW para búsqueda vectorial rápida
    // Nota: El índice HNSW se crea en la migración SQL
    // index('embedding_hnsw_idx').on(table.embedding),

    // Índice para búsquedas por curso
    index('course_id_idx').on(table.courseId),

    // Índice único para evitar duplicados (mismo contenido en mismo curso)
    unique('unique_course_chunk').on(
      table.courseId,
      table.content,
      table.chunkIndex
    ),
  ]
);

/**
 * Tabla para registrar el procesamiento de documentos
 * Útil para tracking y logging de operaciones
 */
export const embeddingProcessingLog = pgTable('embedding_processing_log', {
  id: serial('id').primaryKey(),
  courseId: text('course_id').notNull(),
  documentName: text('document_name').notNull(),
  status: text('status', {
    enum: ['pending', 'processing', 'completed', 'failed'],
  })
    .default('pending')
    .notNull(),
  totalChunks: serial('total_chunks').notNull(),
  processedChunks: serial('processed_chunks').default(0),
  error: text('error'),
  startedAt: timestamp('started_at', { withTimezone: true }).defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});
