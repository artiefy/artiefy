import { NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';

import {
	getAllCourses,
	createCourse,
	deleteCourse,
	getCourseById,
	updateCourse,
	getModalidadById,
} from '~/models/educatorsModels/courseModelsEducator';

export async function GET(
	request: Request,
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
		// Autenticación con Clerk
		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
		}

		// Obtener el parámetro ID desde la URL
		const resolvedParams = await params;
		const courseId = parseInt(resolvedParams.id);
		if (isNaN(courseId)) {
			return NextResponse.json(
				{ error: 'ID de curso inválido' },
				{ status: 400 }
			);
		}

		// Obtener los datos enviados en el body
		const data = (await request.json()) as {
			title?: string;
			description?: string;
			coverImageKey?: string;
			categoryid?: number;
			instructor?: string;
			modalidadesid?: number;
			nivelid?: number;
			fileName?: string;
			rating?: number;
			courseTypeId?: number | null; // ✅ Incluido el courseTypeId
			isActive?: boolean;
		};

		// Crear el objeto updateData solo con los campos que llegaron
		const updateData: {
			title?: string;
			description?: string;
			coverImageKey?: string;
			categoryid?: number;
			instructor?: string;
			modalidadesid?: number;
			nivelid?: number;
			fileName?: string;
			rating?: number;
			courseTypeId?: number | null;
			isActive?: boolean;
		} = {};

		if (data.isActive !== undefined) updateData.isActive = data.isActive;


		// Asignar los valores si vienen definidos
		if (data.title !== undefined) updateData.title = data.title;
		if (data.description !== undefined) updateData.description = data.description;
		if (data.coverImageKey !== undefined) updateData.coverImageKey = data.coverImageKey;
		if (data.categoryid !== undefined) updateData.categoryid = data.categoryid;
		if (data.instructor !== undefined) updateData.instructor = data.instructor;
		if (data.modalidadesid !== undefined) updateData.modalidadesid = data.modalidadesid;
		if (data.nivelid !== undefined) updateData.nivelid = data.nivelid;
		if (data.fileName !== undefined) updateData.fileName = data.fileName;
		if (data.rating !== undefined) updateData.rating = data.rating;
		if (data.courseTypeId !== undefined) updateData.courseTypeId = data.courseTypeId;

		// Actualizar el curso en la base de datos
		await updateCourse(courseId, updateData);

		// Obtener y retornar el curso actualizado
		const updatedCourse = await getCourseById(courseId);
		return NextResponse.json(updatedCourse);
	} catch (error) {
		console.error('Error al actualizar el curso:', error);
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
			isActive?: boolean;  // ✅ Opcional
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
