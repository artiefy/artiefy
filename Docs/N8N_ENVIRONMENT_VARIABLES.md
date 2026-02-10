# Configuración de Variables de Entorno para n8n

## 📋 Variables Actuales en `.env`

Tus variables actuales (estado 30 de enero de 2026):

```bash
# n8n URLs
N8N_BASE_URL=http://localhost:5678              # Local
N8N_BASE_URL=https://n8n.srv1000134.hstgr.cloud # Producción
N8N_WEBHOOK_PATH=f71bd676-9eb3-4da9-beb8-8aab1c8dcdb7

# Webhooks específicos por entorno
N8N_WEBHOOK_LOCAL=http://localhost:5678/webhook-test/f71bd676-9eb3-4da9-beb8-8aab1c8dcdb7
N8N_WEBHOOK_PROD=https://n8n.srv1000134.hstgr.cloud/webhook/f71bd676-9eb3-4da9-beb8-8aab1c8dcdb7

# Tokens
N8N_MCP_TOKEN=nmcp_3d8db29d597abe90b557f383f620c6e3c99533d588d9649456712ffd4135199a
N8N_MCP_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5MmZiYzg3Yy0zZGViLTRjMGUtOTA5NS1kZjU4ZWQzN2E1OTkiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY2MDUzMzY1fQ._IwYtcO3S0tt6w4c119C0_1iCvZM6ZVlBiyL8Qj1bPQ
N8N_LICENSE_KEY=... # Tu license key

# OpenAI
OPENAI_API_KEY=<OPENAI_API_KEY>
OPENAI_ASSISTANT_API_KEY=<OPENAI_ASSISTANT_API_KEY>
OPENAI_ASSISTANT_ID=asst_uSJJLPx3uAheBOkIOVtcCrww
```

---

## ✨ Configuración Recomendada Completa

### 1. Variables Básicas de n8n

```bash
# ==================== n8n Configuration ====================
# Entorno
NODE_ENV=production

# URL base de n8n
N8N_BASE_URL=https://n8n.srv1000134.hstgr.cloud
N8N_PROTOCOL=https
N8N_HOST=n8n.srv1000134.hstgr.cloud
N8N_PORT=443

# Path de webhook único
N8N_WEBHOOK_PATH=f71bd676-9eb3-4da9-beb8-8aab1c8dcdb7

# URLs completas de webhooks
N8N_WEBHOOK_LOCAL=http://localhost:5678/webhook-test/f71bd676-9eb3-4da9-beb8-8aab1c8dcdb7
N8N_WEBHOOK_PROD=https://n8n.srv1000134.hstgr.cloud/webhook/f71bd676-9eb3-4da9-beb8-8aab1c8dcdb7
```

### 2. Webhooks Específicos por Tipo

Si tienes múltiples workflows, puedes asignar UUIDs diferentes:

```bash
# ==================== Webhooks Específicos ====================
# Webhook para generar títulos
N8N_WEBHOOK_TITLES=https://n8n.srv1000134.hstgr.cloud/webhook/UUID-TITLES-HERE
N8N_WEBHOOK_TITLES_LOCAL=http://localhost:5678/webhook-test/UUID-TITLES-HERE

# Webhook para descripciones
N8N_WEBHOOK_DESCRIPTIONS=https://n8n.srv1000134.hstgr.cloud/webhook/UUID-DESCRIPTIONS-HERE
N8N_WEBHOOK_DESCRIPTIONS_LOCAL=http://localhost:5678/webhook-test/UUID-DESCRIPTIONS-HERE

# Webhook para contenido completo
N8N_WEBHOOK_COMPLETE=https://n8n.srv1000134.hstgr.cloud/webhook/UUID-COMPLETE-HERE
N8N_WEBHOOK_COMPLETE_LOCAL=http://localhost:5678/webhook-test/UUID-COMPLETE-HERE
```

### 3. Autenticación y Tokens

```bash
# ==================== Authentication ====================
# Token API de n8n (para llamadas a API de n8n)
N8N_API_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# MCP Token (para integración con Claude/Copilot)
N8N_MCP_TOKEN=nmcp_...

# License Key (si usas n8n Enterprise)
N8N_LICENSE_KEY=tu-license-key

# Webhook Secret (opcional, para validar que el webhook sea de n8n)
N8N_WEBHOOK_SECRET=tu-secreto-aleatorio-muy-seguro
```

### 4. OpenAI Configuration

```bash
# ==================== OpenAI ====================
# API Key principal
OPENAI_API_KEY=sk-proj-...

# API Key específica para Assistants (opcional)
OPENAI_ASSISTANT_API_KEY=sk-proj-...

# ID del Assistant
OPENAI_ASSISTANT_ID=asst_...

# Modelo predeterminado
OPENAI_MODEL=gpt-4
OPENAI_MODEL_FALLBACK=gpt-3.5-turbo

# Configuración de requests
OPENAI_REQUEST_TIMEOUT=30000        # milliseconds
OPENAI_MAX_TOKENS=2000
OPENAI_TEMPERATURE=0.7
OPENAI_TOP_P=1
```

### 5. Base de Datos

```bash
# ==================== Database ====================
# Neon PostgreSQL
POSTGRES_URL=postgresql://user:password@neon.sql...
POSTGRES_HOST=your-neon-host
POSTGRES_PORT=5432
POSTGRES_USER=your-user
POSTGRES_PASSWORD=your-password
POSTGRES_DB=neondb
POSTGRES_SSL=true

# Optional: Direct URL para herramientas
DATABASE_URL=$POSTGRES_URL
```

### 6. Configuración de Timeouts y Límites

```bash
# ==================== Timeouts & Limits ====================
# Timeout para llamadas a webhooks (ms)
N8N_REQUEST_TIMEOUT=30000

# Reintentos en caso de error
N8N_MAX_RETRIES=3
N8N_RETRY_DELAY=1000

# Ejecuciones concurrentes
N8N_MAX_CONCURRENT_EXECUTIONS=10

# Almacenamiento de ejecuciones (días)
N8N_EXECUTION_DATA_PRUNE_TIMEOUT=7
```

### 7. Configuración de Logging

```bash
# ==================== Logging ====================
# Nivel de log
N8N_LOG_LEVEL=info
LOG_LEVEL=info

# Sentry para error tracking (opcional)
SENTRY_DSN=
SENTRY_ENVIRONMENT=production
```

### 8. Seguridad

```bash
# ==================== Security ====================
# JWT Secret para sesiones
N8N_JWT_SECRET=tu-secreto-jwt-aleatorio-muy-largo

# CORS
N8N_CORS_ORIGIN=https://artiefy.com

# HTTPS recomendado
NODE_TLS_REJECT_UNAUTHORIZED=0  # Solo en desarrollo

# Rate limiting
N8N_RATE_LIMIT_ENABLED=true
N8N_RATE_LIMIT_MAX_REQUESTS_PER_MINUTE=60
```

### 9. Almacenamiento (si usas S3)

```bash
# ==================== S3 Storage ====================
AWS_S3_BUCKET=tu-bucket-n8n
AWS_S3_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key-id
AWS_SECRET_ACCESS_KEY=your-secret-key
```

---

## 🔐 Archivos de Configuración Recomendados

### `.env` (Desarrollo)

```bash
NODE_ENV=development

# n8n Development
N8N_BASE_URL=http://localhost:5678
N8N_WEBHOOK_LOCAL=http://localhost:5678/webhook-test/f71bd676-9eb3-4da9-beb8-8aab1c8dcdb7
N8N_WEBHOOK_PROD=https://n8n.srv1000134.hstgr.cloud/webhook/f71bd676-9eb3-4da9-beb8-8aab1c8dcdb7

# OpenAI (use development key si existe)
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-3.5-turbo  # Más rápido en dev

# Database
POSTGRES_URL=postgresql://localhost:5432/artiefy

# Logging
LOG_LEVEL=debug
```

### `.env.production`

```bash
NODE_ENV=production

# n8n Production
N8N_BASE_URL=https://n8n.srv1000134.hstgr.cloud
N8N_WEBHOOK_PROD=https://n8n.srv1000134.hstgr.cloud/webhook/f71bd676-9eb3-4da9-beb8-8aab1c8dcdb7
N8N_JWT_SECRET=tu-secreto-jwt-muy-seguro

# OpenAI (production key)
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-4  # Mejor calidad

# Database (Neon)
POSTGRES_URL=postgresql://user:pass@neon.sql...

# Security
N8N_CORS_ORIGIN=https://artiefy.com
SENTRY_DSN=https://your-sentry-url

# Logging
LOG_LEVEL=info
```

---

## 🔄 Rotación de Credenciales

### Cambiar OpenAI API Key

1. **Generar nueva key en OpenAI:**
   - Ve a https://platform.openai.com/account/api-keys
   - Haz clic en "Create new secret key"
   - Copia la nueva key

2. **Actualizar en `.env`:**

   ```bash
   OPENAI_API_KEY=sk-proj-nueva-key-aqui
   ```

3. **Actualizar en n8n:**
   - Ve a Settings → Credentials
   - Edita "openai-api-key"
   - Reemplaza el valor
   - Haz clic en "Save"

4. **Revisar workflows:**
   - Todos los workflows que usen OpenAI funcionarán con la nueva key

### Cambiar n8n API Token

1. **Generar nuevo token:**

   ```bash
   curl -X POST https://n8n.srv1000134.hstgr.cloud/api/v1/user \
     -H "Authorization: Bearer OLD_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"action":"regenerateToken"}'
   ```

2. **Actualizar en `.env`:**

   ```bash
   N8N_API_TOKEN=nuevo-token-aqui
   ```

3. **Reiniciar aplicación:**
   ```bash
   npm run dev  # Si estás en desarrollo
   # O redeploy en producción
   ```

---

## 📝 Plantilla `.env` Completa

```bash
# ============================================
# ENTORNO
# ============================================
NODE_ENV=production

# ============================================
# n8n
# ============================================
N8N_BASE_URL=https://n8n.srv1000134.hstgr.cloud
N8N_WEBHOOK_PATH=f71bd676-9eb3-4da9-beb8-8aab1c8dcdb7
N8N_WEBHOOK_LOCAL=http://localhost:5678/webhook-test/f71bd676-9eb3-4da9-beb8-8aab1c8dcdb7
N8N_WEBHOOK_PROD=https://n8n.srv1000134.hstgr.cloud/webhook/f71bd676-9eb3-4da9-beb8-8aab1c8dcdb7
N8N_API_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
N8N_JWT_SECRET=tu-secreto-jwt-muy-seguro
N8N_REQUEST_TIMEOUT=30000
N8N_MAX_RETRIES=3

# ============================================
# OpenAI
# ============================================
OPENAI_API_KEY=sk-proj-...
OPENAI_ASSISTANT_API_KEY=sk-proj-...
OPENAI_ASSISTANT_ID=asst_...
OPENAI_MODEL=gpt-4
OPENAI_REQUEST_TIMEOUT=30000

# ============================================
# Base de Datos
# ============================================
POSTGRES_URL=postgresql://user:pass@neon.sql...
DATABASE_URL=$POSTGRES_URL

# ============================================
# Seguridad
# ============================================
N8N_CORS_ORIGIN=https://artiefy.com
NEXT_PUBLIC_BASE_URL=https://artiefy.com

# ============================================
# Logging
# ============================================
LOG_LEVEL=info

# ============================================
# Otros servicios
# ============================================
AWS_S3_BUCKET=tu-bucket
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

---

## ✅ Validación de Variables

Script para validar que todas las variables estén configuradas:

```bash
#!/bin/bash
# validate-env.sh

required_vars=(
    "N8N_BASE_URL"
    "N8N_WEBHOOK_PROD"
    "OPENAI_API_KEY"
    "POSTGRES_URL"
    "NEXT_PUBLIC_BASE_URL"
)

missing_vars=()

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -eq 0 ]; then
    echo "✅ Todas las variables requeridas están configuradas"
    exit 0
else
    echo "❌ Variables faltantes:"
    for var in "${missing_vars[@]}"; do
        echo "  - $var"
    done
    exit 1
fi
```

Uso:

```bash
chmod +x validate-env.sh
./validate-env.sh
```

---

## 🚀 Despliegue en Vercel

Si despliegas en Vercel, agrega las variables:

1. Ve a tu proyecto en Vercel Dashboard
2. Settings → Environment Variables
3. Agrega cada variable:
   ```
   N8N_BASE_URL=https://n8n.srv1000134.hstgr.cloud
   N8N_WEBHOOK_PROD=https://n8n.srv1000134.hstgr.cloud/webhook/...
   OPENAI_API_KEY=sk-proj-...
   POSTGRES_URL=postgresql://...
   ```
4. Redeploy el proyecto

---

## 📊 Checklist de Configuración

- [ ] `N8N_WEBHOOK_LOCAL` configurado
- [ ] `N8N_WEBHOOK_PROD` configurado
- [ ] `OPENAI_API_KEY` válida y funcional
- [ ] `POSTGRES_URL` conectando correctamente
- [ ] `NEXT_PUBLIC_BASE_URL` seteado
- [ ] `.env.production` con credenciales seguras
- [ ] Variables sensibles **NO** en versionado (`.gitignore`)
- [ ] Timeouts ajustados según tu caso
- [ ] Logging configurado apropiadamente
- [ ] CORS configurado para dominio correcto
- [ ] Script de validación ejecutado exitosamente

---

**¡Tu configuración de variables de entorno está lista para producción!** 🎉
