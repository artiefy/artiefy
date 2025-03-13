import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

interface CourseData {
	title: string;
	description: string;
	coverImageKey: string;
	categoryid: number;
	modalidadesid: number;
	nivelid: number;
	instructor: string;
	creatorId: string;
}

import {
	createCourse,
	deleteCourse,
	getCourseById,
	updateCourse,
} from '~/models/educatorsModels/courseModelsEducator';

export async function GET(
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
	{ params }: { params: { id: string } }
) {
	try {
		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
		}

		const courseId = parseInt(params.id);
		const data = (await request.json()) as {
			title: string;
			description: string;
			coverImageKey: string;
			categoryId: number;
			instructor: string;
			modalidadesid: number;
			nivelid: number;
			requerimientos: string;
		};

		await updateCourse(courseId, {
			title: data.title,
			description: data.description,
			coverImageKey: data.coverImageKey,
			categoryid: data.categoryId,
			instructor: data.instructor,
			modalidadesid: data.modalidadesid,
			nivelid: data.nivelid,
			requerimientos: data.requerimientos,
		});

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

export async function POST(request: Request) {
	try {
		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
		}

		const jsonData = await request.json() as {
			title: string;
			description: string;
			coverImageKey: string;
			categoryid: number;
			modalidadesid: number;
			nivelid: number;
			instructor: string;
			requerimientos: string;
			creatorId: string;
		};

		if (typeof jsonData !== 'object' || jsonData === null) {
		throw new Error('Invalid data received');
		}

		// Validar manualmente que todas las propiedades existen antes de asignarlas
		const data: CourseData = {
		title: String(jsonData.title),
		description: String(jsonData.description),
		coverImageKey: String(jsonData.coverImageKey),
		categoryid: Number(jsonData.categoryid),
		modalidadesid: Number(jsonData.modalidadesid),
		nivelid: Number(jsonData.nivelid),
		instructor: String(jsonData.instructor),
		creatorId: String(jsonData.creatorId),
		};

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

export async function DELETE(request: Request) {
	try {
		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
		}

		const { id }: { id: string } = await request.json() as { id: string };
		const courseId = parseInt(id);

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
