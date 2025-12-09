import { NextRequest, NextResponse } from 'next/server';

import { z } from 'zod';

import { sendDoorAccessSignal } from '~/server/services/esp32/door-access.service';
import { normalizeEsp32User } from '~/server/utils/esp32/normalize-user';

export const runtime = 'nodejs';

interface WebhookPayload {
  userId: string;
  email: string;
  name: string;
  daysRemaining: number;
  subscriptionEndDate: string;
  timestamp: string;
}

interface ESP32Response {
  ok: boolean;
  status?: number;
  reason?: string; // 'not_configured' | 'timeout' | 'error' | 'success'
}

interface SuccessResponse {
  success: true;
  message: string;
  payload: WebhookPayload;
  esp32?: ESP32Response;
}

interface ErrorResponse {
  success: false;
  error: string;
  details?: string;
  fallback?: string;
}

// Schema de validación para el payload de entrada
const webhookPayloadSchema = z.object({
  userId: z.string().min(1),
  email: z.string().email(),
  name: z.string().optional(),
  daysRemaining: z.number().optional(),
  subscriptionEndDate: z.string().optional(),
  timestamp: z.string().optional(),
});

export async function POST(request: NextRequest): Promise<NextResponse<SuccessResponse | ErrorResponse>> {
  try {
    const body = await request.json();

    // Validar payload con Zod
    const validation = webhookPayloadSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Validación fallida: datos de usuario incompletos o inválidos' },
        { status: 400 }
      );
    }

    const { userId, email, name, daysRemaining, subscriptionEndDate } = validation.data;

    // Payload del webhook
    const payload: WebhookPayload = {
      userId,
      email,
      name: name ?? 'N/A',
      daysRemaining: daysRemaining ?? 0,
      subscriptionEndDate: subscriptionEndDate ?? new Date().toISOString(),
      timestamp: new Date().toISOString(),
    };

    // Intentar enviar señal al ESP32 (si está configurado)
    let esp32Result: ESP32Response | undefined;
    const esp32Username = normalizeEsp32User(name ?? email.split('@')[0]);

    const doorAccessResult = await sendDoorAccessSignal({
      usuario: esp32Username,
      estado: 'activo',
    });

    if (doorAccessResult.ok) {
      esp32Result = {
        ok: true,
        status: doorAccessResult.status,
        reason: 'success',
      };
    } else if (doorAccessResult.error?.includes('no configurada')) {
      // ESP32 no está configurado - no incluir en respuesta
      esp32Result = undefined;
    } else if (doorAccessResult.error?.includes('Timeout')) {
      // Timeout esperando respuesta
      esp32Result = {
        ok: false,
        reason: 'timeout',
      };
    } else {
      // Error genérico de conexión
      esp32Result = {
        ok: false,
        reason: 'error',
      };
    }

    const response: SuccessResponse = {
      success: true,
      message: 'Webhook procesado exitosamente',
      payload,
      ...(esp32Result && { esp32: esp32Result }),
    };

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Error al procesar webhook',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}

