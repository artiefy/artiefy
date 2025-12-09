/**
 * EXAMPLES.ts
 *
 * Este archivo contiene ejemplos de uso de la integración ESP32.
 * Los ejemplos están comentados y documentados para referencia.
 *
 * @example Enviar señal simple al ESP32
 * ```typescript
 * import { sendDoorAccessSignal } from '~/server/services/esp32/door-access.service';
 *
 * const result = await sendDoorAccessSignal({
 *   usuario: 'juanperez',
 *   estado: 'activo',
 * });
 *
 * if (result.ok) {
 *   console.log('Puerta abierta exitosamente');
 * } else {
 *   console.error('Error:', result.error);
 * }
 * ```
 *
 * @example Normalizar usuario antes de enviar
 * ```typescript
 * import { normalizeEsp32User } from '~/server/utils/esp32/normalize-user';
 * import { sendDoorAccessSignal } from '~/server/services/esp32/door-access.service';
 *
 * const userName = 'Juan José García';
 * const normalizedName = normalizeEsp32User(userName);
 * // normalizedName: 'juanjosegarcia'
 *
 * const result = await sendDoorAccessSignal({
 *   usuario: normalizedName,
 *   estado: 'activo',
 * });
 * ```
 *
 * @example Usar en un API route
 * ```typescript
 * import { NextRequest, NextResponse } from 'next/server';
 * import { sendDoorAccessSignal } from '~/server/services/esp32/door-access.service';
 * import { normalizeEsp32User } from '~/server/utils/esp32/normalize-user';
 *
 * export async function POST(request: NextRequest) {
 *   const { userName } = await request.json();
 *
 *   const result = await sendDoorAccessSignal({
 *     usuario: normalizeEsp32User(userName),
 *     estado: 'activo',
 *   });
 *
 *   return NextResponse.json(result);
 * }
 * ```
 *
 * @example Usar en un Server Action
 * ```typescript
 * 'use server';
 *
 * import { sendDoorAccessSignal } from '~/server/services/esp32/door-access.service';
 * import { normalizeEsp32User } from '~/server/utils/esp32/normalize-user';
 *
 * export async function openDoorForUser(userName: string) {
 *   const result = await sendDoorAccessSignal({
 *     usuario: normalizeEsp32User(userName),
 *     estado: 'activo',
 *   });
 *
 *   if (!result.ok) {
 *     throw new Error(`No se pudo abrir la puerta: ${result.error}`);
 *   }
 *
 *   return { success: true, status: result.status };
 * }
 * ```
 *
 * @example Respuestas esperadas
 * ```typescript
 * // Éxito (ESP32 configurado)
 * {
 *   ok: true,
 *   status: 200
 * }
 *
 * // Error de conexión
 * {
 *   ok: false,
 *   error: 'ESP32 no responde'
 * }
 *
 * // Timeout (1500ms)
 * {
 *   ok: false,
 *   error: 'Timeout esperando respuesta de ESP32'
 * }
 *
 * // ESP32 no configurado
 * {
 *   ok: false,
 *   error: 'ESP32 no configurada'
 * }
 * ```
 */

export { };
