import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import VideoPlayer from '~/components/estudiantes/layout/lessondetail/LessonVideo';
import { Progress } from '~/components/estudiantes/ui/progress';
import { type LessonWithProgress } from '~/types';

interface LessonPlayerProps {
  lesson: LessonWithProgress;
  progress: number;
  handleVideoEnd: () => void;
  handleProgressUpdate: (videoProgress: number) => void;
}

interface TranscriptionResponse {
  transcription: string;
}

// Custom error interface without extending AxiosError
interface ApiError {
  code?: string;
  message: string;
  response?: {
    status: number;
    data: unknown;
  };
  request?: unknown;
  isAxiosError?: boolean;
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
    if (!lesson.coverVideoKey) return;

    setIsLoading(true);
    setError(null);

    try {
      const apiUrl = 'http://3.145.183.203:8000/video2text';
      const videoUrl = `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${lesson.coverVideoKey}`;

      const response = await axios.post<TranscriptionResponse>(
        apiUrl,
        { url: videoUrl },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Origin': process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000',
          },
          timeout: 30000,
          validateStatus: (status) => status === 200,
        }
      );

      const { transcription } = response.data;

      if (!transcription || typeof transcription !== 'string') {
        throw new Error('Invalid transcription format received');
      }

      setTranscription(transcription);
    } catch (error) {
      let errorMessage = 'Error al obtener la transcripción';
      const apiError = error as ApiError;

      if (apiError.code === 'ECONNABORTED') {
        errorMessage = 'La solicitud tardó demasiado tiempo. Por favor, intenta de nuevo.';
      } else if (apiError.response?.status) {
        errorMessage = `Error del servidor: ${apiError.response.status}`;
      } else if (apiError.request) {
        errorMessage = 'No se pudo conectar con el servidor de transcripción. Por favor, verifica tu conexión a internet.';
      } else if (error instanceof Error) {
        errorMessage = `Error: ${error.message}`;
      }

      console.error('API error details:', {
        message: apiError.message,
        code: apiError.code,
        response: apiError.response?.data,
        status: apiError.response?.status,
      });

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [lesson.coverVideoKey]);

  useEffect(() => {
    void fetchTranscription();
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
