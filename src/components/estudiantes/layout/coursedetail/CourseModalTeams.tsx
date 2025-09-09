import { useEffect, useRef, useState } from 'react';

import { Dialog } from '@headlessui/react';

import { Progress } from '~/components/estudiantes/ui/progress';

import CourseVideo from './CourseVideo';

interface CourseModalTeamsProps {
  open: boolean;
  title: string;
  videoKey: string;
  onClose: () => void;
  progress?: number;
  meetingId?: number;
  onProgressUpdated?: (meetingId: number, progress: number) => void; // <-- Nuevo prop para notificar al padre
}

async function updateMeetingProgress(meetingId: number, progress: number) {
  try {
    const response = await fetch('/api/estudiantes/class-meetings/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meetingId, progress }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Error al guardar progreso:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error de red al guardar progreso:', error);
    return false;
  }
}

const CourseModalTeams: React.FC<CourseModalTeamsProps> = ({
  open,
  title,
  videoKey,
  onClose,
  progress = 0,
  meetingId,
  onProgressUpdated,
}) => {
  const [videoProgress, setVideoProgress] = useState<number>(progress);
  const [startTime, setStartTime] = useState<number>(0);
  const lastSavedProgress = useRef<number>(progress);
  const saveIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Inicializa startTime cuando se abre el modal
  useEffect(() => {
    if (progress && progress > 0) {
      setStartTime(progress);
    }
    setVideoProgress(progress);
    lastSavedProgress.current = progress;
  }, [progress, open]);

  // Guarda el progreso periódicamente mientras se ve el video
  useEffect(() => {
    if (open && typeof meetingId === 'number') {
      // Guardar cada 10 segundos mientras el modal está abierto
      saveIntervalRef.current = setInterval(() => {
        if (Math.abs(videoProgress - lastSavedProgress.current) >= 5) {
          void updateMeetingProgress(meetingId, videoProgress);
          lastSavedProgress.current = videoProgress;

          // Notifica al componente padre sobre el cambio
          if (onProgressUpdated) {
            onProgressUpdated(meetingId, videoProgress);
          }
        }
      }, 10000);
    }

    return () => {
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
      }
    };
  }, [open, meetingId, videoProgress, onProgressUpdated]);

  // Guarda el progreso cuando cambia significativamente
  useEffect(() => {
    if (
      typeof meetingId === 'number' &&
      videoProgress !== undefined &&
      Math.abs(videoProgress - lastSavedProgress.current) >= 5
    ) {
      const debounceTimeout = setTimeout(() => {
        void updateMeetingProgress(meetingId, videoProgress);
        lastSavedProgress.current = videoProgress;

        // Notifica al componente padre sobre el cambio
        if (onProgressUpdated) {
          onProgressUpdated(meetingId, videoProgress);
        }
      }, 1000); // Espera 1 segundo para evitar multiples llamadas

      return () => clearTimeout(debounceTimeout);
    }
  }, [videoProgress, meetingId, onProgressUpdated]);

  // Guarda el progreso final al cerrar el modal
  const handleModalClose = () => {
    if (
      typeof meetingId === 'number' &&
      videoProgress !== lastSavedProgress.current
    ) {
      void updateMeetingProgress(meetingId, videoProgress);

      // Notifica al componente padre sobre el cambio final
      if (onProgressUpdated) {
        onProgressUpdated(meetingId, videoProgress);
      }
    }
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleModalClose} // Usa nuestro handler personalizado
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
    >
      <div className="flex h-full w-full items-center justify-center">
        <div className="relative flex w-full max-w-2xl flex-col gap-4 rounded-lg bg-white p-6 shadow-lg">
          <button
            className="absolute top-3 right-3 z-20 text-2xl font-bold text-gray-700 hover:text-red-600"
            onClick={handleModalClose}
            aria-label="Cerrar"
            type="button"
          >
            ×
          </button>
          <h2 className="mb-2 text-lg font-bold text-gray-900">{title}</h2>
          <div className="rounded-lg bg-black p-2 pb-4">
            <CourseVideo
              videoKey={videoKey}
              onProgressUpdate={setVideoProgress}
              startTime={startTime}
            />
          </div>
          {/* Barra de progreso debajo del video en el modal */}
          <div className="mt-2 w-full px-2">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-700">
                Progreso del video
              </p>
              <span className="text-xs text-gray-500">
                {videoProgress ?? 0}%
              </span>
            </div>
            <Progress
              value={videoProgress ?? 0}
              showPercentage={true}
              className="transition-none"
            />
          </div>
        </div>
      </div>
    </Dialog>
  );
};

export default CourseModalTeams;
