const numberPattern = /\d+/;

export const extractLessonOrder = (title: string): number => {
  // Presentación siempre va primero
  if (
    title.toLowerCase().includes('presentacion') ||
    title.toLowerCase().includes('presentación') ||
    title.toLowerCase().includes('bienvenida')
  ) {
    return -1;
  }

  // Use RegExp.exec() instead of String.match()
  const match = numberPattern.exec(title);
  return match ? parseInt(match[0], 10) : Number.MAX_SAFE_INTEGER;
};

export const extractNumbersFromTitle = (title: string) => {
  // First check for "Bienvenida" pattern
  if (title.toLowerCase().includes('bienvenida')) {
    return {
      session: -1, // Ensures it comes first
      class: -1,
    };
  }

  // Check for "Clase 1" pattern without session
  const simpleClassMatch = /^clase\s*(\d+)/i.exec(title);
  if (simpleClassMatch) {
    return {
      session: 0,
      class: parseInt(simpleClassMatch[1]),
    };
  }

  // Check for "Sesion X - Clase Y" pattern
  const sessionClassMatch = /sesion\s*(\d+)\s*-\s*clase\s*(\d+)/i.exec(title);
  if (sessionClassMatch) {
    return {
      session: parseInt(sessionClassMatch[1]),
      class: parseInt(sessionClassMatch[2]),
    };
  }

  // Default case for unmatched patterns
  return {
    session: 999,
    class: 999,
  };
};

export const sortLessons = <T extends { title: string }>(lessons: T[]): T[] => {
  return [...lessons].sort((a, b) => {
    const numbersA = extractNumbersFromTitle(a.title);
    const numbersB = extractNumbersFromTitle(b.title);

    // Compare sessions first
    if (numbersA.session !== numbersB.session) {
      return numbersA.session - numbersB.session;
    }

    // If same session, compare class numbers
    return numbersA.class - numbersB.class;
  });
};
