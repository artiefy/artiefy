import { NextResponse } from 'next/server';
import { db } from '~/server/db';
import { courseTypes } from '~/server/db/schema';

export async function GET() {
	try {
		const types = await db.select().from(courseTypes);
		return NextResponse.json(types);
	} catch (error) {
		console.error('Error fetching course types:', error);
		return NextResponse.json(
			{ error: 'Error al obtener los tipos de curso' },
			{ status: 500 }
		);
	}
}
