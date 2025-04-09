import { useEffect, useState, useRef } from 'react';

interface VideoPlayerProps {
	videoKey: string;
	onVideoEnd: () => void;
	onProgressUpdate: (progress: number) => void;
	isVideoCompleted: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
	videoKey,
	onVideoEnd,
	onProgressUpdate,
	isVideoCompleted,
}) => {
	const [videoUrl, setVideoUrl] = useState('');
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState('');
	const videoRef = useRef<HTMLVideoElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const fetchVideoUrl = async () => {
			setIsLoading(true);
			setError('');

			if (!videoKey) {
				setError('Video no disponible');
				setIsLoading(false);
				return;
			}

			try {
				const url = `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${videoKey}`;
				const response = await fetch(url, { method: 'HEAD' });

				if (!response.ok) {
					throw new Error(
						response.status === 403
							? 'No tienes acceso a este video'
							: 'Error al cargar el video'
					);
				}

				setVideoUrl(url);
			} catch (err) {
				console.error('Error fetching video:', err);
				setError(
					err instanceof Error ? err.message : 'Error al cargar el video'
				);
			} finally {
				setIsLoading(false);
			}
		};

		void fetchVideoUrl();
	}, [videoKey]);

	const handleTimeUpdate = () => {
		if (videoRef.current && !isVideoCompleted) {
			const progress =
				(videoRef.current.currentTime / videoRef.current.duration) * 100;
			onProgressUpdate(progress);
		}
	};

	const handleVideoEnd = () => {
		onVideoEnd();
	};

	const handleLoadedMetadata = () => {
		// Update container height to match video aspect ratio
		if (videoRef.current && containerRef.current) {
			const aspectRatio =
				videoRef.current.videoHeight / videoRef.current.videoWidth;
			containerRef.current.style.paddingBottom = `${aspectRatio * 100}%`;

			// Add minimum height to prevent container collapse during loading
			containerRef.current.style.minHeight = '200px';

			// Force video player to fill container while maintaining aspect ratio
			videoRef.current.style.position = 'absolute';
			videoRef.current.style.width = '100%';
			videoRef.current.style.height = '100%';
			videoRef.current.style.objectFit = 'contain';
		}
	};

	if (isLoading) {
		return (
			<div className="relative aspect-video w-full animate-pulse bg-gray-200">
				<div className="absolute inset-0 flex items-center justify-center">
					<div className="h-12 w-12 rounded-full border-4 border-gray-300 border-t-gray-600" />
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex aspect-video w-full items-center justify-center bg-gray-100">
				<p className="text-center text-gray-600">{error}</p>
			</div>
		);
	}

	return (
		<div
			ref={containerRef}
			className="relative w-full overflow-hidden rounded-lg bg-black"
			style={{
				paddingBottom: '56.25%', // Default 16:9 aspect ratio
				minHeight: '200px',
			}}
		>
			<video
				ref={videoRef}
				className="absolute inset-0 h-full w-full"
				controls
				playsInline
				preload="metadata"
				onEnded={handleVideoEnd}
				onTimeUpdate={handleTimeUpdate}
				onLoadedMetadata={handleLoadedMetadata}
				aria-label="Video del curso"
				controlsList="nodownload" // Prevent download
			>
				<source src={videoUrl} type="video/mp4" />
				<track kind="captions" srcLang="es" label="Español" />
				Tu navegador no soporta la reproducción de videos.
			</video>
		</div>
	);
};

export default VideoPlayer;
