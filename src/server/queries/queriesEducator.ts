'use server';
import { clerkClient } from '@clerk/nextjs/server'; // Clerk Client
import { eq } from 'drizzle-orm';

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
		enrolledAt: enrollments.enrolledAt, // <-- AÑADIDO
	})	
		.from(enrollments)
		.where(eq(enrollments.courseId, courseId));

	const userIds = enrolledUsers.map((enrollment) => enrollment.userId);

	const filteredUsers = users.filter((user) => userIds.includes(user.id));

	const simplifiedUsers = await Promise.all(
		filteredUsers.map(async (user) => {
		  const enrollment = enrolledUsers.find(e => e.userId === user.id); // ← esta línea es clave
	  
		  const lessonsProgress = await db
			.select({
			  lessonId: userLessonsProgress.lessonId,
			  progress: userLessonsProgress.progress,
			  isCompleted: userLessonsProgress.isCompleted,
			})
			.from(userLessonsProgress)
			.where(eq(userLessonsProgress.userId, user.id));
	  
		  return {
			id: user.id,
			firstName: user.firstName,
			lastName: user.lastName,
			email: user.emailAddresses.find(
			  (email) => email.id === user.primaryEmailAddressId
			)?.emailAddress,
			createdAt: user.createdAt,
			enrolledAt: enrollment?.enrolledAt ?? null, // ← 👈 esto agrega la fecha de inscripción
			role: user.publicMetadata.role ?? 'estudiante',
			status: user.publicMetadata.status ?? 'activo',
			lastConnection: user.lastActiveAt,
			lessonsProgress: lessonsProgress.map((lesson) => ({
			  lessonId: lesson.lessonId,
			  progress: lesson.progress,
			  isCompleted: lesson.isCompleted,
			})),
		  };
		})
	  );
	  
	
	return simplifiedUsers;
}
