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

export const dynamic = 'force-dynamic';

const respondWithError = (message: string, status: number) =>
	NextResponse.json({ error: message }, { status });

interface ApiError {
	message: string;
	code?: string;
}

function isApiError(error: unknown): error is ApiError {
	return (
		typeof error === 'object' &&
		error !== null &&
		'message' in error &&
		typeof (error as ApiError).message === 'string'
	);
}

// Función para verificar si el usuario es nuevo y agregarlo a la tabla users
async function ensureUserExists(userId: string) {
	const user = await getUserById(userId);
	if (!user) {
		const clerkUser = await currentUser();
		if (clerkUser) {
			await createUser(
				userId,
				'educador',
				`${clerkUser.firstName ?? ''} ${clerkUser.lastName ?? ''}`.trim(),
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
	const fetchSubjects = searchParams.get('fetchSubjects');

	console.log('GET Request Parameters:', { courseId, userId, fetchSubjects });

	try {
		if (fetchSubjects) {
			const subjects = await getSubjects();
			console.log('Subjects:', subjects);
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
			console.log('Courses for userId:', userId, courses);
		} else {
			courses = await getAllCourses();
			console.log('All courses:', courses);
		}
		return NextResponse.json(courses);
	} catch (error) {
		const errorMessage = isApiError(error)
			? error.message
			: 'Unknown error occurred';
		return NextResponse.json(
			{ error: `Error al obtener los datos: ${errorMessage}` },
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

		await ensureUserExists(userId);

		const body = (await request.json()) as {
			title: string;
			description: string;
			coverImageKey?: string;
			categoryid: number;
			modalidadesid: number;
			nivelid: number;
			instructorId?: string;
		};

		const {
			title,
			description,
			coverImageKey = '',
			categoryid,
			modalidadesid,
			nivelid,
			instructorId = userId, // Default to current user if not provided
		} = body;

		console.log('Creating course with data:', {
			title,
			description,
			coverImageKey,
			categoryid,
			modalidadesid,
			nivelid,
			instructor: instructorId, // Log to verify instructor ID
			creatorId: userId,
		});

		const course = await createCourse({
			title,
			description,
			creatorId: userId,
			coverImageKey,
			categoryid,
			modalidadesid,
			nivelid,
			instructor: instructorId, // Make sure to pass instructor ID
		});

		return NextResponse.json({ message: 'Curso creado exitosamente', course });
	} catch (error) {
		console.error('Error creating course:', error);
		return respondWithError(
			`Error al crear el curso: ${
				error instanceof Error ? error.message : 'Unknown error'
			}`,
			500
		);
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
			instructorId: string; // Changed from instructor to instructorId
			subjects?: { id: number }[];
		};

		const {
			id,
			title,
			description,
			coverImageKey,
			modalidadesid,
			nivelid,
			categoryid,
			instructorId, // Updated from instructor
			subjects = [],
		} = body;

		const course = await getCourseById(id);
		if (!course) {
			return respondWithError('Curso no encontrado', 404);
		}

		// Update course main data
		await updateCourse(id, {
			title,
			description,
			coverImageKey,
			categoryid,
			modalidadesid,
			instructor: instructorId, // Map instructorId to instructor
			nivelid,
		});

		// Manejar las materias
		if (subjects.length > 0) {
			// Log inicial de todas las materias antes de los cambios
			const materiasAntes = await db.select().from(materias);
			console.log('📊 Estado inicial de materias:', materiasAntes);

			for (const subject of subjects) {
				// Obtener la materia actual
				const existingMateria = await db
					.select()
					.from(materias)
					.where(eq(materias.id, subject.id))
					.then((res) => res[0]);

				if (existingMateria) {
					console.log('🔍 Procesando materia:', {
						id: existingMateria.id,
						title: existingMateria.title,
						courseid: existingMateria.courseid,
						programaId: existingMateria.programaId,
					});

					if (existingMateria.courseid) {
						// Si ya tiene curso asignado, crear una nueva materia
						const newMateria = await db
							.insert(materias)
							.values({
								title: existingMateria.title,
								description: existingMateria.description,
								programaId: existingMateria.programaId,
								courseid: id,
							})
							.returning();

						console.log('✨ Nueva materia creada:', {
							original: {
								id: existingMateria.id,
								title: existingMateria.title,
								courseid: existingMateria.courseid,
								programaId: existingMateria.programaId,
							},
							nueva: newMateria[0],
						});
					} else {
						// Si no tiene curso asignado, actualizar la materia existente
						const updatedMateria = await db
							.update(materias)
							.set({ courseid: id })
							.where(eq(materias.id, subject.id))
							.returning();

						console.log('📝 Materia actualizada:', {
							antes: {
								id: existingMateria.id,
								title: existingMateria.title,
								courseid: existingMateria.courseid,
								programaId: existingMateria.programaId,
							},
							despues: updatedMateria[0],
						});
					}
				}
			}

			// Log final de todas las materias después de los cambios
			const materiasDespues = await db.select().from(materias);
			console.log('🏁 Estado final de materias:', materiasDespues);

			// Encontrar las nuevas materias
			const nuevasMaterias = materiasDespues.filter(
				(materiaFinal) =>
					!materiasAntes.some(
						(materiaInicial) => materiaInicial.id === materiaFinal.id
					)
			);

			if (nuevasMaterias.length > 0) {
				console.log('🎯 Materias nuevas creadas:', nuevasMaterias);
			}
		}

		return NextResponse.json({
			message: 'Curso actualizado exitosamente',
			id:
				course && 'id' in course && typeof course.id === 'number'
					? course.id
					: id,
		});
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
