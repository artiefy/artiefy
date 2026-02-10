# Guía Paso a Paso: Importar y Activar Workflows en n8n

## 🚀 Quick Start (5 minutos)

### Paso 1: Acceder a n8n

1. Abre `https://n8n.srv1000134.hstgr.cloud` en el navegador
2. Inicia sesión con tus credenciales
3. Ve a **Workflows** en el menú principal

---

## 📋 Opción A: Importar vía JSON (Recomendado)

### Paso 1: Descarga el archivo JSON

Descarga uno de los archivos disponibles:

- `workflow-generate-titles.json` (Generar títulos)
- `workflow-generate-descriptions.json` (Generar descripciones)
- `workflow-complete-content-generation.json` (Contenido completo)

Están en: `Docs/n8n_workflows/`

### Paso 2: Importar en n8n UI

**Método A: Desde archivo**

1. En n8n, haz clic en **"+"** (crear nuevo workflow)
2. Selecciona **"Import from file"**
3. Selecciona el archivo JSON descargado
4. Automáticamente se importará con todos los nodos

**Método B: Copiar/Pegar JSON**

1. Abre el archivo JSON con un editor de texto
2. Copia todo el contenido (Ctrl+A, Ctrl+C)
3. En n8n, haz clic en **"+"** → **"Paste workflow data"**
4. Pega el JSON (Ctrl+V)
5. Haz clic en **"Import"**

### Paso 3: Configurar Credenciales

#### 3.1 OpenAI API Key

1. Haz clic en los nodos OpenAI (verás nodos de color anaranjado)
2. En el panel derecho, busca **"Credentials"**
3. Haz clic en el selector de credenciales
4. Selecciona **"openai-api-key"** (si existe)
5. Si no existe, haz clic en **"Create New"**
   - Nombre: `openai-api-key`
   - API Key: Pega tu `OPENAI_API_KEY` de `.env`
6. Haz clic en **"Save"**

#### 3.2 Base de Datos (Si el workflow lo requiere)

Si el workflow tiene nodo **Postgres**:

1. Busca el nodo Postgres en el canvas
2. Haz clic en el selector de credenciales
3. **"Create New"** → **"Postgres"**
4. Completa los datos:
   ```
   Host: neon.tech (o tu host)
   Port: 5432
   Database: tu-base-datos
   User: tu-usuario
   Password: tu-contraseña
   SSL: Enable
   ```
5. Haz clic en **"Test Connection"**
6. Si es exitoso, haz clic en **"Save"**

### Paso 4: Verificar Nodos

Revisa que todos los nodos tengan credenciales (sin puntos rojos):

**Nodo Webhook:**

- Ruta: `f71bd676-9eb3-4da9-beb8-8aab1c8dcdb7`
- Método: `POST`
- Response Mode: `responseNode`

**Nodo OpenAI:**

- Credencial: ✅ `openai-api-key`
- Modelo: `gpt-4` (o tu preferencia)
- Temperatura: `0.7-0.85`

**Nodo Postgres (opcional):**

- Credencial: ✅ Conectada
- Tabla: Especificada

### Paso 5: Activar Workflow

1. **Haz clic en el botón PLAY verde** (esquina superior derecha)
2. O usa la tecla **`Ctrl + Enter`**
3. El estado debe cambiar a **"Active"** (verde)
4. El webhook está listo para recibir solicitudes

### Paso 6: Probar el Webhook

#### Opción A: Desde n8n

1. Haz clic en el nodo **Webhook**
2. Haz clic en **"Test"** (esquina superior derecha)
3. En la sección **"Test data"**, pega:

```json
{
  "prompt": "Crear un curso de Python",
  "level": "intermedio"
}
```

4. Haz clic en **"Send Test Request"**
5. Revisa la salida en el panel derecho

#### Opción B: Desde Terminal

```bash
# Linux/Mac
curl -X POST http://localhost:5678/webhook-test/f71bd676-9eb3-4da9-beb8-8aab1c8dcdb7 \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Crear un curso de Python",
    "level": "intermedio"
  }'

# Windows (PowerShell)
$body = @{
    prompt = "Crear un curso de Python"
    level = "intermedio"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:5678/webhook-test/f71bd676-9eb3-4da9-beb8-8aab1c8dcdb7" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body $body

Write-Host $response.Content
```

#### Opción C: Desde Postman

1. Abre Postman
2. Crea nueva request: `POST`
3. URL: `http://localhost:5678/webhook-test/f71bd676-9eb3-4da9-beb8-8aab1c8dcdb7`
4. Headers: `Content-Type: application/json`
5. Body (raw JSON):

```json
{
  "prompt": "Curso de Python",
  "level": "intermedio"
}
```

6. Haz clic en **"Send"**

---

## 📋 Opción B: Crear Manualmente Desde Cero

### Paso 1: Crear Nuevo Workflow

1. Haz clic en **"+"** (crear workflow)
2. Dale un nombre: "Generar Títulos"
3. Haz clic en **"Create"**

### Paso 2: Agregar Nodo Webhook

1. Haz clic en el **"+"** en el canvas
2. Busca **"Webhook"**
3. Selecciona **"Webhook"** (n8n-nodes-base.webhook)
4. Configura:
   - Path: `f71bd676-9eb3-4da9-beb8-8aab1c8dcdb7`
   - HTTP Method: `POST`
   - Response Mode: `responseNode`

### Paso 3: Agregar Nodo OpenAI

1. Haz clic en **"+"**
2. Busca **"OpenAI"**
3. Selecciona **"OpenAI"**
4. Configura:
   - Model: `gpt-4`
   - Temperature: `0.8`
   - Max Tokens: `500`
   - Messages:

     ```
     Role: system
     Content: Eres un experto creando títulos para cursos...

     Role: user
     Content: {{ $json.prompt }}
     ```

5. Selecciona credencial OpenAI

### Paso 4: Agregar Nodo Response

1. Haz clic en **"+"**
2. Busca **"Respond to Webhook"**
3. Configura Response Body:

```javascript
{{ { success: true, data: $json } }}
```

### Paso 5: Conectar Nodos

1. Haz clic en el círculo de salida del **Webhook**
2. Arrastra a la entrada del **OpenAI**
3. Haz clic en el círculo de salida de **OpenAI**
4. Arrastra a la entrada de **Response**

### Paso 6: Guardar y Activar

1. Haz clic en **"Save"**
2. Haz clic en el botón **PLAY** verde
3. El workflow está **Active**

---

## 🔗 Conectar Next.js con n8n

### Paso 1: Verificar Variables de Entorno

En `.env` confirma que tengas:

```bash
N8N_WEBHOOK_LOCAL=http://localhost:5678/webhook-test/f71bd676-9eb3-4da9-beb8-8aab1c8dcdb7
N8N_WEBHOOK_PROD=https://n8n.srv1000134.hstgr.cloud/webhook/f71bd676-9eb3-4da9-beb8-8aab1c8dcdb7
```

### Paso 2: Crear Endpoint en Next.js

Crea `src/app/api/content/generate/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'El prompt es requerido' },
        { status: 400 }
      );
    }

    // Seleccionar webhook según entorno
    const webhookUrl =
      process.env.NODE_ENV === 'development'
        ? process.env.N8N_WEBHOOK_LOCAL
        : process.env.N8N_WEBHOOK_PROD;

    if (!webhookUrl) {
      throw new Error('Webhook no configurado');
    }

    // Llamar a n8n
    const n8nResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
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
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Error generando contenido' },
      { status: 500 }
    );
  }
}
```

### Paso 3: Probar desde Next.js

```bash
# Inicia el servidor
npm run dev

# En otra terminal, prueba el endpoint
curl -X POST http://localhost:3000/api/content/generate \
  -H "Content-Type: application/json" \
  -d '{ "prompt": "Curso de JavaScript" }'
```

Deberías recibir:

```json
{
  "success": true,
  "data": {
    "response": "..."
  }
}
```

---

## 🐛 Troubleshooting

### ❌ Error: "Webhook not registered"

**Problema:** El webhook no está activado en n8n

**Solución:**

1. Abre el workflow en n8n
2. Verifica que el botón PLAY esté **verde** (Active)
3. Si no, haz clic en el botón PLAY
4. Espera 2-3 segundos
5. Intenta de nuevo

### ❌ Error: "Invalid API key"

**Problema:** La credencial OpenAI no es válida

**Solución:**

1. Ve a Settings → Credentials
2. Busca "openai-api-key"
3. Edita y verifica que la API key comience con `sk-proj-`
4. Guarda los cambios
5. Reactiva el workflow

### ❌ Error 404 en webhook

**Problema:** El path del webhook es incorrecto

**Solución:**

1. En n8n, edita el nodo Webhook
2. Verifica el **path**: `f71bd676-9eb3-4da9-beb8-8aab1c8dcdb7`
3. Verifica que coincida con tu `.env`
4. Guarda el workflow
5. Reactiva

### ❌ Timeout (>30 segundos)

**Problema:** OpenAI está tardando demasiado

**Solución:**

1. En OpenAI, reduce `maxTokens` a 300-400
2. Usa modelo `gpt-3.5-turbo` en lugar de `gpt-4`
3. Reduce `temperature` a 0.5
4. En Next.js, aumenta el timeout:

```typescript
signal: AbortSignal.timeout(60000); // 60 segundos
```

### ❌ Base de datos no conecta

**Problema:** La credencial Postgres es incorrecta

**Solución:**

1. Edita la credencial Postgres
2. Haz clic en **"Test Connection"**
3. Verifica que la conexión sea exitosa
4. Si no, revisa:
   - Host correcto
   - Puerto: 5432
   - Credenciales del usuario
   - SSL habilitado
   - Base de datos existe

---

## 📊 Monitoreo de Workflows

### Ver Ejecuciones

1. Ve al workflow
2. Haz clic en **"Executions"** (parte superior)
3. Verás un historial de todas las ejecuciones

### Ver Logs

1. En la lista de ejecuciones, haz clic en una ejecución
2. Verás los logs de cada nodo
3. Expand cada nodo para ver entrada/salida

### Configurar Alertas

1. Ve a Settings → Notifications
2. Haz clic en **"Add Notification"**
3. Configura:
   - When: "Workflow execution fails"
   - Send to: Email o Slack
4. Guarda

---

## 📈 Escalabilidad

### Aumentar Límite de Ejecuciones

En `Settings → General`:

```
Max Concurrent Executions: 10
Max Execution Timeout: 600 (segundos)
```

### Usar Queue para Muchas Solicitudes

Si tienes muchas solicitudes:

1. Agrega nodo **"Queue"** después del Webhook
2. El workflow procesará secuencialmente

### Load Balancing

Para producción con alto volumen:

1. Crea múltiples instancias de n8n
2. Usa un balanceador de carga (nginx, HAProxy)
3. Distribuye solicitudes entre instancias

---

## ✅ Checklist Final

- [ ] Acceso a n8n confirmado
- [ ] Credencial OpenAI creada
- [ ] Workflow importado o creado
- [ ] Workflow está ACTIVE (botón verde)
- [ ] Webhook probado exitosamente
- [ ] Endpoint Next.js creado
- [ ] Llamada desde Next.js funciona
- [ ] Logs muestran solicitudes exitosas
- [ ] Base de datos guarda resultados
- [ ] Error handling implementado
- [ ] Monitoreo configurado
- [ ] Variables de entorno en `.env.production`

---

**¡Listo! Tu integración n8n + OpenAI está lista para producción** 🎉

Para soporte adicional, consulta:

- [n8n Docs](https://docs.n8n.io)
- [OpenAI Docs](https://platform.openai.com/docs)
- Archivos en `Docs/N8N_*.md`
