/**
 * Procesador de embeddings usando OpenAI API
 * Genera embeddings vectoriales para documentos y realiza búsquedas semánticas
 */

import { OpenAI } from 'openai';

import { env } from '~/env';

import { chunkText, estimateTokens, normalizeText } from './utils';

/**
 * Inicializa cliente de OpenAI
 */
function getOpenAIClient(): OpenAI {
  return new OpenAI({
    apiKey: env.OPENAI_API_KEY,
  });
}

/**
 * Interfaz para un documento con embeddings
 */
export interface DocumentWithEmbedding {
  content: string;
  embedding: number[];
  chunkIndex: number;
  metadata: {
    source: string;
    totalChunks: number;
    chunkSize: number;
    overlap: number;
  };
}

/**
 * Genera un embedding para un texto usando OpenAI
 *
 * @param text - Texto a embedifcar
 * @returns Vector de 1536 dimensiones
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const client = getOpenAIClient();

  try {
    // Usar text-embedding-3-small (más barato y rápido)
    const response = await client.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
      encoding_format: 'float',
      dimensions: 1536, // Dimensiones reducidas para ahorrar espacio
    });

    if (!response.data || response.data.length === 0) {
      throw new Error('No embedding data received from OpenAI');
    }

    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generando embedding:', error);
    throw error;
  }
}

/**
 * Procesa un documento dividiéndolo en chunks y generando embeddings
 *
 * @param text - Texto del documento
 * @param fileName - Nombre del archivo (para metadata)
 * @param chunkSize - Tamaño de cada chunk en tokens (default: 1000)
 * @param overlap - Overlap entre chunks en tokens (default: 200)
 * @returns Array de documentos con embeddings
 */
export async function processDocument(
  text: string,
  fileName: string,
  chunkSize: number = 1000,
  overlap: number = 200,
  onProgress?: (progress: { current: number; total: number }) => void
): Promise<DocumentWithEmbedding[]> {
  // Normalizar y dividir en chunks
  const normalizedText = normalizeText(text);
  const chunks = chunkText(normalizedText, chunkSize, overlap, fileName);

  const documentsWithEmbeddings: DocumentWithEmbedding[] = [];
  const total = chunks.length;

  console.log(`Procesando ${total} chunks del documento: ${fileName}`);

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];

    try {
      // Generar embedding para este chunk
      const embedding = await generateEmbedding(chunk.content);

      documentsWithEmbeddings.push({
        content: chunk.content,
        embedding,
        chunkIndex: chunk.chunkIndex,
        metadata: chunk.metadata,
      });

      // Llamar callback de progreso
      onProgress?.({ current: i + 1, total });

      // Rate limiting: OpenAI recomienda ~3 req/seg para embeddings
      // Esperar un poco entre requests
      if (i < chunks.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error(`Error procesando chunk ${i}:`, error);
      throw error;
    }
  }

  console.log(
    `✅ Documento procesado: ${documentsWithEmbeddings.length} chunks`
  );
  return documentsWithEmbeddings;
}

/**
 * Genera embedding para una query de búsqueda
 *
 * @param query - Texto a buscar
 * @returns Vector de embedding
 */
export async function generateQueryEmbedding(query: string): Promise<number[]> {
  const normalizedQuery = normalizeText(query);
  return generateEmbedding(normalizedQuery);
}

/**
 * Calcula similitud coseno entre dos vectores
 *
 * @param a - Primer vector
 * @param b - Segundo vector
 * @returns Similitud entre 0 y 1
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Los vectores deben tener la misma dimensión');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;

  return dotProduct / denominator;
}

/**
 * Interfaz para resultado de búsqueda
 */
export interface SearchResult {
  content: string;
  similarity: number;
  chunkIndex: number;
  metadata: {
    source: string;
    totalChunks: number;
    chunkSize: number;
    overlap: number;
  };
  source: string;
}

/**
 * Realiza búsqueda local de documentos similares (para cliente o testing)
 * NOTA: En producción, usar búsqueda en BD con pg_trgm o pgvector
 *
 * @param queryEmbedding - Embedding de la query
 * @param documents - Documentos indexados
 * @param topK - Número de resultados a retornar (default: 5)
 * @param threshold - Similitud mínima (default: 0.5)
 * @returns Array de resultados ordenados por similitud
 */
export function searchDocuments(
  queryEmbedding: number[],
  documents: DocumentWithEmbedding[],
  topK: number = 5,
  threshold: number = 0.5
): SearchResult[] {
  const results = documents
    .map((doc) => ({
      content: doc.content,
      similarity: cosineSimilarity(queryEmbedding, doc.embedding),
      chunkIndex: doc.chunkIndex,
      metadata: doc.metadata,
      source: doc.metadata.source,
    }))
    .filter((result) => result.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);

  return results;
}

/**
 * Obtiene estadísticas de un lote de documentos
 */
export function getDocumentStats(documents: DocumentWithEmbedding[]) {
  const totalTokens = documents.reduce(
    (sum, doc) => sum + estimateTokens(doc.content),
    0
  );
  const totalChunks = documents.length;
  const avgChunkTokens = totalTokens / totalChunks;
  const costPerMillion = 0.02; // text-embedding-3-small
  const estimatedCost = (totalTokens / 1_000_000) * costPerMillion;

  return {
    totalChunks,
    totalTokens,
    avgChunkTokens: Math.round(avgChunkTokens),
    estimatedCost: estimatedCost.toFixed(4),
    costInCents: Math.round(estimatedCost * 100),
  };
}
