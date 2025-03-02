'use server';

import { eq } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';
import { db } from '~/server/db';
import { courses, userLessonsProgress } from '~/server/db/schema';
import type { Course } from '~/types';

const getCourseById = unstable_cache(
	async (courseId: number, userId: string | null): Promise<Course | null> => {
		const course = await db.query.courses.findFirst({
			where: eq(courses.id, courseId),
			with: {
				category: true,
				modalidad: true,
				dificultad: true,
				lessons: {
					with: {
						activities: true,
					},
				},
				enrollments: true,
			},
		});

		if (!course) {
			return null;
		}

		const userLessonsProgressData = userId
			? await db.query.userLessonsProgress.findMany({
					where: eq(userLessonsProgress.userId, userId),
				})
			: [];

		// Manually sort lessons in ascending order by title
		course.lessons.sort((a, b) => a.title.localeCompare(b.title));

		const transformedCourse: Course = {
			...course,
			totalStudents: course.enrollments?.length ?? 0,
			lessons:
				course.lessons?.map((lesson) => {
					const lessonProgress = userLessonsProgressData.find(
						(progress) => progress.lessonId === lesson.id
					);
					return {
						...lesson,
						isLocked: lessonProgress ? lessonProgress.isLocked : true,
						isCompleted: lessonProgress ? lessonProgress.isCompleted : false,
						userProgress: lessonProgress ? lessonProgress.progress : 0,
						porcentajecompletado: lessonProgress ? lessonProgress.progress : 0,
						resourceNames: lesson.resourceNames
							? lesson.resourceNames.split(',')
							: [], // Convertir texto a array
						activities:
							lesson.activities?.map((activity) => ({
								...activity,
								isCompleted: false,
								userProgress: 0,
								typeid: activity.typeid,
							})) ?? [],
					};
				}) ?? [],
		};

		return transformedCourse;
	},
	['course-content'],
	{ revalidate: 3600 }
);

export { getCourseById };
