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
import { Unlock } from 'lucide-react';
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
import { FileUploadForm } from './FileUploadForm';

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
	isLastActivityInLesson: boolean; // Add this prop
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

interface StoredFileInfo {
	fileName: string;
	fileUrl: string;
	uploadDate: string;
	status: 'pending' | 'reviewed';
	grade?: number;
	feedback?: string;
}

interface PresignedResponse {
	url: string;
	fields: Record<string, string>;
	key: string;
	fileUrl: string;
}

interface DocumentUploadResponse {
	success: boolean;
	status: 'pending' | 'reviewed';
	fileUrl: string;
	documentKey: string;
}

interface FilePreview {
	file: File;
	type: string;
	size: string;
	progress: number;
	status: 'uploading' | 'complete' | 'error';
}

// Add formatFileSize as a standalone utility function
const formatFileSize = (bytes: number): string => {
	if (bytes === 0) return '0 B';
	const k = 1024;
	const sizes = ['B', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const getFileIcon = (fileType: string) => {
	const type = fileType.toLowerCase();

	if (type === 'pdf') {
		return (
			<svg className="h-6 w-6 text-red-500" viewBox="0 0 384 512">
				<path
					fill="currentColor"
					d="M320 464c8.8 0 16-7.2 16-16V160H256c-17.7 0-32-14.3-32-32V48H64c-8.8 0-16 7.2-16 16v384c0 8.8 7.2 16 16 16h256zM0 64C0 28.7 28.7 0 64 0h160l128 128v304c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V64zm160 240c0-8.8 7.2-16 16-16h32c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16h-32c-8.8 0-16-7.2-16-16v-32zm96 0c0-8.8 7.2-16 16-16h32c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16h-32c-8.8 0-16-7.2-16-16v-32z"
				/>
			</svg>
		);
	}

	if (type === 'doc' || type === 'docx') {
		return (
			<svg className="h-6 w-6 text-blue-500" viewBox="0 0 384 512">
				<path
					fill="currentColor"
					d="M48 448V64c0-8.8 7.2-16 16-16h256c8.8 0 16 7.2 16 16v384c0 8.8-7.2 16-16 16H64c-8.8 0-16-7.2-16-16zm0-448C21.5 0 0 21.5 0 48v416c0 26.5 21.5 48 48 48h288c26.5 0 48-21.5 48-48V48c0-26.5-21.5-48-48-48H48zm144 232h-40v40c0 13.3-10.7 24-24 24s-24-10.7-24-24v-40H64c-13.3 0-24-10.7-24-24s10.7-24 24-24h40v-40c0-13.3 10.7-24 24-24s24 10.7 24 24v40h40c13.3 0 24 10.7 24 24s-10.7 24-24 24z"
				/>
			</svg>
		);
	}

	if (['png', 'jpg', 'jpeg', 'gif'].includes(type)) {
		return (
			<svg className="h-6 w-6 text-green-500" viewBox="0 0 512 512">
				<g>
					<path
						style={{ fill: 'currentColor' }}
						d="M476.694,512H35.306c-8.03,0-14.54-6.509-14.54-14.54V14.54c0-8.03,6.509-14.54,14.54-14.54h441.389c8.03,0,14.54,6.509,14.54,14.54v328.698c0,8.03-6.509,14.54-14.54,14.54s-14.54-6.509-14.54-14.54V29.08H49.845V482.92h412.309v-51.955c0-8.03,6.509-14.54,14.54-14.54s14.54,6.509,14.54,14.54v66.495C491.234,505.491,484.725,512,476.694,512z"
					/>
				</g>
				<path
					style={{ fill: '#4ade80' }}
					d="M100.735,79.969v256.969h310.531V79.969H100.735z M134.881,335.968l77.135-133.602l77.135,133.602H134.881z M320.701,205.274c-20.165,0-36.512-16.347-36.512-36.514s16.347-36.514,36.512-36.514s36.512,16.347,36.512,36.514S340.868,205.274,320.701,205.274z"
				/>
			</svg>
		);
	}

	// Default file icon
	return (
		<svg className="h-6 w-6 text-gray-500" viewBox="0 0 384 512">
			<path
				fill="currentColor"
				d="M320 464c8.8 0 16-7.2 16-16V160H256c-17.7 0-32-14.3-32-32V48H64c-8.8 0-16 7.2-16 16v384c0 8.8 7.2 16 16 16h256zM0 64C0 28.7 28.7 0 64 0h160l128 128v304c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V64z"
			/>
		</svg>
	);
};

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
	isLastActivityInLesson,
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
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [uploadProgress, setUploadProgress] = useState(0);
	const [isUploading, setIsUploading] = useState(false);
	const [uploadedFileInfo, setUploadedFileInfo] =
		useState<StoredFileInfo | null>(null);
	const [filePreview, setFilePreview] = useState<FilePreview | null>(null);

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

			// Modificar la lógica para considerar los intentos y el estado revisada
			if (activity.revisada) {
				// Para actividades revisadas:
				// - Si agotó los intentos (attemptsLeft === 0), puede cerrar sin importar la nota
				// - Si tiene nota >= 3, puede cerrar
				return attemptsLeft === 0 || finalScore >= 3;
			} else {
				// Para actividades no revisadas:
				// - Siempre puede cerrar, ya que tiene intentos infinitos
				return true;
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
			<Icons.blocks className="fill-primary size-22 animate-pulse" />
			<p className="mt-6 text-center text-xl text-white">{message}</p>
		</div>
	);

	const handleFinishAndNavigate = async () => {
		try {
			setIsUnlocking(true);
			await markActivityAsCompleted();
			await onActivityCompleted();
			onQuestionsAnswered(true);

			const result = await unlockNextLesson(activity.lessonsId);

			// Add null check and proper type checking
			if (result && result.success && result.nextLessonId) {
				onLessonUnlocked(result.nextLessonId);
				toast.success('¡Siguiente clase desbloqueada!');
				onClose();
			} else {
				// Handle the case where unlocking failed but don't show error
				// This could happen if it's the last lesson
				onClose();
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

		// Add handler for file upload type
		if (currentQuestion.type === 'FILE_UPLOAD') {
			return (
				<FileUploadForm
					question={currentQuestion}
					activityId={activity.id}
					userId={userId}
					onSubmit={() => {
						handleAnswer('uploaded');
						setShowResults(true);
					}}
				/>
			);
		}

		const isQuestionAnswered = userAnswers[currentQuestion.id];

		return (
			<div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
				<h3 className="mb-4 flex items-center justify-between border-b border-gray-100 pb-4 text-lg font-semibold text-gray-800">
					<div className="flex items-center">
						<span className="bg-primary/20 text-background mr-2 flex h-8 w-8 items-center justify-center rounded-full font-bold">
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
							className="text-background w-full rounded-md border border-gray-300 p-3 shadow-sm transition-all duration-200 placeholder:text-gray-400 focus:border-blue-800 focus:ring-2 focus:ring-blue-800/20 focus:outline-none"
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
										className="text-primary focus:ring-primary h-4 w-4"
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

		// Show grade report button for last activity of last lesson regardless of score or attempts
		if (isLastActivity && isLastLesson && showResults) {
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
							onActivityComplete();
							onClose();
						}}
						className="w-full bg-[#00BDD8] text-white transition-all duration-200 hover:bg-[#00A5C0] active:scale-[0.98]"
					>
						Cerrar
					</Button>
				</div>
			);
		}

		if (savedResults?.isAlreadyCompleted || activity.isCompleted) {
			return (
				<Button
					onClick={onClose}
					className="text-background mt-3 w-full bg-blue-500 font-bold transition-all duration-200 hover:bg-blue-600 active:scale-[0.98]"
				>
					CERRAR
				</Button>
			);
		}

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
							className="text-background w-full bg-yellow-500 font-bold hover:bg-yellow-600 active:scale-[0.98]"
						>
							Intentar Nuevamente
						</Button>
					</>
				);
			}
			if (isLastActivityInLesson && !isLastLesson) {
				return (
					<Button
						onClick={handleFinishAndNavigate}
						className="w-full bg-green-500 font-semibold text-green-900 transition-all duration-200 hover:scale-[1.02] hover:bg-green-600 hover:text-green-50 active:scale-95"
					>
						<span className="flex items-center justify-center gap-2">
							Desbloquear Siguiente CLASE
							<Unlock className="h-4 w-4" />
						</span>
					</Button>
				);
			}
			return (
				<Button
					onClick={onClose}
					className="w-full bg-blue-500 font-bold text-blue-900 active:scale-[0.98]"
				>
					CERRAR
				</Button>
			);
		}

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
						className="text-background w-full bg-yellow-500 font-bold hover:bg-yellow-600"
					>
						Intentar Nuevamente
					</Button>
					<Button onClick={onClose} className="mt-2 w-full bg-gray-500">
						Cerrar
					</Button>
				</>
			);
		}

		if (finalScore >= 3 && !activity.isCompleted && !isLastLesson) {
			if (isLastActivityInLesson && !isLastLesson) {
				return (
					<Button
						onClick={handleFinishAndNavigate}
						className="w-full bg-green-500 font-semibold text-green-900 transition-all duration-200 hover:scale-[1.02] hover:bg-green-600 hover:text-green-50 active:scale-95"
					>
						<span className="flex items-center justify-center gap-2">
							Desbloquear Siguiente CLASE
							<Unlock className="h-4 w-4" />
						</span>
					</Button>
				);
			}
			return (
				<Button
					onClick={onClose}
					className="w-full bg-blue-500 font-bold text-blue-900 active:scale-[0.98]"
				>
					CERRAR
				</Button>
			);
		}

		return (
			<Button
				onClick={onClose}
				className="mt-4 w-full bg-blue-500 font-bold text-blue-900 transition-all duration-200 hover:bg-blue-600 active:scale-[0.98]"
			>
				CERRAR
			</Button>
		);
	};

	const renderResults = () => {
		if (!isResultsLoaded || isSavingResults) {
			return renderLoadingState('Cargando Resultados...');
		}

		// If it's a document upload activity
		if (activity.typeid === 1) {
			return (
				<div className="space-y-4 p-4">
					<div className="rounded-lg bg-gray-50 p-4">
						<h3 className="text-lg font-medium text-gray-900">
							Estado del Documento
						</h3>
						{uploadedFileInfo && (
							<>
								<div className="mt-4 flex items-center">
									<span
										className={`mr-2 h-3 w-3 rounded-full ${
											uploadedFileInfo.status === 'reviewed'
												? 'bg-green-500'
												: 'bg-yellow-500'
										}`}
									/>
									<span className="text-sm text-gray-600">
										{uploadedFileInfo.status === 'reviewed'
											? 'Revisado'
											: 'En revisión'}
									</span>
								</div>
								{uploadedFileInfo.grade && (
									<div className="mt-2 text-lg font-semibold text-gray-900">
										Calificación: {uploadedFileInfo.grade}
									</div>
								)}
							</>
						)}

						{/* Document preview */}
						<div className="mt-4">
							<iframe
								src={uploadedFileInfo?.fileUrl}
								className="h-[60vh] w-full rounded border border-gray-200"
								title="Document Preview"
							/>
						</div>

						{/* Action buttons */}
						<div className="mt-4 space-y-2">
							{isLastActivityInLesson && !isLastLesson ? (
								<Button
									onClick={handleFinishAndNavigate}
									className="w-full bg-green-500 text-white hover:bg-green-600"
								>
									<span className="flex items-center justify-center gap-2">
										Desbloquear Siguiente Clase
										<Unlock className="h-4 w-4" />
									</span>
								</Button>
							) : (
								<Button
									onClick={onClose}
									className="w-full bg-blue-500 text-white hover:bg-blue-600"
								>
									Cerrar
								</Button>
							)}
						</div>
					</div>
				</div>
			);
		}

		// Regular activity results rendering
		return (
			<div className="-mt-14 space-y-3 px-4">
				<div className="text-center">
					<h3 className="text-background text-xl font-bold">Resultados</h3>
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
										className={`rounded-md p-2 ${
											isCorrect
												? 'bg-green-50 text-green-800'
												: 'bg-red-50 text-red-800'
										}`}
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
			case 'FILE_UPLOAD':
				return 'Subir Archivo';
			default:
				return 'Pregunta';
		}
	};

	const handleFileUpload = (file: File) => {
		if (file.size > 10 * 1024 * 1024) {
			toast.error('El archivo no debe superar los 10MB');
			return;
		}

		setSelectedFile(file);
		setFilePreview({
			file,
			type: file.type.split('/')[1].toUpperCase(),
			size: formatFileSize(file.size),
			progress: 0,
			status: 'uploading',
		});
		setUploadProgress(0);
		setIsUploading(false);
	};

	const renderFilePreview = () => {
		if (!filePreview) return null;

		const fileExtension =
			filePreview.file.name.split('.').pop()?.toLowerCase() ?? '';

		return (
			<div className="mt-6 space-y-4">
				<div className="rounded-xl bg-slate-900/50 p-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<div className="rounded-lg bg-slate-800 p-2">
								{getFileIcon(fileExtension)}
							</div>
							<div>
								<p className="font-medium text-white">
									{filePreview.file.name}
								</p>
								<p className="text-xs text-slate-400">
									{filePreview.size} • {filePreview.type}
								</p>
							</div>
						</div>
						<div className="flex items-center gap-4">
							<span className="text-sm font-medium text-cyan-500">
								{uploadProgress}%
							</span>
							<button
								onClick={() => {
									setSelectedFile(null);
									setFilePreview(null);
								}}
								className="text-slate-400 transition-colors hover:text-white"
							>
								<svg
									className="h-5 w-5"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth="2"
										d="M6 18L18 6M6 6l12 12"
									/>
								</svg>
							</button>
						</div>
					</div>

					<div className="mt-3 h-1 overflow-hidden rounded-full bg-slate-800">
						<div
							className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-sky-500 transition-all duration-300"
							style={{ width: `${uploadProgress}%` }}
						>
							<div className="h-full w-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/25 to-transparent" />
						</div>
					</div>
				</div>
			</div>
		);
	};

	const renderSubmissionStatus = () => {
		if (!uploadedFileInfo) return null;

		return (
			<div className="mt-6 space-y-4">
				<div className="rounded-xl bg-slate-900/50 p-4">
					{/* File info and status */}
					<div className="flex items-center justify-between">
						<div>
							<h4 className="text-lg font-medium text-white">
								Estado del Documento
							</h4>
							<p className="text-sm text-slate-400">
								{uploadedFileInfo.fileName}
							</p>
							<p className="mt-1 text-xs text-slate-500">
								Subido el:{' '}
								{new Date(uploadedFileInfo.uploadDate).toLocaleDateString()}
							</p>
						</div>
						<div className="flex flex-col items-end">
							<span
								className={`text-sm ${uploadedFileInfo.status === 'reviewed' ? 'text-green-400' : 'text-yellow-400'}`}
							>
								{uploadedFileInfo.status === 'reviewed'
									? 'Revisado'
									: 'En Revisión'}
							</span>
							{uploadedFileInfo.grade && (
								<span className="mt-1 text-lg font-bold text-white">
									Nota: {uploadedFileInfo.grade}
								</span>
							)}
						</div>
					</div>

					{/* Action buttons */}
					<div className="mt-4 space-y-2">
						{isLastActivityInLesson && !isLastLesson ? (
							<Button
								onClick={handleFinishAndNavigate}
								className="w-full bg-green-500 text-white hover:bg-green-600"
							>
								<span className="flex items-center justify-center gap-2">
									Desbloquear Siguiente Clase
									<Unlock className="h-4 w-4" />
								</span>
							</Button>
						) : (
							<Button
								onClick={onClose}
								className="w-full bg-blue-500 text-white hover:bg-blue-600"
							>
								Cerrar
							</Button>
						)}
					</div>
				</div>
			</div>
		);
	};

	const renderContent = () => {
		const isFileUploadActivity = activity.typeid === 1;

		if (isFileUploadActivity) {
			return (
				<div className="max-h-[80vh] overflow-y-auto pr-4"> {/* Add these classes */}
					<div className="group relative w-full">
						<div className="relative overflow-hidden rounded-2xl bg-slate-950 shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-cyan-500/10">
							<div className="absolute -top-16 -left-16 h-32 w-32 rounded-full bg-gradient-to-br from-cyan-500/20 to-sky-500/0 blur-2xl transition-all duration-500 group-hover:scale-150 group-hover:opacity-70" />
							<div className="absolute -right-16 -bottom-16 h-32 w-32 rounded-full bg-gradient-to-br from-sky-500/20 to-cyan-500/0 blur-2xl transition-all duration-500 group-hover:scale-150 group-hover:opacity-70" />

							<div className="relative p-6">
								<div className="flex items-center justify-between">
									<div>
										<h3 className="text-lg font-semibold text-white">
											{activity.name}
										</h3>
										<p className="text-sm text-slate-400">
											{activity.description}
										</p>
									</div>
									<div className="rounded-lg bg-cyan-500/10 p-2">
										<svg
											className="h-6 w-6 text-cyan-500"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth="2"
												d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
											/>
										</svg>
									</div>
								</div>

								<div className="group/dropzone mt-6">
									<div className="relative rounded-xl border-2 border-dashed border-slate-700 bg-slate-900/50 p-8 transition-colors group-hover/dropzone:border-cyan-500/50">
										<input
											type="file"
											className="absolute inset-0 z-50 h-full w-full cursor-pointer opacity-0"
											onChange={(e) => {
												if (e.target.files?.[0]) {
													// Handle file upload
													handleFileUpload(e.target.files[0]);
												}
											}}
										/>
										<div className="space-y-6 text-center">
											<div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-900">
												<svg
													className="h-10 w-10 text-cyan-500"
													fill="none"
													viewBox="0 0 24 24"
													stroke="currentColor"
												>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth="2"
														d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
													/>
												</svg>
											</div>

											<div className="space-y-2">
												<p className="text-base font-medium text-white">
													Arrastra tus archivos aquí o haz clic para buscar
												</p>
												<p className="text-sm text-slate-400">
													Formatos soportados: PDF, DOC, DOCX
												</p>
												<p className="text-xs text-slate-400">
													Tamaño máximo: 10MB
												</p>
											</div>
										</div>
									</div>
								</div>

								{/* Add file progress indicator here */}
								{renderFilePreview()}

								<button
									onClick={() =>
										handleUpload({
											selectedFile,
											activity,
											userId,
											setIsUploading,
											setUploadProgress,
											setUploadedFileInfo,
											setShowResults,
											setFilePreview, // Add this new parameter
										})
									}
									disabled={!selectedFile || isUploading}
									className="group/btn relative mt-6 w-full overflow-hidden rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 p-px font-medium text-white shadow-[0_1000px_0_0_hsl(0_0%_100%_/_0%)_inset] transition-colors hover:shadow-[0_1000px_0_0_hsl(0_0%_100%_/_2%)_inset] disabled:cursor-not-allowed disabled:opacity-50"
								>
									<span className="relative flex items-center justify-center gap-2 rounded-xl bg-slate-950/50 px-4 py-2 transition-colors group-hover/btn:bg-transparent">
										{isUploading ? (
											<>
												<Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
												Subiendo...
											</>
										) : (
											'Subir Documento'
										)}
									</span>
								</button>
								{uploadedFileInfo ? renderSubmissionStatus() : null}
							</div>
						</div>
					</div>
				</div>
			);
		}

		// Regular activity content for questions
		return (
			// ...existing question rendering code...
			<div className="space-y-6">
				{showResults ? (
					renderResults()
				) : (
					<>
						<div className="mb-8 flex flex-col items-center justify-center text-center">
							<span className="text-primary text-2xl font-bold">
								{getQuestionTypeLabel(currentQuestion?.type ?? '')}
							</span>
							<span className="mt-2 text-sm text-gray-500">
								{currentQuestionIndex + 1} de {questions.length}
							</span>
						</div>
						{renderQuestion()}
						{/* Navigation buttons */}
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
					</>
				)}
			</div>
		);
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
						if (activity.revisada) {
							// Mensaje específico para actividades revisadas
							const intentosRestantes = attemptsLeft ?? 0;
							if (intentosRestantes > 0) {
								toast.error(
									`Te quedan ${intentosRestantes} intento${intentosRestantes !== 1 ? 's' : ''} para aprobar la actividad. Debes obtener una nota de 3 o superior para aprobar.`
								);
							}
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
			<DialogContent className="max-h-[90vh] overflow-hidden [&>button]:bg-background [&>button]:text-background [&>button]:hover:text-background sm:max-w-[500px]"> {/* Add max-h-[90vh] and overflow-hidden */}
				<DialogHeader className="relative pb-6">
					<DialogTitle className="text-center text-3xl font-bold">
						{activity.content?.questionsFilesSubida?.[0] != null
							? 'SUBIDA DE DOCUMENTO'
							: 'ACTIVIDAD'}
					</DialogTitle>
				</DialogHeader>
				{isUnlocking
					? renderLoadingState('Desbloqueando Siguiente Clase...')
					: isSavingResults
						? renderLoadingState('Cargando Resultados...')
						: renderContent()}
			</DialogContent>
		</Dialog>
	);
};

interface UploadParams {
	selectedFile: File | null;
	activity: Activity;
	userId: string;
	setIsUploading: (value: boolean) => void;
	setUploadProgress: (value: number) => void;
	setUploadedFileInfo: (info: StoredFileInfo | null) => void;
	setShowResults: (value: boolean) => void;
	setFilePreview: (preview: FilePreview | null) => void;
}

// Add custom error type
class UploadError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'UploadError';
	}
}

// Update handleUpload function with proper error handling
async function handleUpload({
	selectedFile,
	activity,
	userId,
	setIsUploading,
	setUploadProgress,
	setUploadedFileInfo,
	setShowResults,
	setFilePreview,
}: UploadParams): Promise<void> {
	if (!selectedFile) return;

	const updateFilePreview = (
		progress: number,
		status: FilePreview['status'] = 'uploading'
	): void => {
		setFilePreview({
			file: selectedFile,
			type: selectedFile.type.split('/')[1].toUpperCase(),
			size: formatFileSize(selectedFile.size),
			progress,
			status,
		});
	};

	try {
		setIsUploading(true);
		setUploadProgress(0);
		updateFilePreview(0);

		// Get presigned URL
		const presignedResponse = await fetch('/api/activities/documentupload', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				filename: selectedFile.name,
				contentType: selectedFile.type,
				activityId: activity.id,
				userId,
			}),
		});

		if (!presignedResponse.ok) {
			throw new UploadError('Failed to get upload URL');
		}

		const presignedData = (await presignedResponse.json()) as PresignedResponse;
		const { url, fields, key, fileUrl } = presignedData;

		updateFilePreview(20);

		// Upload to S3
		const formData = new FormData();
		Object.entries(fields).forEach(([fieldKey, value]) => {
			formData.append(fieldKey, String(value));
		});
		formData.append('file', selectedFile);

		const uploadResponse = await fetch(url, {
			method: 'POST',
			body: formData,
		});

		if (!uploadResponse.ok) {
			throw new UploadError('Upload to storage failed');
		}

		updateFilePreview(60);

		// Save in database
		const dbResponse = await fetch('/api/activities/saveFileSubmission', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				activityId: activity.id,
				userId,
				fileInfo: {
					fileName: selectedFile.name,
					fileUrl,
					documentKey: key,
					uploadDate: new Date().toISOString(),
					status: 'pending',
				},
			}),
		});

		if (!dbResponse.ok) {
			throw new UploadError('Failed to save submission');
		}

		const result = (await dbResponse.json()) as DocumentUploadResponse;

		updateFilePreview(100, 'complete');
		setUploadProgress(100);
		setUploadedFileInfo({
			fileName: selectedFile.name,
			fileUrl: result.fileUrl,
			uploadDate: new Date().toISOString(),
			status: result.status,
		});

		toast.success('Documento subido correctamente');
		setShowResults(true);
	} catch (error) {
		const errorMessage =
			error instanceof Error
				? error.message
				: 'Error desconocido al subir el archivo';
		updateFilePreview(0, 'error');
		console.error('Upload error:', errorMessage);
		toast.error(`Error al subir el archivo: ${errorMessage}`);
	} finally {
		setIsUploading(false);
	}
}

export default LessonActivityModal;
