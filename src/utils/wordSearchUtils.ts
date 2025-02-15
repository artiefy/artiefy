export function generateGrid(
	size: number,
	words: string[]
): {
	grid: string[][];
	wordPositions: { word: string; positions: number[][] }[];
} {
	// Initialize empty grid
	const grid: string[][] = Array.from({ length: size }, () => Array<string>(size).fill(''));
	const wordPositions: { word: string; positions: number[][] }[] = [];

	// Possible directions for word placement
	const directions = [
		[0, 1], // right
		[1, 0], // down
		[1, 1], // diagonal down-right
		[-1, 1], // diagonal up-right
	];

	// Sort words by length (longest first)
	const sortedWords = [...words].sort((a, b) => b.length - a.length);

	for (const word of sortedWords) {
		let placed = false;
		let attempts = 0;
		const maxAttempts = 100;

		while (!placed && attempts < maxAttempts) {
			const direction =
				directions[Math.floor(Math.random() * directions.length)];
			const startRow = Math.floor(Math.random() * size);
			const startCol = Math.floor(Math.random() * size);

			if (canPlaceWord(grid, word, startRow, startCol, direction, size)) {
				const positions = placeWord(grid, word, startRow, startCol, direction);
				wordPositions.push({ word, positions });
				placed = true;
			}
			attempts++;
		}

		if (!placed) {
			console.warn(`Could not place word: ${word}`);
		}
	}

	// Fill remaining empty cells with random letters
	for (let i = 0; i < size; i++) {
		for (let j = 0; j < size; j++) {
			if (grid[i][j] === '') {
				grid[i][j] = String.fromCharCode(65 + Math.floor(Math.random() * 26));
			}
		}
	}

	return { grid, wordPositions };
}

function canPlaceWord(
	grid: string[][],
	word: string,
	startRow: number,
	startCol: number,
	direction: number[],
	size: number
): boolean {
	const [dy, dx] = direction;
	const wordLength = word.length;

	// Check if word fits within grid bounds
	if (
		startRow + dy * (wordLength - 1) < 0 ||
		startRow + dy * (wordLength - 1) >= size ||
		startCol + dx * (wordLength - 1) < 0 ||
		startCol + dx * (wordLength - 1) >= size
	) {
		return false;
	}

	// Check if path is clear or letters match
	for (let i = 0; i < wordLength; i++) {
		const row = startRow + dy * i;
		const col = startCol + dx * i;
		const currentCell = grid[row][col];

		if (currentCell !== '' && currentCell !== word[i].toUpperCase()) {
			return false;
		}
	}

	return true;
}

function placeWord(
	grid: string[][],
	word: string,
	startRow: number,
	startCol: number,
	direction: number[]
): number[][] {
	const [dy, dx] = direction;
	const positions: number[][] = [];

	for (let i = 0; i < word.length; i++) {
		const row = startRow + dy * i;
		const col = startCol + dx * i;
		grid[row][col] = word[i].toUpperCase();
		positions.push([row, col]);
	}

	return positions;
}
