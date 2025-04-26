import { useEffect, useState, useRef } from 'react';

import Player from 'next-video/player';

import { Icons } from '~/components/estudiantes/ui/icons';
import '~/styles/videoloading.css';

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
	const [isVideoReady, setIsVideoReady] = useState(false);
	const videoRef = useRef<HTMLVideoElement>(null);
	const [posterUrl, setPosterUrl] = useState<string | undefined>(undefined);
	const [isVideoAvailable, setIsVideoAvailable] = useState(false);

	useEffect(() => {
		const checkVideoAvailability = async () => {
			if (!videoKey || videoKey === 'null') {
				setIsVideoAvailable(false);
				setIsLoading(false);
				return;
			}

			try {
				const url = `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${videoKey}`;
				const response = await fetch(url, { method: 'HEAD' });

				if (response.ok) {
					setIsVideoAvailable(true);
					setVideoUrl(url); // Usar directamente la URL del video
					setIsLoading(false);
				} else {
					setIsVideoAvailable(false);
					setIsLoading(false);
				}
			} catch (err) {
				console.error('Error checking video:', err);
				setIsVideoAvailable(false);
				setIsLoading(false);
			}
		};

		void checkVideoAvailability();
	}, [videoKey]);

	useEffect(() => {
		if (videoKey && isVideoReady) {
			const posterUrl = `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${videoKey.replace('.mp4', '-poster.jpg')}`;
			setPosterUrl(posterUrl);
		}
	}, [videoKey, isVideoReady]);

	const handleTimeUpdate = () => {
		if (videoRef.current && !isVideoCompleted) {
			const currentTime = videoRef.current.currentTime;
			const duration = videoRef.current.duration;
			if (duration > 0) {
				const progress = Math.round((currentTime / duration) * 100);
				onProgressUpdate(progress);
			}
		}
	};

	const handleVideoEnd = () => {
		onVideoEnd();
	};

	const handleVideoCanPlay = () => {
		setIsVideoReady(true);
	};

	const renderLoadingState = () => (
		<div className="absolute inset-0 z-50 flex aspect-video w-full items-center justify-center overflow-hidden rounded-lg">
			<div className="absolute inset-0">
				<div className="absolute inset-0 bg-gradient-to-r from-[#3498db] to-[#2ecc71] shadow-lg" />
				<div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.1)1px,transparent_1px),linear-gradient(rgba(255,255,255,0.1)1px,transparent_1px)] bg-[length:20px_20px] opacity-50" />
			</div>
			<div className="relative z-10 flex flex-col items-center justify-center space-y-6 text-center">
				{!videoKey || videoKey === 'null' || !isVideoAvailable || isLocked ? (
					<>
						<h2 className="animate-pulse text-4xl font-bold tracking-tight text-white">
							Video de la Clase
						</h2>
						<p className="text-5xl font-extrabold">
							<span className="bg-gradient-to-r from-slate-800 to-slate-900 bg-clip-text text-transparent">
								Disponible muy pronto
							</span>
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
								<div className="hourglassGlassTop" />
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

	if (isLoading) {
		return (
			<div className="flex aspect-video w-full items-center justify-center bg-gray-900">
				<div className="flex flex-col items-center">
					<Icons.spinner className="mb-4 h-8 w-8 animate-spin text-blue-500" />
					<p className="text-sm text-gray-400">Cargando video...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="relative aspect-video w-full">
			{videoUrl && (
				<Player
					ref={videoRef}
					src={videoUrl}
					className="h-full w-full rounded-lg"
					onEnded={handleVideoEnd}
					onTimeUpdate={handleTimeUpdate}
					onCanPlay={handleVideoCanPlay}
					controls
					playsInline
					poster={posterUrl}
					style={{
						'--media-primary-color': '#3AF4EF',
						'--media-secondary-color': '#00BDD8',
						'--media-accent-color': '#2ecc71',
						visibility: isVideoReady ? 'visible' : 'hidden',
					}}
					{...(!isVideoReady && {
						'aria-busy': true,
						'aria-label': 'Cargando video de la clase...',
					})}
				/>
			)}
			{(!videoUrl || !isVideoReady) && renderLoadingState()}
		</div>
	);
};

export default VideoPlayer;
