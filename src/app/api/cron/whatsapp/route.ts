import { NextRequest, NextResponse } from 'next/server';

import { and, eq, lte } from 'drizzle-orm';

import { db } from '~/server/db';
import { scheduledWhatsAppMessages } from '~/server/db/schema';

export const maxDuration = 60;

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

      // Enviar a cada número de teléfono
      for (const phoneNumber of phoneNumbers) {
        // Llamar a la API de WhatsApp del super-admin para enviar
        const sendResponse = await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/super-admin/whatsapp`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: phoneNumber,
              text: msgRecord.messageText,
              forceTemplate: !!msgRecord.templateName,
              templateName: msgRecord.templateName,
              variables: variables,
              languageCode: 'es',
              autoSession: false,
            }),
          }
        );

        console.log(
          `[CRON WhatsApp] Response status for ${phoneNumber}:`,
          sendResponse.status
        );

        if (!sendResponse.ok) {
          const errorText = await sendResponse.text();
          console.error(
            `[CRON WhatsApp] Error sending to ${phoneNumber} (status ${sendResponse.status}):`,
            errorText
          );
          throw new Error(
            `WhatsApp API error: ${errorText || sendResponse.statusText}`
          );
        }

        try {
          const responseData = await sendResponse.json();
          console.log(
            `[CRON WhatsApp] Successfully sent to ${phoneNumber}:`,
            responseData
          );
        } catch (parseError) {
          console.error(
            `[CRON WhatsApp] Error parsing response for ${phoneNumber}:`,
            parseError
          );
          throw new Error(
            `Failed to parse WhatsApp response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`
          );
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
