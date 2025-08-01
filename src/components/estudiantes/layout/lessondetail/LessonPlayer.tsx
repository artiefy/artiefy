import { useCallback, useState } from 'react';

import { Lock } from 'lucide-react';

import { Icons } from '~/components/estudiantes/ui/icons';
import { Progress } from '~/components/estudiantes/ui/progress';
import { type LessonWithProgress } from '~/types';

import VideoPlayer from './LessonVideo';

interface LessonPlayerProps {
  lesson: LessonWithProgress;
  progress: number;
  handleVideoEnd: () => void;
  handleProgressUpdate: (videoProgress: number) => void;
  transcription?: { start: number; end: number; text: string }[];
  isLoadingTranscription?: boolean;
}

const LessonPlayer = ({
  lesson,
  progress,
  handleVideoEnd,
  handleProgressUpdate,
  transcription,
  isLoadingTranscription = false,
}: LessonPlayerProps) => {
  const isLocked = lesson.isLocked === true;

  // Estado para mostrar/ocultar transcripción
  const [showTranscription, setShowTranscription] = useState(false);
  // Estado para el índice actual de la transcripción
  const [currentTranscriptionIndex, setCurrentTranscriptionIndex] =
    useState<number>(-1);

  // Callback para actualizar el tiempo actual del video y sincronizar la transcripción
  const handleVideoTimeUpdate = useCallback(
    (currentTime: number) => {
      if (!transcription || transcription.length === 0) return;
      // Buscar el índice de la transcripción correspondiente al tiempo actual
      const idx = transcription.findIndex(
        (item) => currentTime >= item.start && currentTime < item.end
      );
      setCurrentTranscriptionIndex(idx);
    },
    [transcription]
  );

  if (isLocked) {
    return (
      <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-gray-800 to-gray-900">
        <div className="z-10 flex flex-col items-center justify-center space-y-4 px-4 text-center">
          <div className="animate-bounce rounded-full bg-gray-700/50 p-6">
            <Lock className="h-12 w-12 text-yellow-500" strokeWidth={1.5} />
          </div>
          <h3 className="text-2xl font-bold text-white">Clase Bloqueada</h3>
          <p className="max-w-sm text-gray-300">
            Completa las clases anteriores para desbloquear esta lección
          </p>
          <div className="mt-2 h-1 w-16 rounded bg-yellow-500" />
        </div>
        <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-10" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="relative mb-4 aspect-video w-full overflow-hidden rounded-lg bg-black md:mb-6">
        <div className="absolute inset-0 flex items-center justify-center">
          <VideoPlayer
            videoKey={lesson.coverVideoKey}
            onVideoEnd={handleVideoEnd}
            onProgressUpdate={handleProgressUpdate}
            isVideoCompleted={progress === 100}
            isLocked={isLocked}
            // Nuevo callback para sincronizar transcripción
            onTimeUpdate={handleVideoTimeUpdate}
          />
        </div>
      </div>
      <div className="rounded-lg bg-white p-4 shadow-xs md:p-6">
        <h1 className="mb-2 text-xl font-bold text-gray-900 md:mb-4 md:text-2xl">
          {lesson.title}
        </h1>
        <p className="font-semibold text-gray-600">{lesson.description}</p>
        {/* Loading y transcripción debajo de la descripción */}
        {isLoadingTranscription && (
          <div className="mt-4 mb-4 flex items-center gap-2 text-indigo-700">
            <span className="text-base italic">Cargando transcripción...</span>
            <Icons.spinner className="h-5 w-5 text-indigo-500" />
          </div>
        )}
        {/* Botón para mostrar/ocultar transcripción */}
        {transcription &&
          transcription.length > 0 &&
          !isLoadingTranscription && (
            <div className="mt-4 mb-4">
              <button
                className="mb-2 rounded bg-indigo-100 px-3 py-1 font-semibold text-indigo-700 transition hover:bg-indigo-200"
                onClick={() => setShowTranscription((v) => !v)}
              >
                {showTranscription
                  ? 'Ocultar transcripción'
                  : 'Ver transcripción'}
              </button>
              {showTranscription && (
                <div
                  className="space-y-2 transition-all duration-300"
                  style={
                    transcription.length > 3
                      ? {
                          maxHeight: '16rem',
                          overflowY: 'auto',
                          border: '1px solid #e0e7ff',
                          borderRadius: '0.5rem',
                          padding: '0.5rem',
                          background: '#f8fafc',
                        }
                      : {}
                  }
                >
                  <h2 className="mb-2 text-lg font-semibold text-indigo-700">
                    Transcripción
                  </h2>
                  {transcription.map((item, idx) => (
                    <div
                      key={idx}
                      className={`rounded px-2 py-1 text-sm italic transition-all duration-300 ${
                        idx === currentTranscriptionIndex
                          ? 'bg-indigo-200 font-bold text-indigo-900'
                          : 'bg-indigo-50 text-indigo-700'
                      }`}
                      style={{
                        opacity: idx <= currentTranscriptionIndex ? 1 : 0.5,
                      }}
                    >
                      <span className="mr-2 font-mono text-xs text-indigo-400">
                        [{item.start.toFixed(2)}s - {item.end.toFixed(2)}s]
                      </span>
                      {item.text}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        <div className="mt-4 md:-mt-4">
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
