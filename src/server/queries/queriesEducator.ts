'use server';
import { clerkClient } from '@clerk/nextjs/server'; // Clerk Client
import { eq } from 'drizzle-orm';
import { db } from '~/server/db';
import { enrollments } from '~/server/db/schema';

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

	const simplifiedUsers = filteredUsers.map((user) => ({
		id: user.id,
		firstName: user.firstName,
		lastName: user.lastName,
		email: user.emailAddresses.find(
			(email) => email.id === user.primaryEmailAddressId
		)?.emailAddress,
		role: user.publicMetadata.role || 'estudiante',
		status: user.publicMetadata.status || 'activo',
	}));
	console.log(`Usuarios inscritos en el curso ${courseId}:`, simplifiedUsers);
	return simplifiedUsers;
}
