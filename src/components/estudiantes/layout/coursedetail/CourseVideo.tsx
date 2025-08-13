import { useEffect, useState } from 'react';

import Player from 'next-video/player';

import { Progress } from '~/components/estudiantes/ui/progress';

interface CourseVideoProps {
  videoKey: string;
  progress?: number;
}

const CourseVideo: React.FC<CourseVideoProps> = ({ videoKey, progress }) => {
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

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
          src={videoUrl}
          controls
          style={
            {
              '--media-primary-color': '#3AF4EF', // primary
              '--media-secondary-color': '#00BDD8', // secondary
              '--media-accent-color': '#3AF4EF', // primary
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
      {/* Barra de progreso debajo del video si existe */}
      {typeof progress === 'number' && (
        <div className="absolute right-0 bottom-0 left-0 z-20 w-full px-4 pb-2">
          <Progress value={progress} showPercentage={true} />
        </div>
      )}
    </div>
  );
};

export default CourseVideo;
