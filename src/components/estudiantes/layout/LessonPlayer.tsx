import VideoPlayer from '~/components/estudiantes/layout/VideoPlayer';
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
						<span className="text-gray-700">Progreso de la clase</span>
						<span className="text-gray-600">{progress}%</span>
					</div>
					<Progress value={progress} className="h-2" />
				</div>
			</div>
		</div>
	);
};

export default LessonPlayer;
