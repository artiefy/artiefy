import { NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';
import { eq, and, ne as neq } from 'drizzle-orm';

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
	coverVideoCourseKey?: string;
	categoryid?: number;
	modalidadesid?: number;
	nivelid?: number;
	instructorId?: string; // Changed from instructor to instructorId
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
		// Validar autenticación del usuario
		const { userId } = await auth();
		if (!userId) {
			console.warn('⚠️ Usuario no autenticado.');
			return NextResponse.json(
				{ error: 'No autorizado. Por favor, inicie sesión.' },
				{ status: 403 }
			);
		}

		const resolvedParams = await params;
		const courseId = parseInt(resolvedParams.id);

		if (isNaN(courseId)) {
			console.warn('⚠️ ID de curso inválido.');
			return NextResponse.json(
				{ error: 'ID de curso inválido' },
				{ status: 400 }
			);
		}

		const data = (await request.json()) as PutRequestBody;
		console.log('📦 Datos recibidos en el request PUT:');
		console.log(JSON.stringify(data, null, 2));
		// Create update data object with type checking
		const updateData = {
			title: data.title,
			description: data.description,
			coverImageKey: data.coverImageKey,
			coverVideoCourseKey: data.coverVideoCourseKey,
			categoryid: data.categoryid ? Number(data.categoryid) : undefined,
			modalidadesid: data.modalidadesid
				? Number(data.modalidadesid)
				: undefined,
			nivelid: data.nivelid ? Number(data.nivelid) : undefined,
			instructor: data.instructorId, // Changed to match schema's instructor field
			rating: data.rating ? Number(data.rating) : undefined,
			courseTypeId: data.courseTypeId !== null ? data.courseTypeId : undefined,
			isActive: typeof data.isActive === 'boolean' ? data.isActive : undefined,
		};

		// Update course
		await updateCourse(courseId, updateData);
		// Handle subjects if present
		if (data.subjects && data.subjects.length > 0) {
			// Obtener materias actuales del curso
			const currentMaterias = await db
				.select()
				.from(materias)
				.where(eq(materias.courseid, courseId))
				.catch((err) => {
					console.error('❌ Error al obtener materias actuales:', err);
					throw new Error('Error al obtener materias actuales');
				});

			// Nueva validación: Si el curso no tiene programa y la materia no tiene ni curso ni programa
			for (const subject of data.subjects) {
				try {
					const materiaOriginal = await db
						.select()
						.from(materias)
						.where(eq(materias.id, subject.id))
						.limit(1)
						.then((res) => res[0])
						.catch((err) => {
							console.error(
								`❌ Error al obtener la materia con ID ${subject.id}:`,
								err
							);
							throw new Error(
								`Error al obtener la materia con ID ${subject.id}`
							);
						});

					if (
						(!currentMaterias.length ||
							currentMaterias[0]?.programaId === undefined) &&
						!materiaOriginal?.programaId &&
						!materiaOriginal?.courseid
					) {
						console.log(
							`⚠️ Materia con ID ${subject.id} y curso ${courseId} no tienen programa ni curso asignado.`
						);

						await db
							.insert(materias)
							.values({
								title: materiaOriginal?.title ?? 'Título predeterminado',
								description:
									materiaOriginal?.description ?? 'Descripción predeterminada',
								courseid: courseId,
							})
							.catch((err) => {
								console.error(
									`❌ Error al insertar la materia con ID ${subject.id}:`,
									err
								);
								throw new Error(
									`Error al insertar la materia con ID ${subject.id}`
								);
							});

						console.log(
							`✨ Materia con ID ${subject.id} asignada al curso ${courseId} con programaId 9999999.`
						);
						continue;
					}
				} catch (err) {
					console.error(
						`❌ Error al procesar la materia con ID ${subject.id}:`,
						err
					);
				}
			}

			const programId = currentMaterias[0]?.programaId;
			if (programId !== null && programId !== undefined) {
				for (const subject of data.subjects) {
					const existingMateria = currentMaterias.find(
						(m) => m.id === subject.id
					);

					if (!existingMateria) {
						const materiaOriginal = await db
							.select()
							.from(materias)
							.where(eq(materias.id, subject.id))
							.limit(1)
							.then((res) => res[0])
							.catch((err) => {
								console.error(
									`❌ Error al obtener la materia con ID ${subject.id}:`,
									err
								);
								throw new Error(
									`Error al obtener la materia con ID ${subject.id}`
								);
							});

						if (materiaOriginal) {
							await db
								.insert(materias)
								.values({
									title: materiaOriginal.title,
									description: materiaOriginal.description,
									programaId: programId,
									courseid: courseId,
								})
								.catch((err) => {
									console.error(
										`❌ Error al insertar la materia con ID ${subject.id}:`,
										err
									);
									throw new Error(
										`Error al insertar la materia con ID ${subject.id}`
									);
								});

							console.log(
								`✨ Nueva materia creada para el curso ${courseId}:`,
								subject.id
							);

							const conditions = [eq(materias.title, materiaOriginal.title)];

							if (materiaOriginal.programaId) {
								conditions.push(
									neq(materias.programaId, materiaOriginal.programaId)
								);
							}

							const materiasIguales = await db
								.select()
								.from(materias)
								.where(and(...conditions));

							for (const materia of materiasIguales) {
								if (!materia.courseid) {
									await db
										.update(materias)
										.set({ courseid: courseId })
										.where(eq(materias.id, materia.id))
										.catch((err) => {
											console.error(
												`❌ Error al actualizar la materia con ID ${materia.id}:`,
												err
											);
											throw new Error(
												`Error al actualizar la materia con ID ${materia.id}`
											);
										});

									console.log(
										`🔄 Materia con ID ${materia.id} actualizada con curso ${courseId}`
									);
								} else {
									await db
										.insert(materias)
										.values({
											title: materia.title,
											description: materia.description,
											programaId: materia.programaId,
											courseid: courseId,
										})
										.catch((err) => {
											console.error(
												`❌ Error al duplicar la materia con ID ${materia.id}:`,
												err
											);
											throw new Error(
												`Error al duplicar la materia con ID ${materia.id}`
											);
										});

									console.log(
										`📚 Materia duplicada para programa ${materia.programaId} con nuevo curso ${courseId}`
									);
								}
							}
						}
					}
				}
			}
		}

		const refreshedCourse = await getCourseById(courseId);
		return NextResponse.json({
			message: 'Curso actualizado exitosamente',
			course: refreshedCourse,
		});
	} catch (error) {
		console.error('❌ Error detallado:', error);
		return NextResponse.json(
			{
				error: 'Error al actualizar el curso',
				details: error instanceof Error ? error.message : 'Error desconocido',
			},
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
	instructorId: string;
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

		// Validar los datos recibidos
		if (
			!data.title ||
			!data.description ||
			!data.modalidadesid ||
			data.modalidadesid.length === 0
		) {
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
				instructor: data.instructorId, // Use consistent property name
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
