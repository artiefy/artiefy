import { Header } from '~/components/estudiantes/layout/Header';
import { LessonSkeleton } from '~/components/estudiantes/layout/lessondetail/LessonDetailsSkeleton';

export default function SkeletonTestPage() {
	return (
		<>
			<Header />
			<div className="mt-7">
				<main>
					<LessonSkeleton />
				</main>
			</div>
		</>
	);
}
