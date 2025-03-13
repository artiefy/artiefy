import { useEffect, useState, useCallback } from 'react';

import axios, { isAxiosError } from 'axios';

import { Progress } from '~/components/estudiantes/ui/progress';
import { type LessonWithProgress } from '~/types';

import VideoPlayer from './LessonVideo';

const VIDEO_TO_TEXT_API = '/api/iatranscripcion';
const DEFAULT_TIMEOUT = 300000;

interface LessonPlayerProps {
	lesson: LessonWithProgress;
	progress: number;
	handleVideoEnd: () => void;
	handleProgressUpdate: (videoProgress: number) => void;
}

interface TranscriptionItem {
	start: number;
	end: number;
	text: string;
}

interface TranscriptionResponse {
	transcription: TranscriptionItem[];
	error?: string;
}

const LessonPlayer = ({
	lesson,
	progress,
	handleVideoEnd,
	handleProgressUpdate,
}: LessonPlayerProps) => {
	const isLocked = lesson.isLocked === true;
	const [transcription, setTranscription] = useState<
		TranscriptionItem[] | null
	>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetchTranscription = useCallback(async () => {
		if (!lesson.coverVideoKey) {
			setError('URL del video no disponible');
			return;
		}

		setIsLoading(true);
		setError(null);

		try {
			// Ensure the URL is complete
			const fullUrl = lesson.coverVideoKey.startsWith('http')
				? lesson.coverVideoKey
				: `https://s3.us-east-2.amazonaws.com/artiefy-upload/${lesson.coverVideoKey}`;

			console.log('Solicitando transcripción para:', fullUrl);

			const response = await axios.post<TranscriptionResponse>(
				VIDEO_TO_TEXT_API,
				{ url: fullUrl },
				{
					headers: {
						'Content-Type': 'application/json',
					},
					timeout: DEFAULT_TIMEOUT,
				}
			);

			console.log('Respuesta recibida:', response.data);

			if (response.data.error) {
				throw new Error(response.data.error);
			}

			if (!Array.isArray(response.data.transcription)) {
				throw new Error('Formato de transcripción inválido');
			}

			setTranscription(response.data.transcription);
		} catch (err: unknown) {
			console.error('Error en la transcripción:', err);

			let errorMessage = 'Error al procesar la transcripción';

			if (isAxiosError(err)) {
				if (err.code === 'ECONNABORTED') {
					errorMessage = 'La solicitud tomó demasiado tiempo';
				} else if (
					err.response?.data &&
					typeof (err.response.data as { error?: string }).error === 'string'
				) {
					errorMessage = (err.response.data as { error: string }).error;
				} else {
					errorMessage = err.message;
				}
			} else if (err instanceof Error) {
				errorMessage = err.message;
			}

			setError(errorMessage);
		} finally {
			setIsLoading(false);
		}
	}, [lesson.coverVideoKey]);

	useEffect(() => {
		if (!isLocked && lesson.coverVideoKey) {
			void fetchTranscription();
		}
	}, [fetchTranscription, isLocked, lesson.coverVideoKey]);

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

				<div className="mt-4 rounded-lg bg-gray-100 p-4">
					<h2 className="mb-4 text-lg font-semibold text-gray-800">
						Transcripción del Video
					</h2>

					{isLoading && (
						<div className="flex items-center justify-center py-4">
							<p className="text-gray-600">Cargando transcripción...</p>
						</div>
					)}

					{error && (
						<div className="mb-4 rounded-md bg-red-50 p-4">
							<p className="text-red-600">{error}</p>
							<button
								onClick={() => void fetchTranscription()}
								className="mt-3 rounded-md bg-red-100 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-200"
							>
								Intentar nuevamente
							</button>
						</div>
					)}

					{!isLoading && !error && transcription && (
						<div className="max-h-96 space-y-2 overflow-y-auto text-gray-600">
							{transcription.map((item, index) => (
								<div
									key={index}
									className="rounded-md bg-white p-3 shadow-sm transition-colors hover:bg-gray-50"
								>
									<span className="mr-2 font-medium text-gray-700">
										[{item.start.toFixed(1)} - {item.end.toFixed(1)}]
									</span>
									<span>{item.text}</span>
								</div>
							))}
						</div>
					)}
				</div>

				<div className="mt-6">
					<div className="mb-2 flex items-center justify-between">
						<span className="font-bold text-gray-700">
							Progreso de la clase
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
