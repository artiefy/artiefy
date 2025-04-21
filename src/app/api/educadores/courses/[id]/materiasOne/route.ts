import { NextResponse } from 'next/server';

import { getMateriasByCourseId } from '~/server/actions/educadores/getMateriasByCourseId';

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

		// Obtener las materias asociadas al curso
		const materias = await getMateriasByCourseId(courseId.toString());

		if (!materias || materias.length === 0) {
			// Return a 404 response if no materias are found
			return NextResponse.json(
				{ error: 'No se encontraron materias para este curso' },
				{ status: 404 }
			);
		}

		// Devuelve las materias encontradas
		return NextResponse.json(materias);
	} catch (error) {
		console.error('Error al obtener las materias:', error);
		return NextResponse.json(
			{ error: 'Error al obtener las materias' },
			{ status: 500 }
		);
	}
}
