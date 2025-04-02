'use server';

import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { courses, userLessonsProgress } from '~/server/db/schema';

import type { Course, Activity, Lesson } from '~/types';

export async function getCourseById(
	courseId: number | string,
	userId: string | null = null
): Promise<Course | null> {
	try {
		// Parse and validate courseId
		const parsedCourseId = Number(courseId);
		if (isNaN(parsedCourseId)) {
			console.error('Invalid course ID:', courseId);
			return null;
		}

		const course = await db.query.courses.findFirst({
			where: eq(courses.id, parsedCourseId),
			with: {
				category: true,
				modalidad: true,
				nivel: true,
				lessons: {
					with: {
						activities: {
							columns: {
								id: true,
								name: true,
								description: true,
								lessonsId: true,
								revisada: true,
								parametroId: true,
								porcentaje: true,
								fechaMaximaEntrega: true,
								lastUpdated: true,
								typeid: true,
							},
						},
					},
				},
				enrollments: true,
				materias: {
					with: {
						programa: true, // Asegurarse de incluir la información del programa
						curso: true,
					},
				},
				courseType: true, // Add this relation
			},
		});

		if (!course) {
			return null;
		}

		// If userId exists, get progress data
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

				// Fix activity transformation with proper typing
				const activities: Activity[] =
					lesson.activities?.map((activity) => {
						const now = new Date();
						return {
							id: activity.id,
							name: activity.name,
							description: activity.description,
							lessonsId: lesson.id,
							isCompleted: false,
							userProgress: 0,
							revisada: activity.revisada ?? false,
							porcentaje: activity.porcentaje ?? 0,
							parametroId: activity.parametroId,
							fechaMaximaEntrega: activity.fechaMaximaEntrega,
							createdAt: now,
							typeid: activity.typeid,
							lastUpdated: activity.lastUpdated,
							attemptLimit: 3,
							currentAttempts: 0,
						} satisfies Activity;
					}) ?? [];

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
				programaId: materia.programaId ?? null,
				programa: materia.programa
					? {
							id: materia.programa.id.toString(),
							title: materia.programa.title,
						}
					: undefined,
				courseid: materia.courseid,
				totalStudents: 0, // Default value
				lessons: [], // Default empty array
			})),
			category: course.category
				? {
						...course.category,
						is_featured: course.category.is_featured ?? null,
					}
				: undefined,
			isFree: course.courseType?.requiredSubscriptionLevel === 'none',
			requiresSubscription:
				course.courseType?.requiredSubscriptionLevel !== 'none',
			courseType: course.courseType
				? {
						requiredSubscriptionLevel:
							course.courseType.requiredSubscriptionLevel,
						isPurchasableIndividually:
							course.courseType.isPurchasableIndividually ?? false,
					}
				: undefined,
			requiresProgram: Boolean(course.requiresProgram), // Ensure it's always boolean
			isActive: Boolean(course.isActive), // Also ensure isActive is always boolean
		};

		return transformedCourse;
	} catch (error) {
		console.error(
			'Error fetching course:',
			error instanceof Error ? error.message : 'Unknown error'
		);
		return null;
	}
}
