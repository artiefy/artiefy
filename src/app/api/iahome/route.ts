import { NextResponse } from 'next/server';

import { type SQL, like, or } from 'drizzle-orm';

import { db } from '~/server/db';
import { courses } from '~/server/db/schema';

interface RequestBody {
	prompt: string;
}

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
	try {
		const body = (await request.json()) as RequestBody;
		const { prompt } = body;

		console.log('🔍 Searching for:', prompt);

		const searchTerms = prompt.toLowerCase().trim().split(/\s+/);

		const conditions: SQL[] = searchTerms.map((term) =>
			like(courses.title, `%${term}%`)
		);

		const foundCourses = await db
			.select({
				id: courses.id,
				title: courses.title,
			})
			.from(courses)
			.where(or(...conditions))
			.limit(5);

		if (!foundCourses.length) {
			return NextResponse.json({
				response: `No encontré cursos relacionados con "${prompt}". Por favor, intenta con otros términos.`,
				courses: [],
			} as const);
		}

		const formattedResponse = `He encontrado estos cursos relacionados con "${prompt}":\n\n${foundCourses
			.map(
				(course, idx) =>
					`${idx + 1}. ${course.title ?? 'Sin título'}|${course.id}`
			)
			.join('\n\n')}`;

		return NextResponse.json({
			response: formattedResponse,
			courses: foundCourses,
		} as const);
	} catch (error) {
		console.error(
			'Search Error:',
			error instanceof Error ? error.message : 'Unknown error'
		);
		return NextResponse.json(
			{
				response:
					'Error al buscar cursos. Por favor, intenta de nuevo en unos momentos.',
				courses: [],
			} as const,
			{ status: 500 }
		);
	}
}
