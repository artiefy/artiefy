import { NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';

import {
	getAllCourses,
	createCourse,
	deleteCourse,
	getCourseById,
	updateCourse,
	getModalidadById,
} from '~/models/educatorsModels/courseModelsEducator';
import { db } from '~/server/db';
import { materias } from '~/server/db/schema';


// Agregamos una interfaz para el cuerpo de la solicitud PUT
interface PutRequestBody {
	title?: string;
	description?: string;
	coverImageKey?: string;
	categoryid?: number;
	modalidadesid?: number;
	nivelid?: number;
	instructor?: string;
	rating?: number;
	courseTypeId?: number | null;
	isActive?: boolean;
	subjects?: { id: number }[];
}

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const resolvedParams = await params;
		const courseId = parseInt(resolvedParams.id);
		if (isNaN(courseId)) {
			return NextResponse.json(
				{ error: 'ID de curso inválido' },
				{ status: 400 }
			);
		}

		const course = await getCourseById(courseId);
		if (!course) {
			return NextResponse.json(
				{ error: 'Curso no encontrado' },
				{ status: 404 }
			);
		}

		// Return course directly without modifying the instructor name
		return NextResponse.json(course);
	} catch (error) {
		console.error('Error al obtener el curso:', error);
		return NextResponse.json(
			{ error: 'Error al obtener el curso' },
			{ status: 500 }
		);
	}
}

export async function PUT(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
		}

		const resolvedParams = await params;
		const courseId = parseInt(resolvedParams.id);
		console.log('🔵 CourseId:', courseId);

		const data = (await request.json()) as PutRequestBody;
		console.log('📥 Datos recibidos completos:', data);

		// 1. Actualizar datos básicos del curso
		const { subjects, ...courseData } = data;
		await updateCourse(courseId, courseData);
		console.log('✅ Datos del curso actualizados');

		// 2. Manejar materias si existen
		if (subjects && subjects.length > 0) {
			console.log('📚 Procesando materias:', subjects);

			// Obtener materias actuales del curso
			const currentMaterias = await db
				.select()
				.from(materias)
				.where(eq(materias.courseid, courseId));

			console.log('📋 Materias actuales:', currentMaterias);
			const programId = currentMaterias[0]?.programaId;

			if (programId !== null && programId !== undefined) {
				// Procesar cada materia nueva
				for (const subject of subjects) {
					// Verificar si la materia ya está asignada
					const existingMateria = currentMaterias.find(
						(m) => m.id === subject.id
					);

					if (!existingMateria) {
						// Obtener la materia original
						const materiaOriginal = await db
							.select()
							.from(materias)
							.where(eq(materias.id, subject.id))
							.limit(1)
							.then((res) => res[0]);

						if (materiaOriginal) {
							// Crear copia de la materia
							const newMateria = await db
								.insert(materias)
								.values({
									title: materiaOriginal.title,
									description: materiaOriginal.description,
									programaId: programId,
									courseid: courseId,
								})
								.returning();
							console.log('✨ Nueva materia creada:', newMateria[0]);
						}
					}
				}
			}
		}

		const updatedCourse = await getCourseById(courseId);
		return NextResponse.json({
			message: 'Curso y materias actualizados exitosamente',
			course: updatedCourse,
		});
	} catch (error) {
		console.error('❌ Error:', error);
		return NextResponse.json(
			{ error: 'Error al actualizar el curso' },
			{ status: 500 }
		);
	}
}

export async function GET_ALL() {
	try {
		const courses = await getAllCourses();
		return NextResponse.json(courses, { status: 200 });
	} catch (error) {
		console.error('Error al obtener los cursos:', error);
		return NextResponse.json(
			{ error: 'Error al obtener los cursos' },
			{ status: 500 }
		);
	}
}

interface CourseData {
	title: string;
	description: string;
	coverImageKey: string;
	categoryid: number;
	modalidadesid: number;
	nivelid: number;
	instructor: string;
	creatorId: string;
	rating: number;
}

export async function POST(request: Request) {
	try {
		const { userId } = await auth();
		if (!userId) {
			console.log('Usuario no autorizado');
			return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
		}

		// Parsear los datos del cuerpo de la solicitud

		const data = (await request.json()) as CourseData & {
			modalidadesid: number[];
			courseTypeId: number; // ✅ Agrega esto
			isActive?: boolean; // ✅ Opcional
		};

		console.log('Datos recibidos:', data);

		// Validar los datos recibidos
		if (
			!data.title ||
			!data.description ||
			!data.modalidadesid ||
			data.modalidadesid.length === 0
		) {
			console.log('Datos inválidos:', data);
			return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
		}

		const createdCourses = [];

		// Iterar sobre cada modalidadId y crear un curso
		for (const modalidadId of data.modalidadesid) {
			console.log(`Procesando modalidadId: ${modalidadId}`);

			// Obtener la modalidad por ID
			const modalidad = await getModalidadById(modalidadId);
			console.log(
				`Modalidad obtenida para modalidadId ${modalidadId}:`,
				modalidad
			);

			// Concatenar el nombre de la modalidad al título
			const newTitle = modalidad
				? `${data.title} - ${modalidad.name}`
				: data.title;
			console.log(
				`Título modificado para modalidadId ${modalidadId}: ${newTitle}`
			);

			// Crear el curso con el título modificado
			const newCourse = await createCourse({
				...data,
				title: newTitle, // Usar el título modificado
				modalidadesid: modalidadId, // Asignar el ID de la modalidad actual
			});
			console.log(`Curso creado para modalidadId ${modalidadId}:`, newCourse);

			// Agregar el curso creado a la lista
			createdCourses.push(newCourse);
		}

		console.log('Cursos creados:', createdCourses);

		// Devolver todos los cursos creados
		return NextResponse.json(createdCourses, { status: 201 });
	} catch (error) {
		console.error('Error al crear el curso:', error);
		return NextResponse.json(
			{ error: 'Error al crear el curso' },
			{ status: 500 }
		);
	}
}

interface DeleteCourseRequest {
	id: string;
}

export async function DELETE(request: Request) {
	try {
		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
		}

		// Verifica si hay cuerpo en la solicitud
		if (request.body === undefined || request.body === null) {
			return NextResponse.json({ error: 'Cuerpo vacío' }, { status: 400 });
		}

		// Convertimos el JSON recibido al tipo correcto
		let data: DeleteCourseRequest;
		try {
			data = (await request.json()) as DeleteCourseRequest;
		} catch {
			return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
		}

		// Validamos que el ID sea un string válido
		if (!data.id || typeof data.id !== 'string') {
			return NextResponse.json(
				{ error: 'ID de curso inválido' },
				{ status: 400 }
			);
		}

		const courseId = parseInt(data.id);
		if (isNaN(courseId)) {
			return NextResponse.json(
				{ error: 'ID de curso inválido' },
				{ status: 400 }
			);
		}

		await deleteCourse(courseId);
		return NextResponse.json(
			{ message: 'Curso eliminado correctamente' },
			{ status: 200 }
		);
	} catch (error) {
		console.error('Error al eliminar el curso:', error);
		return NextResponse.json(
			{ error: 'Error al eliminar el curso' },
			{ status: 500 }
		);
	}
}
