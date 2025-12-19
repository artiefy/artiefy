
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

/**
 * Get environment variable with trim and falsy check
 */
function getEnv(name: string): string | undefined {
    const value = process.env[name];
    return value && value.trim().length > 0 ? value.trim() : undefined;
}

/**
 * Fetch with timeout using AbortController
 * Timeout is in milliseconds (default: 1500ms)
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
 * - If active=false, returns immediately with 'inactive' reason
 * - Includes X-ESP32-KEY header if ESP32_API_KEY is set
 * - Timeout: 1500ms by default
 *
 * @param active - true to open door, false to keep closed
 * @param options - Optional configuration (timeoutMs)
 * @returns ESP32ResponseData with ok, status, and reason
 */
async function sendDoorDecision(
    active: boolean,
    options?: SendDoorDecisionOptions
): Promise<ESP32ResponseData> {
    // If not active, return inactive reason without calling ESP32
    if (!active) {
        return { ok: false, reason: 'inactive' };
    }

    const baseUrl = getEnv('ESP32_BASE_URL');
    if (!baseUrl) {
        return { ok: false, reason: 'not_configured' };
    }

    const apiKey = getEnv('ESP32_API_KEY');
    const timeoutMs = options?.timeoutMs ?? 1500;

    const url = buildUrl(baseUrl, '/door');

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    if (apiKey) {
        headers['X-ESP32-KEY'] = apiKey;
    }

    try {
        const res = await fetchWithTimeout(
            url,
            {
                method: 'POST',
                headers,
                body: JSON.stringify({ active: true }),
            },
            timeoutMs
        );

        // Handle auth errors
        if (res.status === 401 || res.status === 403) {
            return { ok: false, status: res.status, reason: 'unauthorized' };
        }

        // Handle other HTTP errors
        if (!res.ok) {
            return { ok: false, status: res.status, reason: 'error' };
        }

        // Try to parse JSON response from ESP32 (optional, 2xx is success)
        try {
            const data = (await res.json()) as unknown;

            if (
                typeof data === 'object' &&
                data !== null &&
                'ok' in data &&
                typeof (data as { ok: unknown }).ok === 'boolean'
            ) {
                const ok = (data as { ok: boolean }).ok;
                return { ok, status: res.status, reason: ok ? 'success' : 'error' };
            }
        } catch {
            // Ignore JSON parse errors - 2xx means success
        }

        return { ok: true, status: res.status, reason: 'success' };
    } catch (err) {
        // Check if it's a timeout (AbortError)
        const isAbort =
            err instanceof Error &&
            (err.name === 'AbortError' || err.message.toLowerCase().includes('aborted'));

        return { ok: false, reason: isAbort ? 'timeout' : 'error' };
    }
}

/**
 * ESP32 Client singleton
 */
export const esp32Client = {
    sendDoorDecision,
};
