import { useEffect, useState, useRef } from 'react';

import Player from 'next-video/player';

interface VideoPlayerProps {
	videoKey: string;
	onVideoEnd: () => void;
	onProgressUpdate: (progress: number) => void;
	isVideoCompleted: boolean;
	isLocked?: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
	videoKey,
	onVideoEnd,
	onProgressUpdate,
	isVideoCompleted,
	isLocked = false,
}) => {
	const [videoUrl, setVideoUrl] = useState('');
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState('');
	const videoRef = useRef<HTMLVideoElement>(null);

	useEffect(() => {
		const fetchVideoUrl = async () => {
			setIsLoading(true);
			setError('');

			if (isLocked) {
				setError('Esta clase está bloqueada');
				setIsLoading(false);
				return;
			}

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
	}, [videoKey, isLocked]);

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
			<div className="relative flex h-[400px] items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-gray-800 to-gray-900">
				<div className="z-10 flex flex-col items-center justify-center space-y-4 px-4 text-center">
					<div className="animate-bounce rounded-full bg-gray-700 p-6">
						<svg
							className="h-12 w-12 text-yellow-500"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M12 15v2m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0z"
							/>
						</svg>
					</div>
					<h3 className="text-2xl font-bold text-white">Contenido Bloqueado</h3>
					<p className="max-w-sm text-gray-300">
						{error === 'Esta clase está bloqueada'
							? 'Completa las clases anteriores para desbloquear este contenido'
							: error}
					</p>
					<div className="mt-2 h-1 w-16 rounded bg-yellow-500" />
				</div>
				<div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-10" />
			</div>
		);
	}

	return (
		<div className="flex items-center justify-center">
			<Player
				src={videoUrl}
				className="h-auto w-full rounded-lg"
				onEnded={handleVideoEnd}
				onTimeUpdate={handleTimeUpdate}
				controls
			/>
		</div>
	);
};

export default VideoPlayer;
