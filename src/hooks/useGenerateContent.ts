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
}

interface GenerateContentResponse {
  success: boolean;
  type: string;
  content?: string;
  error?: string;
  timestamp?: string;
}

const N8N_WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL;

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

export const useGenerateContent = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateContent = async (
    options: GenerateContentOptions
  ): Promise<string | null> => {
    if (!N8N_WEBHOOK_URL) {
      setError('URL de webhook de n8n no configurada');
      console.error('N8N_WEBHOOK_URL no está definida en variables de entorno');
      return null;
    }

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
        timestamp: new Date().toISOString(),
      };

      console.log('🚀 Enviando a n8n:', payload);

      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
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
