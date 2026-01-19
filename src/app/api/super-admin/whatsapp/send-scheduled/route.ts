import { NextRequest, NextResponse } from 'next/server';

import { and,eq, lte } from 'drizzle-orm';

import { db } from '~/server/db';
import { scheduledWhatsAppMessages } from '~/server/db/schema';

/**
 * Endpoint CRON que busca y envía mensajes programados
 * Debe ser llamado periódicamente (ej: cada minuto) por un servicio CRON externo
 * o por un job scheduler como Vercel Cron, AWS CloudWatch, etc.
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar que es una llamada válida (desde Vercel Cron o con token CRON_SECRET)
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get('authorization');
    const vercelCronHeader = request.headers.get('x-vercel-cron');

    const isFromVercel = vercelCronHeader === 'true';
    const isAuthorized =
      isFromVercel || (cronSecret && authHeader === `Bearer ${cronSecret}`);

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[CRON WhatsApp] Iniciando...');
    console.log(
      '[CRON WhatsApp] Hora actual del servidor:',
      new Date().toISOString()
    );
    console.log(
      '[CRON WhatsApp] Fuente:',
      isFromVercel ? 'Vercel Cron' : 'Token local'
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
    console.log(
      '[CRON WhatsApp] Detalles:',
      JSON.stringify(pendingMessages, null, 2)
    );

    if (pendingMessages.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No hay mensajes pendientes para enviar',
        processed: 0,
      });
    }

    // Enviar cada mensaje
    let successCount = 0;
    let failCount = 0;

    for (const msgRecord of pendingMessages) {
      try {
        console.log(`[CRON WhatsApp] Procesando mensaje ${msgRecord.id}...`);

        // Parsear phoneNumbers (puede ser array o JSON string)
        let phoneNumbers = msgRecord.phoneNumbers;
        if (typeof phoneNumbers === 'string') {
          phoneNumbers = JSON.parse(phoneNumbers);
        }

        // Parsear variables (puede ser array o JSON string)
        let variables = [];
        if (msgRecord.variables) {
          if (typeof msgRecord.variables === 'string') {
            variables = JSON.parse(msgRecord.variables);
          } else {
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
                languageCode: 'es', // 👈 Especifica idioma español
                autoSession: false, // 👈 Deshabilita auto-envío de templates de sesión
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
        const errorMsg =
          error instanceof Error ? error.message : 'Unknown error';

        // Actualizar estado a "fallido" con mensaje de error
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

    return NextResponse.json({
      success: true,
      message: `Procesados ${successCount} mensajes (${failCount} fallaron)`,
      processed: successCount + failCount,
      success_count: successCount,
      failed_count: failCount,
    });
  } catch (error) {
    console.error('[CRON WhatsApp] Error:', error);
    return NextResponse.json(
      {
        error: 'Error procesando mensajes programados',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
