import { useEffect, useState, useRef } from 'react';

import { Lock } from 'lucide-react';
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
	const [error, setError] = useState('');
	const videoRef = useRef<HTMLVideoElement>(null);
	const [posterUrl, setPosterUrl] = useState<string | undefined>(undefined);

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

	useEffect(() => {
		const checkPosterExists = async () => {
			if (videoKey && isVideoReady) {
				const posterUrl = `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${videoKey.replace('.mp4', '-poster.jpg')}`;
				try {
					const response = await fetch(posterUrl, { method: 'HEAD' });
					if (response.ok) {
						setPosterUrl(posterUrl);
					} else {
						setPosterUrl(undefined);
					}
				} catch {
					setPosterUrl(undefined);
				}
			}
		};

		void checkPosterExists();
	}, [videoKey, isVideoReady]);

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

	const handleVideoCanPlay = () => {
		setIsVideoReady(true);
	};

	if (isLoading) {
		return (
			<div className="flex h-[400px] items-center justify-center bg-gray-900">
				<div className="flex flex-col items-center">
					<Icons.spinner className="mb-4 h-8 w-8 animate-spin text-blue-500" />
					<p className="text-sm text-gray-400">Cargando video...</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-lg">
				<div className="absolute inset-0 bg-gradient-to-r from-[#3498db] to-[#2ecc71] shadow-lg" />
				<div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.1)1px,transparent_1px),linear-gradient(rgba(255,255,255,0.1)1px,transparent_1px)] bg-[length:20px_20px]" />
				<div className="z-10 flex flex-col items-center justify-center space-y-6 px-4 text-center">
					<div className="animate-bounce rounded-full bg-gray-700/50 p-6 backdrop-blur-sm">
						<Lock className="h-12 w-12 text-yellow-500" />
					</div>
					<div className="space-y-3">
						<h3 className="text-3xl font-bold text-white">
							Contenido Bloqueado
						</h3>
						<p className="max-w-sm font-semibold text-gray-700">
							{error === 'Esta clase está bloqueada'
								? 'Completa las clases anteriores para desbloquear este contenido'
								: error}
						</p>
					</div>
					<div className="mt-2 h-1 w-16 rounded bg-yellow-500" />
				</div>
			</div>
		);
	}

	return (
		<div className="relative flex aspect-video w-full items-center justify-center">
			<Player
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
					visibility: isVideoReady ? 'visible' : 'hidden', // Hide player until ready
				}}
				{...(!isVideoReady && {
					'aria-busy': true,
					'aria-label': 'Cargando video de la clase...',
				})}
			/>
			{!isVideoReady && (
				<div className="absolute inset-0 z-50 flex aspect-video w-full items-center justify-center rounded-lg bg-gray-900">
					<div className="relative flex h-full w-full flex-col items-center justify-center">
						<div className="absolute inset-0 bg-gradient-to-r from-[#3498db] to-[#2ecc71] shadow-lg" />
						<div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.1)1px,transparent_1px),linear-gradient(rgba(255,255,255,0.1)1px,transparent_1px)] bg-[length:20px_20px] opacity-50" />
						<div className="z-10 flex flex-col items-center justify-center space-y-4">
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
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default VideoPlayer;
