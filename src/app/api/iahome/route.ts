import { NextResponse } from 'next/server';

interface RequestBody {
	prompt: string;
}

// Actualizar para coincidir con la respuesta real de la API
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
				min_results: 5,
			}),
		});

		if (!response.ok) {
			throw new Error(`API responded with status: ${response.status}`);
		}

		const data = (await response.json()) as ApiResponse;
		console.log('📦 API Response:', data);

		if (
			!data?.result ||
			!Array.isArray(data.result) ||
			data.result.length === 0
		) {
			return NextResponse.json({
				response: `No encontré cursos relacionados con "${prompt}". Por favor, intenta con otros términos.`,
			});
		}

		// Simular IDs para los cursos ya que la API solo devuelve títulos
		const coursesWithIds = data.result.map((title, index) => ({
			id: index + 1001, // Usar IDs que empiecen desde 1001 para evitar conflictos
			title: title,
		}));

		// Formatear la respuesta para el chatbot
		const formattedResponse = `He encontrado estos cursos relacionados con "${prompt}":\n\n${coursesWithIds
			.map((course, idx) => `${idx + 1}. ${course.title}|${course.id}`)
			.join('\n\n')}`;

		return NextResponse.json({
			response: formattedResponse,
			courses: coursesWithIds,
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
