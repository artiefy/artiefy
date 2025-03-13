import React, { useState } from 'react';

import type { Word } from '~/app/typesActi';

interface Props {
	grid: string[][];
	words: Word[];
	onWordFound: (word: string) => void;
}

interface Selection {
	start: { row: number; col: number };
	end: { row: number; col: number };
}

const WordSearch: React.FC<Props> = ({ grid, words, onWordFound }) => {
	const [selection, setSelection] = useState<Selection | null>(null);
	const [mouseDown, setMouseDown] = useState(false);
	const [highlightedCells, setHighlightedCells] = useState<Set<string>>(
		new Set()
	);
	const [currentSelection, setCurrentSelection] = useState<Set<string>>(
		new Set()
	);

	const getSelectedWord = (
		start: { row: number; col: number },
		end: { row: number; col: number }
	) => {
		let word = '';
		const rowDiff = end.row - start.row;
		const colDiff = end.col - start.col;
		const steps = Math.max(Math.abs(rowDiff), Math.abs(colDiff));

		if (steps === 0) return '';

		const rowStep = rowDiff / steps;
		const colStep = colDiff / steps;

		for (let i = 0; i <= steps; i++) {
			const row = start.row + Math.round(i * rowStep);
			const col = start.col + Math.round(i * colStep);
			if (row >= 0 && row < grid.length && col >= 0 && col < grid[0].length) {
				word += grid[row][col];
			}
		}

		return word;
	};

	const updateCurrentSelection = (
		start: { row: number; col: number },
		end: { row: number; col: number }
	) => {
		const newSelection = new Set<string>();
		const rowDiff = end.row - start.row;
		const colDiff = end.col - start.col;
		const steps = Math.max(Math.abs(rowDiff), Math.abs(colDiff));

		if (steps === 0) return;

		const rowStep = rowDiff / steps;
		const colStep = colDiff / steps;

		for (let i = 0; i <= steps; i++) {
			const row = start.row + Math.round(i * rowStep);
			const col = start.col + Math.round(i * colStep);
			if (row >= 0 && row < grid.length && col >= 0 && col < grid[0].length) {
				newSelection.add(`${row}-${col}`);
			}
		}

		setCurrentSelection(newSelection);
	};

	const handleMouseDown = (row: number, col: number) => {
		setMouseDown(true);
		setSelection({ start: { row, col }, end: { row, col } });
		setCurrentSelection(new Set([`${row}-${col}`]));
	};

	const handleMouseMove = (row: number, col: number) => {
		if (mouseDown && selection) {
			setSelection({ ...selection, end: { row, col } });
			updateCurrentSelection(selection.start, { row, col });
		}
	};

	const handleMouseUp = () => {
		setMouseDown(false);
		setCurrentSelection(new Set());

		if (selection) {
			const selectedWord = getSelectedWord(selection.start, selection.end);
			const reversedWord = selectedWord.split('').reverse().join('');

			const foundWord = words.find(
				(w) => !w.found && (w.text === selectedWord || w.text === reversedWord)
			);

			if (foundWord) {
				onWordFound(foundWord.text);
				const newHighlightedCells = new Set(highlightedCells);
				const steps = Math.max(
					Math.abs(selection.end.row - selection.start.row),
					Math.abs(selection.end.col - selection.start.col)
				);
				const rowStep = (selection.end.row - selection.start.row) / steps;
				const colStep = (selection.end.col - selection.start.col) / steps;

				for (let i = 0; i <= steps; i++) {
					const row = selection.start.row + Math.round(i * rowStep);
					const col = selection.start.col + Math.round(i * colStep);
					newHighlightedCells.add(`${row}-${col}`);
				}
				setHighlightedCells(newHighlightedCells);
			}
		}
		setSelection(null);
	};

	return (
		<div className="select-none">
			<div className="inline-block rounded-lg bg-white p-4 shadow-lg">
				<div
					className="grid gap-1"
					style={{ gridTemplateColumns: `repeat(${grid[0].length}, 1fr)` }}
				>
					{grid.map((row, rowIndex) =>
						row.map((letter, colIndex) => {
							const cellKey = `${rowIndex}-${colIndex}`;
							const isHighlighted = highlightedCells.has(cellKey);
							const isSelected = currentSelection.has(cellKey);

							return (
								<div
									key={cellKey}
									className={`flex size-8 cursor-pointer items-center justify-center rounded text-lg font-bold transition-all duration-200 ${isHighlighted ? 'scale-105 bg-green-200 text-green-800' : ''} ${isSelected && !isHighlighted ? 'scale-105 bg-indigo-100 text-indigo-800' : ''} ${!isHighlighted && !isSelected ? 'hover:bg-gray-100' : ''}`}
									onMouseDown={() => handleMouseDown(rowIndex, colIndex)}
									onMouseMove={() => handleMouseMove(rowIndex, colIndex)}
									onMouseUp={handleMouseUp}
									onMouseLeave={() => {
										if (mouseDown) {
											handleMouseMove(rowIndex, colIndex);
										}
									}}
								>
									{letter}
								</div>
							);
						})
					)}
				</div>
			</div>
		</div>
	);
};

export default WordSearch;
