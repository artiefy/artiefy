import { NextRequest, NextResponse } from 'next/server';

import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '~/server/db';
import { users } from '~/server/db/schema';
import {
  esp32Client,
  type ESP32ResponseData,
} from '~/server/esp32/esp32-client';

export const runtime = 'nodejs';

// Tipos de respuesta
interface WebhookPayload {
  userId: string;
  email: string;
  name: string;
  daysRemaining: number;
  subscriptionEndDate: string;
  timestamp: string;
}

interface SuccessResponse {
  success: true;
  message: string;
  payload: WebhookPayload;
  esp32?: ESP32ResponseData;
}

interface ErrorResponse {
  success: false;
  error: string;
  details?: string;
}

// Schema de validación para el payload de entrada
// Solo requiere userId - revalidación ocurre en servidor
const webhookPayloadSchema = z.object({
  userId: z.string().min(1, 'userId es requerido'),
});

export async function POST(
  request: NextRequest
): Promise<NextResponse<SuccessResponse | ErrorResponse>> {
  try {
    const body = await request.json();

    // Validar payload con Zod
    const validation = webhookPayloadSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validación fallida: userId es requerido',
          details: validation.error.message,
        },
        { status: 400 }
      );
    }

    const { userId } = validation.data;
    console.log(`🔍 Buscando usuario con ID: ${userId}`);

    // Consultar usuario en BD
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        id: true,
        name: true,
        email: true,
        subscriptionStatus: true,
        subscriptionEndDate: true,
      },
    });

    if (!user) {
      console.error(`❌ Usuario no encontrado: ${userId}`);
      return NextResponse.json(
        {
          success: false,
          error: 'Usuario no encontrado',
        },
        { status: 404 }
      );
    }

    console.log(`✅ Usuario encontrado: ${user.email}`);

    // Validar suscripción activa en servidor
    const now = new Date();
    const isSubscriptionActive =
      user.subscriptionStatus === 'active' &&
      user.subscriptionEndDate &&
      new Date(user.subscriptionEndDate) > now;

    console.log(
      `📋 Estado suscripción: ${isSubscriptionActive ? 'ACTIVA' : 'INACTIVA'}`
    );
    console.log(`📋 subscriptionStatus: ${user.subscriptionStatus}`);
    if (user.subscriptionEndDate) {
      console.log(
        `📋 subscriptionEndDate: ${user.subscriptionEndDate.toISOString()}`
      );
    }

    // Construir payload de respuesta
    const daysRemaining = isSubscriptionActive
      ? Math.ceil(
          (new Date(user.subscriptionEndDate!).getTime() - now.getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 0;

    const payload: WebhookPayload = {
      userId: user.id,
      email: user.email,
      name: user.name ?? 'N/A',
      daysRemaining,
      subscriptionEndDate:
        user.subscriptionEndDate?.toISOString() ?? new Date().toISOString(),
      timestamp: now.toISOString(),
    };

    // Si suscripción no está activa, responder sin llamar a ESP32
    if (!isSubscriptionActive) {
      console.log('🚫 Suscripción inactiva, no se envía comando al ESP32');
      const response: SuccessResponse = {
        success: true,
        message: 'Usuario verificado pero suscripción inactiva',
        payload,
        esp32: {
          ok: false,
          reason: 'inactive',
        },
      };
      return NextResponse.json(response);
    }

    // Suscripción activa: enviar comando al ESP32
    console.log('🚀 Suscripción activa, enviando comando al ESP32...');

    // Obtener ESP32_BASE_URL para loguear (sin exponer API key)
    const esp32BaseUrl = process.env.ESP32_BASE_URL ?? 'NO_CONFIGURADO';
    console.log(`🌐 ESP32_BASE_URL: ${esp32BaseUrl}`);

    const esp32Result = await esp32Client.sendDoorDecision(true);

    console.log(`📡 Resultado ESP32:`, {
      ok: esp32Result.ok,
      status: esp32Result.status,
      reason: esp32Result.reason,
    });

    const response: SuccessResponse = {
      success: true,
      message: esp32Result.ok
        ? 'Usuario verificado y puerta abierta'
        : 'Usuario verificado pero ESP32 no respondió correctamente',
      payload,
      esp32: esp32Result,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ Error en webhook-subscription:', error);
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
