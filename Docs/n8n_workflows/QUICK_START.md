# 🚀 Guía Rápida: Integración n8n + IA en Artiefy

## ✅ Lo que ya está hecho:

- ✅ Hook `useGenerateContent` creado y conectado
- ✅ Botones "Generar con IA" funcionales en el modal
- ✅ Manejo de errores implementado
- ✅ Estados de carga (loading) implementados
- ✅ Workflows JSON listos para importar (títulos, descripciones, justificaciones, objetivos)

## 📋 Pasos para completar:

### Paso 1: Configurar variables de entorno

En tu archivo `.env.local` (o `.env.production`):

```env
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://n8n.srv1000134.hstgr.cloud/webhook/artiefy-generate-content
```

### Paso 2: Acceder a tu instancia de n8n

- URL: https://n8n.srv1000134.hstgr.cloud
- Inicia sesión con tus credenciales

### Paso 3: Configurar credenciales de OpenAI

1. Haz clic en **Settings** (⚙️) abajo a la izquierda
2. Selecciona **Credentials** → **New**
3. Busca **OpenAI**
4. Completa:
   - **Credential Name**: `OpenAI - Artiefy`
   - **API Key**: Tu API Key de OpenAI
5. Haz clic en **Save**

### Paso 4: Importar el workflow

1. Haz clic en **+** (Nuevo workflow)
2. Selecciona **Menu** → **Import from file**
3. Busca el archivo principal: `workflow-generate-ia-content.json`
4. Opcional: importa también `workflow-generate-justifications.json` y `workflow-generate-objectives.json`
5. El/los workflow(s) se crearán automáticamente

### Paso 5: Activar el webhook

1. En el nodo **Webhook** del workflow
2. Haz clic en **Save & Activate**
3. Copia la **Webhook URL** completa
4. Asegúrate que sea `https://n8n.srv1000134.hstgr.cloud/webhook/artiefy-generate-content`

### Paso 6: Verificar que todo funciona

```bash
# Terminal
curl -X POST https://n8n.srv1000134.hstgr.cloud/webhook/artiefy-generate-content \
  -H "Content-Type: application/json" \
  -d '{
    "type": "titulo",
    "prompt": "Una aplicación para gestionar tareas escolares"
  }'
```

Deberías recibir:

```json
{
  "success": true,
  "type": "titulo",
  "content": "... contenido generado por IA ...",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Paso 7: Probar desde el frontend

1. Inicia tu app: `npm run dev`
2. Abre el modal de crear proyecto
3. Completa algunos campos
4. Haz clic en "Generar con IA"
5. Verifica que se llene automáticamente

## 🔧 Estructura del Código

### `useGenerateContent` Hook

```typescript
// Ubicación: src/hooks/useGenerateContent.ts
const { generateContent, isGenerating, error, clearError } =
  useGenerateContent();

// Uso:
const content = await generateContent({
  type: 'titulo' | 'descripcion' | 'justificacion' | 'objetivoGen',
  prompt: 'Tu prompt aquí',
});
```

### Funciones en ModalResumen.tsx

```typescript
// Generar título basado en descripción
await handleGenerateTitulo();

// Generar descripción basado en título
await handleGenerateDescripcion();

// Generar justificación
await handleGenerateJustificacion();

// Generar objetivo general
await handleGenerateObjetivoGen();
```

### Tipos de Contenido Soportados

- `titulo`: Genera títulos de proyectos
- `descripcion`: Genera descripciones/planteamientos
- `justificacion`: Genera justificaciones
- `objetivoGen`: Genera objetivos generales
- `objetivosEsp`: Genera objetivos específicos (implementar en siguiente fase)

## 📊 Monitoreo

### Ver logs en n8n

1. Abre el workflow en n8n
2. Haz clic en **Executions** (arriba a la derecha)
3. Verifica cada ejecución
4. Ve el detalle de cada nodo

### Ver logs en Next.js

```bash
npm run dev
# Busca en consola: "Error en generateContent:" o mensajes del hook
```

### Errores Comunes

**Error: "URL de webhook de n8n no configurada"**

- Verifica que `NEXT_PUBLIC_N8N_WEBHOOK_URL` esté en `.env.local`
- Reinicia el servidor: `npm run dev`

**Error: "API Key not valid"**

- Verifica que la API Key sea correcta en OpenAI
- Comprueba en n8n que la credencial esté guardada
- Asegúrate que el nodo OpenAI use esa credencial

**Error: "Connection timeout"**

- Verifica la conectividad a `https://n8n.srv1000134.hstgr.cloud`
- Revisa el estado de tu VPS en Hostinger
- Prueba en Postman/cURL

**El contenido generado no aparece**

- Abre Developer Tools (F12) → Network
- Verifica que la llamada a n8n sea exitosa (200 OK)
- Comprueba que la respuesta tenga `"success": true`
- Revisa la consola de errores

## 🎯 Próximas Mejoras

### Fase 2: Objetivos Específicos

- [ ] Agregar generación de objetivos específicos
- [ ] Permitir generar múltiples opciones
- [ ] Seleccionar la mejor sugerencia

### Fase 3: Actividades

- [ ] Generar actividades desde objetivos
- [ ] Distribuir automáticamente en cronograma
- [ ] Estimar duraciones con IA

### Fase 4: Refinamiento

- [ ] Agregar control de temperatura (creatividad)
- [ ] Permitir ajustar tono (formal, casual, técnico)
- [ ] Historial de generaciones
- [ ] Opciones de regeneración

## 📞 Soporte Rápido

Si algo no funciona:

1. Verifica la consola del navegador (F12)
2. Revisa los logs de n8n
3. Prueba el endpoint en cURL
4. Asegúrate que `NEXT_PUBLIC_N8N_WEBHOOK_URL` sea correcta
5. Reinicia el servidor de Next.js

## ✨ Características Actuales

✅ **Botón 1**: "Generar con IA" → Genera descripción basada en título  
✅ **Botón 2**: "Generar con IA" → Genera título basado en descripción  
✅ **Manejo de errores**: Muestra mensajes si algo falla  
✅ **Estados de carga**: Botones deshabilitados mientras se genera  
✅ **Validaciones**: Requiere contenido mínimo en prompts  
✅ **Integración limpia**: Sin afectar código existente

## 🚀 Despliegue a Producción

Cuando todo funcione localmente:

1. Actualiza `.env.production` con la URL de n8n correcta
2. Verifica que la API Key de OpenAI sea válida en producción
3. Deploy a Vercel (u tu plataforma)
4. Prueba la generación en producción

---

**Estado**: ✅ Listo para usar
**Última actualización**: $(date)
**Versión**: 1.0
