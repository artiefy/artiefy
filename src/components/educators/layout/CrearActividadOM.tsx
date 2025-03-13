import React, { useState, useEffect, useCallback } from 'react';

import {
	Timer,
	Trophy,
	Play,
	Plus,
	Trash2,
	CheckCircle2,
	HelpCircle,
	// Edit2,
	ArrowLeft,
} from 'lucide-react';

import QuestionForm from '~/components/actividades/PreguntasOM';
import Quiz from '~/components/educators/layout/QuizPOM';

import type { Question, QuizConfig } from '~/app/typesActi';

function PreguntasOM() {
	const [questions, setQuestions] = useState<Question[]>([]);
	const [isEditing, setIsEditing] = useState(false);
	const [isPlaying, setIsPlaying] = useState(false);
	const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
	const [score, setScore] = useState(0);
	const [config, setConfig] = useState<QuizConfig>({
		points: 10,
		timeLimit: 300,
		isTimerEnabled: false,
	});
	const [remainingTime, setRemainingTime] = useState(config.timeLimit);
	const [showInstructions, setShowInstructions] = useState(true);

	const handleFinishQuiz = useCallback(() => {
		setIsPlaying(false);
		alert(
			`¡Quiz terminado!\n\nPuntaje final: ${score} de ${questions.length * config.points}`
		);
	}, [score, questions.length, config.points]);

	useEffect(() => {
		let timer: number;
		if (isPlaying && config.isTimerEnabled && remainingTime > 0) {
			timer = window.setInterval(() => {
				setRemainingTime((prev) => {
					if (prev <= 1) {
						handleFinishQuiz();
						return 0;
					}
					return prev - 1;
				});
			}, 1000);
		}
		return () => clearInterval(timer);
	}, [isPlaying, config.isTimerEnabled, remainingTime, handleFinishQuiz]);

	const handleAddQuestion = (question: Question) => {
		setQuestions([...questions, question]);
		setIsEditing(false);
	};

	const handleRemoveQuestion = (id: string) => {
		setQuestions(questions.filter((q) => q.id !== id));
	};

	// const handleEditQuestion = (id: string) => {
	// 	// Implementar edición de pregunta
	// };

	const handleStartQuiz = () => {
		if (questions.length > 0) {
			setIsPlaying(true);
			setCurrentQuestionIndex(0);
			setScore(0);
			setRemainingTime(config.timeLimit);
			setShowInstructions(true);
		}
	};

	const handleAnswer = (optionId: string) => {
		const currentQuestion = questions[currentQuestionIndex];
		if (currentQuestion.correctOptionId === optionId) {
			setScore((prev) => prev + config.points);
		}

		if (currentQuestionIndex < questions.length - 1) {
			setCurrentQuestionIndex((prev) => prev + 1);
		} else {
			handleFinishQuiz();
		}
	};

	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	};

	return (
		<div className="min-h-screen rounded-lg bg-gradient-to-br from-primary to-indigo-500 p-8">
			<div className="mx-auto mt-16 max-w-4xl">
				<div className="mb-8 rounded-2xl bg-white p-8 shadow-xl">
					<h1 className="mb-6 text-center text-3xl font-bold text-indigo-800">
						Preguntas de Opción Múltiple
					</h1>

					{!isPlaying ? (
						<div className="space-y-6">
							{isEditing ? (
								<>
									<div className="mb-6 flex items-center gap-4">
										<button
											onClick={() => setIsEditing(false)}
											className="flex items-center gap-2 text-gray-600 transition-colors hover:text-gray-800"
										>
											<ArrowLeft className="size-5" /> Volver a la lista
										</button>
									</div>
									<QuestionForm onSubmit={handleAddQuestion} />
								</>
							) : (
								<>
									<div className="flex items-center justify-between">
										<h2 className="text-xl font-semibold text-gray-800">
											Configuración del Quiz
										</h2>
										<button
											onClick={() => setIsEditing(true)}
											className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-white transition-colors hover:bg-indigo-700"
										>
											<Plus className="size-5" /> Agregar Pregunta
										</button>
									</div>

									<div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
										<div className="space-y-4">
											<h3 className="flex items-center gap-2 text-lg font-semibold text-indigo-800">
												<Trophy className="size-5" /> Puntos por pregunta
											</h3>
											<input
												type="number"
												value={config.points}
												onChange={(e) =>
													setConfig({
														...config,
														points: Number(e.target.value),
													})
												}
												className="w-full rounded-lg border border-gray-300 px-4 py-2 font-semibold text-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
												min="1"
											/>
										</div>

										<div className="space-y-4">
											<h3 className="flex items-center gap-2 text-lg font-semibold text-indigo-800">
												<Timer className="size-5" /> Temporizador
											</h3>
											<div className="flex items-center gap-4 text-indigo-800">
												<label className="flex items-center gap-2">
													<input
														type="checkbox"
														checked={config.isTimerEnabled}
														onChange={(e) =>
															setConfig({
																...config,
																isTimerEnabled: e.target.checked,
															})
														}
														className="size-4 text-indigo-600"
													/>
													Activar
												</label>
												{config.isTimerEnabled && (
													<input
														type="number"
														value={config.timeLimit}
														onChange={(e) =>
															setConfig({
																...config,
																timeLimit: Number(e.target.value),
															})
														}
														className="w-32 rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
														min="30"
														step="30"
													/>
												)}
											</div>
										</div>
									</div>

									<div className="space-y-4">
										<h3 className="text-lg font-semibold text-gray-800">
											Preguntas ({questions.length})
										</h3>
										{questions.map((question, index) => (
											<div
												key={question.id}
												className="rounded-lg border border-gray-200 bg-gray-50 p-4"
											>
												<div className="flex items-start justify-between gap-4">
													<div>
														<h4 className="font-semibold text-gray-800">
															Pregunta {index + 1}
														</h4>
														<p className="text-gray-600">{question.text}</p>
														<div className="mt-2 space-y-1">
															{question.options.map((option, optIndex) => (
																<div
																	key={option.id}
																	className={`text-sm ${
																		option.id === question.correctOptionId
																			? 'font-medium text-green-600'
																			: 'text-gray-500'
																	}`}
																>
																	{optIndex + 1}. {option.text}
																	{option.id === question.correctOptionId && (
																		<CheckCircle2 className="ml-2 inline size-4" />
																	)}
																</div>
															))}
														</div>
													</div>
													<div className="flex gap-2">
														{/* <button
															onClick={() => handleEditQuestion(question.id)}
															className="rounded-lg p-2 text-blue-600 transition-colors hover:bg-blue-50"
														>
															<Edit2 className="size-4" />
														</button> */}
														<button
															onClick={() => handleRemoveQuestion(question.id)}
															className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50"
														>
															<Trash2 className="size-4" />
														</button>
													</div>
												</div>
											</div>
										))}
									</div>

									{questions.length > 0 && (
										<button
											onClick={handleStartQuiz}
											className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 py-3 text-white transition-colors hover:bg-indigo-700"
										>
											<Play className="size-5" /> Comenzar Quiz
										</button>
									)}
								</>
							)}
						</div>
					) : (
						<div className="space-y-6">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-4">
									<span className="flex items-center gap-2">
										<Trophy className="size-5 text-yellow-500" />
										<span className="text-xl font-bold">{score}</span>
									</span>
									{config.isTimerEnabled && (
										<span className="flex items-center gap-2">
											<Timer className="size-5 text-indigo-500" />
											<span className="text-xl font-bold">
												{formatTime(remainingTime)}
											</span>
										</span>
									)}
								</div>
								<div className="text-gray-600">
									Pregunta {currentQuestionIndex + 1} de {questions.length}
								</div>
							</div>

							{showInstructions && (
								<div className="rounded-lg border-l-4 border-blue-500 bg-blue-50 p-4">
									<div className="flex items-start gap-2">
										<HelpCircle className="mt-0.5 size-5 shrink-0 text-blue-500" />
										<div>
											<h4 className="font-semibold text-blue-800">
												Instrucciones:
											</h4>
											<ul className="list-inside list-disc space-y-1 text-sm text-blue-700">
												<li>Lee cada pregunta cuidadosamente</li>
												<li>Selecciona la respuesta que consideres correcta</li>
												<li>No podrás volver a una pregunta anterior</li>
												{config.isTimerEnabled && (
													<li>
														Completa el quiz antes de que se acabe el tiempo
													</li>
												)}
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

							<Quiz
								question={questions[currentQuestionIndex]}
								onAnswer={handleAnswer}
							/>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

export default PreguntasOM;
