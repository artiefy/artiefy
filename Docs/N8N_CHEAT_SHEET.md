# n8n + OpenAI: Referencia Rápida (Cheat Sheet)

## 🚀 Quick Commands

### URLs Importantes

```
n8n Dashboard:    https://n8n.srv1000134.hstgr.cloud
n8n Local:        http://localhost:5678
OpenAI Platform:  https://platform.openai.com
Documentación:    https://docs.n8n.io
```

### Webhooks

```
Production:  https://n8n.srv1000134.hstgr.cloud/webhook/f71bd676-9eb3-4da9-beb8-8aab1c8dcdb7
Local:       http://localhost:5678/webhook-test/f71bd676-9eb3-4da9-beb8-8aab1c8dcdb7
```

---

## 📡 Webhooks - Test Rápido

```bash
# Test simple
curl -X POST http://localhost:5678/webhook-test/f71bd676-9eb3-4da9-beb8-8aab1c8dcdb7 \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Curso de Python"}'

# Con payload completo
curl -X POST https://n8n.srv1000134.hstgr.cloud/webhook/f71bd676-9eb3-4da9-beb8-8aab1c8dcdb7 \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Machine Learning",
    "level": "avanzado",
    "courseId": 42,
    "sessionId": "session-123"
  }'
```

---

## 🔐 Variables de Entorno Esenciales

```bash
# Agregar a .env
N8N_WEBHOOK_LOCAL=http://localhost:5678/webhook-test/f71bd676-9eb3-4da9-beb8-8aab1c8dcdb7
N8N_WEBHOOK_PROD=https://n8n.srv1000134.hstgr.cloud/webhook/f71bd676-9eb3-4da9-beb8-8aab1c8dcdb7
OPENAI_API_KEY=sk-proj-...
POSTGRES_URL=postgresql://...
```

---

## 🔧 Crear Workflow en n8n (30 segundos)

1. **Workflow → "+" → "Create"**
2. **Agregar nodo Webhook**
   - Path: `f71bd676-9eb3-4da9-beb8-8aab1c8dcdb7`
   - HTTP Method: `POST`
3. **Agregar nodo OpenAI**
   - Model: `gpt-4`
   - Credential: `openai-api-key`
4. **Agregar nodo Response**
   - Body: `{{ { success: true, data: $json } }}`
5. **Conectar:** Webhook → OpenAI → Response
6. **Play (verde)** → Listo

---

## 💬 OpenAI Models Rápidos

| Modelo        | Velocidad | Costo | Uso Ideal                 |
| ------------- | --------- | ----- | ------------------------- |
| gpt-4         | Lento     | Alto  | Análisis, creatividad     |
| gpt-4-turbo   | Medio     | Medio | Balance calidad/velocidad |
| gpt-3.5-turbo | Rápido    | Bajo  | Producción masiva         |

---

## 🎯 Parámetros OpenAI Comunes

```json
{
  "model": "gpt-4",
  "temperature": 0.7, // 0=fijo, 1=normal, 2=créativo
  "maxTokens": 1000, // 1 token ≈ 4 caracteres
  "topP": 1, // 0-1, nucleus sampling
  "frequencyPenalty": 0, // 0-2, evita repetición
  "presencePenalty": 0 // 0-2, cubre temas nuevos
}
```

**Presets:**

- **Determinista:** temp=0, topP=1, penalties=0
- **Creativo:** temp=1.2, topP=0.9, penalties=0.5
- **Balanceado:** temp=0.7, topP=1, penalties=0

---

## 📝 Expresiones en n8n

```javascript
// Acceder a datos
$json.prompt; // Campo prompt del webhook
$json.courseId; // Campo courseId
$('nodo-name').item.json; // Salida de otro nodo

// Transformaciones
{
  {
    $json.prompt.toUpperCase();
  }
}
{
  {
    JSON.stringify($json);
  }
}
{
  {
    new Date().toISOString();
  }
}
{
  {
    $json.prompt || 'default';
  }
}
{
  {
    $json.items.map((i) => i.name);
  }
}

// Condicionales
{
  {
    $json.level === 'advanced' ? 'gpt-4' : 'gpt-3.5-turbo';
  }
}
```

---

## 🚨 Errores Comunes y Soluciones

| Error              | Causa               | Solución                                  |
| ------------------ | ------------------- | ----------------------------------------- |
| 404 Not Found      | Webhook no activo   | Haz click en Play (verde)                 |
| 401 Unauthorized   | API key inválida    | Verifica `OPENAI_API_KEY` en `.env`       |
| Invalid API Key    | Credencial expirada | Regenera key en OpenAI platform           |
| Timeout (>30s)     | OpenAI muy lento    | Reduce `maxTokens`, usa modelo más rápido |
| No data in webhook | Request mal formado | Valida JSON, incluye campo `prompt`       |
| Database error     | Credencial Postgres | Haz Test Connection en n8n                |

---

## 📊 Estructura Básica de Request

```json
{
  "prompt": "string - requerido",
  "level": "basico|intermedio|avanzado",
  "courseId": "number - opcional",
  "courseTitle": "string - opcional",
  "sessionId": "string - auto-generated",
  "timestamp": "ISO 8601 - auto"
}
```

---

## 📤 Estructura Básica de Response

```json
{
  "success": true,
  "generatedAt": "2026-01-30T15:30:00Z",
  "data": {
    "titulos": ["titulo1", "titulo2"],
    "descripcion": "text...",
    "objetivos": ["obj1", "obj2"]
  }
}
```

---

## 🔌 Conectar con Next.js (Mínimo)

```typescript
// src/app/api/generate/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { prompt } = await request.json();

  const webhook =
    process.env.NODE_ENV === 'production'
      ? process.env.N8N_WEBHOOK_PROD
      : process.env.N8N_WEBHOOK_LOCAL;

  const res = await fetch(webhook!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });

  return NextResponse.json(await res.json());
}
```

---

## 🎨 Hook React (Mínimo)

```typescript
import { useState } from 'react';

export function useGenerator() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const generate = async (prompt: string) => {
    setLoading(true);
    const res = await fetch('/api/generate', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    });
    setResult(await res.json());
    setLoading(false);
  };

  return { generate, loading, result };
}
```

---

## 🐳 Docker (Opcional)

```bash
# Descargar imagen
docker pull n8nio/n8n:latest

# Ejecutar n8n
docker run -d \
  -p 5678:5678 \
  -v n8n_data:/home/node/.n8n \
  -e NODE_ENV=production \
  n8nio/n8n

# Acceder
# http://localhost:5678
```

---

## 🔄 API de n8n (Para Automatización)

```bash
# Listar workflows
curl -X GET https://n8n.srv1000134.hstgr.cloud/api/v1/workflows \
  -H "Authorization: Bearer YOUR_API_TOKEN"

# Obtener workflow específico
curl -X GET https://n8n.srv1000134.hstgr.cloud/api/v1/workflows/123 \
  -H "Authorization: Bearer YOUR_API_TOKEN"

# Ejecutar workflow
curl -X POST https://n8n.srv1000134.hstgr.cloud/api/v1/workflows/123/execute \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"data": {}}'

# Activar workflow
curl -X POST https://n8n.srv1000134.hstgr.cloud/api/v1/workflows/123/activate \
  -H "Authorization: Bearer YOUR_API_TOKEN"

# Desactivar workflow
curl -X POST https://n8n.srv1000134.hstgr.cloud/api/v1/workflows/123/deactivate \
  -H "Authorization: Bearer YOUR_API_TOKEN"
```

---

## 📊 Monitoreo Rápido

```bash
# Revisar logs en producción
docker logs n8n

# Revisar ejecuciones
curl -X GET https://n8n.srv1000134.hstgr.cloud/api/v1/executions \
  -H "Authorization: Bearer YOUR_API_TOKEN"

# Revisar salud de n8n
curl https://n8n.srv1000134.hstgr.cloud/api/v1/workflows \
  -H "Authorization: Bearer YOUR_API_TOKEN"
```

---

## 💾 Backup y Restauración

```bash
# Exportar workflow
curl -X GET https://n8n.srv1000134.hstgr.cloud/api/v1/workflows/123 \
  -H "Authorization: Bearer YOUR_API_TOKEN" > workflow.json

# Importar workflow
curl -X POST https://n8n.srv1000134.hstgr.cloud/api/v1/workflows \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d @workflow.json
```

---

## 🎯 Casos de Uso Comunes

### Generar Contenido

```
Webhook → OpenAI → Response
```

### Generar + Guardar

```
Webhook → OpenAI → Postgres → Response
```

### Generar en Paralelo

```
     ↙ OpenAI (Título)
Webhook → OpenAI (Descripción) → Merge → Response
     ↘ OpenAI (Objetivos)
```

### Con Validación

```
Webhook → If (Valida) → OpenAI → Response
                   ↘ Error Response
```

---

## 🚀 Deploy Rápido a Producción

1. **Actualiza `.env.production`:**

   ```bash
   N8N_WEBHOOK_PROD=https://...
   OPENAI_API_KEY=sk-proj-...
   POSTGRES_URL=postgresql://...
   ```

2. **Push a git:**

   ```bash
   git add .env.production
   git commit -m "Update env for production"
   git push
   ```

3. **Redeploy en Vercel/hosting:**
   - Vercel auto-detecta cambios
   - Variables actualizadas automáticamente

---

## ✅ Checklist Pre-Launch

- [ ] Webhooks probados ✓
- [ ] OpenAI API key válida ✓
- [ ] Todas las credenciales en n8n ✓
- [ ] Workflows en estado ACTIVE ✓
- [ ] Variables `.env.production` seteadas ✓
- [ ] Next.js endpoints funcionan ✓
- [ ] Error handling implementado ✓
- [ ] Logs configurados ✓
- [ ] Rate limiting implementado ✓
- [ ] Tests end-to-end ejecutados ✓

---

## 📚 Documentos Completos

- 📖 [N8N_WORKFLOWS_GUIDE.md](N8N_WORKFLOWS_GUIDE.md) - Guía teórica completa
- 🚀 [N8N_SETUP_STEP_BY_STEP.md](N8N_SETUP_STEP_BY_STEP.md) - Pasos detallados
- 💻 [N8N_IMPLEMENTATION_EXAMPLES.md](N8N_IMPLEMENTATION_EXAMPLES.md) - Código real
- 🔐 [N8N_ENVIRONMENT_VARIABLES.md](N8N_ENVIRONMENT_VARIABLES.md) - Configuración
- 📚 [N8N_COMPLETE_DOCUMENTATION.md](N8N_COMPLETE_DOCUMENTATION.md) - Índice completo

---

## 🎓 Comandos n8n CLI (Avanzado)

```bash
# Instalar n8n localmente
npm install -g n8n

# Iniciar n8n
n8n

# Exportar credentials
n8n export:credentials

# Importar credentials
n8n import:credentials

# Listar workflows
n8n list:workflows
```

---

## 🔗 Links Útiles

| Recurso       | URL                              |
| ------------- | -------------------------------- |
| n8n Docs      | https://docs.n8n.io              |
| n8n API       | https://docs.n8n.io/api          |
| OpenAI Docs   | https://platform.openai.com/docs |
| n8n Community | https://community.n8n.io         |
| n8n Discord   | https://discord.gg/nGkJDpV       |
| GitHub n8n    | https://github.com/n8n-io/n8n    |

---

## 💡 Tips Pro

✅ **Siempre valida entrada** con nodo "If"
✅ **Usa "Set" node** para transformar datos
✅ **Prueba workflows** antes de activar
✅ **Monitorea ejecuciones** regularmente
✅ **Haz backup** de workflows importantes
✅ **Usa expresiones** en lugar de hard-coding
✅ **Implementa rate limiting** en producción
✅ **Cacha respuestas** cuando sea posible
✅ **Rota API keys** cada 90 días
✅ **Documenta workflows** con comentarios

---

**¡Listo para usar!** 🎉
Guarda este archivo como referencia rápida mientras trabajas.
