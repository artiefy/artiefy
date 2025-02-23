import { auth, currentUser } from '@clerk/nextjs/server';
import { type NextRequest, NextResponse } from 'next/server';
import {
	createCourse,
	deleteCourse,
	getAllCourses,
	getCourseById,
	getCoursesByUserId,
	updateCourse,
	getTotalStudents,
	getLessonsByCourseId,
} from '~/models/educatorsModels/courseModelsEducator';
import { getUserById, createUser } from '~/models/educatorsModels/userModels'; // Importa las funciones necesarias para manejar usuarios
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

	try {
		let courses;
		if (courseId) {
			const course = await getCourseById(parseInt(courseId));
			const totalStudents = await getTotalStudents(parseInt(courseId));
			const lessons = await getLessonsByCourseId(parseInt(courseId));
			if (!course) {
				return respondWithError('Curso no encontrado', 404);
			}
			if (course) {
				courses = { ...course, totalStudents, lessons };
			} else {
				courses = course;
			}
		} else if (userId) {
			courses = await getCoursesByUserId(userId);
		} else {
			courses = await getAllCourses();
		}
		return NextResponse.json(courses);
	} catch (error) {
		console.error('Error:', error);
		return NextResponse.json(
			{ error: 'Error al obtener los cursos' },
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
			dificultadid: number;
			creatorId: string;
			instructor: string;
			requerimientos: string;
		};

		const {
			title,
			description,
			coverImageKey,
			categoryid,
			modalidadesid,
			dificultadid,
			creatorId,
			instructor,
			requerimientos,
		} = body;

		console.log(`CreatorID en api route ${creatorId}`);
		const courseId = await createCourse({
			title,
			description,
			creatorId: userId,
			coverImageKey,
			categoryid,
			modalidadesid,
			dificultadid,
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
			dificultadid,
			instructor,
			requerimientos,
		});

		const id = courseId.id;

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
			dificultadid: number;
			instructor: string;
			requerimientos: string;
		};
		const {
			id,
			title,
			description,
			coverImageKey,
			modalidadesid,
			dificultadid,
			categoryid,
			instructor,
			requerimientos,
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
			dificultadid,
			requerimientos,
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
