import { NextResponse } from 'next/server';

import { createCourse } from '~/server/actions/courses/createCourse'; // Corregir la importación

export async function POST(request: Request) {
	try {
		const data = await request.json();
		const newCourse = await createCourse(data);
		return NextResponse.json(newCourse);
	} catch (error) {
		console.error(
			'Error al crear el curso:',
			error instanceof Error ? error.message : 'Error desconocido'
		);
		return NextResponse.json(
			{ error: 'Error al crear el curso' },
			{ status: 500 }
		);
	}
}
