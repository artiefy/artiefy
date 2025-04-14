export const extractNumberFromTitle = (title: string): number => {
	if (title.toLowerCase().includes('bienvenida')) return -1;
	const match = /\d+/.exec(title);
	return match ? parseInt(match[0], 10) : Number.MAX_SAFE_INTEGER;
};

export const sortLessons = <T extends { title: string }>(lessons: T[]): T[] => {
	return [...lessons].sort((a, b) => {
		const aNum = extractNumberFromTitle(a.title);
		const bNum = extractNumberFromTitle(b.title);
		return aNum === bNum ? a.title.localeCompare(b.title) : aNum - bNum;
	});
};
