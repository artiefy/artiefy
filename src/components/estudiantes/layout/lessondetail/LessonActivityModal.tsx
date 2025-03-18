'use client';
import { useState, useEffect } from 'react';

import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';
import {
	CheckCircleIcon,
	XCircleIcon,
	LightBulbIcon,
	ChevronRightIcon,
	StarIcon as StarSolidIcon,
} from '@heroicons/react/24/solid';
import { FileCheck2, FileX2, Lock, Unlock, ShieldQuestion } from 'lucide-react';
import { BiSolidReport } from 'react-icons/bi';
import { FaTrophy } from 'react-icons/fa';
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
import { formatScore, formatScoreNumber } from '~/utils/formatScore';

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
	courseId: number; // Add courseId prop
	isLastActivity: boolean; // Add this prop
	onViewHistory: () => void; // Add this new prop
	onActivityComplete: () => void; // Add this new prop
}

interface UserAnswer {
	questionId: string;
	answer: string;
	isCorrect: boolean;
}

interface AttemptsResponse {
	attempts: number;
	isRevisada: boolean;
	attemptsLeft: number | null; // null means infinite attempts
	lastGrade: number | null;
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
	courseId,
	isLastActivity,
	onViewHistory,
	onActivityComplete,
}: ActivityModalProps) => {
	const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
	const [userAnswers, setUserAnswers] = useState<Record<string, UserAnswer>>(
		{}
	);
	const [questions, setQuestions] = useState<Question[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [showResults, setShowResults] = useState(false);
	const [finalScore, setFinalScore] = useState(0);
	const [isUnlocking, setIsUnlocking] = useState(false);
	const [isResultsLoaded, setIsResultsLoaded] = useState(false);
	const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);
	const [isSavingResults, setIsSavingResults] = useState(false);
	const [canCloseModal, setCanCloseModal] = useState(false); // Add new state to track if user can close modal

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
			const response = await fetch(
				`/api/activities/attempts?activityId=${activity.id}&userId=${userId}`
			);
			const data = (await response.json()) as AttemptsResponse;

			// Only set attempts limit for revisada activities
			if (activity.revisada) {
				setAttemptsLeft(data.attemptsLeft ?? 3);
			} else {
				setAttemptsLeft(null); // null indicates infinite attempts
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

	useEffect(() => {
		const canClose = () => {
			if (savedResults?.isAlreadyCompleted || activity.isCompleted) {
				return true;
			}

			if (!showResults) {
				return false;
			}

			if (activity.revisada) {
				// Para actividades revisadas, solo permitir cerrar si:
				// 1. Obtuvo calificación >= 3
				// 2. Agotó todos los intentos (attemptsLeft === 0)
				return finalScore >= 3 || attemptsLeft === 0;
			} else {
				// Para actividades no revisadas, solo permitir cerrar si:
				// 1. Obtuvo calificación >= 3
				return finalScore >= 3;
			}
		};

		setCanCloseModal(canClose());
	}, [
		showResults,
		finalScore,
		attemptsLeft,
		activity.revisada,
		activity.isCompleted,
		savedResults?.isAlreadyCompleted,
	]);

	const currentQuestion = questions[currentQuestionIndex];
	const isLastQuestion = currentQuestionIndex === questions.length - 1;
	const canProceedToNext = currentQuestion && userAnswers[currentQuestion.id];

	const calculateScore = () => {
		const answers = Object.values(userAnswers);
		const correctAnswers = answers.filter((a) => a.isCorrect).length;
		return formatScoreNumber((correctAnswers / answers.length) * 5);
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

			if (!allQuestionsAnswered) {
				toast.error('Debes responder todas las preguntas');
				return;
			}

			// For non-revisada activities, only need passing score
			// For revisada activities, need passing score or exhausted attempts
			setCanCloseModal(
				score >= 3 ||
					// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
					(activity.revisada && attemptsLeft === 0) ||
					(!activity.revisada && score < 3) || // Allow closing for non-revisada even if failed
					(isLastActivity && isLastLesson)
			);

			const hasPassingScore = score >= 3;

			await fetch('/api/activities/saveAnswers', {
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

			if (isLastActivity) {
				// Update grades in database
				const response = await fetch('/api/grades/updateGrades', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						courseId,
						userId,
						activityId: activity.id,
						finalGrade: score,
					}),
				});

				if (response.ok) {
					toast.success(
						'¡Curso completado! Puedes ver tus calificaciones en el panel de notas.'
					);
				}
			}
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
		// Remove the canClose validation
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
				toast.error('Error al desbloquear la siguiente clase');
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
							value={userAnswers[currentQuestion.id]?.answer ?? ''} // Changed || to ??
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
		// Loading states remain the same
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

		// Already completed states remain the same
		if (savedResults?.isAlreadyCompleted || activity.isCompleted) {
			return (
				<Button
					onClick={onClose}
					className="mt-3 w-full bg-blue-500 font-bold text-background transition-all duration-200 hover:bg-blue-600 active:scale-[0.98]"
				>
					CERRAR
				</Button>
			);
		}

		// Modified logic for attempts exhausted
		if (finalScore < 3 && activity.revisada) {
			if (attemptsLeft && attemptsLeft > 0) {
				return (
					<>
						<p className="text-center text-sm text-gray-400">
							Te quedan{' '}
							<span className="text-2xl font-bold text-white">
								{attemptsLeft}
							</span>{' '}
							intento{attemptsLeft !== 1 ? 's' : ''}
						</p>
						<Button
							onClick={() => {
								setCurrentQuestionIndex(0);
								setUserAnswers({});
								setShowResults(false);
							}}
							className="w-full bg-yellow-500 font-bold text-background hover:bg-yellow-600 active:scale-[0.98]"
						>
							Intentar Nuevamente
						</Button>
					</>
				);
			}
			// New UI for exhausted attempts
			return (
				<div className="space-y-3">
					<div className="rounded-lg bg-red-50 p-4 text-center">
						<p className="font-semibold text-red-800">
							Has agotado todos tus intentos
						</p>
					</div>
					{isLastActivity ? (
						// Show both buttons for last activity when attempts are exhausted
						<div className="space-y-3">
							<Button
								onClick={onViewHistory}
								className="w-full bg-blue-500 text-white hover:bg-blue-600"
							>
								<span className="flex items-center justify-center gap-2">
									<FaTrophy className="mr-1" />
									Ver Reporte de Calificaciones
									<BiSolidReport className="ml-1" />
								</span>
							</Button>
							<Button
								onClick={() => {
									onActivityComplete();
									onClose();
								}}
								className="w-full bg-[#00BDD8] text-white transition-all duration-200 hover:bg-[#00A5C0] active:scale-[0.98]"
							>
								Cerrar
							</Button>
						</div>
					) : (
						!isLastLesson && (
							<Button
								onClick={handleFinishAndNavigate}
								className="w-full bg-green-500 transition-all duration-200 hover:bg-green-600 active:scale-95"
							>
								<span className="flex items-center justify-center gap-2 font-semibold text-white">
									Desbloquear Siguiente CLASE
									<Unlock className="h-4 w-4" />
								</span>
							</Button>
						)
					)}
				</div>
			);
		}

		// Rest of the renderActionButton code remains the same...
		if (finalScore < 3 && !activity.revisada) {
			return (
				<>
					<p className="text-center font-extralight text-gray-400">
						! Intentos ilimitados hasta aprobar !
					</p>
					<Button
						onClick={() => {
							setCurrentQuestionIndex(0);
							setUserAnswers({});
							setShowResults(false);
						}}
						className="w-full bg-yellow-500 font-bold text-background hover:bg-yellow-600"
					>
						Intentar Nuevamente
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
					className="group relative mt-4 w-full overflow-hidden bg-green-500 transition-all duration-200 hover:bg-green-600 active:scale-[0.98]"
					disabled={isUnlocking}
				>
					{isUnlocking ? (
						<div className="flex items-center justify-center gap-2">
							<Icons.blocks className="size-5 animate-spin text-white" />
							<span className="font-bold text-white">
								Desbloqueando siguiente clase...
							</span>
						</div>
					) : (
						<span className="flex items-center justify-center gap-2 font-bold text-green-900">
							Desbloquear Siguiente CLASE
							<Lock className="h-4 w-4 transition-all duration-200 group-hover:hidden" />
							<Unlock className="hidden h-4 w-4 transition-all duration-200 group-hover:block" />
						</span>
					)}
				</Button>
			);
		}

		// Modify the last activity condition
		if (finalScore >= 3 && isLastActivity) {
			return (
				<div className="space-y-3">
					<Button
						onClick={onViewHistory}
						className="w-full bg-blue-500 text-white hover:bg-blue-600 active:scale-[0.98]"
					>
						<span className="flex items-center justify-center gap-2">
							<FaTrophy className="mr-1" />
							Ver Reporte de Calificaciones
							<BiSolidReport className="ml-1 h-8" />
						</span>
					</Button>
					<Button
						onClick={() => {
							onActivityComplete(); // Add this callback
							onClose();
						}}
						className="w-full bg-[#00BDD8] text-white transition-all duration-200 hover:bg-[#00A5C0] active:scale-[0.98]"
					>
						Cerrar
					</Button>
				</div>
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
						<p className="mt-1 text-lg font-medium text-gray-400">
							Calificación:{' '}
							<span
								className={`text-2xl font-bold ${
									finalScore >= 3
										? 'animate-pulse text-green-500 shadow-lg'
										: 'animate-pulse text-red-500 shadow-lg'
								}`}
							>
								{formatScore(finalScore)}
							</span>
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
									{/* Solo mostrar la respuesta correcta si la calificación es >= 3 */}
									{!isCorrect && finalScore >= 3 && (
										<div className="rounded-md bg-gray-50 p-2 text-sm text-gray-900">
											<span className="font-bold">Respuesta correcta:</span>{' '}
											<span className="font-bold">
												{getDisplayCorrectAnswer(question)}
											</span>
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
				if (!open) {
					if (!canCloseModal) {
						if (activity.revisada && attemptsLeft && attemptsLeft > 0) {
							toast.error(
								`Debes completar los ${attemptsLeft} intentos restantes o aprobar la actividad`
							);
						} else {
							toast.error('Debes aprobar la actividad para continuar');
						}
						return;
					}

					if (!open && finalScore >= 3 && isLastActivity) {
						onActivityComplete();
					}
				}
				onClose();
			}}
		>
			<DialogContent className="sm:max-w-[500px] [&>button]:bg-background [&>button]:text-background [&>button]:hover:text-background">
				<DialogHeader className="relative pb-6">
					<DialogTitle className="text-center text-3xl font-bold">
						ACTIVIDAD
						<div className="absolute top-0 right-4">
							{showResults ? (
								isUnlocking ? (
									<Unlock className="size-8 animate-pulse text-green-500" />
								) : finalScore >= 3 ? (
									<FileCheck2 className="size-8 text-green-500" />
								) : (
									<FileX2 className="size-8 text-red-500" />
								)
							) : (
								<ShieldQuestion className="-mt-2 size-12 text-primary" />
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
