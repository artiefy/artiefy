import { auth } from '@clerk/nextjs/server';
import { notFound } from 'next/navigation';
import { getActivityContent } from '~/server/actions/estudiantes/activities/getActivityContent';
import { getCourseById } from '~/server/actions/estudiantes/courses/getCourseById';
import { getLessonById } from '~/server/actions/estudiantes/lessons/getLessonById';
import { getLessonsByCourseId } from '~/server/actions/estudiantes/lessons/getLessonsByCourseId';
import { getUserLessonsProgress } from '~/server/actions/estudiantes/progress/getUserLessonsProgress';
import type { Activity, LessonWithProgress } from '~/types';
import LessonDetails from './LessonDetails';

interface PageProps {
	params: Promise<{
		id: string;
	}>;
}

export default async function LessonPage({ params }: PageProps) {
	const { id } = await params;

	if (!id) {
		return notFound();
	}

	const { userId, redirectToSignIn } = await auth();

	if (!userId) {
		return redirectToSignIn();
	}

	return LessonContent({ id, userId });
}

async function LessonContent({ id, userId }: { id: string; userId: string }) {
	try {
		const lessonId = Number.parseInt(id, 10);
		if (isNaN(lessonId)) {
			return notFound();
		}

		const lessonData = await getLessonById(lessonId, userId);
		if (!lessonData) {
			console.log('Lección no encontrada');
			return notFound();
		}

		const lesson: LessonWithProgress = {
			...lessonData,
			isLocked: lessonData.isLocked ?? false,
		};

		const activityContent = await getActivityContent(lessonId, userId);
		const activity: Activity | null =
			activityContent.length > 0
				? {
						...activityContent[0],
						isCompleted: activityContent[0].isCompleted ?? false,
						userProgress: activityContent[0].userProgress ?? 0,
					}
				: null;

		const course = await getCourseById(lesson.courseId, userId);
		if (!course) {
			console.log('Curso no encontrado');
			return notFound();
		}

		const [lessons, userProgress] = await Promise.all([
			getLessonsByCourseId(lesson.courseId, userId),
			getUserLessonsProgress(userId),
		]);

		const { lessonsProgress, activitiesProgress } = userProgress;

		const lessonsWithProgress = lessons.map((lesson) => {
			const lessonProgress = lessonsProgress.find(
				(progress) => progress.lessonId === lesson.id
			);

			return {
				...lesson,
				porcentajecompletado: lessonProgress?.progress ?? 0,
				isLocked: lessonProgress?.isLocked ?? true,
				isCompleted: lessonProgress?.isCompleted ?? false,
			};
		});

		return (
			<LessonDetails
				lesson={lesson}
				activity={activity}
				lessons={lessonsWithProgress}
				userLessonsProgress={lessonsProgress}
				userActivitiesProgress={activitiesProgress}
				userId={userId}
			/>
		);
	} catch (error: unknown) {
		console.error(
			'Error al obtener los datos de la lección:',
			error instanceof Error ? error.message : String(error)
		);
		return notFound();
	}
}

export const revalidate = 60;
