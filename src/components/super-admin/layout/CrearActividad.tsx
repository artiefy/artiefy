'use client';
import React, { useState, useEffect } from 'react';
import {
	Timer,
	Trophy,
	Play,
	Pause,
	Plus,
	Trash2,
	HelpCircle,
	CheckCircle2,
} from 'lucide-react';
import type { WordSearchConfig, Word } from '~/app/typesActi';
import WordSearch from '~/components/actividades/SopaDeLetras';
import { generateWordSearch } from '~/utils/generadorSopaDeletras';

function App() {
	const [words, setWords] = useState<Word[]>([]);
	const [newWord, setNewWord] = useState('');
	const [points, setPoints] = useState(10);
	const [isTimerEnabled, setIsTimerEnabled] = useState(false);
	const [timeLimit, setTimeLimit] = useState(300);
	const [remainingTime, setRemainingTime] = useState(timeLimit);
	const [isPlaying, setIsPlaying] = useState(false);
	const [score, setScore] = useState(0);
	const [grid, setGrid] = useState<string[][]>([]);
	const [showInstructions, setShowInstructions] = useState(true);

	useEffect(() => {
		let timer: number;
		if (isPlaying && isTimerEnabled && remainingTime > 0) {
			timer = window.setInterval(() => {
				setRemainingTime((prev) => {
					if (prev <= 1) {
						setIsPlaying(false);
						return 0;
					}
					return prev - 1;
				});
			}, 1000);
		}
		return () => clearInterval(timer);
	}, [isPlaying, isTimerEnabled, remainingTime]);

	const handleAddWord = () => {
		if (
			newWord.trim() &&
			!words.find((w) => w.text.toLowerCase() === newWord.toLowerCase())
		) {
			setWords([...words, { text: newWord.toUpperCase(), found: false }]);
			setNewWord('');
		}
	};

	const handleRemoveWord = (index: number) => {
		setWords(words.filter((_, i) => i !== index));
	};

	const handleStartGame = () => {
		if (words.length > 0) {
			const config: WordSearchConfig = {
				words: words.map((w) => w.text),
				gridSize: Math.max(
					10,
					Math.ceil(Math.sqrt(words.map((w) => w.text).join('').length * 2))
				),
			};
			setGrid(generateWordSearch(config));
			setIsPlaying(true);
			setRemainingTime(timeLimit);
			setScore(0);
			setShowInstructions(true);
		}
	};

	const handleWordFound = (word: string) => {
		setWords(words.map((w) => (w.text === word ? { ...w, found: true } : w)));
		setScore((prev) => prev + points);
	};

	const handleFinishGame = () => {
		setIsPlaying(false);
		const foundWords = words.filter((w) => w.found).length;
		const totalWords = words.length;
		alert(
			`¡Juego terminado!\n\nPalabras encontradas: ${foundWords} de ${totalWords}\nPuntaje final: ${score}`
		);
	};

	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	};

	const allWordsFound = words.every((w) => w.found);

	return (
		<div className="from-primary min-h-screen rounded-lg bg-linear-to-br to-indigo-500 p-8">
			<div className="mx-auto mt-16 max-w-4xl">
				<div className="mb-8 rounded-2xl bg-white p-8 shadow-xl">
					<h1 className="mb-6 text-center text-3xl font-bold text-indigo-800">
						Sopa de Letras
					</h1>

					{!isPlaying ? (
						<div className="space-y-6">
							<div className="flex flex-col gap-4">
								<div className="flex gap-2">
									<input
										type="text"
										value={newWord}
										onChange={(e) => setNewWord(e.target.value)}
										placeholder="Agregar palabra..."
										className="flex-1 rounded-lg border border-gray-300 px-4 py-2 font-semibold text-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
										onKeyPress={(e) => e.key === 'Enter' && handleAddWord()}
									/>
									<button
										onClick={handleAddWord}
										className="rounded-lg bg-indigo-600 px-4 py-2 text-white transition-colors hover:bg-indigo-700"
									>
										<Plus className="size-5" />
									</button>
								</div>

								<div className="flex flex-wrap gap-2">
									{words.map((word, index) => (
										<div
											key={index}
											className="flex items-center gap-2 rounded-full bg-indigo-50 p-2"
										>
											<span className="font-normal text-indigo-500">
												{word.text}
											</span>
											<button
												onClick={() => handleRemoveWord(index)}
												className="text-red-500 hover:text-red-700"
											>
												<Trash2 className="size-4" />
											</button>
										</div>
									))}
								</div>
							</div>

							<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
								<div className="space-y-4">
									<h3 className="flex items-center gap-2 text-lg font-semibold text-indigo-800">
										<Trophy className="size-5" /> Puntos por palabra
									</h3>
									<input
										type="number"
										value={points}
										onChange={(e) => setPoints(Number(e.target.value))}
										className="w-full rounded-lg border border-gray-300 px-4 py-2 text-indigo-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
										min="1"
									/>
								</div>

								<div className="space-y-4">
									<h3 className="flex items-center gap-2 text-lg font-semibold text-indigo-800">
										<Timer className="size-5" /> Temporizador
									</h3>
									<div className="flex items-center gap-4">
										<label className="flex items-center gap-2 text-indigo-800">
											<input
												type="checkbox"
												checked={isTimerEnabled}
												onChange={(e) => setIsTimerEnabled(e.target.checked)}
												className="size-4 text-indigo-600"
											/>
											Activar
										</label>
										{isTimerEnabled && (
											<input
												type="number"
												value={timeLimit}
												onChange={(e) => setTimeLimit(Number(e.target.value))}
												className="w-32 rounded-lg border border-gray-300 px-4 py-2 text-indigo-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
												min="30"
												step="30"
											/>
										)}
									</div>
								</div>
							</div>

							<button
								onClick={handleStartGame}
								disabled={words.length === 0}
								className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 py-3 text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-400"
							>
								<Play className="size-5" /> Comenzar Juego
							</button>
						</div>
					) : (
						<div className="space-y-6">
							<div className="flex items-center justify-between text-indigo-800">
								<div className="flex items-center gap-4">
									<span className="flex items-center gap-2">
										<Trophy className="size-5 text-yellow-400" />
										<span className="text-xl font-bold">{score}</span>
									</span>
									{isTimerEnabled && (
										<span className="flex items-center gap-2">
											<Timer className="size-5 text-indigo-500" />
											<span className="text-xl font-bold">
												{formatTime(remainingTime)}
											</span>
										</span>
									)}
								</div>
								<div className="flex gap-2">
									<button
										onClick={handleFinishGame}
										className="flex items-center gap-2 rounded-lg bg-green-500 px-4 py-2 text-white transition-colors hover:bg-green-600"
									>
										<CheckCircle2 className="size-5" /> Finalizar
									</button>
									<button
										onClick={() => setIsPlaying(false)}
										className="rounded-lg bg-red-500 px-4 py-2 text-white transition-colors hover:bg-red-600"
									>
										<Pause className="size-5" />
									</button>
								</div>
							</div>

							{showInstructions && (
								<div className="mb-6 rounded-lg border-l-4 border-blue-500 bg-blue-50 p-4">
									<div className="flex items-start gap-2">
										<HelpCircle
											onClick={() => setShowInstructions(false)}
											className="mt-0.5 size-5 shrink-0 cursor-pointer text-blue-500"
										/>
										<div>
											<h4 className="font-semibold text-blue-800">
												Instrucciones:
											</h4>
											<ul className="list-inside list-disc space-y-1 text-sm text-blue-700">
												<li>Encuentra las palabras en la cuadrícula</li>
												<li>Haz clic y arrastra para seleccionar letras</li>
												<li>
													Las palabras pueden estar en cualquier dirección
												</li>
												<li>Las palabras encontradas se marcarán en verde</li>
												<li>Presiona "Finalizar" cuando hayas terminado</li>
											</ul>
											<button
												onClick={() => setShowInstructions(false)}
												className="mt-2 text-sm text-blue-600 hover:underline"
											>
												Entendido, no mostrar de nuevo
											</button>
										</div>
									</div>
								</div>
							)}

							<div className="grid grid-cols-1 gap-8 text-indigo-800 md:grid-cols-3">
								<div className="md:col-span-2">
									<WordSearch
										grid={grid}
										words={words}
										onWordFound={handleWordFound}
									/>
								</div>
								<div className="space-y-4">
									<h3 className="text-lg font-semibold">
										Palabras a encontrar:
									</h3>
									<div className="space-y-2">
										{words.map((word, index) => (
											<div
												key={index}
												className={`rounded-lg px-4 py-2 transition-colors ${
													word.found
														? 'bg-green-100 text-green-800'
														: 'bg-gray-100 text-gray-800'
												}`}
											>
												{word.text}
												{word.found && (
													<CheckCircle2 className="ml-2 inline-block size-4 text-green-600" />
												)}
											</div>
										))}
									</div>
									{allWordsFound && (
										<div className="mt-4 rounded-lg bg-green-100 p-4 text-green-800">
											¡Felicitaciones! Has encontrado todas las palabras.
										</div>
									)}
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

export default App;
