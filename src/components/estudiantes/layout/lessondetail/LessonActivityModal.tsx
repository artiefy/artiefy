'use client';
import { useState, useEffect } from 'react';

import Image from 'next/image';

import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';
import {
	CheckCircleIcon,
	XCircleIcon,
	LightBulbIcon,
	ChevronRightIcon,
	StarIcon as StarSolidIcon,
} from '@heroicons/react/24/solid';
import { FileCheck2, Lock, Unlock } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '~/components/estudiantes/ui/button';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '~/components/estudiantes/ui/dialog';
import { Icons } from '~/components/estudiantes/ui/icons';
import { unlockNextLesson } from '~/server/actions/estudiantes/lessons/unlockNextLesson';

import type { Activity, Question, SavedAnswer } from '~/types';
import '~/styles/arrowactivity.css';

interface ActivityModalProps {
	isOpen: boolean;
	onClose: () => void;
	activity: Activity;
	userId: string;
	onQuestionsAnswered: (allAnswered: boolean) => void;
	markActivityAsCompleted: () => Promise<void>; // Update type to Promise<void>
	onActivityCompleted: () => Promise<void>; // Add this new prop
	savedResults?: {
		score: number;
		answers: Record<string, SavedAnswer>;
		isAlreadyCompleted?: boolean;
	} | null;
	onLessonUnlocked: (lessonId: number) => void; // Add this new prop
	isLastLesson: boolean; // Add this new prop
}

interface UserAnswer {
	questionId: string;
	answer: string;
	isCorrect: boolean;
}

interface SaveAnswersResponse {
	success: boolean;
	canClose: boolean; // Add canClose to the interface
}

interface AttemptsResponse {
	attempts: number;
}

const LessonActivityModal = ({
	isOpen,
	onClose,
	activity,
	userId,
	onQuestionsAnswered,
	markActivityAsCompleted,
	onActivityCompleted, // Add this new prop
	savedResults,
	onLessonUnlocked, // Add this new prop
	isLastLesson, // Add this new prop
}: ActivityModalProps) => {
	const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
	const [userAnswers, setUserAnswers] = useState<Record<string, UserAnswer>>(
		{}
	);
	const [questions, setQuestions] = useState<Question[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [showResults, setShowResults] = useState(false);
	const [finalScore, setFinalScore] = useState(0);
	const [canClose, setCanClose] = useState(false);
	const [isUnlocking, setIsUnlocking] = useState(false);
	const [isResultsLoaded, setIsResultsLoaded] = useState(false);
	const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);
	const [isSavingResults, setIsSavingResults] = useState(false);

	useEffect(() => {
		if (activity?.content?.questions) {
			setQuestions(activity.content.questions);
			setIsLoading(false);
		}
	}, [activity]);

	useEffect(() => {
		if (savedResults) {
			setFinalScore(savedResults.score ?? 0);
			setUserAnswers(savedResults.answers ?? {});
			setShowResults(true);
		}
	}, [savedResults]);

	useEffect(() => {
		const checkAttempts = async () => {
			if (activity.revisada) {
				const response = await fetch(
					`/api/activities/attempts?activityId=${activity.id}&userId=${userId}`
				);
				const data = (await response.json()) as AttemptsResponse;
				setAttemptsLeft(3 - (data.attempts ?? 0)); // Using nullish coalescing
			}
		};
		void checkAttempts();
	}, [activity.id, activity.revisada, userId]);

	useEffect(() => {
		if (savedResults?.isAlreadyCompleted) {
			setShowResults(true);
			setFinalScore(savedResults.score);
			setUserAnswers(savedResults.answers);
			setIsResultsLoaded(true);
		}
	}, [savedResults]);

	const currentQuestion = questions[currentQuestionIndex];
	const isLastQuestion = currentQuestionIndex === questions.length - 1;
	const canProceedToNext = currentQuestion && userAnswers[currentQuestion.id];

	const calculateScore = () => {
		const answers = Object.values(userAnswers);
		const correctAnswers = answers.filter((a) => a.isCorrect).length;
		// Convert to 1 decimal place
		return Number(((correctAnswers / answers.length) * 5).toFixed(1));
	};

	const checkAnswer = (questionId: string, answer: string) => {
		const question = questions.find((q) => q.id === questionId);
		if (!question) return false;

		switch (question.type) {
			case 'VOF':
			case 'OM':
				return answer === question.correctOptionId;
			case 'COMPLETAR':
				return (
					answer.toLowerCase().trim() ===
					question.correctAnswer?.toLowerCase().trim()
				);
			default:
				return false;
		}
	};

	const handleAnswer = (answer: string) => {
		if (!currentQuestion) return;

		const isCorrect = checkAnswer(currentQuestion.id, answer);
		setUserAnswers((prev) => ({
			...prev,
			[currentQuestion.id]: {
				questionId: currentQuestion.id,
				answer,
				isCorrect,
			},
		}));
	};

	const handleNext = () => {
		if (!isLastQuestion) {
			setCurrentQuestionIndex((prev) => prev + 1);
		}
	};

	const handleFinish = async () => {
		try {
			setIsSavingResults(true);
			setIsResultsLoaded(false);
			const score = calculateScore();
			setFinalScore(score);
			setShowResults(true);

			const allQuestionsAnswered =
				Object.keys(userAnswers).length === questions.length;
			const hasPassingScore = score >= 3;

			const response = await fetch('/api/activities/saveAnswers', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					activityId: activity.id,
					userId,
					answers: userAnswers,
					score,
					allQuestionsAnswered,
					passed: hasPassingScore,
				}),
			});

			const data = (await response.json()) as SaveAnswersResponse;

			// Solo permitir cerrar si aprobó y respondió todo
			setCanClose(data.success && hasPassingScore);

			if (!hasPassingScore) {
				toast.error('Debes obtener al menos 3 puntos para aprobar');
			}

			// Check attempts for revisada activities
			if (activity.revisada) {
				try {
					const attemptsResponse = await fetch(
						`/api/activities/attempts?activityId=${activity.id}&userId=${userId}`
					);
					const attemptsData =
						(await attemptsResponse.json()) as AttemptsResponse;
					setAttemptsLeft(3 - (attemptsData.attempts ?? 0));
				} catch (attemptError) {
					console.error('Error checking attempts:', attemptError);
				}
			}

			// Marcar que los resultados están cargados
			setIsResultsLoaded(true);
		} catch (error) {
			console.error('Error saving answers:', error);
			toast.error('Error al guardar las respuestas');
		} finally {
			setIsSavingResults(false);
			setIsResultsLoaded(true);
		}
	};

	const renderLoadingState = (message: string) => (
		<div className="flex flex-col items-center justify-center p-8">
			<Icons.blocks className="size-22 animate-pulse fill-primary" />
			<p className="mt-6 text-center text-xl text-white">{message}</p>
		</div>
	);

	const handleFinishAndNavigate = async () => {
		if (!canClose) {
			toast.error('Debes aprobar la actividad primero');
			return;
		}

		try {
			setIsUnlocking(true);
			await markActivityAsCompleted();
			await onActivityCompleted();
			onQuestionsAnswered(true);

			const result = await unlockNextLesson(activity.lessonsId);
			if (result.success && result.nextLessonId) {
				onLessonUnlocked(result.nextLessonId);
				toast.success('¡Siguiente clase desbloqueada!');
				onClose();
			} else {
				toast.error(
					'Completa la actividad para desbloquear la siguiente clase'
				);
			}
		} catch (error) {
			console.error('Error:', error);
			toast.error('Error al completar la actividad');
		} finally {
			setIsUnlocking(false);
		}
	};

	const getDisplayAnswer = (userAnswer: UserAnswer, question: Question) => {
		let displayAnswer = userAnswer.answer;

		switch (question.type) {
			case 'VOF': {
				displayAnswer = userAnswer.answer === 'true' ? 'Verdadero' : 'Falso';
				break;
			}
			case 'OM': {
				const selectedOption = question.options?.find(
					(opt) => opt.id === userAnswer.answer
				);
				displayAnswer = selectedOption?.text ?? userAnswer.answer;
				break;
			}
			case 'COMPLETAR': {
				displayAnswer = userAnswer.answer;
				break;
			}
		}
		return displayAnswer;
	};

	const getDisplayCorrectAnswer = (question: Question): string => {
		let correctAnswer = '';

		switch (question.type) {
			case 'VOF': {
				correctAnswer =
					question.correctOptionId === 'true' ? 'Verdadero' : 'Falso';
				break;
			}
			case 'OM': {
				const correctOption = question.options?.find(
					(opt) => opt.id === question.correctOptionId
				);
				correctAnswer = correctOption?.text ?? question.correctOptionId ?? '';
				break;
			}
			case 'COMPLETAR': {
				correctAnswer = question.correctAnswer ?? '';
				break;
			}
		}
		return correctAnswer;
	};

	const renderQuestion = () => {
		if (!currentQuestion) return null;

		const isQuestionAnswered = userAnswers[currentQuestion.id];

		return (
			<div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
				<h3 className="mb-4 flex items-center justify-between border-b border-gray-100 pb-4 text-lg font-semibold text-gray-800">
					<div className="flex items-center">
						<span className="mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 font-bold text-background">
							{currentQuestionIndex + 1}
						</span>
						{currentQuestion.text}
					</div>
					<LightBulbIcon
						className={`h-6 w-6 transition-all duration-300 ${
							isQuestionAnswered
								? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]'
								: 'text-gray-300'
						}`}
					/>
				</h3>

				<div className="space-y-3">
					{currentQuestion.type === 'COMPLETAR' ? (
						<input
							type="text"
							value={userAnswers[currentQuestion.id]?.answer || ''}
							onChange={(e) => handleAnswer(e.target.value)}
							className="w-full rounded-md border border-gray-300 p-3 text-background shadow-sm transition-all duration-200 placeholder:text-gray-400 focus:border-blue-800 focus:ring-2 focus:ring-blue-800/20 focus:outline-none"
							placeholder="Escribe tu respuesta..."
						/>
					) : (
						<div className="grid gap-3">
							{currentQuestion.options?.map((option) => (
								<label
									key={option.id}
									className="flex cursor-pointer items-center rounded-lg border border-gray-200 p-4 transition-all hover:bg-gray-50"
								>
									<input
										type="radio"
										name={currentQuestion.id}
										value={option.id}
										checked={
											userAnswers[currentQuestion.id]?.answer === option.id
										}
										onChange={(e) => handleAnswer(e.target.value)}
										className="h-4 w-4 text-primary focus:ring-primary"
									/>
									<span className="ml-3 text-gray-700">{option.text}</span>
								</label>
							))}
						</div>
					)}
				</div>
			</div>
		);
	};

	const renderStars = (score: number) => {
		const totalStars = 5;
		const starScore = Math.round((score / 5) * totalStars);

		return (
			<div className="flex justify-center gap-1">
				{Array.from({ length: totalStars }, (_, index) =>
					index < starScore ? (
						<StarSolidIcon key={index} className="h-8 w-8 text-yellow-400" />
					) : (
						<StarOutlineIcon key={index} className="h-8 w-8 text-gray-300" />
					)
				)}
			</div>
		);
	};

	const renderActionButton = () => {
		// Si está cargando resultados o desbloqueando
		if (!isResultsLoaded || isUnlocking) {
			return (
				<Button
					disabled
					className="mt-4 w-full cursor-not-allowed bg-gradient-to-r from-blue-400/70 to-blue-600/70"
				>
					<Icons.spinner className="mr-2 h-5 w-5 animate-spin" />
					<span>Cargando resultados...</span>
				</Button>
			);
		}

		// Si la actividad ya fue completada anteriormente, solo mostrar botón cerrar
		if (savedResults?.isAlreadyCompleted || activity.isCompleted) {
			return (
				<Button
					onClick={onClose}
					className="mt-4 w-full bg-blue-500 font-bold transition-all duration-200 hover:bg-blue-600 active:scale-[0.98]"
				>
					CERRAR
				</Button>
			);
		}

		// Si no aprobó y es una actividad revisada (calificable)
		if (finalScore < 3 && activity.revisada) {
			if (attemptsLeft && attemptsLeft > 0) {
				return (
					<>
						<p className="text-center text-sm text-gray-600">
							Te quedan {attemptsLeft} intento{attemptsLeft !== 1 ? 's' : ''}
						</p>
						<Button
							onClick={() => {
								setCurrentQuestionIndex(0);
								setUserAnswers({});
								setShowResults(false);
							}}
							className="mt-2 w-full bg-yellow-500 hover:bg-yellow-600"
						>
							Intentar nuevamente
						</Button>
					</>
				);
			}
			return (
				<div className="rounded-lg bg-red-50 p-4 text-center">
					<p className="font-semibold text-red-800">
						Has agotado todos tus intentos
					</p>
					<p className="mt-1 text-sm text-red-600">
						Calificación final: {finalScore}/5
					</p>
					<Button onClick={onClose} className="mt-3 w-full bg-gray-500">
						Cerrar
					</Button>
				</div>
			);
		}

		// Si no aprobó pero la actividad no es revisada (práctica)
		if (finalScore < 3 && !activity.revisada) {
			return (
				<>
					<Button
						onClick={() => {
							setCurrentQuestionIndex(0);
							setUserAnswers({});
							setShowResults(false);
						}}
						className="mt-2 w-full bg-yellow-500 hover:bg-yellow-600"
					>
						Intentar nuevamente
					</Button>
					<Button onClick={onClose} className="mt-2 w-full bg-gray-500">
						Cerrar
					</Button>
				</>
			);
		}

		// Si aprobó y puede desbloquear siguiente clase
		if (finalScore >= 3 && !activity.isCompleted && !isLastLesson) {
			return (
				<Button
					onClick={handleFinishAndNavigate}
					className="group mt-4 w-full bg-green-500 transition-all duration-200 hover:scale-[0.98] hover:bg-green-600"
				>
					<span className="flex items-center justify-center gap-2 font-bold text-green-900">
						Desbloquear Siguiente CLASE
						<Lock className="h-4 w-4 transition-all duration-200 group-hover:hidden" />
						<Unlock className="hidden h-4 w-4 transition-all duration-200 group-hover:block" />
					</span>
				</Button>
			);
		}

		// Por defecto, mostrar botón de cerrar
		return (
			<Button
				onClick={onClose}
				className="mt-4 w-full bg-blue-500 transition-all duration-200 hover:bg-blue-600 active:scale-[0.98]"
			>
				Cerrar
			</Button>
		);
	};

	const renderResults = () => {
		if (!isResultsLoaded || isSavingResults) {
			return renderLoadingState('Cargando Resultados...');
		}

		return (
			<div className="-mt-14 space-y-3 px-4">
				<div className="text-center">
					<h3 className="text-xl font-bold text-background">Resultados</h3>
					<div className="mt-1">
						{renderStars(finalScore)}
						<p className="mt-1 text-lg font-medium text-gray-600">
							Calificación:{' '}
							<span className="text-primary">{finalScore.toFixed(1)}</span>/5
						</p>
					</div>
				</div>

				<div className="max-h-[60vh] divide-y divide-gray-100 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-sm">
					{questions.map((question, idx) => {
						const userAnswer = userAnswers[question.id];
						const isCorrect = userAnswer?.isCorrect;
						const displayAnswer = userAnswer
							? getDisplayAnswer(userAnswer, question)
							: '';
						const displayCorrectAnswer = getDisplayCorrectAnswer(question);

						return (
							<div
								key={question.id}
								className="space-y-3 p-4 transition-all hover:bg-gray-50"
							>
								<div className="flex items-start justify-between">
									<div className="flex-1">
										<p className="font-medium text-gray-900">
											<span className="mr-2 text-gray-500">
												Pregunta {idx + 1}:
											</span>
											{question.text}
										</p>
									</div>
									{isCorrect ? (
										<CheckCircleIcon className="h-6 w-6 text-green-600" />
									) : (
										<XCircleIcon className="h-6 w-6 text-red-600" />
									)}
								</div>

								<div className="ml-6 space-y-2">
									<div
										className={`rounded-md p-2 ${isCorrect ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}
									>
										<p className="text-sm">
											<span className="font-bold">Tu respuesta:</span>{' '}
											<span className="font-bold">{displayAnswer}</span>
										</p>
									</div>
									{!isCorrect && (
										<div className="rounded-md bg-gray-50 p-2 text-sm text-gray-900">
											<span className="font-bold">Respuesta correcta:</span>{' '}
											<span className="font-bold">{displayCorrectAnswer}</span>
										</div>
									)}
								</div>
							</div>
						);
					})}
				</div>
				{renderActionButton()}
			</div>
		);
	};

	const getQuestionTypeLabel = (type: string) => {
		switch (type) {
			case 'VOF':
				return 'Verdadero o Falso';
			case 'OM':
				return 'Selección Múltiple';
			case 'COMPLETAR':
				return 'Completar Texto';
			default:
				return 'Pregunta';
		}
	};

	if (isLoading) {
		return (
			<Dialog open={isOpen} onOpenChange={onClose}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Actividad</DialogTitle>
					</DialogHeader>
					<div className="flex justify-center">
						<Icons.spinner className="h-8 w-8 animate-spin" />
					</div>
				</DialogContent>
			</Dialog>
		);
	}

	return (
		<Dialog
			open={isOpen}
			onOpenChange={(open) => {
				if (!open && canClose) {
					void handleFinishAndNavigate();
				}
			}}
		>
			<DialogContent className="sm:max-w-[500px] [&>button]:bg-background [&>button]:text-background [&>button]:hover:text-background">
				<DialogHeader className="relative pb-6">
					<DialogTitle className="text-center text-3xl font-bold">
						ACTIVIDAD
						<div className="absolute top-0 right-4">
							{showResults ? (
								<FileCheck2 className="size-8 text-green-500" />
							) : (
								<Image
									src="/question-and-answer-svgrepo-com.svg"
									alt="Question and Answer Icon"
									width={48}
									height={48}
									className="-mt-2"
									unoptimized // Add this prop for SVGs
								/>
							)}
						</div>
					</DialogTitle>
				</DialogHeader>
				{isUnlocking ? (
					renderLoadingState('Desbloqueando Siguiente Clase...')
				) : isSavingResults ? (
					renderLoadingState('Cargando Resultados...')
				) : showResults ? (
					renderResults()
				) : (
					<div className="space-y-6">
						<div className="mb-8 flex flex-col items-center justify-center text-center">
							<span className="text-2xl font-bold text-primary">
								{getQuestionTypeLabel(currentQuestion?.type ?? '')}
							</span>
							<span className="mt-2 text-sm text-gray-500">
								{currentQuestionIndex + 1} de {questions.length}
							</span>
						</div>
						{renderQuestion()}
						<div className="flex justify-between">
							<button
								className="btn-arrow btn-arrow-prev"
								disabled={currentQuestionIndex === 0}
								onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
							>
								<ChevronRightIcon />
								<span>Anterior</span>
							</button>
							<button
								className={`btn-arrow ${isLastQuestion ? 'btn-arrow-success' : ''}`}
								disabled={!canProceedToNext}
								onClick={isLastQuestion ? handleFinish : handleNext}
							>
								<span>{isLastQuestion ? 'Ver resultados' : 'Siguiente'}</span>
								<ChevronRightIcon />
							</button>
						</div>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
};

export default LessonActivityModal;
