import { NextResponse } from 'next/server';

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

		// Verify we have results
		if (
			!data?.result ||
			!Array.isArray(data.result) ||
			data.result.length === 0
		) {
			return NextResponse.json({
				response: `No encontré cursos relacionados con "${prompt}". Por favor, intenta con otros términos.`,
			});
		}

		// Format the courses into a response
		const formattedResponse = `He encontrado estos cursos relacionados con "${prompt}":\n\n${data.result
			.slice(0, 5)
			.map((title, index) => `${index + 1}. ${title}`)
			.join('\n\n')}`;

		return NextResponse.json({ response: formattedResponse });
	} catch (error) {
		console.error('Search Error:', error);
		return NextResponse.json(
			{
				response:
					'Error al buscar cursos. Por favor, intenta de nuevo en unos momentos.',
			},
			{ status: 500 }
		);
	}
}
