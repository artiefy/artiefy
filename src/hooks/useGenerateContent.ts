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
}

interface GenerateContentResponse {
  success: boolean;
  type: string;
  content?: string;
  error?: string;
  timestamp?: string;
}

// Detectar si estamos en desarrollo o producción
const isLocalEnv = () => {
  if (typeof window !== 'undefined') {
    return (
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1'
    );
  }
  return process.env.NEXT_PUBLIC_BASE_URL?.includes('localhost') ?? false;
};

// Usar nuevas variables específicas para el flujo de PROYECTOS con detección automática de entorno
const N8N_WEBHOOK_PROJECTS_LOCAL =
  process.env.NEXT_PUBLIC_N8N_WEBHOOK_PROJECTS_LOCAL;
const N8N_WEBHOOK_PROJECTS_PROD =
  process.env.NEXT_PUBLIC_N8N_WEBHOOK_PROJECTS_PROD;

// Legacy: mantener soporte para la URL anterior
const N8N_WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL;

// Fallback a variables del flujo anterior si es necesario
const N8N_WEBHOOK_PROD =
  process.env.N8N_WEBHOOK_PROD ?? process.env.NEXT_PUBLIC_N8N_WEBHOOK_PROD;
const N8N_WEBHOOK_LOCAL =
  process.env.N8N_WEBHOOK_LOCAL ?? process.env.NEXT_PUBLIC_N8N_WEBHOOK_LOCAL;

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

export const useGenerateContent = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateContent = async (
    options: GenerateContentOptions
  ): Promise<string | null> => {
    // Construir una lista de URLs candidatas para el webhook
    // Prioridad: 1) Nuevas variables PROJECTS (con detección automática de entorno)
    //           2) Legacy NEXT_PUBLIC_N8N_WEBHOOK_URL
    //           3) Variables del flujo anterior si es necesario
    const candidates: string[] = [];

    // Intentar primero las URLs específicas para proyectos, con detección automática
    if (isLocalEnv()) {
      // En desarrollo: intentar webhook-test primero
      if (N8N_WEBHOOK_PROJECTS_LOCAL) {
        candidates.push(N8N_WEBHOOK_PROJECTS_LOCAL);
      }
      if (N8N_WEBHOOK_PROJECTS_PROD) {
        candidates.push(N8N_WEBHOOK_PROJECTS_PROD);
      }
    } else {
      // En producción: intentar webhook primero
      if (N8N_WEBHOOK_PROJECTS_PROD) {
        candidates.push(N8N_WEBHOOK_PROJECTS_PROD);
      }
      if (N8N_WEBHOOK_PROJECTS_LOCAL) {
        candidates.push(N8N_WEBHOOK_PROJECTS_LOCAL);
      }
    }

    // Fallback a variables legacy
    if (N8N_WEBHOOK_URL) {
      candidates.push(N8N_WEBHOOK_URL);
    }
    if (typeof N8N_WEBHOOK_PROD === 'string' && N8N_WEBHOOK_PROD) {
      candidates.push(N8N_WEBHOOK_PROD);
    }
    if (typeof N8N_WEBHOOK_LOCAL === 'string' && N8N_WEBHOOK_LOCAL) {
      candidates.push(N8N_WEBHOOK_LOCAL);
    }

    if (candidates.length === 0) {
      setError('URL de webhook de n8n no configurada');
      console.error(
        'N8N webhook URLs no están definidas en variables de entorno'
      );
      console.error('Verificar: NEXT_PUBLIC_N8N_WEBHOOK_PROJECTS_LOCAL/PROD');
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
        titulo: options.titulo,
        descripcion: options.descripcion,
        existingText: options.existingText,
        sectionTitle: options.sectionTitle,
        sectionsContext: options.sectionsContext,
        timestamp: new Date().toISOString(),
      };

      console.log('🚀 Enviando a n8n:', payload);
      console.log(
        '📍 Ambiente detectado:',
        isLocalEnv() ? 'desarrollo' : 'producción'
      );
      console.log('🔗 URLs candidatas:', candidates);

      let response: Response | null = null;
      let lastError: unknown = null;

      for (const url of candidates) {
        try {
          console.log('🚀 Intentando webhook de n8n:', url, payload);
          // Intentar llamar al webhook candidato
          const res = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          });
          if (!res.ok) {
            // Guardar y continuar con el siguiente candidato
            lastError = `${res.status} ${res.statusText}`;
            console.warn('Webhook candidate returned non-ok:', url, res.status);
            continue;
          }
          response = res;
          break;
        } catch (err) {
          lastError = err;
          console.warn('Error llamando webhook candidato:', url, err);
          continue;
        }
      }

      if (!response) {
        throw new Error(
          lastError instanceof Error
            ? lastError.message
            : 'No response from any n8n webhook candidates'
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
