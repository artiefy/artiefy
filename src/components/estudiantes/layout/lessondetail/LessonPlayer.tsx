import { Progress } from '~/components/estudiantes/ui/progress';
import { type LessonWithProgress } from '~/types';

import VideoPlayer from './LessonVideo';

interface LessonPlayerProps {
	lesson: LessonWithProgress;
	progress: number;
	handleVideoEnd: () => void;
	handleProgressUpdate: (videoProgress: number) => void;
}

const LessonPlayer = ({
	lesson,
	progress,
	handleVideoEnd,
	handleProgressUpdate,
}: LessonPlayerProps) => {
	const isLocked = lesson.isLocked === true;

	if (isLocked) {
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
					<h3 className="text-2xl font-bold text-white">Clase Bloqueada</h3>
					<p className="max-w-sm text-gray-300">
						Completa las clases anteriores para desbloquear esta lección
					</p>
					<div className="mt-2 h-1 w-16 rounded bg-yellow-500" />
				</div>
				<div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-10" />
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-4xl">
			<div className="relative mb-6 aspect-video overflow-hidden rounded-lg bg-black">
				<VideoPlayer
					videoKey={lesson.coverVideoKey}
					onVideoEnd={handleVideoEnd}
					onProgressUpdate={handleProgressUpdate}
					isVideoCompleted={progress === 100}
					isLocked={isLocked}
				/>
			</div>
			<div className="rounded-lg bg-white p-6 shadow-xs">
				<h1 className="mb-4 text-2xl font-bold text-gray-900">
					{lesson.title}
				</h1>
				<p className="text-gray-600">{lesson.description}</p>

				<div className="mt-6">
					<div className="mb-2 flex items-center justify-between">
						<span className="font-bold text-gray-700">
							Progreso de la clase
						</span>
						<span className="text-gray-600">{progress}%</span>
					</div>
					<Progress value={progress} showPercentage={true} />
				</div>
			</div>
		</div>
	);
};

export default LessonPlayer;
