import { useEffect, useRef, useState } from 'react';

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
  startAt?: number; // <-- NUEVO: segundos para iniciar el video
}

// Lista de videos que deben usar el reproductor nativo
const FORCE_NATIVE_PLAYER_VIDEOS = [
  'richard-1-1744669875805-fa3b69ce-7ac6-40be-b3e1-f843f27451f0.mp4',
  'gesti-n-de-recursos-humanos-y-financieros-1744843970531-d6439703-8170-464f-8604-35883bf45b62.mp4',
];

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoKey,
  onVideoEnd,
  onProgressUpdate,
  isVideoCompleted,
  isLocked = false,
  onTimeUpdate,
  startAt = 0, // <-- NUEVO
}) => {
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [useNativePlayer, setUseNativePlayer] = useState(false);
  const [playerError, setPlayerError] = useState<string | null>(null);
  // Usa el tipo correcto para el ref de Player
  const playerRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Tipos seguros para fullscreen/orientación
  type FullscreenTarget =
    | (Element & { requestFullscreen?: () => Promise<void> })
    | null;
  interface SafariHTMLVideoElement extends HTMLVideoElement {
    webkitEnterFullscreen?: () => void;
  }

  // Helper: solicitar fullscreen y bloquear orientación landscape cuando sea posible
  const requestFullscreen = async () => {
    try {
      const target: FullscreenTarget =
        (playerRef.current as unknown as Element) ??
        containerRef.current ??
        document.documentElement;
      // iOS Safari (webkitEnterFullscreen en video)
      const safariVideo = playerRef.current as SafariHTMLVideoElement | null;
      if (
        safariVideo &&
        typeof safariVideo.webkitEnterFullscreen === 'function'
      ) {
        safariVideo.webkitEnterFullscreen();
        setIsFullscreen(true);
        return;
      }
      if (target && typeof target.requestFullscreen === 'function') {
        await target.requestFullscreen();
        setIsFullscreen(true);
      }
      const orientation = screen.orientation as unknown as {
        lock?: (type: 'landscape' | 'portrait') => Promise<void>;
      };
      if (orientation && typeof orientation.lock === 'function') {
        try {
          await orientation.lock('landscape');
        } catch {
          // ignorar si no soporta lock
        }
      }
    } catch (_err) {
      // fallback sin cambiar estado
    }
  };

  const exitFullscreen = async () => {
    try {
      if (
        document.fullscreenElement &&
        typeof document.exitFullscreen === 'function'
      ) {
        await document.exitFullscreen();
      }
      setIsFullscreen(false);
    } catch {
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handler = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  useEffect(() => {
    if (!videoKey || videoKey === 'null' || isLocked) {
      setIsLoading(false);
      return;
    }

    // Forzar reproductor nativo solo si el videoKey termina exactamente con alguno de la lista
    const shouldUseNative = FORCE_NATIVE_PLAYER_VIDEOS.some((v) =>
      videoKey.endsWith(v)
    );
    setUseNativePlayer(shouldUseNative);
    setPlayerError(
      shouldUseNative
        ? 'Usando reproductor nativo para mejor compatibilidad'
        : null
    );

    setVideoUrl(`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${videoKey}`);
    setIsLoading(false);
  }, [videoKey, isLocked]);

  // NUEVO: Saltar al tiempo guardado al cargar el video (nativo y next-video)
  useEffect(() => {
    if (!videoUrl || isLocked) return;
    if (useNativePlayer && playerRef.current && startAt > 0) {
      const video = playerRef.current;
      const seek = () => {
        if (!video) return;
        if (Math.abs(video.currentTime - startAt) > 1) {
          video.currentTime = startAt;
        }
      };
      // Si ya tiene metadata cargada, aplicar directamente
      if (video.readyState >= 1) {
        seek();
      } else {
        video.addEventListener('loadedmetadata', seek, { once: true });
      }
      return () => {
        video?.removeEventListener('loadedmetadata', seek);
      };
    }
  }, [videoUrl, useNativePlayer, startAt, isLocked]);

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
        {!videoKey || videoKey === 'null' || videoKey === 'none' || isLocked ? (
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
          onLoadedMetadata={(e) => {
            if (
              startAt > 0 &&
              Math.abs(e.currentTarget.currentTime - startAt) > 1
            ) {
              e.currentTarget.currentTime = startAt;
            }
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
          style={{
            '--media-primary-color': '#ffff',
            '--media-secondary-color': '#2ecc71',
            '--media-accent-color': '#ffff',
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            maxHeight: '100vh',
            position: 'absolute',
            top: '0',
            left: '0',
          }}
        />
      )}
      {/* Botón fullscreen para móviles: fuera del Player y solo si hay video */}
      {videoUrl && (
        <div className="absolute right-2 bottom-2 z-[100000] sm:hidden">
          <button
            type="button"
            onClick={() =>
              isFullscreen ? exitFullscreen() : requestFullscreen()
            }
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#00BDD8] text-[#01142B] shadow hover:bg-[#00A5C0] active:scale-95"
            aria-label={
              isFullscreen
                ? 'Salir de pantalla completa'
                : 'Entrar a pantalla completa'
            }
            title={
              isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'
            }
          >
            {isFullscreen ? (
              // Icono salir pantalla completa (minimize arrows inward)
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-5 w-5"
              >
                <path d="M9 9H5v4H3V9a2 2 0 0 1 2-2h4v2zm10 0V7h-4V5h4a2 2 0 0 1 2 2v4h-2zM5 15h4v2H5a2 2 0 0 1-2-2v-4h2v4zm14-2h2v4a2 2 0 0 1-2 2h-4v-2h4v-4z" />
              </svg>
            ) : (
              // Icono entrar pantalla completa (maximize arrows outward)
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-5 w-5"
              >
                <path d="M9 3H5a2 2 0 0 0-2 2v4h2V5h4V3zm10 0h-4v2h4v4h2V5a2 2 0 0 0-2-2zM3 15v4a2 2 0 0 0 2 2h4v-2H5v-4H3zm18 4v-4h-2v4h-4v2h4a2 2 0 0 0 2-2z" />
              </svg>
            )}
          </button>
        </div>
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
            console.error('Native player error: Video failed to load or play');
          }}
          onLoadedMetadata={(e) => {
            if (
              startAt > 0 &&
              Math.abs(e.currentTarget.currentTime - startAt) > 1
            ) {
              e.currentTarget.currentTime = startAt;
            }
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
    </div>
  );
};

export default VideoPlayer;
