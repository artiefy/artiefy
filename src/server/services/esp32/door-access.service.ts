import { env } from '~/env';

export interface DoorAccessResult {
    ok: boolean;
    status?: number;
    error?: string;
}

/**
 * Envía una señal de acceso a la puerta al ESP32.
 * 
 * @param input Objeto con usuario (normalizado) y estado
 * @returns Resultado tipado con ok, status y error opcional
 */
export async function sendDoorAccessSignal(input: {
    usuario: string;
    estado: 'activo' | 'inactivo';
}): Promise<DoorAccessResult> {
    const esp32Url = env.ESP32_HTTP_URL;

    // Si no hay URL configurada, retornar resultado fallido pero sin lanzar error
    if (!esp32Url) {
        return {
            ok: false,
            error: 'ESP32_HTTP_URL no configurada',
        };
    }

    if (!input.usuario || !input.estado) {
        return {
            ok: false,
            error: 'usuario y estado son requeridos',
        };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);

    try {
        const payload = `${input.usuario}|${input.estado}`;

        const headers: Record<string, string> = {
            'Content-Type': 'text/plain',
        };

        if (env.ESP32_AUTH_TOKEN) {
            headers.Authorization = `Bearer ${env.ESP32_AUTH_TOKEN}`;
        }

        const response = await fetch(`${esp32Url}/access`, {
            method: 'POST',
            headers,
            body: payload,
            signal: controller.signal,
        });

        if (!response.ok) {
            return {
                ok: false,
                status: response.status,
                error: `HTTP ${response.status}`,
            };
        }

        return {
            ok: true,
            status: response.status,
        };
    } catch (error) {
        // Capturar AbortError y otros errores
        if (error instanceof Error && error.name === 'AbortError') {
            return {
                ok: false,
                error: 'Timeout: ESP32 no respondió en 1500ms',
            };
        }

        return {
            ok: false,
            error: error instanceof Error ? error.message : 'Error desconocido',
        };
    } finally {
        clearTimeout(timeoutId);
    }
}
