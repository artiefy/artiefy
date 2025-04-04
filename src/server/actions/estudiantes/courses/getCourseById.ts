'use server';

import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import {
	courses,
	userLessonsProgress,
	categories,
	modalidades,
	nivel,
	courseTypes,
	users,
} from '~/server/db/schema';

import type { Course, Activity, Lesson } from '~/types';

// Update interface with all required fields
interface CourseDetailQueryResult {
	id: number;
	title: string | null;
	description: string | null;
	coverImageKey: string | null;
	categoryid: number;
	instructor: string;
	instructorName: string | null;
	createdAt: Date;
	updatedAt: Date;
	creatorId: string;
	rating: number | null;
	modalidadesid: number;
	nivelid: number;
	isActive: boolean | null;
	requiresProgram: boolean | null;
	courseTypeId: number | null;
}

export async function getCourseById(
	courseId: number | string,
	userId: string | null = null
): Promise<Course | null> {
	try {
		const parsedCourseId = Number(courseId);
		if (isNaN(parsedCourseId)) {
			console.error('Invalid course ID:', courseId);
			return null;
		}

		// Use the interface to type the query result
		const [courseData] = (await db
			.select({
				id: courses.id,
				title: courses.title,
				description: courses.description,
				coverImageKey: courses.coverImageKey,
				categoryid: courses.categoryid,
				instructor: courses.instructor,
				instructorName: users.name,
				createdAt: courses.createdAt,
				updatedAt: courses.updatedAt,
				creatorId: courses.creatorId,
				rating: courses.rating,
				modalidadesid: courses.modalidadesid,
				nivelid: courses.nivelid,
				isActive: courses.isActive,
				requiresProgram: courses.requiresProgram,
				courseTypeId: courses.courseTypeId,
			})
			.from(courses)
			.leftJoin(categories, eq(categories.id, courses.categoryid))
			.leftJoin(modalidades, eq(modalidades.id, courses.modalidadesid))
			.leftJoin(nivel, eq(nivel.id, courses.nivelid))
			.leftJoin(courseTypes, eq(courseTypes.id, courses.courseTypeId))
			.leftJoin(users, eq(courses.instructor, users.id))
			.where(eq(courses.id, parsedCourseId))) as CourseDetailQueryResult[];

		if (!courseData) {
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
			instructor: courseData.instructor,
			instructorName: courseData.instructorName ?? 'Instructor no encontrado',
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
