import { type NextRequest, NextResponse } from 'next/server';

import { db } from '~/server/db';
import { materias } from '~/server/db/schema';

export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url);
		const programId = searchParams.get('programId');

		let filteredMaterias;

		if (programId) {
			// Si se envía un programId, traer todas las materias asignadas a ese programa o sin asignar
			filteredMaterias = await db.select().from(materias);
		} else {
			// Si no hay programId, traer todas las materias (incluso asignadas a cursos o programas)
			filteredMaterias = await db.select().from(materias);
		}

		return NextResponse.json(filteredMaterias);
	} catch (error) {
		console.error('Error al obtener materias:', error);
		return NextResponse.json(
			{ error: 'Error al obtener materias' },
			{ status: 500 }
		);
	}
}
