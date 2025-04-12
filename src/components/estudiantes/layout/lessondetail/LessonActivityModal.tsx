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
import { Unlock } from 'lucide-react';
import { BiSolidReport } from 'react-icons/bi';
import { FaTrophy, FaLink } from 'react-icons/fa';
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

// Add this interface near the other interfaces
interface FileSubmissionResponse {
	submission: StoredFileInfo | null;
	progress: {
		isCompleted: boolean;
	} | null;
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
			<svg className="h-6 w-6 text-red-500" viewBox="0 0 303.188 303.188">
				<path fill="#e8e8e8" d="M219.821 0H32.842v303.188h237.504V50.525z" />
				<path
					d="M230.013 149.935c-3.643-6.493-16.231-8.533-22.006-9.451-4.552-.724-9.199-.94-13.803-.936-3.615-.024-7.177.154-10.693.354-1.296.087-2.579.199-3.861.31a93.594 93.594 0 01-3.813-4.202c-7.82-9.257-14.134-19.755-19.279-30.664 1.366-5.271 2.459-10.772 3.119-16.485 1.205-10.427 1.619-22.31-2.288-32.251-1.349-3.431-4.946-7.608-9.096-5.528-4.771 2.392-6.113 9.169-6.502 13.973-.313 3.883-.094 7.776.558 11.594.664 3.844 1.733 7.494 2.897 11.139a165.324 165.324 0 003.588 9.943 171.593 171.593 0 01-2.63 7.603c-2.152 5.643-4.479 11.004-6.717 16.161l-3.465 7.507c-3.576 7.855-7.458 15.566-11.815 23.02-10.163 3.585-19.283 7.741-26.857 12.625-4.063 2.625-7.652 5.476-10.641 8.603-2.822 2.952-5.69 6.783-5.941 11.024-.141 2.394.807 4.717 2.768 6.137 2.697 2.015 6.271 1.881 9.4 1.225 10.25-2.15 18.121-10.961 24.824-18.387 4.617-5.115 9.872-11.61 15.369-19.465l.037-.054c9.428-2.923 19.689-5.391 30.579-7.205 4.975-.825 10.082-1.5 15.291-1.974 3.663 3.431 7.621 6.555 11.939 9.164 3.363 2.069 6.94 3.816 10.684 5.119 3.786 1.237 7.595 2.247 11.528 2.886 1.986.284 4.017.413 6.092.335 4.631-.175 11.278-1.951 11.714-7.57.134-1.72-.237-3.228-.98-4.55zm-110.869 10.31a170.827 170.827 0 01-6.232 9.041c-4.827 6.568-10.34 14.369-18.322 17.286-1.516.554-3.512 1.126-5.616 1.002-1.874-.11-3.722-.937-3.637-3.065.042-1.114.587-2.535 1.423-3.931.915-1.531 2.048-2.935 3.275-4.226 2.629-2.762 5.953-5.439 9.777-7.918 5.865-3.805 12.867-7.23 20.672-10.286-.449.71-.897 1.416-1.34 2.097zm27.222-84.26a38.169 38.169 0 01-.323-10.503 24.858 24.858 0 011.038-4.952c.428-1.33 1.352-4.576 2.826-4.993 2.43-.688 3.177 4.529 3.452 6.005 1.566 8.396.186 17.733-1.693 25.969-.299 1.31-.632 2.599-.973 3.883a121.219 121.219 0 01-1.648-4.821c-1.1-3.525-2.106-7.091-2.679-10.588zm16.683 66.28a236.508 236.508 0 00-25.979 5.708c.983-.275 5.475-8.788 6.477-10.555 4.721-8.315 8.583-17.042 11.358-26.197 4.9 9.691 10.847 18.962 18.153 27.214.673.749 1.357 1.489 2.053 2.22-4.094.441-8.123.978-12.062 1.61zm61.744 11.694c-.334 1.805-4.189 2.837-5.988 3.121-5.316.836-10.94.167-16.028-1.542-3.491-1.172-6.858-2.768-10.057-4.688-3.18-1.921-6.155-4.181-8.936-6.673 3.429-.206 6.9-.341 10.388-.275 3.488.035 7.003.211 10.475.664 6.511.726 13.807 2.961 18.932 7.186 1.009.833 1.331 1.569 1.214 2.207zM227.64 25.263H32.842V0h186.979z"
					fill="#fb3449"
				/>
				<g fill="#a4a9ad">
					<path d="M126.841 241.152c0 5.361-1.58 9.501-4.742 12.421-3.162 2.921-7.652 4.381-13.472 4.381h-3.643v15.917H92.022v-47.979h16.606c6.06 0 10.611 1.324 13.652 3.971 3.041 2.647 4.561 6.41 4.561 11.289zm-21.856 6.235h2.363c1.947 0 3.495-.546 4.644-1.641 1.149-1.094 1.723-2.604 1.723-4.529 0-3.238-1.794-4.857-5.382-4.857h-3.348v11.027zM175.215 248.864c0 8.007-2.205 14.177-6.613 18.509s-10.606 6.498-18.591 6.498h-15.523v-47.979h16.606c7.701 0 13.646 1.969 17.836 5.907 4.189 3.938 6.285 9.627 6.285 17.065zm-13.455.46c0-4.398-.87-7.657-2.609-9.78-1.739-2.122-4.381-3.183-7.926-3.183h-3.773v26.877h2.888c3.939 0 6.826-1.143 8.664-3.43 1.837-2.285 2.756-5.78 2.756-10.484zM196.579 273.871h-12.766v-47.979h28.355v10.403h-15.589v9.156h14.374v10.403h-14.374v18.017z" />
				</g>
				<path fill="#d1d3d3" d="M219.821 50.525h50.525L219.821 0z" />
			</svg>
		);
	}

	if (type === 'doc' || type === 'docx') {
		return (
			<svg
				className="h-6 w-6 text-blue-500"
				viewBox="0 0 321.492 321.492"
				fill="currentColor"
			>
				<path d="M296.635 165.204h-26.861V9a9 9 0 00-9-9H84.409a8.998 8.998 0 00-6.78 3.082L18.077 71.315a8.996 8.996 0 00-2.22 5.918v235.259a9 9 0 009 9h235.917a9 9 0 009-9v-25.778h26.861a9 9 0 009-9v-103.51a9 9 0 00-9-9zm-9 103.51H94.497v-85.51h193.139v85.51zM75.409 32.999v35.234H44.657l30.752-35.234zm176.365 270.493H33.857V86.233h50.552a9 9 0 009-9V18h158.365v147.204H85.497a9 9 0 00-9 9v103.51a9 9 0 009 9h166.277v16.778z" />
				<path d="M146.802 200.112H123.75v52.216h22.616c17.235 0 21.672-16.145 21.672-27.344 0-9.89-3.636-24.872-21.236-24.872zm-1.745 43.199H134.44v-34.18h10.472c4.654 0 11.999 1.236 11.999 16.653 0 8.581-2.982 17.527-11.854 17.527zM199.021 198.731c-6.908 0-25.089 2.981-25.089 27.489s18.181 27.489 25.089 27.489c6.909 0 25.09-2.981 25.09-27.489s-18.181-27.489-25.09-27.489zm0 45.743c-5.891 0-14.181-3.636-14.181-18.253s8.29-18.254 14.181-18.254 14.182 3.637 14.182 18.254-8.291 18.253-14.182 18.253zM254.514 198.731c-13.453 0-23.998 9.309-23.998 27.562 0 18.035 9.963 27.417 23.853 27.417 13.091 0 20.509-7.927 22.69-19.271H266.15c-1.309 6.399-5.526 9.817-11.563 9.817-9.236 0-12.945-8.436-12.945-17.817 0-14.763 7.709-18.254 12.945-18.254 9.018 0 10.69 5.891 11.563 9.019h10.909c-.582-7.71-6.909-18.473-22.545-18.473zM147.307 81.414l5.689-26.596h.137l5.689 26.596h9.872l10.486-36.467h-9.871l-5.688 26.184h-.138L158 44.947h-9.665l-5.141 26.184h-.137l-5.689-26.184h-10.214l10.282 36.467zM194.938 77.458h15.379c4.971 0 9-4.029 9-9s-4.029-9-9-9h-15.379c-4.971 0-9 4.029-9 9s4.029 9 9 9zM211.529 93.354h-74.346c-4.971 0-9 4.029-9 9s4.029 9 9 9h74.346c4.971 0 9-4.029 9-9s-4.029-9-9-9zM211.529 127.294h-74.346c-4.971 0-9 4.029-9 9s4.029 9 9 9h74.346c4.971 0 9-4.029 9-9s-4.029-9-9-9z" />
			</svg>
		);
	}

	if (type === 'ppt' || type === 'pptx') {
		return (
			<svg className="h-6 w-6 text-orange-500" viewBox="0 0 303.188 303.188">
				<g>
					<polygon
						style={{ fill: '#E8E8E8' }}
						points="219.821,0 32.842,0 32.842,303.188 270.346,303.188 270.346,50.525"
					/>
					<g>
						<rect
							x="90.902"
							y="61.704"
							style={{ fill: '#FF671B' }}
							width="119.89"
							height="119.89"
						/>
						<rect
							x="101.303"
							y="72.105"
							style={{ fill: '#FFFFFF' }}
							width="99.089"
							height="99.087"
						/>
						<g>
							<rect
								x="115.616"
								y="92.182"
								style={{ fill: '#FF671B' }}
								width="70.463"
								height="58.933"
							/>
							<rect
								x="120.918"
								y="98.303"
								style={{ fill: '#FFFFFF' }}
								width="59.861"
								height="7.613"
							/>
							<path
								style={{ fill: '#FFFFFF' }}
								d="M135.872,112.472c-8.259,0-14.955,6.696-14.955,14.954c0,8.259,6.695,14.955,14.955,14.955c8.258,0,14.954-6.696,14.954-14.955h-14.954V112.472z"
							/>
							<rect
								x="157.902"
								y="113.564"
								style={{ fill: '#FFFFFF' }}
								width="22.876"
								height="4.434"
							/>
							<rect
								x="157.902"
								y="122.993"
								style={{ fill: '#FFFFFF' }}
								width="22.876"
								height="4.433"
							/>
							<rect
								x="157.902"
								y="132.422"
								style={{ fill: '#FFFFFF' }}
								width="22.876"
								height="4.432"
							/>
						</g>
					</g>
					<polygon
						style={{ fill: '#FF671B' }}
						points="227.64,25.263 32.842,25.263 32.842,0 219.821,0"
					/>
					{/* Added text paths for PPT letters */}
					<g transform="translate(90, 240)">
						<path
							style={{ fill: '#A4A9AD' }}
							d="M38.532,1.152c0,5.361-1.581,9.501-4.742,12.421c-3.162,2.921-7.652,4.381-13.472,4.381h-3.643v15.917H3.712v-47.979h16.606c6.06,0,10.611,1.324,13.652,3.971C37.011,-7.49,38.532,-3.727,38.532,1.152z M16.675,7.387h2.363c1.947,0,3.495-0.546,4.644-1.641c1.148-1.094,1.723-2.604,1.723-4.529c0-3.238-1.794-4.857-5.382-4.857h-3.348V7.387z"
						/>
						<path
							style={{ fill: '#A4A9AD' }}
							d="M80.998,1.152c0,5.361-1.581,9.501-4.742,12.421c-3.162,2.921-7.652,4.381-13.472,4.381h-3.643v15.917H46.178v-47.979h16.606c6.06,0,10.61,1.324,13.652,3.971C79.477,-7.49,80.998,-3.727,80.998,1.152z M59.142,7.387h2.362c1.947,0,3.495-0.546,4.644-1.641c1.149-1.094,1.724-2.604,1.724-4.529c0-3.238-1.795-4.857-5.383-4.857h-3.347V7.387z"
						/>
						<path
							style={{ fill: '#A4A9AD' }}
							d="M109.812,33.871H96.849v-37.379H85.133v-10.6h36.361v10.6h-11.683V33.871z"
						/>
					</g>
					<polygon
						style={{ fill: '#D1D3D3' }}
						points="219.821,50.525 270.346,50.525 219.821,0"
					/>
				</g>
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

	// Default file icon - changed to use FaLink
	return <FaLink className="h-6 w-6 text-blue-500" />;
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
	const [isLoadingDocument, setIsLoadingDocument] = useState(false);

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

	useEffect(() => {
		const loadDocumentInfo = async () => {
			if (activity.typeid === 1) {
				try {
					setIsLoadingDocument(true);
					const response = await fetch(
						`/api/activities/getFileSubmission?activityId=${activity.id}&userId=${userId}`
					);

					if (response.ok) {
						const data = (await response.json()) as FileSubmissionResponse;
						if (data.submission) {
							setUploadedFileInfo(data.submission);
							setShowResults(true);

							if (data.progress?.isCompleted) {
								setFilePreview(null);
								setSelectedFile(null);
							}
						}
					}
				} catch (error) {
					console.error('Error loading document info:', error);
					toast.error('Error al cargar la información del documento');
				} finally {
					setIsLoadingDocument(false);
				}
			}
		};

		void loadDocumentInfo();
	}, [activity.id, activity.typeid, userId]);

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
						{/* Add loading state here */}
						{isLoadingDocument ? (
							<div className="flex flex-col items-center justify-center space-y-3 p-8">
								<Icons.spinner className="h-8 w-8 animate-spin text-blue-500" />
								<p className="text-base text-gray-600">Cargando documento...</p>
							</div>
						) : (
							uploadedFileInfo && (
								<>{/* ... rest of existing uploadedFileInfo content ... */}</>
							)
						)}
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

		// Add function to truncate filename
		const truncateFileName = (fileName: string, maxLength = 50) => {
			if (fileName.length <= maxLength) return fileName;
			const extension = fileName.split('.').pop();
			const nameWithoutExt = fileName.split('.').slice(0, -1).join('.');
			const truncatedName = nameWithoutExt.slice(0, maxLength - 3) + '...';
			return `${truncatedName}.${extension}`;
		};

		return (
			<div className="mt-6 space-y-4">
				<div className="rounded-xl bg-slate-900/50 p-4">
					<div className="flex items-center justify-between">
						<div className="flex min-w-0 flex-1 items-center gap-3">
							<div className="flex-shrink-0 rounded-lg bg-slate-800 p-2">
								{getFileIcon(fileExtension)}
							</div>
							<div className="min-w-0 flex-1">
								<p className="truncate font-medium text-white">
									{truncateFileName(filePreview.file.name)}
								</p>
								<p className="text-xs text-slate-400">
									{filePreview.size}{' '}
									{/* Removed the bullet point and file type */}
								</p>
							</div>
						</div>
						<div className="flex flex-shrink-0 items-center gap-4 pl-3">
							<span className="w-12 text-right text-sm font-medium text-cyan-500">
								{uploadProgress}%
							</span>
							<button
								onClick={() => {
									setSelectedFile(null);
									setFilePreview(null);
								}}
								className="p-1 text-slate-400 transition-colors hover:text-white"
								aria-label="Remove file"
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
		if (isLoadingDocument) {
			return (
				<div className="mt-4 flex flex-col items-center justify-center space-y-2 p-4">
					<Icons.spinner className="h-8 w-8 animate-spin text-blue-500" />
					<p className="text-sm text-gray-400">Cargando documento subido...</p>
				</div>
			);
		}

		if (!uploadedFileInfo) return null;

		const isFirstSubmission = !activity.isCompleted;
		const shouldShowUnlockButton =
			isFirstSubmission && isLastActivityInLesson && !isLastLesson;

		return (
			<div className="mt-4">
				<div className="rounded-xl bg-slate-900/50">
					<div className="flex flex-col">
						<div className="p-6">
							{/* Document info and status */}
							<div className="mb-6 flex items-center justify-between">
								<div className="flex flex-col">
									<h3 className="text-lg font-semibold text-white">Subido</h3>
								</div>
								<span
									className={`rounded-full px-4 py-2 text-sm font-medium ${
										uploadedFileInfo.status === 'reviewed'
											? 'bg-green-100 text-green-800'
											: 'bg-yellow-100 text-yellow-800'
									}`}
								>
									{uploadedFileInfo.status === 'reviewed'
										? 'Revisado'
										: 'En Revisión'}
								</span>
							</div>

							{/* Document info with consistent spacing */}
							<div className="overflow-hidden rounded-lg">
								<div className="space-y-4">
									{/* File section */}
									<div className="space-y-2">
										<div className="flex items-center justify-between px-4">
											<span className="text-sm font-semibold text-gray-200">
												Archivo
											</span>
											<Image
												src={
													uploadedFileInfo.status === 'reviewed'
														? '/contract-filed-line-svgrepo-com.png'
														: '/contract-pending-line-svgrepo-com.png'
												}
												alt={
													uploadedFileInfo.status === 'reviewed'
														? 'Revisado'
														: 'En revisión'
												}
												width={40}
												height={40}
												className={
													uploadedFileInfo.status === 'reviewed'
														? 'text-green-500'
														: 'text-yellow-500'
												}
											/>
										</div>
										<div className="px-4">
											<span className="text-sm text-gray-300">
												{uploadedFileInfo.fileName}
											</span>
										</div>
									</div>

									{/* Upload date row */}
									<div className="flex items-center justify-between px-4 py-2">
										<span className="text-sm font-medium text-white">
											Fecha De Subida:
										</span>
										<span className="text-sm text-gray-400">
											{new Date(
												uploadedFileInfo.uploadDate
											).toLocaleDateString()}
										</span>
									</div>
								</div>
							</div>

							{/* Grade section */}
							<div className="mt-6 border-t border-gray-700 pt-4">
								<div className="flex items-center justify-between px-4">
									<span className="text-sm text-gray-300">
										Calificación del Educador:
									</span>
									<span className="text-lg font-bold text-white">
										{uploadedFileInfo?.grade
											? formatScore(uploadedFileInfo.grade)
											: '0.0'}
									</span>
								</div>
							</div>
						</div>

						{/* Action buttons */}
						<div className="border-t border-gray-700 bg-slate-900/95 p-6">
							{shouldShowUnlockButton ? (
								<Button
									onClick={async () => {
										await handleFinishAndNavigate();
										await markActivityAsCompleted();
									}}
									className="w-full bg-green-500 text-white hover:bg-green-600"
								>
									<span className="flex items-center justify-center gap-2">
										Desbloquear Siguiente Clase
										<Unlock className="h-4 w-4" />
									</span>
								</Button>
							) : (
								<Button
									onClick={async () => {
										if (!isLastActivityInLesson && !activity.isCompleted) {
											await markActivityAsCompleted();
											await onActivityCompleted();
										}
										onClose();
									}}
									className="w-full bg-blue-500 text-white hover:bg-blue-600"
								>
									Cerrar
								</Button>
							)}
							<Button
								onClick={() => {
									// Mostrar confirmación antes de reiniciar
									if (uploadedFileInfo?.status === 'reviewed') {
										const confirmed = window.confirm(
											'Al subir un nuevo documento, se reiniciará la calificación a 0.0 y el estado a pendiente. ¿Deseas continuar?'
										);
										if (!confirmed) return;
									}

									setUploadedFileInfo(null);
									setSelectedFile(null);
									setFilePreview(null);
									setUploadProgress(0);
									setShowResults(false);
								}}
								className="mt-2 w-full bg-yellow-500 text-white hover:bg-yellow-600"
							>
								<span className="flex items-center justify-center gap-2">
									Subir Documento Nuevamente
									<svg
										className="h-4 w-4"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth="2"
											d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
										/>
									</svg>
								</span>
							</Button>
						</div>
					</div>
				</div>
			</div>
		);
	};

	const renderContent = () => {
		const isFileUploadActivity = activity.typeid === 1;

		if (isFileUploadActivity) {
			return (
				<div className="max-h-[calc(90vh-10rem)] overflow-y-auto px-4">
					<div className="group relative w-full">
						<div className="relative overflow-hidden rounded-2xl bg-slate-950 shadow-2xl">
							{/* Fondo y contenido del encabezado */}
							<div className="absolute -top-16 -left-16 h-32 w-32 rounded-full bg-gradient-to-br from-cyan-500/20 to-sky-500/0 blur-2xl transition-all duration-500 group-hover:scale-150 group-hover:opacity-70" />
							<div className="absolute -right-16 -bottom-16 h-32 w-32 rounded-full bg-gradient-to-br from-sky-500/20 to-cyan-500/0 blur-2xl transition-all duration-500 group-hover:scale-150 group-hover:opacity-70" />

							<div className="relative p-6">
								{/* Título y descripción */}
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

								{/* Zona de subida de archivos - Desactivada si ya hay un archivo subido */}
								<div
									className={`mt-6 ${
										uploadedFileInfo ? 'pointer-events-none opacity-50' : ''
									}`}
								>
									<div className="group/dropzone">
										<div
											className={`relative rounded-xl border-2 border-dashed border-slate-700 bg-slate-900/50 p-8 transition-colors ${
												uploadedFileInfo
													? 'cursor-not-allowed'
													: 'group-hover/dropzone:border-cyan-500/50'
											}`}
										>
											<input
												type="file"
												className="absolute inset-0 z-50 h-full w-full cursor-pointer opacity-0"
												onChange={(e) => {
													if (e.target.files?.[0]) {
														handleFileUpload(e.target.files[0]);
													}
												}}
												disabled={!!uploadedFileInfo}
											/>
											<div className="space-y-6 text-center">
												<div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-900">
													<svg
														className={`h-10 w-10 ${
															uploadedFileInfo
																? 'text-gray-500'
																: 'text-cyan-500'
														}`}
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
														{uploadedFileInfo
															? 'Ya has subido un documento para esta actividad'
															: 'Arrastra tus archivos aquí o haz clic para buscar'}
													</p>
													<p className="text-sm text-slate-400">
														Formatos soportados: PDF, DOC, PNG, PPT
													</p>
													<p className="text-xs text-slate-400">
														Tamaño máximo: 10MB
													</p>
												</div>
											</div>
										</div>
									</div>
								</div>

								{/* Vista previa del archivo y botón de subida */}
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
											setFilePreview,
										})
									}
									disabled={!selectedFile || isUploading || !!uploadedFileInfo}
									className="group/btn relative mt-6 w-full overflow-hidden rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 p-px font-medium text-white shadow-[0_1000px_0_0_hsl(0_0%_100%_/_0%)_inset] transition-colors hover:shadow-[0_1000px_0_0_hsl(0_0%_100%_/_2%)_inset] disabled:cursor-not-allowed disabled:opacity-50"
								>
									<span className="relative flex items-center justify-center gap-2 rounded-xl bg-slate-950/50 px-4 py-2 transition-colors group-hover/btn:bg-transparent">
										{isUploading ? (
											<>
												<Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
												Subiendo...
											</>
										) : uploadedFileInfo ? (
											'Documento ya subido'
										) : (
											'Subir Documento'
										)}
									</span>
								</button>

								{/* Add loading indicator below upload button */}
								{isLoadingDocument && (
									<div className="mt-4 flex items-center justify-center space-x-2 text-center">
										<Icons.spinner className="h-5 w-5 animate-spin text-cyan-500" />
										<span className="text-sm text-gray-400">
											Cargando documento...
										</span>
									</div>
								)}

								{/* Mostrar el estado del documento subido */}
								{uploadedFileInfo && renderSubmissionStatus()}
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
								className={`btn-arrow ${
									isLastQuestion ? 'btn-arrow-success' : ''
								}`}
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
									`Te quedan ${intentosRestantes} intento${
										intentosRestantes !== 1 ? 's' : ''
									} para aprobar la actividad. Debes obtener una nota de 3 o superior para aprobar.`
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
			<DialogContent className="[&>button]:bg-background [&>button]:text-background [&>button]:hover:text-background flex max-h-[90vh] flex-col overflow-hidden sm:max-w-[500px]">
				<DialogHeader className="bg-background sticky top-0 z-50 pb-4">
					<DialogTitle className="text-center text-3xl font-bold">
						{activity.content?.questionsFilesSubida?.[0] != null
							? 'SUBIDA DE DOCUMENTO'
							: 'ACTIVIDAD'}
					</DialogTitle>
				</DialogHeader>
				<div className="flex-1 overflow-y-auto">
					{isUnlocking
						? renderLoadingState('Desbloqueando Siguiente Clase...')
						: isSavingResults
							? renderLoadingState('Cargando Resultados...')
							: renderContent()}
				</div>
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
