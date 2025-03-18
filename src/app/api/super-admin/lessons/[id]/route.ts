import { NextResponse, type NextRequest } from 'next/server';

import {
	getLessonById,
	updateLesson,
} from '~/models/educatorsModels/lessonsModels';

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const resolvedParams = await params;
		console.log('Parámetros resueltos:', resolvedParams); // Log para ver los parámetros obtenidos

		const lessonId = parseInt(resolvedParams.id);
		console.log('ID convertido:', lessonId); // Log para verificar la conversión del ID

		if (isNaN(lessonId)) {
			console.log('ID proporcionado no es un número:', resolvedParams.id); // Log cuando el ID no es válido
			return NextResponse.json(
				{ error: 'ID de curso inválido' },
				{ status: 400 }
			);
		}

		const lesson = await getLessonById(lessonId);
		if (!lesson) {
			console.log('No se encontró lección para el ID:', lessonId); // Log cuando no se encuentra la lección
			return NextResponse.json(
				{ error: 'Curso no encontrado' },
				{ status: 404 }
			);
		}

		console.log('Lección encontrada:', lesson); // Log para confirmar que se encontró la lección
		return NextResponse.json(lesson);
	} catch (error) {
		console.error('Error al obtener el curso:', error);
		return NextResponse.json(
			{ error: 'Error al obtener el curso' },
			{ status: 500 }
		);
	}
}
