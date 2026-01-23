import { useEffect, useRef, useState } from 'react';

import { Dialog } from '@headlessui/react';
import { X } from 'lucide-react';

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
  const [startTime, _setStartTime] = useState<number>(() => progress ?? 0);
  const lastSavedProgress = useRef<number>(progress);
  const saveIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const progressLabel = `${Math.round(videoProgress ?? 0)}%`;

  // Mantener referencias iniciales y actualizar lastSavedProgress cuando cambie progress
  useEffect(() => {
    lastSavedProgress.current = progress;
    // Actualizar videoProgress si cambia desde el padre
    const t = setTimeout(() => setVideoProgress(progress), 0);
    return () => clearTimeout(t);
  }, [progress]);

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
      <div className="flex h-full w-full items-center justify-center p-4">
        <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
          <button
            className="absolute top-4 right-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none"
            onClick={handleModalClose}
            aria-label="Cerrar"
            type="button"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
          <div className="flex flex-col space-y-1.5 p-4 pb-0 text-center sm:text-left">
            <h2 className="text-base font-medium tracking-tight text-foreground">
              {title}
            </h2>
          </div>
          <div className="relative mt-3 bg-black">
            <CourseVideo
              videoKey={videoKey}
              onProgressUpdate={setVideoProgress}
              startTime={startTime}
            />
          </div>
          <div className="space-y-2 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progreso del video</span>
              <span className="text-muted-foreground">{progressLabel}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-accent transition-all"
                style={{ width: `${videoProgress ?? 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
};

export default CourseModalTeams;
