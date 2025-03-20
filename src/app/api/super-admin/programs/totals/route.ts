import { NextResponse } from 'next/server';

import { getAllPrograms } from '~/models/super-adminModels/programModelsSuperAdmin';
import { getTotalStudents } from '~/models/super-adminModels/studentModelSuperAdmin';

export async function GET() {
	try {
		// Obtener total de cursos
		const programs = await getAllPrograms();
		const totalPrograms = programs.length;

		// Obtener total de estudiantes inscritos en todos los cursos
		const totalStudents = await getTotalStudents();

		return NextResponse.json({ totalPrograms, totalStudents });
	} catch (error) {
		console.error('❌ Error al obtener totales:', error);
		return NextResponse.json(
			{ error: 'Error al obtener totales' },
			{ status: 500 }
		);
	}
}
