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
				console.log('Fetching video from URL:', url);
				const response = await fetch(url);

				if (!response.ok) {
					if (response.status === 403) {
						setError('No tienes acceso a este video');
					} else {
						setError('Error al cargar el video');
					}
					setVideoUrl('');
				} else {
					setVideoUrl(url);
					setError('');
				}
			} catch (err) {
				console.error('Error fetching video:', err);
				setError('Error al cargar el video');
				setVideoUrl('');
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

	if (isLoading) {
		return (
			<div className="flex h-[400px] items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex h-[400px] items-center justify-center">
				<p className="text-center text-gray-600">{error}</p>
			</div>
		);
	}

	return (
		<div className="flex items-center justify-center">
			<video
				ref={videoRef}
				controls
				className="h-auto w-full rounded-lg"
				onEnded={handleVideoEnd}
				onTimeUpdate={handleTimeUpdate}
			>
				<source src={videoUrl} type="video/mp4" />
				Tu navegador no soporta la reproducción de videos.
			</video>
		</div>
	);
};

export default VideoPlayer;
