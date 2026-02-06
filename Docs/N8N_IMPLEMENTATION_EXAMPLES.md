# Ejemplos Prácticos: Integración n8n + Next.js + OpenAI

## 📚 Ejemplos de Código

### 1. Endpoint Next.js para Generar Contenido

```typescript
// src/app/api/content/generate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Schema de validación
const generateContentSchema = z.object({
  prompt: z.string().min(10, 'El prompt debe tener al menos 10 caracteres'),
  courseId: z.number().optional(),
  level: z.enum(['basico', 'intermedio', 'avanzado']).default('intermedio'),
  type: z
    .enum(['titulo', 'descripcion', 'objetivo', 'completo'])
    .default('completo'),
  sessionId: z.string().optional(),
});

type GenerateContentRequest = z.infer<typeof generateContentSchema>;

export async function POST(request: NextRequest) {
  try {
    // Parsear y validar el cuerpo de la solicitud
    const body = await request.json();
    const payload: GenerateContentRequest = generateContentSchema.parse(body);

    // Generar sessionId si no existe
    const sessionId = payload.sessionId || `session-${Date.now()}`;

    // Seleccionar el webhook según el entorno
    const isProduction = process.env.NODE_ENV === 'production';
    const webhookUrl = isProduction
      ? process.env.N8N_WEBHOOK_PROD
      : process.env.N8N_WEBHOOK_LOCAL;

    if (!webhookUrl) {
      console.error('❌ Variable N8N_WEBHOOK_LOCAL/PROD no configurada');
      return NextResponse.json(
        { error: 'Configuración de servidor incompleta' },
        { status: 500 }
      );
    }

    console.log('📤 Enviando a n8n:', {
      url: webhookUrl,
      payload: { ...payload, sessionId },
    });

    // Llamar al webhook de n8n
    const n8nResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...payload,
        sessionId,
        timestamp: new Date().toISOString(),
      }),
      // Aumentar timeout
      signal: AbortSignal.timeout(30000),
    });

    // Manejar errores de respuesta
    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text();
      console.error('❌ Error de n8n:', {
        status: n8nResponse.status,
        statusText: n8nResponse.statusText,
        body: errorText,
      });

      return NextResponse.json(
        {
          error: 'Error al generar contenido',
          details: n8nResponse.statusText,
        },
        { status: n8nResponse.status }
      );
    }

    // Parsear respuesta
    const result = await n8nResponse.json();

    return NextResponse.json({
      success: true,
      sessionId,
      data: result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validación fallida',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error('💥 Error en endpoint:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Método OPTIONS para CORS
export async function OPTIONS() {
  return NextResponse.json(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
```

### 2. Hook React para Generar Contenido

```typescript
// src/hooks/useContentGenerator.ts
import { useState, useCallback } from 'react';

interface GenerateContentParams {
  prompt: string;
  courseId?: number;
  level?: 'basico' | 'intermedio' | 'avanzado';
  type?: 'titulo' | 'descripcion' | 'objetivo' | 'completo';
}

interface ContentResult {
  success: boolean;
  sessionId: string;
  data: {
    titulos?: string[];
    descripcion?: string;
    objetivos?: string[];
    generatedAt?: string;
  };
}

export function useContentGenerator() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ContentResult | null>(null);

  const generate = useCallback(async (params: GenerateContentParams) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/content/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...params,
          sessionId: `${Date.now()}-${Math.random()}`,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = (await response.json()) as ContentResult;
      setResult(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('❌ Error generando contenido:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    generate,
    loading,
    error,
    result,
  };
}
```

### 3. Componente React para Usar el Hook

```typescript
// src/components/ContentGenerator.tsx
'use client';

import { useState } from 'react';
import { useContentGenerator } from '@/hooks/useContentGenerator';

export function ContentGenerator() {
  const [prompt, setPrompt] = useState('');
  const [courseId, setCourseId] = useState<number>();
  const [level, setLevel] = useState<'basico' | 'intermedio' | 'avanzado'>(
    'intermedio'
  );

  const { generate, loading, error, result } = useContentGenerator();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!prompt.trim()) {
      alert('Por favor ingresa un tema');
      return;
    }

    await generate({
      prompt: prompt.trim(),
      courseId,
      level,
      type: 'completo',
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="prompt" className="block text-sm font-medium mb-2">
            Tema del Curso
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ej: Desarrollo web con Next.js y TypeScript"
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            rows={4}
            disabled={loading}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="level" className="block text-sm font-medium mb-2">
              Nivel
            </label>
            <select
              id="level"
              value={level}
              onChange={(e) =>
                setLevel(
                  e.target.value as 'basico' | 'intermedio' | 'avanzado'
                )
              }
              className="w-full p-2 border rounded-lg"
              disabled={loading}
            >
              <option value="basico">Básico</option>
              <option value="intermedio">Intermedio</option>
              <option value="avanzado">Avanzado</option>
            </select>
          </div>

          <div>
            <label htmlFor="courseId" className="block text-sm font-medium mb-2">
              ID del Curso (Opcional)
            </label>
            <input
              id="courseId"
              type="number"
              value={courseId || ''}
              onChange={(e) => setCourseId(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full p-2 border rounded-lg"
              disabled={loading}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 rounded-lg transition"
        >
          {loading ? '⏳ Generando...' : '✨ Generar Contenido'}
        </button>
      </form>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          <p className="font-semibold">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {result?.success && result.data && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Contenido Generado</h2>

          {result.data.titulos && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold mb-2">📝 Títulos Generados:</h3>
              <ul className="space-y-2">
                {result.data.titulos.map((titulo, idx) => (
                  <li key={idx} className="text-sm">
                    {idx + 1}. {titulo}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.data.descripcion && (
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-semibold mb-2">📄 Descripción:</h3>
              <p className="text-sm whitespace-pre-line">{result.data.descripcion}</p>
            </div>
          )}

          {result.data.objetivos && (
            <div className="p-4 bg-purple-50 rounded-lg">
              <h3 className="font-semibold mb-2">🎯 Objetivos:</h3>
              <ul className="space-y-1">
                {result.data.objetivos.map((objetivo, idx) => (
                  <li key={idx} className="text-sm">
                    {idx + 1}. {objetivo}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-xs text-gray-500">
            Generado: {new Date(result.data.generatedAt || '').toLocaleString('es-ES')}
          </p>
        </div>
      )}
    </div>
  );
}
```

### 4. Server Action para Generar Contenido

```typescript
// src/server/actions/content.ts
'use server';

import { z } from 'zod';

const generateContentSchema = z.object({
  prompt: z.string().min(10),
  courseId: z.number().optional(),
  level: z.enum(['basico', 'intermedio', 'avanzado']),
});

export async function generateContent(
  input: z.infer<typeof generateContentSchema>
) {
  try {
    const validated = generateContentSchema.parse(input);

    const webhookUrl =
      process.env.NODE_ENV === 'production'
        ? process.env.N8N_WEBHOOK_PROD
        : process.env.N8N_WEBHOOK_LOCAL;

    if (!webhookUrl) {
      throw new Error('Webhook URL no configurado');
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...validated,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`n8n error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error in generateContent:', error);
    throw error;
  }
}
```

---

## 🔧 Configuración Avanzada

### Configurar Múltiples Webhooks en `.env`

```bash
# Webhook para generar títulos
N8N_WEBHOOK_TITLES=https://n8n.srv1000134.hstgr.cloud/webhook/UUID-TITLES

# Webhook para descripciones
N8N_WEBHOOK_DESCRIPTIONS=https://n8n.srv1000134.hstgr.cloud/webhook/UUID-DESCRIPTIONS

# Webhook para contenido completo
N8N_WEBHOOK_COMPLETE=https://n8n.srv1000134.hstgr.cloud/webhook/UUID-COMPLETE

# Variables de control
N8N_REQUEST_TIMEOUT=30000
N8N_MAX_RETRIES=3
```

### Enrutador de Webhooks

```typescript
// src/server/utils/n8n-router.ts
export function getWebhookUrl(
  type: 'titulo' | 'descripcion' | 'objetivo' | 'completo'
): string {
  const webhooks = {
    titulo: process.env.N8N_WEBHOOK_TITLES,
    descripcion: process.env.N8N_WEBHOOK_DESCRIPTIONS,
    objetivo: process.env.N8N_WEBHOOK_OBJECTIVES,
    completo: process.env.N8N_WEBHOOK_COMPLETE,
  };

  const url = webhooks[type];

  if (!url) {
    throw new Error(`Webhook no configurado para tipo: ${type}`);
  }

  return url;
}
```

---

## 📊 Ejemplo de Payload y Response

### Request al Webhook

```json
{
  "prompt": "Curso de Machine Learning con Python",
  "courseId": 42,
  "level": "avanzado",
  "sessionId": "session-1234567890",
  "timestamp": "2026-01-30T15:30:00Z"
}
```

### Response de n8n

```json
{
  "success": true,
  "sessionId": "session-1234567890",
  "data": {
    "titulos": [
      "Machine Learning Avanzado con Python y TensorFlow",
      "De Cero a Experto en ML: Redes Neuronales Profundas",
      "Python para Ciencia de Datos: Técnicas Avanzadas de ML"
    ],
    "descripcion": "Aprende Machine Learning desde cero hasta nivel experto. Este curso cubre desde conceptos fundamentales de álgebra lineal y estadística hasta la implementación de redes neuronales profundas con TensorFlow y PyTorch. Incluye proyectos prácticos con datasets reales del Kaggle. Al finalizar, serás capaz de diseñar y entrenar modelos complejos para resolver problemas del mundo real. Dirigido a desarrolladores con conocimientos básicos de Python. Duración: 40 horas de contenido.",
    "objetivos": [
      "Comprender los fundamentos matemáticos de Machine Learning",
      "Implementar algoritmos clásicos (Regresión, Árboles de Decisión, SVM)",
      "Construir y entrenar redes neuronales con TensorFlow",
      "Aplicar técnicas de procesamiento de imágenes con CNN",
      "Implementar modelos de procesamiento de lenguaje natural",
      "Optimizar hiperparámetros y evitar overfitting",
      "Desplegar modelos en producción con Flask/FastAPI"
    ],
    "generatedAt": "2026-01-30T15:30:45Z"
  }
}
```

---

## 🚀 Despliegue en Producción

### Variables `.env.production`

```bash
# n8n
N8N_BASE_URL=https://n8n.srv1000134.hstgr.cloud
N8N_WEBHOOK_PROD=https://n8n.srv1000134.hstgr.cloud/webhook/f71bd676-9eb3-4da9-beb8-8aab1c8dcdb7
N8N_API_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# OpenAI
OPENAI_API_KEY=sk-proj-... # Key de producción

# Database
POSTGRES_URL=postgresql://production-user:pass@neon-prod.sql...

# Seguridad
WEBHOOK_SECRET=tu-secreto-aleatorio-seguro
N8N_REQUEST_TIMEOUT=30000
```

### Monitoreo

```typescript
// src/server/utils/n8n-health-check.ts
export async function checkN8nHealth(): Promise<boolean> {
  try {
    const response = await fetch(
      `${process.env.N8N_BASE_URL}/api/v1/workflows`,
      {
        headers: {
          Authorization: `Bearer ${process.env.N8N_API_TOKEN}`,
        },
        signal: AbortSignal.timeout(5000),
      }
    );

    return response.ok;
  } catch (error) {
    console.error('❌ n8n health check failed:', error);
    return false;
  }
}
```

---

## ✅ Checklist de Implementación

- [ ] Variables de entorno configuradas en `.env`
- [ ] Webhooks creados en n8n (3 workflows mínimo)
- [ ] Credencial OpenAI agregada a n8n
- [ ] Endpoint API creado en Next.js
- [ ] Hook `useContentGenerator` implementado
- [ ] Componente `ContentGenerator` integrado
- [ ] Tests del webhook ejecutados exitosamente
- [ ] Errores manejados adecuadamente
- [ ] Logging implementado
- [ ] Monitoreo de salud configurado
- [ ] Timeout y reintentos configurados
- [ ] Datos guardados en base de datos
