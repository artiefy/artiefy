# Sistema de Registro de Entrada/Salida

## 📋 Cambios Implementados

### 1. ✅ Nueva Tabla `access_logs` en Schema

Ubicación: `src/server/db/schema.ts`

**Campos:**

- `id`: Serial Primary Key
- `user_id`: ID del usuario (FK a users)
- `entry_time`: Timestamp de entrada (obligatorio)
- `exit_time`: Timestamp de salida (nullable)
- `subscription_status`: Estado de suscripción ('active' | 'inactive')
- `esp32_status`: Resultado ESP32 ('success' | 'error' | 'timeout' | null)
- `created_at`: Timestamp de creación

**Índices:**

- `access_logs_user_idx` en `user_id`
- `access_logs_entry_idx` en `entry_time`

### 2. ✅ Nuevo Endpoint `/api/super-admin/register-access`

Ubicación: `src/app/api/super-admin/register-access/route.ts`

**Request:**

```json
{
  "userId": "user_xxx",
  "action": "entry" | "exit"
}
```

**Lógica de ENTRADA:**

- ❌ Si suscripción inactiva → Error 403 (acceso denegado)
- ✅ Si suscripción activa → Llama ESP32 + guarda registro entry

**Lógica de SALIDA:**

- Busca último registro sin `exit_time`
- Si no existe → Error 404
- Si ya tiene salida → Error 400
- Si suscripción ACTIVA → Llama ESP32 + actualiza `exit_time`
- Si suscripción INACTIVA → Solo actualiza `exit_time` (sin ESP32)

**Response:**

```json
{
  "success": true,
  "message": "Entrada registrada - Puerta abierta",
  "action": "entry",
  "timestamp": "2025-12-22T...",
  "esp32": {
    "ok": true,
    "status": 200,
    "reason": "success"
  },
  "subscriptionStatus": "active"
}
```

### 3. ✅ UI Actualizada en `page.tsx`

Ubicación: `src/app/dashboard/subscription/page.tsx`

**Cambios:**

- ❌ Eliminado: Botón "Buscar usuario"
- ✅ Nuevo: Botón "📥 Registrar Entrada" (verde)
- ✅ Nuevo: Botón "📤 Registrar Salida" (rojo)
- ✅ Nuevo estado: `actionType: 'entry' | 'exit' | null`
- ✅ Nueva función: `handleRegister(action: 'entry' | 'exit')`

## 🚀 Instrucciones de Instalación

### Paso 1: Ejecutar Migración SQL

```bash
# Opción A: Usar psql
psql -U tu_usuario -d tu_database -f migrations/create-access-logs-table.sql

# Opción B: Usar Drizzle (recomendado)
npm run db:push
```

### Paso 2: Actualizar `page.tsx`

1. **Agregar estado `actionType`** (línea ~70):

```typescript
const [actionType, setActionType] = useState<'entry' | 'exit' | null>(null);
```

2. **Reemplazar función `handleSearch`** con el contenido de:

```
NUEVA_FUNCION_handleRegister.txt
```

Cambiar el nombre de la función de `handleSearch` a `handleRegister`.

3. **Reemplazar el `<form>`** con el contenido de:

```
NUEVO_FORMULARIO_2botones.txt
```

### Paso 3: Verificar Configuración

Asegúrate que tu `.env` tenga:

```env
ESP32_BASE_URL=http://192.168.1.12
ESP32_API_KEY=  # Opcional
```

### Paso 4: Probar

```bash
npm run dev
```

Navegar a: `http://localhost:3000/dashboard/subscription`

## 🧪 Pruebas

### Test 1: Entrada con suscripción activa

1. Buscar usuario activo por email
2. Click "📥 Registrar Entrada"
3. **Resultado esperado:**
   - ✅ Registro guardado en `access_logs`
   - ✅ ESP32 abre puerta
   - ✅ Toast verde: "Entrada registrada"

### Test 2: Entrada con suscripción inactiva

1. Buscar usuario inactivo
2. Click "📥 Registrar Entrada"
3. **Resultado esperado:**
   - ❌ Error 403
   - ❌ No se guarda registro
   - ❌ Toast rojo: "Suscripción inactiva - Acceso denegado"

### Test 3: Salida con suscripción activa

1. Buscar usuario activo (con entrada previa)
2. Click "📤 Registrar Salida"
3. **Resultado esperado:**
   - ✅ `exit_time` actualizado
   - ✅ ESP32 abre puerta
   - ✅ Toast verde: "Salida registrada"

### Test 4: Salida con suscripción inactiva (caso especial)

1. Usuario inactivo pero con entrada previa sin salida
2. Click "📤 Registrar Salida"
3. **Resultado esperado:**
   - ✅ `exit_time` actualizado
   - ⚠️ ESP32 NO se llama
   - ℹ️ Toast amarillo: "Salida registrada (sin abrir puerta)"

## 📊 Consultas Útiles

### Ver todos los accesos de hoy

```sql
SELECT
  u.email,
  al.entry_time,
  al.exit_time,
  al.subscription_status,
  al.esp32_status
FROM access_logs al
JOIN users u ON u.id = al.user_id
WHERE al.entry_time::date = CURRENT_DATE
ORDER BY al.entry_time DESC;
```

### Usuarios actualmente dentro

```sql
SELECT
  u.email,
  u.name,
  al.entry_time,
  al.subscription_status
FROM access_logs al
JOIN users u ON u.id = al.user_id
WHERE al.exit_time IS NULL
ORDER BY al.entry_time DESC;
```

### Total de accesos por usuario

```sql
SELECT
  u.email,
  COUNT(*) as total_accesos,
  MAX(al.entry_time) as ultimo_acceso
FROM access_logs al
JOIN users u ON u.id = al.user_id
GROUP BY u.email
ORDER BY total_accesos DESC;
```

## 🐛 Troubleshooting

### Error: "No hay registro de entrada para esta persona"

**Causa:** Usuario intenta salir sin haber registrado entrada  
**Solución:** Registrar entrada primero

### Error: "Última entrada ya tiene salida registrada"

**Causa:** Usuario ya registró salida  
**Solución:** Usuario debe registrar nueva entrada para poder salir de nuevo

### ESP32 Timeout en entradas

**Causa:** ESP32 no responde pero entrada se registra  
**Solución:** Verificar IP del ESP32 (`192.168.1.12`) y conexión WiFi

## 📝 Notas Importantes

1. **Logs siempre se guardan**: Incluso si ESP32 falla, el registro de entrada/salida se guarda en la BD.

2. **Suscripción inactiva + Salida**: Caso especial donde se permite salir sin abrir puerta (para no dejar registros incompletos).

3. **No hay búsqueda previa**: Los botones ahora buscan y registran en una sola acción.

4. **Validación en servidor**: Toda la lógica de negocio está en `/register-access/route.ts`, no en el frontend.

## ✅ Checklist Final

- [ ] Migración SQL ejecutada
- [ ] Schema actualizado con `access_logs`
- [ ] Endpoint `/api/super-admin/register-access` creado
- [ ] `page.tsx` actualizado con 2 botones
- [ ] Función `handleRegister` implementada
- [ ] Estado `actionType` agregado
- [ ] `.env` con `ESP32_BASE_URL` correcta
- [ ] Pruebas ejecutadas exitosamente

## 🎯 Resultado Final

**Antes:**

- 1 botón "Buscar usuario"
- Lógica compleja en frontend
- No se guardaban registros de acceso

**Después:**

- 2 botones: "Registrar Entrada" y "Registrar Salida"
- Lógica en backend (más seguro)
- Tabla `access_logs` con historial completo
- Manejo especial para usuarios inactivos que necesitan salir
