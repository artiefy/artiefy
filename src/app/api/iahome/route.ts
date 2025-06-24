import { NextResponse } from 'next/server';

import { like, or,type SQL } from 'drizzle-orm';

import { db } from '~/server/db';
import { courses } from '~/server/db/schema';

interface RequestBody {
	prompt: string;
}

interface ApiResponse {
	result: { id: number; title: string }[];
}

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
	try {
		const body = (await request.json()) as RequestBody;
		const { prompt } = body;

		console.log('🔍 Searching for:', prompt);

		// 1. Obtener sugerencias de títulos de la API externa
		const response = await fetch('http://18.117.124.192:5000/root_courses', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				prompt: prompt.toLowerCase().trim(),
			}),
		});

		const data = (await response.json()) as ApiResponse;

		if (
			!data?.result ||
			!Array.isArray(data.result) ||
			data.result.length === 0
		) {
			return NextResponse.json({
				response: `No encontré cursos relacionados con "${prompt}". Por favor, intenta buscar con otros términos.`,
				courses: [],
			});
		}

		// 2. Buscar cursos en la base de datos local usando los títulos sugeridos
		const titleConditions: SQL[] = data.result.map((course) =>
			like(courses.title, `%${course.title}%`)
		);

		const localCourses = await db
			.select({
				id: courses.id,
				title: courses.title,
			})
			.from(courses)
			.where(or(...titleConditions))
			.limit(5);

		if (!localCourses.length) {
			return NextResponse.json({
				response: `No encontré cursos relacionados con "${prompt}" en nuestra plataforma. Por favor, intenta con otros términos.`,
				courses: [],
			});
		}

		// 3. Formatear respuesta con los IDs locales
		const formattedResponse = `He encontrado estos cursos que podrían interesarte:\n\n${localCourses
			.map((course, idx) => `${idx + 1}. ${course.title}|${course.id}`)
			.join('\n\n')}`;

		return NextResponse.json({
			response: formattedResponse,
			courses: localCourses,
		});
	} catch (error) {
		console.error('Search Error:', error);
		return NextResponse.json(
			{
				response:
					'Lo siento, hubo un problema al procesar tu búsqueda. Por favor, intenta de nuevo.',
				courses: [],
			},
			{ status: 500 }
		);
	}
}
