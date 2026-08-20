'use client';

/**
 * Genera los embeddings de un proyecto guiado: el proyecto, sus objetivos y
 * las actividades de cada objetivo.
 *
 * Es el equivalente de `EmbeddingsGeneratorComplete` (que cubre cursos), pero
 * apuntando a `/api/embeddings/generate-from-project`.
 */

import { useState } from 'react';

import { Brain, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface GenerationStats {
  totalChunks: number;
  totalTokens: number;
  estimatedCost: string;
  totalObjectives?: number;
  totalActivities?: number;
  sources?: { type: string; name: string }[];
}

interface ApiResponse {
  success?: boolean;
  message?: string;
  stats?: GenerationStats;
  error?: string;
  details?: string;
}

export function ProjectEmbeddingsGenerator({
  projectId,
  projectTitle,
}: {
  projectId: number;
  projectTitle: string;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<GenerationStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    setStats(null);

    try {
      const response = await fetch('/api/embeddings/generate-from-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });

      const data = (await response.json()) as ApiResponse;

      if (!response.ok || !data.success) {
        throw new Error(
          data.details ?? data.error ?? 'Error generando embeddings'
        );
      }

      setStats(data.stats ?? null);
      toast.success('Embeddings generados', {
        description: `${data.stats?.totalChunks ?? 0} fragmentos indexados`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      toast.error('Error generando embeddings', { description: message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="
        rounded-2xl border border-[#22C4D3]/30 bg-[#0b1f3d]/60 p-6
      "
    >
      <div className="mb-4 flex items-start gap-3">
        <span
          className="
            flex size-10 shrink-0 items-center justify-center rounded-full
            bg-[#22C4D3]/15 text-[#22C4D3]
          "
        >
          <Brain className="size-5" />
        </span>
        <div>
          <h3 className="text-lg font-bold text-white">
            Embeddings del proyecto
          </h3>
          <p className="mt-1 text-sm text-white/60">
            Indexa el proyecto, sus objetivos y sus actividades para la búsqueda
            semántica y las respuestas de la IA.
          </p>
        </div>
      </div>

      <div
        className="
          mb-4 rounded-lg border border-white/10 bg-white/5 p-4 text-sm
          text-white/70
        "
      >
        <p className="mb-2 font-semibold text-[#22C4D3]">
          Qué se va a procesar
        </p>
        <ul className="space-y-1">
          <li>• Descripción, problema, cómo funciona y qué se construye</li>
          <li>• Requisitos previos, tecnologías y entregables</li>
          <li>• Preguntas frecuentes</li>
          <li>• Cada objetivo con su descripción</li>
          <li>• Cada actividad con sus instrucciones</li>
        </ul>
      </div>

      <button
        type="button"
        onClick={() => void handleGenerate()}
        disabled={isLoading}
        className="
          flex w-full items-center justify-center gap-2 rounded-lg
          bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-2.5 text-sm
          font-semibold text-white transition-colors
          hover:from-purple-700 hover:to-blue-700
          disabled:cursor-not-allowed disabled:opacity-60
        "
      >
        {isLoading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Generando embeddings...
          </>
        ) : (
          <>
            <Brain className="size-4" />
            Generar embeddings de {projectTitle}
          </>
        )}
      </button>

      {error && (
        <div
          className="
            mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm
            text-red-300
          "
        >
          {error}
        </div>
      )}

      {stats && (
        <div
          className="
            mt-4 rounded-lg border border-green-500/30 bg-green-500/10 p-4
          "
        >
          <p className="mb-2 font-semibold text-green-400">
            ✅ Indexado correctamente
          </p>
          <div className="grid grid-cols-2 gap-2 text-sm text-white/80">
            <span>Fragmentos: {stats.totalChunks}</span>
            <span>Tokens: {stats.totalTokens}</span>
            <span>Objetivos: {stats.totalObjectives ?? 0}</span>
            <span>Actividades: {stats.totalActivities ?? 0}</span>
          </div>
          <p className="mt-2 text-xs text-white/50">
            Costo estimado: ${stats.estimatedCost}
          </p>
        </div>
      )}
    </div>
  );
}
