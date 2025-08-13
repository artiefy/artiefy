import { useEffect, useRef, useState } from 'react';

import Player from 'next-video/player';

interface CourseVideoProps {
  videoKey: string;
  progress?: number;
  onProgressUpdate?: (progress: number) => void;
  startTime?: number; // Nuevo: para reanudar desde el progreso guardado
}

const CourseVideo: React.FC<CourseVideoProps> = ({
  videoKey,
  onProgressUpdate,
  startTime = 0,
}) => {
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const playerRef = useRef<HTMLVideoElement | null>(null);
  const [hasSeeked, setHasSeeked] = useState(false);

  useEffect(() => {
    if (!videoKey || videoKey === 'null') {
      setIsLoading(false);
      return;
    }
    setVideoUrl(
      `https://s3.us-east-2.amazonaws.com/artiefy-upload/video_clase/${videoKey}`
    );
    setIsLoading(false);
  }, [videoKey]);

  // Cuando el video esté listo, busca al tiempo correspondiente
  const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    if (!hasSeeked && startTime > 0 && e.currentTarget.duration > 0) {
      // Calcula el tiempo exacto donde reanudar el video basado en el porcentaje guardado
      const seekTo = (startTime / 100) * e.currentTarget.duration;

      // Asegurarnos de no ir más allá del final del video
      const safeSeekTime = Math.min(seekTo, e.currentTarget.duration * 0.95);

      console.log(
        `Reanudando video desde ${safeSeekTime.toFixed(2)} segundos (${startTime}%)`
      );
      e.currentTarget.currentTime = safeSeekTime;
      setHasSeeked(true);
    }
  };

  if (!videoKey || videoKey === 'null') {
    return (
      <div className="flex h-64 items-center justify-center text-center text-lg font-semibold text-gray-500">
        No hay video disponible para esta clase grabada.
      </div>
    );
  }

  return (
    <div className="relative aspect-video w-full">
      {videoUrl && (
        <Player
          ref={playerRef}
          src={videoUrl}
          controls
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={(e) => {
            const video = e.currentTarget;
            if (video && video.duration > 0 && onProgressUpdate) {
              const progressValue = Math.round(
                (video.currentTime / video.duration) * 100
              );
              onProgressUpdate(progressValue);
            }
          }}
          style={
            {
              '--media-primary-color': '#3AF4EF',
              '--media-secondary-color': '#00BDD8',
              '--media-accent-color': '#3AF4EF',
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              maxHeight: '100vh',
              position: 'absolute',
              top: '0',
              left: '0',
            } as React.CSSProperties
          }
        />
      )}
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60">
          <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-cyan-400" />
        </div>
      )}
      {/* Barra de progreso eliminada, solo se muestra en el modal */}
    </div>
  );
};

export default CourseVideo;
