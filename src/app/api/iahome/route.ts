import { NextResponse } from 'next/server';

import { like } from 'drizzle-orm';

import { db } from '~/server/db';
import { courses } from '~/server/db/schema';

interface RequestBody {
	prompt: string;
}

interface ApiResponse {
	result: string[];
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

		if (!response.ok) {
			console.error('API Error:', response.status, await response.text());
			throw new Error(`API responded with status: ${response.status}`);
		}

		const data = (await response.json()) as ApiResponse;
		console.log('📦 API Response:', data);

		if (!data?.result?.length) {
			return NextResponse.json({
				response: `No encontré cursos relacionados con "${prompt}". Por favor, intenta con otros términos.`,
			});
		}

		// Create separate SQL conditions for each title
		const titleConditions = data.result.map((title) => {
			// Escape special characters and handle case-insensitive search
			const searchTerm = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
			return like(courses.title, `%${searchTerm}%`);
		});

		// Find matching courses with combined conditions
		const foundCourses = await db
			.select({
				id: courses.id,
				title: courses.title,
			})
			.from(courses)
			.where(titleConditions.reduce((acc, curr) => acc || curr))
			.orderBy(courses.createdAt)
			.limit(5);

		if (!foundCourses.length) {
			return NextResponse.json({
				response: `No encontré cursos relacionados con "${prompt}". Por favor, intenta con otros términos.`,
			});
		}

		// Format response with line breaks to ensure proper parsing
		const formattedResponse = `He encontrado estos cursos relacionados con "${prompt}":\n\n${foundCourses
			.map((course, idx) => `${idx + 1}. ${course.title}|${course.id}`)
			.join('\n\n')}`;

		return NextResponse.json({
			response: formattedResponse,
			courses: foundCourses,
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