'use server';

import { currentUser } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import {
	enrollments,
	userLessonsProgress,
	lessons,
	users,
} from '~/server/db/schema';

export interface EnrolledCourse {
	id: number;
	title: string;
	instructorName: string;
	coverImageKey: string | null;
	progress: number;
	rating: number;
	category: {
		name: string;
	} | null;
}

export async function getEnrolledCourses(): Promise<EnrolledCourse[]> {
	try {
		const user = await currentUser();
		if (!user?.id) throw new Error('Usuario no autenticado');

		// Get enrolled courses with category relation
		const enrolledCourses = await db.query.enrollments.findMany({
			where: eq(enrollments.userId, user.id),
			with: {
				course: {
					with: {
						category: true, // Include category relation
					},
				},
			},
		});

		// Get progress for each course
		const coursesWithProgress = await Promise.all(
			enrolledCourses.map(async (enrollment) => {
				// Get all lessons for this course
				const courseLessons = await db.query.lessons.findMany({
					where: eq(lessons.courseId, enrollment.courseId),
				});

				// Get progress for all lessons in this course
				const lessonsProgress = await db.query.userLessonsProgress.findMany({
					where: eq(userLessonsProgress.userId, user.id),
				});

				// Calculate overall course progress
				const totalLessons = courseLessons.length;
				const completedLessons = lessonsProgress.filter(
					(progress) =>
						progress.isCompleted &&
						courseLessons.some((lesson) => lesson.id === progress.lessonId)
				).length;

				const progress =
					totalLessons > 0
						? Math.round((completedLessons / totalLessons) * 100)
						: 0;

				// Fetch instructor name
				const instructor = await db.query.users.findFirst({
					where: eq(users.id, enrollment.course.instructor),
				});

				const instructorName = instructor
					? `${instructor.name}`
					: 'Unknown Instructor';

				return {
					id: enrollment.courseId,
					title: enrollment.course.title,
					instructorName: instructorName,
					coverImageKey: enrollment.course.coverImageKey,
					progress,
					rating: enrollment.course.rating ?? 0,
					category: enrollment.course.category
						? {
								name: enrollment.course.category.name,
							}
						: null,
				};
			})
		);

		return coursesWithProgress;
	} catch (error) {
		console.error('Error fetching enrolled courses:', error);
		throw new Error('Error al obtener los cursos inscritos');
	}
}
