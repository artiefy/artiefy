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
  resumeTimeSeconds?: number;
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
      resumeTimeSeconds = 0,
      onPlaybackChange,
    },
    ref
  ) => {
    const [isLoading, setIsLoading] = useState(() =>
      !videoKey || videoKey === 'null' || videoKey === 'none' || isLocked
        ? false
        : true
    );
    const [useNativePlayer, setUseNativePlayer] = useState(false);
    const [playerError, setPlayerError] = useState<string | null>(null);
    const [isBuffering, setIsBuffering] = useState(false);
    // Usa el tipo correcto para el ref de Player
    const playerRef = useRef<HTMLVideoElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const hasAppliedResumeRef = useRef(false);
    const maxWatchedTimeRef = useRef(0);
    const lastProgressRef = useRef(0);
    const SEEK_TOLERANCE_SECONDS = 1;

    useImperativeHandle(ref, () => ({
      play: () => {
        const playPromise = playerRef.current?.play();
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(() => {});
        }
      },
      pause: () => {
        playerRef.current?.pause();
      },
    }));

    // Derivar la URL del video del prop en lugar de mantenerla en estado para evitar setState en effects
    const videoUrl = useMemo(() => {
      if (!videoKey || videoKey === 'null' || videoKey === 'none' || isLocked)
        return '';
      return `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${videoKey}`;
    }, [videoKey, isLocked]);

    const applyResumeTime = useCallback(
      (video: HTMLVideoElement | null) => {
        if (!video || hasAppliedResumeRef.current) return;
        const duration = video.duration;
        if (!Number.isFinite(duration) || duration <= 0) return;

        const safeResumeSeconds = Math.max(0, resumeTimeSeconds ?? 0);
        const normalizedProgress = Math.min(
          100,
          Math.max(0, resumeProgress ?? 0)
        );

        const targetTime = safeResumeSeconds > 0 ? safeResumeSeconds : null;
        const derivedTime =
          targetTime !== null
            ? Math.min(duration - 0.5, targetTime)
            : Math.min(duration - 0.5, (normalizedProgress / 100) * duration);

        if (
          (safeResumeSeconds <= 0 &&
            (normalizedProgress <= 0 || normalizedProgress >= 100)) ||
          derivedTime <= 0
        ) {
          hasAppliedResumeRef.current = true;
          return;
        }

        if (Math.abs(video.currentTime - derivedTime) > 1) {
          video.currentTime = derivedTime;
        }
        maxWatchedTimeRef.current = Math.max(
          maxWatchedTimeRef.current,
          derivedTime
        );
        hasAppliedResumeRef.current = true;
      },
      [resumeProgress, resumeTimeSeconds]
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
      const t = setTimeout(() => {
        setUseNativePlayer(shouldUseNative);
        setPlayerError(
          shouldUseNative
            ? 'Usando reproductor nativo para mejor compatibilidad'
            : null
        );
      }, 0);
      return () => clearTimeout(t);
    }, [videoKey, isLocked]);

    useEffect(() => {
      hasAppliedResumeRef.current = false;
      maxWatchedTimeRef.current = 0;
      lastProgressRef.current = 0;
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

    const handleSeeking = useCallback(
      (video: HTMLVideoElement | null) => {
        if (!video || isVideoCompleted) return;
        const maxAllowed = maxWatchedTimeRef.current + SEEK_TOLERANCE_SECONDS;
        if (video.currentTime > maxAllowed) {
          video.currentTime = maxWatchedTimeRef.current;
        }
      },
      [isVideoCompleted]
    );

    const handleTimeUpdate = useCallback(
      (video: HTMLVideoElement) => {
        const safeCurrent = Math.max(video.currentTime, 0);
        if (!isVideoCompleted) {
          const maxAllowed = maxWatchedTimeRef.current + SEEK_TOLERANCE_SECONDS;
          if (safeCurrent > maxAllowed) {
            video.currentTime = maxWatchedTimeRef.current;
            return;
          }
        }
        if (safeCurrent > maxWatchedTimeRef.current) {
          maxWatchedTimeRef.current = safeCurrent;
        }

        if (!isVideoCompleted && video.duration > 0) {
          const progress = Math.round(
            (maxWatchedTimeRef.current / video.duration) * 100
          );
          const clamped = Math.max(progress, lastProgressRef.current);
          if (clamped !== lastProgressRef.current) {
            lastProgressRef.current = clamped;
            onProgressUpdate(clamped);
          }
        }

        if (onTimeUpdate) {
          onTimeUpdate(safeCurrent);
        }
      },
      [isVideoCompleted, onProgressUpdate, onTimeUpdate]
    );

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
                Video no disponible
              </h2>
              <p className="text-lg font-medium text-white">
                Este video aún no está disponible para esta clase
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
                <div className="hourglassContainer">
                  <div className="hourglassCurves" />
                  <div className="hourglassCapTop" />
                  <div className="hourglassSand" />
                  <div className="hourglassSandStream" />
                  <div className="hourglassCapBottom" />
                  <div className="hourglassGlass" />
                </div>
              </div>
              <p className="text-lg font-medium text-white">
                Preparando video de la clase...
              </p>
            </>
          )}
        </div>
      </div>
    );

    const handleLoadedMetadata = useCallback(
      (video: HTMLVideoElement) => {
        applyResumeTime(video);
        setIsLoading(false);
        setIsBuffering(false);
      },
      [applyResumeTime]
    );

    const handleLoadStart = useCallback(() => {
      if (videoUrl) {
        setIsLoading(true);
      }
    }, [videoUrl]);

    const handleCanPlay = useCallback(() => {
      setIsLoading(false);
      setIsBuffering(false);
    }, []);

    const handleWaiting = useCallback(() => {
      if (videoUrl) setIsBuffering(true);
    }, [videoUrl]);

    const handlePlaying = useCallback(() => {
      setIsBuffering(false);
    }, []);

    const shouldShowLoading = !videoUrl || isLoading || isBuffering;

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
            onLoadStart={handleLoadStart}
            onLoadedMetadata={(e) => handleLoadedMetadata(e.currentTarget)}
            onCanPlay={handleCanPlay}
            onWaiting={handleWaiting}
            onPlaying={handlePlaying}
            onSeeking={(e) => handleSeeking(e.currentTarget)}
            onSeeked={(e) => handleSeeking(e.currentTarget)}
            onTimeUpdate={(e) => {
              handleTimeUpdate(e.currentTarget);
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
            onLoadStart={handleLoadStart}
            onLoadedMetadata={(e) => handleLoadedMetadata(e.currentTarget)}
            onCanPlay={handleCanPlay}
            onWaiting={handleWaiting}
            onPlaying={handlePlaying}
            onSeeking={(e) => handleSeeking(e.currentTarget)}
            onSeeked={(e) => handleSeeking(e.currentTarget)}
            onTimeUpdate={(e) => {
              handleTimeUpdate(e.currentTarget);
            }}
          />
        ) : null}
        {shouldShowLoading && renderLoadingState()}
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
