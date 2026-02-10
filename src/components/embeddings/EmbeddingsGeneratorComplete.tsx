'use client';

/**
 * EmbeddingsGeneratorComplete.tsx
 * Componente para generar embeddings completos de un curso
 * Incluye lecciones, actividades, archivos del curso y recursos
 */

import { useState } from 'react';

import { toast } from 'sonner';

import { Button } from '~/components/estudiantes/ui/button'; // Asegúrate de tener el componente de Button

interface EmbeddingsGeneratorCompleteProps {
  courseId: string | number;
  courseTitle: string;
}

interface GenerationStats {
  totalChunks: number;
  totalTokens: number;
  avgChunkTokens: number;
  estimatedCost: string;
  costInCents: number;
  courseId: string | number;
  totalFiles?: number;
  totalLessons?: number;
  totalActivities?: number;
  sources?: Array<{
    type: string;
    name: string;
  }>;
}

export function EmbeddingsGeneratorComplete({
  courseId,
  courseTitle,
}: EmbeddingsGeneratorCompleteProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [stats, setStats] = useState<GenerationStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateEmbeddings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setIsSuccess(false);

      console.log(`🚀 Iniciando generación de embeddings...`);
      console.log(`📚 Curso: ${courseTitle} (ID: ${courseId})`);

      const response = await fetch('/api/embeddings/generate-from-course', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId: Number(courseId),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.details || errorData.error || 'Error desconocido'
        );
      }

      const data = (await response.json()) as {
        success: boolean;
        message: string;
        stats: GenerationStats;
      };

      if (!data.success) {
        throw new Error(data.message || 'Error generando embeddings');
      }

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
            Generando embeddings del curso completo...
          </>
        ) : isSuccess ? (
          <>
            <span>✅ Regenerar Embeddings</span>
          </>
        ) : (
          <>
            <span>🚀 Generar Embeddings del Curso Completo</span>
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
                Embeddings del curso generados exitosamente
              </h3>
              <p className="text-sm text-green-400/70">
                Se procesó el curso completo incluyendo lecciones, actividades y
                archivos
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

          {/* Detalles del procesamiento */}
          {stats.sources && stats.sources.length > 0 && (
            <div className="mt-4 rounded bg-green-500/5 p-3">
              <h4 className="mb-2 text-sm font-semibold text-green-400">
                📊 Contenido procesado:
              </h4>
              <ul className="space-y-1 text-xs text-green-400/80">
                {stats.totalLessons && (
                  <li>📚 Lecciones: {stats.totalLessons}</li>
                )}
                {stats.totalActivities && (
                  <li>✏️ Actividades: {stats.totalActivities}</li>
                )}
                {stats.totalFiles && <li>📁 Archivos: {stats.totalFiles}</li>}
              </ul>
            </div>
          )}

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

      {/* Información sobre embeddings completos */}
      <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
        <div className="flex items-start gap-2">
          <span className="text-xl">ℹ️</span>
          <div className="text-xs text-blue-400/70">
            <p className="font-semibold text-blue-400">
              🧠 Embeddings Completos del Curso
            </p>
            <p className="mt-1">
              Este proceso procesa TODO el contenido del curso:
            </p>
            <ul className="mt-2 ml-4 list-disc space-y-1">
              <li>✅ Descripción del curso</li>
              <li>✅ Todas las lecciones (títulos + descripciones)</li>
              <li>✅ Todas las actividades (nombres + descripciones)</li>
              <li>✅ Archivos asociados (PDFs, DOCs, TXTs)</li>
            </ul>
            <p className="mt-2">
              <strong>Modelo:</strong> text-embedding-3-small (OpenAI)
            </p>
            <p>
              <strong>Resultado:</strong> Búsqueda semántica completa del curso
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
