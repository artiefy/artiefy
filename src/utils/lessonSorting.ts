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

export const sortLessons = <T extends { title: string }>(lessons: T[]): T[] => {
	return [...lessons].sort((a, b) => {
		const orderA = extractLessonOrder(a.title);
		const orderB = extractLessonOrder(b.title);
		return orderA === orderB ? a.title.localeCompare(b.title) : orderA - orderB;
	});
};
