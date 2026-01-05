# Integración ESP32 - Artiefy Door Access

## Resumen Técnico

Esta integración permite que cuando se verifica una suscripción activa en Artiefy, automáticamente se envíe una señal HTTP al ESP32 para abrir la puerta por 5 segundos.

# # Arquitectura de la Solución

### Backend (Next.js)

#### 1. **Servicio ESP32** (`src/server/services/esp32/door-access.service.ts`)

- Función `sendDoorAccessSignal(input)` que:
  - Lee `ESP32_HTTP_URL` y `ESP32_AUTH_TOKEN` del entorno
  - Realiza POST a `${ESP32_HTTP_URL}/access` con timeout de 1500ms
  - Envía payload en formato texto plano: `usuario|estado`
  - Retorna resultado tipado: `{ ok: boolean; status?: number; error?: string }`

#### 2. **Utilidad de Normalización** (`src/server/utils/esp32/normalize-user.ts`)

- Función `normalizeEsp32User(input)` que:
  - Convierte a minúsculas
  - Elimina espacios
  - Elimina tildes y acentos (usando NFD y regex)
  - Mantiene solo letras y números
  - Ejemplos: "Juan Jo" → "juanjo", "Ana María" → "anamaria"

#### 3. **API Route** (`src/app/api/super-admin/webhook-subscription/route.ts`)

- Mantiene estructura de webhook existente
- Usa `runtime = 'nodejs'`
- Valida payload con Zod
- Si `ESP32_HTTP_URL` está configurada, llama a `sendDoorAccessSignal`
- Retorna respuesta enriquecida con `esp32: { ok, status }` si aplica

### Variables de Entorno

Agregar a `.env.local`:

```env
# ESP32 Door Access Controller
ESP32_HTTP_URL=http://192.168.1.100:80
ESP32_AUTH_TOKEN=tu-token-secreto-opcional
```

- `ESP32_HTTP_URL`: URL base del ESP32 (ej: `http://192.168.X.X:80`)
- `ESP32_AUTH_TOKEN`: Token de autorización (opcional)

Ambas se validan en `src/env.ts` con Zod.

### Frontend (React)

#### Componente de Búsqueda (`src/app/dashboard/subscription/page.tsx`)

- Al buscar un usuario, si tiene suscripción activa:
  - Envía webhook a `/api/super-admin/webhook-subscription`
  - Si `esp32.ok === true`, muestra mensaje: "✓ Señal enviada al ESP32"
  - Si falla, manejo silencioso (no rompe la búsqueda)

## Formato de Comunicación

### Request al ESP32

```http
POST http://192.168.1.100:80/access
Content-Type: text/plain
Authorization: Bearer {ESP32_AUTH_TOKEN}

juanjo|activo
```

**Payload esperado:**

```
{usuario}|{estado}
```

Donde:

- `usuario`: Nombre normalizado (lowercase, sin espacios, sin tildes)
- `estado`: "activo" o "inactivo"

### Response del ESP32

```http
HTTP/1.1 200 OK
Content-Type: text/plain

Door opened for 5 seconds
```

## Lógica de Acceso en el ESP32

1. Recibe payload en formato `usuario|estado`
2. Parsea el string separando por `|`
3. Valida que `usuario` esté en lista autorizada
4. Valida que `estado === "activo"`
5. Si ambas validaciones pasan:
   - Activa GPIO 22 (relevador de puerta)
   - Enciende LED indicador
   - Mantiene abierta por 5 segundos
   - Envía HTTP 200 OK
6. Si fallan validaciones:
   - Envía HTTP 401 Unauthorized
   - No abre la puerta

## Ejemplo de Firmware Mínimo del ESP32

```cpp
#include <WiFi.h>
#include <WebServer.h>

const int DOOR_RELAY_PIN = 22;
const unsigned long DOOR_OPEN_TIME = 5000;

WebServer server(80);
unsigned long doorOpenUntil = 0;

const char* AUTHORIZED_USERS[] = {"juanjo", "anamaria", "carlos"};
const int AUTHORIZED_USERS_COUNT = 3;

void handleAccess() {
  String body = server.arg("plain");
  int pipeIndex = body.indexOf('|');

  String usuario = body.substring(0, pipeIndex);
  String estado = body.substring(pipeIndex + 1);

  bool isAuthorized = false;
  for (int i = 0; i < AUTHORIZED_USERS_COUNT; i++) {
    if (usuario.equals(AUTHORIZED_USERS[i])) {
      isAuthorized = true;
      break;
    }
  }

  if (isAuthorized && estado.equals("activo")) {
    digitalWrite(DOOR_RELAY_PIN, LOW); // Abrir puerta
    doorOpenUntil = millis() + DOOR_OPEN_TIME;
    server.send(200, "text/plain", "Door opened for 5 seconds");
  } else {
    server.send(401, "text/plain", "Access denied");
  }
}

void setup() {
  pinMode(DOOR_RELAY_PIN, OUTPUT);
  digitalWrite(DOOR_RELAY_PIN, HIGH); // Cerrado por defecto

  server.on("/access", HTTP_POST, handleAccess);
  server.begin();
}

void loop() {
  server.handleClient();

  // Cerrar puerta después de 5 segundos
  if (millis() >= doorOpenUntil && digitalRead(DOOR_RELAY_PIN) == LOW) {
    digitalWrite(DOOR_RELAY_PIN, HIGH);
  }
}
```

## Flujo Completo

1. **Usuario busca en Artiefy** (`/dashboard/subscription`)
   - Ingresa email, documento o nombre
2. **Search API** (`/api/super-admin/search-user`)
   - Busca el usuario en BD
   - Retorna estado de suscripción
3. **Si suscripción activa**, el cliente hace POST a Webhook
   - `/api/super-admin/webhook-subscription`
   - Body incluye: userId, email, name, daysRemaining, subscriptionEndDate
4. **Webhook API valida y llama al servicio ESP32**
   - Normaliza nombre: `normalizeEsp32User(name || email)`
   - Construye payload: `{usuario: normalized, estado: 'activo'}`
   - Llamada a `sendDoorAccessSignal()`
5. **Servicio ESP32 realiza HTTP POST**
   - URL: `${ESP32_HTTP_URL}/access`
   - Header: `Content-Type: text/plain` + Auth si aplica
   - Body: `juanjo|activo`
6. **ESP32 procesa solicitud**
   - Valida usuario autorizado
   - Valida estado activo
   - Si OK: abre puerta por 5 segundos
7. **Cliente muestra confirmación**
   - Si esp32.ok === true: "✓ Señal enviada al ESP32"
   - Si falla: manejo silencioso

## Notas de Seguridad

- ✅ Token se envía solo en header `Authorization`
- ✅ Nunca se expone en respuestas del cliente
- ✅ Validación de payload en API route con Zod
- ✅ Timeout de 1500ms evita requests infinitas
- ✅ Manejo explícito de errores (sin throw innecesarios)
- ✅ Normalización de usuario previene inyecciones

## Testing

### Probar servicio ESP32 con curl

```bash
# Con autenticación
curl -X POST http://192.168.1.100:80/access \
  -H "Content-Type: text/plain" \
  -H "Authorization: Bearer tu-token-secreto" \
  -d "juanjo|activo"

# Sin autenticación
curl -X POST http://192.168.1.100:80/access \
  -H "Content-Type: text/plain" \
  -d "juanjo|activo"
```

### Verificar estado del ESP32

```bash
curl http://192.168.1.100:80/status
# Response: {"status":"ok","door":"closed"}
```

## Troubleshooting

| Problema                             | Causa                                   | Solución                                         |
| ------------------------------------ | --------------------------------------- | ------------------------------------------------ |
| Error: ESP32_HTTP_URL no configurada | Falta variable de entorno               | Agregar a `.env.local`                           |
| Timeout de 1500ms                    | ESP32 no responde rápido                | Revisar WiFi/red, reducir procesamiento en ESP32 |
| HTTP 401 Unauthorized                | Usuario no en lista autorizada          | Verificar normalización del nombre               |
| HTTP 401 Unauthorized                | Estado no es "activo"                   | Comprobar que subscription esté activa en BD     |
| Puerta no se abre                    | GPIO 22 invertido o relevador invertido | Revisar lógica: HIGH cierra, LOW abre            |

## Compliance del Proyecto

- ✅ Mantiene estructura modular SOLID/DRY/KISS
- ✅ Tipado estricto con TypeScript
- ✅ Variables de entorno con Zod en `src/env.ts`
- ✅ Sin dependencias nuevas (fetch nativo)
- ✅ Sin console.log innecesarios
- ✅ Sigue convenciones del proyecto (kebab-case, PascalCase, etc.)
- ✅ API route con `runtime = 'nodejs'`
- ✅ Type guards para validaciones en cliente
