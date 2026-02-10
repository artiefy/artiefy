# Guía Completa: n8n Workflows con OpenAI API

## 📋 Tabla de Contenidos

1. [Introducción](#introducción)
2. [API de n8n](#api-de-n8n)
3. [Estructura JSON de Workflows](#estructura-json-de-workflows)
4. [Integración con OpenAI](#integración-con-openai)
5. [Webhooks en n8n](#webhooks-en-n8n)
6. [Variables de Entorno](#variables-de-entorno)
7. [Ejemplos Prácticos](#ejemplos-prácticos)

---

## Introducción

### ¿Qué es n8n?

n8n es una plataforma de automatización de flujos de trabajo (workflow automation) que permite conectar aplicaciones y automatizar procesos. Es como Zapier pero **self-hosted** (puedes instalarlo en tu propio servidor).

### Tu Configuración Actual

- **URL de n8n**: `https://n8n.srv1000134.hstgr.cloud`
- **Base de datos**: Neon PostgreSQL
- **Integración**: Next.js con webhooks hacia n8n
- **IA**: OpenAI API

---

## API de n8n

### 1. Endpoints Principales

```bash
# Documentación de API
https://n8n.srv1000134.hstgr.cloud/api/v1

# Endpoints importantes:
- GET    /workflows              → Listar workflows
- POST   /workflows              → Crear workflow
- GET    /workflows/:id          → Obtener workflow
- PUT    /workflows/:id          → Actualizar workflow
- DELETE /workflows/:id          → Eliminar workflow
- POST   /workflows/:id/activate → Activar workflow
- POST   /workflows/:id/deactivate → Desactivar workflow

# Ejecución:
- POST   /workflows/:id/execute  → Ejecutar workflow manualmente
- POST   /webhooks/:path         → Trigger webhook (recibir datos)
```

### 2. Autenticación con API

Para usar la API de n8n, necesitas un **API Token**. Ya tienes en `.env`:

```bash
N8N_MCP_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Ejemplo: Crear Workflow via API

```bash
curl -X POST https://n8n.srv1000134.hstgr.cloud/api/v1/workflows \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d @workflow.json
```

---

## Estructura JSON de Workflows

### Estructura Base Completa

```json
{
  "name": "Generar Contenido con OpenAI",
  "nodes": [
    {
      "id": "node-webhook",
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "position": [250, 300],
      "webhookId": "f71bd676-9eb3-4da9-beb8-8aab1c8dcdb7",
      "parameters": {
        "path": "f71bd676-9eb3-4da9-beb8-8aab1c8dcdb7",
        "responseMode": "responseNode",
        "responseData": "first"
      }
    },
    {
      "id": "node-openai",
      "name": "OpenAI",
      "type": "n8n-nodes-base.openai",
      "typeVersion": 4,
      "position": [500, 300],
      "parameters": {
        "model": "gpt-4",
        "temperature": 0.7,
        "maxTokens": 2000,
        "messages": [
          {
            "role": "user",
            "content": "={{ $json.prompt }}"
          }
        ]
      },
      "credentials": {
        "openaiApi": "openai-api-key"
      }
    },
    {
      "id": "node-response",
      "name": "Responder a Request",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "position": [750, 300],
      "parameters": {
        "responseBody": "={{ JSON.stringify($json) }}"
      }
    }
  ],
  "connections": {
    "node-webhook": {
      "main": [
        [
          {
            "node": "node-openai",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "node-openai": {
      "main": [
        [
          {
            "node": "node-response",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  },
  "active": true,
  "settings": {
    "errorWorkflow": "",
    "timezone": "America/Bogota"
  }
}
```

### Componentes Clave

#### 1. **Nodo (Node)**

```json
{
  "id": "identificador-único",
  "name": "Nombre Visible",
  "type": "n8n-nodes-base.tipoDeNodo",
  "typeVersion": 1,
  "position": [x, y],              // Coordenadas en canvas
  "parameters": { /* config */ },
  "credentials": { /* creds */ }
}
```

#### 2. **Conexiones (Connections)**

```json
{
  "nodo-origen": {
    "main": [
      [
        {
          "node": "nodo-destino",
          "type": "main",
          "index": 0
        }
      ]
    ]
  }
}
```

#### 3. **Datos (Data Flow)**

```
Webhook recibe → { prompt: "...", courses: [...] }
      ↓
OpenAI procesa → Genera respuesta
      ↓
Response envía → JSON con resultado
```

---

## Integración con OpenAI

### 1. Configurar Credenciales en n8n

**Opción A: UI de n8n**

1. Ve a Settings → Credentials
2. Haz clic en "New"
3. Busca "OpenAI"
4. Pegaclave API: `sk-proj-...`
5. Nombra la credencial: "openai-api-key"

**Opción B: API**

```bash
curl -X POST https://n8n.srv1000134.hstgr.cloud/api/v1/credentials \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "openai-api-key",
    "type": "openaiApi",
    "data": {
      "apiKey": "sk-proj-..."
    }
  }'
```

### 2. Nodo OpenAI con Parámetros

```json
{
  "id": "openai-node",
  "name": "OpenAI GPT-4",
  "type": "n8n-nodes-base.openai",
  "typeVersion": 4,
  "position": [500, 300],
  "parameters": {
    "model": "gpt-4",
    "temperature": 0.7,
    "topP": 1,
    "frequencyPenalty": 0,
    "presencePenalty": 0,
    "maxTokens": 2000,
    "messages": [
      {
        "role": "system",
        "content": "Eres un experto en crear contenido educativo."
      },
      {
        "role": "user",
        "content": "={{ $json.prompt }}"
      }
    ]
  },
  "credentials": {
    "openaiApi": "openai-api-key"
  }
}
```

### 3. Modelos Disponibles

```javascript
// Modelos GPT (recomendados)
- gpt-4-turbo      // Mejor calidad, más caro
- gpt-4            // Alto rendimiento
- gpt-3.5-turbo    // Rápido y económico
- gpt-3.5-turbo-16k // Mayor contexto
```

### 4. Parámetros de OpenAI

```json
{
  "model": "gpt-4",
  "temperature": 0.7, // 0-2: creatividad (0=determinista, 1=normal)
  "topP": 1, // 0-1: nucleus sampling
  "maxTokens": 2000, // Respuesta máxima
  "frequencyPenalty": 0, // 0-2: evita repetición
  "presencePenalty": 0 // 0-2: cubre temas nuevos
}
```

---

## Webhooks en n8n

### 1. Estructura de Webhook

```json
{
  "id": "webhook-node",
  "name": "Recibir Solicitud",
  "type": "n8n-nodes-base.webhook",
  "typeVersion": 2,
  "position": [250, 300],
  "webhookId": "f71bd676-9eb3-4da9-beb8-8aab1c8dcdb7",
  "parameters": {
    "path": "f71bd676-9eb3-4da9-beb8-8aab1c8dcdb7",
    "httpMethod": "POST",
    "responseMode": "responseNode",
    "options": {
      "useBinaryData": false
    }
  }
}
```

### 2. Métodos HTTP

```json
{
  "httpMethod": "POST" // Recomendado para datos
}
```

### 3. Response Mode Opciones

```javascript
// "responseNode"     → El nodo Response define respuesta
// "firstEntryData"   → Devuelve salida del primer nodo
// "lastEntryData"    → Devuelve salida del último nodo
// "waitForWebhook"   → Espera un nodo específico
```

### 4. URL del Webhook

```
Local:  http://localhost:5678/webhook-test/f71bd676-9eb3-4da9-beb8-8aab1c8dcdb7
Prod:   https://n8n.srv1000134.hstgr.cloud/webhook/f71bd676-9eb3-4da9-beb8-8aab1c8dcdb7
```

### 5. Prueba de Webhook

```bash
# Test con curl
curl -X POST https://n8n.srv1000134.hstgr.cloud/webhook/f71bd676-9eb3-4da9-beb8-8aab1c8dcdb7 \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Crea un título para un curso de Python",
    "courses": [
      { "id": 1, "title": "Introducción a Python" },
      { "id": 2, "title": "Python Avanzado" }
    ]
  }'
```

### 6. Datos Recibidos en Webhook

```javascript
// Dentro del workflow, accede con:
$json.prompt                    // El prompt enviado
$json.courses                   // Array de cursos
$json.sessionId                 // ID de sesión
$json.messageHistory            // Historial de mensajes

// Ejemplo en OpenAI:
"content": "{{ $json.prompt }}"
```

---

## Variables de Entorno

### Tu Configuración `.env` Actual

```bash
# n8n URLs
N8N_BASE_URL=https://n8n.srv1000134.hstgr.cloud
N8N_WEBHOOK_PATH=f71bd676-9eb3-4da9-beb8-8aab1c8dcdb7

# Webhooks por entorno
N8N_WEBHOOK_LOCAL=http://localhost:5678/webhook-test/f71bd676-9eb3-4da9-beb8-8aab1c8dcdb7
N8N_WEBHOOK_PROD=https://n8n.srv1000134.hstgr.cloud/webhook/f71bd676-9eb3-4da9-beb8-8aab1c8dcdb7

# Tokens
N8N_MCP_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
N8N_LICENSE_KEY=...

# OpenAI
OPENAI_API_KEY=sk-proj-...
OPENAI_ASSISTANT_ID=asst_...
```

### Variables Necesarias para Nuevos Workflows

```bash
# Si agregas más webhooks:
N8N_WEBHOOK_CONTENT_GENERATION=https://n8n.srv1000134.hstgr.cloud/webhook/UUID
N8N_WEBHOOK_THUMBNAIL_GENERATOR=https://n8n.srv1000134.hstgr.cloud/webhook/UUID

# API Token para acceder a API de n8n:
N8N_API_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Database para guardar resultados:
POSTGRES_URL=postgresql://...
```

---

## Ejemplos Prácticos

### Ejemplo 1: Workflow para Generar Títulos de Cursos

```json
{
  "name": "Generar Títulos de Cursos",
  "nodes": [
    {
      "id": "webhook",
      "name": "Recibir Prompt",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "position": [250, 300],
      "webhookId": "f71bd676-9eb3-4da9-beb8-8aab1c8dcdb7",
      "parameters": {
        "path": "f71bd676-9eb3-4da9-beb8-8aab1c8dcdb7",
        "httpMethod": "POST",
        "responseMode": "responseNode"
      }
    },
    {
      "id": "set-system-prompt",
      "name": "Instrucción de Sistema",
      "type": "n8n-nodes-base.set",
      "typeVersion": 3,
      "position": [500, 100],
      "parameters": {
        "assignments": {
          "assignments": [
            {
              "name": "systemPrompt",
              "type": "string",
              "value": "Eres un experto en educación. Tu tarea es crear títulos atractivos y descriptivos para cursos online. Los títulos deben ser:\n1. Claros y concisos (máximo 80 caracteres)\n2. SEO optimizados\n3. Que generen interés\n\nResponde SOLO con un JSON con array de títulos."
            }
          ]
        }
      }
    },
    {
      "id": "openai-titles",
      "name": "OpenAI - Generar Títulos",
      "type": "n8n-nodes-base.openai",
      "typeVersion": 4,
      "position": [750, 200],
      "parameters": {
        "model": "gpt-4",
        "temperature": 0.8,
        "maxTokens": 500,
        "messages": [
          {
            "role": "system",
            "content": "={{ $json.systemPrompt }}"
          },
          {
            "role": "user",
            "content": "Crea 5 títulos atractivos para un curso sobre: {{ $json.prompt }}"
          }
        ]
      },
      "credentials": {
        "openaiApi": "openai-api-key"
      }
    },
    {
      "id": "parse-response",
      "name": "Parsear Respuesta",
      "type": "n8n-nodes-base.set",
      "typeVersion": 3,
      "position": [1000, 200],
      "parameters": {
        "assignments": {
          "assignments": [
            {
              "name": "result",
              "type": "object",
              "value": "={{ JSON.parse($json.response) }}"
            }
          ]
        }
      }
    },
    {
      "id": "response",
      "name": "Enviar Respuesta",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "position": [1250, 200],
      "parameters": {
        "responseBody": "={{ { success: true, titles: $json.result, timestamp: new Date().toISOString() } }}"
      }
    }
  ],
  "connections": {
    "webhook": {
      "main": [[{ "node": "set-system-prompt", "type": "main", "index": 0 }]]
    },
    "set-system-prompt": {
      "main": [[{ "node": "openai-titles", "type": "main", "index": 0 }]]
    },
    "openai-titles": {
      "main": [[{ "node": "parse-response", "type": "main", "index": 0 }]]
    },
    "parse-response": {
      "main": [[{ "node": "response", "type": "main", "index": 0 }]]
    }
  },
  "active": true
}
```

### Ejemplo 2: Workflow para Generar Descripciones

```json
{
  "name": "Generar Descripciones de Cursos",
  "nodes": [
    {
      "id": "webhook",
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "position": [250, 300],
      "webhookId": "descripcion-webhook-uuid",
      "parameters": {
        "path": "descripcion-webhook-uuid",
        "httpMethod": "POST",
        "responseMode": "responseNode"
      }
    },
    {
      "id": "openai-description",
      "name": "OpenAI - Descripción",
      "type": "n8n-nodes-base.openai",
      "typeVersion": 4,
      "position": [500, 300],
      "parameters": {
        "model": "gpt-4",
        "temperature": 0.7,
        "maxTokens": 1000,
        "messages": [
          {
            "role": "system",
            "content": "Eres un especialista en descripción de cursos. Crea descripciones atractivas de 150-300 palabras que incluyan:\n- Qué aprenderán\n- A quién está dirigido\n- Requisitos previos\n- Duración estimada"
          },
          {
            "role": "user",
            "content": "Crea una descripción para: {{ $json.courseTitle }}\nNivel: {{ $json.level }}\nTemática: {{ $json.topic }}"
          }
        ]
      },
      "credentials": {
        "openaiApi": "openai-api-key"
      }
    },
    {
      "id": "save-to-db",
      "name": "Guardar en BD",
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 2,
      "position": [750, 300],
      "parameters": {
        "operation": "insert",
        "table": "course_descriptions",
        "columns": "courseId,description,generatedAt",
        "values": "{{ $json.courseId }},{{ $json.response }},'{{ new Date().toISOString() }}'"
      },
      "credentials": {
        "postgres": "neon-database"
      }
    },
    {
      "id": "response",
      "name": "Response",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "position": [1000, 300],
      "parameters": {
        "responseBody": "={{ { success: true, description: $json.response } }}"
      }
    }
  ],
  "connections": {
    "webhook": {
      "main": [[{ "node": "openai-description", "type": "main", "index": 0 }]]
    },
    "openai-description": {
      "main": [[{ "node": "save-to-db", "type": "main", "index": 0 }]]
    },
    "save-to-db": {
      "main": [[{ "node": "response", "type": "main", "index": 0 }]]
    }
  },
  "active": true
}
```

### Ejemplo 3: Workflow Completo - Generar Contenido Educativo

```json
{
  "name": "Generar Contenido Educativo Completo",
  "nodes": [
    {
      "id": "webhook-entrada",
      "name": "Recibir Solicitud",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "position": [0, 300],
      "webhookId": "content-generation-uuid",
      "parameters": {
        "path": "content-generation-uuid",
        "httpMethod": "POST",
        "responseMode": "lastEntryData"
      }
    },
    {
      "id": "validar-entrada",
      "name": "Validar Datos",
      "type": "n8n-nodes-base.if",
      "typeVersion": 2,
      "position": [250, 300],
      "parameters": {
        "conditions": {
          "options": {
            "caseSensitive": true,
            "leftValue": "={{ $json.prompt }}",
            "operator": {
              "name": "filter.operator.isNotEmpty",
              "type": "string",
              "singleValue": true
            }
          }
        }
      }
    },
    {
      "id": "generar-titulo",
      "name": "OpenAI - Título",
      "type": "n8n-nodes-base.openai",
      "typeVersion": 4,
      "position": [500, 100],
      "parameters": {
        "model": "gpt-4",
        "temperature": 0.8,
        "maxTokens": 100,
        "messages": [
          {
            "role": "user",
            "content": "Crea 3 títulos atractivos para: {{ $json.prompt }}\nResponde solo los títulos, uno por línea"
          }
        ]
      },
      "credentials": {
        "openaiApi": "openai-api-key"
      }
    },
    {
      "id": "generar-descripcion",
      "name": "OpenAI - Descripción",
      "type": "n8n-nodes-base.openai",
      "typeVersion": 4,
      "position": [500, 300],
      "parameters": {
        "model": "gpt-4",
        "temperature": 0.7,
        "maxTokens": 500,
        "messages": [
          {
            "role": "user",
            "content": "Escribe una descripción de 200 palabras para un curso sobre: {{ $json.prompt }}"
          }
        ]
      },
      "credentials": {
        "openaiApi": "openai-api-key"
      }
    },
    {
      "id": "generar-objetivos",
      "name": "OpenAI - Objetivos",
      "type": "n8n-nodes-base.openai",
      "typeVersion": 4,
      "position": [500, 500],
      "parameters": {
        "model": "gpt-4",
        "temperature": 0.7,
        "maxTokens": 500,
        "messages": [
          {
            "role": "user",
            "content": "Crea 5-7 objetivos de aprendizaje específicos y medibles para: {{ $json.prompt }}\nFormato: lista numerada"
          }
        ]
      },
      "credentials": {
        "openaiApi": "openai-api-key"
      }
    },
    {
      "id": "compilar-resultado",
      "name": "Compilar Resultado",
      "type": "n8n-nodes-base.set",
      "typeVersion": 3,
      "position": [750, 300],
      "parameters": {
        "assignments": {
          "assignments": [
            {
              "name": "contenido",
              "type": "object",
              "value": "={{ { titulos: $('generar-titulo').item.json.response, descripcion: $('generar-descripcion').item.json.response, objetivos: $('generar-objetivos').item.json.response, fechaGeneracion: new Date().toISOString() } }}"
            }
          ]
        }
      }
    },
    {
      "id": "response-final",
      "name": "Enviar Respuesta",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "position": [1000, 300],
      "parameters": {
        "responseBody": "={{ { success: true, data: $json.contenido } }}"
      }
    },
    {
      "id": "error-handler",
      "name": "Manejar Error",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "position": [500, 700],
      "parameters": {
        "responseBody": "={{ { success: false, error: 'El prompt no puede estar vacío' } }}"
      }
    }
  ],
  "connections": {
    "webhook-entrada": {
      "main": [[{ "node": "validar-entrada", "type": "main", "index": 0 }]]
    },
    "validar-entrada": {
      "main": [
        [{ "node": "generar-titulo", "type": "main", "index": 0 }],
        [{ "node": "error-handler", "type": "main", "index": 0 }]
      ]
    },
    "generar-titulo": {
      "main": [[{ "node": "compilar-resultado", "type": "main", "index": 0 }]]
    },
    "generar-descripcion": {
      "main": [[{ "node": "compilar-resultado", "type": "main", "index": 0 }]]
    },
    "generar-objetivos": {
      "main": [[{ "node": "compilar-resultado", "type": "main", "index": 0 }]]
    },
    "compilar-resultado": {
      "main": [[{ "node": "response-final", "type": "main", "index": 0 }]]
    }
  },
  "active": true
}
```

### Ejemplo 4: Llamada desde Next.js al Webhook

```typescript
// src/app/api/generar-contenido/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, courseId, level = 'intermedio' } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'El prompt es requerido' },
        { status: 400 }
      );
    }

    // Llamar al webhook de n8n
    const n8nUrl =
      process.env.NODE_ENV === 'development'
        ? process.env.N8N_WEBHOOK_LOCAL
        : process.env.N8N_WEBHOOK_PROD;

    const n8nResponse = await fetch(n8nUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        courseId,
        level,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!n8nResponse.ok) {
      throw new Error(`n8n error: ${n8nResponse.statusText}`);
    }

    const result = await n8nResponse.json();

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error generando contenido:', error);
    return NextResponse.json(
      { error: 'Error generando contenido' },
      { status: 500 }
    );
  }
}
```

### Ejemplo 5: Actualizar Configuración de Credenciales

```bash
# Obtener credenciales existentes
curl -X GET https://n8n.srv1000134.hstgr.cloud/api/v1/credentials \
  -H "Authorization: Bearer YOUR_API_TOKEN"

# Actualizar credencial
curl -X PUT https://n8n.srv1000134.hstgr.cloud/api/v1/credentials/123 \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "apiKey": "sk-proj-NUEVA-KEY"
    }
  }'
```

---

## Checklist: Configuración Completa

- [ ] n8n instalado en `https://n8n.srv1000134.hstgr.cloud`
- [ ] OpenAI API Key configurada en variables de entorno
- [ ] Credencial OpenAI creada en n8n UI (Settings → Credentials)
- [ ] Webhook creado con UUID: `f71bd676-9eb3-4da9-beb8-8aab1c8dcdb7`
- [ ] Workflow importado y activado en n8n
- [ ] URL webhooks configuradas en `.env`:
  - [ ] `N8N_WEBHOOK_LOCAL` (desarrollo)
  - [ ] `N8N_WEBHOOK_PROD` (producción)
- [ ] API token de n8n generado y almacenado
- [ ] Conexión a base de datos Neon confirmada
- [ ] Tests de webhooks ejecutados exitosamente

---

## Troubleshooting Común

### ❌ Webhook retorna 404

```bash
# Verificar en n8n:
1. Ve a Workflows
2. Busca tu workflow
3. Verifica que esté en estado "Active" (verde)
4. Haz clic en "Execute Workflow" para activar el webhook
```

### ❌ Error de autenticación OpenAI

```json
{
  "error": {
    "message": "Incorrect API key provided",
    "type": "invalid_request_error"
  }
}
```

**Solución**:

1. Verifica que la API key sea válida en `.env`
2. En n8n, edita la credencial OpenAI
3. Recarga el browser

### ❌ Timeout en webhook

```bash
# n8n tardó más de 30 segundos
# Soluciones:
1. Usa modelo más rápido: gpt-3.5-turbo
2. Reduce maxTokens
3. Coloca timeout más alto en Next.js
```

### ❌ Respuesta vacía de OpenAI

```json
{
  "response": null
}
```

**Verificar**:

1. ¿Tienes suficientes tokens disponibles?
2. ¿La API key tiene permisos correctos?
3. ¿El prompt está siendo pasado correctamente?

---

## Recursos Adicionales

- [Documentación oficial n8n](https://docs.n8n.io)
- [API Reference n8n](https://docs.n8n.io/api)
- [OpenAI API Docs](https://platform.openai.com/docs)
- [n8n Community](https://community.n8n.io)
- [Workflow Templates n8n](https://n8n.io/workflows)

---

**Última actualización**: 30 de enero de 2026
**Estado**: Producción ✅
**Versión de n8n**: Latest
