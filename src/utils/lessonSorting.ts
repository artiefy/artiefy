const numberPattern = /\d+/;

export const extractLessonOrder = (title: string): number => {
  const match = numberPattern.exec(title);
  return match ? parseInt(match[0], 10) : Number.MAX_SAFE_INTEGER;
};

export const extractNumbersFromTitle = (title: string) => {
  // Eliminar lógica especial para bienvenida/presentación
  // Solo usar el orden numérico

  // SESIÓN X: Clase Y: ...
  const sessionClassColon = /sesión\s*(\d+)\s*:\s*clase\s*(\d+)/i.exec(title);
  if (sessionClassColon) {
    return {
      session: parseInt(sessionClassColon[1], 10),
      class: parseInt(sessionClassColon[2], 10),
    };
  }

  // SESION X - Clase Y
  const sessionClassDash = /sesion\s*(\d+)\s*-\s*clase\s*(\d+)/i.exec(title);
  if (sessionClassDash) {
    return {
      session: parseInt(sessionClassDash[1], 10),
      class: parseInt(sessionClassDash[2], 10),
    };
  }

  // SESIÓN/SESION X: ...
  const sessionOnly = /ses(?:i|í)on\s*(\d+)/i.exec(title);
  if (sessionOnly) {
    return {
      session: parseInt(sessionOnly[1], 10),
      class: 0,
    };
  }

  // Clase Y: ...
  const classOnly = /clase\s*(\d+)/i.exec(title);
  if (classOnly) {
    return {
      session: 0,
      class: parseInt(classOnly[1], 10),
    };
  }

  // Nuevo: Número al inicio, e.g. "3: Introducción", "1 - Tema", "2) ..."
  const leadingNumber =
    /^\s*(?:lecci[oó]n|lesson|clase|ses(?:i|í)on)?\s*(\d+)(?=\s*[:.\-)]|\s|$)/i.exec(
      title
    );
  if (leadingNumber) {
    return {
      session: 0,
      class: parseInt(leadingNumber[1], 10),
    };
  }

  // Nuevo: cualquier número en el título como fallback
  const anyNumber = numberPattern.exec(title);
  if (anyNumber) {
    return {
      session: 0,
      class: parseInt(anyNumber[0], 10),
    };
  }

  // Default: put at the end
  return { session: 999, class: 999 };
};

// Ordena las lecciones por orderIndex ascendente, luego por id
export function sortLessons<
  T extends { orderIndex?: number | null; id?: number },
>(lessons: T[]): T[] {
  return [...(lessons ?? [])].sort(
    (a, b) =>
      (a.orderIndex ?? 1e9) - (b.orderIndex ?? 1e9) || (a.id ?? 0) - (b.id ?? 0)
  );
}
