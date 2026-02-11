'use client';

/**
 * Componente para generar embeddings de un curso COMPLETO
 * Incluye archivos, lecciones y actividades
 */

import { useState } from 'react';

import { toast } from 'sonner';

import { Button } from '~/components/estudiantes/ui/button';

interface CourseEmbeddingsGeneratorProps {
  courseId: number;
  courseTitle: string;
  courseDescription?: string;
}

interface GenerationStats {
  totalChunks: number;
  totalTokens: number;
  avgChunkTokens: number;
  estimatedCost: string;
  costInCents: number;
  courseId: number;
  totalFiles: number;
  totalLessons: number;
  totalActivities: number;
  sources: Array<{
    type: 'course' | 'lesson' | 'activity' | 'file';
    name: string;
    key?: string;
  }>;
}

export function CourseEmbeddingsGenerator({
  courseId,
  courseTitle,
  courseDescription = '',
}: CourseEmbeddingsGeneratorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [stats, setStats] = useState<GenerationStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateEmbeddings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setIsSuccess(false);

      console.log(
        '🚀 Iniciando generación de embeddings del curso completo...'
      );
      console.log(`📚 Curso: ${courseTitle}`);
      console.log(`🎯 ID: ${courseId}`);

      // Llamar API para generar embeddings del curso completo
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

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Error generando embeddings');
      }

      // Mostrar estadísticas
      setStats(data.stats);
      setIsSuccess(true);

      console.log('✅ Embeddings generados exitosamente');
      console.log('📊 Estadísticas:', data.stats);

      toast.success('✨ Embeddings del curso generados exitosamente', {
        description: `${data.stats.totalChunks} chunks | ${data.stats.totalFiles} archivos | ${data.stats.totalLessons} lecciones`,
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
            Procesando curso completo...
          </>
        ) : isSuccess ? (
          <>
            <span>✅ Regenerar Embeddings</span>
          </>
        ) : (
          <>
            <span>🚀 Generar Embeddings Completos</span>
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
                El contenido completo ha sido procesado con archivos, lecciones
                y actividades
              </p>
            </div>
          </div>

          {/* Grid de estadísticas principales */}
          <div className="grid grid-cols-2 gap-3 pt-2 sm:grid-cols-5">
            <div className="rounded bg-green-500/5 p-2">
              <div className="text-xs text-green-400/70">Chunks</div>
              <div className="text-xl font-bold text-green-400">
                {stats.totalChunks}
              </div>
            </div>

            <div className="rounded bg-green-500/5 p-2">
              <div className="text-xs text-green-400/70">Tokens</div>
              <div className="text-xl font-bold text-green-400">
                {(stats.totalTokens / 1000).toFixed(1)}K
              </div>
            </div>

            <div className="rounded bg-green-500/5 p-2">
              <div className="text-xs text-green-400/70">Archivos</div>
              <div className="text-xl font-bold text-green-400">
                {stats.totalFiles}
              </div>
            </div>

            <div className="rounded bg-green-500/5 p-2">
              <div className="text-xs text-green-400/70">Lecciones</div>
              <div className="text-xl font-bold text-green-400">
                {stats.totalLessons}
              </div>
            </div>

            <div className="rounded bg-green-500/5 p-2">
              <div className="text-xs text-green-400/70">Costo</div>
              <div className="text-xl font-bold text-green-400">
                ${stats.estimatedCost}
              </div>
            </div>
          </div>

          {/* Detalles de actividades */}
          {stats.totalActivities > 0 && (
            <div className="rounded bg-green-500/5 p-2">
              <div className="text-xs font-semibold text-green-400">
                Actividades: {stats.totalActivities}
              </div>
            </div>
          )}

          {/* Lista de fuentes procesadas */}
          {stats.sources.length > 0 && (
            <div className="max-h-32 overflow-y-auto rounded bg-black/20 p-2">
              <div className="mb-1 text-xs font-semibold text-green-400">
                📋 Fuentes procesadas:
              </div>
              <ul className="space-y-0.5 text-xs text-green-400/70">
                {stats.sources.map((source, i) => (
                  <li key={i}>
                    <span className="text-green-500">•</span> [{source.type}]{' '}
                    {source.name}
                  </li>
                ))}
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

      {/* Info sobre embeddings */}
      <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3">
        <div className="flex items-start gap-2">
          <span className="text-xl">ℹ️</span>
          <div className="text-xs text-cyan-400/70">
            <p className="font-semibold text-cyan-400">
              🚀 Embeddings Completos de Curso
            </p>
            <p className="mt-1">
              Procesa automáticamente todo el contenido del curso:
            </p>
            <ul className="mt-1 ml-2 list-disc space-y-0.5">
              <li>📄 Título y descripción del curso</li>
              <li>📖 Todas las lecciones con sus contenidos</li>
              <li>✏️ Todas las actividades asociadas</li>
              <li>📎 Archivos en S3 (PDF, DOCX, TXT)</li>
            </ul>
            <p className="mt-2">
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
