import { NextResponse } from 'next/server';

import { getMateriasByCourseId } from '~/models/educatorsModels/courseModelsEducator';

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

		// Aquí se obtienen las materias asociadas al curso usando la función importada
		const materias = await getMateriasByCourseId(courseId);
		if (materias.length === 0) {
			return NextResponse.json(
				{ error: 'No se encontraron materias para este curso' },
				{ status: 404 }
			);
		}

		// Devuelve las materias encontradas
		return NextResponse.json(materias);
	} catch (error) {
		console.error('Error al obtener las matemateriasonerias:', error);
		return NextResponse.json(
			{ error: 'Error al obtener las materias' },
			{ status: 500 }
		);
	}
}
