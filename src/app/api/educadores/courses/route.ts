import { type NextRequest, NextResponse } from 'next/server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';

import {
	createCourse,
	deleteCourse,
	getAllCourses,
	getCourseById,
	getCoursesByUserId,
	updateCourse,
	getTotalStudents,
	getLessonsByCourseId,
	getTotalDuration,
} from '~/models/educatorsModels/courseModelsEducator';
import { getSubjects } from '~/models/educatorsModels/subjectModels'; // Import the function to get subjects
import { getUserById, createUser } from '~/models/educatorsModels/userModels'; // Importa las funciones necesarias para manejar usuarios
import { db } from '~/server/db';
import { materias } from '~/server/db/schema';
import { ratelimit } from '~/server/ratelimit/ratelimit';

export const dynamic = 'force-dynamic';

const respondWithError = (message: string, status: number) =>
	NextResponse.json({ error: message }, { status });

// Función para verificar si el usuario es nuevo y agregarlo a la tabla users
async function ensureUserExists(userId: string) {
	const user = await getUserById(userId);
	if (!user) {
		const clerkUser = await currentUser();
		if (clerkUser) {
			await createUser(
				userId,
				'educador', // Asigna un rol por defecto, ajusta según sea necesario
				`${clerkUser.firstName} ${clerkUser.lastName}`,
				clerkUser.emailAddresses[0].emailAddress
			);
		}
	}
}

// GET endpoint para obtener un curso por su ID
export async function GET(req: NextRequest) {
	const { searchParams } = new URL(req.url);
	const courseId = searchParams.get('courseId');
	const userId = searchParams.get('userId');
	const fetchSubjects = searchParams.get('fetchSubjects'); // Check if fetchSubjects is requested
	console.log('CourseId en api route', courseId);
	console.log('FetchSubjects:', fetchSubjects); // Add console log to debug

	try {
		if (fetchSubjects) {
			const subjects = await getSubjects();
			console.log('Fetched subjects from DB:', subjects); // Add console log to debug
			return NextResponse.json(subjects);
		}
		let courses;
		if (courseId) {
			const course = await getCourseById(parseInt(courseId));
			const totalStudents = await getTotalStudents(parseInt(courseId));
			const lessons = await getLessonsByCourseId(parseInt(courseId));
			const totalDuration = await getTotalDuration(parseInt(courseId));

			if (!course) {
				return respondWithError('Curso no encontrado', 404);
			}
			courses = {
				...course,
				totalStudents,
				totalDuration,
				lessons,
			};
		} else if (userId) {
			courses = await getCoursesByUserId(userId);
		} else {
			courses = await getAllCourses();
		}
		console.log('Courses en api route', courses);
		return NextResponse.json(courses);
	} catch (error) {
		console.error('Error:', error);
		return NextResponse.json(
			{ error: 'Error al obtener los datos' },
			{ status: 500 }
		);
	}
}

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
			rating: number;
			creatorId: string;
			instructor: string;
			subjects?: { id: number }[];
		};

		const {
			title,
			description,
			coverImageKey,
			categoryid,
			modalidadesid,
			rating,
			nivelid,
			creatorId,
			instructor,
		} = body;
		const courseId = await createCourse({
			title,
			description,
			creatorId: userId,
			coverImageKey,
			categoryid,
			rating,
			modalidadesid,
			nivelid,
			instructor,
			courseTypeId: 1, // Replace with the appropriate value for courseTypeId
		});

		console.log('Datos enviados al servidor:', {
			title,
			description,
			coverImageKey,
			categoryid,
			creatorId,
			rating,
			modalidadesid,
			nivelid,
			instructor,
		});

		const id = courseId.id;
		for (const subject of body.subjects ?? []) {
			const existingMateria = await db
				.select()
				.from(materias)
				.where(eq(materias.id, subject.id))
				.then((res) => res[0]);

			if (!existingMateria) continue;

			if (existingMateria.courseid) {
				await db.insert(materias).values({
					title: existingMateria.title,
					description: existingMateria.description,
					programaId: existingMateria.programaId,
					courseid: id,
				});
			} else {
				await db
					.update(materias)
					.set({ courseid: id })
					.where(eq(materias.id, subject.id));
			}
		}

		return NextResponse.json({
			message: 'Curso creado exitosamente',
			id,
		});
	} catch (error: unknown) {
		console.error('Error al crear el curso:', error);
		const errorMessage =
			error instanceof Error ? error.message : 'Error desconocido';
		return respondWithError(`Error al crear el curso: ${errorMessage}`, 500);
	}
}

// Actualizar un curso
export async function PUT(request: NextRequest) {
	try {
		const { userId } = await auth();
		if (!userId) {
			return respondWithError('No autorizado', 403);
		}

		const body = (await request.json()) as {
			id: number;
			title: string;
			description: string;
			coverImageKey: string;
			categoryid: number;
			modalidadesid: number;
			nivelid: number;
			instructor: string;
		};
		const {
			id,
			title,
			description,
			coverImageKey,
			modalidadesid,
			nivelid,
			categoryid,
			instructor,
		} = body;

		const course = await getCourseById(id);
		if (!course) {
			return respondWithError('Curso no encontrado', 404);
		}

		if (course.creatorId !== userId) {
			return respondWithError('No autorizado para actualizar este curso', 403);
		}

		await updateCourse(id, {
			title,
			description,
			coverImageKey,
			categoryid,
			modalidadesid,
			instructor,
			nivelid,
		});

		return NextResponse.json({ message: 'Curso actualizado exitosamente' });
	} catch (error) {
		console.error('Error al actualizar el curso:', error);
		return respondWithError('Error al actualizar el curso', 500);
	}
}

// Eliminar un curso
export async function DELETE(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const courseId = searchParams.get('courseId');

		if (!courseId) {
			return NextResponse.json(
				{ error: 'ID no proporcionado' },
				{ status: 400 }
			);
		}

		const parsedCourseId = parseInt(courseId);
		await deleteCourse(parsedCourseId);
		return NextResponse.json({ message: 'Curso eliminado exitosamente' });
	} catch (error) {
		console.error('Error al eliminar el curso:', error);
		return NextResponse.json(
			{ error: 'Error al eliminar el curso' },
			{ status: 500 }
		);
	}
}
