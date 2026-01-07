export type ESP32Reason =
  | 'success'
  | 'timeout'
  | 'error'
  | 'not_configured'
  | 'inactive'
  | 'unauthorized';

export interface ESP32ResponseData {
  ok: boolean;
  status?: number;
  reason?: ESP32Reason;
}

interface SendDoorDecisionOptions {
  timeoutMs?: number;
}

/**
 * Build full URL from base and path
 * Handles trailing slashes and leading slashes
 */
function buildUrl(baseUrl: string, path: string): string {
  const base = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

// Importar el env validado de T3
import { env } from '~/env';

/**
 * Get ESP32 configuration from validated env
 */
function getESP32Config() {
  return {
    baseUrl: env.ESP32_BASE_URL,
    apiKey: env.ESP32_API_KEY,
  };
}

/**
 * Fetch with timeout using AbortController
 * Timeout is in milliseconds (default: 5000ms)
 */
async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

/**
 * Send door decision to ESP32
 * Makes POST request to ESP32_BASE_URL/door with { "active": boolean }
 * - Validates subscription server-side in route.ts before calling this
 * - Includes X-ESP32-KEY header ONLY if ESP32_API_KEY is set and non-empty
 * - Timeout: 5000ms by default
 *
 * @param active - true to open door, false to keep closed
 * @param options - Optional configuration (timeoutMs)
 * @returns ESP32ResponseData with ok, status, and reason
 */
async function sendDoorDecision(
  active: boolean,
  options?: SendDoorDecisionOptions
): Promise<ESP32ResponseData> {
  const { baseUrl, apiKey } = getESP32Config();

  if (!baseUrl) {
    console.warn('⚠️ ESP32_BASE_URL no configurado en variables de entorno');
    return { ok: false, reason: 'not_configured' };
  }

  // TIMEOUT: 5000ms (5 segundos)
  const timeoutMs = options?.timeoutMs ?? 5000;

  const url = buildUrl(baseUrl, '/door');

  console.log(`📡 Enviando comando al ESP32: ${url}`);
  console.log(`📋 Body: { "active": ${active} }`);
  console.log(`⏱️ Timeout configurado: ${timeoutMs}ms`);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Solo incluir X-ESP32-KEY si apiKey está definido y no es vacío
  if (apiKey && apiKey.trim() !== '') {
    headers['X-ESP32-KEY'] = apiKey;
    console.log('🔑 API Key incluida en headers');
  } else {
    console.log('ℹ️ Sin API Key (ESP32_API_KEY no configurado)');
  }

  const startTime = Date.now();

  try {
    const res = await fetchWithTimeout(
      url,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ active }),
      },
      timeoutMs
    );

    const elapsed = Date.now() - startTime;
    console.log(
      `✅ Respuesta recibida en ${elapsed}ms - Status: ${res.status}`
    );

    // Leer body como texto para debug
    const bodyText = await res.text();
    console.log(`📦 Body de respuesta (texto):`, bodyText);

    // Manejar errores de autenticación
    if (res.status === 401 || res.status === 403) {
      console.error('🔒 Error de autenticación con ESP32 (401/403)');
      return { ok: false, status: res.status, reason: 'unauthorized' };
    }

    // Manejar otros errores HTTP (4xx, 5xx)
    if (!res.ok) {
      console.error(`❌ Error HTTP ${res.status}`);
      return { ok: false, status: res.status, reason: 'error' };
    }

    // Status 2xx = éxito
    // Intentar parsear JSON si el body no está vacío
    if (bodyText.trim()) {
      try {
        const data = JSON.parse(bodyText) as unknown;
        console.log('📦 Respuesta parseada como JSON:', data);

        if (
          typeof data === 'object' &&
          data !== null &&
          'ok' in data &&
          typeof (data as { ok: unknown }).ok === 'boolean'
        ) {
          const ok = (data as { ok: boolean }).ok;
          const reason = (data as { reason?: string }).reason;
          console.log(
            `🎯 ESP32 respondió: ok=${ok}, reason=${reason || 'N/A'}`
          );
          return { ok, status: res.status, reason: ok ? 'success' : 'error' };
        }
      } catch (jsonErr) {
        console.log(
          'ℹ️ No se pudo parsear JSON (no es crítico, status 2xx es éxito)'
        );
      }
    }

    console.log('✅ Comando enviado exitosamente (2xx)');
    return { ok: true, status: res.status, reason: 'success' };
  } catch (err) {
    const elapsed = Date.now() - startTime;

    // Verificar si es un timeout (AbortError)
    const isAbort =
      err instanceof Error &&
      (err.name === 'AbortError' ||
        err.message.toLowerCase().includes('aborted'));

    if (isAbort) {
      console.error(
        `⏱️ TIMEOUT después de ${elapsed}ms (límite: ${timeoutMs}ms)`
      );
      console.error(
        '💡 Verifica: 1) ESP32 encendido, 2) WiFi conectado, 3) URL correcta'
      );
      return { ok: false, reason: 'timeout' };
    }

    // Error de red u otro tipo (conexión rechazada, DNS, etc.)
    console.error(`❌ Error de red después de ${elapsed}ms:`, err);
    console.error(
      '💡 Verifica: 1) URL del ESP32, 2) Misma red local, 3) Firewall'
    );
    return { ok: false, reason: 'error' };
  }
}

/**
 * Función de diagnóstico para probar conectividad con ESP32
 * Llama al endpoint /health
 */
async function checkHealth(timeoutMs = 3000): Promise<ESP32ResponseData> {
  const { baseUrl } = getESP32Config();

  if (!baseUrl) {
    console.warn('⚠️ ESP32_BASE_URL no configurado');
    return { ok: false, reason: 'not_configured' };
  }

  const url = buildUrl(baseUrl, '/health');
  console.log(`🏥 Verificando salud del ESP32: ${url}`);

  const startTime = Date.now();

  try {
    const res = await fetchWithTimeout(url, { method: 'GET' }, timeoutMs);
    const elapsed = Date.now() - startTime;

    if (res.ok) {
      console.log(`✅ ESP32 responde correctamente en ${elapsed}ms`);
      return { ok: true, status: res.status, reason: 'success' };
    }

    console.warn(`⚠️ ESP32 respondió con status ${res.status}`);
    return { ok: false, status: res.status, reason: 'error' };
  } catch (err) {
    const elapsed = Date.now() - startTime;
    const isAbort =
      err instanceof Error &&
      (err.name === 'AbortError' ||
        err.message.toLowerCase().includes('aborted'));

    if (isAbort) {
      console.error(
        `⏱️ Timeout en /health después de ${elapsed}ms (límite: ${timeoutMs}ms)`
      );
      return { ok: false, reason: 'timeout' };
    }

    console.error(
      `❌ Error conectando a /health después de ${elapsed}ms:`,
      err
    );
    return { ok: false, reason: 'error' };
  }
}

/**
 * ESP32 Client singleton
 */
export const esp32Client = {
  sendDoorDecision,
  checkHealth, // Nueva función de diagnóstico
};
