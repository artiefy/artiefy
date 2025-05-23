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
	// Handle "Bienvenida" or "Clase - 1" case first
	if (
		title.toLowerCase().includes('bienvenida') ||
		/clase\s*-\s*1/i.test(title)
	) {
		return {
			session: 0, // Will sort before all sessions
			class: 0,
		};
	}

	// Then try to find "Sesion X - Clase Y" pattern
	const sessionClassMatch = /sesion\s*(\d+)\s*-\s*clase\s*(\d+)/i.exec(title);
	if (sessionClassMatch) {
		return {
			session: parseInt(sessionClassMatch[1]),
			class: parseInt(sessionClassMatch[2]),
		};
	}

	// Any other lesson number pattern
	const classMatch = /clase\s*(\d+)/i.exec(title);
	if (classMatch) {
		return {
			session: 999, // Sort to end if no session number
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
