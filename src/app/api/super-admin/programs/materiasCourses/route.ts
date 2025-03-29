import { NextResponse } from 'next/server';

import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { courses, materias } from '~/server/db/schema';

export async function GET(req: Request) {
	try {
		const { searchParams } = new URL(req.url);
		const courseId = searchParams.get('courseId');

		if (!courseId) {
			return NextResponse.json(
				{ error: 'El courseId es obligatorio' },
				{ status: 400 }
			);
		}

		// 1. Primero, obtén una materia asociada al curso para encontrar su programa
		const materiaDelCurso = await db
			.select({
				programaId: materias.programaId,
			})
			.from(materias)
			.where(eq(materias.courseid, parseInt(courseId)))
			.limit(1);

		if (!materiaDelCurso || materiaDelCurso.length === 0) {
			return NextResponse.json(
				{ error: 'No se encontró el programa asociado al curso' },
				{ status: 404 }
			);
		}

		const programId = materiaDelCurso[0].programaId;

		if (!programId) {
			return NextResponse.json(
				{ error: 'La materia no tiene un programa asociado' },
				{ status: 404 }
			);
		}

		// 2. Ahora obtén todas las materias de ese programa
		const materiasDelPrograma = await db
			.select()
			.from(materias)
			.where(eq(materias.programaId, programId));

		return NextResponse.json(materiasDelPrograma);
	} catch (error) {
		console.error('❌ Error fetching subjects:', error);
		const errorMessage =
			error instanceof Error ? error.message : 'Unknown error';
		return NextResponse.json({ error: errorMessage }, { status: 500 });
	}
}
