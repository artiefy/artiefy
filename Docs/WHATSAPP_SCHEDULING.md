# Programación de Mensajes de WhatsApp

## Descripción

Esta funcionalidad permite programar el envío de mensajes de WhatsApp a una fecha y hora específica. Los mensajes se guardan en la base de datos y se envían automáticamente cuando llega la hora programada.

## Componentes Implementados

### 1. Base de Datos

- **Tabla**: `scheduled_whatsapp_messages`
- **Campos principales**:
  - `id`: ID único
  - `phoneNumbers`: Array de números telefónicos (JSONB)
  - `messageText`: Contenido del mensaje
  - `waSubjectText`: Título opcional
  - `templateName`: Nombre de plantilla si aplica
  - `variables`: Variables de la plantilla (JSONB)
  - `scheduledTime`: Fecha/hora del envío programado
  - `status`: 'pending', 'sent', 'failed', 'cancelled'
  - `userId`: Usuario que programó
  - `codigoPais`: Código de país (+57, +52, etc.)

### 2. API Endpoints

#### Guardar Mensaje Programado

- **URL**: `POST /api/super-admin/whatsapp/schedule`
- **Payload**:

```json
{
  "phoneNumbers": ["3001234567", "3012345678"],
  "messageText": "Hola, este es un mensaje programado",
  "waSubjectText": "Título opcional",
  "templateName": null,
  "variables": [],
  "scheduledTime": "2024-01-20T14:30:00",
  "codigoPais": "+57"
}
```

#### Procesar Mensajes Programados (CRON)

- **URL**: `GET /api/super-admin/whatsapp/send-scheduled`
- **Header requerido**: `Authorization: Bearer {CRON_SECRET}`
- **Respuesta**:

```json
{
  "success": true,
  "message": "Procesados 5 mensajes (0 fallaron)",
  "processed": 5,
  "success_count": 5,
  "failed_count": 0
}
```

### 3. Frontend UI

- **Modal**: Sección de programación con toggle "Enviar ahora" vs "Programar"
- **Campos de entrada**:
  - Input de fecha (valida que sea futuro)
  - Input de hora (formato HH:MM)
- **Botón**: Cambia de "Enviar WhatsApp Ahora" a "Programar para [fecha] a las [hora]"

## Configuración del CRON

### Opción 1: Vercel Cron (Recomendado para Vercel)

1. Crear archivo: `src/app/api/cron/whatsapp/route.ts`
2. Vercel ejecutará automáticamente cada minuto

```typescript
import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60; // 60 segundos

export async function GET(request: NextRequest) {
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/super-admin/whatsapp/send-scheduled`,
      {
        headers: {
          'authorization': `Bearer ${process.env.CRON_SECRET}`,
        },
      }
    );
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
```

### Opción 2: EasyCron (Servicio externo gratuito)

1. Ir a https://www.easycron.com/
2. Crear nuevo cron
3. URL: `https://artiefy.com/api/super-admin/whatsapp/send-scheduled`
4. Headers: `Authorization: Bearer {tu_cron_secret}`
5. Frecuencia: Cada 1 minuto

### Opción 3: AWS EventBridge o CloudWatch Events

```bash
# Crear regla que ejecute cada minuto
aws events put-rule \
  --name whatsapp-scheduled-cron \
  --schedule-expression "rate(1 minute)"
```

## Variables de Entorno

Agregar a `.env.local` y `.env.production`:

```env
# Secret para validar requests CRON
CRON_SECRET=tu_secret_muy_seguro_aqui

# URL de la aplicación
NEXT_PUBLIC_APP_URL=https://artiefy.com
```

## Flujo de Ejecución

1. **Usuario programa mensaje**:
   - Selecciona "Programar para más tarde"
   - Ingresa fecha y hora
   - Click en botón "Programar"
   - Mensaje se guarda en tabla `scheduled_whatsapp_messages` con estado `pending`

2. **CRON ejecuta cada minuto**:
   - Consulta tabla por mensajes con `status = 'pending'` y `scheduledTime <= NOW()`
   - Para cada mensaje, llamada a `/api/super-admin/whatsapp/send`
   - Si éxito: actualiza `status = 'sent'`, guarda `sentAt`
   - Si error: actualiza `status = 'failed'`, guarda `errorMessage`

3. **Estados posibles**:
   - `pending`: Esperando ser enviado
   - `sent`: Enviado exitosamente
   - `failed`: Error en el envío
   - `cancelled`: Cancelado por usuario (futuro)

## Consultas Útiles en SQL

### Ver mensajes pendientes

```sql
SELECT * FROM scheduled_whatsapp_messages
WHERE status = 'pending'
ORDER BY scheduled_time ASC;
```

### Ver mensajes enviados hoy

```sql
SELECT * FROM scheduled_whatsapp_messages
WHERE status = 'sent'
AND DATE(sent_at) = CURRENT_DATE;
```

### Ver mensajes fallidos

```sql
SELECT id, error_message, scheduled_time
FROM scheduled_whatsapp_messages
WHERE status = 'failed'
ORDER BY scheduled_time DESC;
```

### Reintento manual de mensaje fallido

```sql
UPDATE scheduled_whatsapp_messages
SET status = 'pending', error_message = NULL
WHERE id = 123;
```

## Limitaciones y Consideraciones

1. **Precisión**: Los mensajes se envían cuando el CRON se ejecuta (típicamente cada 1 minuto)
2. **Zona horaria**: Los timestamps se guardan en UTC con timezone
3. **Rate limiting**: Asegúrate de no exceder límites de WhatsApp Business API
4. **Reintentos**: Los mensajes fallidos se marcan como 'failed' pero NO se reintenten automáticamente
5. **Base de datos**: Los registros se guardan indefinidamente (considerar archivado/limpieza)

## Mejoras Futuras

- [ ] Panel de administración para ver/editar/cancelar mensajes programados
- [ ] Reintentos automáticos para mensajes fallidos
- [ ] Notificaciones al usuario cuando se envía su mensaje
- [ ] Exportar reportes de envíos
- [ ] UI para cancelar mensajes programados antes de su envío
- [ ] Validación más estricta de números telefónicos
- [ ] Soporte para envío en ráfagas (rate limiting interno)

## Testing

### Test local sin CRON

```bash
# 1. Programar un mensaje para 1 minuto en el futuro
curl -X POST http://localhost:3000/api/super-admin/whatsapp/schedule \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumbers": ["573001234567"],
    "messageText": "Test",
    "scheduledTime": "2024-01-20T14:35:00",
    "codigoPais": "+57"
  }'

# 2. Después de 1 minuto, ejecutar CRON manualmente
curl -X GET http://localhost:3000/api/super-admin/whatsapp/send-scheduled \
  -H "Authorization: Bearer tu_cron_secret"
```
