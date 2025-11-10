/**
 * Formatea una fecha a la zona horaria de Colombia (America/Bogota UTC-5)
 * en formato 12 horas con AM/PM
 */
export function formatDateColombia(date: Date | string): string {
  // Convertir a Date
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  // Formatear con zona horaria Colombia
  return dateObj.toLocaleString('es-CO', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

/**
 * Formatea una fecha a la zona horaria de Colombia sin segundos
 */
export function formatDateColombiaShort(date: Date | string): string {
  // Convertir a Date
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  // Formatear con zona horaria Colombia, sin segundos
  return dateObj.toLocaleString('es-CO', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}
