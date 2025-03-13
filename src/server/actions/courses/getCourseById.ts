'use server';

import { unstable_cache } from 'next/cache';

import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { courses, userLessonsProgress } from '~/server/db/schema';

import type { Course, Activity } from '~/types';

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
						isLocked: lessonProgress?.isLocked ?? true,
						isCompleted: lessonProgress?.isCompleted ?? false,
						userProgress: lessonProgress?.progress ?? 0,
						porcentajecompletado: lessonProgress?.progress ?? 0,
						isNew: false, // Add default value for isNew
						resourceNames: lesson.resourceNames
							? lesson.resourceNames.split(',')
							: [], // Convertir texto a array
						activities:
							lesson.activities?.map(
								(activity): Activity => ({
									...activity,
									isCompleted: false,
									userProgress: 0,
									revisada: activity.revisada ?? false, // Convertir null a false
									porcentaje: activity.porcentaje ?? 0,
									parametroId: activity.parametroId ?? null,
									fechaMaximaEntrega: activity.fechaMaximaEntrega ?? null,
									createdAt: activity.lastUpdated, // Use lastUpdated as createdAt
									content: { questions: [] }, // Add default content if needed
								})
							) ?? [],
					};
				}) ?? [],
		};

		return transformedCourse;
	},
	['course-details'],
	{
		revalidate: 3600, // Cache por 1 hora
		tags: ['course-details'],
	}
);

export { getCourseById };