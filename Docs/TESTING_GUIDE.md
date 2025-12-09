# Guía de Testeo - Integración ESP32

## 1️⃣ Pre-requisitos

- [ ] ESP32 configurado con WiFi y firmware compatible
- [ ] Artiefy corriendo localmente (`npm run dev`)
- [ ] Variables en `.env.local`:
  ```
  ESP32_HTTP_URL=http://192.168.1.100:80
  ESP32_AUTH_TOKEN=test-token (opcional)
  ```

---

## 2️⃣ Test de Normalización (Local)

**Archivo:** `src/server/utils/esp32/normalize-user.ts`

```bash
# En la consola del navegador o node:
import { normalizeEsp32User } from '@/server/utils/esp32/normalize-user';

// Test cases
console.log(normalizeEsp32User('Juan Jo'));        // ✓ "juanjo"
console.log(normalizeEsp32User('Ana María'));      // ✓ "anamaria"
console.log(normalizeEsp32User('José'));           // ✓ "jose"
console.log(normalizeEsp32User('  spaces  '));     // ✓ "spaces"
```

---

## 3️⃣ Test del Servicio ESP32 (Backend)

**Archivo:** `src/server/services/esp32/door-access.service.ts`

Crear archivo temporal `test-esp32.ts` en `src/server/`:

```typescript
import { sendDoorAccessSignal } from '~/server/services/esp32/door-access.service';

async function testEsp32() {
  const result = await sendDoorAccessSignal({
    usuario: 'juanjo',
    estado: 'activo',
  });

  console.log('Resultado:', result);
  // Esperado:
  // - Si conecta: { ok: true, status: 200 }
  // - Si falla: { ok: false, error: 'mensaje', status?: number }
}

// Ejecutar:
// node -r ts-node -r tsconfig-paths/register test-esp32.ts
```

---

## 4️⃣ Test de la API Route

### Test 4.1: Payload inválido (400)

```bash
curl -X POST http://localhost:3000/api/super-admin/webhook-subscription \
  -H "Content-Type: application/json" \
  -d '{}'

# Response esperado:
# HTTP 400
# { "success": false, "error": "Validación fallida..." }
```

### Test 4.2: Payload válido SIN ESP32 configurado

```bash
curl -X POST http://localhost:3000/api/super-admin/webhook-subscription \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "usr-123",
    "email": "juan@example.com",
    "name": "Juan García",
    "daysRemaining": 30,
    "subscriptionEndDate": "2025-01-09T00:00:00Z"
  }'

# Response esperado:
# HTTP 200
# {
#   "success": true,
#   "message": "Webhook procesado exitosamente",
#   "payload": { ... }
# }
```

### Test 4.3: Payload válido CON ESP32 (si está online)

```bash
curl -X POST http://localhost:3000/api/super-admin/webhook-subscription \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "usr-123",
    "email": "juan@example.com",
    "name": "Juan García",
    "daysRemaining": 30,
    "subscriptionEndDate": "2025-01-09T00:00:00Z"
  }'

# Response esperado (si ESP32 responde):
# HTTP 200
# {
#   "success": true,
#   "message": "Webhook procesado exitosamente",
#   "payload": { ... },
#   "esp32": {
#     "ok": true,
#     "status": 200
#   }
# }
```

---

## 5️⃣ Test del Componente Cliente

1. **Ir a:** `http://localhost:3000/dashboard/subscription`

2. **Crear usuario de prueba en BD:**
   - Email: `test@example.com`
   - Nombre: `Juan García`
   - Suscripción: Activa (30 días restantes)

3. **En la UI:**
   - Seleccionar "Correo electrónico"
   - Ingresar: `test@example.com`
   - Click "Buscar usuario"

4. **Resultado esperado:**
   - ✅ Usuario encontrado
   - ✅ Suscripción Activa
   - ✅ 30 días restantes
   - ✅ Si ESP32 online: "✓ Señal enviada al ESP32"

---

## 6️⃣ Test de Timeout

Simular ESP32 offline:

```bash
# Cambiar ESP32_HTTP_URL a IP que no existe:
# ESP32_HTTP_URL=http://192.168.1.255:80

# El webhook debería:
# - Fallar después de 1500ms
# - Retornar: { ok: false, error: "Timeout..." }
# - El cliente mostrará búsqueda exitosa (fallback)
```

---

## 7️⃣ Test E2E Completo

1. **Setup:**
   - ESP32 online con firmware
   - Artiefy corriendo
   - Usuario de prueba en BD con suscripción activa
   - Variables de entorno configuradas

2. **Ejecutar:**
   - Abrir `http://localhost:3000/dashboard/subscription`
   - Buscar usuario por email
   - Verificar que puerta se abre en ESP32 (LED/relé)

3. **Verificar en logs:**
   - Artiefy: "Webhook procesado exitosamente"
   - ESP32: "Puerta abierta" (si tiene logs UART)

---

## 8️⃣ Test de Normalización Edge Cases

```bash
curl -X POST http://localhost:3000/api/super-admin/webhook-subscription \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "usr-456",
    "email": "maría.josé@example.com",
    "name": "María José García López"
  }'

# El nombre se normaliza a:
# "mariajosegarcialopez"
#
# El ESP32 debe tener este usuario en su lista:
# const char* AUTHORIZED_USERS[] = { "mariajosegarcialopez", ... };
```

---

## 9️⃣ Debugging

### Logs en Artiefy

```typescript
// En src/app/api/super-admin/webhook-subscription/route.ts
// Agregar temporalmente:
console.log('Webhook recibido:', { userId, email, name });
console.log('Usuario normalizado:', usuario);
console.log('Resultado ESP32:', doorAccessResult);
```

### Logs en ESP32

```cpp
// En sketch.ino:
Serial.println("Recibido: " + body);
Serial.println("Usuario: " + usuario + " | Estado: " + estado);
Serial.println("Autorizado: " + String(isUserAuthorized(usuario.c_str())));
```

### Logs en Navegador

```javascript
// En src/app/dashboard/subscription/page.tsx
// Abrir DevTools → Console
// Buscar usuario
// Ver logs de fetch y responses
```

---

## 🔟 Troubleshooting Rápido

| Problema                            | Solución                                                 |
| ----------------------------------- | -------------------------------------------------------- |
| **HTTP 400 al webhook**             | Verificar que payload tenga userId y email               |
| **"ESP32_HTTP_URL no configurada"** | Agregar a .env.local y reiniciar `npm run dev`           |
| **Timeout 1500ms**                  | Verificar WiFi del ESP32, revisar puerto 80 abierto      |
| **HTTP 401 del ESP32**              | Usuario no en AUTHORIZED_USERS, verificar normalización  |
| **No se abre la puerta**            | Revisar GPIO 22, validar lógica en sketch.ino (HIGH/LOW) |
| **ESP32 no responde**               | Verificar IP, ping 192.168.1.100, revisar WiFi           |

---

## 📝 Checklist de Validación

- [ ] normalizeEsp32User() convierte correctamente
- [ ] sendDoorAccessSignal() retorna resultados tipados
- [ ] API route valida payload con Zod
- [ ] API route maneja errores sin throw
- [ ] Cliente muestra UI discreto cuando esp32.ok === true
- [ ] Timeout de 1500ms funciona
- [ ] Authorization header se envía si ESP32_AUTH_TOKEN existe
- [ ] Búsqueda de usuario NO se rompe si ESP32 falla
- [ ] No hay console.log innecesarios
- [ ] TypeScript sin errores

---

## 🚀 Una vez validado todo:

1. Commit los cambios
2. Crear PR con descripción de testing realizado
3. Deployar a staging/producción
4. Monitorear logs por 24h
5. Documentar issues encontrados

---

**Última actualización:** 9 de diciembre de 2025  
**Estado:** Listo para testing
