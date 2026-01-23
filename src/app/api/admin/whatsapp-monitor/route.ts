import { NextResponse } from 'next/server';

import { desc } from 'drizzle-orm';

import { db } from '~/server/db';
import { scheduledWhatsAppMessages } from '~/server/db/schema';

/**
 * Endpoint para monitorear mensajes programados de WhatsApp
 * GET /api/admin/whatsapp-monitor
 */
export async function GET() {
  try {
    // Obtener estadísticas
    const allMessages = await db
      .select()
      .from(scheduledWhatsAppMessages)
      .orderBy(desc(scheduledWhatsAppMessages.createdAt))
      .limit(50);

    const pending = allMessages.filter((m) => m.status === 'pending');
    const sent = allMessages.filter((m) => m.status === 'sent');
    const failed = allMessages.filter((m) => m.status === 'failed');
    const recurring = allMessages.filter((m) => m.isRecurring);

    // Próximos envíos (solo pendientes)
    const nextMessages = pending
      .sort(
        (a, b) =>
          new Date(a.scheduledTime).getTime() -
          new Date(b.scheduledTime).getTime()
      )
      .slice(0, 10);

    // Últimos enviados
    const recentlySent = sent
      .filter((m) => m.sentAt)
      .sort(
        (a, b) => new Date(b.sentAt!).getTime() - new Date(a.sentAt!).getTime()
      )
      .slice(0, 10);

    return NextResponse.json({
      success: true,
      statistics: {
        total: allMessages.length,
        pending: pending.length,
        sent: sent.length,
        failed: failed.length,
        recurring: recurring.length,
      },
      nextMessages: nextMessages.map((m) => ({
        id: m.id,
        scheduledTime: m.scheduledTime,
        phoneNumbers: m.phoneNumbers,
        recurrence: m.recurrence,
        isRecurring: m.isRecurring,
        messagePreview: String(m.messageText).substring(0, 50) + '...',
      })),
      recentlySent: recentlySent.map((m) => ({
        id: m.id,
        sentAt: m.sentAt,
        phoneNumbers: m.phoneNumbers,
        recurrence: m.recurrence,
        isRecurring: m.isRecurring,
      })),
      failed: failed.map((m) => ({
        id: m.id,
        errorMessage: m.errorMessage,
        scheduledTime: m.scheduledTime,
      })),
    });
  } catch (error) {
    console.error('[WhatsApp Monitor] Error:', error);
    return NextResponse.json(
      {
        error: 'Error obteniendo estadísticas',
        details: error instanceof Error ? error.message : 'Unknown',
      },
      { status: 500 }
    );
  }
}
