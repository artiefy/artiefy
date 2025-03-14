import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import {
	getAllCourses,
	createCourse,
	deleteCourse,
	getCourseById,
	updateCourse,
} from '~/models/educatorsModels/courseModelsEducators';

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
		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
		}
		const resolvedParams = await params;
		const courseId = parseInt(resolvedParams.id);

		if (isNaN(courseId)) {
			return NextResponse.json(
				{ error: 'ID de curso inválido' },
				{ status: 400 }
			);
		}

		const data = (await request.json()) as {
			title?: string;
			description?: string;
			coverImageKey?: string;
			categoryId?: number;
			instructor?: string;
			modalidadesid?: number;
			nivelid?: number;
		};

		const updateData: {
			title?: string;
			description?: string;
			coverImageKey?: string;
			categoryid?: number;
			instructor?: string;
			modalidadesid?: number;
			nivelid?: number;
		} = {};

		if (data.title !== undefined) updateData.title = data.title;
		if (data.description !== undefined)
			updateData.description = data.description;
		if (data.coverImageKey !== undefined)
			updateData.coverImageKey = data.coverImageKey;
		if (data.categoryId !== undefined) updateData.categoryid = data.categoryId;
		if (data.instructor !== undefined) updateData.instructor = data.instructor;
		if (data.modalidadesid !== undefined)
			updateData.modalidadesid = data.modalidadesid;
		if (data.nivelid !== undefined) updateData.nivelid = data.nivelid;

		await updateCourse(courseId, updateData);

		// Obtener el curso actualizado
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
			return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
		}

		const data = (await request.json()) as CourseData;

		// Opcional: Validar que los datos tienen la forma esperada
		if (!data.title || !data.description) {
			return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
		}

		const newCourse = await createCourse(data);
		return NextResponse.json(newCourse, { status: 201 });
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
