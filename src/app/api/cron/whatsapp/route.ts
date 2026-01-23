import { NextRequest, NextResponse } from 'next/server';

import { and, eq, lte } from 'drizzle-orm';

import { db } from '~/server/db';
import { scheduledWhatsAppMessages } from '~/server/db/schema';
import { sendWhatsAppMessage } from '~/server/whatsapp/send-message';

export const maxDuration = 60;

/**
 * Calcula la siguiente ocurrencia basada en la regla de recurrencia
 */
function calculateNextOccurrence(
  currentDate: Date,
  recurrence: string | null,
  recurrenceConfig: unknown
): Date | null {
  if (!recurrence || recurrence === 'no-repeat') return null;

  const next = new Date(currentDate);

  switch (recurrence) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;

    case 'weekly-monday':
    case 'weekly-tuesday':
    case 'weekly-wednesday':
    case 'weekly-thursday':
    case 'weekly-friday':
    case 'weekly-saturday':
    case 'weekly-sunday':
      next.setDate(next.getDate() + 7);
      break;

    case 'weekdays': {
      // Lunes a viernes
      next.setDate(next.getDate() + 1);
      // Si cae en sábado, mover a lunes
      if (next.getDay() === 6) next.setDate(next.getDate() + 2);
      // Si cae en domingo, mover a lunes
      if (next.getDay() === 0) next.setDate(next.getDate() + 1);
      break;
    }

    case 'monthly-first':
      next.setMonth(next.getMonth() + 1);
      next.setDate(1);
      break;

    case 'monthly-third-monday': {
      next.setMonth(next.getMonth() + 1);
      next.setDate(1);
      // Encontrar el primer lunes
      while (next.getDay() !== 1) {
        next.setDate(next.getDate() + 1);
      }
      // Avanzar al tercer lunes
      next.setDate(next.getDate() + 14);
      break;
    }

    case 'yearly':
      next.setFullYear(next.getFullYear() + 1);
      break;

    case 'custom': {
      if (
        typeof recurrenceConfig === 'object' &&
        recurrenceConfig !== null &&
        'interval' in recurrenceConfig &&
        'unit' in recurrenceConfig
      ) {
        const config = recurrenceConfig as {
          interval: number;
          unit: 'days' | 'weeks' | 'months';
          weekdays?: number[];
        };

        switch (config.unit) {
          case 'days':
            next.setDate(next.getDate() + config.interval);
            break;
          case 'weeks': {
            if (config.weekdays && config.weekdays.length > 0) {
              // Encontrar el siguiente día de la semana en la lista
              let found = false;
              for (let i = 1; i <= 14; i++) {
                next.setDate(next.getDate() + 1);
                if (config.weekdays.includes(next.getDay())) {
                  found = true;
                  break;
                }
              }
              if (!found) next.setDate(next.getDate() + 7 * config.interval);
            } else {
              next.setDate(next.getDate() + 7 * config.interval);
            }
            break;
          }
          case 'months':
            next.setMonth(next.getMonth() + config.interval);
            break;
        }
      }
      break;
    }

    default:
      return null;
  }

  return next;
}

/**
 * Función reutilizable que envía los mensajes programados
 * Puede ser llamada desde el endpoint CRON o directamente desde otros lugares
 */
async function sendScheduledWhatsAppMessages() {
  console.log('[CRON WhatsApp] Iniciando envío de mensajes programados...');
  console.log(
    '[CRON WhatsApp] Hora actual del servidor:',
    new Date().toISOString()
  );

  // Buscar todos los mensajes programados cuya hora ha llegado y aún no han sido enviados
  const pendingMessages = await db
    .select()
    .from(scheduledWhatsAppMessages)
    .where(
      and(
        eq(scheduledWhatsAppMessages.status, 'pending'),
        lte(scheduledWhatsAppMessages.scheduledTime, new Date())
      )
    );

  console.log(
    '[CRON WhatsApp] Mensajes pendientes encontrados:',
    pendingMessages.length
  );

  if (pendingMessages.length === 0) {
    return {
      success: true,
      message: 'No hay mensajes pendientes para enviar',
      processed: 0,
    };
  }

  let successCount = 0;
  let failCount = 0;

  for (const msgRecord of pendingMessages) {
    try {
      console.log(`[CRON WhatsApp] Procesando mensaje ${msgRecord.id}...`);

      // Parsear phoneNumbers (puede ser array o JSON string)
      let phoneNumbers: string[] = [];
      if (msgRecord.phoneNumbers) {
        if (typeof msgRecord.phoneNumbers === 'string') {
          phoneNumbers = JSON.parse(msgRecord.phoneNumbers);
        } else if (Array.isArray(msgRecord.phoneNumbers)) {
          phoneNumbers = msgRecord.phoneNumbers;
        }
      }

      // Parsear variables (puede ser array o JSON string)
      let variables: string[] = [];
      if (msgRecord.variables) {
        if (typeof msgRecord.variables === 'string') {
          variables = JSON.parse(msgRecord.variables);
        } else if (Array.isArray(msgRecord.variables)) {
          variables = msgRecord.variables;
        }
      }

      console.log(
        `[CRON WhatsApp] Números: ${phoneNumbers}, Variables: ${JSON.stringify(variables)}`
      );
      console.log(
        `[CRON WhatsApp] Template: ${msgRecord.templateName || 'NINGUNO'}, Texto: ${msgRecord.messageText?.substring(0, 100)}`
      );

      // Enviar a cada número de teléfono
      for (const phoneNumber of phoneNumbers) {
        console.log(`[CRON WhatsApp] ➡️  Enviando a ${phoneNumber}...`);

        try {
          const response = await sendWhatsAppMessage({
            to: phoneNumber,
            text: msgRecord.messageText,
            forceTemplate: !!msgRecord.templateName,
            templateName: msgRecord.templateName,
            variables: variables,
            languageCode: 'es',
            autoSession: true, // ✅ Abrir ventana automáticamente si es necesario
          });

          console.log(
            `[CRON WhatsApp] ✅ Enviado a ${phoneNumber}:`,
            JSON.stringify(response, null, 2)
          );
        } catch (sendError) {
          console.error(
            `[CRON WhatsApp] ❌ Error enviando a ${phoneNumber}:`,
            sendError
          );
          throw sendError; // Re-lanzar para que el mensaje se marque como fallido
        }
      }

      // Actualizar estado a "enviado"
      await db
        .update(scheduledWhatsAppMessages)
        .set({
          status: 'sent',
          sentAt: new Date(),
        })
        .where(eq(scheduledWhatsAppMessages.id, msgRecord.id));

      console.log(
        `[CRON WhatsApp] Mensaje ${msgRecord.id} enviado exitosamente`
      );

      // 🔄 Si es recurrente, generar la siguiente instancia
      if (msgRecord.isRecurring && msgRecord.recurrence !== 'no-repeat') {
        try {
          const nextOccurrence = calculateNextOccurrence(
            msgRecord.scheduledTime,
            msgRecord.recurrence,
            msgRecord.recurrenceConfig
          );

          if (nextOccurrence) {
            await db.insert(scheduledWhatsAppMessages).values({
              phoneNumbers: msgRecord.phoneNumbers,
              messageText: msgRecord.messageText,
              waSubjectText: msgRecord.waSubjectText,
              templateName: msgRecord.templateName,
              variables: msgRecord.variables,
              scheduledTime: nextOccurrence,
              codigoPais: msgRecord.codigoPais,
              userId: msgRecord.userId,
              status: 'pending',
              recurrence: msgRecord.recurrence,
              recurrenceConfig: msgRecord.recurrenceConfig,
              isRecurring: true,
              parentId: msgRecord.parentId || msgRecord.id,
            });

            // Actualizar last_occurrence del padre
            await db
              .update(scheduledWhatsAppMessages)
              .set({ lastOccurrence: new Date() })
              .where(
                eq(
                  scheduledWhatsAppMessages.id,
                  msgRecord.parentId || msgRecord.id
                )
              );

            console.log(
              `[CRON WhatsApp] Siguiente instancia creada para ${nextOccurrence.toISOString()}`
            );
          }
        } catch (recurrenceError) {
          console.error(
            `[CRON WhatsApp] Error generando siguiente instancia:`,
            recurrenceError
          );
        }
      }

      successCount++;
    } catch (error) {
      failCount++;
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';

      await db
        .update(scheduledWhatsAppMessages)
        .set({
          status: 'failed',
          errorMessage: errorMsg,
        })
        .where(eq(scheduledWhatsAppMessages.id, msgRecord.id));

      console.error(
        `[CRON WhatsApp] Failed to send message ${msgRecord.id}:`,
        error
      );
    }
  }

  return {
    success: true,
    message: `Procesados ${successCount} mensajes (${failCount} fallaron)`,
    processed: successCount + failCount,
    success_count: successCount,
    failed_count: failCount,
  };
}

export async function GET(request: NextRequest) {
  try {
    // Validar que la llamada es segura (desde Vercel Cron o con token CRON_SECRET)
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get('authorization');
    const vercelCronHeader = request.headers.get('x-vercel-cron');

    // Validar si viene de Vercel Cron o del token local
    const isFromVercel = vercelCronHeader === 'true';
    const isAuthorized =
      isFromVercel || (cronSecret && authHeader === `Bearer ${cronSecret}`);

    if (!isAuthorized) {
      console.log('[CRON WhatsApp] Unauthorized attempt:', {
        vercelCron: vercelCronHeader,
        hasAuth: !!authHeader,
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[CRON WhatsApp] Starting...', {
      source: isFromVercel ? 'Vercel Cron' : 'Local Token',
    });

    // Ejecutar la lógica de envío directamente
    const result = await sendScheduledWhatsAppMessages();

    return NextResponse.json(result);
  } catch (error) {
    console.error('[CRON WhatsApp] Error:', error);
    return NextResponse.json(
      {
        error: 'Error en CRON de WhatsApp',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
