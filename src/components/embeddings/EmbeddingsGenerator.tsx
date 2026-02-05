'use client';

/**
 * Componente para generar embeddings de un curso
 * Permite al usuario procesar el contenido del curso y generar embeddings vectoriales
 */

import { useState } from 'react';

import { toast } from 'sonner';

import { Button } from '~/components/estudiantes/ui/button';

interface EmbeddingsGeneratorProps {
  courseId: string | number;
  courseTitle: string;
  courseDescription?: string;
}

interface GenerationStats {
  totalChunks: number;
  totalTokens: number;
  avgChunkTokens: number;
  estimatedCost: string;
  costInCents: number;
  courseId: string;
  fileName: string;
}

export function EmbeddingsGenerator({
  courseId,
  courseTitle,
  courseDescription = '',
}: EmbeddingsGeneratorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [stats, setStats] = useState<GenerationStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateEmbeddings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setIsSuccess(false);

      // Validar que haya contenido
      const content = (courseTitle + '\n' + courseDescription).trim();
      if (!content) {
        setError('El curso no tiene título o descripción para procesar');
        toast.error('Sin contenido para procesar');
        setIsLoading(false);
        return;
      }

      console.log('🚀 Iniciando generación de embeddings...');
      console.log(`📚 Curso: ${courseTitle}`);
      console.log(`🎯 ID: ${courseId}`);

      // Llamar API para generar embeddings
      const response = await fetch('/api/embeddings/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId: String(courseId),
          fileName: courseTitle || `course-${courseId}`,
          content: content,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.details || errorData.error || 'Error desconocido'
        );
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Error generando embeddings');
      }

      // Mostrar estadísticas
      setStats(data.stats);
      setIsSuccess(true);

      console.log('✅ Embeddings generados exitosamente');
      console.log('📊 Estadísticas:', data.stats);

      toast.success('✨ Embeddings generados exitosamente', {
        description: `${data.stats.totalChunks} chunks procesados por $${data.stats.estimatedCost}`,
      });
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : 'Error desconocido';
      setError(errorMsg);
      console.error('❌ Error:', errorMsg);
      toast.error('Error generando embeddings', {
        description: errorMsg,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Botón principal */}
      <Button
        onClick={handleGenerateEmbeddings}
        disabled={isLoading}
        className="w-full gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
      >
        {isLoading ? (
          <>
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Generando embeddings...
          </>
        ) : isSuccess ? (
          <>
            <span>✅ Regenerar Embeddings</span>
          </>
        ) : (
          <>
            <span>🚀 Generar Embeddings</span>
          </>
        )}
      </Button>

      {/* Estadísticas exitosas */}
      {isSuccess && stats && (
        <div className="space-y-3 rounded-lg border border-green-500/30 bg-green-500/10 p-4">
          <div className="flex items-start gap-2">
            <span className="text-2xl">✨</span>
            <div className="flex-1">
              <h3 className="font-semibold text-green-400">
                Embeddings generados exitosamente
              </h3>
              <p className="text-sm text-green-400/70">
                El contenido ha sido procesado y está listo para búsquedas
                semánticas
              </p>
            </div>
          </div>

          {/* Grid de estadísticas */}
          <div className="grid grid-cols-2 gap-3 pt-2 sm:grid-cols-4">
            <div className="rounded bg-green-500/5 p-2">
              <div className="text-xs text-green-400/70">Chunks</div>
              <div className="text-xl font-bold text-green-400">
                {stats.totalChunks}
              </div>
            </div>

            <div className="rounded bg-green-500/5 p-2">
              <div className="text-xs text-green-400/70">Tokens</div>
              <div className="text-xl font-bold text-green-400">
                {stats.totalTokens.toLocaleString('es-ES')}
              </div>
            </div>

            <div className="rounded bg-green-500/5 p-2">
              <div className="text-xs text-green-400/70">Prom. Chunk</div>
              <div className="text-xl font-bold text-green-400">
                {stats.avgChunkTokens}
              </div>
            </div>

            <div className="rounded bg-green-500/5 p-2">
              <div className="text-xs text-green-400/70">Costo</div>
              <div className="text-xl font-bold text-green-400">
                ${stats.estimatedCost}
              </div>
            </div>
          </div>

          <p className="text-xs text-green-400/60">
            ⏱️ Última actualización: {new Date().toLocaleString('es-ES')}
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="space-y-2 rounded-lg border border-red-500/30 bg-red-500/10 p-4">
          <div className="flex items-start gap-2">
            <span className="text-2xl">❌</span>
            <div className="flex-1">
              <h3 className="font-semibold text-red-400">
                Error al generar embeddings
              </h3>
              <p className="text-sm text-red-400/70">{error}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setError(null)}
            className="border-red-500/30 text-red-400 hover:bg-red-500/10"
          >
            Descartar
          </Button>
        </div>
      )}

      {/* Info sobre embeddings */}
      <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3">
        <div className="flex items-start gap-2">
          <span className="text-xl">ℹ️</span>
          <div className="text-xs text-cyan-400/70">
            <p className="font-semibold text-cyan-400">
              ¿Qué son los embeddings?
            </p>
            <p className="mt-1">
              Los embeddings convierten el contenido del curso en vectores
              matemáticos que permiten búsquedas semánticas inteligentes y
              recuperación de información relevante.
            </p>
            <p className="mt-1">
              <strong>Modelo:</strong> text-embedding-3-small (OpenAI)
            </p>
            <p>
              <strong>Dimensiones:</strong> 1536 (optimizado para balance
              velocidad/precisión)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
