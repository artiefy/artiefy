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
          data?: Record<string, unknown>;
        };
        data?: Record<string, unknown>;
      } = await response.json();

      // n8n puede devolver { success, body } o { success, ... }
      const responseBody = data.body ?? data;

      if (!data.success || !responseBody.success) {
        throw new Error(
          responseBody.error ||
            data.error ||
            'Error desconocido al generar contenido'
        );
      }

      const typedContentMap = responseBody.data || responseBody.content || {};
      const contentFromMap =
        responseBody.content ||
        data.content ||
        (options.type === 'titulo'
          ? typedContentMap.titulo
          : options.type === 'descripcion'
            ? typedContentMap.descripcion
            : options.type === 'problema'
              ? typedContentMap.problema
              : options.type === 'justificacion'
                ? typedContentMap.justificacion
                : options.type === 'objetivoGen'
                  ? typedContentMap.objetivo_general
                  : options.type === 'requisitos'
                    ? typedContentMap.requisitos
                    : typedContentMap.objetivos);

      if (!contentFromMap) {
        console.error('Respuesta completa:', data);
        throw new Error('No se recibió contenido del servidor');
      }

      return contentFromMap;
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
