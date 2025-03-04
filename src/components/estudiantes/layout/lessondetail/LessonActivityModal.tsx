'use client';
import { useState, useEffect } from 'react';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';
import {
	CogIcon,
	CheckCircleIcon,
	XCircleIcon,
	LightBulbIcon,
	ChevronRightIcon,
	StarIcon as StarSolidIcon,
} from '@heroicons/react/24/solid';
import { toast } from 'sonner';
import { Button } from '~/components/estudiantes/ui/button';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '~/components/estudiantes/ui/dialog';
import { Icons } from '~/components/estudiantes/ui/icons';
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
	} | null;
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

const LessonActivityModal = ({
	isOpen,
	onClose,
	activity,
	userId,
	onQuestionsAnswered,
	markActivityAsCompleted,
	onActivityCompleted, // Add this new prop
	savedResults,
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
	const [hasNavigatedOnce, setHasNavigatedOnce] = useState(false);

	useEffect(() => {
		if (activity?.content?.questions) {
			setQuestions(activity.content.questions);
		}
		setIsLoading(false);
	}, [activity]);

	useEffect(() => {
		if (savedResults) {
			setFinalScore(savedResults.score ?? 0);
			setUserAnswers(savedResults.answers ?? {});
			setShowResults(true);
		}
	}, [savedResults]);

	const currentQuestion = questions[currentQuestionIndex];
	const isLastQuestion = currentQuestionIndex === questions.length - 1;
	const canProceedToNext = currentQuestion && userAnswers[currentQuestion.id];

	const calculateScore = () => {
		const answers = Object.values(userAnswers);
		const correctAnswers = answers.filter((a) => a.isCorrect).length;
		return Math.round((correctAnswers / answers.length) * 5);
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
		const score = calculateScore();
		setFinalScore(score);
		setShowResults(true);

		try {
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
		} catch (error) {
			console.error('Error saving answers:', error);
			toast.error('Error al guardar las respuestas');
		}
	};

	const renderUnlockingState = () => (
		<div className="flex flex-col items-center justify-center p-8">
			<Icons.blocks className="size-22 fill-primary" />
			<p className="mt-4 text-center text-sm text-gray-500">
				Desbloqueando siguiente clase...
			</p>
		</div>
	);

	const handleFinishAndNavigate = async () => {
		if (!canClose) return;

		try {
			setIsUnlocking(true);
			await markActivityAsCompleted();
			await onActivityCompleted();
			onQuestionsAnswered(true);
			setIsUnlocking(false);

			// Marcar que ya se ha navegado una vez
			setHasNavigatedOnce(true);
		} catch (error) {
			console.error('Error:', error);
			toast.error('Error al completar la actividad');
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

	const renderResults = () => (
		// Reducido el padding vertical de 4 a 2
		<div className="-mt-14 space-y-3 px-4">
			<div className="text-center">
				{/* Reducido el tamaño del texto y el espacio superior */}
				<h3 className="text-xl font-bold text-background">Resultados</h3>
				<div className="mt-1">
					{renderStars(finalScore)}
					<p className="mt-1 text-lg font-medium text-gray-600">
						Calificación: <span className="text-primary">{finalScore}/5</span>
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

			{/* Mostrar el botón si la puntuación es suficiente */}
			{finalScore >= 3 ? (
				<Button
					onClick={hasNavigatedOnce ? onClose : handleFinishAndNavigate}
					disabled={isUnlocking}
					className="mt-4 w-full bg-gradient-to-r from-blue-500 to-blue-700 font-semibold text-white hover:from-blue-600 hover:to-blue-800"
				>
					{isUnlocking ? (
						<>
							<Icons.blocks className="mr-2 h-4 w-4 animate-spin" />
							Desbloqueando siguiente clase...
						</>
					) : hasNavigatedOnce ? (
						'Cerrar'
					) : (
						'Desbloquear siguiente clase'
					)}
				</Button>
			) : (
				<div className="mt-4 space-y-4">
					<p className="text-center text-red-600">
						No has alcanzado la puntuación mínima necesaria (3/5)
					</p>
					<Button
						onClick={() => {
							setCurrentQuestionIndex(0);
							setUserAnswers({});
							setShowResults(false);
							setCanClose(false);
						}}
						className="w-full bg-yellow-500 text-white hover:bg-yellow-600"
					>
						Intentar nuevamente
					</Button>
				</div>
			)}
		</div>
	);

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
							<CogIcon className="-mt-2 size-12 animate-spin text-primary" />
						</div>
					</DialogTitle>
				</DialogHeader>
				{isUnlocking ? (
					renderUnlockingState()
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
								onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
								disabled={currentQuestionIndex === 0}
								className="btn-arrow btn-arrow-prev"
							>
								<ChevronRightIcon />
								<span>Anterior</span>
							</button>

							<button
								onClick={isLastQuestion ? handleFinish : handleNext}
								disabled={!canProceedToNext}
								className={`btn-arrow ${isLastQuestion ? 'btn-arrow-success' : ''}`}
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
