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
	// First try to find "Sesion X - Clase Y" pattern
	const sessionClassMatch = /Sesion\s*(\d+)\s*-\s*Clase\s*(\d+)/i.exec(title);
	if (sessionClassMatch) {
		return {
			session: parseInt(sessionClassMatch[1]),
			class: parseInt(sessionClassMatch[2]),
		};
	}

	// Then try to find "Clase X" pattern
	const classMatch = /Clase\s*-?\s*(\d+)/i.exec(title);
	if (classMatch) {
		return {
			session: 0, // Bienvenida goes first
			class: parseInt(classMatch[1]),
		};
	}

	// If no patterns match, return max values to sort to end
	return {
		session: 999,
		class: 999,
	};
};

export const sortLessons = <T extends { title: string }>(lessons: T[]): T[] => {
	return [...lessons].sort((a, b) => {
		const orderA = extractLessonOrder(a.title);
		const orderB = extractLessonOrder(b.title);
		return orderA === orderB ? a.title.localeCompare(b.title) : orderA - orderB;
	});
};
