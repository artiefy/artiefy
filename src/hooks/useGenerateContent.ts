import { useState } from 'react';

interface GenerateContentOptions {
  type:
    | 'titulo'
    | 'descripcion'
    | 'problema'
    | 'justificacion'
    | 'objetivoGen'
    | 'objetivosEsp'
    | 'requisitos';
  prompt: string;
  titulo?: string;
  descripcion?: string;
  existingText?: string;
  sectionTitle?: string;
  sectionsContext?: string;
  fechaInicio?: string;
  fechaFin?: string;
  durationEstimate?: number;
  durationUnit?: 'dias' | 'semanas' | 'meses' | 'anos';
}

interface GenerateContentResponse {
  success: boolean;
  type: string;
  content?: string;
  error?: string;
  timestamp?: string;
}

/**
 * Server-side proxy. The n8n webhook is no longer called from the browser: it
 * had no authentication, so its NEXT_PUBLIC_ URL let anyone spend OpenAI credit
 * straight from the console. The proxy requires a Clerk session and relays the
 * n8n response untouched, so everything parsed below is unchanged.
 */
const GENERATE_CONTENT_ENDPOINT = '/api/projects/generate-content';

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

export const useGenerateContent = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateContent = async (
    options: GenerateContentOptions
  ): Promise<string | null> => {
    if (!options.prompt || options.prompt.trim().length < 3) {
      setError('El prompt debe tener al menos 3 caracteres');
      return null;
    }

    try {
      setIsGenerating(true);
      setError(null);

      const payload = {
        type: options.type,
        prompt: options.prompt,
        titulo: options.titulo,
        descripcion: options.descripcion,
        existingText: options.existingText,
        sectionTitle: options.sectionTitle,
        sectionsContext: options.sectionsContext,
        fechaInicio: options.fechaInicio,
        fechaFin: options.fechaFin,
        durationEstimate: options.durationEstimate,
        durationUnit: options.durationUnit,
        timestamp: new Date().toISOString(),
      };

      // El proxy resuelve la URL del webhook y sus reintentos en el servidor.
      const response = await fetch(GENERATE_CONTENT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Inicia sesión para generar contenido con IA');
        }
        throw new Error(
          `No pudimos generar el contenido (error ${response.status})`
        );
      }

      const data: GenerateContentResponse & {
        body?: GenerateContentResponse & {
          data?: unknown;
        };
        data?: unknown;
      } = await response.json();

      // n8n puede devolver { success, body } o { success, ... }
      const responseBody = data.body ?? data;

      if (!data.success || !responseBody.success) {
        const rb = responseBody as unknown;
        let rbError: string | undefined;
        if (
          isRecord(rb) &&
          typeof (rb as Record<string, unknown>).error === 'string'
        ) {
          rbError = (rb as Record<string, unknown>).error as string;
        }
        const dataError =
          typeof data.error === 'string' ? data.error : undefined;
        throw new Error(
          rbError || dataError || 'Error desconocido al generar contenido'
        );
      }

      let rawContent: unknown;
      if (isRecord(responseBody)) {
        rawContent =
          (responseBody as Record<string, unknown>)['content'] ??
          (responseBody as Record<string, unknown>)['data'] ??
          data.content ??
          responseBody;
      } else {
        rawContent = data.content ?? responseBody;
      }

      const stringifyObjectiveArray = (arr: unknown[]) => {
        return arr
          .map((item, idx) => {
            if (typeof item === 'string') return item;
            if (isRecord(item)) {
              const title =
                (typeof item.title === 'string' && item.title) ||
                (typeof item.description === 'string' && item.description) ||
                (typeof item.name === 'string' && item.name) ||
                '';

              const acts: string[] = Array.isArray(item.activities)
                ? (item.activities as unknown[])
                    .map((a) => {
                      if (typeof a === 'string') return a;
                      if (isRecord(a)) {
                        if (
                          typeof (a as Record<string, unknown>).title ===
                          'string'
                        )
                          return (a as Record<string, unknown>).title as string;
                        if (
                          typeof (a as Record<string, unknown>).description ===
                          'string'
                        )
                          return (a as Record<string, unknown>)
                            .description as string;
                      }
                      return '';
                    })
                    .filter(Boolean)
                : [];

              if (acts.length > 0) {
                return `Objetivo ${idx + 1}: ${title}\n${acts
                  .map((a) => `Actividad: ${a}`)
                  .join('\n')}`;
              }
              return title || JSON.stringify(item);
            }
            return String(item);
          })
          .join('\n\n');
      };

      let contentStr: string | undefined;

      if (typeof rawContent === 'string') {
        contentStr = rawContent;
      } else if (Array.isArray(rawContent)) {
        contentStr = stringifyObjectiveArray(rawContent as unknown[]);
      } else if (isRecord(rawContent)) {
        const candidates =
          rawContent.objetivos ??
          rawContent.objetivosEsp ??
          rawContent.objetivos_especificos ??
          rawContent.requisitos ??
          rawContent.result ??
          rawContent.data ??
          rawContent;

        if (Array.isArray(candidates)) {
          contentStr = stringifyObjectiveArray(candidates as unknown[]);
        } else if (typeof candidates === 'string') {
          contentStr = candidates;
        } else {
          try {
            contentStr = JSON.stringify(candidates, null, 2);
          } catch (e) {
            contentStr = String(candidates);
          }
        }
      }

      if (!contentStr) {
        console.error('Respuesta completa:', data);
        throw new Error('No se recibió contenido del servidor');
      }

      return contentStr;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('Error en generateContent:', errorMessage);
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generateContent,
    isGenerating,
    error,
    clearError: () => setError(null),
  };
};
