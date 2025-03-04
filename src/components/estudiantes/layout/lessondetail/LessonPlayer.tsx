import VideoPlayer from '~/components/estudiantes/layout/lessondetail/LessonVideo';
import { Progress } from '~/components/estudiantes/ui/progress';
import { type LessonWithProgress } from '~/types';

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
	if (lesson.isLocked) {
		return (
			<div className="flex h-[400px] items-center justify-center rounded-lg bg-gray-100">
				<div className="text-center">
					<div className="mb-4 text-6xl">🔒</div>
					<h3 className="mb-2 text-xl font-semibold text-gray-800">
						Clase Bloqueada
					</h3>
					<p className="text-gray-600">
						Completa las clases anteriores para desbloquear esta lección
					</p>
				</div>
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
				/>
			</div>
			<div className="rounded-lg bg-white p-6 shadow-xs">
				<h1 className="mb-4 text-2xl font-bold text-gray-900">
					{lesson.title}
				</h1>
				<p className="text-gray-600">{lesson.description}</p>
				<div className="mt-4">
					<div className="mb-2 flex items-center justify-between">
						<span className="font-bold text-gray-700">
							Progreso de la clase :
						</span>
						<span className="text-gray-600"></span>
					</div>
					<Progress value={progress} showPercentage={true} />
				</div>
			</div>
		</div>
	);
};

export default LessonPlayer;
