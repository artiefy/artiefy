import React, { useState } from 'react';
import {
	Plus,
	Minus,
	Clock,
	ArrowRight,
	Move,
	ArrowLeft,
	ArrowRight as ArrowRightIcon,
	ArrowUp,
	ArrowDown,
} from 'lucide-react';
import type { WordCruci } from '~/types/typesActi';

interface ConfigFormProps {
	onSubmit: (config: { words: WordCruci[]; timeLimit: number }) => void;
}

const GRID_SIZE = 15;

const ConfigForm: React.FC<ConfigFormProps> = ({ onSubmit }) => {
	const [words, setWords] = useState<WordCruci[]>([
		{
			word: '',
			clue: '',
			startX: 0,
			startY: 0,
			direction: 'across',
			text: '',
			found: false,
		},
	]);
	const [timeLimit, setTimeLimit] = useState(300);
	const [selectedWordIndex, setSelectedWordIndex] = useState<number>(0);

	const addWord = () => {
		setWords([
			...words,
			{
				word: '',
				clue: '',
				startX: 0,
				startY: 0,
				direction: 'across',
				text: '',
				found: false,
			},
		]);
		setSelectedWordIndex(words.length);
	};

	const removeWord = (index: number) => {
		setWords(words.filter((_, i) => i !== index));
		setSelectedWordIndex(Math.max(0, selectedWordIndex - 1));
	};

	const updateWord = (
		index: number,
		field: keyof WordCruci,
		value: string | number
	) => {
		const newWords = [...words];
		newWords[index] = {
			...newWords[index],
			[field]: value,
		};
		setWords(newWords);
	};

	const handleGridClick = (x: number, y: number) => {
		const word = words[selectedWordIndex];
		if (!word) return;

		// Verificar límites según la dirección y longitud de la palabra
		if (word.direction === 'across' && x + word.word.length > GRID_SIZE) {
			x = GRID_SIZE - word.word.length;
		} else if (word.direction === 'down' && y + word.word.length > GRID_SIZE) {
			y = GRID_SIZE - word.word.length;
		}

		updateWord(selectedWordIndex, 'startX', x);
		updateWord(selectedWordIndex, 'startY', y);
	};

	const moveWord = (direction: 'left' | 'right' | 'up' | 'down') => {
		const word = words[selectedWordIndex];
		if (!word) return;

		const wordLength = word.word.length;
		let newX = word.startX;
		let newY = word.startY;

		switch (direction) {
			case 'left':
				if (word.startX > 0) {
					newX = word.startX - 1;
				}
				break;
			case 'right':
				const maxX =
					word.direction === 'across' ? GRID_SIZE - wordLength : GRID_SIZE - 1;
				if (word.startX < maxX) {
					newX = word.startX + 1;
				}
				break;
			case 'up':
				if (word.startY > 0) {
					newY = word.startY - 1;
				}
				break;
			case 'down':
				const maxY =
					word.direction === 'down' ? GRID_SIZE - wordLength : GRID_SIZE - 1;
				if (word.startY < maxY) {
					newY = word.startY + 1;
				}
				break;
		}

		if (newX !== word.startX) {
			updateWord(selectedWordIndex, 'startX', newX);
		}
		if (newY !== word.startY) {
			updateWord(selectedWordIndex, 'startY', newY);
		}
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (words.every((w) => w.word && w.clue)) {
			onSubmit({ words, timeLimit });
		}
	};

	// Renderiza una vista previa de las palabras en la cuadrícula
	const getPreviewGrid = () => {
		const grid = Array(GRID_SIZE)
			.fill('')
			.map(() => Array<string>(GRID_SIZE).fill(''));

		words.forEach((word, index) => {
			const letters = word.word.split('');
			const isSelected = index === selectedWordIndex;

			letters.forEach((letter, i) => {
				const x = word.direction === 'across' ? word.startX + i : word.startX;
				const y = word.direction === 'down' ? word.startY + i : word.startY;

				if (x < GRID_SIZE && y < GRID_SIZE) {
					grid[y][x] = isSelected ? `*${letter}` : letter;
				}
			});
		});

		return grid;
	};

	const selectedWord = words[selectedWordIndex];

	return (
		<form
			onSubmit={handleSubmit}
			className="mx-auto max-w-6xl rounded-lg bg-white p-6 shadow-lg"
		>
			<div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
				<div className="space-y-6">
					<div className="mb-6">
						<label className="mb-2 flex items-center gap-2 text-lg font-semibold">
							<Clock className="size-5" />
							Tiempo Límite (minutos)
						</label>
						<input
							type="number"
							value={timeLimit / 60}
							onChange={(e) =>
								setTimeLimit(Math.max(1, parseInt(e.target.value)) * 60)
							}
							min="1"
							className="w-full rounded border border-indigo-500 p-2 outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>

					<div className="space-y-6">
						<div className="flex items-center justify-between">
							<h2 className="text-xl font-bold">Palabras del Crucigrama</h2>
							<button
								type="button"
								onClick={addWord}
								className="flex items-center gap-2 rounded-lg bg-green-500 px-4 py-2 text-white hover:bg-green-600"
							>
								<Plus className="size-4" /> Agregar Palabra
							</button>
						</div>

						<div className="max-h-[600px] space-y-4 overflow-y-auto pr-2">
							{words.map((word, index) => (
								<div
									key={index}
									className={`rounded-lg border p-4 transition-all ${
										index === selectedWordIndex
											? 'border-blue-300 bg-blue-50 shadow-md'
											: 'bg-gray-50'
									}`}
									onClick={() => setSelectedWordIndex(index)}
								>
									<div className="mb-4 flex justify-between">
										<h3 className="font-semibold">Palabra #{index + 1}</h3>
										{words.length > 1 && (
											<button
												type="button"
												onClick={(e) => {
													e.stopPropagation();
													removeWord(index);
												}}
												className="text-red-500 hover:text-red-700"
											>
												<Minus className="size-4" />
											</button>
										)}
									</div>

									<div className="space-y-4">
										<div>
											<label className="mb-1 block text-sm font-medium">
												Palabra
											</label>
											<input
												required
												type="text"
												value={word.word}
												onChange={(e) =>
													updateWord(
														index,
														'word',
														e.target.value.toUpperCase()
													)
												}
												className="w-full rounded border border-indigo-500 p-2 outline-none"
												placeholder="EJEMPLO"
											/>
										</div>

										<div>
											<label className="mb-1 block text-sm font-medium">
												Pista
											</label>
											<input
												required
												type="text"
												value={word.clue}
												onChange={(e) =>
													updateWord(index, 'clue', e.target.value)
												}
												className="w-full rounded border border-indigo-500 p-2 outline-none"
												placeholder="Descripción de la palabra..."
											/>
										</div>

										<div>
											<label className="mb-1 block text-sm font-medium">
												Dirección
											</label>
											<select
												value={word.direction}
												onChange={(e) =>
													updateWord(
														index,
														'direction',
														e.target.value as 'across' | 'down'
													)
												}
												className="w-full rounded border border-indigo-500 p-2 outline-none"
											>
												<option value="across">Horizontal</option>
												<option value="down">Vertical</option>
											</select>
										</div>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>

				<div className="space-y-4">
					<div className="rounded-lg bg-gray-50 p-4">
						<h3 className="mb-2 flex items-center gap-2 text-lg font-semibold">
							<Move className="size-5" />
							Vista Previa y Posicionamiento
						</h3>
						<p className="mb-4 text-sm text-gray-600">
							Haz clic en la cuadrícula para posicionar la palabra seleccionada
							o usa las flechas para ajustar su posición
						</p>

						{selectedWord?.word && (
							<div className="mb-4 flex flex-col items-center gap-2">
								<p className="font-medium text-blue-600">
									Mover "{selectedWord.word}":
								</p>
								<div className="grid w-32 grid-cols-3 gap-2">
									<div></div>
									<button
										type="button"
										onClick={() => moveWord('up')}
										className="flex items-center justify-center rounded bg-blue-100 p-2 hover:bg-blue-200"
									>
										<ArrowUp className="size-4" />
									</button>
									<div></div>

									<button
										type="button"
										onClick={() => moveWord('left')}
										className="flex items-center justify-center rounded bg-blue-100 p-2 hover:bg-blue-200"
									>
										<ArrowLeft className="size-4" />
									</button>
									<div></div>
									<button
										type="button"
										onClick={() => moveWord('right')}
										className="flex items-center justify-center rounded bg-blue-100 p-2 hover:bg-blue-200"
									>
										<ArrowRightIcon className="size-4" />
									</button>

									<div></div>
									<button
										type="button"
										onClick={() => moveWord('down')}
										className="flex items-center justify-center rounded bg-blue-100 p-2 hover:bg-blue-200"
									>
										<ArrowDown className="size-4" />
									</button>
									<div></div>
								</div>
							</div>
						)}

						<div
							className="mx-auto grid gap-1"
							style={{
								gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
								maxWidth: 'min(100%, 600px)',
							}}
						>
							{getPreviewGrid().map((row, y) =>
								row.map((cell, x) => {
									const isHighlighted = cell.startsWith('*');
									const letter = isHighlighted ? cell.slice(1) : cell;

									return (
										<button
											key={`${x}-${y}`}
											type="button"
											onClick={() => handleGridClick(x, y)}
											className={`flex aspect-square w-full items-center justify-center border text-xs font-bold sm:text-sm md:text-base ${letter ? 'bg-white' : 'bg-gray-100'} ${isHighlighted ? 'border-blue-500 text-blue-600' : 'border-gray-300'} transition-colors hover:bg-blue-50`}
										>
											{letter}
										</button>
									);
								})
							)}
						</div>
					</div>

					<div className="rounded-lg bg-blue-50 p-4">
						<h4 className="mb-2 font-semibold">Instrucciones:</h4>
						<ol className="list-inside list-decimal space-y-2 text-sm">
							<li>Selecciona una palabra de la lista</li>
							<li>
								Haz clic en la cuadrícula para establecer su posición inicial
							</li>
							<li>Usa las flechas para ajustar la posición con precisión</li>
							<li>Elige la dirección (horizontal o vertical)</li>
							<li>Las palabras seleccionadas se mostrarán en azul</li>
						</ol>
					</div>
				</div>
			</div>

			<button
				type="submit"
				className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-500 px-6 py-3 font-semibold text-white hover:bg-blue-600"
			>
				Comenzar Juego <ArrowRight className="size-5" />
			</button>
		</form>
	);
};

export default ConfigForm;
