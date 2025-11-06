/**
 * Formatea una fecha a la zona horaria de Colombia (America/Bogota UTC-5)
 * en formato 12 horas con AM/PM
 */
export function formatDateColombia(date: Date | string): string {
  // Siempre convertir a Date
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  // Obtener componentes locales y restar 5 horas manualmente
  let year = dateObj.getFullYear();
  let month = dateObj.getMonth() + 1;
  let day = dateObj.getDate();
  let hour = dateObj.getHours() - 5;
  const minute = dateObj.getMinutes();
  const second = dateObj.getSeconds();

  // Ajustar día y hora si la resta cruza medianoche
  if (hour < 0) {
    hour += 24;
    const prevDate = new Date(dateObj);
    prevDate.setDate(prevDate.getDate() - 1);
    year = prevDate.getFullYear();
    month = prevDate.getMonth() + 1;
    day = prevDate.getDate();
  }

  // Convertir a formato 12 horas
  const period = hour >= 12 ? 'p. m.' : 'a. m.';
  if (hour > 12) hour = hour - 12;
  if (hour === 0) hour = 12;
  const hourStr = String(hour).padStart(2, '0');
  const monthStr = String(month).padStart(2, '0');
  const dayStr = String(day).padStart(2, '0');
  const minuteStr = String(minute).padStart(2, '0');
  const secondStr = String(second).padStart(2, '0');

  return `${dayStr}/${monthStr}/${year}, ${hourStr}:${minuteStr}:${secondStr} ${period}`;
}

/**
 * Formatea una fecha a la zona horaria de Colombia sin segundos
 */
export function formatDateColombiaShort(date: Date | string): string {
  // Siempre convertir a Date
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  // Obtener componentes locales y restar 5 horas manualmente
  let year = dateObj.getFullYear();
  let month = dateObj.getMonth() + 1;
  let day = dateObj.getDate();
  let hour = dateObj.getHours() - 5;
  const minute = dateObj.getMinutes();

  // Ajustar día y hora si la resta cruza medianoche
  if (hour < 0) {
    hour += 24;
    const prevDate = new Date(dateObj);
    prevDate.setDate(prevDate.getDate() - 1);
    year = prevDate.getFullYear();
    month = prevDate.getMonth() + 1;
    day = prevDate.getDate();
  }

  // Convertir a formato 12 horas
  const period = hour >= 12 ? 'p. m.' : 'a. m.';
  if (hour > 12) hour = hour - 12;
  if (hour === 0) hour = 12;
  const hourStr = String(hour).padStart(2, '0');
  const monthStr = String(month).padStart(2, '0');
  const dayStr = String(day).padStart(2, '0');
  const minuteStr = String(minute).padStart(2, '0');

  return `${dayStr}/${monthStr}/${year}, ${hourStr}:${minuteStr} ${period}`;
}
