# Configuración de n8n para Artiefy - Generación de Contenido IA

## 🎯 Objetivo

Crear un workflow en n8n que integre OpenAI para generar contenido educativo (títulos, descripciones, objetivos) automáticamente desde los botones "Generar con IA" en el modal de Artiefy.

## 📋 Requisitos Previos

- Acceso a tu instancia de n8n: `https://n8n.srv1000134.hstgr.cloud`
- API Key de OpenAI: `<OPENAI_API_KEY>`
- Proyecto Next.js actualizado (ModalResumen.tsx)

## 🔧 Paso 1: Configurar Credenciales de OpenAI en n8n

### Opción A: Desde la UI de n8n

1. Accede a tu instancia: `https://n8n.srv1000134.hstgr.cloud`
2. Haz clic en **Settings** (⚙️) en la esquina inferior izquierda
3. Selecciona **Credentials** → **New**
4. Busca y selecciona **OpenAI**
5. Completa los campos:
   - **Credential Name**: `OpenAI - Artiefy`

- **API Key**: `<OPENAI_API_KEY>`

6. Haz clic en **Save**

### Opción B: Desde archivo de configuración

Si prefieres automatizar, crea un archivo `.env` en n8n con:

```
OPENAI_API_KEY=<OPENAI_API_KEY>
```

## 📥 Paso 2: Importar el Workflow

### Opción A: Importar desde archivo JSON

1. Descarga el archivo: `workflow-generate-ia-content.json`
2. En n8n, haz clic en **+** (crear nuevo workflow)
3. Selecciona **Menu** → **Import from file**
4. Selecciona el archivo JSON descargado
5. El workflow se importará automáticamente

### Opción B: Crear manualmente

1. **Crear nuevo workflow**:
   - Haz clic en **+** en n8n
   - Nombre: `Generate IA Content - Artiefy`

2. **Agregar nodo Webhook**:
   - Busca y arrastra **Webhook** al canvas
   - Configura:
     - **Method**: POST
     - **Path**: `/webhook/generate-content`
     - **Save & Activate**: activa el webhook
     - Copia la **Webhook URL** (la necesitarás para el frontend)

3. **Agregar nodo Set**:
   - Arrastra **Set** al canvas
   - Conecta desde Webhook
   - Configura para pasar los datos JSON tal cual

4. **Agregar nodo OpenAI**:
   - Busca y arrastra **OpenAI** al canvas
   - Conecta desde Set
   - Configura:
     - **Model**: gpt-4
     - **Temperature**: 0.7
     - **Max tokens**: 500
     - **Messages**:
       ```
       Role: User
       Content: "You are an expert in creating educational content. Generate a high-quality {{ $json.type || 'description' }} based on: {{ $json.prompt }}. Be concise and professional."
       ```

5. **Agregar nodo Response**:
   - Arrastra **Webhook Response** al canvas
   - Conecta desde OpenAI
   - **Status Code**: 200
   - **Body**:
     ```json
     {
       "success": true,
       "type": "{{ $json.type }}",
       "content": "{{ $json.choices[0].message.content }}",
       "timestamp": "{{ now() }}"
     }
     ```

6. **Agregar Error Handling**:
   - Arrastra otro **Webhook Response** para errores
   - Conecta el nodo catch de OpenAI a este
   - **Status Code**: 500
   - **Body**:
     ```json
     {
       "success": false,
       "error": "{{ $error.message }}"
     }
     ```

## 🔑 Paso 3: Obtener la Webhook URL

Una vez el workflow esté activo:

1. En n8n, abre el nodo **Webhook**
2. Copia la **Webhook URL** completa
3. Te dará algo como: `https://n8n.srv1000134.hstgr.cloud/webhook/artiefy-generate-content`

## 🎨 Paso 4: Integrar con el Frontend (Next.js)

### Actualizar ModalResumen.tsx

Reemplaza los botones "Generar con IA" con llamadas a n8n:

```typescript
// En las variables de ambiente
export const N8N_WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL;

// Función para generar contenido con IA
const generateContentWithAI = async (type: 'titulo' | 'descripcion', prompt: string) => {
  try {
    setIsGenerating(true);
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type,
        prompt,
        timestamp: new Date().toISOString(),
      }),
    });

    const data = await response.json();

    if (data.success) {
      // Actualizar el campo correspondiente
      if (type === 'titulo') {
        setFormData(prev => ({ ...prev, titulo: data.content }));
      } else if (type === 'descripcion') {
        setFormData(prev => ({ ...prev, planteamiento: data.content }));
      }

      // Toast de éxito
      toast.success(`Contenido generado: ${type}`);
    } else {
      toast.error(`Error: ${data.error}`);
    }
  } catch (error) {
    console.error('Error generando contenido:', error);
    toast.error('Error al generar contenido');
  } finally {
    setIsGenerating(false);
  }
};

// En los botones
<button
  onClick={() => generateContentWithAI('titulo', formData.planteamiento)}
  disabled={isGenerating}
  className="px-4 py-2 bg-cyan-500 text-white rounded hover:bg-cyan-600 disabled:opacity-50"
>
  {isGenerating ? 'Generando...' : 'Generar con IA'}
</button>
```

### Actualizar variables de entorno

En `.env.local`:

```
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://n8n.srv1000134.hstgr.cloud/webhook/artiefy-generate-content
```

## ✅ Paso 5: Pruebas

### Test desde Postman o cURL

```bash
curl -X POST https://n8n.srv1000134.hstgr.cloud/webhook/artiefy-generate-content \
  -H "Content-Type: application/json" \
  -d '{
    "type": "titulo",
    "prompt": "Un proyecto sobre inteligencia artificial en educación"
  }'
```

### Test desde el Frontend

1. Abre el modal de crear proyecto
2. Completa algunos campos
3. Haz clic en "Generar con IA"
4. Verifica que el contenido se genere

## 📊 Monitoreo

### Ver ejecuciones en n8n

1. En n8n, abre el workflow
2. Haz clic en **Executions** (arriba a la derecha)
3. Verifica las ejecuciones y sus resultados

### Logs en Next.js

```bash
npm run dev
# Busca logs con "generateContentWithAI"
```

## 🐛 Troubleshooting

### Error: "API Key not valid"

- Verifica que la API Key sea correcta
- Comprueba que esté configurada en n8n Credentials
- Asegúrate que la credencial esté seleccionada en el nodo OpenAI

### Error: "Webhook URL not found"

- Verifica que el webhook esté **activo**
- Copia nuevamente la URL del nodo Webhook
- Asegúrate que sea POST

### Error: "Connection timeout"

- Verifica la conectividad a n8n
- Comprueba el estado de tu VPS en Hostinger
- Revisa los logs de n8n

### El contenido generado no se actualiza

- Verifica la respuesta en Network del navegador
- Comprueba que el campo correcto en `setFormData` sea actualizado
- Verifica la estructura de `$json.choices[0].message.content` en OpenAI

## 📝 Modelos Disponibles de OpenAI

Para cambiar el modelo, edita el nodo OpenAI:

- `gpt-4-turbo`: Mejor para tareas complejas (más caro, más rápido)
- `gpt-4`: Mejor balance calidad/precio (recomendado)
- `gpt-3.5-turbo`: Más barato, menos preciso

## 🚀 Optimizaciones Futuras

1. **Agregar validación de prompts**:

   ```typescript
   if (prompt.length < 10) {
     toast.error('El prompt debe tener al menos 10 caracteres');
     return;
   }
   ```

2. **Agregar historial de generaciones**:
   - Guardar en base de datos cada generación
   - Permitir ver historial de versiones

3. **Agregar refinamiento de contenido**:
   - Permitir "regenerar" con diferentes temperaturas
   - Permitir "ajustar tono" (formal, casual, técnico)

4. **Analytics**:
   - Contar cuántas generaciones se hacen
   - Medir tiempo de generación
   - Rastrear cambios del usuario después de generación

## 📞 Soporte

Si tienes problemas:

1. Revisa los logs en n8n: Menu → Execution
2. Verifica las credenciales de OpenAI
3. Comprueba la conectividad de red
4. Revisa la consola del navegador (F12)
