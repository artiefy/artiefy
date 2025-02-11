import type { WordSearchConfig } from '~/app/typesActi';

const DIRECTIONS = [
	[-1, -1],
	[-1, 0],
	[-1, 1],
	[0, -1],
	[0, 1],
	[1, -1],
	[1, 0],
	[1, 1],
];

export function generateWordSearch(config: WordSearchConfig): string[][] {
	const { words, gridSize } = config;

	// Initialize grid with empty spaces
	const grid: string[][] = Array.from({ length: gridSize }, () =>
		Array<string>(gridSize).fill('')
	);

	// Place words
	for (const word of words) {
		let placed = false;
		let attempts = 0;
		const maxAttempts = 100;

		while (!placed && attempts < maxAttempts) {
			const direction =
				DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
			const startRow = Math.floor(Math.random() * gridSize);
			const startCol = Math.floor(Math.random() * gridSize);

			if (canPlaceWord(grid, word, startRow, startCol, direction)) {
				placeWord(grid, word, startRow, startCol, direction);
				placed = true;
			}

			attempts++;
		}

		if (!placed) {
			console.warn(`Could not place word: ${word}`);
		}
	}

	// Fill empty spaces with random letters
	const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
	for (let i = 0; i < gridSize; i++) {
		for (let j = 0; j < gridSize; j++) {
			if (grid[i][j] === '') {
				grid[i][j] = letters.charAt(Math.floor(Math.random() * letters.length));
			}
		}
	}

	return grid;
}

function canPlaceWord(
	grid: string[][],
	word: string,
	startRow: number,
	startCol: number,
	[dRow, dCol]: number[]
): boolean {
	const gridSize = grid.length;

	// Check if word fits within grid bounds
	if (
		startRow + dRow * (word.length - 1) < 0 ||
		startRow + dRow * (word.length - 1) >= gridSize ||
		startCol + dCol * (word.length - 1) < 0 ||
		startCol + dCol * (word.length - 1) >= gridSize
	) {
		return false;
	}

	// Check if path is clear or matches word letters
	for (let i = 0; i < word.length; i++) {
		const row = startRow + dRow * i;
		const col = startCol + dCol * i;
		if (grid[row][col] !== '' && grid[row][col] !== word[i]) {
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
	[dRow, dCol]: number[]
): void {
	for (let i = 0; i < word.length; i++) {
		const row = startRow + dRow * i;
		const col = startCol + dCol * i;
		grid[row][col] = word[i];
	}
}
