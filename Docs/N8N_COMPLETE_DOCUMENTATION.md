# 📚 n8n + OpenAI: Documentación Completa

## 🎯 Índice de Documentos

### 1. **N8N_WORKFLOWS_GUIDE.md** ⭐ EMPEZAR AQUÍ

- ✅ Introducción a n8n
- ✅ API de n8n (endpoints, autenticación)
- ✅ Estructura JSON completa de workflows
- ✅ Integración con OpenAI
- ✅ Webhooks y cómo funcionan
- ✅ Variables de entorno
- ✅ 5 ejemplos prácticos listos para usar
- **Duración lectura:** 20-30 minutos

### 2. **N8N_SETUP_STEP_BY_STEP.md** 🚀 GUÍA PRÁCTICA

- ✅ Quick start (5 minutos)
- ✅ Cómo importar workflows JSON
- ✅ Crear workflows manualmente
- ✅ Configurar credenciales OpenAI y BD
- ✅ Probar webhooks (3 métodos)
- ✅ Conectar con Next.js
- ✅ Troubleshooting completo
- **Duración lectura:** 15-20 minutos

### 3. **N8N_IMPLEMENTATION_EXAMPLES.md** 💻 CÓDIGO

- ✅ Endpoint Next.js completo
- ✅ Hook React `useContentGenerator`
- ✅ Componente React con UI
- ✅ Server Action para generar contenido
- ✅ Ejemplos de payload y response
- ✅ Configuración avanzada
- ✅ Despliegue en producción
- **Duración lectura:** 15-20 minutos

### 4. **N8N_ENVIRONMENT_VARIABLES.md** 🔐 CONFIGURACIÓN

- ✅ Variables actuales de tu proyecto
- ✅ Configuración recomendada completa
- ✅ Webhooks específicos por tipo
- ✅ Autenticación y tokens
- ✅ Timeouts y límites
- ✅ Plantilla `.env` lista para usar
- ✅ Validación de variables
- **Duración lectura:** 10-15 minutos

### 5. **workflow-generate-titles.json** 📄 IMPORTAR

- Workflow listo para importar
- Genera títulos para cursos
- Integrado con OpenAI

### 6. **workflow-generate-descriptions.json** 📄 IMPORTAR

- Workflow listo para importar
- Genera descripciones detalladas
- Valida entrada y guarda en BD

### 7. **workflow-complete-content-generation.json** 📄 IMPORTAR

- Workflow listo para importar
- Genera títulos + descripción + objetivos
- Ejecución en paralelo

---

## ⏱️ Plan de Lectura (Recomendado)

### Opción A: Rápido (45 minutos)

1. Lee **N8N_WORKFLOWS_GUIDE.md** (primeros 20 minutos)
2. Lee **N8N_SETUP_STEP_BY_STEP.md** (20 minutos)
3. Haz el "Quick Start" (5 minutos)

### Opción B: Completo (2 horas)

1. **N8N_WORKFLOWS_GUIDE.md** (30 min)
2. **N8N_SETUP_STEP_BY_STEP.md** (30 min)
3. **N8N_IMPLEMENTATION_EXAMPLES.md** (30 min)
4. **N8N_ENVIRONMENT_VARIABLES.md** (15 min)
5. Practica importando workflows (15 min)

### Opción C: Implementación (3-4 horas)

1. Lea todos los documentos (2 horas)
2. Importe los workflows en n8n (30 min)
3. Configure credenciales y variables (30 min)
4. Cree endpoints en Next.js (30 min)
5. Pruebe end-to-end (30 min)

---

## 🚀 Quick Start: 5 Minutos

### Paso 1: Accede a n8n

```
https://n8n.srv1000134.hstgr.cloud
```

### Paso 2: Crea credencial OpenAI

1. Settings → Credentials
2. "Create New" → OpenAI
3. API Key: Tu `OPENAI_API_KEY`
4. Nombre: `openai-api-key`
5. Save

### Paso 3: Importa workflow

1. Workflows → "+" → "Import from file"
2. Selecciona `workflow-generate-titles.json`
3. Haz clic en Play (verde)
4. ¡Listo!

### Paso 4: Prueba webhook

```bash
curl -X POST http://localhost:5678/webhook-test/f71bd676-9eb3-4da9-beb8-8aab1c8dcdb7 \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Curso de Python"}'
```

---

## 📊 Estructura de Archivos

```
Docs/
├── N8N_WORKFLOWS_GUIDE.md              ⭐ Guía teórica
├── N8N_SETUP_STEP_BY_STEP.md           🚀 Guía práctica
├── N8N_IMPLEMENTATION_EXAMPLES.md      💻 Código listo
├── N8N_ENVIRONMENT_VARIABLES.md        🔐 Configuración
├── N8N_COMPLETE_DOCUMENTATION.md       📖 Este archivo
└── n8n_workflows/
    ├── workflow-generate-titles.json
    ├── workflow-generate-descriptions.json
    └── workflow-complete-content-generation.json
```

---

## 🎯 Casos de Uso

### Caso 1: Generar Títulos Automáticos

```typescript
// Necesitas: workflow-generate-titles.json
await fetch('/api/content/generate', {
  method: 'POST',
  body: JSON.stringify({
    prompt: 'Curso de Python',
    level: 'intermedio',
    type: 'titulo',
  }),
});
```

→ Respuesta: 5 títulos atractivos

### Caso 2: Generar Descripciones

```typescript
// Necesitas: workflow-generate-descriptions.json
await fetch('/api/content/generate', {
  method: 'POST',
  body: JSON.stringify({
    prompt: 'Curso de Python',
    courseTitle: 'Python Avanzado',
    level: 'avanzado',
  }),
});
```

→ Respuesta: Descripción profesional de 200 palabras

### Caso 3: Contenido Completo

```typescript
// Necesitas: workflow-complete-content-generation.json
await fetch('/api/content/generate', {
  method: 'POST',
  body: JSON.stringify({
    prompt: 'Curso de Python',
    level: 'intermedio',
    type: 'completo',
  }),
});
```

→ Respuesta: Títulos + Descripción + Objetivos

---

## 🔄 Flujo de Integración

```
Next.js Endpoint
     ↓
POST /api/content/generate
     ↓
Validate Input
     ↓
Call n8n Webhook
     ↓
n8n Workflow
     ├── Webhook Node (recibe datos)
     ├── OpenAI Node (genera contenido)
     └── Response Node (devuelve resultado)
     ↓
Save to Database (opcional)
     ↓
Response to Client
```

---

## 📋 Checklist de Implementación

### Fase 1: Configuración (30 min)

- [ ] Variables `.env` configuradas
- [ ] Credencial OpenAI creada en n8n
- [ ] Credencial Postgres creada en n8n

### Fase 2: Workflows (45 min)

- [ ] workflow-generate-titles.json importado
- [ ] workflow-generate-descriptions.json importado
- [ ] workflow-complete-content-generation.json importado
- [ ] Los 3 workflows están ACTIVE (verde)

### Fase 3: Testing (30 min)

- [ ] Webhooks probados con curl/Postman
- [ ] Respuestas de OpenAI son correctas
- [ ] Datos se guardan en BD

### Fase 4: Integración Next.js (60 min)

- [ ] Endpoint `/api/content/generate` creado
- [ ] Hook `useContentGenerator` implementado
- [ ] Componente `ContentGenerator` integrado
- [ ] Error handling implementado
- [ ] Logs configurados

### Fase 5: Producción (30 min)

- [ ] Variables `.env.production` configuradas
- [ ] Webhooks de producción probados
- [ ] Monitoreo implementado
- [ ] Alertas configuradas

**Tiempo total estimado: 3-4 horas**

---

## 🆘 Soporte y Recursos

### Documentación Oficial

- 📖 [n8n Docs](https://docs.n8n.io)
- 📖 [n8n API Reference](https://docs.n8n.io/api)
- 📖 [OpenAI API Docs](https://platform.openai.com/docs)
- 📖 [Next.js Docs](https://nextjs.org/docs)

### Comunidad

- 💬 [n8n Community](https://community.n8n.io)
- 💬 [n8n Discord](https://discord.gg/nGkJDpV)
- 💬 [OpenAI Community](https://community.openai.com)

### En Este Proyecto

- 📁 Todos los archivos están en `Docs/`
- 📁 Workflows JSON están en `Docs/n8n_workflows/`
- 📁 Código ejemplo está en `src/app/api/`

---

## 🎓 Conceptos Clave

### n8n

- **Workflow:** Secuencia de nodos que automatiza tareas
- **Nodo:** Bloque individual que realiza una acción
- **Webhook:** Endpoint para recibir solicitudes HTTP
- **Credencial:** Almacenamiento seguro de API keys
- **Execution:** Cada vez que se ejecuta un workflow

### OpenAI

- **Model:** versión de la IA (gpt-4, gpt-3.5-turbo)
- **Prompt:** Instrucción para la IA
- **Temperature:** Nivel de creatividad (0-2)
- **Max Tokens:** Límite de respuesta

### Next.js + n8n

- **Server Action:** Función que ejecuta en servidor
- **API Route:** Endpoint HTTP personalizado
- **Webhook:** Trigger automático desde n8n

---

## 💡 Tips y Mejores Prácticas

### n8n

- ✅ Siempre valida entrada en nodo "If"
- ✅ Usa "Set" para transformar datos
- ✅ Prueba con "Execute Workflow"
- ✅ Revisa logs en "Executions"
- ✅ Guarda backups de workflows importantes
- ✅ Activa "Save data on success/error"

### OpenAI

- ✅ Usa `gpt-4` para mejor calidad
- ✅ Usa `gpt-3.5-turbo` para rapidez
- ✅ Proporciona context en el system prompt
- ✅ Usa temperatura 0.7 por defecto
- ✅ Monitorea uso de tokens

### Next.js

- ✅ Implementa rate limiting
- ✅ Usa Server Actions cuando sea posible
- ✅ Cacha respuestas con ISR
- ✅ Registra logs en producción
- ✅ Valida entrada con Zod

---

## 📈 Escalabilidad

### Para Alto Volumen

1. Usa colas en n8n
2. Implementa rate limiting
3. Cacha respuestas
4. Usa modelo más rápido (gpt-3.5-turbo)

### Para Baja Latencia

1. Reduce maxTokens
2. Usa modelo más rápido
3. Simplifica prompts
4. Usa CDN para assets

### Para Confiabilidad

1. Implementa reintentos
2. Usa error handling
3. Monitorea salud de webhooks
4. Configura alertas

---

## 🔐 Seguridad

### Credenciales

- ✅ Nunca commits API keys
- ✅ Usa `.env` para secretos
- ✅ Rota keys periódicamente
- ✅ Usa variables diferentes por entorno

### Webhooks

- ✅ Valida origen de solicitud
- ✅ Implementa rate limiting
- ✅ Usa HTTPS en producción
- ✅ Firma webhooks con SECRET

### Datos

- ✅ Encripta datos sensibles
- ✅ Usa SSL en BD
- ✅ Implementa CORS correcto
- ✅ Registra accesos

---

## 🚀 Próximos Pasos

1. **Leer:** N8N_WORKFLOWS_GUIDE.md
2. **Practicar:** N8N_SETUP_STEP_BY_STEP.md
3. **Implementar:** N8N_IMPLEMENTATION_EXAMPLES.md
4. **Configurar:** N8N_ENVIRONMENT_VARIABLES.md
5. **Probar:** Importar workflows JSON
6. **Integrar:** Crear endpoints Next.js
7. **Desplegar:** Variables de producción

---

## 📞 Contacto y Soporte

- 📧 Email: support@n8n.io
- 💬 Discord: [n8n Discord](https://discord.gg/nGkJDpV)
- 🐛 Issues: [n8n GitHub](https://github.com/n8n-io/n8n)

---

## 📝 Changelog

**Versión 1.0** - 30 de enero de 2026

- ✅ Documentación completa de n8n
- ✅ 3 workflows JSON listos para importar
- ✅ Ejemplos de código Next.js
- ✅ Guía de configuración de variables
- ✅ Troubleshooting exhaustivo

---

**¡Felicidades! Tienes toda la información que necesitas para integrar n8n + OpenAI en Artiefy** 🎉

**Siguiente paso:** Abre [N8N_WORKFLOWS_GUIDE.md](N8N_WORKFLOWS_GUIDE.md)
