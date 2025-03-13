'use server';

import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { courses, userLessonsProgress } from '~/server/db/schema';

import type { Course, Activity, Lesson } from '~/types';

export async function getCourseById(
	courseId: number,
	userId: string | null
): Promise<Course | null> {
	try {
		const course = await db.query.courses.findFirst({
			where: eq(courses.id, courseId),
			with: {
				category: true,
				modalidad: true,
				nivel: true,
				lessons: {
					with: {
						activities: true,
					},
				},
				enrollments: true,
				materias: true, // Añadir esta línea para incluir las materias
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

		// Transform lessons with proper typing
		const transformedLessons: Lesson[] = course.lessons
			.sort((a, b) => a.title.localeCompare(b.title))
			.map((lesson) => {
				const lessonProgress = userLessonsProgressData.find(
					(progress) => progress.lessonId === lesson.id
				);

				const activities: Activity[] =
					lesson.activities?.map((activity) => ({
						...activity,
						lessonsId: lesson.id,
						isCompleted: false,
						userProgress: 0,
						revisada: activity.revisada ?? false,
						porcentaje: activity.porcentaje ?? 0,
						parametroId: activity.parametroId,
						fechaMaximaEntrega: activity.fechaMaximaEntrega,
						createdAt: activity.lastUpdated,
						content: { questions: [] },
					})) ?? [];

				return {
					...lesson,
					isLocked: lessonProgress?.isLocked ?? true,
					isCompleted: lessonProgress?.isCompleted ?? false,
					userProgress: lessonProgress?.progress ?? 0,
					porcentajecompletado: lessonProgress?.progress ?? 0,
					resourceNames: lesson.resourceNames.split(','),
					isNew: lessonProgress?.isNew ?? true,
					activities,
				};
			});

		// Build final course object
		const transformedCourse: Course = {
			...course,
			totalStudents: course.enrollments?.length ?? 0,
			lessons: transformedLessons,
			requerimientos: [],
			materias: course.materias?.map((materia) => ({
				id: materia.id,
				title: materia.title,
				description: materia.description,
				programaId: materia.programaId,
				courseid: materia.courseid,
			})),
			category: course.category
				? {
						...course.category,
						is_featured: course.category.is_featured ?? null,
					}
				: undefined,
		};

		return transformedCourse;
	} catch (error) {
		console.error('Error fetching course:', error);
		return null;
	}
}
