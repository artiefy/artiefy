'use client';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '~/components/estudiantes/ui/button';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '~/components/estudiantes/ui/dialog';
import { Icons } from '~/components/estudiantes/ui/icons';
import type { Activity, Question } from '~/types';

interface ActivityModalProps {
	isOpen: boolean;
	onClose: () => void;
	activity: Activity;
	userId: string;
	onQuestionsAnswered: (allAnswered: boolean) => void;
	markActivityAsCompleted: () => Promise<void>; // Update type to Promise<void>
	onActivityCompleted: () => Promise<void>; // Add this new prop
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

	useEffect(() => {
		if (activity?.content?.questions) {
			setQuestions(activity.content.questions);
		}
		setIsLoading(false);
	}, [activity]);

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

	const handleFinishAndNavigate = async () => {
		if (!canClose) return;

		try {
			await markActivityAsCompleted();
			await onActivityCompleted(); // Call parent's handler
			onQuestionsAnswered(true);

			toast.success('¡Actividad completada!', {
				description: 'La siguiente clase ha sido desbloqueada',
			});

			onClose();
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

		switch (currentQuestion.type) {
			case 'VOF':
				return (
					<div className="space-y-4">
						<h3 className="font-semibold">{currentQuestion.text}</h3>
						<div className="space-y-2">
							{currentQuestion.options?.map((option) => (
								<label key={option.id} className="block">
									<input
										type="radio"
										name={currentQuestion.id}
										value={option.id}
										checked={
											userAnswers[currentQuestion.id]?.answer === option.id
										}
										onChange={(e) => handleAnswer(e.target.value)}
									/>
									<span className="ml-2">{option.text}</span>
								</label>
							))}
						</div>
					</div>
				);

			case 'OM':
				return (
					<div className="space-y-4">
						<h3 className="font-semibold">{currentQuestion.text}</h3>
						<div className="space-y-2">
							{currentQuestion.options?.map((option) => (
								<label key={option.id} className="block">
									<input
										type="radio"
										name={currentQuestion.id}
										value={option.id}
										checked={
											userAnswers[currentQuestion.id]?.answer === option.id
										}
										onChange={(e) => handleAnswer(e.target.value)}
									/>
									<span className="ml-2">{option.text}</span>
								</label>
							))}
						</div>
					</div>
				);

			case 'COMPLETAR':
				return (
					<div className="space-y-4">
						<h3 className="font-semibold">{currentQuestion.text}</h3>
						<input
							type="text"
							value={userAnswers[currentQuestion.id]?.answer || ''}
							onChange={(e) => handleAnswer(e.target.value)}
							className="w-full rounded-md border p-2"
							placeholder="Escribe tu respuesta..."
						/>
					</div>
				);

			default:
				return null;
		}
	};

	const renderResults = () => (
		<div className="space-y-4 p-4">
			<h3 className="text-xl font-bold">Resultados</h3>
			<div className="rounded-lg bg-gray-50 p-4">
				<p className="mb-4 text-center text-lg font-semibold">
					Tu calificación: {finalScore}/5
				</p>
				<div className="mt-4 space-y-2">
					{questions.map((question, idx) => {
						const userAnswer = userAnswers[question.id];
						const displayAnswer = userAnswer
							? getDisplayAnswer(userAnswer, question)
							: '';
						const displayCorrectAnswer = getDisplayCorrectAnswer(question);

						return (
							<div
								key={question.id}
								className={`rounded-md p-3 ${userAnswer?.isCorrect ? 'bg-green-100' : 'bg-red-100'}`}
							>
								<p className="font-medium">
									Pregunta {idx + 1}: {question.text}
								</p>
								<p className="text-sm">Tu respuesta: {displayAnswer}</p>
								{!userAnswer?.isCorrect && (
									<p className="text-sm text-red-600">
										Respuesta correcta: {displayCorrectAnswer}
									</p>
								)}
							</div>
						);
					})}
				</div>
			</div>

			{/* Mostrar el botón si la puntuación es suficiente */}
			{finalScore >= 3 ? (
				<Button
					onClick={handleFinishAndNavigate}
					className="mt-4 w-full bg-gradient-to-r from-blue-500 to-blue-700 font-semibold text-white hover:from-blue-600 hover:to-blue-800"
				>
					Cerrar y desbloquear siguiente clase
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
			<DialogContent>
				<DialogHeader>
					<DialogTitle className="text-center text-xl">Actividad</DialogTitle>
				</DialogHeader>
				{showResults ? (
					renderResults()
				) : (
					<div className="space-y-6">
						<div className="mb-4">
							<span className="text-sm text-gray-500">
								Pregunta {currentQuestionIndex + 1} de {questions.length}
							</span>
						</div>
						{renderQuestion()}
						<div className="flex justify-between">
							<Button
								onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
								disabled={currentQuestionIndex === 0}
								variant="outline"
							>
								Anterior
							</Button>

							<Button
								onClick={isLastQuestion ? handleFinish : handleNext}
								disabled={!canProceedToNext}
								className={
									isLastQuestion ? 'bg-green-600 hover:bg-green-700' : ''
								}
							>
								{isLastQuestion ? 'Ver resultados' : 'Siguiente'}
							</Button>
						</div>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
};

export default LessonActivityModal;
