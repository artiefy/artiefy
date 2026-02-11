'use client';

import { useCallback, useState } from 'react';

import { AlertCircle, Loader2, Search, X } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '~/components/educators/ui/button';

interface SearchResult {
  id: number;
  content: string;
  similarity: number;
  source: string;
  metadata?: Record<string, unknown>;
  chunkIndex: number;
}

interface CourseSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: number;
  courseTitle: string;
}

// Función para renderizar contenido con formato profesional
const renderFormattedContent = (
  content: string,
  _source: string
): React.ReactNode => {
  if (!content || content.length === 0) {
    return <p className="text-sm text-gray-400">Sin contenido disponible</p>;
  }

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    if (!trimmed) return;

    // Encabezados H1, H2, H3
    if (trimmed.startsWith('###')) {
      elements.push(
        <h4 key={idx} className="mt-4 mb-2 text-sm font-bold text-cyan-300">
          {trimmed.replace(/^#+\s*/, '')}
        </h4>
      );
      return;
    }
    if (trimmed.startsWith('##')) {
      elements.push(
        <h3 key={idx} className="mt-3 mb-2 text-base font-bold text-cyan-400">
          {trimmed.replace(/^#+\s*/, '')}
        </h3>
      );
      return;
    }
    if (trimmed.startsWith('#')) {
      elements.push(
        <h2 key={idx} className="mt-2 mb-3 text-lg font-bold text-cyan-500">
          {trimmed.replace(/^#+\s*/, '')}
        </h2>
      );
      return;
    }

    // Items de lista
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const text = trimmed.replace(/^[\-\*]\s*/, '').replace(/\*\*/g, '');
      elements.push(
        <div key={idx} className="my-1 ml-2 flex gap-3 text-sm">
          <span className="flex-shrink-0 text-cyan-400">•</span>
          <span className="text-gray-300">{text}</span>
        </div>
      );
      return;
    }

    // Líneas con **texto**: valor (atributos)
    if (trimmed.includes('**') && trimmed.includes(':')) {
      const text = trimmed.replace(/\*\*/g, '');
      elements.push(
        <div
          key={idx}
          className="my-1 rounded border border-indigo-500/20 bg-indigo-500/10 p-2 text-sm"
        >
          <span className="font-semibold text-indigo-400">{text}</span>
        </div>
      );
      return;
    }

    // Párrafos normales
    if (trimmed.length > 3) {
      const text = trimmed.replace(/\*\*/g, '').replace(/`/g, '');
      elements.push(
        <p key={idx} className="my-1 text-sm leading-relaxed text-gray-300">
          {text}
        </p>
      );
      return;
    }
  });

  return elements.length > 0 ? (
    <div className="space-y-1">{elements}</div>
  ) : (
    <p className="text-sm text-gray-400">Sin contenido procesable</p>
  );
};

export const CourseSearchModal: React.FC<CourseSearchModalProps> = ({
  isOpen,
  onClose,
  courseId,
  courseTitle,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) {
      toast.error('Por favor escribe una pregunta');
      return;
    }

    setIsLoading(true);
    setError(null);
    setHasSearched(true);
    setAiResponse(null);
    setShowDetails(false);

    try {
      // Usar el nuevo endpoint que procesa con IA
      const response = await fetch('/api/embeddings/search-with-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId,
          query: query.trim(),
          topK: 3,
          threshold: 0.3,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al buscar en el curso');
      }

      const data = (await response.json()) as {
        success: boolean;
        response: string;
        results: SearchResult[];
        count: number;
      };

      if (data.success) {
        setAiResponse(data.response);
        setResults(data.results);
        if (data.count === 0) {
          setShowDetails(false);
        }
      } else {
        throw new Error('La búsqueda no fue exitosa');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [query, courseId]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      void handleSearch();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[90vh] w-full max-w-4xl flex-col rounded-lg border border-cyan-500/30 bg-slate-950 shadow-2xl shadow-cyan-500/20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-cyan-500/20 bg-slate-900/50 px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-white">
              Pregunta sobre el curso
            </h2>
            <p className="mt-1 text-sm text-cyan-400/70">{courseTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 transition-colors hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="border-b border-cyan-500/20 bg-slate-900/30 px-6 py-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="¿Qué quieres saber? (duración, alumnos, actividades, materias...)"
              className="flex-1 rounded-lg border border-cyan-500/30 bg-slate-800 px-4 py-2 text-white placeholder-gray-500 transition-all focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 focus:outline-none"
              disabled={isLoading}
            />
            <Button
              onClick={() => void handleSearch()}
              disabled={isLoading || !query.trim()}
              className="flex items-center gap-2 bg-cyan-600 px-4 py-2 text-white hover:bg-cyan-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Buscando...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Buscar
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {error && (
            <div className="flex gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-400" />
              <div>
                <p className="font-semibold text-red-400">Error</p>
                <p className="text-sm text-red-300">{error}</p>
              </div>
            </div>
          )}

          {!hasSearched && !error && (
            <div className="py-12 text-center">
              <Search className="mx-auto mb-4 h-12 w-12 text-cyan-500/30" />
              <p className="text-gray-400">
                Escribe una pregunta para buscar información en el curso
              </p>
              <p className="mt-2 text-sm text-gray-500">
                Ejemplos: nombre del curso, duración, alumnos inscritos, temas,
                actividades
              </p>
            </div>
          )}

          {/* Respuesta de IA conversacional */}
          {aiResponse && (
            <div className="space-y-4">
              {/* Respuesta principal */}
              <div className="rounded-lg border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 p-6">
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-xl">💬</span>
                  <span className="text-sm font-semibold text-cyan-400">
                    Respuesta
                  </span>
                </div>
                <p className="mb-4 text-base leading-relaxed whitespace-pre-wrap text-white">
                  {aiResponse}
                </p>
                {results.length > 0 && (
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="text-sm text-cyan-400 transition-colors hover:text-cyan-300"
                  >
                    {showDetails ? '▼ Ocultar fuentes' : '▶ Ver fuentes'}
                  </button>
                )}
              </div>

              {/* Detalles técnicos (opcional) */}
              {showDetails && results.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-cyan-400/70">
                    Información técnica de las fuentes:
                  </p>
                  {results.map((result, idx) => (
                    <div
                      key={result.id}
                      className="rounded-lg border border-cyan-500/20 bg-slate-800/50 p-4 transition-colors hover:border-cyan-500/40"
                    >
                      <div className="mb-3 flex items-center gap-3">
                        <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-xs font-bold text-cyan-400">
                          Fuente {idx + 1}
                        </span>
                        <span className="text-xs text-cyan-400/60">
                          Relevancia: {Math.round((1 + result.similarity) * 50)}
                          %
                        </span>
                      </div>
                      <div className="mb-2 space-y-2">
                        {renderFormattedContent(result.content, result.source)}
                      </div>
                      <p className="text-xs text-cyan-400/50">
                        📍 {result.source}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {hasSearched && !isLoading && !aiResponse && !error && (
            <div className="py-12 text-center">
              <AlertCircle className="mx-auto mb-4 h-12 w-12 text-yellow-500/30" />
              <p className="text-gray-400">
                No se encontró información sobre &quot;{query}&quot;
              </p>
              <p className="mt-2 text-sm text-gray-500">
                Intenta con palabras clave diferentes
              </p>
            </div>
          )}

          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="mb-4 h-8 w-8 animate-spin text-cyan-500" />
              <p className="text-gray-400">Buscando información...</p>
              <p className="mt-2 text-xs text-gray-500">
                Procesando con IA para generar una respuesta clara
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-cyan-500/20 bg-slate-900/50 px-6 py-4">
          <Button
            onClick={onClose}
            variant="outline"
            className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
          >
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
};
