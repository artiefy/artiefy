import React, { useState, useEffect } from 'react';
import {
	Timer,
	Check, //RefreshCw,
	Trophy,
} from 'lucide-react';
import type { WordCruci } from '~/types/typesActi';

interface CrosswordProps {
	words: WordCruci[];
	timeLimit: number;
}

const Crossword: React.FC<CrosswordProps> = ({ words, timeLimit }) => {
	const [grid, setGrid] = useState<string[][]>([]);
	const [userInput, setUserInput] = useState<string[][]>([]);
	const [selectedCell, setSelectedCell] = useState<{
		x: number;
		y: number;
	} | null>(null);
	const [timeLeft, setTimeLeft] = useState(timeLimit);
	const [gameOver, setGameOver] = useState(false);
	const [score, setScore] = useState(0);

	// Initialize grid
	useEffect(() => {
		const size = 15;
		const newGrid = Array(size)
			.fill('')
			.map(() => Array<string>(size).fill(''));
		const newUserInput = Array(size)
			.fill('')
			.map(() => Array<string>(size).fill(''));

		words.forEach(({ word, startX, startY, direction }) => {
			const letters = word.toUpperCase().split('');
			letters.forEach((letter, index) => {
				if (direction === 'across') {
					newGrid[startY][startX + index] = letter;
				} else {
					newGrid[startY + index][startX] = letter;
				}
			});
		});

		setGrid(newGrid);
		setUserInput(newUserInput);
	}, [words]);

	// Timer
	useEffect(() => {
		if (timeLeft > 0 && !gameOver) {
			const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
			return () => clearInterval(timer);
		} else if (timeLeft === 0) {
			setGameOver(true);
			checkAnswers();
		}
	}, [timeLeft, gameOver]);

	const handleCellClick = (x: number, y: number) => {
		if (!gameOver && grid[y][x] !== '') {
			setSelectedCell({ x, y });
		}
	};

	const handleInput = (
		e: React.ChangeEvent<HTMLInputElement>,
		x: number,
		y: number
	) => {
		if (gameOver) return;

		const value = e.target.value.toUpperCase();
		const newUserInput = [...userInput];
		newUserInput[y][x] = value;
		setUserInput(newUserInput);
	};

	const checkAnswers = () => {
		let correct = 0;
		let total = 0;

		grid.forEach((row, y) => {
			row.forEach((cell, x) => {
				if (cell !== '') {
					total++;
					if (userInput[y][x].toUpperCase() === cell) {
						correct++;
					}
				}
			});
		});

		setScore(Math.round((correct / total) * 100));
		setGameOver(true);
	};

	useEffect(() => {
		if (gameOver) {
			alert(`Felicidades!!.Juego completado con exito puntacion de ${score}%`);
		}
	}, [gameOver]);

	// Funcion de reiniciar el juego
	// const resetGame = () => {
	// 	setUserInput(
	// 		Array(grid.length)
	// 			.fill('')
	// 			.map(() => Array<string>(grid[0].length).fill(''))
	// 	);
	// 	setTimeLeft(timeLimit);
	// 	setGameOver(false);
	// 	setScore(0);
	// };

	return (
		<div className="mx-auto max-w-4xl p-4">
			<div className="mb-6 flex items-center justify-between">
				<div className="flex items-center gap-2 text-xl font-semibold">
					<Timer className="size-6" />
					<span>
						{Math.floor(timeLeft / 60)}:
						{(timeLeft % 60).toString().padStart(2, '0')}
					</span>
				</div>
				<div className="flex gap-4">
					<button
						onClick={checkAnswers}
						className="flex items-center gap-2 rounded-lg bg-green-500 px-4 py-2 text-white hover:bg-green-600"
					>
						<Check className="size-5" /> Verificar
					</button>
					{/* Boton de reiniciar:
					<button
						onClick={resetGame}
						className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
					// >
						<RefreshCw className="size-5" /> Reiniciar
					</button> */}
				</div>
			</div>

			<div
				className="grid gap-1"
				style={{ gridTemplateColumns: `repeat(${grid[0]?.length || 0}, 30px)` }}
			>
				{grid.map((row, y) =>
					row.map((cell, x) => (
						<div
							key={`${x}-${y}`}
							className={`size-7 border ${cell ? 'bg-white' : 'bg-gray-800'} ${
								selectedCell?.x === x && selectedCell?.y === y
									? 'border-blue-500'
									: 'border-gray-300'
							}`}
						>
							{cell && (
								<input
									type="text"
									maxLength={1}
									value={userInput[y][x]}
									onChange={(e) => handleInput(e, x, y)}
									onClick={() => handleCellClick(x, y)}
									className="size-full text-center font-bold uppercase"
									disabled={gameOver}
								/>
							)}
						</div>
					))
				)}
			</div>

			{gameOver && (
				<div className="mt-6 rounded-lg bg-white p-4 shadow-lg">
					<div className="flex items-center justify-center gap-2 text-center text-2xl font-bold">
						<Trophy className="size-8 text-yellow-500" />
						<span>Puntuación: {score}%</span>
					</div>
				</div>
			)}

			{gameOver && (
				<div className="mt-6 rounded-lg bg-white p-4 shadow-lg">
					<div className="flex items-center justify-center gap-2 text-center text-2xl font-bold">
						<Trophy className="size-8 text-yellow-500" />
						<span>Puntuación: {score}%</span>
					</div>
				</div>
			)}

			<div className="mt-6">
				<h3 className="mb-4 text-xl font-bold">Pistas:</h3>
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					{words.map((word, index) => (
						<div key={index} className="rounded-lg bg-white p-3 shadow">
							<span className="font-semibold">
								{index + 1}.{' '}
								{word.direction === 'across' ? 'Horizontal' : 'Vertical'}:{' '}
							</span>
							{word.clue}
						</div>
					))}
				</div>
			</div>
		</div>
	);
};

export default Crossword;
