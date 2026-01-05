import { NextResponse } from 'next/server';

import {
  esp32Client,
  type ESP32ResponseData,
} from '~/server/esp32/esp32-client';

export const runtime = 'nodejs';

interface HealthResponse {
  ok: boolean;
  status?: number;
  reason?: string;
  timestamp: string;
}

/**
 * Endpoint de diagnóstico para verificar conectividad con ESP32
 * GET /api/super-admin/esp32-health
 *
 * Llama a esp32Client.checkHealth() y devuelve el resultado
 */
export async function GET(): Promise<NextResponse<HealthResponse>> {
  console.log('🏥 Iniciando verificación de salud del ESP32...');

  const result: ESP32ResponseData = await esp32Client.checkHealth();

  console.log(`📋 Resultado checkHealth:`, {
    ok: result.ok,
    status: result.status,
    reason: result.reason,
  });

  const response: HealthResponse = {
    ok: result.ok,
    status: result.status,
    reason: result.reason,
    timestamp: new Date().toISOString(),
  };

  // Si no está ok, devolver 503 Service Unavailable
  const statusCode = result.ok ? 200 : 503;

  return NextResponse.json(response, { status: statusCode });
}
