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

/**
 * Formatea para ADMIN tickets 'Actualización' ajustando -5h manualmente
 * sin afectar el resto de funcionalidades. Solo usar en la tabla admin.
 */
export function formatDateColombiaAdminTicket(date: Date | string): string {
  const dateObj =
    typeof date === 'string' ? new Date(date) : new Date(date.getTime());
  // Ajuste manual de -5 horas
  dateObj.setHours(dateObj.getHours() - 5);
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

/**
 * Fecha larga en español: "junio 20, 2026".
 * Las fechas "YYYY-MM-DD…" se leen como día local (sin corrimiento de zona).
 * Si el valor no es una fecha válida, se devuelve tal cual.
 */
export function formatFechaLarga(
  valor: Date | string | null | undefined
): string {
  if (valor == null || valor === '') return '';
  let d: Date;
  if (typeof valor === 'string') {
    // "2026-06-20" o "2026-06-20T00:00:00.000Z": se toma solo el día.
    const soloFecha = /^(\d{4})-(\d{2})-(\d{2})(?:T|$)/.exec(valor.trim());
    d = soloFecha
      ? new Date(
          Number(soloFecha[1]),
          Number(soloFecha[2]) - 1,
          Number(soloFecha[3])
        )
      : new Date(valor);
  } else {
    d = valor;
  }
  if (Number.isNaN(d.getTime())) return String(valor);
  const mes = d.toLocaleDateString('es-CO', { month: 'long' });
  return `${mes} ${d.getDate()}, ${d.getFullYear()}`;
}
