import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';

import Player from 'next-video/player';

import '~/styles/videoloading.css';

interface VideoPlayerProps {
  videoKey: string;
  onVideoEnd: () => void;
  onProgressUpdate: (progress: number) => void;
  isVideoCompleted: boolean;
  isLocked?: boolean;
  // Nuevo prop para sincronizar transcripción
  onTimeUpdate?: (currentTime: number) => void;
  resumeProgress?: number;
  onPlaybackChange?: (isPlaying: boolean) => void;
}

export interface VideoPlayerHandle {
  play: () => void;
  pause: () => void;
}

// Lista de videos que deben usar el reproductor nativo
const FORCE_NATIVE_PLAYER_VIDEOS = [
  'richard-1-1744669875805-fa3b69ce-7ac6-40be-b3e1-f843f27451f0.mp4',
  'gesti-n-de-recursos-humanos-y-financieros-1744843970531-d6439703-8170-464f-8604-35883bf45b62.mp4',
];

const VideoPlayer = forwardRef<VideoPlayerHandle, VideoPlayerProps>(
  (
    {
      videoKey,
      onVideoEnd,
      onProgressUpdate,
      isVideoCompleted,
      isLocked = false,
      onTimeUpdate,
      resumeProgress = 0,
      onPlaybackChange,
    },
    ref
  ) => {
    const [isLoading, setIsLoading] = useState(() =>
      !videoKey || videoKey === 'null' || isLocked ? false : true
    );
    const [useNativePlayer, setUseNativePlayer] = useState(false);
    const [playerError, setPlayerError] = useState<string | null>(null);
    // Usa el tipo correcto para el ref de Player
    const playerRef = useRef<HTMLVideoElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const hasAppliedResumeRef = useRef(false);

    useImperativeHandle(ref, () => ({
      play: () => {
        playerRef.current?.play();
      },
      pause: () => {
        playerRef.current?.pause();
      },
    }));

    // Derivar la URL del video del prop en lugar de mantenerla en estado para evitar setState en effects
    const videoUrl = useMemo(() => {
      if (!videoKey || videoKey === 'null' || isLocked) return '';
      return `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${videoKey}`;
    }, [videoKey, isLocked]);

    const applyResumeTime = useCallback(
      (video: HTMLVideoElement | null) => {
        if (!video || hasAppliedResumeRef.current) return;
        const normalizedProgress = Math.min(
          100,
          Math.max(0, resumeProgress ?? 0)
        );

        if (normalizedProgress <= 0 || normalizedProgress >= 100) {
          hasAppliedResumeRef.current = true;
          return;
        }

        const duration = video.duration;
        if (!Number.isFinite(duration) || duration <= 0) return;

        const targetTime = Math.min(
          duration - 0.5,
          (normalizedProgress / 100) * duration
        );
        if (targetTime <= 0) {
          hasAppliedResumeRef.current = true;
          return;
        }

        if (Math.abs(video.currentTime - targetTime) > 1) {
          video.currentTime = targetTime;
        }
        hasAppliedResumeRef.current = true;
      },
      [resumeProgress]
    );

    const handleReplay = useCallback(() => {
      const video = playerRef.current;
      if (!video) return;
      video.currentTime = 0;
      void video.play();
    }, []);

    useEffect(() => {
      const shouldUseNative = videoKey
        ? FORCE_NATIVE_PLAYER_VIDEOS.some((v) => videoKey.endsWith(v))
        : false;
      // Actualizar flags que sí son estados locales (estas actualizaciones pueden ser asíncronas)
      const t = setTimeout(() => {
        setUseNativePlayer(shouldUseNative);
        setPlayerError(
          shouldUseNative
            ? 'Usando reproductor nativo para mejor compatibilidad'
            : null
        );
        setIsLoading(false);
      }, 0);
      return () => clearTimeout(t);
    }, [videoKey, isLocked]);

    useEffect(() => {
      hasAppliedResumeRef.current = false;
    }, [videoKey]);

    const playerStyle = useMemo(
      () =>
        ({
          '--media-primary-color': '#ffff',
          '--media-secondary-color': isVideoCompleted ? '#16a34a' : '#2ecc71',
          '--media-accent-color': isVideoCompleted ? '#22c55e' : '#ffff',
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          maxHeight: '100vh',
          position: 'absolute',
          top: '0',
          left: '0',
        }) as React.CSSProperties & Record<`--${string}`, string | number>,
      [isVideoCompleted]
    );

    const showCompletedIndicator = !!videoUrl && !isLocked && isVideoCompleted;

    useEffect(() => {
      if (!videoUrl || isLocked || !useNativePlayer) return;
      const video = playerRef.current;
      if (video && video.readyState >= 1) {
        applyResumeTime(video);
      }
    }, [applyResumeTime, isLocked, useNativePlayer, videoUrl]);

    const handlePlayerError = (error?: unknown) => {
      console.warn(
        'Next-video player failed, falling back to native player:',
        error
      );
      setPlayerError('Error loading video player');
      setUseNativePlayer(true);
    };

    const renderLoadingState = () => (
      <div className="absolute inset-0 z-50 flex aspect-video w-full items-center justify-center overflow-hidden rounded-lg">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-[#3498db] to-[#2ecc71] shadow-lg" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.1)1px,transparent_1px),linear-gradient(rgba(255,255,255,0.1)1px,transparent_1px)] bg-[length:20px_20px] opacity-50" />
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center space-y-6 text-center">
          {!videoKey ||
          videoKey === 'null' ||
          videoKey === 'none' ||
          isLocked ? (
            <>
              <h2 className="animate-pulse text-4xl font-bold tracking-tight text-white">
                Video de la Clase
              </h2>
              <p className="text-lg font-medium text-white">
                Disponible muy pronto
              </p>
              <div className="mt-4 flex items-center space-x-2">
                <div className="h-2 w-2 animate-bounce rounded-full bg-white delay-100" />
                <div className="h-2 w-2 animate-bounce rounded-full bg-white delay-200" />
                <div className="h-2 w-2 animate-bounce rounded-full bg-white delay-300" />
              </div>
            </>
          ) : (
            <>
              <div className="hourglassBackground">
                <div className="hourglassCurves" />
                <div className="hourglassCapTop" />
                <div className="hourglassSand" />
                <div className="hourglassSandStream" />
                <div className="hourglassCapBottom" />
                <div className="hourglassGlass" />
              </div>
              <p className="text-lg font-medium text-white">
                Preparando video de la clase...
              </p>
            </>
          )}
        </div>
      </div>
    );

    return (
      <div className="relative aspect-video w-full" ref={containerRef}>
        {videoUrl && !useNativePlayer && !playerError && (
          <Player
            src={videoUrl}
            controls
            onEnded={onVideoEnd}
            onError={handlePlayerError}
            // Cambia el tipo del ref para evitar 'any'
            ref={playerRef as React.RefObject<HTMLVideoElement>}
            onPlay={() => onPlaybackChange?.(true)}
            onPause={() => onPlaybackChange?.(false)}
            onLoadedMetadata={(e) => {
              applyResumeTime(e.currentTarget);
            }}
            onTimeUpdate={(e) => {
              const video = e.currentTarget;
              if (video && !isVideoCompleted) {
                const progress = Math.round(
                  (video.currentTime / video.duration) * 100
                );
                onProgressUpdate(progress);
              }
              if (onTimeUpdate) {
                onTimeUpdate(video.currentTime);
              }
            }}
            style={playerStyle}
          />
        )}
        {(videoUrl && useNativePlayer) || playerError ? (
          <video
            ref={playerRef}
            src={videoUrl}
            className="absolute inset-0 h-full w-full bg-black object-contain"
            controls
            playsInline
            controlsList="nodownload"
            onEnded={onVideoEnd}
            onError={(_e) => {
              console.error(
                'Native player error: Video failed to load or play'
              );
            }}
            onPlay={() => onPlaybackChange?.(true)}
            onPause={() => onPlaybackChange?.(false)}
            onLoadedMetadata={(e) => {
              applyResumeTime(e.currentTarget);
            }}
            onTimeUpdate={(e) => {
              const video = e.currentTarget;
              if (video && !isVideoCompleted) {
                const progress = Math.round(
                  (video.currentTime / video.duration) * 100
                );
                onProgressUpdate(progress);
              }
              if (onTimeUpdate) {
                onTimeUpdate(video.currentTime);
              }
            }}
          />
        ) : null}
        {(!videoUrl || isLoading) && renderLoadingState()}
        {showCompletedIndicator && (
          <div className="pointer-events-none absolute top-3 left-3 rounded-full bg-emerald-500/90 px-3 py-1 text-xs font-semibold text-emerald-950 shadow">
            Completado
          </div>
        )}
        {showCompletedIndicator && (
          <button
            type="button"
            onClick={handleReplay}
            className="absolute right-3 bottom-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-900 shadow transition hover:bg-white"
          >
            Repetir desde el inicio
          </button>
        )}
      </div>
    );
  }
);

export default VideoPlayer;
