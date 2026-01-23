import { NextRequest, NextResponse } from 'next/server';

import { z } from 'zod';

import { db } from '~/server/db';
import { scheduledWhatsAppMessages } from '~/server/db/schema';

// Validación del payload
const scheduleMessageSchema = z.object({
  phoneNumbers: z
    .array(z.string())
    .nonempty('Se requieren al menos un número de teléfono'),
  messageText: z.string().min(1, 'El mensaje es requerido'),
  waSubjectText: z.string().optional().nullable(),
  templateName: z.string().optional().nullable(),
  variables: z.array(z.string()).optional().nullable(),
  scheduledTime: z.string(),
  codigoPais: z.string().default('+57'),
  userId: z.string().optional().nullable(),
  recurrence: z.string().default('no-repeat'),
  recurrenceConfig: z
    .object({
      interval: z.number(),
      unit: z.enum(['days', 'weeks', 'months']),
      weekdays: z.array(z.number()).optional(),
    })
    .optional()
    .nullable(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar payload
    const validatedData = scheduleMessageSchema.parse(body);

    // Verificar que la hora programada sea en el futuro
    const scheduledDate = new Date(validatedData.scheduledTime);

    if (isNaN(scheduledDate.getTime())) {
      return NextResponse.json(
        {
          error: 'Formato de fecha inválido',
          details: validatedData.scheduledTime,
        },
        { status: 400 }
      );
    }

    if (scheduledDate <= new Date()) {
      return NextResponse.json(
        { error: 'La hora programada debe ser en el futuro' },
        { status: 400 }
      );
    }

    // Guardar en BD
    const savedMessage = await db
      .insert(scheduledWhatsAppMessages)
      .values({
        phoneNumbers: validatedData.phoneNumbers,
        messageText: validatedData.messageText,
        waSubjectText: validatedData.waSubjectText || null,
        templateName: validatedData.templateName || null,
        variables: validatedData.variables
          ? JSON.stringify(validatedData.variables)
          : null,
        scheduledTime: scheduledDate,
        codigoPais: validatedData.codigoPais,
        userId: validatedData.userId || null,
        status: 'pending',
        recurrence: validatedData.recurrence || 'no-repeat',
        recurrenceConfig: validatedData.recurrenceConfig
          ? JSON.stringify(validatedData.recurrenceConfig)
          : null,
        isRecurring: validatedData.recurrence !== 'no-repeat',
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        message: `Mensaje programado para ${scheduledDate.toLocaleString('es-CO')}`,
        data: savedMessage[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[WhatsApp Schedule] Error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validación fallida',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error al programar el mensaje' },
      { status: 500 }
    );
  }
}
