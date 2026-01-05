import { NextRequest, NextResponse } from 'next/server';

import { and, desc, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '~/server/db';
import { accessLogs, users } from '~/server/db/schema';
import {
  esp32Client,
  type ESP32ResponseData,
} from '~/server/esp32/esp32-client';

export const runtime = 'nodejs';

// Schema de validación
const registerAccessSchema = z.object({
  userId: z.string().min(1, 'userId es requerido'),
  action: z.enum(['entry', 'exit']),
});

interface SuccessResponse {
  success: true;
  message: string;
  action: 'entry' | 'exit';
  timestamp: string;
  esp32?: ESP32ResponseData;
  subscriptionStatus: string;
}

interface ErrorResponse {
  success: false;
  error: string;
  details?: string;
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<SuccessResponse | ErrorResponse>> {
  try {
    const body = await request.json();

    // Validar payload
    const validation = registerAccessSchema.safeParse(body);
    if (!validation.success) {
      console.error('❌ Validación fallida:', validation.error.message);
      return NextResponse.json(
        {
          success: false,
          error: 'Validación fallida',
          details: validation.error.message,
        },
        { status: 400 }
      );
    }

    const { userId, action } = validation.data;
    console.log(
      `🚪 Registrando ${action === 'entry' ? 'ENTRADA' : 'SALIDA'} para usuario: ${userId}`
    );

    // Buscar usuario
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

    // Validar suscripción
    // Obtener hora local de Colombia (UTC-5)
    const now = new Date();
    // Ajustar a zona horaria de Colombia (UTC-5)
    const localTime = new Date(now.getTime() - 5 * 60 * 60 * 1000);
    console.log(`🕐 Hora UTC: ${now.toISOString()}`);
    console.log(`🕐 Hora local Colombia: ${localTime.toISOString()}`);

    const isSubscriptionActive =
      user.subscriptionStatus === 'active' &&
      user.subscriptionEndDate &&
      new Date(user.subscriptionEndDate) > now;

    console.log(
      `📋 Estado suscripción: ${isSubscriptionActive ? 'ACTIVA' : 'INACTIVA'}`
    );

    // ==========================================
    // LÓGICA DE ENTRADA
    // ==========================================
    if (action === 'entry') {
      if (!isSubscriptionActive) {
        console.log('🚫 Suscripción inactiva, entrada no permitida');
        return NextResponse.json(
          {
            success: false,
            error: 'Suscripción inactiva - Acceso denegado',
          },
          { status: 403 }
        );
      }

      // Suscripción activa: llamar ESP32
      console.log('🚀 Abriendo puerta para entrada...');
      const esp32BaseUrl = process.env.ESP32_BASE_URL ?? 'NO_CONFIGURADO';
      console.log(`🌐 ESP32_BASE_URL: ${esp32BaseUrl}`);

      const esp32Result = await esp32Client.sendDoorDecision(true);

      console.log(`📡 Resultado ESP32:`, {
        ok: esp32Result.ok,
        status: esp32Result.status,
        reason: esp32Result.reason,
      });

      // Guardar registro de entrada
      await db.insert(accessLogs).values({
        userId: user.id,
        entryTime: localTime,
        subscriptionStatus: 'active',
        esp32Status: esp32Result.reason ?? null,
      });

      console.log(`✅ Registro de entrada guardado`);

      const response: SuccessResponse = {
        success: true,
        message: esp32Result.ok
          ? 'Entrada registrada - Puerta abierta'
          : 'Entrada registrada pero ESP32 no respondió',
        action: 'entry',
        timestamp: localTime.toISOString(),
        esp32: esp32Result,
        subscriptionStatus: 'active',
      };

      return NextResponse.json(response);
    }

    // ==========================================
    // LÓGICA DE SALIDA
    // ==========================================
    if (action === 'exit') {
      // Buscar último registro sin salida (exitTime IS NULL)
      const lastEntry = await db.query.accessLogs.findFirst({
        where: and(eq(accessLogs.userId, userId), isNull(accessLogs.exitTime)),
        orderBy: [desc(accessLogs.entryTime)],
      });

      if (!lastEntry) {
        console.error('❌ No hay registro de entrada sin salida');
        return NextResponse.json(
          {
            success: false,
            error: 'No hay registro de entrada abierto para esta persona',
          },
          { status: 404 }
        );
      }

      console.log(`📝 Registro de entrada abierto: ${lastEntry.entryTime}`);

      // Si suscripción ACTIVA: registrar salida + llamar ESP32
      if (isSubscriptionActive) {
        console.log('🚀 Abriendo puerta para salida (suscripción activa)...');
        const esp32BaseUrl = process.env.ESP32_BASE_URL ?? 'NO_CONFIGURADO';
        console.log(`🌐 ESP32_BASE_URL: ${esp32BaseUrl}`);

        const esp32Result = await esp32Client.sendDoorDecision(true);

        console.log(`📡 Resultado ESP32:`, {
          ok: esp32Result.ok,
          status: esp32Result.status,
          reason: esp32Result.reason,
        });

        // Actualizar registro con hora de salida
        await db
          .update(accessLogs)
          .set({
            exitTime: localTime,
            esp32Status: esp32Result.reason ?? null,
          })
          .where(eq(accessLogs.id, lastEntry.id));

        console.log(`✅ Registro de salida guardado (con ESP32)`);

        const response: SuccessResponse = {
          success: true,
          message: esp32Result.ok
            ? 'Salida registrada - Puerta abierta'
            : 'Salida registrada pero ESP32 no respondió',
          action: 'exit',
          timestamp: localTime.toISOString(),
          esp32: esp32Result,
          subscriptionStatus: 'active',
        };

        return NextResponse.json(response);
      }

      // Si suscripción INACTIVA: solo registrar salida (sin ESP32)
      console.log('🚪 Registrando salida sin ESP32 (suscripción inactiva)');

      await db
        .update(accessLogs)
        .set({ exitTime: localTime })
        .where(eq(accessLogs.id, lastEntry.id));

      console.log(`✅ Registro de salida guardado (sin ESP32)`);

      const response: SuccessResponse = {
        success: true,
        message: 'Salida registrada (suscripción inactiva - sin abrir puerta)',
        action: 'exit',
        timestamp: localTime.toISOString(),
        subscriptionStatus: 'inactive',
      };

      return NextResponse.json(response);
    }

    // No debería llegar aquí
    return NextResponse.json(
      {
        success: false,
        error: 'Acción inválida',
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('❌ Error en register-access:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al procesar registro',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}
