import { NextResponse } from 'next/server';

import { type SQL, like, or } from 'drizzle-orm';

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

		const response = await fetch('http://18.117.124.192:5000/root_courses', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json',
			},
			body: JSON.stringify({
				prompt: prompt.toLowerCase().trim(),
			}),
		});

		// Improve error handling for the external API
		let data: ApiResponse;
		try {
			const textResponse = await response.text();
			try {
				data = JSON.parse(textResponse) as ApiResponse;
			} catch (parseError) {
				console.error('API Response Parse Error:', textResponse);
				throw new Error(`Invalid JSON response from API: ${textResponse}`);
			}
		} catch (error) {
			console.error('API Error:', error);
			return NextResponse.json({
				response: `Lo siento, hubo un error al procesar tu búsqueda: "${prompt}". Por favor, intenta de nuevo.`,
			});
		}

		console.log('📦 API Response:', data);

		// Handle empty or invalid results from external API
		if (
			!data?.result ||
			!Array.isArray(data.result) ||
			data.result.length === 0
		) {
			return NextResponse.json({
				response: `No encontré cursos relacionados con "${prompt}". Por favor, intenta con otros términos.`,
				courses: [],
			});
		}

		// Create conditions only for valid titles
		const titleConditions: SQL[] = [
			...new Set(
				data.result
					.filter(
						(item): item is { id: number; title: string } =>
							typeof item?.title === 'string' && item?.title.length > 0
					)
					.map((item) => {
						const searchTerm = item.title.replace(
							/[.*+?^${}()|[\]\\]/g,
							'\\$&'
						);
						return like(courses.title, `%${searchTerm}%`);
					})
			),
		];

		if (titleConditions.length === 0) {
			return NextResponse.json({
				response: `No se encontraron términos de búsqueda válidos para "${prompt}".`,
				courses: [],
			});
		}

		// Find matching courses and remove duplicates
		const foundCourses = await db
			.select({
				id: courses.id,
				title: courses.title,
			})
			.from(courses)
			.where(or(...titleConditions))
			.orderBy(courses.createdAt)
			.limit(5);

		const uniqueCourses = Array.from(
			new Map(foundCourses.map((course) => [course.id, course])).values()
		);

		// Only return not found message if no courses were found
		if (!uniqueCourses.length) {
			return NextResponse.json({
				response: `No encontré cursos relacionados con "${prompt}". Por favor, intenta con otros términos.`,
				courses: [],
			});
		}

		// Format successful response - Remove the initial message when courses are found
		const formattedResponse = `He encontrado estos cursos relacionados con "${prompt}":\n\n${uniqueCourses
			.map(
				(course, idx) =>
					`${idx + 1}. ${course.title ?? 'Sin título'}|${course.id}`
			)
			.join('\n\n')}`;

		return NextResponse.json({
			response: formattedResponse,
			courses: uniqueCourses,
		});
	} catch (error) {
		console.error(
			'Search Error:',
			error instanceof Error ? error.message : 'Unknown error'
		);
		return NextResponse.json(
			{
				response:
					'Error al buscar cursos. Por favor, intenta de nuevo en unos momentos.',
			},
			{ status: 500 }
		);
	}
}
