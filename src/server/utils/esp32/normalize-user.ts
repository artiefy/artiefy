/**
 * Normaliza un nombre de usuario para enviar al ESP32.
 * 
 * Reglas:
 * - Convertir a minúsculas
 * - Eliminar espacios
 * - Eliminar tildes y acentos
 * - Dejar solo letras y números
 * 
 * @param input Nombre o email a normalizar
 * @returns Usuario normalizado
 */
export function normalizeEsp32User(input: string): string {
    if (!input || typeof input !== 'string') {
        return '';
    }

    return input
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Eliminar diacríticos
        .replace(/\s+/g, '') // Eliminar espacios
        .replace(/[^a-z0-9]/g, ''); // Dejar solo letras y números
}
