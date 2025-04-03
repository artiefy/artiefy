import { NextResponse } from 'next/server';

interface APIResponse {
	result: string[];
}

interface RequestBody {
	prompt: string;
}

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
	try {
		const body = (await request.json()) as RequestBody;
		const { prompt } = body;

		const response = await fetch('http://18.117.124.192:5000/root_courses', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json',
			},
			body: JSON.stringify({
				prompt: prompt.toLowerCase().trim(),
			}),
			cache: 'no-store',
		});

		if (!response.ok) {
			throw new Error(`API responded with status: ${response.status}`);
		}

		const data = (await response.json()) as APIResponse;

		if (!data?.result?.length) {
			return NextResponse.json({
				response: `No encontré cursos relacionados con "${prompt}". Por favor, intenta con otros términos.`,
			});
		}

		// Limitar y formatear resultados
		const formattedCourses = data.result
			.slice(0, 5)
			.map((course) => course.trim()) // Removed unused index parameter
			.filter(Boolean);

		const responseText = `He encontrado estos cursos relacionados con "${prompt}":\n\n${formattedCourses
			.map((course, index) => `${index + 1}. ${course}`)
			.join('\n\n')}`;

		return NextResponse.json({ response: responseText });
	} catch (error) {
		console.error('Error fetching courses:', error);
		return NextResponse.json({
			response:
				'Error al buscar cursos. Por favor, intenta de nuevo en unos momentos.',
		});
	}
}
