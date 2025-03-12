'use server';
import { clerkClient } from '@clerk/nextjs/server'; // Clerk Client
import { eq, and } from 'drizzle-orm';
import { db } from '~/server/db';
import { enrollments, userLessonsProgress } from '~/server/db/schema';

// Función para obtener usuarios inscritos en un curso específico
export async function getUsersEnrolledInCourse(courseId: number) {
	const client = await clerkClient();
	const usersResponse = await client.users.getUserList({ limit: 100 });
	const users = usersResponse.data;

	const enrolledUsers = await db
		.select({
			userId: enrollments.userId,
			courseId: enrollments.courseId,
		})
		.from(enrollments)
		.where(eq(enrollments.courseId, courseId));

	const userIds = enrolledUsers.map((enrollment) => enrollment.userId);

	const filteredUsers = users.filter((user) => userIds.includes(user.id));

	const simplifiedUsers = await Promise.all(
		filteredUsers.map(async (user) => {
			const lessonsProgress = await db
				.select({
					lessonId: userLessonsProgress.lessonId,
					progress: userLessonsProgress.progress,
					isCompleted: userLessonsProgress.isCompleted,
				})
				.from(userLessonsProgress)
				.where(
					and(
						eq(userLessonsProgress.userId, user.id)
						// eq(userLessonsProgress.courseId, courseId)
					)
				);

			return {
				id: user.id,
				firstName: user.firstName,
				lastName: user.lastName,
				email: user.emailAddresses.find(
					(email) => email.id === user.primaryEmailAddressId
				)?.emailAddress,
				createdAt: user.createdAt,
				role: user.publicMetadata.role || 'estudiante',
				status: user.publicMetadata.status || 'activo',
				lastConnection: user.lastActiveAt, // Añadir última fecha de conexión
				lessonsProgress: lessonsProgress.map((lesson) => ({
					lessonId: lesson.lessonId,
					progress: lesson.progress,
					isCompleted: lesson.isCompleted,
				})),
			};
		})
	);

	console.log(
		`Usuarios inscritos en el curso ${courseId} y progreso:`,
		simplifiedUsers,
		enrolledUsers
	);
	return simplifiedUsers;
}