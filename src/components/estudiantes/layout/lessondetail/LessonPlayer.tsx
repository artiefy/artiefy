import { useEffect, useState, useCallback } from 'react';

import axios, { isAxiosError, type AxiosError } from 'axios';

import VideoPlayer from '~/components/estudiantes/layout/lessondetail/LessonVideo';
import { Progress } from '~/components/estudiantes/ui/progress';
import { type LessonWithProgress } from '~/types';

// Constants
const VIDEO_TO_TEXT_API = '/api/iatranscripcion'; // Cambia la URL para usar el nuevo endpoint
const DEFAULT_TIMEOUT = 300000;

interface LessonPlayerProps {
	lesson: LessonWithProgress;
	progress: number;
	handleVideoEnd: () => void;
	handleProgressUpdate: (videoProgress: number) => void;
}

interface TranscriptionResponse {
	transcription: string;
	error?: string;
}

interface ApiErrorResponse {
	message: string;
	error?: string;
	status?: number;
}

const LessonPlayer = ({
	lesson,
	progress,
	handleVideoEnd,
	handleProgressUpdate,
}: LessonPlayerProps) => {
	const isLocked = lesson.isLocked === true;
	const [transcription, setTranscription] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetchTranscription = useCallback(async () => {
		setIsLoading(true);
		setError(null);

		try {
			const videoUrl =
				'https://s3.us-east-2.amazonaws.com/artiefy-upload/uploads/ee9fb9aa-a3ad-4e4e-b952-eab0c5da84ed';

			console.info('Fetching transcription for:', {
				url: videoUrl,
			});

			const response = await axios.post<TranscriptionResponse>(
				VIDEO_TO_TEXT_API,
				{ url: videoUrl },
				{
					headers: {
						'Content-Type': 'application/json',
						Accept: 'application/json',
					},
					timeout: DEFAULT_TIMEOUT,
				}
			);

			console.log('Response:', response);

			const { transcription: responseTranscription, error: responseError } =
				response.data;

			if (responseError) {
				throw new Error(responseError);
			}

			if (!responseTranscription || typeof responseTranscription !== 'string') {
				throw new Error('Invalid transcription format received');
			}

			console.info('Transcription received successfully');
			setTranscription(responseTranscription);
		} catch (err) {
			let errorMessage = 'Error al obtener la transcripción';

			if (isAxiosError(err)) {
				const axiosError = err as AxiosError<ApiErrorResponse>;

				if (axiosError.code === 'ECONNABORTED') {
					errorMessage =
						'La solicitud tardó demasiado tiempo. Por favor, intenta de nuevo.';
				} else if (axiosError.response) {
					const status = axiosError.response.status;
					const responseError = axiosError.response.data?.error;

					errorMessage = `Error del servidor${status ? ` (${status})` : ''}: ${
						responseError ?? axiosError.message
					}`;

					console.error('Server error:', {
						status,
						data: axiosError.response.data,
						message: axiosError.message,
					});
				} else if (axiosError.request) {
					errorMessage =
						'No se pudo conectar con el servidor de transcripción. Por favor, verifica tu conexión a internet.';
					console.error('Network error:', axiosError.message);
					console.error('Request details:', axiosError.request);
				}
			} else if (err instanceof Error) {
				errorMessage = `Error: ${err.message}`;
				console.error('General error:', err);
			}

			setError(errorMessage);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		console.log('LessonPlayer mounted');
		void fetchTranscription();
		return () => {
			console.log('LessonPlayer unmounted');
		};
	}, [fetchTranscription]);

	if (isLocked) {
		return (
			<div className="flex h-[400px] items-center justify-center rounded-lg bg-gray-100">
				<div className="text-center">
					<div className="mb-4 text-6xl">🔒</div>
					<h3 className="mb-2 text-xl font-semibold text-gray-800">
						Clase Bloqueada
					</h3>
					<p className="text-gray-600">
						Completa las clases anteriores para desbloquear esta lección
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-4xl">
			<div className="relative mb-6 aspect-video overflow-hidden rounded-lg bg-black">
				<VideoPlayer
					videoKey={lesson.coverVideoKey}
					onVideoEnd={handleVideoEnd}
					onProgressUpdate={handleProgressUpdate}
					isVideoCompleted={progress === 100}
				/>
			</div>
			<div className="rounded-lg bg-white p-6 shadow-xs">
				<h1 className="mb-4 text-2xl font-bold text-gray-900">
					{lesson.title}
				</h1>
				<p className="text-gray-600">{lesson.description}</p>

				{/* Transcription Section */}
				<div className="mt-4 rounded-lg bg-gray-100 p-4">
					<h2 className="text-lg font-semibold text-gray-800">
						Transcripción del Video:
					</h2>
					{isLoading && (
						<p className="text-gray-600">Cargando transcripción...</p>
					)}
					{error && (
						<div className="mt-2 rounded-md bg-red-50 p-3">
							<p className="text-red-600">{error}</p>
							<button
								onClick={() => void fetchTranscription()}
								className="mt-2 text-sm text-blue-600 hover:text-blue-800"
							>
								Intentar de nuevo
							</button>
						</div>
					)}
					{!isLoading && !error && transcription && (
						<p className="text-gray-600">{transcription}</p>
					)}
				</div>

				<div className="mt-4">
					<div className="mb-2 flex items-center justify-between">
						<span className="font-bold text-gray-700">
							Progreso de la clase:
						</span>
						<span className="text-gray-600">{progress}%</span>
					</div>
					<Progress value={progress} showPercentage={true} />
				</div>
			</div>
		</div>
	);
};

export default LessonPlayer;
