import { auth, currentUser } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import { db } from '~/server/db';
import { courses, users } from '~/server/db/schema';
import { ratelimit } from '~/server/ratelimit/ratelimit';
export const dynamic = 'force-dynamic';

const respondWithError = (message: string, status: number) =>
	NextResponse.json({ error: message }, { status });

interface User {
	id: string;
	role: string;
	name: string | null;
	email: string;
	createdAt: Date;
	updatedAt: Date;
}

async function getUserById(id: string): Promise<User | null> {
	const result = await db
		.select({
			id: users.id,
			role: users.role,
			name: users.name,
			email: users.email,
			createdAt: users.createdAt,
			updatedAt: users.updatedAt,
		})
		.from(users)
		.where(eq(users.id, id))
		.limit(1);

	return result[0] ?? null;
}

async function createUser(user: {
	id: string;
	role: string;
	name: string;
	email: string;
}): Promise<void> {
	await db.insert(users).values(user);
}

async function ensureUserExists(userId: string) {
	const user = await getUserById(userId);
	if (!user) {
		const clerkUser = await currentUser();
		if (clerkUser) {
			await createUser({
				id: userId,
				role: 'super-admin', // Asigna un rol por defecto, ajusta según sea necesario
				email: clerkUser.emailAddresses[0].emailAddress,
				name: `${clerkUser.firstName} ${clerkUser.lastName}`,
			});
		}
	}
}

async function createCourse(course: {
	title: string;
	description: string;
	creatorId: string;
	coverImageKey: string;
	categoryid: number;
	modalidadesid: number;
	nivelid: number;
	instructor: string;
	requerimientos: string;
}): Promise<void> {
	await db.insert(courses).values(course);
}

// POST endpoint para crear cursos
export async function POST(request: NextRequest) {
	try {
		const { userId } = await auth();
		if (!userId) {
			return respondWithError('No autorizado', 403);
		}

		// Verificar si el usuario es nuevo y agregarlo a la tabla users
		await ensureUserExists(userId);

		// Implement rate limiting
		const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1';
		const { success } = await ratelimit.limit(ip);
		if (!success) {
			return respondWithError('Demasiadas solicitudes', 429);
		}

		const body = (await request.json()) as {
			title: string;
			description: string;
			coverImageKey: string;
			categoryid: number;
			modalidadesid: number;
			nivelid: number;
			creatorId: string;
			instructor: string;
			requerimientos: string;
		};
		console.log('📦 Datos recibidos en el servidor:', body);

		const {
			title,
			description,
			coverImageKey,
			categoryid,
			modalidadesid,
			nivelid,
			creatorId,
			instructor,
			requerimientos,
		} = body;

		console.log(`CreatorID en api route ${creatorId}`);
		await createCourse({
			title,
			description,
			creatorId: userId,
			coverImageKey,
			categoryid,
			modalidadesid,
			nivelid,
			instructor,
			requerimientos,
		});

		console.log('Datos enviados al servidor:', {
			title,
			description,
			coverImageKey,
			categoryid,
			creatorId,
			modalidadesid,
			nivelid,
			instructor,
			requerimientos,
		});

		return NextResponse.json({ message: 'Curso creado exitosamente' });
	} catch (error: unknown) {
		console.error('Error al crear el curso:', error);
		const errorMessage =
			error instanceof Error ? error.message : 'Error desconocido';
		return respondWithError(`Error al crear el curso: ${errorMessage}`, 500);
	}
}
